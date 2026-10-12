import type { GraphEdge, GraphNode, GraphPath, GraphStore, Hop } from "./types.js";

export class MemoryGraphStore implements GraphStore {
  async close(): Promise<void> {}

  private byId = new Map<string, GraphNode>();
  private edges: GraphEdge[] = [];

  async upsert(nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
    for (const n of nodes) this.byId.set(n.id, n);
    for (const e of edges) {
      if (!this.byId.has(e.from) || !this.byId.has(e.to)) {
        throw new Error(`Edge ${e.from} -[${e.rel}]-> ${e.to} references a missing node`);
      }
      const dup = this.edges.some((x) => x.from === e.from && x.to === e.to && x.rel === e.rel);
      if (!dup) this.edges.push(e);
    }
  }

  async nodes(): Promise<GraphNode[]> {
    return [...this.byId.values()];
  }

  async neighbors(id: string): Promise<Hop[]> {
    const self = this.byId.get(id);
    if (!self) return [];
    const hops: Hop[] = [];
    for (const e of this.edges) {
      if (e.from === id) hops.push({ from: self, rel: e.rel, to: this.byId.get(e.to)!, reversed: false });
      else if (e.to === id) hops.push({ from: self, rel: e.rel, to: this.byId.get(e.from)!, reversed: true });
    }
    return hops;
  }

  /** Breadth-first search over edges in both directions. */
  async shortestPath(fromId: string, toId: string, maxHops = 6): Promise<GraphPath | null> {
    const start = this.byId.get(fromId);
    if (!start || !this.byId.has(toId)) return null;
    if (fromId === toId) return { nodes: [start], hops: [] };
    const prev = new Map<string, Hop>();
    let frontier = [fromId];
    const seen = new Set([fromId]);
    for (let depth = 0; depth < maxHops && frontier.length; depth++) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const hop of await this.neighbors(id)) {
          if (seen.has(hop.to.id)) continue;
          seen.add(hop.to.id);
          prev.set(hop.to.id, hop);
          if (hop.to.id === toId) return rebuild(prev, fromId, toId);
          next.push(hop.to.id);
        }
      }
      frontier = next;
    }
    return null;
  }
}

function rebuild(prev: Map<string, Hop>, fromId: string, toId: string): GraphPath {
  const hops: Hop[] = [];
  let cur = toId;
  while (cur !== fromId) {
    const hop = prev.get(cur)!;
    hops.unshift(hop);
    cur = hop.from.id;
  }
  return { nodes: [hops[0].from, ...hops.map((h) => h.to)], hops };
}
