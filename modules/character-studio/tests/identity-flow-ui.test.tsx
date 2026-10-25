/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { runWithConcurrency } from "../client/App";
import type { GeneratedAssetResult } from "../client/api";
import type { StressTestRole } from "../shared/templates";
import { createNextVersion } from "../shared/project-schema";
import {
  adultPortraitFile,
  createFakeClientApi,
  makeAppState,
  TEST_PNG_BASE64,
} from "./helpers/ui-fixture";

afterEach(cleanup);

function stressResult(role: StressTestRole): GeneratedAssetResult {
  const category = role === "stress-lighting" ? "lighting" : role === "stress-angle" ? "camera" : "action";
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
      referenceAssetIds: ["asset-000000000001"],
      parentAssetId: "asset-000000000001",
      changeSet: {
        category,
        instruction: `测试 ${role}`,
        sourceStateId: "base",
        targetStateId: role,
      },
    },
  };
}

describe("identity locking flow", () => {
  it("reuses the accepted first anchor as face-front", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const initialState = makeAppState("references-ready");
    initialState.references = [{
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
    }];
    render(<App api={api} initialState={initialState} />);

    await user.click(screen.getByRole("button", { name: "生成身份基准照 · 1 次" }));
    await user.click(await screen.findByRole("button", { name: "确认使用" }));

    expect(generateRequests).toHaveLength(1);
    expect(generateRequests[0].assetRole).toBe("face-front");
    expect(screen.getAllByText("已确认").length).toBeGreaterThan(0);
    expect((screen.getByRole("button", { name: "生成正面全身照 · 1 次" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("generates body-front alone before expanding the remaining canonical views", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const state = makeAppState("stress-testing");
    const face = state.assets.find((asset) => asset.role === "face-front")!;
    state.stage = "canonical-review";
    state.assets = [face];
    state.project!.assets = [face];
    state.project!.versions[0].status = "draft";
    state.project!.versions[0].canonicalAssetIds = [face.id];
    render(<App api={api} initialState={state} />);

    await user.click(screen.getByRole("button", { name: "生成正面全身照 · 1 次" }));

    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests[0]).toMatchObject({
      assetRole: "body-front",
      referenceAssetIds: [face.id],
    });
  });

  it("uses accepted face and body anchors for the remaining four views", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const state = makeAppState("stress-testing");
    const face = state.assets.find((asset) => asset.role === "face-front")!;
    const body = state.assets.find((asset) => asset.role === "body-front")!;
    state.stage = "canonical-review";
    state.assets = [face, body];
    state.project!.assets = [face, body];
    state.project!.versions[0].status = "draft";
    state.project!.versions[0].canonicalAssetIds = [face.id, body.id];
    render(<App api={api} initialState={state} />);

    await user.click(screen.getByRole("button", { name: "生成其余 4 个标准角度" }));

    await waitFor(() => expect(generateRequests).toHaveLength(4));
    expect(generateRequests.map((request) => request.assetRole)).toEqual([
      "face-three-quarter",
      "body-side",
      "body-back",
      "half-neutral",
    ]);
    expect(generateRequests.every((request) =>
      JSON.stringify(request.referenceAssetIds) === JSON.stringify([face.id, body.id]))).toBe(true);
  });

  it("does not let a complete v1 advance a partial v2 into stress testing", async () => {
    const user = userEvent.setup();
    const { api } = createFakeClientApi();
    const state = makeAppState("version-locked");
    const oldFace = state.assets.find((asset) => asset.role === "face-front")!;
    const project = createNextVersion(state.project!);
    const faceV2 = {
      ...oldFace,
      id: "asset-000000000999",
      versionId: "v2",
    };
    project.assets.push(faceV2);
    project.versions.find((version) => version.id === "v2")!.canonicalAssetIds = [faceV2.id];
    state.project = project;
    state.assets = [...project.assets];
    state.selectedVersionId = "v2";
    state.stage = "canonical-review";
    state.pendingResults = [];
    render(<App api={api} initialState={state} />);

    await user.click(screen.getByRole("button", { name: "生成正面全身照 · 1 次" }));
    await user.click(await screen.findByRole("button", { name: "确认使用" }));

    expect(screen.queryByRole("heading", { name: "最后确认：不同场景下还是同一个人" })).toBeNull();
    expect(screen.getByRole("button", { name: "生成其余 4 个标准角度" })).toBeTruthy();
  });

  it("confirms all three ready checks and locks the role in one action", async () => {
    const user = userEvent.setup();
    const { api, saveRequests, reviewRequests } = createFakeClientApi();
    const lockVersion = vi.spyOn(api, "lockVersion");
    render(<App api={api} initialState={makeAppState("stress-testing")} />);
    const confirm = screen.getByRole("button", { name: "三张都一致，确认角色" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(screen.getByText(/把三张结果与标准形象比较/)).toBeTruthy();
    expect(screen.getAllByText(/身材或服装变化即不通过/)).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "生成 3 组检查图" }));
    await screen.findByText("3 组检查图已生成，请逐项比较");
    expect(screen.getAllByRole("img", { name: /压力测试结果/ })).toHaveLength(3);
    await waitFor(() => expect(confirm.disabled).toBe(false));
    await user.click(confirm);
    expect(await screen.findByRole("heading", { name: "接下来想制作什么？" })).toBeTruthy();
    expect(saveRequests.filter((request) => request.assetRole.startsWith("stress-"))).toHaveLength(3);
    expect(reviewRequests).toHaveLength(3);
    expect(lockVersion).toHaveBeenCalledTimes(1);
  });

  it("places pass and reject controls beside each rendered stress image", async () => {
    const user = userEvent.setup();
    const { api, reviewRequests, generateRequests } = createFakeClientApi();
    render(<App api={api} initialState={makeAppState("stress-testing")} />);

    await user.click(screen.getByRole("button", { name: "生成 3 组检查图" }));
    const image = await screen.findByRole("img", { name: "光线变化压力测试结果" });
    const card = image.closest("article")!;
    expect([...card.querySelectorAll("img")]).toContain(image);
    expect(image.classList.contains("stress-review-image")).toBe(true);
    expect(image.getAttribute("style")).toBeNull();

    const previewTrigger = screen.getByRole("button", { name: "放大查看光线变化压力测试结果" });
    await user.click(previewTrigger);
    expect(screen.getByRole("dialog", { name: "图片预览" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭图片预览" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "图片预览" })).toBeNull();
    expect(document.activeElement).toBe(previewTrigger);

    await user.click(within(card).getByRole("button", { name: "有明显变化，重新生成" }));
    await waitFor(() => expect(generateRequests).toHaveLength(4));
    expect(reviewRequests.at(-1)).toMatchObject({ role: "stress-lighting", passed: false });
    expect(generateRequests.at(-1)?.assetRole).toBe("stress-lighting");
  });

  it("starts the three stress generations only after explicit confirmation", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    render(<App api={api} initialState={makeAppState("stress-testing")} />);

    expect(generateRequests).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "生成 3 组检查图" }));

    await screen.findByText("3 组检查图已生成，请逐项比较");
    expect(generateRequests).toHaveLength(3);
    expect(generateRequests.map((request) => request.assetRole)).toEqual([
      "stress-lighting",
      "stress-angle",
      "stress-action",
    ]);
  });

  it("retries only one failed pressure test", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const state = makeAppState("stress-testing");
    const face = state.assets.find((asset) => asset.role === "face-front")!;
    const body = state.assets.find((asset) => asset.role === "body-front")!;
    state.pendingResults = [
      {
        role: "stress-lighting",
        stateId: "stress-lighting",
        parentAssetId: face.id,
        status: "failed",
        error: "测试生成失败",
      },
      {
        role: "stress-angle",
        stateId: "stress-angle",
        parentAssetId: face.id,
        status: "ready",
        result: stressResult("stress-angle"),
      },
      {
        role: "stress-action",
        stateId: "stress-action",
        parentAssetId: face.id,
        status: "ready",
        result: stressResult("stress-action"),
      },
    ];
    render(<App api={api} initialState={state} />);

    const angleImage = screen.getByRole("img", { name: "角度变化压力测试结果" });
    await user.click(screen.getByRole("button", { name: "仅重试光线变化 · 1 次调用" }));

    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests[0]).toMatchObject({
      assetRole: "stress-lighting",
      parentAssetId: face.id,
      referenceAssetIds: [face.id, body.id],
    });
    expect(screen.getByRole("img", { name: "角度变化压力测试结果" })).toBe(angleImage);
    expect(await screen.findByRole("img", { name: "光线变化压力测试结果" })).toBeTruthy();
  });

  it("runs paid work with a hard concurrency limit", async () => {
    let active = 0;
    let maximum = 0;
    const results = await runWithConcurrency([1, 2, 3, 4, 5], 2, async (item) => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return item * 2;
    });

    expect(maximum).toBe(2);
    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
  });
});
