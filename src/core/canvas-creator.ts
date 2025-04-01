import { App, TFile } from 'obsidian';
import { LinkMap } from './link-analyzer';

interface CanvasNode {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	type: 'file';
	file: string;
	color?: string;
}

interface CanvasEdge {
	id: string;
	fromNode: string;
	fromSide: 'bottom' | 'top' | 'left' | 'right';
	toNode: string;
	toSide: 'bottom' | 'top' | 'left' | 'right';
}

interface CanvasData {
	nodes: CanvasNode[];
	edges: CanvasEdge[];
}

/**
 * 创建 Canvas 文件并添加节点
 */
export async function createCanvasFromLinkMap(app: App, linkMap: LinkMap): Promise<string> {
	const rootFile = linkMap[0][0];
	const canvasName = `${rootFile.basename} - Canvas.canvas`;

	// 创建空的 Canvas 文件
	let canvasFile = await app.vault.create(canvasName, '{"nodes":[],"edges":[]}');

	// 准备 Canvas 数据
	const canvasData: CanvasData = {
		nodes: [],
		edges: []
	};

	// 为所有深度的节点创建映射表，用于后续建立边缘
	const nodeIdMap = new Map<string, string>();

	// 添加所有节点
	await addNodesToCanvas(linkMap, canvasData, nodeIdMap);

	// 添加所有边缘
	await addEdgesToCanvas(app, linkMap, canvasData, nodeIdMap);

	// 保存 Canvas 数据
	await app.vault.modify(canvasFile, JSON.stringify(canvasData));

	return canvasFile.path;
}

/**
 * 为 Canvas 添加节点
 */
async function addNodesToCanvas(
	linkMap: LinkMap,
	canvasData: CanvasData,
	nodeIdMap: Map<string, string>
): Promise<void> {
	const nodeWidth = 280;
	const nodeHeight = 180;
	const horizontalSpacing = 50;
	const verticalSpacing = 100;

	// 处理每一层深度
	const depths = Object.keys(linkMap).map(Number);
	for (const depth of depths) {
		const filesAtDepth = linkMap[depth];
		const levelWidth = filesAtDepth.length * (nodeWidth + horizontalSpacing);

		// 处理当前深度的每个文件
		filesAtDepth.forEach((file, index) => {
			// 计算每个节点的位置，居中排列
			const x = (index * (nodeWidth + horizontalSpacing)) - (levelWidth / 2) + (nodeWidth / 2);
			const y = depth * (nodeHeight + verticalSpacing);

			// 创建唯一的节点 ID
			const nodeId = generateId();

			// 记录文件路径到节点 ID 的映射
			nodeIdMap.set(file.path, nodeId);

			// 添加节点
			canvasData.nodes.push({
				id: nodeId,
				x,
				y,
				width: nodeWidth,
				height: nodeHeight,
				type: 'file',
				file: file.path,
				color: getColorForDepth(depth)
			});
		});
	}
}

/**
 * 为 Canvas 添加边缘连接
 */
async function addEdgesToCanvas(
	app: App,
	linkMap: LinkMap,
	canvasData: CanvasData,
	nodeIdMap: Map<string, string>
): Promise<void> {
	// 遍历每个深度层级
	const depths = Object.keys(linkMap).map(Number);
	for (let i = 0; i < depths.length - 1; i++) {
		const currentDepth = depths[i];
		const currentFiles = linkMap[currentDepth];

		// 处理当前深度的每个文件
		for (const sourceFile of currentFiles) {
			// 获取源文件的出链
			const cache = app.metadataCache.getFileCache(sourceFile);
			const links = cache?.links || [];

			// 处理每个链接
			for (const link of links) {
				const targetFile = app.metadataCache.getFirstLinkpathDest(link.link, sourceFile.path);

				if (targetFile && targetFile instanceof TFile) {
					// 检查目标文件是否在下一层
					const nextDepthFiles = linkMap[currentDepth + 1] || [];
					if (nextDepthFiles.some(file => file.path === targetFile.path)) {
						const sourceNodeId = nodeIdMap.get(sourceFile.path);
						const targetNodeId = nodeIdMap.get(targetFile.path);

						if (sourceNodeId && targetNodeId) {
							// 添加边缘连接
							canvasData.edges.push({
								id: generateId(),
								fromNode: sourceNodeId,
								fromSide: 'bottom',
								toNode: targetNodeId,
								toSide: 'top'
							});
						}
					}
				}
			}
		}
	}
}

/**
 * 生成随机 ID
 */
function generateId(): string {
	return Math.random().toString(36).substring(2, 11);
}

/**
 * 根据深度获取颜色
 */
function getColorForDepth(depth: number): string {
	// Obsidian Canvas 颜色编号
	const colors = ['1', '4', '5', '6', '2', '3'];
	return colors[depth % colors.length];
}
