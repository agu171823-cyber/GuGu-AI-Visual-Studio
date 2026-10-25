import type { CharacterAsset } from "../shared/asset-schema";
import type { CharacterProject, CharacterVersion } from "../shared/project-schema";
import { CANONICAL_ROLE_LABELS } from "../shared/templates";
import type { BoardAssetInput } from "./board/layouts";

export type BoardAssetSelection = {
  assets: BoardAssetInput[];
  complete: boolean;
  missing: string[];
  expressionReady: number;
  expressionRequired: number;
  baseReady: number;
  baseRequired: number;
};

export const HUMAN_BOARD_ROLES = [
  "face-front",
  "body-front",
  "body-side",
  "body-back",
  "face-three-quarter",
] as const;

function assetUrl(projectId: string, assetId: string): string {
  return `/api/character/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`;
}

export function chooseBoardAssets(
  project: CharacterProject,
  version: CharacterVersion,
  assets: CharacterAsset[],
): BoardAssetSelection {
  const ready = assets.filter((asset) => asset.versionId === version.id && asset.status === "ready");
  const desired = project.mode === "human-model-card"
    ? HUMAN_BOARD_ROLES
    : ["face-front", "body-front", "body-side", "body-back"];
  const selected: CharacterAsset[] = [];
  const missing: string[] = [];
  for (const role of desired) {
    const asset = ready.find((item) => item.role === role);
    if (asset) selected.push(asset);
    else missing.push(role);
  }

  const baseReady = selected.length;
  const baseRequired = desired.length;
  let expressionReady = 0;
  const expressionRequired = project.mode === "realistic-virtual-character" ? 6 : 0;

  if (expressionRequired > 0) {
    const seenStates = new Set<string>();
    const expressions = ready.filter((asset) => {
      if (asset.role !== "expression" || seenStates.has(asset.stateId)) return false;
      seenStates.add(asset.stateId);
      return true;
    }).slice(0, expressionRequired);
    expressionReady = expressions.length;
    selected.push(...expressions);
    if (expressionReady < expressionRequired) {
      missing.push(`六种表情：已完成 ${expressionReady}/${expressionRequired}`);
    }
  }

  return {
    assets: selected.map((asset) => ({
      id: asset.id,
      role: asset.role,
      imageUrl: assetUrl(project.id, asset.id),
      label: asset.role === "face-three-quarter" ? CANONICAL_ROLE_LABELS[asset.role] : asset.role,
    })),
    complete: missing.length === 0,
    missing,
    expressionReady,
    expressionRequired,
    baseReady,
    baseRequired,
  };
}
