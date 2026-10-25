import type { CharacterAsset } from "../shared/asset-schema";
import {
  CANONICAL_ROLES,
  isCanonicalRole,
  type CanonicalRole,
} from "../shared/templates";
import type { AssignedReference } from "./components/ReferenceRoleAssigner";

const FACE_REFERENCE_ROLES = new Set<CanonicalRole>([
  "face-front",
  "face-three-quarter",
]);

const BODY_REFERENCE_ROLES = new Set<CanonicalRole>([
  "body-front",
  "body-side",
  "body-back",
  "half-neutral",
]);

function readyCanonicalAssets(
  assets: readonly CharacterAsset[],
  versionId: string,
): CharacterAsset[] {
  return assets.filter((asset) =>
    asset.versionId === versionId
    && asset.status === "ready"
    && isCanonicalRole(asset.role));
}

function anchor(
  assets: readonly CharacterAsset[],
  versionId: string,
  role: "face-front" | "body-front",
): CharacterAsset | undefined {
  return readyCanonicalAssets(assets, versionId).find((asset) => asset.role === role);
}

export function selectCanonicalSessionReferences(
  role: CanonicalRole,
  references: readonly AssignedReference[],
): AssignedReference[] {
  if (role === "face-front") {
    const faceReferences = references.filter((reference) =>
      isCanonicalRole(reference.role) && FACE_REFERENCE_ROLES.has(reference.role));
    return (faceReferences.length > 0 ? faceReferences : references.slice(0, 1)).slice(0, 2);
  }
  if (role === "body-front") {
    const exact = references.find((reference) => reference.role === "body-front");
    if (exact) return [exact];
    const bodyReference = references.find((reference) =>
      isCanonicalRole(reference.role) && BODY_REFERENCE_ROLES.has(reference.role));
    return bodyReference ? [bodyReference] : [];
  }
  const exact = references.find((reference) => reference.role === role);
  return exact ? [exact] : [];
}

export function canonicalReferenceAssetIds(
  role: CanonicalRole,
  assets: readonly CharacterAsset[],
  versionId: string,
): string[] {
  const face = anchor(assets, versionId, "face-front");
  if (role === "face-front") return face ? [face.id] : [];
  if (!face) throw new Error(`${role} 生成前缺少当前版本 face-front 身份锚点`);
  if (role === "body-front") return [face.id];
  const body = anchor(assets, versionId, "body-front");
  if (!body) throw new Error(`${role} 生成前缺少当前版本 body-front 身材与服装锚点`);
  return [face.id, body.id];
}

export function stressReferenceAssetIds(
  assets: readonly CharacterAsset[],
  versionId: string,
): string[] {
  const face = anchor(assets, versionId, "face-front");
  const body = anchor(assets, versionId, "body-front");
  if (!face) throw new Error("压力测试前缺少当前版本 face-front 身份锚点");
  if (!body) throw new Error("压力测试前缺少当前版本 body-front 身材与服装锚点");
  return [face.id, body.id];
}

export function nextCanonicalRoles(
  assets: readonly CharacterAsset[],
  versionId: string,
): CanonicalRole[] {
  const accepted = new Set(readyCanonicalAssets(assets, versionId).map((asset) => asset.role));
  if (!accepted.has("face-front")) return ["face-front"];
  if (!accepted.has("body-front")) return ["body-front"];
  return CANONICAL_ROLES.filter((role) =>
    role !== "face-front" && role !== "body-front" && !accepted.has(role));
}
