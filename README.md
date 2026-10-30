# mcp-tool-card-summary

Fleet-analyze a directory of [MCP Tool Cards](https://github.com/mizcausevic-dev/mcp-tool-card-spec). Counts by side-effect class, PII/secrets exposure, reversibility, human-approval-required; surfaces **approval gaps** (destructive tools that don't declare `human_approval_required: true`).

> Source version: v0.1.0 — Node 20/22 supported, library + CLI. On 2026-10-30, the exact `mcp-tool-card-summary` name returned 404 from the public npm registry. Run it from a checkout as shown below.

## Maintenance and migration

The maintained source replacement, [`mcp-tool-card-fleet-summary`](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary), is on `main` at [`6e50f44`](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary/commit/6e50f44fb49c7a99f4dad373eeb2fbe8c80adf74). It covers this directory-level use case, adds audit and tested-with findings, and preserves the secrets, reversibility, approval counts, and approval-only gate. This older repository is being retired to a read-only GitHub archive. Its source and CLI remain cloneable for compatibility. The output and exit-contract differences below require explicit migration by any consumer. A final indexed GitHub search found 21 old-name references, with no non-self executable invocation in indexed default branches; private and external consumers were not verified. Historical and documentation links remain readable after archival. No npm release of the replacement is implied.

The newer package is **not a drop-in replacement** for JSON output, TypeScript types, Markdown, or the one-line summary:

| This report | Fleet-summary `main` |
|---|---|
| `byPii` | `byPiiExposure`, with an additional `unset` count |
| `bySecrets` | `bySecretsExposure`, with an additional `unset` count |
| `reversibleCount` | `reversibleTools` |
| `humanApprovalRequiredCount` | `toolsRequiringApproval` |
| `approvalGaps` | Filter `findings` for `destructive-without-human-approval` |
| `rows[].rate_limited` | `rows[].rateLimited` |
| Row ID `server_id/name` | Row ID `server_id:name@version` |

Both CLIs support `--fail-on-gaps` for destructive tools lacking human approval. The newer tool also has `--fail-on-high` for its broader findings. Its one-line report can say `(fail)` for a different high finding while `--fail-on-gaps` exits `0`. Migrate consumers by field and exit contract before any retirement decision.

## What it produces

| Surface | Why it matters |
|---|---|
| **Counts by side-effect class** | How much of the fleet is read vs mutating vs external vs destructive — the fundamental risk surface |
| **PII / secrets exposure histogram** | Tools that touch high-PII or read secret material need extra controls |
| **Reversible / human-approval counts** | What fraction of the fleet has human-in-the-loop or undo |
| **Approval gaps ⚠** | Destructive tools where `human_approval_required` is `false` — the spec requires the conjunction; this surfaces violations |

## CLI

From this checkout after `npm install` and `npm run build`:

```
node dist/cli.js <cards-dir> [--format json|markdown|summary]
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
import { summarize, toMarkdown, toSummary } from "./dist/index.js";

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
