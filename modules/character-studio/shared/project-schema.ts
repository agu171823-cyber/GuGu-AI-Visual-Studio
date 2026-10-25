import { validProvider, validStoredSize } from "./gugu";
import type { CharacterAsset } from "./asset-schema";
import {
  CANONICAL_ROLES,
  STRESS_TEST_ROLES,
  isAssetRole,
  isCanonicalRole,
  isStressTestRole,
  type StressTestRole,
} from "./templates";

export type ProjectMode = "human-model-card" | "realistic-virtual-character";
export type VersionStatus = "draft" | "testing" | "locked" | "superseded";

export type IdentityDescriptor = {
  visibleNotes: string[];
};

export type OptionalHumanProfile = {
  stageName?: string;
  heightCm?: number;
  bustCm?: number;
  waistCm?: number;
  hipsCm?: number;
  shoeSize?: string;
  contact?: string;
};

export type StressTestResult = {
  role: StressTestRole;
  assetId: string;
  passed: boolean;
  reviewedAt?: string;
};

export type CharacterVersion = {
  id: string;
  status: VersionStatus;
  immutableDescriptor: IdentityDescriptor;
  canonicalAssetIds: string[];
  stressTests: StressTestResult[];
  derivedStateIds: string[];
  createdFromVersionId?: string;
  lockedAt?: string;
};

export type BoardExport = {
  id: string;
  versionId: string;
  kind: "human-comp-card" | "virtual-character-sheet";
  fileName: string;
  createdAt: string;
  assetIds: string[];
};

export type CharacterProject = {
  schemaVersion: 1;
  id: string;
  mode: ProjectMode;
  title: string;
  displayName: string;
  characterTag: string;
  createdAt: string;
  updatedAt: string;
  optionalProfile: OptionalHumanProfile;
  currentVersionId: string;
  versions: CharacterVersion[];
  assets: CharacterAsset[];
  boards: BoardExport[];
};

export type CreateDraftProjectInput = {
  mode: ProjectMode;
  title: string;
  displayName: string;
  optionalProfile?: OptionalHumanProfile;
};

const ROOT_KEYS = new Set([
  "schemaVersion",
  "id",
  "mode",
  "title",
  "displayName",
  "characterTag",
  "createdAt",
  "updatedAt",
  "optionalProfile",
  "currentVersionId",
  "versions",
  "assets",
  "boards",
]);
const VERSION_KEYS = new Set([
  "id",
  "status",
  "immutableDescriptor",
  "canonicalAssetIds",
  "stressTests",
  "derivedStateIds",
  "createdFromVersionId",
  "lockedAt",
]);
const ASSET_KEYS = new Set([
  "id",
  "versionId",
  "role",
  "stateId",
  "status",
  "parentAssetId",
  "changeSet",
  "fileName",
  "recipe",
]);
const RECIPE_KEYS = new Set([
  "compilerVersion", "templateId", "provider", "model", "size", "quality",
  "referenceAssetIds", "parentAssetId", "changeSet", "latencyMs", "completedAt",
]);
const CHANGE_KEYS = new Set(["category", "instruction", "sourceStateId", "targetStateId"]);
const VERSION_STATUSES = new Set(["draft", "testing", "locked", "superseded"]);
const ASSET_STATUSES = new Set(["queued", "generating", "ready", "rejected", "failed"]);
const CHANGE_CATEGORIES = new Set([
  "identity", "expression", "wardrobe", "action", "condition", "background", "lighting", "camera",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, length);
}

function stableHex(value: string): string {
  let hash = 0x811c9dc5;
  for (const character of value.normalize("NFKC")) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function createCharacterTag(displayName: string): string {
  const asciiSlug = displayName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return asciiSlug ? `@${asciiSlug}` : `@character-${stableHex(displayName)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createDraftProject(input: CreateDraftProjectInput): CharacterProject {
  const title = input.title.trim();
  const displayName = input.displayName.trim();
  if (!title || !displayName) throw new Error("项目名和角色显示名不能为空");
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: `project-${randomHex(12)}`,
    mode: input.mode,
    title,
    displayName,
    characterTag: createCharacterTag(displayName),
    createdAt: now,
    updatedAt: now,
    optionalProfile: { ...(input.optionalProfile ?? {}) },
    currentVersionId: "v1",
    versions: [
      {
        id: "v1",
        status: "draft",
        immutableDescriptor: { visibleNotes: [] },
        canonicalAssetIds: [],
        stressTests: [],
        derivedStateIds: [],
      },
    ],
    assets: [],
    boards: [],
  };
}

export function createNextVersion(project: CharacterProject): CharacterProject {
  const current = project.versions.find((version) => version.id === project.currentVersionId);
  if (!current) throw new Error("当前角色版本不存在");
  if (current.status !== "locked") throw new Error("只有已锁定版本可以创建身份新版本");

  const next = clone(project);
  const number = Math.max(
    0,
    ...next.versions.map((version) => Number(version.id.replace(/^v/, "")) || 0),
  ) + 1;
  const id = `v${number}`;
  next.versions.push({
    id,
    status: "draft",
    immutableDescriptor: clone(current.immutableDescriptor),
    canonicalAssetIds: [],
    stressTests: [],
    derivedStateIds: [],
    createdFromVersionId: current.id,
  });
  next.currentVersionId = id;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function canLockVersion(
  version: CharacterVersion,
  assets: readonly CharacterAsset[],
): boolean {
  const canonicalAssets = version.canonicalAssetIds
    .map((id) => assets.find((asset) => asset.id === id))
    .filter((asset): asset is CharacterAsset => Boolean(asset));
  const roles = new Set(
    canonicalAssets
      .filter((asset) => asset.versionId === version.id && asset.status === "ready")
      .map((asset) => asset.role),
  );
  const hasCanonicalSet = CANONICAL_ROLES.every((role) => roles.has(role));
  const passedStressTests = STRESS_TEST_ROLES.every((role) => {
    const result = version.stressTests.find((item) => item.role === role && item.passed === true);
    if (!result) return false;
    const stressAsset = assets.find((asset) => asset.id === result.assetId);
    return Boolean(
      stressAsset
      && stressAsset.versionId === version.id
      && stressAsset.role === role
      && stressAsset.status === "ready",
    );
  });
  return hasCanonicalSet && passedStressTests;
}

function pushUnknownKeys(
  errors: string[],
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path}: unknown key ${key}`);
  }
}

export function validateCharacterProject(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["project must be an object"];
  pushUnknownKeys(errors, value, ROOT_KEYS, "project");
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (typeof value.id !== "string" || !/^project-[a-f0-9]{12}$/.test(value.id)) {
    errors.push("id must be a safe project id");
  }
  if (value.mode !== "human-model-card" && value.mode !== "realistic-virtual-character") {
    errors.push("mode is invalid");
  }
  if (typeof value.title !== "string" || !value.title.trim()) errors.push("title is required");
  if (typeof value.displayName !== "string" || !value.displayName.trim()) {
    errors.push("displayName is required");
  }
  if (typeof value.characterTag !== "string" || !/^@[a-z0-9-]+$/.test(value.characterTag)) {
    errors.push("characterTag is invalid");
  }
  if (!Array.isArray(value.versions)) {
    errors.push("versions must be an array");
    return errors;
  }

  const versionIds = new Set<string>();
  for (const [index, rawVersion] of value.versions.entries()) {
    const path = `versions[${index}]`;
    if (!isRecord(rawVersion)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, rawVersion, VERSION_KEYS, path);
    if (typeof rawVersion.id !== "string" || !/^v[1-9]\d*$/.test(rawVersion.id)) {
      errors.push(`${path}.id is invalid`);
    } else if (versionIds.has(rawVersion.id)) {
      errors.push(`${path}.id is duplicated`);
    } else {
      versionIds.add(rawVersion.id);
    }
    if (!VERSION_STATUSES.has(String(rawVersion.status))) errors.push(`${path}.status is invalid`);
    if (rawVersion.status === "locked" && typeof rawVersion.lockedAt !== "string") {
      errors.push(`${path}.lockedAt is required for locked versions`);
    }
    if (!isRecord(rawVersion.immutableDescriptor)
      || !Array.isArray(rawVersion.immutableDescriptor.visibleNotes)
      || !rawVersion.immutableDescriptor.visibleNotes.every((note) => typeof note === "string")) {
      errors.push(`${path}.immutableDescriptor is invalid`);
    }
    if (!Array.isArray(rawVersion.canonicalAssetIds)) {
      errors.push(`${path}.canonicalAssetIds must be an array`);
    } else if (!rawVersion.canonicalAssetIds.every((id) => typeof id === "string")) {
      errors.push(`${path}.canonicalAssetIds must contain strings`);
    }
    if (!Array.isArray(rawVersion.derivedStateIds)
      || !rawVersion.derivedStateIds.every((id) => typeof id === "string")) {
      errors.push(`${path}.derivedStateIds must be an array of strings`);
    }
    if (!Array.isArray(rawVersion.stressTests)) {
      errors.push(`${path}.stressTests must be an array`);
    } else {
      for (const result of rawVersion.stressTests) {
        if (!isRecord(result) || !isStressTestRole(result.role)
          || typeof result.assetId !== "string" || typeof result.passed !== "boolean") {
          errors.push(`${path}.stressTests contains an invalid role`);
        }
      }
    }
  }
  if (typeof value.currentVersionId !== "string" || !versionIds.has(value.currentVersionId)) {
    errors.push("currentVersionId does not resolve to a version");
  }
  for (const [index, rawVersion] of value.versions.entries()) {
    if (isRecord(rawVersion) && rawVersion.createdFromVersionId !== undefined
      && (typeof rawVersion.createdFromVersionId !== "string"
        || !versionIds.has(rawVersion.createdFromVersionId)
        || rawVersion.createdFromVersionId === rawVersion.id)) {
      errors.push(`versions[${index}].createdFromVersionId is invalid`);
    }
  }

  if (!Array.isArray(value.assets)) {
    errors.push("assets must be an array");
  } else {
    const assetIds = new Set<string>();
    for (const [index, rawAsset] of value.assets.entries()) {
      const path = `assets[${index}]`;
      if (!isRecord(rawAsset)) {
        errors.push(`${path} must be an object`);
        continue;
      }
      pushUnknownKeys(errors, rawAsset, ASSET_KEYS, path);
      if (typeof rawAsset.id !== "string" || !/^asset-[a-f0-9]{12}$/.test(rawAsset.id)) {
        errors.push(`${path}.id is invalid`);
      } else if (assetIds.has(rawAsset.id)) {
        errors.push(`${path}.id is duplicated`);
      } else assetIds.add(rawAsset.id);
      if (!isAssetRole(rawAsset.role)) errors.push(`${path}.role is invalid`);
      if (typeof rawAsset.versionId !== "string" || !versionIds.has(rawAsset.versionId)) {
        errors.push(`${path}.versionId does not resolve to a version`);
      }
      const derived = !isCanonicalRole(rawAsset.role)
        || (isRecord(rawAsset.changeSet) && rawAsset.changeSet.category !== "identity")
        || rawAsset.stateId !== "base";
      if (derived && typeof rawAsset.parentAssetId !== "string") {
        errors.push(`${path}.parentAssetId is required for derived assets`);
      }
      if (typeof rawAsset.stateId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(rawAsset.stateId)) {
        errors.push(`${path}.stateId is invalid`);
      }
      if (!ASSET_STATUSES.has(String(rawAsset.status))) errors.push(`${path}.status is invalid`);
      if (!isRecord(rawAsset.changeSet)) {
        errors.push(`${path}.changeSet is invalid`);
      } else {
        pushUnknownKeys(errors, rawAsset.changeSet, CHANGE_KEYS, `${path}.changeSet`);
        if (!CHANGE_CATEGORIES.has(String(rawAsset.changeSet.category))
          || typeof rawAsset.changeSet.instruction !== "string"
          || typeof rawAsset.changeSet.sourceStateId !== "string"
          || typeof rawAsset.changeSet.targetStateId !== "string") {
          errors.push(`${path}.changeSet is invalid`);
        }
      }
      if (!isRecord(rawAsset.recipe)) {
        errors.push(`${path}.recipe is invalid`);
      } else {
        pushUnknownKeys(errors, rawAsset.recipe, RECIPE_KEYS, `${path}.recipe`);
        if (typeof rawAsset.recipe.compilerVersion !== "string"
          || typeof rawAsset.recipe.templateId !== "string"
          || !validProvider(rawAsset.recipe.provider)
          || typeof rawAsset.recipe.model !== "string"
          || !validStoredSize(rawAsset.recipe.size)
          || !["low", "medium", "high"].includes(String(rawAsset.recipe.quality))
          || !Array.isArray(rawAsset.recipe.referenceAssetIds)
          || !rawAsset.recipe.referenceAssetIds.every((id) => typeof id === "string")) {
          errors.push(`${path}.recipe is invalid`);
        }
      }
    }
    for (const [index, rawAsset] of value.assets.entries()) {
      if (isRecord(rawAsset) && typeof rawAsset.parentAssetId === "string"
        && !assetIds.has(rawAsset.parentAssetId)) {
        errors.push(`assets[${index}].parentAssetId does not resolve to an asset`);
      }
      if (isRecord(rawAsset) && isRecord(rawAsset.recipe)) {
        if (Array.isArray(rawAsset.recipe.referenceAssetIds)
          && rawAsset.recipe.referenceAssetIds.some((id) => typeof id !== "string" || !assetIds.has(id))) {
          errors.push(`assets[${index}].recipe.referenceAssetIds contains an unresolved asset`);
        }
        if (rawAsset.parentAssetId !== rawAsset.recipe.parentAssetId) {
          errors.push(`assets[${index}].recipe.parentAssetId does not match asset lineage`);
        }
      }
    }
  }
  if (!Array.isArray(value.boards)) errors.push("boards must be an array");
  if (!isRecord(value.optionalProfile)) errors.push("optionalProfile must be an object");
  if (errors.length === 0 && Array.isArray(value.assets)) {
    const assets = value.assets as CharacterAsset[];
    for (const version of value.versions as CharacterVersion[]) {
      if ((version.status === "locked" || version.status === "superseded")
        && !canLockVersion(version, assets)) {
        errors.push(`versions.${version.id} is locked without a complete verified asset set`);
      }
    }
  }
  return errors;
}
