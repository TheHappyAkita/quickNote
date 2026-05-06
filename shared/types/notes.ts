export interface GraphNode {
  data: { id: string; label: string; type: 'date' | 'keyword'; weight?: number }
}

export interface GraphEdge {
  data: { id: string; source: string; target: string; type: 'wikilink' | 'keyword' }
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type CanvasCard =
  | { id: string; type: 'note'; date: string; x: number; y: number }
  | { id: string; type: 'url'; url: string; title: string; description: string; image: string; x: number; y: number }
  | { id: string; type: 'image'; src: string; x: number; y: number }

export interface CanvasEdge {
  id: string
  source: string
  target: string
}

export interface CanvasState {
  cards: CanvasCard[]
  edges: CanvasEdge[]
}

export interface CanvasMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
