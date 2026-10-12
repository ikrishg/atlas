import { describe, expect, it } from "vitest";
import { answer, formatPath, resolveEntities } from "../src/answer.js";
import { MemoryGraphStore } from "../src/graph/memory-store.js";
import { edges, nodes } from "../src/fixtures/seed.js";

async function seeded() {
  const s = new MemoryGraphStore();
  await s.upsert(nodes, edges);
  return s;
}

describe("resolveEntities", () => {
  it("matches names and aliases in question order, longest first", () => {
    const found = resolveEntities("Does Grok Bot reach the graph hacks repo atlas?", nodes);
    expect(found.map((n) => n.id)).toEqual(["bot:grok", "bet:graph-hacks", "repo:atlas"]);
  });
  it("returns nothing for unrelated text", () => {
    expect(resolveEntities("what's for lunch", nodes)).toEqual([]);
  });
});

describe("answer", () => {
  it("answers a multi-hop question with the graph path (kill test)", async () => {
    const res = await answer(await seeded(), "How is Forge connected to Krish?");
    expect(res.path?.hops.length).toBe(5);
    expect(formatPath(res.path!)).toBe(
      "Forge -[OWNS_CI]-> kronos <-[INCLUDES]- Ship every repo E2E <-[RUNS]- Helm <-[DISPATCHES]- Grok Bot <-[DIRECTS]- Krish",
    );
  });
  it("walks edges backwards and marks them", async () => {
    const res = await answer(await seeded(), "how does Krish reach atlas");
    expect(res.text).toContain("Krish -[DIRECTS]-> Grok Bot");
    expect(res.path!.nodes.at(-1)!.id).toBe("repo:atlas");
  });
  it("lists neighbors for a single entity", async () => {
    const res = await answer(await seeded(), "what is atlas connected to?");
    expect(res.text).toContain("atlas -[GATED_BY]-> Green CI");
    expect(res.text).toContain("atlas <-[INCLUDES]- Graph Hacks entry");
  });
  it("says so when nothing matches", async () => {
    expect((await answer(await seeded(), "hello")).path).toBeNull();
  });
});

describe("MemoryGraphStore", () => {
  it("rejects edges to missing nodes", async () => {
    const s = new MemoryGraphStore();
    await expect(s.upsert([], [{ from: "a", to: "b", rel: "X" }])).rejects.toThrow(/missing node/);
  });
  it("respects maxHops", async () => {
    const s = await seeded();
    expect(await s.shortestPath("bot:forge", "person:krish", 2)).toBeNull();
  });
});
