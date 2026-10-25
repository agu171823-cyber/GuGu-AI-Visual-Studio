import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { clampBodyCropRatio } from "../client/board/body-only";
import {
  buildHumanModelCardLayout,
  buildVirtualCharacterLayout,
} from "../client/board/layouts";
import { calculateContainRect, calculateCoverCrop, renderBoard } from "../client/board/render";
import { chooseBoardAssets } from "../client/delivery-readiness";
import type { CharacterAsset } from "../shared/asset-schema";
import { createDraftProject } from "../shared/project-schema";
import { assembleModelPack } from "../server/export/model-pack";
import { createApp } from "../server/app";
import {
  createBoardExportFixture,
  fiveHumanAssets,
  virtualAssets,
} from "./helpers/board-fixture";
import { seedApprovedAsset } from "./helpers/server-fixture";

describe("display boards and model reference pack", () => {
  it("does not let unrelated ready assets fill required board slots", () => {
    const project = createDraftProject({
      mode: "realistic-virtual-character",
      title: "Strict Slots",
      displayName: "Strict Slots",
    });
    const version = project.versions[0];
    const roles = [
      "face-front",
      "body-front",
      "body-side",
      "body-back",
      "expression",
      "expression",
      "expression",
      "expression",
      "expression",
      "stress-lighting",
    ] as const;
    const assets = roles.map((role, index): CharacterAsset => ({
      id: `asset-${String(index + 1).padStart(12, "0")}`,
      versionId: "v1",
      role,
      stateId: role === "expression" ? `expression-${index}` : role,
      status: "ready",
      changeSet: {
        category: role === "expression" ? "expression" : role === "stress-lighting" ? "lighting" : "identity",
        instruction: `test ${role}`,
        sourceStateId: "base",
        targetStateId: role === "expression" ? `expression-${index}` : role,
      },
      recipe: {
        compilerVersion: "1.0.0",
        templateId: `${role}-v1`,
        provider: "147",
        model: "gpt-image-2",
        size: "1024x1536",
        quality: "medium",
        referenceAssetIds: [],
        changeSet: {
          category: role === "expression" ? "expression" : role === "stress-lighting" ? "lighting" : "identity",
          instruction: `test ${role}`,
          sourceStateId: "base",
          targetStateId: role === "expression" ? `expression-${index}` : role,
        },
      },
    }));

    const selection = chooseBoardAssets(project, version, assets);
    expect(selection).toMatchObject({
      complete: false,
      baseReady: 4,
      baseRequired: 4,
      expressionReady: 5,
      expressionRequired: 6,
    });
    expect(selection.assets).toHaveLength(9);
    expect(selection.missing).toContain("六种表情：已完成 5/6");
    expect(selection.assets.some((asset) => asset.role === "stress-lighting")).toBe(false);
  });

  it("counts only unique ready expressions from the current version", () => {
    const project = createDraftProject({
      mode: "realistic-virtual-character",
      title: "Expression Progress",
      displayName: "Expression Progress",
    });
    const version = project.versions[0];
    const makeExpression = (
      id: string,
      stateId: string,
      versionId = "v1",
      status: CharacterAsset["status"] = "ready",
    ): CharacterAsset => ({
      id,
      versionId,
      role: "expression",
      stateId,
      status,
      changeSet: {
        category: "expression",
        instruction: stateId,
        sourceStateId: "base",
        targetStateId: stateId,
      },
      recipe: {
        compilerVersion: "1.0.0",
        templateId: "expression-v1",
        provider: "147",
        model: "gpt-image-2",
        size: "1024x1536",
        quality: "medium",
        referenceAssetIds: [],
        changeSet: {
          category: "expression",
          instruction: stateId,
          sourceStateId: "base",
          targetStateId: stateId,
        },
      },
    });
    const assets = [
      makeExpression("asset-000000000201", "expression-neutral"),
      makeExpression("asset-000000000202", "expression-neutral"),
      makeExpression("asset-000000000203", "expression-smile", "v0"),
      makeExpression("asset-000000000204", "expression-focused", "v1", "failed"),
    ];

    const selection = chooseBoardAssets(project, version, assets);

    expect(selection.expressionReady).toBe(1);
    expect(selection.missing).toContain("六种表情：已完成 1/6");
  });

  it("builds exact board dimensions without network calls", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const human = buildHumanModelCardLayout({
      assets: fiveHumanAssets,
      showProfile: false,
      displayName: "Mina",
      profile: { heightCm: 178, contact: "private@example.test" },
    });
    const virtual = buildVirtualCharacterLayout({
      assets: virtualAssets,
      displayName: "Lin",
      characterTag: "@lin-v1",
      stateLabels: ["BASE", "BUSINESS"],
    });

    expect(human).toMatchObject({ width: 2480, height: 3508 });
    expect(human.images.map((slot) => slot.fit)).toEqual([
      "contain", "contain", "contain", "contain", "contain",
    ]);
    expect(virtual).toMatchObject({ width: 3072, height: 2048 });
    expect(virtual.images).toHaveLength(10);
    expect(human.text.map((item) => item.value).join(" ")).not.toMatch(/178|private@example/);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("uses unique canonical split assets for a human model card, including the back view", () => {
    const project = createDraftProject({
      mode: "human-model-card",
      title: "Canonical Board",
      displayName: "Canonical Board",
    });
    const version = project.versions[0];
    const roles = [
      "model-card-natural",
      "face-three-quarter",
      "body-back",
      "body-side",
      "body-front",
      "face-front",
      "model-card-half",
    ] as const;
    const assets = roles.map((role, index): CharacterAsset => ({
      id: `asset-${String(index + 1).padStart(12, "0")}`,
      versionId: version.id,
      role,
      stateId: role,
      status: "ready",
      changeSet: {
        category: "identity",
        instruction: role,
        sourceStateId: "base",
        targetStateId: role,
      },
      recipe: {
        compilerVersion: "1.0.0",
        templateId: `${role}-v1`,
        provider: "147",
        model: "gpt-image-2",
        size: "1024x1536",
        quality: "medium",
        referenceAssetIds: [],
        changeSet: {
          category: "identity",
          instruction: role,
          sourceStateId: "base",
          targetStateId: role,
        },
      },
    }));

    const selection = chooseBoardAssets(project, version, assets);

    expect(selection.complete).toBe(true);
    expect(selection.assets.map((asset) => asset.role)).toEqual([
      "face-front",
      "body-front",
      "body-side",
      "body-back",
      "face-three-quarter",
    ]);
    expect(selection.assets.find((asset) => asset.role === "face-three-quarter")?.label).toBe("微侧半身");
    expect(new Set(selection.assets.map((asset) => asset.id)).size).toBe(5);
    expect(selection.assets.some((asset) => asset.role.startsWith("model-card-"))).toBe(false);
  });

  it("focuses virtual expression slots toward the face without changing base slots", () => {
    const layout = buildVirtualCharacterLayout({
      assets: virtualAssets,
      displayName: "Lin",
      characterTag: "@lin-v1",
      stateLabels: ["BASE"],
    });

    expect(layout.images.slice(0, 4).every((slot) => slot.focusY === undefined)).toBe(true);
    expect(layout.images.slice(4).map((slot) => slot.focusY)).toEqual([
      0.12, 0.12, 0.12, 0.12, 0.12, 0.12,
    ]);
  });

  it("moves a portrait cover crop upward for expression faces", () => {
    expect(calculateCoverCrop(1024, 1536, 540, 450, 0.5)).toEqual({
      sourceX: 0,
      sourceY: 342,
      sourceWidth: 1024,
      sourceHeight: 853,
    });
    expect(calculateCoverCrop(1024, 1536, 540, 450, 0.12)).toEqual({
      sourceX: 0,
      sourceY: 82,
      sourceWidth: 1024,
      sourceHeight: 853,
    });
  });

  it("fits the full source image inside a model-card frame without cropping", () => {
    expect(calculateContainRect(100, 200, 200, 200)).toEqual({
      x: 50,
      y: 0,
      width: 100,
      height: 200,
    });
    expect(calculateContainRect(200, 100, 200, 200)).toEqual({
      x: 0,
      y: 50,
      width: 200,
      height: 100,
    });
  });

  it("renders a contained model-card asset from the complete source image above its label", async () => {
    const drawImage = vi.fn();
    const context = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      font: "",
      textAlign: "left",
      fillRect: vi.fn(),
      save: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      restore: vi.fn(),
      drawImage,
      strokeRect: vi.fn(),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const image = { width: 100, height: 200 } as unknown as CanvasImageSource;

    await renderBoard(canvas, {
      kind: "human-comp-card",
      width: 200,
      height: 254,
      background: "#fff",
      accent: "#000",
      images: [{
        assetId: "asset-body-back",
        imageUrl: "body-back.png",
        label: "body-back",
        x: 0,
        y: 0,
        width: 200,
        height: 254,
        fit: "contain",
      }],
      text: [],
    }, async () => image);

    expect(drawImage).toHaveBeenCalledWith(
      image,
      0,
      0,
      100,
      200,
      50,
      0,
      100,
      200,
    );
  });

  it("passes expression focus into the actual Canvas drawImage source crop", async () => {
    const drawImage = vi.fn();
    const context = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      font: "",
      textAlign: "left",
      fillRect: vi.fn(),
      save: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      restore: vi.fn(),
      drawImage,
      strokeRect: vi.fn(),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const image = { width: 1024, height: 1536 } as unknown as CanvasImageSource;

    await renderBoard(canvas, {
      kind: "virtual-character-sheet",
      width: 540,
      height: 450,
      background: "#fff",
      accent: "#000",
      images: [{
        assetId: "asset-expression",
        imageUrl: "expression.png",
        label: "expression",
        x: 0,
        y: 0,
        width: 540,
        height: 450,
        focusY: 0.12,
      }],
      text: [],
    }, async () => image);

    expect(drawImage).toHaveBeenCalledWith(
      image,
      0,
      82,
      1024,
      853,
      0,
      0,
      540,
      450,
    );
  });

  it("clamps the experimental body-only crop to the declared manual range", () => {
    expect(clampBodyCropRatio(0)).toBe(0.1);
    expect(clampBodyCropRatio(0.28)).toBe(0.28);
    expect(clampBodyCropRatio(0.9)).toBe(0.45);
  });

  it("assembles approved canonical assets in fixed order", async () => {
    const { registry, exportRoot, project } = await createBoardExportFixture();
    await seedApprovedAsset(registry, project, "wardrobe-state");
    const result = await assembleModelPack({
      projectId: project.id,
      versionId: "v1",
      includeBodyOnly: false,
    }, registry, exportRoot);

    expect(result.relativeFiles).toEqual([
      "character.json",
      "README.md",
      "face-front.png",
      "slight-side-half.png",
      "body-front.png",
      "body-side.png",
      "body-back.png",
      "half-neutral.png",
    ]);
    const manifest = await readFile(`${result.directory}/character.json`, "utf8");
    expect(manifest).not.toMatch(/apiKey|promptPreview|optionalProfile|boards/);
    expect(JSON.parse(manifest).canonicalAssets.find((asset: { role: string }) => asset.role === "face-three-quarter")).toMatchObject({ displayName: "微侧半身", file: "slight-side-half.png" });
    expect(await readFile(`${result.directory}/README.md`, "utf8")).toContain("slight-side-half.png — 微侧半身");
    expect(JSON.parse(manifest)).toMatchObject({
      schemaVersion: 1,
      characterTag: "@board-test",
      versionId: "v1",
      stressTests: [
        { role: "stress-lighting", passed: true },
        { role: "stress-angle", passed: true },
        { role: "stress-action", passed: true },
      ],
      derivedStates: [{
        role: "wardrobe-state",
        parentAssetId: expect.any(String),
        stateId: "wardrobe-test",
      }],
    });
  });

  it("rejects model-pack export from an unlocked identity version", async () => {
    const { registry, exportRoot, project } = await createBoardExportFixture();
    await registry.createIdentityVersion(project.id);
    await expect(assembleModelPack({
      projectId: project.id,
      versionId: "v2",
      includeBodyOnly: false,
    }, registry, exportRoot)).rejects.toThrow(/锁定版本/);
  });

  it("marks an approved old square portrait as legacy in a new export", async () => {
    const { registry, root, exportRoot, project } = await createBoardExportFixture();
    const projectPath = join(root, project.id, "project.json");
    const saved = JSON.parse(await readFile(projectPath, "utf8"));
    saved.assets.find((asset: { role: string }) => asset.role === "face-three-quarter").recipe.size = "2048x2048";
    await writeFile(projectPath, JSON.stringify(saved));

    const result = await assembleModelPack({ projectId: project.id, versionId: "v1", includeBodyOnly: false }, registry, exportRoot);
    expect(result.relativeFiles).toContain("face-three-quarter-legacy.png");
    expect(result.relativeFiles).not.toContain("slight-side-half.png");
    const exported = JSON.parse(await readFile(join(result.directory, "character.json"), "utf8"));
    expect(exported.canonicalAssets.find((asset: { role: string }) => asset.role === "face-three-quarter"))
      .toMatchObject({ displayName: "微侧半身（旧版方图）", file: "face-three-quarter-legacy.png" });
  });

  it("returns only relative model-pack paths from the export API", async () => {
    const { registry, root, project } = await createBoardExportFixture();
    const app = createApp({ projectRegistry: registry, projectRoot: root });
    const response = await app.request(`/api/projects/${project.id}/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "model-pack", versionId: "v1", includeBodyOnly: false }),
    });

    expect(response.status).toBe(201);
    const payload = await response.json() as Record<string, unknown>;
    expect(payload).toMatchObject({ kind: "model-pack", exportId: "board-test-v1-model-pack" });
    expect(payload).not.toHaveProperty("directory");
    expect(payload.relativeFiles).toEqual(expect.arrayContaining(["character.json", "face-front.png"]));
  });
});
