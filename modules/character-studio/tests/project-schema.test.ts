import { describe, expect, it } from "vitest";
import type { CharacterAsset } from "../shared/asset-schema";
import {
  canLockVersion,
  createDraftProject,
  createNextVersion,
  validateCharacterProject,
} from "../shared/project-schema";
import { CANONICAL_ROLES, STRESS_TEST_ROLES } from "../shared/templates";

describe("character project schema", () => {
  it("creates an unlocked v1 with a stable character tag", () => {
    const project = createDraftProject({
      mode: "realistic-virtual-character",
      title: "琳角色包",
      displayName: "琳",
    });

    expect(project.schemaVersion).toBe(1);
    expect(project.characterTag).toMatch(/^@character-[a-f0-9]{8}$/);
    expect(project.versions[0]).toMatchObject({ id: "v1", status: "draft" });
    expect(validateCharacterProject(project)).toEqual([]);
  });

  it("uses an ASCII display name as a readable stable tag", () => {
    const project = createDraftProject({
      mode: "human-model-card",
      title: "Mina comp card",
      displayName: "Mina Lee",
    });

    expect(project.characterTag).toBe("@mina-lee");
  });

  it("never mutates a locked identity version", () => {
    const project = createDraftProject({
      mode: "human-model-card",
      title: "A",
      displayName: "A",
    });
    project.versions[0].status = "locked";
    project.versions[0].lockedAt = "2026-08-08T00:00:00.000Z";

    const next = createNextVersion(project);

    expect(next).not.toBe(project);
    expect(project.versions.map((version) => version.id)).toEqual(["v1"]);
    expect(next.versions.map((version) => version.id)).toEqual(["v1", "v2"]);
    expect(next.versions[0].status).toBe("locked");
    expect(next.currentVersionId).toBe("v2");
    expect(next.versions[1]).toMatchObject({
      status: "draft",
      createdFromVersionId: "v1",
    });
  });

  it("does not lock an incomplete version", () => {
    const project = createDraftProject({
      mode: "human-model-card",
      title: "A",
      displayName: "A",
    });

    expect(canLockVersion(project.versions[0], [])).toBe(false);
  });

  it("locks only a complete ready canonical set with passed stress tests", () => {
    const project = createDraftProject({
      mode: "human-model-card",
      title: "A",
      displayName: "A",
    });
    const version = project.versions[0];
    const assets = CANONICAL_ROLES.map((role, index): CharacterAsset => ({
      id: `asset-${index}`,
      versionId: "v1",
      role,
      stateId: "base",
      status: "ready",
      changeSet: {
        category: "identity",
        instruction: `建立 ${role}`,
        sourceStateId: "source",
        targetStateId: "base",
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
          instruction: `建立 ${role}`,
          sourceStateId: "source",
          targetStateId: "base",
        },
      },
    }));
    version.canonicalAssetIds = assets.map((asset) => asset.id);
    version.stressTests = STRESS_TEST_ROLES.map((role) => ({
      role,
      assetId: `stress-${role}`,
      passed: true,
      reviewedAt: "2026-08-08T00:00:00.000Z",
    }));
    const stressAssets = STRESS_TEST_ROLES.map((role): CharacterAsset => ({
      id: `stress-${role}`,
      versionId: "v1",
      role,
      stateId: role,
      status: "ready",
      parentAssetId: assets[0].id,
      changeSet: {
        category: role === "stress-lighting" ? "lighting" : role === "stress-angle" ? "camera" : "action",
        instruction: `测试 ${role}`,
        sourceStateId: "base",
        targetStateId: role,
      },
      recipe: {
        ...assets[0].recipe,
        templateId: `${role}-v1`,
        parentAssetId: assets[0].id,
        changeSet: {
          category: role === "stress-lighting" ? "lighting" : role === "stress-angle" ? "camera" : "action",
          instruction: `测试 ${role}`,
          sourceStateId: "base",
          targetStateId: role,
        },
      },
    }));

    expect(canLockVersion(version, [...assets, ...stressAssets])).toBe(true);
    stressAssets[0].status = "failed";
    expect(canLockVersion(version, [...assets, ...stressAssets])).toBe(false);
    stressAssets[0].status = "ready";
    assets[0].status = "failed";
    expect(canLockVersion(version, [...assets, ...stressAssets])).toBe(false);
  });

  it("rejects unknown keys and invalid locked or derived records", () => {
    const project = createDraftProject({
      mode: "human-model-card",
      title: "A",
      displayName: "A",
    });
    const invalid = {
      ...project,
      unexpected: true,
      versions: [
        {
          ...project.versions[0],
          status: "locked",
        },
      ],
      assets: [
        {
          id: "asset-derived",
          versionId: "v1",
          role: "wardrobe-state",
          stateId: "business",
          status: "ready",
          changeSet: {
            category: "wardrobe",
            instruction: "米白色西装",
            sourceStateId: "base",
            targetStateId: "business",
          },
          recipe: {},
        },
      ],
    };

    const errors = validateCharacterProject(invalid);
    expect(errors.join("\n")).toMatch(/unknown key/i);
    expect(errors.join("\n")).toMatch(/lockedAt/);
    expect(errors.join("\n")).toMatch(/parentAssetId/);
  });
});
