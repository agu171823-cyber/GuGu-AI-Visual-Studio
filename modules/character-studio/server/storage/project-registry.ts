import {
  mkdir,
  readFile,
  readdir,
  rename as fsRename,
  rm,
  writeFile,
} from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import type {
  CharacterAsset,
  GenerationRecipe,
} from "../../shared/asset-schema";
import {
  canLockVersion,
  createNextVersion,
  createDraftProject,
  validateCharacterProject,
  type CharacterProject,
  type CreateDraftProjectInput,
} from "../../shared/project-schema";
import {
  isAssetRole,
  isCanonicalRole,
  isStressTestRole,
  type AssetRole,
  type StressTestRole,
} from "../../shared/templates";
import { assertAssetOperation, hasCompleteCanonicalSet } from "../domain/asset-policy";

const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const PROJECT_ID = /^project-[a-f0-9]{12}$/;
const ASSET_ID = /^asset-[a-f0-9]{12}$/;

export type SaveApprovedAssetInput = {
  projectId: string;
  versionId: string;
  assetRole: AssetRole;
  stateId: string;
  imageB64: string;
  parentAssetId?: string;
  recipe: GenerationRecipe;
};

export type ApprovedAssetFile = {
  asset: CharacterAsset;
  bytes: Buffer;
  contentType: "image/png" | "image/jpeg";
};

export type ProjectRegistry = {
  createProject(input: CreateDraftProjectInput): Promise<CharacterProject>;
  saveProject(project: CharacterProject): Promise<void>;
  readProject(id: string): Promise<CharacterProject>;
  listProjects(): Promise<CharacterProject[]>;
  saveApprovedAsset(input: SaveApprovedAssetInput): Promise<CharacterAsset>;
  readApprovedAsset(projectId: string, assetId: string): Promise<ApprovedAssetFile>;
  createIdentityVersion(projectId: string): Promise<CharacterProject>;
  recordStressReview(input: {
    projectId: string;
    versionId: string;
    role: StressTestRole;
    assetId?: string;
    passed: boolean;
  }): Promise<CharacterProject>;
  lockVersion(projectId: string, versionId: string): Promise<CharacterProject>;
};

export type ProjectRegistryDependencies = {
  rename?: (from: string, to: string) => Promise<void>;
};

function randomHex(length: number): string {
  return randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function assertProjectId(id: string): void {
  if (!PROJECT_ID.test(id)) throw new Error("项目 ID 无效");
}

function assertAssetId(id: string): void {
  if (!ASSET_ID.test(id)) throw new Error("资产 ID 无效");
}

function assertSafeStateId(value: string): string {
  const stateId = value.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(stateId)) {
    throw new Error("状态 ID 无效");
  }
  return stateId;
}

function detectImage(bytes: Buffer): { extension: "png" | "jpg"; contentType: "image/png" | "image/jpeg" } {
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("图片解码后不得超过 30 MB");
  if (
    bytes.length >= 8
    && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { extension: "png", contentType: "image/png" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  throw new Error("批准资产必须是 PNG 或 JPEG 图片");
}

function decodeImage(imageB64: string): Buffer {
  if (!imageB64 || imageB64.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 16) {
    throw new Error("图片数据为空或过大");
  }
  const bytes = Buffer.from(imageB64, "base64");
  detectImage(bytes);
  return bytes;
}

function safeRecipe(recipe: GenerationRecipe, parentAssetId?: string): GenerationRecipe {
  return {
    compilerVersion: recipe.compilerVersion,
    templateId: recipe.templateId,
    provider: recipe.provider,
    model: recipe.model,
    size: recipe.size,
    quality: recipe.quality,
    referenceAssetIds: [...recipe.referenceAssetIds],
    ...(parentAssetId ? { parentAssetId } : {}),
    changeSet: { ...recipe.changeSet },
    ...(typeof recipe.latencyMs === "number" ? { latencyMs: recipe.latencyMs } : {}),
    ...(recipe.completedAt ? { completedAt: recipe.completedAt } : {}),
  };
}

async function atomicWrite(
  target: string,
  contents: string | Buffer,
  rename: (from: string, to: string) => Promise<void>,
  verify: (temporaryPath: string) => Promise<void>,
): Promise<void> {
  const temporaryPath = `${target}.tmp-${randomHex(12)}`;
  await mkdir(dirname(target), { recursive: true });
  try {
    await writeFile(temporaryPath, contents, { flag: "wx" });
    await verify(temporaryPath);
    await rename(temporaryPath, target);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export function createProjectRegistry(
  rootDir: string,
  dependencies: ProjectRegistryDependencies = {},
): ProjectRegistry {
  const root = resolve(rootDir);
  const rename = dependencies.rename ?? fsRename;
  const mutationTails = new Map<string, Promise<void>>();
  async function withProjectMutation<T>(projectId: string, operation: () => Promise<T>): Promise<T> {
    const previous = mutationTails.get(projectId) ?? Promise.resolve();
    let release: () => void = () => {};
    const current = new Promise<void>((resolveTail) => { release = resolveTail; });
    mutationTails.set(projectId, current);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (mutationTails.get(projectId) === current) mutationTails.delete(projectId);
    }
  }
  const projectDirectory = (projectId: string): string => {
    assertProjectId(projectId);
    return join(root, projectId);
  };
  const manifestPath = (projectId: string): string => join(projectDirectory(projectId), "project.json");

  async function saveProject(project: CharacterProject): Promise<void> {
    const errors = validateCharacterProject(project);
    if (errors.length) throw new Error(`项目数据无效：${errors.join("；")}`);
    assertProjectId(project.id);
    const serialized = `${JSON.stringify(project, null, 2)}\n`;
    await atomicWrite(manifestPath(project.id), serialized, rename, async (temporaryPath) => {
      const parsed = JSON.parse(await readFile(temporaryPath, "utf8")) as unknown;
      const temporaryErrors = validateCharacterProject(parsed);
      if (temporaryErrors.length) throw new Error(`临时项目校验失败：${temporaryErrors.join("；")}`);
    });
  }

  async function readProject(id: string): Promise<CharacterProject> {
    assertProjectId(id);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(manifestPath(id), "utf8")) as unknown;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("项目不存在");
      throw error;
    }
    const errors = validateCharacterProject(parsed);
    if (errors.length) throw new Error(`项目数据损坏：${errors.join("；")}`);
    return parsed as CharacterProject;
  }

  async function createProject(input: CreateDraftProjectInput): Promise<CharacterProject> {
    await mkdir(root, { recursive: true });
    const project = createDraftProject(input);
    await saveProject(project);
    return project;
  }

  async function listProjects(): Promise<CharacterProject[]> {
    await mkdir(root, { recursive: true });
    const entries = await readdir(root, { withFileTypes: true });
    const projects = await Promise.all(entries
      .filter((entry) => entry.isDirectory() && PROJECT_ID.test(entry.name))
      .map(async (entry) => {
        try {
          return await readProject(entry.name);
        } catch {
          return undefined;
        }
      }));
    return projects
      .filter((project): project is CharacterProject => Boolean(project))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async function saveApprovedAssetUnlocked(input: SaveApprovedAssetInput): Promise<CharacterAsset> {
    assertProjectId(input.projectId);
    if (!isAssetRole(input.assetRole)) throw new Error("资产角色无效");
    const stateId = assertSafeStateId(input.stateId);
    const project = await readProject(input.projectId);
    const version = project.versions.find((item) => item.id === input.versionId);
    if (!version) throw new Error("角色版本不存在");
    if (input.recipe.changeSet.targetStateId !== stateId) {
      throw new Error("资产状态 ID 与生成配方目标状态不一致");
    }
    const isDerived = !isCanonicalRole(input.assetRole) && !isStressTestRole(input.assetRole);
    let parentAsset: CharacterAsset | undefined;
    if (input.parentAssetId) {
      assertAssetId(input.parentAssetId);
      parentAsset = project.assets.find((asset) => asset.id === input.parentAssetId);
      if (!parentAsset || parentAsset.status !== "ready") throw new Error("父资产不存在或不可用");
    }
    assertAssetOperation({
      project,
      version,
      role: input.assetRole,
      changeSet: input.recipe.changeSet,
      ...(input.parentAssetId ? { parentAssetId: input.parentAssetId } : {}),
      referenceAssetIds: input.recipe.referenceAssetIds,
    });

    const bytes = decodeImage(input.imageB64);
    const image = detectImage(bytes);
    const assetId = `asset-${randomHex(12)}`;
    const fileName = `assets/${assetId}.${image.extension}`;
    const target = join(projectDirectory(input.projectId), ...fileName.split("/"));
    const now = new Date().toISOString();
    const recipe = safeRecipe({ ...input.recipe, completedAt: input.recipe.completedAt ?? now }, input.parentAssetId);
    const asset: CharacterAsset = {
      id: assetId,
      versionId: input.versionId,
      role: input.assetRole,
      stateId,
      status: "ready",
      ...(input.parentAssetId ? { parentAssetId: input.parentAssetId } : {}),
      changeSet: { ...recipe.changeSet },
      fileName,
      recipe,
    };

    await atomicWrite(target, bytes, rename, async (temporaryPath) => {
      detectImage(await readFile(temporaryPath));
    });
    try {
      project.assets.push(asset);
      if (isCanonicalRole(asset.role) && !version.canonicalAssetIds.includes(asset.id)) {
        version.canonicalAssetIds.push(asset.id);
        if (hasCompleteCanonicalSet(version, project.assets)) version.status = "testing";
      }
      if (isDerived && !version.derivedStateIds.includes(stateId)) {
        version.derivedStateIds.push(stateId);
      }
      project.updatedAt = now;
      await saveProject(project);
    } catch (error) {
      await rm(target, { force: true });
      throw error;
    }
    return asset;
  }

  async function saveApprovedAsset(input: SaveApprovedAssetInput): Promise<CharacterAsset> {
    return withProjectMutation(input.projectId, () => saveApprovedAssetUnlocked(input));
  }

  async function createIdentityVersion(projectId: string): Promise<CharacterProject> {
    assertProjectId(projectId);
    return withProjectMutation(projectId, async () => {
      const next = createNextVersion(await readProject(projectId));
      await saveProject(next);
      return next;
    });
  }

  async function recordStressReview(input: {
    projectId: string;
    versionId: string;
    role: StressTestRole;
    assetId?: string;
    passed: boolean;
  }): Promise<CharacterProject> {
    assertProjectId(input.projectId);
    return withProjectMutation(input.projectId, async () => {
      const project = await readProject(input.projectId);
      const version = project.versions.find((item) => item.id === input.versionId);
      if (!version || version.id !== project.currentVersionId) throw new Error("只能审核当前角色版本");
      if (version.status !== "testing") throw new Error("只有 testing 版本可以记录压力测试");
      version.stressTests = version.stressTests.filter((result) => result.role !== input.role);
      if (input.passed) {
        const asset = project.assets.find((item) => item.id === input.assetId);
        if (!asset || asset.versionId !== version.id || asset.role !== input.role || asset.status !== "ready") {
          throw new Error("压力测试必须引用同版本、同角色的可用批准资产");
        }
        version.stressTests.push({
          role: input.role,
          assetId: asset.id,
          passed: true,
          reviewedAt: new Date().toISOString(),
        });
      }
      project.updatedAt = new Date().toISOString();
      await saveProject(project);
      return project;
    });
  }

  async function lockVersion(projectId: string, versionId: string): Promise<CharacterProject> {
    assertProjectId(projectId);
    return withProjectMutation(projectId, async () => {
      const project = await readProject(projectId);
      const version = project.versions.find((item) => item.id === versionId);
      if (!version || version.id !== project.currentVersionId) throw new Error("只能锁定当前角色版本");
      if (version.status !== "testing" || !canLockVersion(version, project.assets)) {
        throw new Error("规范资产和真实压力测试未全部通过，不能锁定版本");
      }
      version.status = "locked";
      version.lockedAt = new Date().toISOString();
      if (version.createdFromVersionId) {
        const previous = project.versions.find((item) => item.id === version.createdFromVersionId);
        if (previous?.status === "locked") previous.status = "superseded";
      }
      project.updatedAt = version.lockedAt;
      await saveProject(project);
      return project;
    });
  }

  async function readApprovedAsset(projectId: string, assetId: string): Promise<ApprovedAssetFile> {
    assertProjectId(projectId);
    assertAssetId(assetId);
    const project = await readProject(projectId);
    const asset = project.assets.find((item) => item.id === assetId && item.status === "ready");
    if (!asset?.fileName) throw new Error("批准资产不存在");
    const expectedPrefix = `assets/${assetId}.`;
    if (!asset.fileName.startsWith(expectedPrefix) || !/\.(png|jpg)$/.test(asset.fileName)) {
      throw new Error("资产文件路径无效");
    }
    const bytes = await readFile(join(projectDirectory(projectId), ...asset.fileName.split("/")));
    const image = detectImage(bytes);
    return { asset, bytes, contentType: image.contentType };
  }

  return {
    createProject,
    saveProject,
    readProject,
    listProjects,
    saveApprovedAsset,
    readApprovedAsset,
    createIdentityVersion,
    recordStressReview,
    lockVersion,
  };
}
