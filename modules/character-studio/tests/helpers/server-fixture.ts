import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../../server/app";
import type {
  EditImageInput,
  ImageProvider,
} from "../../server/providers/provider";
import {
  createProjectRegistry,
  type ProjectRegistry,
} from "../../server/storage/project-registry";
import type { CharacterProject } from "../../shared/project-schema";
import type { AssetRole } from "../../shared/templates";
import { CANONICAL_ROLES, STRESS_TEST_ROLES, isStressTestRole } from "../../shared/templates";

export const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export async function createApiTestFixture() {
  const root = await mkdtemp(join(tmpdir(), "character-api-"));
  const registry = createProjectRegistry(root);
  const providerCalls: EditImageInput[] = [];
  const provider: ImageProvider = {
    async validateKey() {
      return { valid: true, modelAvailable: true };
    },
    async editImage(input) {
      providerCalls.push(input);
      return {
        imageB64: PNG_BASE64,
        provider: "147",
        model: input.model,
        size: input.size,
        latencyMs: 10,
      };
    },
  };
  const project = await registry.createProject({
    mode: "human-model-card",
    title: "Test",
    displayName: "Test",
  });
  return {
    app: createApp({ provider, projectRegistry: registry }),
    project,
    registry,
    providerCalls,
  };
}

export async function seedApprovedAsset(
  registry: ProjectRegistry,
  project: CharacterProject,
  role: AssetRole,
  versionId = "v1",
) {
  const stress = isStressTestRole(role);
  const derived = role === "wardrobe-state";
  const current = await registry.readProject(project.id);
  const face = current.assets.find((asset) =>
    asset.versionId === versionId && asset.status === "ready" && asset.role === "face-front");
  const body = current.assets.find((asset) =>
    asset.versionId === versionId && asset.status === "ready" && asset.role === "body-front");
  const parentAssetId = stress ? face?.id : derived ? (body ?? face)?.id : undefined;
  const laterCanonical = ["face-three-quarter", "body-side", "body-back", "half-neutral"].includes(role);
  const referenceAssetIds = Array.from(new Set([
    ...(role === "body-front" ? [face?.id] : []),
    ...(laterCanonical || stress || derived ? [face?.id, body?.id] : []),
    ...(parentAssetId ? [parentAssetId] : []),
  ].filter((id): id is string => Boolean(id))));
  const category = stress
    ? role === "stress-lighting" ? "lighting" : role === "stress-angle" ? "camera" : "action"
    : derived ? "wardrobe" : "identity";
  return registry.saveApprovedAsset({
    projectId: project.id,
    versionId,
    assetRole: role,
    stateId: stress ? role : derived ? "wardrobe-test" : "base",
    imageB64: PNG_BASE64,
    ...(parentAssetId ? { parentAssetId } : {}),
    recipe: {
      compilerVersion: "1.0.0",
      templateId: `${role}-v1`,
      provider: "147",
      model: "gpt-image-2",
      size: "1024x1536",
      quality: "medium",
      referenceAssetIds,
      ...(parentAssetId ? { parentAssetId } : {}),
      changeSet: {
        category,
        instruction: `测试资产 ${role}`,
        sourceStateId: "base",
        targetStateId: stress ? role : derived ? "wardrobe-test" : "base",
      },
    },
  });
}

export async function seedLockedProject(
  registry: ProjectRegistry,
  project: CharacterProject,
  versionId = "v1",
): Promise<CharacterProject> {
  let current = await registry.readProject(project.id);
  const canonicalSeedOrder = [
    "face-front",
    "body-front",
    "face-three-quarter",
    "body-side",
    "body-back",
    "half-neutral",
  ] as const;
  for (const role of canonicalSeedOrder) {
    if (!current.assets.some((asset) => asset.role === role && asset.versionId === versionId)) {
      await seedApprovedAsset(registry, project, role, versionId);
      current = await registry.readProject(project.id);
    }
  }
  for (const role of STRESS_TEST_ROLES) {
    const asset = await seedApprovedAsset(registry, project, role, versionId);
    await registry.recordStressReview({
      projectId: project.id,
      versionId,
      role,
      assetId: asset.id,
      passed: true,
    });
  }
  return registry.lockVersion(project.id, versionId);
}

export function validGenerateForm(
  projectId: string,
  input: { referenceAssetIds?: string[] } = {},
): FormData {
  const form = new FormData();
  form.set("projectId", projectId);
  form.set("versionId", "v1");
  form.set("assetRole", "custom");
  form.set("adultConsent", "true");
  form.set("rightsConsent", "true");
  form.set("apiKey", "sk-test");
  form.set("baseUrl", "https://147ai.com/v1");
  form.set("model", "gpt-image-2");
  form.set("size", "1024x1536");
  form.set("quality", "medium");
  form.set("referenceAssetIds", JSON.stringify(input.referenceAssetIds ?? []));
  form.set("changeSet", JSON.stringify({
    category: "camera",
    instruction: "测试不同机位",
    sourceStateId: "base",
    targetStateId: "camera-test",
  }));
  return form;
}
