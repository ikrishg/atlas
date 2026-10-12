import type { GraphEdge, GraphNode } from "../graph/types.js";

/**
 * Demo seed. Shaped after Krish's own setup (agents, the Oct 12-18 sprint, repos and
 * merge gates) so the multi-hop demo has something real-looking to walk. Replace with
 * ingested data once the Slack and GitHub ingest lands.
 */
export const nodes: GraphNode[] = [
  { id: "person:krish", type: "Person", name: "Krish", aliases: ["krish gupta"] },
  { id: "bot:helm", type: "Bot", name: "Helm" },
  { id: "bot:forge", type: "Bot", name: "Forge" },
  { id: "bot:grok", type: "Bot", name: "Grok Bot", aliases: ["grok"] },
  { id: "bet:sprint", type: "Bet", name: "Ship every repo E2E", aliases: ["sprint", "v1 sprint"] },
  { id: "bet:graph-hacks", type: "Bet", name: "Graph Hacks entry", aliases: ["graph hacks", "falkordb hackathon"] },
  { id: "repo:atlas", type: "Repo", name: "atlas" },
  { id: "repo:kronos", type: "Repo", name: "kronos" },
  { id: "repo:poetria", type: "Repo", name: "poetria" },
  { id: "gate:green-ci", type: "Gate", name: "Green CI", aliases: ["ci"] },
  { id: "gate:review", type: "Gate", name: "Review comments resolved", aliases: ["review"] },
  { id: "gate:krish-approval", type: "Gate", name: "Krish approval", aliases: ["approval"] },
];

export const edges: GraphEdge[] = [
  { from: "person:krish", to: "bot:grok", rel: "DIRECTS" },
  { from: "bot:grok", to: "bot:helm", rel: "DISPATCHES" },
  { from: "bot:helm", to: "bet:sprint", rel: "RUNS" },
  { from: "bet:sprint", to: "repo:kronos", rel: "INCLUDES" },
  { from: "bet:sprint", to: "repo:poetria", rel: "INCLUDES" },
  { from: "bet:graph-hacks", to: "repo:atlas", rel: "INCLUDES" },
  { from: "bet:sprint", to: "bet:graph-hacks", rel: "INCLUDES" },
  { from: "bot:forge", to: "repo:kronos", rel: "OWNS_CI" },
  { from: "repo:kronos", to: "gate:green-ci", rel: "GATED_BY" },
  { from: "repo:atlas", to: "gate:green-ci", rel: "GATED_BY" },
  { from: "repo:atlas", to: "gate:review", rel: "GATED_BY" },
  { from: "repo:poetria", to: "gate:krish-approval", rel: "GATED_BY" },
  { from: "gate:krish-approval", to: "person:krish", rel: "DECIDED_BY" },
];
