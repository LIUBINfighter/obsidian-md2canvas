import { App, PluginSettingTab, Setting } from 'obsidian';
import Md2Canvas from '../main';

export class Md2CanvasSettingTab extends PluginSettingTab {
    plugin: Md2Canvas;

    constructor(app: App, plugin: Md2Canvas) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'MD2Canvas 设置' });

        new Setting(containerEl)
            .setName('自动转换')
            .setDesc('创建新笔记时自动转换为Canvas（需要重启Obsidian生效）')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoConvert)
                .onChange(async (value) => {
                    this.plugin.settings.autoConvert = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('默认深度')
            .setDesc('转换笔记时默认使用的链接深度')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('1', '1级 (仅直接链接)')
                    .addOption('2', '2级 (包含二级链接)')
                    .addOption('3', '3级 (包含三级链接)')
                    .setValue(String(this.plugin.settings.defaultDepth || '1'))
                    .onChange(async (value) => {
                        this.plugin.settings.defaultDepth = parseInt(value);
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('节点颜色')
            .setDesc('Canvas中根节点的默认颜色')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('1', '蓝色')
                    .addOption('2', '绿色')
                    .addOption('3', '紫色')
                    .addOption('4', '粉色')
                    .addOption('5', '红色')
                    .addOption('6', '橙色')
                    .setValue(this.plugin.settings.rootNodeColor || '1')
                    .onChange(async (value) => {
                        this.plugin.settings.rootNodeColor = value;
                        await this.plugin.saveSettings();
                    });
            });

        containerEl.createEl('h3', { text: '使用说明' });
        containerEl.createEl('p', { text: '1. 在当前打开的笔记上使用命令面板或侧边栏按钮直接转换' });
        containerEl.createEl('p', { text: '2. 使用高级设置命令可以指定任意笔记和深度进行转换' });
        containerEl.createEl('p', { text: '3. 转换完成后会自动打开创建的Canvas文件' });
    }
}
