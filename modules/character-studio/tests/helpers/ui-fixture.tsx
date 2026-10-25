import type { AppState } from "../../client/App";
import type {
  ClientApi,
  GenerateAssetInput,
  SaveApprovedAssetInput,
} from "../../client/api";
import {
  CANONICAL_ROLES,
  STRESS_TEST_ROLES,
  type CharacterAsset,
  type GenerationRecipe,
} from "../../shared/asset-schema";
import { createDraftProject, createNextVersion, type CharacterProject } from "../../shared/project-schema";

export const TEST_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function makeRecipe(role: string): GenerationRecipe {
  return {
    compilerVersion: "1.0.0",
    templateId: `${role}-v1`,
    provider: "147",
    model: "gpt-image-2",
    size: "1024x1536",
    quality: "medium",
    referenceAssetIds: [],
    changeSet: {
      category: "identity",
      instruction: `测试锚点 ${role}`,
      sourceStateId: "source",
      targetStateId: "base",
    },
  };
}

export function adultPortraitFile(): File {
  const bytes = Uint8Array.from(atob(TEST_PNG_BASE64), (character) => character.charCodeAt(0));
  return new File([bytes], "adult.png", { type: "image/png" });
}

export function makeAppState(
  stage: AppState["stage"],
  project = createDraftProject({
    mode: "realistic-virtual-character",
    title: "Test Character",
    displayName: "Test Character",
  }),
): AppState {
  const needsCanonical = [
    "stress-testing",
    "version-locked",
    "asset-production",
    "export-ready",
  ].includes(stage);
  const assets: CharacterAsset[] = needsCanonical
    ? CANONICAL_ROLES.map((role, index) => ({
      id: `asset-${String(index + 1).padStart(12, "0")}`,
      versionId: "v1",
      role,
      stateId: "base",
      status: "ready",
      changeSet: {
        category: "identity",
        instruction: `测试锚点 ${role}`,
        sourceStateId: "source",
        targetStateId: "base",
      },
      recipe: makeRecipe(role),
    }))
    : [];
  project.assets = [...assets];
  project.versions[0].canonicalAssetIds = assets.map((asset) => asset.id);
  if (stage === "stress-testing") project.versions[0].status = "testing";
  if (["version-locked", "asset-production", "export-ready"].includes(stage)) {
    project.versions[0].status = "locked";
    project.versions[0].lockedAt = "2026-08-08T00:00:00.000Z";
    const parentAssetId = assets[0].id;
    const stressAssets = STRESS_TEST_ROLES.map((role, index): CharacterAsset => ({
      id: `asset-${String(index + 101).padStart(12, "0")}`,
      versionId: "v1",
      role,
      stateId: role,
      status: "ready",
      parentAssetId,
      changeSet: {
        category: role === "stress-lighting" ? "lighting" : role === "stress-angle" ? "camera" : "action",
        instruction: `测试 ${role}`,
        sourceStateId: "base",
        targetStateId: role,
      },
      recipe: {
        ...makeRecipe(role),
        parentAssetId,
        changeSet: {
          category: role === "stress-lighting" ? "lighting" : role === "stress-angle" ? "camera" : "action",
          instruction: `测试 ${role}`,
          sourceStateId: "base",
          targetStateId: role,
        },
      },
    }));
    project.assets.push(...stressAssets);
    project.versions[0].stressTests = stressAssets.map((asset) => ({
      role: asset.role as (typeof STRESS_TEST_ROLES)[number],
      passed: true,
      assetId: asset.id,
    }));
  }
  return {
    stage,
    project,
    assets: [...project.assets],
    references: [],
    apiKey: "sk-test",
    adultConsent: true,
    rightsConsent: true,
    pendingResults: [],
    selectedVersionId: "v1",
    error: "",
  };
}

export function createFakeClientApi() {
  const generateRequests: GenerateAssetInput[] = [];
  const saveRequests: SaveApprovedAssetInput[] = [];
  const reviewRequests: Parameters<ClientApi["reviewStress"]>[0][] = [];
  const projects = new Map<string, CharacterProject>();
  let assetSequence = 100;
  function ensureProject(projectId: string, locked = false): CharacterProject {
    const existing = projects.get(projectId);
    if (existing) return existing;
    const seeded = makeAppState(locked ? "version-locked" : "stress-testing").project!;
    seeded.id = projectId;
    seeded.versions[0].status = locked ? "locked" : "testing";
    projects.set(projectId, seeded);
    return seeded;
  }
  const api: ClientApi = {
    async validateKey() {
      return { valid: true, modelAvailable: true };
    },
    async createProject(input) {
      return createDraftProject(input);
    },
    async listProjects() {
      return [];
    },
    async readProject() {
      throw new Error("project not seeded by this fixture");
    },
    async generateAsset(input) {
      generateRequests.push(input);
      return {
        imageB64: TEST_PNG_BASE64,
        provider: "147",
        model: "gpt-image-2",
        size: "1024x1536",
        latencyMs: 10,
        recipe: {
          ...makeRecipe(input.assetRole),
          referenceAssetIds: [...input.referenceAssetIds],
          changeSet: { ...input.changeSet },
        },
      };
    },
    async saveApprovedAsset(input) {
      saveRequests.push(input);
      assetSequence += 1;
      return {
        id: `asset-${String(assetSequence).padStart(12, "0")}`,
        versionId: input.versionId,
        role: input.assetRole,
        stateId: input.stateId,
        status: "ready",
        ...(input.parentAssetId ? { parentAssetId: input.parentAssetId } : {}),
        changeSet: input.changeSet,
        recipe: input.recipe,
      };
    },
    async createIdentityVersion(projectId) {
      const next = createNextVersion(structuredClone(ensureProject(projectId, true)));
      projects.set(projectId, next);
      return next;
    },
    async reviewStress(input) {
      reviewRequests.push(input);
      const project = structuredClone(ensureProject(input.projectId));
      const version = project.versions.find((item) => item.id === input.versionId)!;
      version.stressTests = version.stressTests.filter((result) => result.role !== input.role);
      if (input.passed && input.assetId) {
        const saved = saveRequests.at(-1);
        const asset = saved ? {
          id: input.assetId,
          versionId: saved.versionId,
          role: saved.assetRole,
          stateId: saved.stateId,
          status: "ready" as const,
          ...(saved.parentAssetId ? { parentAssetId: saved.parentAssetId } : {}),
          changeSet: saved.changeSet,
          recipe: saved.recipe,
        } : undefined;
        if (asset) project.assets.push(asset);
        version.stressTests.push({ role: input.role, assetId: input.assetId, passed: true });
      }
      projects.set(input.projectId, project);
      return project;
    },
    async lockVersion(projectId, versionId) {
      const project = structuredClone(ensureProject(projectId));
      const version = project.versions.find((item) => item.id === versionId)!;
      version.status = "locked";
      version.lockedAt = new Date().toISOString();
      projects.set(projectId, project);
      return project;
    },
    async exportProject(_projectId, kind) {
      return { exportId: "export-000000000001", kind, relativeFiles: [] };
    },
  };
  return { api, generateRequests, saveRequests, reviewRequests };
}
