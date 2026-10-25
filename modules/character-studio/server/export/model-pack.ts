import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { CANONICAL_ROLES, CANONICAL_ROLE_LABELS, isCanonicalRole, isStressTestRole, type CanonicalRole } from "../../shared/templates";
import { canLockVersion } from "../../shared/project-schema";
import type { ProjectRegistry } from "../storage/project-registry";

export type AssembleModelPackInput = {
  projectId: string;
  versionId: string;
  includeBodyOnly: boolean;
};

export type ModelPackResult = {
  exportId: string;
  kind: "model-pack";
  directory: string;
  relativeFiles: string[];
};

function legacySquare(asset: { recipe: { size: string } }): boolean {
  return /^(\d+)x\1$/.test(asset.recipe.size);
}

function exportFileName(role: CanonicalRole, asset: { recipe: { size: string } }): string {
  if (role === "face-three-quarter") {
    return legacySquare(asset) ? "face-three-quarter-legacy.png" : "slight-side-half.png";
  }
  return `${role}.png`;
}

export async function assembleModelPack(
  input: AssembleModelPackInput,
  registry: ProjectRegistry,
  rootDir: string,
): Promise<ModelPackResult> {
  if (input.includeBodyOnly) {
    throw new Error("实验性身体裁切需在画板中手动选择裁切线后单独导出");
  }
  const project = await registry.readProject(input.projectId);
  const version = project.versions.find((item) => item.id === input.versionId);
  if (!version) throw new Error("角色版本不存在");
  if (version.status !== "locked" || !canLockVersion(version, project.assets)) {
    throw new Error("模型参考包只能从通过真实压力测试的锁定版本导出");
  }
  const files = await Promise.all(CANONICAL_ROLES.map(async (role) => {
    const asset = version.canonicalAssetIds
      .map((id) => project.assets.find((item) => item.id === id))
      .find((item) => item?.versionId === version.id && item.role === role && item.status === "ready");
    if (!asset) throw new Error(`模型参考包缺少规范资产：${role}`);
    const approved = await registry.readApprovedAsset(project.id, asset.id);
    if (approved.contentType !== "image/png") {
      throw new Error(`模型参考包固定 PNG 命名要求 PNG 源资产：${role}`);
    }
    return { role, asset, bytes: approved.bytes };
  }));

  const root = resolve(rootDir);
  await mkdir(root, { recursive: true });
  const safeTag = project.characterTag.replace(/^@/, "");
  const exportId = `${safeTag}-${version.id}-model-pack`;
  if (!/^[a-z0-9-]+-v[1-9]\d*-model-pack$/.test(exportId)) throw new Error("导出标识无效");
  const directory = join(root, exportId);
  await mkdir(directory, { recursive: false });

  const relativeFiles = [
    "character.json",
    "README.md",
    ...files.map(({ role, asset }) => exportFileName(role, asset)),
  ];
  const manifest = {
    schemaVersion: 1,
    characterTag: project.characterTag,
    displayName: project.displayName,
    mode: project.mode,
    versionId: version.id,
    versionStatus: version.status,
    immutableDescriptor: { visibleNotes: [...version.immutableDescriptor.visibleNotes] },
    stressTests: version.stressTests.map((result) => ({
      role: result.role,
      assetId: result.assetId,
      passed: result.passed,
      ...(result.reviewedAt ? { reviewedAt: result.reviewedAt } : {}),
    })),
    canonicalAssets: files.map(({ role, asset }) => ({
      role,
      displayName: role === "face-three-quarter" && legacySquare(asset)
        ? "微侧半身（旧版方图）" : CANONICAL_ROLE_LABELS[role],
      file: exportFileName(role, asset),
      assetId: asset.id,
      stateId: asset.stateId,
      provenance: {
        compilerVersion: asset.recipe.compilerVersion,
        templateId: asset.recipe.templateId,
        provider: asset.recipe.provider,
        model: asset.recipe.model,
      },
    })),
    derivedStates: project.assets
      .filter((asset) => asset.versionId === version.id && asset.parentAssetId
        && !isCanonicalRole(asset.role) && !isStressTestRole(asset.role))
      .map((asset) => ({
        assetId: asset.id,
        parentAssetId: asset.parentAssetId,
        role: asset.role,
        stateId: asset.stateId,
        changeCategory: asset.changeSet.category,
        provenance: {
          compilerVersion: asset.recipe.compilerVersion,
          templateId: asset.recipe.templateId,
          provider: asset.recipe.provider,
          model: asset.recipe.model,
        },
      })),
  };
  const readme = `# ${project.displayName} — Model Reference Pack\n\n`
    + `Character: ${project.characterTag}-${version.id}\n\n`
    + "## Reference order\n\n"
    + files.map(({ role, asset }, index) => {
      const label = role === "face-three-quarter" && legacySquare(asset)
        ? "微侧半身（旧版方图）" : CANONICAL_ROLE_LABELS[role];
      return `${index + 1}. ${exportFileName(role, asset)} — ${label}`;
    }).join("\n")
    + "\n\nFace anchors define facial identity; body views define proportion. Use the files in this order.\n\n"
    + "## Boundary\n\nOnly saved, user-approved assets are included. Original references are not copied. "
    + "The subject must be an adult or have an explicit adult appearance, and the operator must hold image/design rights.\n\n"
    + "## Experimental files\n\nBody-only crops are manual, opt-in experiments and are not included in this pack.\n";

  try {
    await writeFile(join(directory, "character.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
    await writeFile(join(directory, "README.md"), readme, { flag: "wx" });
    for (const file of files) {
      await writeFile(join(directory, exportFileName(file.role, file.asset)), file.bytes, { flag: "wx" });
    }
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  return { exportId, kind: "model-pack", directory, relativeFiles };
}
