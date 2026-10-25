/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../client/App";
import type { CharacterAsset } from "../shared/asset-schema";
import { createNextVersion } from "../shared/project-schema";
import { CANONICAL_ROLES } from "../shared/templates";
import { WorkflowHistoryPanel } from "../client/components/WorkflowHistoryPanel";
import { adultPortraitFile, createFakeClientApi, makeAppState } from "./helpers/ui-fixture";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function addDerivedAsset(): ReturnType<typeof makeAppState> {
  const state = makeAppState("asset-production");
  const project = state.project!;
  const version = project.versions[0];
  const parent = project.assets.find((asset) => asset.role === "face-front")!;
  const changeSet = {
    category: "camera" as const,
    instruction: "自然正面肖像",
    sourceStateId: "base",
    targetStateId: "model-card-natural-approved",
  };
  const derived: CharacterAsset = {
    id: "asset-000000000301",
    versionId: version.id,
    role: "model-card-natural",
    stateId: "model-card-natural-approved",
    status: "ready",
    parentAssetId: parent.id,
    changeSet,
    recipe: {
      ...parent.recipe,
      parentAssetId: parent.id,
      referenceAssetIds: [parent.id],
      changeSet,
    },
  };
  project.assets.push(derived);
  state.assets = [...project.assets];
  project.boards.push({
    id: "board-1",
    versionId: version.id,
    kind: "virtual-character-sheet",
    fileName: "character-v1.png",
    createdAt: "2026-08-08T08:00:00.000Z",
    assetIds: [parent.id, "asset-deadbeef1234"],
  });
  return state;
}

describe("read-only workflow history", () => {
  it("shows only persisted derived assets without workflow mutation controls", () => {
    const state = addDerivedAsset();
    const project = state.project!;
    const version = project.versions[0];

    render(
      <WorkflowHistoryPanel
        step="asset-production"
        project={project}
        version={version}
        assets={state.assets}
        references={[]}
        onReturn={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "正在回看：制作与下载" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "model-card-natural 历史资产" })).toBeTruthy();
    expect(screen.getByText("自然正面肖像")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^(生成|接受|拒绝|锁定|导出)/ })).toBeNull();
  });

  it("keeps old square face assets intact and labels their former dimensions", () => {
    const state = addDerivedAsset();
    const oldAsset = state.assets.find((asset) => asset.role === "face-three-quarter")!;
    oldAsset.recipe.size = "2048x2048";
    render(
      <WorkflowHistoryPanel
        step="canonical-review"
        project={state.project!}
        version={state.project!.versions[0]}
        assets={state.assets}
        references={[]}
        onReturn={vi.fn()}
      />,
    );
    const card = screen.getByRole("article", { name: "微侧半身（旧版方图） 规范历史资产" });
    expect(within(card).getByText("2048x2048")).toBeTruthy();
    expect(within(card).getByText(/新生成使用 2:3 微侧半身/)).toBeTruthy();
  });

  it("reads each completed step from its persisted source", () => {
    const state = addDerivedAsset();
    const project = state.project!;
    const version = project.versions[0];
    const props = {
      project,
      version,
      assets: state.assets,
      references: [],
      onReturn: vi.fn(),
    };
    const view = render(<WorkflowHistoryPanel {...props} step="anchor-review" />);

    expect(screen.getByRole("heading", { name: "正在回看：确认角色" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "face-front 历史资产" })).toBeTruthy();
    expect(screen.getByText("未记录")).toBeTruthy();

    view.rerender(<WorkflowHistoryPanel {...props} step="canonical-review" />);
    const canonicalCards = screen.getAllByRole("article", { name: /规范历史资产$/ });
    expect(canonicalCards).toHaveLength(6);
    expect(canonicalCards.map((card) => card.getAttribute("data-role"))).toEqual([...CANONICAL_ROLES]);
    expect(screen.getByRole("article", { name: "微侧半身 规范历史资产" })).toBeTruthy();

    view.rerender(<WorkflowHistoryPanel {...props} step="stress-testing" />);
    expect(screen.getAllByText("已通过")).toHaveLength(3);

    view.rerender(<WorkflowHistoryPanel {...props} step="export-ready" />);
    const delivery = screen.getByRole("listitem", { name: "交付记录 character-v1.png" });
    expect(within(delivery).getByText("virtual-character-sheet")).toBeTruthy();
    expect(within(delivery).getByText(`${project.assets[0].id} · face-front`)).toBeTruthy();
    expect(within(delivery).getByText("asset-deadbeef1234 · 记录存在，但所用资产不可用")).toBeTruthy();

    project.boards = [];
    view.rerender(<WorkflowHistoryPanel {...props} project={{ ...project }} step="export-ready" />);
    expect(screen.getByText(/当前版本没有已记录的交付/)).toBeTruthy();
  });

  it("labels absent stress reviews as unreviewed instead of failed", () => {
    const state = makeAppState("stress-testing");
    const project = state.project!;
    const version = project.versions[0];
    version.stressTests = [];

    render(
      <WorkflowHistoryPanel
        step="stress-testing"
        project={project}
        version={version}
        assets={state.assets}
        references={[]}
        onReturn={vi.fn()}
      />,
    );

    expect(screen.getAllByText("未审核")).toHaveLength(3);
    expect(screen.queryByText("未通过")).toBeNull();
  });

  it("previews natural-ratio history media and isolates a missing image", async () => {
    const user = userEvent.setup();
    const state = addDerivedAsset();
    const project = state.project!;
    const version = project.versions[0];

    render(
      <WorkflowHistoryPanel
        step="anchor-review"
        project={project}
        version={version}
        assets={state.assets}
        references={[]}
        onReturn={vi.fn()}
      />,
    );

    const historyImage = screen.getByRole("img", { name: "face-front 历史资产" });
    expect(historyImage.className).toContain("workflow-history-image");
    expect(historyImage.getAttribute("style")).toBeNull();
    await user.click(screen.getByRole("button", { name: "放大查看face-front 历史资产" }));
    expect(screen.getByRole("dialog", { name: "图片预览" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "图片预览" })).toBeNull();

    fireEvent.error(historyImage);
    expect(screen.getByText("记录存在，但图片资产不可用")).toBeTruthy();
    expect(screen.queryByRole("img", { name: "face-front 历史资产" })).toBeNull();
  });

  it("distinguishes current-session references from persisted project data", () => {
    const state = addDerivedAsset();
    const project = state.project!;
    project.optionalProfile = { stageName: "Nova", heightCm: 170, contact: "agent@example.test" };
    const version = project.versions[0];
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:history-reference");
    URL.revokeObjectURL = vi.fn();

    const view = render(
      <WorkflowHistoryPanel
        step="project-setup"
        project={project}
        version={version}
        assets={state.assets}
        references={[]}
        onReturn={vi.fn()}
      />,
    );
    expect(screen.getByText("原始参考未保存，仅保存了已接受资产")).toBeTruthy();
    expect(screen.getByText("Nova")).toBeTruthy();
    expect(screen.getByText("170 cm")).toBeTruthy();
    expect(screen.getByText("agent@example.test")).toBeTruthy();

    const file = adultPortraitFile();
    view.rerender(
      <WorkflowHistoryPanel
        step="project-setup"
        project={project}
        version={version}
        assets={state.assets}
        references={[{
          file,
          role: "face-front",
          metrics: {
            width: 1,
            height: 1,
            orientation: "square",
            brightness: "neutral",
            luminance: 0.5,
            warnings: [],
          },
        }]}
        onReturn={vi.fn()}
      />,
    );
    expect(screen.getByText("adult.png")).toBeTruthy();
    expect(screen.getByText("face-front")).toBeTruthy();
    expect(within(screen.getByRole("button", { name: "放大查看参考图 adult.png" }))
      .getByRole("img", { name: "参考图 adult.png" })).toBeTruthy();
    expect(project).not.toHaveProperty("references");

    view.unmount();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

describe("workflow history navigation", () => {
  it("keeps the working version unchanged while browsing an older locked version", async () => {
    const user = userEvent.setup();
    const state = addDerivedAsset();
    state.project = createNextVersion(state.project!);
    state.selectedVersionId = "v2";
    state.stage = "canonical-review";
    const { api, generateRequests } = createFakeClientApi();
    render(<App initialState={state} api={api} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "角色版本" }), "v1");
    expect(screen.getByRole("heading", { name: "正在回看：制作与下载" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "生成 4 张模卡补图" })).toBeNull();
    expect(screen.queryByRole("button", { name: "修改身份特征并创建新版本" })).toBeNull();
    await user.selectOptions(screen.getByRole("combobox", { name: "角色版本" }), "v2");
    expect(screen.getByRole("button", { name: "生成身份基准照 · 1 次" })).toBeTruthy();
    expect(generateRequests).toHaveLength(0);
  });

  it("does not enter a fake history state before a project exists", async () => {
    const user = userEvent.setup();
    render(<App />);

    const setupStep = screen.getByRole("button", {
      name: "查看当前记录：第 1 步 添加参考",
    });
    await user.click(setupStep);

    expect(screen.getByRole("button", {
      name: "查看当前记录：第 1 步 添加参考",
    })).toBeTruthy();
    expect(screen.queryByRole("button", {
      name: "返回当前任务：第 1 步 添加参考",
    })).toBeNull();
    expect(screen.getByRole("heading", { name: "创建你的角色" })).toBeTruthy();
  });

  it("navigates completed steps without changing real progress", async () => {
    const user = userEvent.setup();
    const { api, generateRequests, saveRequests, reviewRequests } = createFakeClientApi();
    const lockVersion = vi.spyOn(api, "lockVersion");
    const createIdentityVersion = vi.spyOn(api, "createIdentityVersion");
    const exportProject = vi.spyOn(api, "exportProject");

    render(<App api={api} initialState={makeAppState("asset-production")} />);

    const canonicalStep = screen.getByRole("button", { name: "查看已完成记录：第 2 步 确认角色" });
    const currentStep = screen.getByRole("button", { name: "查看当前记录：第 3 步 制作与下载" });
    expect(within(screen.getByRole("navigation", { name: "角色制作进度" })).getAllByRole("button")).toHaveLength(3);
    expect(currentStep.getAttribute("aria-current")).toBe("step");
    expect(currentStep.getAttribute("aria-pressed")).toBeNull();

    await user.click(canonicalStep);
    expect(await screen.findByRole("heading", { name: "正在回看：标准形象与一致性记录" })).toBeTruthy();
    expect(canonicalStep.getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByText("接下来想制作什么？")).toBeNull();
    expect(generateRequests).toHaveLength(0);
    expect(saveRequests).toHaveLength(0);
    expect(reviewRequests).toHaveLength(0);
    expect(lockVersion).not.toHaveBeenCalled();
    expect(createIdentityVersion).not.toHaveBeenCalled();
    expect(exportProject).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "返回当前步骤" }));
    expect(screen.getByText("接下来想制作什么？")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "查看已完成记录：第 2 步 确认角色" }));
    await user.click(currentStep);
    expect(screen.getByText("接下来想制作什么？")).toBeTruthy();
  });

  it("opens recorded delivery history from the current sixth step", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null);
    const state = makeAppState("export-ready");
    const project = state.project!;
    const face = project.assets.find((asset) => asset.role === "face-front")!;
    project.boards.push({
      id: "board-current-delivery",
      versionId: "v1",
      kind: "virtual-character-sheet",
      fileName: "recorded-delivery.png",
      createdAt: "2026-08-08T09:00:00.000Z",
      assetIds: [face.id],
    });
    const { api, generateRequests } = createFakeClientApi();

    render(<App api={api} initialState={state} />);

    const currentDelivery = screen.getByRole("button", {
      name: "查看当前记录：第 3 步 制作与下载",
    });
    expect(currentDelivery.getAttribute("aria-current")).toBe("step");
    expect(currentDelivery.getAttribute("aria-pressed")).toBeNull();
    await user.click(currentDelivery);

    expect(await screen.findByRole("heading", { name: "正在回看：制作与下载" })).toBeTruthy();
    expect(screen.getByText("recorded-delivery.png")).toBeTruthy();
    expect(generateRequests).toHaveLength(0);

    await user.click(currentDelivery);
    expect(screen.getByRole("heading", { name: "下载与发送" })).toBeTruthy();
  });

  it("reopens persisted history without restoring session references", async () => {
    const user = userEvent.setup();
    const project = makeAppState("asset-production").project!;
    const { api, generateRequests } = createFakeClientApi();
    api.listProjects = async () => [project];
    api.readProject = async () => project;

    render(<App api={api} />);

    await user.click(screen.getByRole("button", { name: "打开已有角色" }));
    await user.click(await screen.findByRole("button", { name: `打开 ${project.title}` }));
    await user.click(await screen.findByRole("button", { name: "查看已完成记录：第 2 步 确认角色" }));
    expect(await screen.findByRole("img", { name: "face-front 历史资产" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "查看已完成记录：第 1 步 添加参考" }));
    expect(screen.getByText("原始参考未保存，仅保存了已接受资产")).toBeTruthy();
    expect(generateRequests).toHaveLength(0);
  });
});
