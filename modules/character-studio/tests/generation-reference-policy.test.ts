import { describe, expect, it } from "vitest";
import type { CharacterAsset } from "../shared/asset-schema";
import {
  canonicalReferenceAssetIds,
  nextCanonicalRoles,
  selectCanonicalSessionReferences,
  stressReferenceAssetIds,
} from "../client/generation-reference-policy";
import type { AssignedReference } from "../client/components/ReferenceRoleAssigner";

function asset(role: CharacterAsset["role"], id: string, versionId = "v1"): CharacterAsset {
  const changeSet = {
    category: "identity" as const,
    instruction: `测试 ${role}`,
    sourceStateId: "base",
    targetStateId: "base",
  };
  return {
    id,
    versionId,
    role,
    stateId: "base",
    status: "ready",
    changeSet,
    recipe: {
      compilerVersion: "1.0.0",
      templateId: `${role}-v1`,
      provider: "147",
      model: "gpt-image-2",
      size: "1024x1536",
      quality: "medium",
      referenceAssetIds: [],
      changeSet,
    },
  };
}

function reference(name: string, role: AssignedReference["role"]): AssignedReference {
  return {
    file: new File([name], `${name}.png`, { type: "image/png" }),
    role,
    metrics: {
      width: 1,
      height: 1,
      orientation: "square",
      brightness: "neutral",
      luminance: 0.5,
      warnings: [],
    },
  };
}

describe("generation reference policy", () => {
  it("establishes body-front before the remaining canonical views", () => {
    const face = asset("face-front", "asset-000000000101");
    const body = asset("body-front", "asset-000000000102");

    expect(nextCanonicalRoles([face], "v1")).toEqual(["body-front"]);
    expect(nextCanonicalRoles([face, body], "v1")).toEqual([
      "face-three-quarter",
      "body-side",
      "body-back",
      "half-neutral",
    ]);
  });

  it("uses only current-version face and body anchors", () => {
    const face = asset("face-front", "asset-000000000101");
    const body = asset("body-front", "asset-000000000102");
    const side = asset("body-side", "asset-000000000103");
    const oldBody: CharacterAsset = {
      ...body,
      id: "asset-000000000099",
      versionId: "v0",
    };
    const assets = [face, body, side, oldBody];

    expect(canonicalReferenceAssetIds("face-front", assets, "v1")).toEqual([face.id]);
    expect(canonicalReferenceAssetIds("body-front", assets, "v1")).toEqual([face.id]);
    expect(canonicalReferenceAssetIds("body-side", assets, "v1")).toEqual([face.id, body.id]);
    expect(stressReferenceAssetIds(assets, "v1")).toEqual([face.id, body.id]);
    expect(() => stressReferenceAssetIds([face, oldBody], "v1")).toThrow(/body-front/);
  });

  it("selects only the session references needed by each canonical role", () => {
    const firstBody = reference("first-body", "body-side");
    const face = reference("face", "face-front");
    const threeQuarter = reference("three-quarter", "face-three-quarter");
    const bodyFront = reference("body-front", "body-front");
    const bodyBack = reference("body-back", "body-back");
    const references = [firstBody, face, threeQuarter, bodyFront, bodyBack];

    expect(selectCanonicalSessionReferences("face-front", references)).toEqual([face, threeQuarter]);
    expect(selectCanonicalSessionReferences("body-front", references)).toEqual([bodyFront]);
    expect(selectCanonicalSessionReferences("body-back", references)).toEqual([bodyBack]);
    expect(selectCanonicalSessionReferences("half-neutral", references)).toEqual([]);
    expect(selectCanonicalSessionReferences("face-front", [firstBody])).toEqual([firstBody]);
  });
});
