import type {
  PiiExposure,
  SecretsExposure,
  SideEffectClass,
  SummaryReport,
  SummaryRow,
  ToolCard
} from "./types.js";

const SIDE_EFFECTS: SideEffectClass[] = ["read", "mutating", "external", "destructive"];
const PII_LEVELS: PiiExposure[] = ["none", "low", "medium", "high"];
const SECRET_LEVELS: SecretsExposure[] = [
  "none",
  "reads_secret_material",
  "writes_secret_material",
  "handles_keys"
];

function zeros<K extends string>(keys: readonly K[]): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const k of keys) out[k] = 0;
  return out;
}

/** Summarize a collection of MCP Tool Cards. */
export function summarize(cards: ToolCard[]): SummaryReport {
  const bySideEffect = zeros(SIDE_EFFECTS);
  const byPii = zeros(PII_LEVELS);
  const bySecrets = zeros(SECRET_LEVELS);
  let reversibleCount = 0;
  let humanApprovalRequiredCount = 0;
  const rows: SummaryRow[] = [];

  for (const c of cards) {
    if (!c.safety || !c.tool) continue;
    const s = c.safety;
    const id = `${c.tool.server_id}/${c.tool.name}`;
    bySideEffect[s.side_effect_class] = (bySideEffect[s.side_effect_class] ?? 0) + 1;
    byPii[s.pii_exposure] = (byPii[s.pii_exposure] ?? 0) + 1;
    bySecrets[s.secrets_exposure] = (bySecrets[s.secrets_exposure] ?? 0) + 1;
    if (s.reversible) reversibleCount += 1;
    if (s.human_approval_required) humanApprovalRequiredCount += 1;

    const needs_approval_gap = s.side_effect_class === "destructive" && !s.human_approval_required;
    rows.push({
      id,
      server_id: c.tool.server_id,
      name: c.tool.name,
      side_effect_class: s.side_effect_class,
      reversible: s.reversible,
      rate_limited: s.rate_limited,
      pii_exposure: s.pii_exposure,
      secrets_exposure: s.secrets_exposure,
      human_approval_required: s.human_approval_required,
      needs_approval_gap
    });
  }

  rows.sort((a, b) => a.id.localeCompare(b.id));
  const approvalGaps = rows.filter((r) => r.needs_approval_gap);

  return {
    cards: rows.length,
    bySideEffect,
    byPii,
    bySecrets,
    reversibleCount,
    humanApprovalRequiredCount,
    approvalGaps,
    rows
  };
}
