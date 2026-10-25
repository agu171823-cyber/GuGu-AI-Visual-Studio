import { getGenerationSelection } from "./channel-settings";
import type {
  AssetChangeSet,
  CharacterAsset,
  GenerationRecipe,
} from "../shared/asset-schema";
import type { ImageQuality, ImageSize } from "../shared/contracts";
import type {
  CharacterProject,
  CreateDraftProjectInput,
} from "../shared/project-schema";
import type { AssetRole, StressTestRole } from "../shared/templates";

export type AssignedReferenceInput = {
  file: File;
  role: AssetRole;
};

export type GenerateAssetInput = {
  projectId: string;
  versionId: string;
  assetRole: AssetRole;
  parentAssetId?: string;
  changeSet: AssetChangeSet;
  references: AssignedReferenceInput[];
  referenceAssetIds: string[];
  apiKey: string;
  baseUrl?: string;
  model?: "gpt-image-2";
  size?: ImageSize;
  quality?: ImageQuality;
  adultConsent: boolean;
  rightsConsent: boolean;
  baseWardrobeBrief?: string;
};

export type GeneratedAssetResult = {
  candidateId?: string;
  imageB64: string;
  provider: "147" | "default" | "volc";
  model: string;
  size: ImageSize;
  latencyMs: number;
  recipe: GenerationRecipe;
  promptPreview?: string;
};

export type SaveApprovedAssetInput = {
  projectId: string;
  versionId: string;
  assetRole: AssetRole;
  stateId: string;
  parentAssetId?: string;
  imageB64: string;
  changeSet: AssetChangeSet;
  recipe: GenerationRecipe;
};

export type ClientApi = {
  validateKey(input: { apiKey: string; baseUrl?: string; model?: string }): Promise<{
    valid: boolean;
    modelAvailable: boolean;
  }>;
  createProject(input: CreateDraftProjectInput): Promise<CharacterProject>;
  listProjects(): Promise<CharacterProject[]>;
  readProject(projectId: string): Promise<CharacterProject>;
  createIdentityVersion(projectId: string): Promise<CharacterProject>;
  reviewStress(input: {
    projectId: string;
    versionId: string;
    role: StressTestRole;
    assetId?: string;
    passed: boolean;
  }): Promise<CharacterProject>;
  lockVersion(projectId: string, versionId: string): Promise<CharacterProject>;
  generateAsset(input: GenerateAssetInput): Promise<GeneratedAssetResult>;
  saveApprovedAsset(input: SaveApprovedAssetInput): Promise<CharacterAsset>;
  exportProject(
    projectId: string,
    kind: "display-board" | "model-pack",
    options?: { versionId?: string; includeBodyOnly?: boolean },
  ): Promise<{
    exportId: string;
    kind: string;
    relativeFiles: string[];
    downloadUrl?: string;
  }>;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({ error: "服务返回了无法识别的内容" })) as T & {
    error?: string;
  };
  if (!response.ok) {
    if (response.status === 404 && /接口不存在|API 路由不存在/.test(payload.error || '')) {
      throw new Error('角色工作室后端未加载，请关闭旧版 Gugu 后重新启动当前版本');
    }
    throw new Error(payload.error || `请求失败（${response.status}）`);
  }
  return payload;
}

const candidateReceipts = new Map<string, string>();

export const clientApi: ClientApi = {
  async validateKey(input) {
    const response = await fetch("/api/character/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: input.apiKey,
        baseUrl: input.baseUrl ?? "https://147ai.com/v1",
        model: input.model ?? "gpt-image-2",
      }),
    });
    return readJson(response);
  },

  async createProject(input) {
    const response = await fetch("/api/character/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return readJson(response);
  },

  async listProjects() {
    return readJson(await fetch("/api/character/projects"));
  },

  async readProject(projectId) {
    return readJson(await fetch(`/api/character/projects/${encodeURIComponent(projectId)}`));
  },

  async createIdentityVersion(projectId) {
    const response = await fetch(`/api/character/projects/${encodeURIComponent(projectId)}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-version" }),
    });
    return readJson(response);
  },

  async reviewStress(input) {
    const response = await fetch(`/api/character/projects/${encodeURIComponent(input.projectId)}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review-stress",
        versionId: input.versionId,
        role: input.role,
        ...(input.assetId ? { assetId: input.assetId } : {}),
        passed: input.passed,
      }),
    });
    return readJson(response);
  },

  async lockVersion(projectId, versionId) {
    const response = await fetch(`/api/character/projects/${encodeURIComponent(projectId)}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock-version", versionId }),
    });
    return readJson(response);
  },

  async generateAsset(input) {
    const form = new FormData();
    form.set("projectId", input.projectId);
    form.set("versionId", input.versionId);
    form.set("assetRole", input.assetRole);
    if (input.parentAssetId) form.set("parentAssetId", input.parentAssetId);
    form.set("changeSet", JSON.stringify(input.changeSet));
    form.set("referenceAssetIds", JSON.stringify(input.referenceAssetIds));
    const selected = getGenerationSelection();
    for (const [key, value] of Object.entries(selected)) form.set(key, value);
    form.set("clientRequestId", crypto.randomUUID());
    form.set("size", input.size ?? "1024x1536");
    form.set("quality", selected.quality);
    form.set("adultConsent", String(input.adultConsent));
    form.set("rightsConsent", String(input.rightsConsent));
    if (input.baseWardrobeBrief) form.set("baseWardrobeBrief", input.baseWardrobeBrief);
    for (const reference of input.references) {
      form.append("image", reference.file);
      form.append("imageRole", reference.role);
    }
    const task = await readJson<{id: string}>(await fetch('/api/character/generate', {method:'POST', body:form}));
    let payload: Omit<GeneratedAssetResult, 'recipe'> & {recipeDraft: GenerationRecipe};
    for (;;) {
      const update = await readJson<{status:string; result?: typeof payload; error?:string}>(await fetch('/api/character/tasks/' + task.id));
      if (update.status === 'failed') throw new Error(update.error || '生成失败');
      if (update.status === 'succeeded' && update.result) { payload = update.result; break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    candidateReceipts.set(JSON.stringify(payload.recipeDraft), task.id);
    const { recipeDraft, ...result } = payload;
    return { ...result, candidateId: task.id, recipe: recipeDraft };
  },

  async saveApprovedAsset(input) {
    const { projectId } = input;
    const candidateId = candidateReceipts.get(JSON.stringify(input.recipe));
    if (!candidateId) throw new Error("候选图已过期，请重新生成");
    const body = { candidateId };
    const response = await fetch(`/api/character/projects/${encodeURIComponent(projectId)}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return readJson(response);
  },

  async exportProject(projectId, kind, options) {
    const response = await fetch(`/api/character/projects/${encodeURIComponent(projectId)}/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...options }),
    });
    return readJson(response);
  },
};

export function discardCandidate(result?: GeneratedAssetResult): void {
  if (!result?.candidateId) return;
  candidateReceipts.delete(JSON.stringify(result.recipe));
  void fetch('/api/character/tasks/' + result.candidateId, {method:'DELETE'}).catch(() => {});
}
