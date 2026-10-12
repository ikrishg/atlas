# atlas

A company brain on a FalkorDB graph that answers questions in Slack. Built for FalkorDB Graph Hacks (Oct 15 to 18, 2026).

The kill test: atlas has to answer questions that take several hops through the graph, and show the path it walked. Ask "How is Forge connected to Krish?" and you get:

```
Forge reaches Krish in 5 hops:
Forge -[OWNS_CI]-> kronos <-[INCLUDES]- Ship every repo E2E <-[RUNS]- Helm <-[DISPATCHES]- Grok Bot <-[DIRECTS]- Krish
```

## Status

- Done: graph model (bots, bets, repos, gates, people), an in-memory store, a FalkorDB store, entity matching, shortest-path answers with the path, and a CLI.
- Not yet: Slack app, ingest from Slack and GitHub, deploy. The graph is a hand-written demo seed in `src/fixtures/seed.ts`.

## Run

Requires Node 22.

```bash
npm install
npm test
npm run ask -- "How is Forge connected to Krish?"
```

Without `FALKORDB_URL`, atlas uses the in-memory graph with the demo seed. To use FalkorDB:

```bash
docker run -p 6379:6379 falkordb/falkordb
export FALKORDB_URL=redis://localhost:6379
npm run seed
npm run ask -- "what is atlas connected to?"
```

| Variable | Purpose |
|----------|---------|
| `FALKORDB_URL` | FalkorDB connection URL. Unset means in-memory. |
| `FALKORDB_GRAPH` | Graph name, default `atlas`. |

## Layout

- `src/graph/types.ts`: node, edge and path types, and the `GraphStore` interface.
- `src/graph/memory-store.ts`: in-memory store with breadth-first shortest path.
- `src/graph/falkor-store.ts`: FalkorDB store using Cypher `shortestPath`. CI doesn't run it because CI has no FalkorDB.
- `src/answer.ts`: matches entities in a question and turns a path into a reply.
