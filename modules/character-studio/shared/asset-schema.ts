import type { ImageQuality, ImageSize } from "./contracts";
import type { AssetRole } from "./templates";
export {
  ASSET_ROLES,
  CANONICAL_ROLES,
  DERIVED_ASSET_ROLES,
  STRESS_TEST_ROLES,
} from "./templates";
export type { AssetRole } from "./templates";

export type AssetStatus = "queued" | "generating" | "ready" | "rejected" | "failed";

export type ChangeCategory =
  | "identity"
  | "expression"
  | "wardrobe"
  | "action"
  | "condition"
  | "background"
  | "lighting"
  | "camera";

export type AssetChangeSet = {
  category: ChangeCategory;
  instruction: string;
  sourceStateId: string;
  targetStateId: string;
};

export type GenerationRecipe = {
  compilerVersion: string;
  templateId: string;
  provider: "147" | "default" | "volc";
  model: string;
  size: ImageSize;
  quality: ImageQuality;
  referenceAssetIds: string[];
  parentAssetId?: string;
  changeSet: AssetChangeSet;
  latencyMs?: number;
  completedAt?: string;
};

export type CharacterAsset = {
  id: string;
  versionId: string;
  role: AssetRole;
  stateId: string;
  status: AssetStatus;
  parentAssetId?: string;
  changeSet: AssetChangeSet;
  fileName?: string;
  recipe: GenerationRecipe;
};

export type ReferenceSource = {
  id: string;
  kind: "asset" | "session";
  role: AssetRole;
};
