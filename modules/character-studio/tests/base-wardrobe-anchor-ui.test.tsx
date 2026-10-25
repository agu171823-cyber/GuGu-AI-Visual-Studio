/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../client/App";
import type { GeneratedAssetResult } from "../client/api";
import {
  createFakeClientApi,
  makeAppState,
  TEST_PNG_BASE64,
} from "./helpers/ui-fixture";

function bodyResult(): GeneratedAssetResult {
  const changeSet = {
    category: "identity" as const,
    instruction: "建立身材与基础服装锚点",
    sourceStateId: "base",
    targetStateId: "base",
  };
  return {
    imageB64: TEST_PNG_BASE64,
    provider: "147",
    model: "gpt-image-2",
    size: "1024x1536",
    latencyMs: 10,
    recipe: {
      compilerVersion: "1.0.0",
      templateId: "body-front-v1",
      provider: "147",
      model: "gpt-image-2",
      size: "1024x1536",
      quality: "medium",
      referenceAssetIds: ["asset-000000000001"],
      changeSet,
    },
  };
}

function faceOnlyState() {
  const state = makeAppState("stress-testing");
  const face = state.assets.find((asset) => asset.role === "face-front")!;
  state.stage = "canonical-review";
  state.assets = [face];
  state.project!.assets = [face];
  state.project!.versions[0].status = "draft";
  state.project!.versions[0].canonicalAssetIds = [face.id];
  return { state, face };
}

beforeEach(() => {
  URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("base wardrobe and body anchor", () => {
  it("explains the safe neutral fallback when no wardrobe is provided", () => {
    const { api } = createFakeClientApi();
    const { state } = faceOnlyState();
    render(<App api={api} initialState={state} />);

    expect(screen.getByText(/留空时使用完整覆盖的中性日常服装/)).toBeTruthy();
    expect(screen.getByText(/正脸锚点只用于面部身份/)).toBeTruthy();
  });

  it("sends a brief and one optional wardrobe reference only with body-front", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const { state, face } = faceOnlyState();
    const first = new File(["first"], "first-look.png", { type: "image/png" });
    const final = new File(["final"], "final-look.png", { type: "image/png" });
    render(<App api={api} initialState={state} />);

    await user.type(
      screen.getByLabelText("基础服装描述"),
      "米白色西装、直筒长裤、黑色低跟鞋",
    );
    const upload = screen.getByLabelText("上传基础服装参考图");
    await user.upload(upload, first);
    expect(screen.getByRole("img", { name: "基础服装参考 first-look.png" })).toBeTruthy();
    await user.upload(upload, final);
    expect(screen.queryByRole("img", { name: "基础服装参考 first-look.png" })).toBeNull();
    const thumbnail = screen.getByRole("button", { name: "放大查看基础服装参考 final-look.png" });
    await user.click(thumbnail);
    expect(screen.getByRole("dialog", { name: "图片预览" })).toBeTruthy();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "生成正面全身照 · 1 次" }));

    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests[0]).toMatchObject({
      assetRole: "body-front",
      baseWardrobeBrief: "米白色西装、直筒长裤、黑色低跟鞋",
      referenceAssetIds: [face.id],
    });
    expect(generateRequests[0].references).toHaveLength(1);
    expect(generateRequests[0].references[0]).toEqual({ file: final, role: "wardrobe-state" });
  });

  it("rejects unsupported wardrobe files locally", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const { state } = faceOnlyState();
    render(<App api={api} initialState={state} />);

    await user.upload(
      screen.getByLabelText("上传基础服装参考图"),
      new File(["not an image"], "notes.txt", { type: "text/plain" }),
    );

    expect(screen.getByRole("alert").textContent).toMatch(/PNG、JPEG 或 WebP/);
    await user.click(screen.getByRole("button", { name: "生成正面全身照 · 1 次" }));
    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests[0].references).toHaveLength(0);
  });

  it("rejects wardrobe references larger than 15 MB", async () => {
    const user = userEvent.setup();
    const { api } = createFakeClientApi();
    const { state } = faceOnlyState();
    render(<App api={api} initialState={state} />);

    await user.upload(
      screen.getByLabelText("上传基础服装参考图"),
      new File([new Uint8Array(15 * 1024 * 1024 + 1)], "oversize.png", { type: "image/png" }),
    );

    expect(screen.getByRole("alert").textContent).toMatch(/15 MB/);
    expect(screen.queryByRole("img", { name: /oversize\.png/ })).toBeNull();
  });

  it("keeps the wardrobe controls editable after a failed body generation", async () => {
    const user = userEvent.setup();
    const { api, generateRequests } = createFakeClientApi();
    const { state } = faceOnlyState();
    state.pendingResults = [{ role: "body-front", status: "failed", error: "内容审核拒绝" }];
    render(<App api={api} initialState={state} />);

    await user.type(screen.getByLabelText("基础服装描述"), "深蓝色长袖套装");
    await user.click(screen.getByRole("button", { name: /仅重试正面全身/ }));

    await waitFor(() => expect(generateRequests).toHaveLength(1));
    expect(generateRequests[0]).toMatchObject({
      assetRole: "body-front",
      baseWardrobeBrief: "深蓝色长袖套装",
    });
  });

  it("requires body proportion and clothing review before acceptance", () => {
    const { api } = createFakeClientApi();
    const { state } = faceOnlyState();
    state.pendingResults = [{ role: "body-front", status: "ready", result: bodyResult() }];
    render(<App api={api} initialState={state} />);

    const bodyCard = screen.getByLabelText("正面全身审核");
    expect(within(bodyCard).getByText(/头身比、肩胯、腰线、躯干与四肢长度/)).toBeTruthy();
    expect(within(bodyCard).getByText(/基础服装的层次、上装、下装、鞋履和配饰/)).toBeTruthy();
    expect(within(bodyCard).getByRole("button", { name: "确认使用" })).toBeTruthy();
  });
});
