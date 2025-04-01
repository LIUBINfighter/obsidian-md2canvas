import { App, TFile } from 'obsidian';

/**
 * 链接映射表，深度为键，文件数组为值
 */
export interface LinkMap {
	[depth: number]: TFile[];
}

/**
 * 分析指定文件的出链，返回按深度分层的链接图
 */
export async function analyzeLinks(app: App, rootFile: TFile, maxDepth: number): Promise<LinkMap> {
	const linkMap: LinkMap = {};
	linkMap[0] = [rootFile]; // 0级是根文件自己

	// 记录已处理的文件，避免重复
	const processedFiles = new Set<string>();
	processedFiles.add(rootFile.path);

	// 逐层处理每个深度
	for (let depth = 0; depth < maxDepth; depth++) {
		const currentLevelFiles = linkMap[depth];
		linkMap[depth + 1] = []; // 初始化下一层

		for (const file of currentLevelFiles) {
			// 获取当前文件的所有出链
			const linkedFiles = getOutgoingLinksForFile(app, file);

			// 添加到下一层深度，避免重复
			for (const linkedFile of linkedFiles) {
				if (!processedFiles.has(linkedFile.path)) {
					linkMap[depth + 1].push(linkedFile);
					processedFiles.add(linkedFile.path);
				}
			}
		}

		// 如果这一层没有新的链接文件，提前结束
		if (linkMap[depth + 1].length === 0) {
			delete linkMap[depth + 1];
			break;
		}
	}

	return linkMap;
}

/**
 * 获取单个文件的出链
 */
function getOutgoingLinksForFile(app: App, file: TFile): TFile[] {
	const linkedFiles: TFile[] = [];

	// 从元数据缓存中获取文件的链接
	const cache = app.metadataCache.getFileCache(file);
	const links = cache?.links || [];

	// 解析每个链接并获取对应的文件
	for (const link of links) {
		const linkedFile = app.metadataCache.getFirstLinkpathDest(link.link, file.path);
		if (linkedFile && linkedFile instanceof TFile) {
			linkedFiles.push(linkedFile);
		}
	}

	return linkedFiles;
}
