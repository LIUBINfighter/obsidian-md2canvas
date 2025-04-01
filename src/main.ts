import { App, Plugin, Notice, TFile } from 'obsidian';
import { getFileByName } from './core/file-utils';
import { analyzeLinks } from './core/link-analyzer';
import { createCanvasFromLinkMap } from './core/canvas-creator';
import { FileSelectionModal, DepthSelectionModal } from './ui/modals';
import { Md2CanvasSettingTab } from './ui/settings-tab';

interface Md2CanvasSettings {
	autoConvert: boolean;
	defaultDepth: number;
	rootNodeColor: string;
	lastUsedFile?: string;
}

const DEFAULT_MD2CANVAS_SETTINGS: Md2CanvasSettings = {
	autoConvert: false,
	defaultDepth: 1,
	rootNodeColor: '1'
}

export default class Md2Canvas extends Plugin {
	settings: Md2CanvasSettings;

	async onload() {
		await this.loadSettings();

		// 添加更合适的图标，使用canvas相关图标
		const ribbonIconEl = this.addRibbonIcon('diagram-project', '转换当前笔记到Canvas', (evt: MouseEvent) => {
			// 获取当前活动文件并直接转换
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
					// 使用设置中的默认深度
				const depth = this.settings.defaultDepth || 1;
				this.createMdToCanvas(activeFile.path, depth);
			} else {
				new Notice('请先打开一个Markdown文件');
			}
		});
		ribbonIconEl.addClass('md2canvas-ribbon-icon');

		// 添加命令
		// 1. 直接转换当前文件（使用默认深度）
		this.addCommand({
			id: 'convert-current-note-to-canvas',
			name: '转换当前笔记到Canvas',
			checkCallback: (checking) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						const depth = this.settings.defaultDepth || 1;
						this.createMdToCanvas(activeFile.path, depth);
					}
					return true;
				}
				return false;
			}
		});

		// 2. 打开高级设置对话框
		this.addCommand({
			id: 'open-md2canvas-modal',
			name: '高级设置 - 选择笔记和深度',
			callback: () => {
				new FileSelectionModal(this.app, this).open();
			}
		});

		// 3. 自定义深度转换当前笔记
		this.addCommand({
			id: 'convert-current-note-custom-depth',
			name: '自定义深度转换当前笔记',
			checkCallback: (checking) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						new DepthSelectionModal(this.app, (depth) => {
							this.createMdToCanvas(activeFile.path, depth);
						}).open();
					}
					return true;
				}
				return false;
			}
		});

		// 添加设置选项卡
		this.addSettingTab(new Md2CanvasSettingTab(this.app, this));
	}

	onunload() {
		// 清理和卸载相关资源
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_MD2CANVAS_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createMdToCanvas(filePath: string, depth: number): Promise<void> {
		try {
			// 检查是路径还是文件名
			let file: TFile | null;
			
			if (filePath.includes('/') || filePath.includes('\\')) {
				// 是路径，直接获取
				file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
			} else {
				// 是文件名，使用查找功能
				file = getFileByName(this.app, filePath);
			}
			
			if (!file || !(file instanceof TFile)) {
				new Notice(`未找到文件: "${filePath}"`);
				return;
			}

			// 保存最后使用的文件
			this.settings.lastUsedFile = file.path;
			await this.saveSettings();

			new Notice(`正在转换笔记: "${file.name}" (深度: ${depth})`);
			
			// 分析链接关系
			const linkMap = await analyzeLinks(this.app, file, depth);
			
			// 创建Canvas
			const canvasPath = await createCanvasFromLinkMap(this.app, linkMap);

			new Notice(`Canvas创建成功: "${canvasPath}"`);
			
			// 自动打开创建的Canvas文件
			const canvasFile = this.app.vault.getAbstractFileByPath(canvasPath);
			if (canvasFile) {
				this.app.workspace.getLeaf().openFile(canvasFile);
			}
		} catch (error) {
			console.error(error);
			new Notice(`创建Canvas时出错: ${error}`);
		}
	}
}
