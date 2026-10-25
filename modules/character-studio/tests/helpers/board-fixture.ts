import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BoardAssetInput } from "../../client/board/layouts";
import { createProjectRegistry } from "../../server/storage/project-registry";
import { PNG_BASE64, seedLockedProject } from "./server-fixture";

function boardAsset(role: string, index: number): BoardAssetInput {
  return {
    id: `asset-${String(index + 1).padStart(12, "0")}`,
    role,
    imageUrl: `data:image/png;base64,${PNG_BASE64}`,
    label: role,
  };
}

export const fiveHumanAssets = [
  "face-front",
  "body-front",
  "body-side",
  "body-back",
  "face-three-quarter",
].map(boardAsset);

export const virtualAssets = [
  "face-front",
  "body-front",
  "body-side",
  "body-back",
  "expression",
  "expression",
  "expression",
  "expression",
  "expression",
  "expression",
].map(boardAsset);

export async function createBoardExportFixture() {
  const root = await mkdtemp(join(tmpdir(), "character-board-"));
  const registry = createProjectRegistry(root);
  const project = await registry.createProject({
    mode: "realistic-virtual-character",
    title: "Board Test",
    displayName: "Board Test",
  });
  await seedLockedProject(registry, project);
  return {
    root,
    registry,
    project,
    exportRoot: join(root, project.id, "exports"),
  };
}
