import type { GraphNode, GraphPath, GraphStore, Hop } from "./graph/types.js";

export interface Answer {
  text: string;
  entities: GraphNode[];
  path: GraphPath | null;
}

/** Find the graph entities a question mentions, longest match first, in question order. */
export function resolveEntities(question: string, nodes: GraphNode[]): GraphNode[] {
  const q = ` ${question.toLowerCase().replace(/[^a-z0-9.\- ]+/g, " ")} `;
  const found: { node: GraphNode; at: number; len: number }[] = [];
  for (const node of nodes) {
    for (const term of [node.name, ...(node.aliases ?? [])]) {
      const t = term.toLowerCase();
      const at = q.indexOf(` ${t} `);
      if (at >= 0) found.push({ node, at, len: t.length });
    }
  }
  found.sort((a, b) => b.len - a.len);
  const taken: { at: number; end: number }[] = [];
  const picked: { node: GraphNode; at: number }[] = [];
  for (const f of found) {
    const end = f.at + f.len;
    if (taken.some((t) => f.at < t.end && end > t.at)) continue;
    if (picked.some((p) => p.node.id === f.node.id)) continue;
    taken.push({ at: f.at, end });
    picked.push({ node: f.node, at: f.at });
  }
  return picked.sort((a, b) => a.at - b.at).map((p) => p.node);
}

export function formatHop(h: Hop): string {
  return h.reversed ? `${h.from.name} <-[${h.rel}]- ${h.to.name}` : `${h.from.name} -[${h.rel}]-> ${h.to.name}`;
}

export function formatPath(p: GraphPath): string {
  if (!p.hops.length) return p.nodes[0]?.name ?? "";
  let out = p.nodes[0].name;
  for (const h of p.hops) out += h.reversed ? ` <-[${h.rel}]- ${h.to.name}` : ` -[${h.rel}]-> ${h.to.name}`;
  return out;
}

export async function answer(store: GraphStore, question: string): Promise<Answer> {
  const entities = resolveEntities(question, await store.nodes());
  if (entities.length === 0) {
    return { text: "I couldn't match anything in that question to the graph.", entities, path: null };
  }
  if (entities.length === 1) {
    const hops = await store.neighbors(entities[0].id);
    const lines = hops.map(formatHop);
    return {
      text: lines.length ? `${entities[0].name} connects to:\n${lines.join("\n")}` : `${entities[0].name} has no connections yet.`,
      entities,
      path: null,
    };
  }
  const [a, b] = [entities[0], entities[entities.length - 1]];
  const path = await store.shortestPath(a.id, b.id);
  if (!path) return { text: `No path between ${a.name} and ${b.name} within 6 hops.`, entities, path };
  return {
    text: `${a.name} reaches ${b.name} in ${path.hops.length} hop${path.hops.length === 1 ? "" : "s"}:\n${formatPath(path)}`,
    entities,
    path,
  };
}
