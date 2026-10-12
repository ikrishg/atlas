import { FalkorDB, type Graph } from "falkordb";
import type { GraphEdge, GraphNode, GraphPath, GraphStore, Hop, NodeType } from "./types.js";

/**
 * FalkorDB-backed store. Every node gets the :Entity label plus its type label,
 * so lookups by id hit one index. Not exercised in CI: it needs a running FalkorDB.
 */
export class FalkorGraphStore implements GraphStore {
  private constructor(private graph: Graph, private db: FalkorDB) {}

  static async connect(url: string, graphName = "atlas"): Promise<FalkorGraphStore> {
    const db = await FalkorDB.connect({ url });
    const graph = db.selectGraph(graphName);
    try {
      await graph.query("CREATE INDEX FOR (n:Entity) ON (n.id)");
    } catch {
      // index already exists
    }
    return new FalkorGraphStore(graph, db);
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  async upsert(nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
    for (const n of nodes) {
      await this.graph.query(
        `MERGE (n:Entity {id: $id}) SET n:${label(n.type)}, n.type = $type, n.name = $name, n.aliases = $aliases`,
        { params: { id: n.id, type: n.type, name: n.name, aliases: n.aliases ?? [] } },
      );
    }
    for (const e of edges) {
      await this.graph.query(
        `MATCH (a:Entity {id: $from}), (b:Entity {id: $to}) MERGE (a)-[:${relType(e.rel)}]->(b)`,
        { params: { from: e.from, to: e.to } },
      );
    }
  }

  async nodes(): Promise<GraphNode[]> {
    const res = await this.graph.query<{ id: string; type: NodeType; name: string; aliases: string[] }>(
      "MATCH (n:Entity) RETURN n.id AS id, n.type AS type, n.name AS name, n.aliases AS aliases",
    );
    return (res.data ?? []).map((r) => ({ id: r.id, type: r.type, name: r.name, aliases: r.aliases }));
  }

  async neighbors(id: string): Promise<Hop[]> {
    const res = await this.graph.query<Row>(
      `MATCH (a:Entity {id: $id})-[r]-(b:Entity)
       RETURN a.id AS aId, a.type AS aType, a.name AS aName, type(r) AS rel,
              b.id AS bId, b.type AS bType, b.name AS bName, startNode(r) = a AS forward`,
      { params: { id } },
    );
    return (res.data ?? []).map(toHop);
  }

  async shortestPath(fromId: string, toId: string, maxHops = 6): Promise<GraphPath | null> {
    const res = await this.graph.query<{ ids: string[] }>(
      `MATCH (a:Entity {id: $from}), (b:Entity {id: $to})
       MATCH p = shortestPath((a)-[*..${Math.max(1, Math.floor(maxHops))}]-(b))
       RETURN [n IN nodes(p) | n.id] AS ids`,
      { params: { from: fromId, to: toId } },
    );
    const ids = res.data?.[0]?.ids;
    if (!ids) return null;
    const all = new Map((await this.nodes()).map((n) => [n.id, n]));
    const hops: Hop[] = [];
    for (let i = 0; i < ids.length - 1; i++) {
      const hop = (await this.neighbors(ids[i])).find((h) => h.to.id === ids[i + 1]);
      if (!hop) return null;
      hops.push(hop);
    }
    return { nodes: ids.map((id) => all.get(id)!), hops };
  }
}

interface Row {
  aId: string; aType: NodeType; aName: string; rel: string;
  bId: string; bType: NodeType; bName: string; forward: boolean;
}

function toHop(r: Row): Hop {
  return {
    from: { id: r.aId, type: r.aType, name: r.aName },
    rel: r.rel,
    to: { id: r.bId, type: r.bType, name: r.bName },
    reversed: !r.forward,
  };
}

const TYPES = new Set(["Bot", "Bet", "Repo", "Gate", "Person"]);
function label(t: string): string {
  if (!TYPES.has(t)) throw new Error(`Unknown node type ${t}`);
  return t;
}
function relType(rel: string): string {
  if (!/^[A-Z][A-Z_]*$/.test(rel)) throw new Error(`Relationship ${rel} must be UPPER_SNAKE_CASE`);
  return rel;
}
