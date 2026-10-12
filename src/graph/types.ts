export type NodeType = "Bot" | "Bet" | "Repo" | "Gate" | "Person";

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  aliases?: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  rel: string;
}

export interface Hop {
  from: GraphNode;
  rel: string;
  to: GraphNode;
  /** true when the edge is stored as to -> from and was walked backwards */
  reversed: boolean;
}

export interface GraphPath {
  nodes: GraphNode[];
  hops: Hop[];
}

/** Storage seam: in-memory for tests and demos, FalkorDB in production. */
export interface GraphStore {
  upsert(nodes: GraphNode[], edges: GraphEdge[]): Promise<void>;
  nodes(): Promise<GraphNode[]>;
  shortestPath(fromId: string, toId: string, maxHops?: number): Promise<GraphPath | null>;
  neighbors(id: string): Promise<Hop[]>;
}
