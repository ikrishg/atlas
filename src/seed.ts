import { FalkorGraphStore } from "./graph/falkor-store.js";
import { edges, nodes } from "./fixtures/seed.js";

const url = process.env.FALKORDB_URL;
if (!url) {
  console.error("Set FALKORDB_URL to seed FalkorDB.");
  process.exit(1);
}
const store = await FalkorGraphStore.connect(url, process.env.FALKORDB_GRAPH ?? "atlas");
await store.upsert(nodes, edges);
console.log(`Seeded ${nodes.length} nodes and ${edges.length} edges.`);
await store.close();
