export interface CanvasNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    file: string;
    color: string;
}

export interface CanvasEdge {
    id: string;
    fromNode: string;
    fromSide: string;
    toNode: string;
    toSide: string;
}

export interface Canvas {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}
