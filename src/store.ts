import { MemoryGraphStore } from "./graph/memory-store.js";
import type { GraphStore } from "./graph/types.js";
import { edges, nodes } from "./fixtures/seed.js";

/** FALKORDB_URL set: FalkorDB. Unset: the in-memory graph with the demo seed. */
export async function openStore(): Promise<GraphStore> {
  const url = process.env.FALKORDB_URL;
  if (url) {
    const { FalkorGraphStore } = await import("./graph/falkor-store.js");
    return FalkorGraphStore.connect(url, process.env.FALKORDB_GRAPH ?? "atlas");
  }
  const store = new MemoryGraphStore();
  await store.upsert(nodes, edges);
  return store;
}
