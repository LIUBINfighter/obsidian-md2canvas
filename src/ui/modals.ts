import { App, Modal, Setting, TFile, SuggestModal, Notice } from 'obsidian';
import Md2Canvas from '../main';

export class FileSelectionModal extends Modal {
    plugin: Md2Canvas;
    fileName: string = '';
    depth: number = 1;
    
    constructor(app: App, plugin: Md2Canvas) {
        super(app);
        this.plugin = plugin;
        this.titleEl.setText('转换笔记到Canvas');
        this.depth = plugin.settings.defaultDepth || 1;
    }

    onOpen() {
        const { contentEl } = this;
        
        contentEl.createEl('p', { 
            text: '选择要转换的笔记和链接追踪深度' 
        }).addClass('md2canvas-description');

        new Setting(contentEl)
            .setName('笔记名称')
            .setDesc('输入笔记名称或点击选择按钮')
            .addText(text => {
                text.setValue(this.fileName)
                    .onChange(value => {
                        this.fileName = value;
                    });
            })
            .addButton(button => {
                button.setButtonText('选择')
                    .setCta()
                    .onClick(() => {
                        new FileSearchModal(this.app, (file) => {
                            this.fileName = file.basename;
                            // 更新文本框
                            const textComp = contentEl.querySelector('.setting-item:first-child input') as HTMLInputElement;
                            if (textComp) textComp.value = this.fileName;
                        }).open();
                    });
            });

        new Setting(contentEl)
            .setName('链接深度')
            .setDesc('设置要追踪的链接深度')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('1', '1级 (仅直接链接)')
                    .addOption('2', '2级 (包含二级链接)')
                    .addOption('3', '3级 (包含三级链接)')
                    .addOption('4', '4级 (包含四级链接)')
                    .addOption('5', '5级 (包含五级链接)')
                    .setValue(String(this.depth))
                    .onChange(value => {
                        this.depth = parseInt(value);
                    });
            });

        const buttonContainer = contentEl.createDiv();
        buttonContainer.addClass('md2canvas-button-container');

        const convertButton = buttonContainer.createEl('button', {
            text: '开始转换'
        });
        convertButton.addClass('mod-cta');
        
        const cancelButton = buttonContainer.createEl('button', {
            text: '取消'
        });

        convertButton.addEventListener('click', async () => {
            if (!this.fileName) {
                new Notice('请输入或选择笔记名称');
                return;
            }
            
            await this.plugin.createMdToCanvas(this.fileName, this.depth);
            this.close();
        });

        cancelButton.addEventListener('click', () => {
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class FileSearchModal extends SuggestModal<TFile> {
    private onSelectCallback: (file: TFile) => void;

    constructor(app: App, onSelectCallback: (file: TFile) => void) {
        super(app);
        this.onSelectCallback = onSelectCallback;
        this.setPlaceholder('搜索笔记名称...');
    }

    getSuggestions(query: string): TFile[] {
        const files = this.app.vault.getMarkdownFiles();
        
        if (!query) return files.slice(0, 50); // 限制数量以提高性能
        
        query = query.toLowerCase();
        
        return files.filter(file => 
            file.basename.toLowerCase().includes(query) || 
            file.path.toLowerCase().includes(query)
        ).slice(0, 50);
    }

    renderSuggestion(file: TFile, el: HTMLElement) {
        el.createEl('div', { text: file.basename });
        el.createEl('small', { text: file.path });
    }

    onChooseSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent) {
        this.onSelectCallback(file);
    }
}

export class DepthSelectionModal extends Modal {
    result: number = 1;
    onSelect: (depth: number) => void;
    
    constructor(app: App, onSelect: (depth: number) => void) {
        super(app);
        this.titleEl.setText('选择链接深度');
        this.onSelect = onSelect;
    }

    onOpen() {
        const { contentEl } = this;
        
        contentEl.createEl('p', { text: '设置要追踪的链接深度' });
        
        new Setting(contentEl)
            .setName('深度')
            .setDesc('选择要追踪的链接层级深度')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('1', '1级 (仅直接链接)')
                    .addOption('2', '2级 (包含二级链接)')
                    .addOption('3', '3级 (包含三级链接)')
                    .addOption('4', '4级 (包含四级链接)')
                    .addOption('5', '5级 (包含五级链接)')
                    .setValue(String(this.result))
                    .onChange(value => {
                        this.result = parseInt(value);
                    });
            });
            
        const buttonContainer = contentEl.createDiv();
        buttonContainer.addClass('md2canvas-button-container');
        
        const confirmButton = buttonContainer.createEl('button', {
            text: '确认'
        });
        confirmButton.addClass('mod-cta');
        
        confirmButton.addEventListener('click', () => {
            this.onSelect(this.result);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
