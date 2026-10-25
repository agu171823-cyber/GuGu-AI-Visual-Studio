import { mkdtemp, readFile, readdir, rename } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProjectRegistry } from "../server/storage/project-registry";
import { seedLockedProject } from "./helpers/server-fixture";

const pngHeader = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function identityRecipe() {
  return {
    compilerVersion: "1.0.0",
    templateId: "face-front-v1",
    provider: "147" as const,
    model: "gpt-image-2",
    size: "1024x1536" as const,
    quality: "medium" as const,
    referenceAssetIds: [],
    changeSet: {
      category: "identity" as const,
      instruction: "建立标准脸部锚点",
      sourceStateId: "source",
      targetStateId: "base",
    },
  };
}

describe("project registry", () => {
  it("writes only approved generated assets and a safe project manifest", async () => {
    const root = await mkdtemp(join(tmpdir(), "character-projects-"));
    const registry = createProjectRegistry(root);
    const project = await registry.createProject({
      mode: "human-model-card",
      title: "Model A",
      displayName: "Model A",
    });

    const asset = await registry.saveApprovedAsset({
      projectId: project.id,
      versionId: "v1",
      assetRole: "face-front",
      stateId: "base",
      imageB64: pngHeader.toString("base64"),
      recipe: identityRecipe(),
    });

    expect(asset.id).toMatch(/^asset-[a-f0-9]{12}$/);
    const files = await readdir(join(root, project.id), { recursive: true });
    expect(files.join("\n")).not.toMatch(/reference|original|upload/i);
    const manifest = await readFile(join(root, project.id, "project.json"), "utf8");
    expect(manifest).not.toMatch(/apiKey|prompt|authorization/i);
    expect(manifest).toContain(asset.id);

    const saved = await registry.readApprovedAsset(project.id, asset.id);
    expect(saved.contentType).toBe("image/png");
    expect(saved.bytes).toEqual(pngHeader);
  });

  it("rejects path traversal, unknown roles, and non-image bytes", async () => {
    const root = await mkdtemp(join(tmpdir(), "character-projects-"));
    const registry = createProjectRegistry(root);
    const project = await registry.createProject({
      mode: "human-model-card",
      title: "Model A",
      displayName: "Model A",
    });

    await expect(registry.readProject("../escape")).rejects.toThrow(/项目 ID/);
    await expect(registry.saveApprovedAsset({
      projectId: project.id,
      versionId: "v1",
      assetRole: "not-a-role" as "face-front",
      stateId: "base",
      imageB64: pngHeader.toString("base64"),
      recipe: identityRecipe(),
    })).rejects.toThrow(/资产角色/);
    await expect(registry.saveApprovedAsset({
      projectId: project.id,
      versionId: "v1",
      assetRole: "face-front",
      stateId: "base",
      imageB64: Buffer.from("not an image").toString("base64"),
      recipe: identityRecipe(),
    })).rejects.toThrow(/PNG 或 JPEG/);
  });

  it("preserves the last valid manifest when an atomic rename fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "character-projects-"));
    const registry = createProjectRegistry(root);
    const project = await registry.createProject({
      mode: "realistic-virtual-character",
      title: "Lin",
      displayName: "Lin",
    });
    const before = await readFile(join(root, project.id, "project.json"), "utf8");
    const failingRegistry = createProjectRegistry(root, {
      rename: async (from, to) => {
        if (to.endsWith("project.json")) throw new Error("simulated rename failure");
        await rename(from, to);
      },
    });
    const changed = { ...project, title: "Changed" };

    await expect(failingRegistry.saveProject(changed)).rejects.toThrow("simulated rename failure");
    expect(await readFile(join(root, project.id, "project.json"), "utf8")).toBe(before);
    const files = await readdir(join(root, project.id));
    expect(files.some((file) => file.startsWith("project.json.tmp-"))).toBe(false);
  });

  it("lists projects by most recently updated", async () => {
    const root = await mkdtemp(join(tmpdir(), "character-projects-"));
    const registry = createProjectRegistry(root);
    const first = await registry.createProject({
      mode: "human-model-card",
      title: "First",
      displayName: "First",
    });
    const second = await registry.createProject({
      mode: "realistic-virtual-character",
      title: "Second",
      displayName: "Second",
    });

    const projects = await registry.listProjects();
    expect(new Set(projects.map((project) => project.id))).toEqual(new Set([first.id, second.id]));
  });

  it("serializes concurrent asset acceptance without losing manifest updates", async () => {
    const root = await mkdtemp(join(tmpdir(), "character-projects-"));
    const registry = createProjectRegistry(root);
    const project = await registry.createProject({
      mode: "human-model-card",
      title: "Concurrent",
      displayName: "Concurrent",
    });
    const recipe = identityRecipe();

    const face = await registry.saveApprovedAsset({
      projectId: project.id,
      versionId: "v1",
      assetRole: "face-front",
      stateId: "base",
      imageB64: pngHeader.toString("base64"),
      recipe,
    });
    const body = await registry.saveApprovedAsset({
      projectId: project.id,
      versionId: "v1",
      assetRole: "body-front",
      stateId: "base",
      imageB64: pngHeader.toString("base64"),
      recipe: { ...recipe, templateId: "body-front-v1", referenceAssetIds: [face.id] },
    });
    const anchorIds = [face.id, body.id];

    await Promise.all([
      registry.saveApprovedAsset({
        projectId: project.id,
        versionId: "v1",
        assetRole: "face-three-quarter",
        stateId: "base",
        imageB64: pngHeader.toString("base64"),
        recipe: { ...recipe, templateId: "face-three-quarter-v1", referenceAssetIds: anchorIds },
      }),
      registry.saveApprovedAsset({
        projectId: project.id,
        versionId: "v1",
        assetRole: "body-side",
        stateId: "base",
        imageB64: pngHeader.toString("base64"),
        recipe: { ...recipe, templateId: "body-side-v1", referenceAssetIds: anchorIds },
      }),
    ]);

    const saved = await registry.readProject(project.id);
    expect(saved.assets.map((asset) => asset.role).sort()).toEqual([
      "body-front",
      "body-side",
      "face-front",
      "face-three-quarter",
    ]);
    expect(saved.versions[0].canonicalAssetIds).toHaveLength(4);
  });

  it("rejects cross-version parents even when both versions are locked", async () => {
    const root = await mkdtemp(join(tmpdir(), "character-projects-"));
    const registry = createProjectRegistry(root);
    const project = await registry.createProject({
      mode: "realistic-virtual-character",
      title: "Lineage",
      displayName: "Lineage",
    });
    await seedLockedProject(registry, project, "v1");
    await registry.createIdentityVersion(project.id);
    await seedLockedProject(registry, project, "v2");
    const current = await registry.readProject(project.id);
    const oldParent = current.assets.find((asset) =>
      asset.versionId === "v1" && asset.role === "body-front")!;

    await expect(registry.saveApprovedAsset({
      projectId: project.id,
      versionId: "v2",
      assetRole: "wardrobe-state",
      stateId: "wardrobe-cross-version",
      parentAssetId: oldParent.id,
      imageB64: pngHeader.toString("base64"),
      recipe: {
        ...identityRecipe(),
        templateId: "wardrobe-state-v1",
        parentAssetId: oldParent.id,
        referenceAssetIds: [oldParent.id],
        changeSet: {
          category: "wardrobe",
          instruction: "米白色西装",
          sourceStateId: "base",
          targetStateId: "wardrobe-cross-version",
        },
      },
    })).rejects.toThrow(/同版本/);
  });
});
