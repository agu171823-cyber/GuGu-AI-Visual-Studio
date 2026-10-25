import { useEffect, useReducer, useRef, useState } from "react";
import { ChannelControls } from "./components/ChannelControls";
import { ImportProject } from "./components/ImportProject";
import type { AssetChangeSet, CharacterAsset } from "../shared/asset-schema";
import {
  canLockVersion,
  type CharacterProject,
} from "../shared/project-schema";
import {
  CANONICAL_ROLES,
  isCanonicalRole,
  isStressTestRole,
  type AssetRole,
  type CanonicalRole,
  type StressTestRole,
} from "../shared/templates";
import { clientApi, discardCandidate, type ClientApi, type GeneratedAssetResult } from "./api";
import { ConsentGate } from "./components/ConsentGate";
import {
  AssetGroupWorkspace,
  type AssetWorkspaceTab,
  type DerivedAssetRequest,
} from "./components/AssetGroupWorkspace";
import { IdentityAnchorStage } from "./components/IdentityAnchorStage";
import type { BaseWardrobeDraft } from "./components/BaseWardrobeAnchorInput";
import { BoardComposer } from "./components/BoardComposer";
import { ProjectLauncher, type ProjectDraft } from "./components/ProjectLauncher";
import { SavedProjectPicker } from "./components/SavedProjectPicker";
import {
  ReferenceRoleAssigner,
  type AssignedReference,
} from "./components/ReferenceRoleAssigner";
import { StressTestStage } from "./components/StressTestStage";
import { WorkflowHistoryPanel } from "./components/WorkflowHistoryPanel";
import { WorkflowStageRail } from "./components/WorkflowStageRail";
import { stageToWorkflowStep, type WorkflowStepId } from "./workflow-steps";
import {
  canonicalReferenceAssetIds,
  nextCanonicalRoles,
  selectCanonicalSessionReferences,
  stressReferenceAssetIds,
} from "./generation-reference-policy";

const STRESS_CHANGE_CATEGORIES: Record<StressTestRole, "lighting" | "camera" | "action"> = {
  "stress-lighting": "lighting",
  "stress-angle": "camera",
  "stress-action": "action",
};

export type Stage =
  | "project-setup"
  | "references-ready"
  | "anchor-review"
  | "canonical-review"
  | "stress-testing"
  | "version-locked"
  | "asset-production"
  | "export-ready";

export type PendingAsset = {
  role: AssetRole;
  stateId?: string;
  parentAssetId?: string;
  changeSet?: AssetChangeSet;
  status: "queued" | "generating" | "ready" | "failed";
  result?: GeneratedAssetResult;
  error?: string;
};

export type AppState = {
  stage: Stage;
  project: CharacterProject | null;
  assets: CharacterAsset[];
  references: AssignedReference[];
  apiKey: string;
  adultConsent: boolean;
  rightsConsent: boolean;
  pendingResults: PendingAsset[];
  selectedVersionId: string | null;
  error: string;
};

type AppAction =
  | { type: "reset" }
  | { type: "references"; value: AssignedReference[] }
  | { type: "api-key"; value: string }
  | { type: "consent"; adultConsent: boolean; rightsConsent: boolean }
  | { type: "project-created"; project: CharacterProject }
  | { type: "project-opened"; project: CharacterProject; stage: Stage; selectedVersionId?: string }
  | { type: "project-version-created"; project: CharacterProject }
  | { type: "project-updated"; project: CharacterProject; stage?: Stage }
  | { type: "pending"; value: PendingAsset[]; stage?: Stage }
  | { type: "pending-replaced"; role: AssetRole; value: PendingAsset; stage?: Stage }
  | { type: "asset-accepted"; asset: CharacterAsset; stage: Stage }
  | { type: "stage"; stage: Stage }
  | { type: "error"; message: string };

export const initialAppState: AppState = {
  stage: "project-setup",
  project: null,
  assets: [],
  references: [],
  apiKey: "",
  adultConsent: false,
  rightsConsent: false,
  pendingResults: [],
  selectedVersionId: null,
  error: "",
};

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === "reset") return { ...initialAppState };
  switch (action.type) {
    case "references":
      return {
        ...state,
        references: action.value,
        adultConsent: false,
        rightsConsent: false,
        error: "",
      };
    case "api-key":
      return { ...state, apiKey: action.value };
    case "consent":
      return { ...state, adultConsent: action.adultConsent, rightsConsent: action.rightsConsent };
    case "project-created":
      return {
        ...state,
        project: action.project,
        assets: [...action.project.assets],
        selectedVersionId: action.project.currentVersionId,
        stage: "references-ready",
        error: "",
      };
    case "project-opened":
      return {
        ...state,
        project: action.project,
        assets: [...action.project.assets],
        references: [],
        apiKey: "",
        adultConsent: false,
        rightsConsent: false,
        pendingResults: [],
        selectedVersionId: action.selectedVersionId ?? action.project.currentVersionId,
        stage: action.stage,
        error: "",
      };
    case "project-version-created":
      return {
        ...state,
        project: action.project,
        assets: [...action.project.assets],
        selectedVersionId: action.project.currentVersionId,
        pendingResults: [],
        stage: "references-ready",
        error: "",
      };
    case "project-updated":
      return {
        ...state,
        project: action.project,
        assets: [...action.project.assets],
        stage: action.stage ?? state.stage,
        error: "",
      };
    case "pending":
      return {
        ...state,
        pendingResults: action.value,
        stage: action.stage ?? state.stage,
        error: "",
      };
    case "pending-replaced":
      return {
        ...state,
        pendingResults: replacePending(state.pendingResults, action.role, action.value),
        stage: action.stage ?? state.stage,
        error: "",
      };
    case "asset-accepted": {
      if (!state.project) return state;
      const project = structuredClone(state.project);
      let nextStage = action.stage;
      project.assets = [...project.assets.filter((asset) => asset.id !== action.asset.id), action.asset];
      const version = project.versions.find((item) => item.id === action.asset.versionId);
      if (version && isCanonicalRole(action.asset.role)) {
        version.canonicalAssetIds = [
          ...version.canonicalAssetIds.filter((id) => id !== action.asset.id),
          action.asset.id,
        ];
        const canonicalRoles = new Set(project.assets
          .filter((asset) => asset.versionId === version.id && asset.status === "ready" && isCanonicalRole(asset.role))
          .map((asset) => asset.role));
        if (CANONICAL_ROLES.every((role) => canonicalRoles.has(role))) {
          version.status = "testing";
          nextStage = "stress-testing";
        } else {
          nextStage = "canonical-review";
        }
      } else if (version && !isStressTestRole(action.asset.role)
        && !version.derivedStateIds.includes(action.asset.stateId)) {
        version.derivedStateIds.push(action.asset.stateId);
      }
      project.updatedAt = new Date().toISOString();
      return {
        ...state,
        project,
        assets: [...state.assets.filter((asset) => asset.id !== action.asset.id), action.asset],
        pendingResults: state.pendingResults.filter((pending) =>
          pending.stateId
            ? pending.stateId !== action.asset.stateId
            : pending.role !== action.asset.role),
        stage: nextStage,
        error: "",
      };
    }
    case "stage":
      return { ...state, stage: action.stage };
    case "error":
      return { ...state, error: action.message };
  }
}

export async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = { status: "fulfilled", value: await worker(items[index], index) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, run));
  return results;
}

export function replacePending(
  items: PendingAsset[],
  role: AssetRole,
  replacement: PendingAsset,
): PendingAsset[] {
  const existingIndex = replacement.stateId
    ? items.findIndex((item) => item.stateId === replacement.stateId)
    : items.findIndex((item) => item.role === role);
  if (existingIndex < 0) return [...items, replacement];
  return items.map((item, index) => index === existingIndex ? replacement : item);
}

export type AppProps = {
  api?: ClientApi;
  initialState?: AppState;
};

const initialDraft: ProjectDraft = {
  mode: null,
};

export function suggestedProjectName(fileName: string, mode: NonNullable<ProjectDraft["mode"]>, existingNames: string[] = []): string {
  const sourceName = fileName.replace(/\.(png|jpe?g|webp)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim().slice(0, 36).trim();
  const generic = /^(?:\d+|[a-f\d ]{12,}|(?:img|image|photo|picture|portrait|reference|adult|asset|截图|屏幕截图|微信图片)(?:\s*\d+)?)$/i;
  const base = sourceName.length >= 2 && !generic.test(sourceName)
    ? sourceName : (mode === "human-model-card" ? "真人模卡" : "虚拟角色");
  const used = new Set(existingNames);
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

function canonicalChange(role: CanonicalRole) {
  return {
    category: "identity" as const,
    instruction: role === "face-front" ? "建立标准正脸身份锚点" : `建立 ${role} 规范视图`,
    sourceStateId: role === "face-front" ? "source" : "base",
    targetStateId: "base",
  };
}

export default function App({ api = clientApi, initialState }: AppProps) {
  const [state, dispatch] = useReducer(appReducer, initialState ?? initialAppState);
  const [draft, setDraft] = useState<ProjectDraft>(() => ({ mode: initialState?.project?.mode ?? null }));
  const [channelReady, setChannelReady] = useState(false);
  const canGenerate = api === clientApi ? channelReady : Boolean(state.apiKey.trim());
  const [busy, setBusy] = useState(false);
  const [savedProjects, setSavedProjects] = useState<CharacterProject[]>([]);
  const [showSavedProjects, setShowSavedProjects] = useState(false);
  const savedProjectsCloseRef = useRef<HTMLButtonElement>(null);
  const [viewedWorkflowStep, setViewedWorkflowStep] = useState<WorkflowStepId | null>(null);
  const [assetWorkspaceInitialTab, setAssetWorkspaceInitialTab] = useState<AssetWorkspaceTab>(() => (window as any).GuguImageEdit?.studioPurpose === "assets" ? "expressions" : "model-card");
  const [baseWardrobe, setBaseWardrobe] = useState<BaseWardrobeDraft>({
    brief: "",
    reference: null,
  });

  useEffect(() => {
    if (initialState) return;
    let active = true;
    void api.listProjects().then((projects) => {
      if (active) setSavedProjects(projects);
    }).catch(() => {
      if (active) setSavedProjects([]);
    });
    return () => { active = false; };
  }, [api, initialState, state.stage]);

  useEffect(() => {
    if (!showSavedProjects) return;
    savedProjectsCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowSavedProjects(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showSavedProjects]);

  useEffect(() => {
    setViewedWorkflowStep(null);
  }, [state.project?.id, state.selectedVersionId, state.stage]);

  useEffect(() => {
    setBaseWardrobe({ brief: "", reference: null });
  }, [state.project?.id, state.selectedVersionId]);

  useEffect(() => {
    const onPurpose = (event: Event) => {
      const purpose = (event as CustomEvent).detail?.purpose || "model-card";
      setAssetWorkspaceInitialTab(purpose === "assets" ? "expressions" : "model-card");
    };
    window.addEventListener("gugu-studio-purpose", onPurpose);
    return () => window.removeEventListener("gugu-studio-purpose", onPurpose);
  }, []);


  const setupComplete = Boolean(
    draft.mode
    && state.references.length > 0
    && state.adultConsent
    && state.rightsConsent,
  );
  const version = state.project?.versions.find((item) => item.id === state.selectedVersionId);
  const historicalVersion = Boolean(version && (version.id !== state.project?.currentVersionId || version.status === "superseded"));
  const lockReady = version ? canLockVersion(version, state.assets) : false;

  async function establishProject(): Promise<void> {
    if (!setupComplete || !draft.mode || busy) return;
    setBusy(true);
    try {
      const displayName = suggestedProjectName(
        state.references[0]?.file.name || "",
        draft.mode,
        savedProjects.map((item) => item.displayName),
      );
      const project = await api.createProject({
        mode: draft.mode,
        title: `${displayName} 项目`,
        displayName,
      });
      dispatch({ type: "project-created", project });
    } catch (error) {
      dispatch({ type: "error", message: error instanceof Error ? error.message : "项目创建失败" });
    } finally {
      setBusy(false);
    }
  }

  async function openSavedProject(projectId: string): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      const project = await api.readProject(projectId);
      const current = project.versions.find((item) => item.id === project.currentVersionId);
      const stage: Stage = current?.status === "locked"
        ? "asset-production"
        : current?.status === "testing"
          ? "stress-testing"
          : current?.canonicalAssetIds.length
            ? "canonical-review"
            : "references-ready";
      dispatch({ type: "project-opened", project, stage });
    } catch (error) {
      dispatch({ type: "error", message: error instanceof Error ? error.message : "项目重开失败" });
    } finally {
      setBusy(false);
    }
  }

  async function generateCanonical(role: CanonicalRole): Promise<GeneratedAssetResult> {
    if (!state.project || !state.selectedVersionId) throw new Error("项目或版本不存在");
    if (!canGenerate) throw new Error("请先在 Gugu 接口设置中配置所选渠道");
    const currentReferenceIds = canonicalReferenceAssetIds(
      role,
      state.assets,
      state.selectedVersionId,
    );
    const selectedVersion = state.project.versions.find((item) => item.id === state.selectedVersionId);
    const inheritedFace = role === "face-front"
      && currentReferenceIds.length === 0
      && selectedVersion?.createdFromVersionId
      ? state.assets.find((asset) =>
        asset.versionId === selectedVersion.createdFromVersionId
        && asset.status === "ready"
        && asset.role === "face-front")
      : undefined;
    const inheritedFaceIds = inheritedFace ? [inheritedFace.id] : [];
    const sessionReferences = selectCanonicalSessionReferences(role, state.references);
    const generationReferences = sessionReferences.map((reference) => ({
      file: reference.file,
      role: reference.role,
    }));
    if (role === "body-front" && baseWardrobe.reference) {
      generationReferences.push({ file: baseWardrobe.reference, role: "wardrobe-state" });
    }
    return api.generateAsset({
      projectId: state.project.id,
      versionId: state.selectedVersionId,
      assetRole: role,
      changeSet: canonicalChange(role),
      references: generationReferences,
      referenceAssetIds: currentReferenceIds.length ? currentReferenceIds : inheritedFaceIds,
      apiKey: state.apiKey,
      adultConsent: state.adultConsent,
      rightsConsent: state.rightsConsent,
      ...(role === "body-front" && baseWardrobe.brief.trim()
        ? { baseWardrobeBrief: baseWardrobe.brief.trim() }
        : {}),
    });
  }

  async function generateAnchor(): Promise<void> {
    if (busy) return;
    setBusy(true);
    dispatch({
      type: "pending",
      value: [{ role: "face-front", status: "generating" }],
      stage: "anchor-review",
    });
    try {
      const result = await generateCanonical("face-front");
      dispatch({
        type: "pending",
        value: [{ role: "face-front", status: "ready", result }],
        stage: "anchor-review",
      });
    } catch (error) {
      dispatch({
        type: "pending",
        value: [{
          role: "face-front",
          status: "failed",
          error: error instanceof Error ? error.message : "身份锚点生成失败",
        }],
        stage: "anchor-review",
      });
    } finally {
      setBusy(false);
    }
  }

  async function generateRemainingCanonical(): Promise<void> {
    if (busy) return;
    if (!state.selectedVersionId) return;
    const roles = nextCanonicalRoles(state.assets, state.selectedVersionId)
      .filter((role) => role !== "face-front");
    setBusy(true);
    dispatch({
      type: "pending",
      value: roles.map((role) => ({ role, status: "generating" })),
      stage: "canonical-review",
    });
    const results = await runWithConcurrency(roles, 2, (role) => generateCanonical(role));
    dispatch({
      type: "pending",
      value: roles.map((role, index) => {
        const result = results[index];
        return result.status === "fulfilled"
          ? { role, status: "ready" as const, result: result.value }
          : {
            role,
            status: "failed" as const,
            error: result.reason instanceof Error ? result.reason.message : "生成失败",
          };
      }),
      stage: "canonical-review",
    });
    setBusy(false);
  }

  async function retryCanonicalAsset(role: CanonicalRole): Promise<void> {
    if (busy) return;
    setBusy(true);
    dispatch({
      type: "pending-replaced",
      role,
      value: { role, status: "generating" },
      stage: "canonical-review",
    });
    try {
      const result = await generateCanonical(role);
      dispatch({
        type: "pending-replaced",
        role,
        value: { role, status: "ready", result },
        stage: "canonical-review",
      });
    } catch (error) {
      dispatch({
        type: "pending-replaced",
        role,
        value: {
          role,
          status: "failed",
          error: error instanceof Error ? error.message : "生成失败",
        },
        stage: "canonical-review",
      });
    } finally {
      setBusy(false);
    }
  }

  async function acceptAsset(role: CanonicalRole): Promise<void> {
    const pending = state.pendingResults.find((item) => item.role === role && item.result);
    if (!pending?.result || !state.project || !state.selectedVersionId) return;
    try {
      const asset = await api.saveApprovedAsset({
        projectId: state.project.id,
        versionId: state.selectedVersionId,
        assetRole: role,
        stateId: "base",
        imageB64: pending.result.imageB64,
        changeSet: pending.result.recipe.changeSet,
        recipe: pending.result.recipe,
      });
      const nextAssets = [...state.assets, asset];
      const hasAllCanonical = CANONICAL_ROLES.every((canonicalRole) =>
        nextAssets.some((item) =>
          item.versionId === state.selectedVersionId
          && item.role === canonicalRole
          && item.status === "ready"));
      dispatch({
        type: "asset-accepted",
        asset,
        stage: hasAllCanonical ? "stress-testing" : "canonical-review",
      });
    } catch (error) {
      dispatch({ type: "error", message: error instanceof Error ? error.message : "资产保存失败" });
    }
  }

  async function generateStressTests(): Promise<void> {
    if (!state.project || !state.selectedVersionId || busy) return;
    if (!canGenerate) {
      dispatch({ type: "error", message: "请先在 Gugu 接口设置中配置所选渠道" });
      return;
    }
    const roles: StressTestRole[] = ["stress-lighting", "stress-angle", "stress-action"];
    const parent = state.assets.find((asset) =>
      asset.versionId === state.selectedVersionId && asset.role === "face-front" && asset.status === "ready");
    if (!parent) {
      dispatch({ type: "error", message: "当前版本缺少 face-front 压力测试父资产" });
      return;
    }
    setBusy(true);
    dispatch({
      type: "pending",
      value: roles.map((role) => ({
        role,
        stateId: role,
        parentAssetId: parent.id,
        status: "generating",
      })),
    });
    const results = await runWithConcurrency(roles, 2, (role) => generateStressAsset(role, parent.id));
    dispatch({
      type: "pending",
      value: roles.map((role, index) => {
        const result = results[index];
        return result.status === "fulfilled"
          ? {
            role,
            stateId: role,
            parentAssetId: parent.id,
            status: "ready" as const,
            result: result.value,
          }
          : {
            role,
            stateId: role,
            parentAssetId: parent.id,
            status: "failed" as const,
            error: result.reason instanceof Error ? result.reason.message : "压力测试生成失败",
          };
      }),
    });
    setBusy(false);
  }

  function generateStressAsset(role: StressTestRole, parentAssetId: string): Promise<GeneratedAssetResult> {
    return api.generateAsset({
      projectId: state.project!.id,
      versionId: state.selectedVersionId!,
      assetRole: role,
      changeSet: {
        category: STRESS_CHANGE_CATEGORIES[role],
        instruction: `执行 ${role} 一致性压力测试`,
        sourceStateId: "base",
        targetStateId: role,
      },
      parentAssetId,
      references: [],
      referenceAssetIds: stressReferenceAssetIds(state.assets, state.selectedVersionId!),
      apiKey: state.apiKey,
      adultConsent: state.adultConsent,
      rightsConsent: state.rightsConsent,
    });
  }

  async function retryStressTest(role: StressTestRole): Promise<void> {
    if (!state.project || !state.selectedVersionId || busy) return;
    const failed = state.pendingResults.find((item) => item.role === role && item.status === "failed");
    if (!failed) return;
    if (!canGenerate) {
      dispatch({ type: "error", message: "请先在 Gugu 接口设置中配置所选渠道" });
      return;
    }
    const parent = state.assets.find((asset) =>
      asset.versionId === state.selectedVersionId && asset.role === "face-front" && asset.status === "ready");
    if (!parent) {
      dispatch({ type: "error", message: "当前版本缺少 face-front 压力测试父资产" });
      return;
    }
    setBusy(true);
    dispatch({
      type: "pending-replaced",
      role,
      value: { role, stateId: role, parentAssetId: parent.id, status: "generating" },
    });
    try {
      const result = await generateStressAsset(role, parent.id);
      dispatch({
        type: "pending-replaced",
        role,
        value: { role, stateId: role, parentAssetId: parent.id, status: "ready", result },
      });
    } catch (error) {
      dispatch({
        type: "pending-replaced",
        role,
        value: {
          role,
          stateId: role,
          parentAssetId: parent.id,
          status: "failed",
          error: error instanceof Error ? error.message : "压力测试生成失败",
        },
      });
    } finally {
      setBusy(false);
    }
  }

  function rejectAsset(role: CanonicalRole): void {
    discardCandidate(state.pendingResults.find(item => item.role === role)?.result);
    dispatch({
      type: "pending",
      value: state.pendingResults.filter((item) => item.role !== role),
      stage: role === "face-front" ? "references-ready" : "canonical-review",
    });
  }

  async function approveStressTestsAndLock(): Promise<void> {
    if (!state.project || !version || busy) return;
    const roles = Object.keys(STRESS_CHANGE_CATEGORIES) as StressTestRole[];
    const approved = new Set(version.stressTests
      .filter((result) => result.passed)
      .map((result) => result.role));
    const ready = roles.every((role) => approved.has(role)
      || state.pendingResults.some((item) => item.role === role
        && item.status === "ready" && item.result && item.parentAssetId));
    if (!ready) {
      dispatch({ type: "error", message: "请先生成并检查三张一致性图片" });
      return;
    }

    setBusy(true);
    try {
      for (const role of roles) {
        if (approved.has(role)) continue;
        const pending = state.pendingResults.find((item) => item.role === role
          && item.status === "ready" && item.result && item.parentAssetId);
        if (!pending?.result || !pending.parentAssetId) throw new Error(`缺少 ${role} 检查结果`);
        const asset = await api.saveApprovedAsset({
          projectId: state.project.id,
          versionId: version.id,
          assetRole: role,
          stateId: role,
          parentAssetId: pending.parentAssetId,
          imageB64: pending.result.imageB64,
          changeSet: pending.result.recipe.changeSet,
          recipe: pending.result.recipe,
        });
        await api.reviewStress({
          projectId: state.project.id,
          versionId: version.id,
          role,
          assetId: asset.id,
          passed: true,
        });
      }
      const saved = await api.lockVersion(state.project.id, version.id);
      state.pendingResults
        .filter((item) => isStressTestRole(item.role))
        .forEach((item) => discardCandidate(item.result));
      dispatch({ type: "project-updated", project: saved, stage: "version-locked" });
      dispatch({
        type: "pending",
        value: state.pendingResults.filter((item) => !isStressTestRole(item.role)),
        stage: "version-locked",
      });
    } catch (error) {
      dispatch({ type: "error", message: error instanceof Error ? error.message : "角色确认失败" });
    } finally {
      setBusy(false);
    }
  }

  async function rejectAndRetryStress(role: StressTestRole): Promise<void> {
    if (!state.project || !version || busy) return;
    if (!canGenerate) {
      dispatch({ type: "error", message: "请先在 Gugu 接口设置中配置所选渠道" });
      return;
    }
    const parent = state.assets.find((asset) =>
      asset.versionId === version.id && asset.role === "face-front" && asset.status === "ready");
    if (!parent) {
      dispatch({ type: "error", message: "当前版本缺少 face-front 一致性检查父资产" });
      return;
    }

    setBusy(true);
    try {
      const reviewed = await api.reviewStress({
        projectId: state.project.id,
        versionId: version.id,
        role,
        passed: false,
      });
      dispatch({ type: "project-updated", project: reviewed });
      discardCandidate(state.pendingResults.find((item) => item.role === role)?.result);
      dispatch({
        type: "pending-replaced",
        role,
        value: { role, stateId: role, parentAssetId: parent.id, status: "generating" },
      });
      const result = await generateStressAsset(role, parent.id);
      dispatch({
        type: "pending-replaced",
        role,
        value: { role, stateId: role, parentAssetId: parent.id, status: "ready", result },
      });
    } catch (error) {
      dispatch({
        type: "pending-replaced",
        role,
        value: {
          role,
          stateId: role,
          parentAssetId: parent.id,
          status: "failed",
          error: error instanceof Error ? error.message : "一致性检查重新生成失败",
        },
      });
    } finally {
      setBusy(false);
    }
  }

  async function generateDerivedAssets(requests: DerivedAssetRequest[]): Promise<void> {
    if (!state.project || !state.selectedVersionId || busy || requests.length === 0) return;
    if (!canGenerate) {
      dispatch({ type: "error", message: "请先在 Gugu 接口设置中配置所选渠道" });
      return;
    }
    const currentAssets = state.assets.filter((asset) =>
      asset.versionId === state.selectedVersionId && asset.status === "ready");
    const prepared = requests.map((request) => {
      const parent = currentAssets.find((asset) => asset.role === request.preferredParentRole)
        ?? currentAssets.find((asset) => isCanonicalRole(asset.role));
      if (!parent) throw new Error("当前版本缺少可用的身份父资产");
      const referenceAssetIds = Array.from(new Set([
        parent.id,
        ...currentAssets
          .filter((asset) => asset.role === "face-front" || asset.role === "body-front")
          .map((asset) => asset.id),
      ]));
      return { request, parent, referenceAssetIds };
    });

    setBusy(true);
    dispatch({
      type: "pending",
      value: prepared.map(({ request, parent }) => ({
        role: request.role,
        stateId: request.stateId,
        parentAssetId: parent.id,
        changeSet: request.changeSet,
        status: "generating",
      })),
      stage: "asset-production",
    });
    const results = await runWithConcurrency(prepared, 2, ({ request, parent, referenceAssetIds }) =>
      generateDerivedAsset(request.role, parent.id, request.changeSet, referenceAssetIds));
    dispatch({
      type: "pending",
      value: prepared.map(({ request, parent }, index) => {
        const result = results[index];
        return result.status === "fulfilled"
          ? {
            role: request.role,
            stateId: request.stateId,
            parentAssetId: parent.id,
            changeSet: request.changeSet,
            status: "ready" as const,
            result: result.value,
          }
          : {
            role: request.role,
            stateId: request.stateId,
            parentAssetId: parent.id,
            changeSet: request.changeSet,
            status: "failed" as const,
            error: result.reason instanceof Error ? result.reason.message : "派生资产生成失败",
          };
      }),
      stage: "asset-production",
    });
    setBusy(false);
  }

  function generateDerivedAsset(
    role: AssetRole,
    parentAssetId: string,
    changeSet: AssetChangeSet,
    referenceAssetIds: string[],
  ): Promise<GeneratedAssetResult> {
    return api.generateAsset({
      projectId: state.project!.id,
      versionId: state.selectedVersionId!,
      assetRole: role,
      parentAssetId,
      changeSet,
      references: [],
      referenceAssetIds,
      apiKey: state.apiKey,
      ...(role === "expression" ? { size: "1024x1024" as const } : {}),
      adultConsent: state.adultConsent,
      rightsConsent: state.rightsConsent,
    });
  }

  async function retryDerivedAsset(stateId: string): Promise<void> {
    if (!state.project || !state.selectedVersionId || busy) return;
    const failed = state.pendingResults.find((item) =>
      item.stateId === stateId && item.status === "failed");
    if (!failed?.parentAssetId || !failed.changeSet) {
      dispatch({ type: "error", message: "失败项缺少可安全重试的变化合同" });
      return;
    }
    if (!canGenerate) {
      dispatch({ type: "error", message: "请先在 Gugu 接口设置中配置所选渠道" });
      return;
    }
    const parent = state.assets.find((asset) =>
      asset.id === failed.parentAssetId
      && asset.versionId === state.selectedVersionId
      && asset.status === "ready");
    if (!parent) {
      dispatch({ type: "error", message: "派生资产父资产已不可用" });
      return;
    }
    const currentAssets = state.assets.filter((asset) =>
      asset.versionId === state.selectedVersionId && asset.status === "ready");
    const referenceAssetIds = Array.from(new Set([
      parent.id,
      ...currentAssets
        .filter((asset) => asset.role === "face-front" || asset.role === "body-front")
        .map((asset) => asset.id),
    ]));
    setBusy(true);
    dispatch({
      type: "pending-replaced",
      role: failed.role,
      value: {
        role: failed.role,
        stateId,
        parentAssetId: parent.id,
        changeSet: failed.changeSet,
        status: "generating",
      },
      stage: "asset-production",
    });
    try {
      const result = await generateDerivedAsset(
        failed.role,
        parent.id,
        failed.changeSet,
        referenceAssetIds,
      );
      dispatch({
        type: "pending-replaced",
        role: failed.role,
        value: {
          role: failed.role,
          stateId,
          parentAssetId: parent.id,
          changeSet: failed.changeSet,
          status: "ready",
          result,
        },
        stage: "asset-production",
      });
    } catch (error) {
      dispatch({
        type: "pending-replaced",
        role: failed.role,
        value: {
          role: failed.role,
          stateId,
          parentAssetId: parent.id,
          changeSet: failed.changeSet,
          status: "failed",
          error: error instanceof Error ? error.message : "派生资产生成失败",
        },
        stage: "asset-production",
      });
    } finally {
      setBusy(false);
    }
  }

  async function acceptDerivedAsset(stateId: string): Promise<void> {
    const pending = state.pendingResults.find((item) => item.stateId === stateId && item.result);
    if (!pending?.result || !pending.parentAssetId || !state.project || !state.selectedVersionId) return;
    try {
      const asset = await api.saveApprovedAsset({
        projectId: state.project.id,
        versionId: state.selectedVersionId,
        assetRole: pending.role,
        stateId,
        parentAssetId: pending.parentAssetId,
        imageB64: pending.result.imageB64,
        changeSet: pending.result.recipe.changeSet,
        recipe: pending.result.recipe,
      });
      dispatch({ type: "asset-accepted", asset, stage: "asset-production" });
    } catch (error) {
      dispatch({ type: "error", message: error instanceof Error ? error.message : "派生资产保存失败" });
    }
  }

  function rejectDerivedAsset(stateId: string): void {
    discardCandidate(state.pendingResults.find(item => item.stateId === stateId)?.result);
    dispatch({
      type: "pending",
      value: state.pendingResults.filter((item) => item.stateId !== stateId),
      stage: "asset-production",
    });
  }

  async function createIdentityVersion(): Promise<void> {
    if (!state.project || busy) return;
    setBusy(true);
    try {
      const saved = await api.createIdentityVersion(state.project.id);
      dispatch({ type: "project-version-created", project: saved });
    } catch (error) {
      dispatch({ type: "error", message: error instanceof Error ? error.message : "身份新版本创建失败" });
    } finally {
      setBusy(false);
    }
  }

  const railStage = stageToWorkflowStep(state.stage);

  function selectWorkflowStep(step: WorkflowStepId): void {
    if (!state.project || !version) return;
    setViewedWorkflowStep((current) => {
      if (step !== railStage) return step;
      return current === null ? step : null;
    });
  }

  function leaveProject(): void {
    if (state.pendingResults.some(item => item.result) && !confirm("返回项目列表将清空未接受的候选图，继续？")) return;
    state.pendingResults.forEach(item => discardCandidate(item.result));
    setDraft(initialDraft);
    dispatch({type:"reset"});
  }

  function selectVersion(id:string): void {
    if (!state.project) return;
    if (state.pendingResults.some(item => item.result) && !confirm("切换版本将清空未接受的候选图，继续？")) return;
    state.pendingResults.forEach(item => discardCandidate(item.result));
    const selected = state.project.versions.find(item => item.id === id)!;
    const stage: Stage = selected.status === 'locked' || selected.status === 'superseded'
      ? 'asset-production'
      : selected.status === 'testing' ? 'stress-testing'
        : selected.canonicalAssetIds.length ? 'canonical-review' : 'references-ready';
    dispatch({type:"project-opened",project:state.project,selectedVersionId:id,stage});
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="brand-lockup">
          <span className="brand-glyph" aria-hidden="true">CM</span>
          <div><p className="eyebrow">PORTRAIT CREATION</p><h1>人物与角色素材</h1></div>
        </div>
        <p className="masthead-copy">添加参考、确认人物，然后制作标准模卡、表情、服装或动作。</p>
        <div className="local-status"><span /> LOCAL ONLY</div>
      </header>

      <ChannelControls disabled={busy} onReady={setChannelReady} contextKey={`${state.project?.id}/${state.selectedVersionId}`} anchor={state.assets.find(asset => asset.versionId === state.selectedVersionId && asset.role === 'face-front')?.recipe} />
      {state.project && <div className="project-tools">
        <button disabled={busy} onClick={leaveProject}>项目首页</button>
        <button disabled={busy} onClick={() => selectWorkflowStep(railStage)}>{viewedWorkflowStep ? "返回当前任务" : "查看当前步骤记录"}</button>
        <label>角色版本 <select value={state.selectedVersionId ?? ''} disabled={busy} onChange={event => selectVersion(event.target.value)}>
          {state.project.versions.map(item => <option key={item.id} value={item.id}>{item.id} · {item.status}</option>)}
        </select></label>
      </div>}
      <WorkflowStageRail
        currentStep={railStage}
        viewedStep={viewedWorkflowStep}
        onSelect={selectWorkflowStep}
      />

      <main className="workspace">
        {state.stage === "project-setup" ? (
          <>
            <div className="workspace-intro">
              <div><p className="kicker">STEP 1 · CREATE</p><h2>创建你的角色</h2></div>
              <div className="workspace-intro-actions">
                <p>选择类型并上传参考图，项目会按文件名自动命名。参考原图只用于当前会话。</p>
                <button type="button" onClick={() => setShowSavedProjects(true)}>打开已有角色</button>
              </div>
            </div>
            {showSavedProjects && (
              <div className="saved-projects-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSavedProjects(false); }}>
                <section className="saved-projects-dialog" role="dialog" aria-modal="true" aria-labelledby="saved-projects-dialog-title">
                  <header>
                    <h2 id="saved-projects-dialog-title">已有角色与备份</h2>
                    <button ref={savedProjectsCloseRef} type="button" onClick={() => setShowSavedProjects(false)} aria-label="关闭已有角色">×</button>
                  </header>
                  {savedProjects.length > 0
                    ? <SavedProjectPicker projects={savedProjects} onOpen={(id) => { setShowSavedProjects(false); void openSavedProject(id); }} />
                    : <p className="saved-projects-empty">暂无本地角色项目。</p>}
                  <div className="saved-projects-import">
                    <strong>导入角色备份</strong>
                    <ImportProject onImported={() => { void api.listProjects().then(setSavedProjects); }} />
                  </div>
                </section>
              </div>
            )}
            <div className="setup-grid guided-setup">
              <ProjectLauncher value={draft} onChange={setDraft} />
              <ReferenceRoleAssigner
                value={state.references}
                onChange={(value) => dispatch({ type: "references", value })}
              />
            </div>
            <section className="control-deck" aria-label="生成授权与控制">
              <ConsentGate
                adultConsent={state.adultConsent}
                rightsConsent={state.rightsConsent}
                onChange={(value) => dispatch({ type: "consent", ...value })}
              />
              <div className="primary-action-wrap">
                <span>下一步会先创建项目，不会立即生成图片；进入标准形象后再由你确认发起。</span>
                <button
                  className="primary-action"
                  type="button"
                  disabled={!setupComplete || busy}
                  onClick={() => void establishProject()}
                >
                  {busy ? "正在创建角色…" : "创建角色并继续"}<b aria-hidden="true">↗</b>
                </button>
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="project-context">
              <div><span>当前角色</span><strong>{state.project?.displayName}</strong><small>{state.project?.title}</small></div>
              <div><span>角色版本</span><strong>{version?.id}</strong></div>
              <div><span>当前状态</span><strong>{version?.status === "locked" ? "标准形象已确认" : version?.status === "testing" ? "正在检查一致性" : "正在建立标准形象"}</strong></div>

            </div>
            <section className="session-authorization" aria-label="当前会话生成授权">
              <span>每次重新打开项目，都需要确认本次图片使用授权。</span>
              <ConsentGate
                adultConsent={state.adultConsent}
                rightsConsent={state.rightsConsent}
                onChange={(value) => dispatch({ type: "consent", ...value })}
              />
            </section>

            {(viewedWorkflowStep || historicalVersion) && state.project && version ? (
              <WorkflowHistoryPanel
                step={viewedWorkflowStep ?? "asset-production"}
                project={state.project}
                version={version}
                assets={state.assets}
                references={state.references}
                onReturn={() => historicalVersion ? selectVersion(state.project!.currentVersionId) : setViewedWorkflowStep(null)}
              />
            ) : (
              <>
                {version
              && ["references-ready", "anchor-review", "canonical-review"].includes(state.stage)
              && !state.assets.some((asset) => asset.versionId === version.id
                && asset.role === "face-front" && asset.status === "ready") && (
              <section className="session-reference-panel" aria-label="当前会话参考图">
                <div>
                  <p className="kicker">REFERENCE IMAGES</p>
                  <h2>重新添加角色参考图</h2>
                  <p>参考原图不会写入项目。重新打开尚未建立标准形象的角色时，请再次添加。</p>
                </div>
                <ReferenceRoleAssigner
                  value={state.references}
                  onChange={(value) => dispatch({ type: "references", value })}
                />
              </section>
            )}

            {["references-ready", "anchor-review", "canonical-review"].includes(state.stage) && (
              <IdentityAnchorStage
                stage={state.stage as "references-ready" | "anchor-review" | "canonical-review"}
                projectId={state.project!.id}
                versionId={state.selectedVersionId!}
                assets={state.assets}
                pendingResults={state.pendingResults}
                baseWardrobe={baseWardrobe}
                onBaseWardrobeChange={setBaseWardrobe}
                onGenerateAnchor={() => void generateAnchor()}
                onGenerateRemaining={() => void generateRemainingCanonical()}
                onAccept={(role) => void acceptAsset(role)}
                onReject={rejectAsset}
                onRetry={(role) => void retryCanonicalAsset(role)}
              />
            )}

            {state.stage === "stress-testing" && version && (
              <StressTestStage
                projectId={state.project!.id}
                versionId={version.id}
                baselineAssetId={state.assets.find((asset) => asset.versionId === version.id && asset.role === "body-front" && asset.status === "ready")?.id}
                results={version.stressTests}
                canLock={lockReady}
                locked={version.status === "locked"}
                pendingResults={state.pendingResults}
                generating={busy}
                onGenerate={() => void generateStressTests()}
                onRetry={(role) => void retryStressTest(role)}
                onReject={(role) => void rejectAndRetryStress(role)}
                onApproveAll={() => void approveStressTestsAndLock()}
              />
            )}

            {(["version-locked", "asset-production"] as Stage[]).includes(state.stage)
              && state.project && version && (
              <AssetGroupWorkspace
                project={state.project}
                version={version}
                assets={state.assets}
                pendingResults={state.pendingResults}
                generating={busy}
                initialTab={assetWorkspaceInitialTab}
                onGenerate={(requests) => void generateDerivedAssets(requests)}
                onAccept={(stateId) => void acceptDerivedAsset(stateId)}
                onReject={rejectDerivedAsset}
                onRetry={(stateId) => void retryDerivedAsset(stateId)}
                onCreateIdentityVersion={() => void createIdentityVersion()}
                onOpenExports={() => dispatch({ type: "stage", stage: "export-ready" })}
              />
            )}

            {state.stage === "export-ready" && state.project && version && (
              <BoardComposer
                api={api}
                project={state.project}
                version={version}
                assets={state.assets}
                onBack={(target = "model-card") => {
                  setAssetWorkspaceInitialTab(target);
                  dispatch({ type: "stage", stage: "asset-production" });
                }}
              />
            )}
              </>
            )}
          </>
        )}
        {state.error && <p className="error-banner" role="alert">{state.error}</p>}
      </main>
    </div>
  );
}
