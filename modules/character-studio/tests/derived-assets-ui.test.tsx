/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "../client/App";
import type { ClientApi, GeneratedAssetResult } from "../client/api";
import {
  createFakeClientApi,
  makeAppState,
  TEST_PNG_BASE64,
} from "./helpers/ui-fixture";
import type { CharacterAsset } from "../shared/asset-schema";
import { createDraftProject } from "../shared/project-schema";
import { EXPRESSION_SIX } from "../shared/templates";

afterEach(cleanup);

function derivedResult(stateId: string): GeneratedAssetResult {
  return {
    imageB64: TEST_PNG_BASE64,
    provider: "147",
    model: "gpt-image-2",
    size: "1024x1536",
    latencyMs: 10,
    recipe: {
      compilerVersion: "1.0.0",
      templateId: "expression-v1",
      provider: "147",
      model: "gpt-image-2",
      size: "1024x1536",
      quality: "medium",
      referenceAssetIds: ["asset-000000000001"],
      parentAssetId: "asset-000000000001",
      changeSet: {
        category: "expression",
        instruction: "中性表情",
        sourceStateId: "base",
        targetStateId: stateId,
      },
    },
  };
}

function acceptedExpression(index: number): CharacterAsset {
  const preset = EXPRESSION_SIX[index];
  const stateId = `expression-${preset.stateKey}-accepted-${index + 1}`;
  const changeSet = {
    category: "expression" as const,
    instruction: preset.instruction,
    sourceStateId: "base",
    targetStateId: stateId,
  };
  return {
    id: `asset-${String(301 + index).padStart(12, "0")}`,
    versionId: "v1",
    role: "expression",
    stateId,
    status: "ready",
    parentAssetId: "asset-000000000001",
    changeSet,
    recipe: {
      compilerVersion: "1.0.0",
      templateId: "expression-v1",
      provider: "147",
      model: "gpt-image-2",
      size: "1024x1536",
      quality: "medium",
      referenceAssetIds: ["asset-000000000001"],
      parentAssetId: "asset-000000000001",
      changeSet,
    },
  };
}

describe("derived asset workspace", () => {
  it("returns from an incomplete virtual delivery board to expression production", async () => {
    const user = userEvent.setup();
    const { api } = createFakeClientApi();
    render(<App api={api} initialState={makeAppState("export-ready")} />);

    await user.click(screen.getByRole("button", { name: "返回制作六种表情" }));

    expect(screen.getByRole("heading", { name: "六种基础表情" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "六种表情" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("shows virtual delivery readiness before the user opens delivery", async () => {
    const user = userEvent.setup();
    const { api } = createFakeClientApi();
    render(<App api={api} initialState={makeAppState("asset-production")} />);

    expect(screen.getByText("展示板素材 4/10")).toBeTruthy();
    expect(screen.getByText("六种表情：已完成 0/6")).toBeTruthy();
    expect(screen.getByText(/模型参考包.*已就绪/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "去制作六种表情" }));

    expect(screen.getByRole("heading", { name: "六种基础表情" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "六种表情" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("does not impose virtual expression requirements on human model cards", () => {
    const { api } = createFakeClientApi();
    const project = createDraftProject({
      mode: "human-model-card",
      title: "Human Model",
      displayName: "Human Model",
    });
    render(<App api={api} initialState={makeAppState("asset-production", project)} />);

    expect(screen.queryByText(/六种表情：已完成/)).toBeNull();
    expect(screen.queryByRole("button", { name: "去制作六种表情" })).toBeNull();
  });

  it("generates only expression presets not already accepted or pending", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const state = makeAppState("asset-production");
    const first = acceptedExpression(0);
    const second = acceptedExpression(1);
    state.assets.push(first, second);
    state.project!.assets.push(first, second);
    const half = state.assets.find((asset) => asset.role === "half-neutral")!;
    const face = state.assets.find((asset) => asset.role === "face-front")!;
    const body = state.assets.find((asset) => asset.role === "body-front")!;
    const parent = state.assets.find((asset) => asset.role === "face-front")!;
    state.pendingResults = EXPRESSION_SIX.slice(2, 5).map((preset, offset) => {
      const stateId = `expression-${preset.stateKey}-pending-${offset + 3}`;
      const status = (["ready", "generating", "failed"] as const)[offset];
      return {
        role: "expression" as const,
        stateId,
        parentAssetId: parent.id,
        changeSet: {
          category: "expression" as const,
          instruction: preset.instruction,
          sourceStateId: "base",
          targetStateId: stateId,
        },
        status,
        result: status === "ready" ? derivedResult(stateId) : undefined,
        error: status === "failed" ? "请求被内容审核拒绝" : undefined,
      };
    });
    render(<App api={api} initialState={state} />);

    expect(screen.getByText("六种表情：已完成 2/6")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "去制作六种表情" }));
    const generate = screen.getByRole("button", { name: "生成 1 种缺失表情" });
    await user.click(generate);

    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests.map((request) => request.changeSet.instruction)).toEqual(
      EXPRESSION_SIX.slice(5).map((preset) => preset.instruction),
    );
    expect(generateRequests[0]).toMatchObject({
      assetRole: "expression",
      parentAssetId: half.id,
      size: "1024x1024",
    });
    expect(generateRequests[0].referenceAssetIds).toEqual([half.id, face.id, body.id]);
  });

  it("keeps derived review images proportional and accepted in their review slots", async () => {
    const user = userEvent.setup();
    const { api } = createFakeClientApi();
    render(<App api={api} initialState={makeAppState("version-locked")} />);

    await user.click(screen.getByRole("button", { name: "生成 4 张模卡补图" }));
    const image = (await screen.findAllByRole("img", { name: /model-card-.*生成结果/ }))[0];
    const slot = image.closest("article")!;
    expect(image.classList.contains("asset-review-image")).toBe(true);
    expect(image.getAttribute("style")).toBeNull();
    expect(within(slot).getByRole("button", { name: "确认使用" })).toBeTruthy();

    const preview = within(slot).getByRole("button", { name: /放大查看.*生成结果/ });
    await user.click(preview);
    expect(screen.getByRole("dialog", { name: "图片预览" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(preview);

    await user.click(within(slot).getByRole("button", { name: "确认使用" }));
    await waitFor(() => expect(within(slot).getByText("已确认")).toBeTruthy());
    expect(within(slot).getByRole("img", { name: /已确认资产/ })).toBeTruthy();
  });

  it("retries only one failed derived state with the same role", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const state = makeAppState("asset-production");
    const parent = state.assets.find((asset) => asset.role === "face-front")!;
    state.pendingResults = [
      {
        role: "expression",
        stateId: "expression-neutral",
        parentAssetId: parent.id,
        changeSet: {
          category: "expression",
          instruction: "中性表情",
          sourceStateId: "base",
          targetStateId: "expression-neutral",
        },
        status: "ready",
        result: derivedResult("expression-neutral"),
      },
      {
        role: "expression",
        stateId: "expression-failed",
        parentAssetId: parent.id,
        changeSet: {
          category: "expression",
          instruction: "专注表情",
          sourceStateId: "base",
          targetStateId: "expression-failed",
        },
        status: "failed",
        error: "请求被内容审核拒绝",
      },
    ];
    render(<App api={api} initialState={state} />);

    const preserved = screen.getByRole("img", { name: "expression-neutral 生成结果" });
    await user.click(screen.getByRole("button", { name: "仅重试expression · 1 次调用" }));

    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests[0]).toMatchObject({
      assetRole: "expression",
      parentAssetId: parent.id,
      size: "1024x1024",
      changeSet: { targetStateId: "expression-failed" },
    });
    const body = state.assets.find((asset) => asset.role === "body-front")!;
    expect(generateRequests[0].referenceAssetIds).toEqual([parent.id, body.id]);
    expect(screen.getByRole("img", { name: "expression-neutral 生成结果" })).toBe(preserved);
    expect(await screen.findByRole("img", { name: "expression-failed 生成结果" })).toBeTruthy();
  });

  it("sends moderation-friendly model card requests", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    render(<App api={api} initialState={makeAppState("version-locked")} />);

    await user.click(screen.getByRole("button", { name: "生成 4 张模卡补图" }));
    await waitFor(() => expect(generateRequests).toHaveLength(4));

    const full = generateRequests.find((request) => request.assetRole === "model-card-full")!;
    const side = generateRequests.find((request) => request.assetRole === "model-card-side-action")!;
    expect(full.changeSet.instruction).toContain("完整日常服装覆盖");
    expect(full.changeSet.instruction).toContain("专业人物模卡目录");
    expect(side.changeSet.instruction).toContain("完整日常服装覆盖");
    expect(side.changeSet.instruction).toContain("非挑逗");
  });

  it("generates only missing model card roles after accepted results", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    render(<App api={api} initialState={makeAppState("version-locked")} />);

    await user.click(screen.getByRole("button", { name: "生成 4 张模卡补图" }));
    await waitFor(() => expect(generateRequests).toHaveLength(4));

    for (const role of ["model-card-natural", "model-card-half"]) {
      const slot = screen.getByRole("article", { name: new RegExp(`${role}-.*派生资产审核槽位`) });
      await user.click(within(slot).getByRole("button", { name: "确认使用" }));
      await waitFor(() => expect(within(slot).getByText("已确认")).toBeTruthy());
    }
    for (const role of ["model-card-full", "model-card-side-action"]) {
      const slot = screen.getByRole("article", { name: new RegExp(`${role}-.*派生资产审核槽位`) });
      await user.click(within(slot).getByRole("button", { name: "不满意" }));
    }

    await user.click(screen.getByRole("button", { name: "生成 2 张模卡补图" }));
    await waitFor(() => expect(generateRequests).toHaveLength(6));
    expect(generateRequests.slice(-2).map((request) => request.assetRole)).toEqual([
      "model-card-full",
      "model-card-side-action",
    ]);
  });

  it("creates wardrobe as a child state without changing v1", async () => {
    const user = userEvent.setup();
    const { api, generateRequests, saveRequests } = createFakeClientApi();
    render(<App api={api} initialState={makeAppState("version-locked")} />);

    await user.click(screen.getByRole("button", { name: "更换服装" }));
    await user.type(screen.getByLabelText("本次唯一变化"), "米白色西装");
    await user.click(screen.getByRole("button", { name: "生成 1 张服装状态" }));

    expect(generateRequests.at(-1)).toMatchObject({
      versionId: "v1",
      parentAssetId: expect.any(String),
      changeSet: {
        category: "wardrobe",
        sourceStateId: "base",
        targetStateId: expect.stringMatching(/^wardrobe-/),
      },
    });
    await user.click(await screen.findByRole("button", { name: "确认使用" }));
    expect(saveRequests.at(-1)).toMatchObject({
      assetRole: "wardrobe-state",
      parentAssetId: expect.any(String),
      stateId: expect.stringMatching(/^wardrobe-/),
    });
    expect(screen.getByText(/v1 · LOCKED/)).toBeTruthy();
  });

  it("routes identity changes to a new version", async () => {
    const user = userEvent.setup();
    const { api } = createFakeClientApi();
    let savedProject: Awaited<ReturnType<ClientApi["createIdentityVersion"]>> | undefined;
    const createIdentityVersion = api.createIdentityVersion;
    api.createIdentityVersion = async (projectId) => {
      savedProject = await createIdentityVersion(projectId);
      return savedProject;
    };
    render(<App api={api} initialState={makeAppState("version-locked")} />);

    await user.click(screen.getByText("角色管理"));
    await user.click(screen.getByRole("button", { name: "修改身份特征并创建新版本" }));

    expect(screen.getByRole("dialog").textContent).toContain("将创建 v2");
    expect(screen.getByRole("dialog").textContent).toContain("v1 不会被覆盖");
    await user.click(screen.getByRole("button", { name: "创建身份新版本" }));
    await waitFor(() => expect(savedProject?.currentVersionId).toBe("v2"));
    expect(savedProject?.versions).toMatchObject([
      { id: "v1", status: "locked" },
      { id: "v2", status: "draft", createdFromVersionId: "v1" },
    ]);
  });
});
