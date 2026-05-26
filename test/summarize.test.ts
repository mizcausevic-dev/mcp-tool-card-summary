import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { summarize } from "../src/summarize.js";
import { toMarkdown, toSummary } from "../src/format.js";
import type { ToolCard } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));

function loadDir(name: string): ToolCard[] {
  const dir = `${here}/../fixtures/${name}`;
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as ToolCard);
}

describe("summarize", () => {
  it("counts cards across the fleet", () => {
    const r = summarize(loadDir("cards"));
    expect(r.cards).toBe(3);
    expect(r.bySideEffect.read).toBe(1);
    expect(r.bySideEffect.external).toBe(1);
    expect(r.bySideEffect.destructive).toBe(1);
    expect(r.bySideEffect.mutating).toBe(0);
  });

  it("tallies PII and secrets exposure levels", () => {
    const r = summarize(loadDir("cards"));
    expect(r.byPii.low).toBe(1);
    expect(r.byPii.medium).toBe(1);
    expect(r.byPii.high).toBe(1);
    expect(r.bySecrets.none).toBe(2);
    expect(r.bySecrets.reads_secret_material).toBe(1);
  });

  it("counts reversible and human-approval-required", () => {
    const r = summarize(loadDir("cards"));
    expect(r.reversibleCount).toBe(1);
    expect(r.humanApprovalRequiredCount).toBe(1);
  });

  it("flags zero approval gaps when destructive cards properly declare human_approval_required", () => {
    const r = summarize(loadDir("cards"));
    expect(r.approvalGaps).toEqual([]);
  });

  it("flags approval gaps for destructive cards without human_approval_required", () => {
    const r = summarize([...loadDir("cards"), ...loadDir("cards-with-gap")]);
    expect(r.approvalGaps.map((g) => g.id)).toEqual(["ops-mcp/rm-rf-cache"]);
    expect(r.approvalGaps[0].needs_approval_gap).toBe(true);
  });

  it("returns rows sorted by id deterministically", () => {
    const r = summarize(loadDir("cards"));
    expect(r.rows.map((x) => x.id)).toEqual([
      "outreach-mcp/send-email",
      "research-mcp/delete-document",
      "research-mcp/search-vectorstore"
    ]);
  });

  it("skips malformed cards without crashing", () => {
    const r = summarize([
      { tool_card_version: "0.1" } as ToolCard,
      ...loadDir("cards")
    ]);
    expect(r.cards).toBe(3);
  });

  it("handles an empty input list", () => {
    const r = summarize([]);
    expect(r.cards).toBe(0);
    expect(r.bySideEffect.read).toBe(0);
    expect(r.approvalGaps).toEqual([]);
  });
});

describe("formatters", () => {
  it("toMarkdown surfaces approval gaps as a warning section", () => {
    const r = summarize([...loadDir("cards"), ...loadDir("cards-with-gap")]);
    const md = toMarkdown(r);
    expect(md).toContain("Approval gaps");
    expect(md).toContain("ops-mcp/rm-rf-cache");
  });

  it("toMarkdown omits the gaps section when none", () => {
    const md = toMarkdown(summarize(loadDir("cards")));
    expect(md).not.toContain("Approval gaps");
  });

  it("toSummary highlights destructive count and gaps", () => {
    const s = toSummary(summarize([...loadDir("cards"), ...loadDir("cards-with-gap")]));
    expect(s).toContain("2 destructive");
    expect(s).toContain("1 approval gaps");
  });

  it("toSummary omits gap suffix when zero gaps", () => {
    const s = toSummary(summarize(loadDir("cards")));
    expect(s).not.toContain("approval gaps");
  });
});
