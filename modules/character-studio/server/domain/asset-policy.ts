import type { AssetChangeSet, CharacterAsset } from "../../shared/asset-schema";
import type { CharacterProject, CharacterVersion } from "../../shared/project-schema";
import {
  CANONICAL_ROLES,
  isCanonicalRole,
  isStressTestRole,
  type AssetRole,
} from "../../shared/templates";

const STRESS_CATEGORY = {
  "stress-lighting": "lighting",
  "stress-angle": "camera",
  "stress-action": "action",
} as const;

const LATER_CANONICAL_ROLES = new Set<AssetRole>([
  "face-three-quarter",
  "body-side",
  "body-back",
  "half-neutral",
]);

const BODY_ANCHORED_DERIVED_ROLES = new Set<AssetRole>([
  "model-card-natural",
  "model-card-half",
  "model-card-full",
  "model-card-side-action",
  "expression",
  "wardrobe-state",
  "action-reference",
]);

function hasExactRoles(references: readonly CharacterAsset[], roles: readonly AssetRole[]): boolean {
  return references.length === roles.length
    && roles.every((role) => references.filter((asset) => asset.role === role).length === 1);
}

export function hasCompleteCanonicalSet(
  version: CharacterVersion,
  assets: readonly CharacterAsset[],
): boolean {
  const roles = new Set(version.canonicalAssetIds.map((id) =>
    assets.find((asset) => asset.id === id && asset.versionId === version.id && asset.status === "ready")?.role));
  return CANONICAL_ROLES.every((role) => roles.has(role));
}

export function assertAssetOperation(input: {
  project: CharacterProject;
  version: CharacterVersion;
  role: AssetRole;
  changeSet: AssetChangeSet;
  parentAssetId?: string;
  referenceAssetIds: readonly string[];
}): void {
  const { project, version, role, changeSet, parentAssetId, referenceAssetIds } = input;
  if (version.status === "superseded") throw new Error("不能向已被替代的版本添加资产");
  const parent = parentAssetId
    ? project.assets.find((asset) => asset.id === parentAssetId && asset.status === "ready")
    : undefined;
  const references = referenceAssetIds.map((id) =>
    project.assets.find((asset) => asset.id === id && asset.status === "ready"));
  if (references.some((asset) => !asset)) throw new Error("生成配方引用了不存在的批准资产");
  if (new Set(referenceAssetIds).size !== referenceAssetIds.length) {
    throw new Error("生成配方不能重复引用同一批准资产");
  }
  const approvedReferences = references as CharacterAsset[];
  if (parentAssetId && !referenceAssetIds.includes(parentAssetId)) {
    throw new Error("生成配方必须把父资产列入批准资产引用");
  }

  if (isCanonicalRole(role)) {
    if (!['draft', 'testing'].includes(version.status)) throw new Error("锁定版本不能新增身份规范资产");
    if (changeSet.category !== "identity" || changeSet.targetStateId !== "base") {
      throw new Error("规范资产必须建立 base 身份状态");
    }
    if (role === "face-front") {
      if (approvedReferences.length > 1
        || approvedReferences.some((asset) => asset.role !== "face-front")) {
        throw new Error("face-front 最多只能继承一个已批准的正脸锚点");
      }
      if (approvedReferences.length === 1
        && (!version.createdFromVersionId
          || approvedReferences[0].versionId !== version.createdFromVersionId)) {
        throw new Error(`face-front 只能继承直接上一版本 ${version.createdFromVersionId ?? "无"} 的正脸锚点`);
      }
      return;
    }
    if (approvedReferences.some((asset) => asset.versionId !== version.id)) {
      throw new Error("规范资产只能引用当前同版本批准锚点");
    }
    if (role === "body-front" && !hasExactRoles(approvedReferences, ["face-front"])) {
      throw new Error("body-front 必须且只能引用当前版本 face-front 锚点");
    }
    if (LATER_CANONICAL_ROLES.has(role)
      && !hasExactRoles(approvedReferences, ["face-front", "body-front"])) {
      throw new Error(`${role} 必须且只能引用当前版本 face-front 与 body-front 锚点`);
    }
    return;
  }

  if (isStressTestRole(role)) {
    if (version.status !== "testing" || !hasCompleteCanonicalSet(version, project.assets)) {
      throw new Error("压力测试只能在规范资产完整的 testing 版本中生成");
    }
    if (changeSet.category !== STRESS_CATEGORY[role]) throw new Error("压力测试变化类别与角色不匹配");
  } else {
    if (version.status !== "locked") throw new Error("派生资产只能从已锁定版本创建");
    if (changeSet.category === "identity") throw new Error("身份变化必须创建新版本");
    if (role === "expression" && changeSet.category !== "expression") {
      throw new Error("表情资产必须使用 expression 变化类别");
    }
    if (role === "wardrobe-state" && changeSet.category !== "wardrobe") {
      throw new Error("服装资产必须使用 wardrobe 变化类别");
    }
    if (role === "action-reference" && changeSet.category !== "action") {
      throw new Error("动作资产必须使用 action 变化类别");
    }
    if (role.startsWith("model-card-") && !["camera", "action"].includes(changeSet.category)) {
      throw new Error("模卡资产只能声明 camera 或 action 单变量变化");
    }
  }

  if (!parent || parent.versionId !== version.id) throw new Error("父资产必须是同版本的可用批准资产");
  if (approvedReferences.some((asset) => asset.versionId !== version.id)) {
    throw new Error("压力测试和派生资产只能引用同版本批准资产");
  }
  if (isStressTestRole(role)
    && !hasExactRoles(approvedReferences, ["face-front", "body-front"])) {
    throw new Error("压力测试必须且只能引用当前版本 face-front 与 body-front 锚点");
  }
  if (!isStressTestRole(role)) {
    const faceReferences = approvedReferences.filter((asset) => asset.role === "face-front");
    const bodyReferences = approvedReferences.filter((asset) => asset.role === "body-front");
    if (faceReferences.length > 1 || bodyReferences.length > 1) {
      throw new Error("派生资产最多只能引用一个 face-front 和一个 body-front 锚点");
    }
    const allowedIds = new Set([
      parent.id,
      ...approvedReferences
        .filter((asset) => asset.role === "face-front" || asset.role === "body-front")
        .map((asset) => asset.id),
    ]);
    if (approvedReferences.some((asset) => !allowedIds.has(asset.id))) {
      throw new Error("派生资产只能引用父资产以及当前版本 face-front、body-front 锚点");
    }
    if (BODY_ANCHORED_DERIVED_ROLES.has(role)
      && (!approvedReferences.some((asset) => asset.role === "face-front")
        || !approvedReferences.some((asset) => asset.role === "body-front"))) {
      throw new Error(`${role} 必须同时引用当前版本 face-front 与 body-front 身材锚点`);
    }
  }
}
