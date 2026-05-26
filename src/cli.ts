#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { summarize } from "./summarize.js";
import { toMarkdown, toSummary } from "./format.js";
import type { ToolCard } from "./types.js";

type Format = "json" | "markdown" | "summary";

interface Args {
  dir?: string;
  format: Format;
  failOnGaps: boolean;
  out?: string;
  help: boolean;
}

const FORMATS: Format[] = ["json", "markdown", "summary"];

function parseArgs(argv: string[]): Args {
  const args: Args = { format: "json", failOnGaps: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--format") {
      const v = argv[++i] as Format;
      if (!FORMATS.includes(v)) throw new Error(`--format must be one of: ${FORMATS.join(", ")}`);
      args.format = v;
    } else if (a === "--fail-on-gaps") args.failOnGaps = true;
    else if (a === "--out") args.out = argv[++i];
    else if (!a.startsWith("-")) args.dir = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const HELP = `mcp-tool-card-summary — analyze a directory of MCP Tool Cards

Usage:
  mcp-tool-card-summary <cards-dir> [--format json|markdown|summary]
                                    [--fail-on-gaps] [--out FILE]

Reads every *.json file in the directory (one Tool Card per file) and reports:
- counts by side-effect class
- counts by PII / secrets exposure level
- reversible / human-approval-required counts
- "approval gaps" — destructive tools missing human_approval_required: true

Exit code:
  0 — no approval gaps (or --fail-on-gaps not set)
  1 — approval gaps and --fail-on-gaps is set
  2 — usage / I/O error`;

function loadCards(dir: string): ToolCard[] {
  const cards: ToolCard[] = [];
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".json")) continue;
    const full = join(dir, entry);
    if (!statSync(full).isFile()) continue;
    cards.push(JSON.parse(readFileSync(full, "utf8")) as ToolCard);
  }
  return cards;
}

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help || !args.dir) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }

  let cards: ToolCard[];
  try {
    cards = loadCards(args.dir);
  } catch (e) {
    process.stderr.write(`error reading ${args.dir}: ${(e as Error).message}\n`);
    return 2;
  }

  const report = summarize(cards);
  let out: string;
  if (args.format === "json") out = JSON.stringify(report, null, 2);
  else if (args.format === "markdown") out = toMarkdown(report);
  else out = toSummary(report);

  if (args.out) writeFileSync(args.out, `${out}\n`, "utf8");
  else process.stdout.write(`${out}\n`);

  if (args.failOnGaps && report.approvalGaps.length > 0) return 1;
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`fatal: ${(e as Error).message}\n`);
    process.exit(2);
  }
}
