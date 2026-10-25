/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ReferenceRoleAssigner,
  type AssignedReference,
} from "../client/components/ReferenceRoleAssigner";
import { IdentityAnchorStage } from "../client/components/IdentityAnchorStage";
import App from "../client/App";
import type { GeneratedAssetResult } from "../client/api";
import type { CharacterAsset } from "../shared/asset-schema";
import { createNextVersion } from "../shared/project-schema";
import {
  adultPortraitFile,
  createFakeClientApi,
  makeAppState,
  TEST_PNG_BASE64,
} from "./helpers/ui-fixture";

const createObjectURL = vi.fn(() => "blob:adult-reference");
const revokeObjectURL = vi.fn();

function generatedCanonicalResult(role: "body-front" | "body-side" | "body-back"): GeneratedAssetResult {
  return {
    imageB64: TEST_PNG_BASE64,
    provider: "147",
    model: "gpt-image-2",
    size: "1024x1536",
    latencyMs: 10,
    recipe: {
      compilerVersion: "1.0.0",
      templateId: `${role}-v1`,
      provider: "147",
      model: "gpt-image-2",
      size: "1024x1536",
      quality: "medium",
      referenceAssetIds: ["asset-000000000777"],
      changeSet: {
        category: "identity",
        instruction: `测试 ${role}`,
        sourceStateId: "source",
        targetStateId: "base",
      },
    },
  };
}

beforeEach(() => {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURL,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("fixed asset review gallery", () => {
  it("shows each uploaded reference as a thumbnail with a closable large preview", async () => {
    const user = userEvent.setup();
    const reference: AssignedReference = {
      file: adultPortraitFile(),
      role: "face-front",
      metrics: {
        width: 1,
        height: 1,
        orientation: "square",
        brightness: "neutral",
        luminance: 0.5,
        warnings: [],
      },
    };

    const view = render(
      <ReferenceRoleAssigner value={[reference]} onChange={vi.fn()} />,
    );

    const thumbnail = await screen.findByRole("button", {
      name: "放大查看参考图 adult.png",
    });
    expect(within(thumbnail).getByRole("img", { name: "参考图 adult.png" })).toBeTruthy();

    await user.click(thumbnail);
    expect(screen.getByRole("dialog", { name: "图片预览" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "参考图 adult.png 大图预览" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭图片预览" }));

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "图片预览" })).toBeNull();
    expect(document.activeElement).toBe(thumbnail);

    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:adult-reference");
  });

  it("keeps all six canonical slots visible and overlays the accepted asset in its original slot", async () => {
    const user = userEvent.setup();
    const acceptedFace: CharacterAsset = {
      id: "asset-000000000777",
      versionId: "v1",
      role: "face-front",
      stateId: "base",
      status: "ready",
      changeSet: {
        category: "identity",
        instruction: "测试正脸",
        sourceStateId: "source",
        targetStateId: "base",
      },
      recipe: {
        compilerVersion: "1.0.0",
        templateId: "face-front-v1",
        provider: "147",
        model: "gpt-image-2",
        size: "1024x1536",
        quality: "medium",
        referenceAssetIds: [],
        changeSet: {
          category: "identity",
          instruction: "测试正脸",
          sourceStateId: "source",
          targetStateId: "base",
        },
      },
    };
    const oldVersionBody: CharacterAsset = {
      ...acceptedFace,
      id: "asset-000000000778",
      versionId: "v0",
      role: "body-front",
    };

    render(
      <IdentityAnchorStage
        stage="canonical-review"
        projectId="project-000000000777"
        versionId="v1"
        assets={[acceptedFace, oldVersionBody]}
        pendingResults={[{
          role: "body-side",
          status: "ready",
          result: generatedCanonicalResult("body-side"),
        }]}
        onGenerateAnchor={vi.fn()}
        onGenerateRemaining={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("标准形象进度 1 / 6")).toBeTruthy();
    expect(screen.getAllByText("已确认")).toHaveLength(1);
    expect(screen.queryByText("等待生成")).toBeNull();
    expect(within(screen.getByLabelText("侧面全身审核"))
      .getByRole("button", { name: "确认使用" })).toBeTruthy();
  });

  it("retries only the failed canonical role and preserves other pending results", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const state = makeAppState("stress-testing");
    const acceptedFace = state.assets.find((asset) => asset.role === "face-front")!;
    const acceptedBody = state.assets.find((asset) => asset.role === "body-front")!;
    state.stage = "canonical-review";
    state.assets = [acceptedFace, acceptedBody];
    state.project!.assets = [acceptedFace, acceptedBody];
    state.project!.versions[0].status = "draft";
    state.project!.versions[0].canonicalAssetIds = [acceptedFace.id, acceptedBody.id];
    state.pendingResults = [
      { role: "body-side", status: "ready", result: generatedCanonicalResult("body-side") },
      { role: "body-back", status: "failed", error: "内容审核拒绝" },
    ];

    render(<App api={api} initialState={state} />);

    const bodySide = screen.getByLabelText("侧面全身审核");
    expect(within(bodySide).getByRole("img", { name: "侧面全身" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "仅重试背面全身 · 1 次调用" }));

    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests[0].assetRole).toBe("body-back");
    expect(within(bodySide).getByRole("img", { name: "侧面全身" })).toBeTruthy();
    expect(await within(screen.getByLabelText("背面全身审核"))
      .findByRole("img", { name: "背面全身" })).toBeTruthy();
  });

  it("explains that one identity reference is enough and caps optional uploads at four", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "写实虚拟角色" }));

    expect(screen.getByText(/一张清晰身份图即可开始/)).toBeTruthy();
    await user.upload(
      screen.getByLabelText("上传人物参考图"),
      Array.from({ length: 5 }, (_, index) => new File(
        [adultPortraitFile()],
        `adult-${index + 1}.png`,
        { type: "image/png" },
      )),
    );

    expect(screen.getAllByRole("button", { name: /放大查看参考图 adult-/ })).toHaveLength(4);
  });

  it("does not let accepted assets from an older version suppress the current canonical batch", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const state = makeAppState("version-locked");
    const project = createNextVersion(state.project!);
    const inheritedFace = state.assets.find((asset) => asset.role === "face-front")!;
    const currentFace: CharacterAsset = {
      ...inheritedFace,
      id: "asset-000000000888",
      versionId: "v2",
    };
    project.assets.push(currentFace);
    project.versions.find((version) => version.id === "v2")!.canonicalAssetIds = [currentFace.id];
    state.project = project;
    state.assets = [...project.assets];
    state.selectedVersionId = "v2";
    state.stage = "canonical-review";

    render(<App api={api} initialState={state} />);
    await user.click(screen.getByRole("button", { name: "生成正面全身照 · 1 次" }));

    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests.map((request) => request.assetRole)).toEqual(["body-front"]);
    expect(generateRequests.every((request) => request.versionId === "v2")).toBe(true);
  });
});
