export const CANONICAL_ROLES = [
  "face-front",
  "face-three-quarter",
  "body-front",
  "body-side",
  "body-back",
  "half-neutral",
] as const;

export const STRESS_TEST_ROLES = [
  "stress-lighting",
  "stress-angle",
  "stress-action",
] as const;

export const DERIVED_ASSET_ROLES = [
  "model-card-natural",
  "model-card-half",
  "model-card-full",
  "model-card-side-action",
  "expression",
  "wardrobe-state",
  "action-reference",
  "custom",
] as const;

export const ASSET_ROLES = [
  ...CANONICAL_ROLES,
  ...STRESS_TEST_ROLES,
  ...DERIVED_ASSET_ROLES,
] as const;

export type CanonicalRole = (typeof CANONICAL_ROLES)[number];
export type StressTestRole = (typeof STRESS_TEST_ROLES)[number];
export type AssetRole = (typeof ASSET_ROLES)[number];

export const CANONICAL_ROLE_LABELS: Record<CanonicalRole, string> = {
  "face-front": "身份基准照",
  "face-three-quarter": "微侧半身",
  "body-front": "正面全身",
  "body-side": "侧面全身",
  "body-back": "背面全身",
  "half-neutral": "中性半身",
};

export const HUMAN_MODEL_CARD_COMPLEMENTS = [
  { stateKey: "natural", role: "model-card-natural", instruction: "自然正面肖像，干净背景，克制修饰" },
  { stateKey: "half", role: "model-card-half", instruction: "自然中性半身，清楚呈现肩线与上身比例" },
  { stateKey: "full-front", role: "model-card-full", instruction: "专业人物模卡目录正面全身参考，明确成年并由完整日常服装覆盖，端庄自然站姿，客观工作室构图" },
  { stateKey: "side-action", role: "model-card-side-action", instruction: "专业人物模卡目录侧面参考，明确成年并由完整日常服装覆盖，自然侧面站姿或克制步行，非挑逗动作，客观工作室构图" },
] as const satisfies readonly { stateKey: string; role: AssetRole; instruction: string }[];

export const EXPRESSION_SIX = [
  { stateKey: "neutral", instruction: "中性表情" },
  { stateKey: "slight-smile", instruction: "轻微微笑" },
  { stateKey: "open-smile", instruction: "自然开朗笑容" },
  { stateKey: "focused", instruction: "专注表情" },
  { stateKey: "surprised", instruction: "克制的惊讶表情" },
  { stateKey: "restrained-sadness", instruction: "克制的悲伤表情" },
] as const;

export function isAssetRole(value: unknown): value is AssetRole {
  return typeof value === "string" && (ASSET_ROLES as readonly string[]).includes(value);
}

export function isCanonicalRole(value: unknown): value is CanonicalRole {
  return typeof value === "string" && (CANONICAL_ROLES as readonly string[]).includes(value);
}

export function isStressTestRole(value: unknown): value is StressTestRole {
  return typeof value === "string" && (STRESS_TEST_ROLES as readonly string[]).includes(value);
}
