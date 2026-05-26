# Changelog

## v0.1.0 — 2026-05-26

- Initial release: fleet-analyze a directory of MCP Tool Cards.
- Library API: `summarize(cards)` returns counts by side-effect class, PII/secrets exposure histogram, reversible/human-approval counts, approval gaps, deterministically-sorted rows.
- Formatters: `toMarkdown(report)` (with ⚠ approval-gap section) and `toSummary(report)` one-liner.
- CLI: `mcp-tool-card-summary <cards-dir> [--format json|markdown|summary] [--fail-on-gaps] [--out FILE]`.
- Lane #1: completes the MCP Tool Card governance triplet — spec / generator / **summary**.
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
