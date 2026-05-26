# mcp-tool-card-summary

Fleet-analyze a directory of [MCP Tool Cards](https://github.com/mizcausevic-dev/mcp-tool-card-spec). Counts by side-effect class, PII/secrets exposure, reversibility, human-approval-required; surfaces **approval gaps** (destructive tools that don't declare `human_approval_required: true`).

> Status: v0.1.0 — Node 20/22 supported, library + CLI.

## What it produces

| Surface | Why it matters |
|---|---|
| **Counts by side-effect class** | How much of the fleet is read vs mutating vs external vs destructive — the fundamental risk surface |
| **PII / secrets exposure histogram** | Tools that touch high-PII or read secret material need extra controls |
| **Reversible / human-approval counts** | What fraction of the fleet has human-in-the-loop or undo |
| **Approval gaps ⚠** | Destructive tools where `human_approval_required` is `false` — the spec requires the conjunction; this surfaces violations |

## CLI

```
npx mcp-tool-card-summary <cards-dir> [--format json|markdown|summary]
                                      [--fail-on-gaps] [--out FILE]
```

`<cards-dir>` is a directory containing one Tool Card JSON file per tool (the shape produced by [`mcp-tool-card-generator`](https://github.com/mizcausevic-dev/mcp-tool-card-generator)).

Exit code:
- `0` — clean fleet (or `--fail-on-gaps` not set)
- `1` — approval gaps detected AND `--fail-on-gaps` is set
- `2` — usage / I/O error

Drop it into your CI to fail on the first PR that introduces a destructive Tool Card without the matching human-approval declaration.

## Library

```ts
import { summarize, toMarkdown, toSummary } from "mcp-tool-card-summary";

const report = summarize(cards); // cards: ToolCard[]
console.log(report.bySideEffect);            // { read, mutating, external, destructive }
console.log(report.approvalGaps);            // SummaryRow[]
console.log(toSummary(report));              // "3 cards · 1 destructive · 1 require human approval"
console.log(toMarkdown(report));             // GitHub-flavored report
```

## Composes with

- [**`mcp-tool-card-spec`**](https://github.com/mizcausevic-dev/mcp-tool-card-spec) — the schema this consumes.
- [**`mcp-tool-card-generator`**](https://github.com/mizcausevic-dev/mcp-tool-card-generator) — produces the per-tool cards.
- [**`agent-card-tool-coverage`**](https://github.com/mizcausevic-dev/agent-card-tool-coverage) — sibling tool: checks an AgentCard's declared tools against an MCP server's actual `tools/list`.

## Develop

```
npm install
npm run lint && npm run typecheck && npm run coverage && npm run build
npm run demo
```

## License

[AGPL-3.0-or-later](LICENSE)
