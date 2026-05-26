// Summarize a directory of MCP Tool Cards (https://github.com/mizcausevic-dev/mcp-tool-card-spec).
// Subset of the spec we read for analysis.

export type SideEffectClass = "read" | "mutating" | "external" | "destructive";
export type PiiExposure = "none" | "low" | "medium" | "high";
export type SecretsExposure =
  | "none"
  | "reads_secret_material"
  | "writes_secret_material"
  | "handles_keys";

export interface ToolCardSafety {
  side_effect_class: SideEffectClass;
  external_systems?: string[];
  reversible: boolean;
  rate_limited: boolean;
  pii_exposure: PiiExposure;
  secrets_exposure: SecretsExposure;
  human_approval_required: boolean;
  refusal_modes?: string[];
}

export interface ToolCard {
  tool_card_version: string;
  tool: {
    server_id: string;
    name: string;
    version: string;
    mcp_server_uri: string;
    description: string;
  };
  safety: ToolCardSafety;
  [key: string]: unknown;
}

export interface SummaryRow {
  /** "<server_id>/<name>" — unique within a card collection. */
  id: string;
  server_id: string;
  name: string;
  side_effect_class: SideEffectClass;
  reversible: boolean;
  rate_limited: boolean;
  pii_exposure: PiiExposure;
  secrets_exposure: SecretsExposure;
  human_approval_required: boolean;
  /** True when side_effect_class is destructive but human_approval_required is false. */
  needs_approval_gap: boolean;
}

export interface SummaryReport {
  cards: number;
  bySideEffect: Record<SideEffectClass, number>;
  byPii: Record<PiiExposure, number>;
  bySecrets: Record<SecretsExposure, number>;
  reversibleCount: number;
  humanApprovalRequiredCount: number;
  /** Destructive tools that do not have human_approval_required = true. */
  approvalGaps: SummaryRow[];
  /** All rows, deterministically sorted by id. */
  rows: SummaryRow[];
}
