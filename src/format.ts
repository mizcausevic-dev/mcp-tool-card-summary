import type { SummaryReport } from "./types.js";

/** GitHub-flavored Markdown summary. */
export function toMarkdown(report: SummaryReport): string {
  const lines: string[] = [];
  lines.push(`## MCP Tool Card fleet summary`);
  lines.push(``);
  lines.push(`**Total cards:** ${report.cards}`);
  lines.push(``);
  lines.push(`### Side-effect class`);
  lines.push(``);
  lines.push(`| read | mutating | external | destructive |`);
  lines.push(`|---:|---:|---:|---:|`);
  lines.push(
    `| ${report.bySideEffect.read} | ${report.bySideEffect.mutating} | ${report.bySideEffect.external} | ${report.bySideEffect.destructive} |`
  );
  lines.push(``);
  lines.push(`### Exposure`);
  lines.push(``);
  lines.push(
    `- PII: none=${report.byPii.none}, low=${report.byPii.low}, medium=${report.byPii.medium}, high=${report.byPii.high}`
  );
  lines.push(
    `- Secrets: none=${report.bySecrets.none}, reads=${report.bySecrets.reads_secret_material}, writes=${report.bySecrets.writes_secret_material}, handles_keys=${report.bySecrets.handles_keys}`
  );
  lines.push(``);
  lines.push(`### Posture`);
  lines.push(``);
  lines.push(`- Reversible: ${report.reversibleCount}/${report.cards}`);
  lines.push(`- Human approval required: ${report.humanApprovalRequiredCount}/${report.cards}`);
  lines.push(``);

  if (report.approvalGaps.length > 0) {
    lines.push(`### ⚠ Approval gaps`);
    lines.push(``);
    lines.push(
      `These tools are flagged \`destructive\` but do **not** declare \`human_approval_required: true\` (the spec requires this conjunction):`
    );
    lines.push(``);
    for (const r of report.approvalGaps) lines.push(`- \`${r.id}\``);
  }

  return lines.join("\n");
}

/** One-line summary suitable for CI logs. */
export function toSummary(report: SummaryReport): string {
  const gaps = report.approvalGaps.length > 0 ? ` · ${report.approvalGaps.length} approval gaps ⚠` : "";
  return `${report.cards} cards · ${report.bySideEffect.destructive} destructive · ${report.humanApprovalRequiredCount} require human approval${gaps}`;
}
