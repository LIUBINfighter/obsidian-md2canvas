import { App, TFile } from 'obsidian';

/**
 * 根据文件名获取 TFile 对象
 */
export function getFileByName(app: App, fileName: string): TFile | null {
	// 获取所有 markdown 文件
	const markdownFiles = app.vault.getMarkdownFiles();

	// 尝试完全匹配文件名
	const exactMatch = markdownFiles.find(file =>
		file.basename === fileName || file.name === fileName
	);

	if (exactMatch) return exactMatch;

	// 如果没有完全匹配，尝试部分匹配
	const partialMatch = markdownFiles.find(file =>
		file.basename.includes(fileName) || file.name.includes(fileName)
	);

	return partialMatch || null;
}
