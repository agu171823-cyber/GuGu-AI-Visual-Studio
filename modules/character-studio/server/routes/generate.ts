import type { Hono } from "hono";
import type {
  AssetChangeSet,
  GenerationRecipe,
  ReferenceSource,
} from "../../shared/asset-schema";
import type { ImageQuality, ImageSize } from "../../shared/contracts";
import { isAssetRole, type AssetRole } from "../../shared/templates";
import {
  assertGenerationReferenceContract,
  assertSingleVariableChange,
  compileIdentityPrompt,
  orderReferenceSources,
} from "../prompt/identity-compiler";
import { ProviderError, type ImageProvider } from "../providers/provider";
import type { ProjectRegistry } from "../storage/project-registry";
import { assertAssetOperation } from "../domain/asset-policy";

export type GenerationIntegration = { resolve(form: FormData, role: AssetRole): { providerId: 'default' | 'volc'; model: string; size: ImageSize; quality: ImageQuality; promptOptimization: 'standard' | 'fast' } };

const IMAGE_SIZES = new Set<ImageSize>(["1024x1024", "1024x1536", "1536x1024"]);
const IMAGE_QUALITIES = new Set<ImageQuality>(["low", "medium", "high"]);
const CHANGE_CATEGORIES = new Set([
  "identity",
  "expression",
  "wardrobe",
  "action",
  "condition",
  "background",
  "lighting",
  "camera",
]);

class RequestError extends Error {}

function parseJson<T>(value: FormDataEntryValue | null, fallback?: T): T {
  if (value === null && fallback !== undefined) return fallback;
  if (typeof value !== "string") throw new RequestError("请求字段格式无效");
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new RequestError("请求 JSON 字段无效");
  }
}

function requiredText(form: FormData, key: string): string {
  const value = form.get(key);
  if (typeof value !== "string" || !value.trim()) throw new RequestError(`缺少字段：${key}`);
  return value.trim();
}

function optionalText(form: FormData, key: string, limit: number): string | undefined {
  const value = form.get(key);
  if (value === null) return undefined;
  if (typeof value !== "string") throw new RequestError(`${key} 字段格式无效`);
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length > limit) throw new RequestError(`${key} 不得超过 ${limit} 个字符`);
  return cleaned || undefined;
}

function parseChangeSet(form: FormData): AssetChangeSet {
  const value = parseJson<unknown>(form.get("changeSet"));
  if (
    typeof value !== "object"
    || value === null
    || !("category" in value)
    || typeof value.category !== "string"
    || !CHANGE_CATEGORIES.has(value.category)
    || !("instruction" in value)
    || typeof value.instruction !== "string"
    || !("sourceStateId" in value)
    || typeof value.sourceStateId !== "string"
    || !("targetStateId" in value)
    || typeof value.targetStateId !== "string"
  ) throw new RequestError("变化字段无效");
  return value as AssetChangeSet;
}

function fileExtension(type: string): string {
  return type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
}

function validateSessionFile(file: File): void {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new RequestError("参考图仅支持 PNG、JPEG 或 WebP");
  }
  if (file.size > 15 * 1024 * 1024) throw new RequestError("单张参考图不得超过 15 MB");
}

export function registerGenerateRoute(
  app: Hono,
  provider: ImageProvider,
  registry: ProjectRegistry,
  integration?: GenerationIntegration,
): void {
  app.post("/api/generate", async (context) => {
    try {
      const form = await context.req.formData();
      if (form.get("adultConsent") !== "true" || form.get("rightsConsent") !== "true") {
        return context.json({ error: "必须确认成年人和使用权" }, 400);
      }

      const projectId = requiredText(form, "projectId");
      const versionId = requiredText(form, "versionId");
      const rawRole = requiredText(form, "assetRole");
      if (!isAssetRole(rawRole)) throw new RequestError("资产角色无效");
      const assetRole: AssetRole = rawRole;
      const apiKey = integration ? "" : requiredText(form, "apiKey");
      const baseUrl = integration ? "" : requiredText(form, "baseUrl");
      const model = requiredText(form, "model");
      if (!integration && model !== "gpt-image-2") throw new RequestError("当前仅支持 gpt-image-2");
      const size = (typeof form.get("size") === "string" ? form.get("size") : "1024x1536") as ImageSize;
      const quality = (typeof form.get("quality") === "string" ? form.get("quality") : "medium") as ImageQuality;
      if (!integration && !IMAGE_SIZES.has(size)) throw new RequestError("图片尺寸无效");
      if (!IMAGE_QUALITIES.has(quality)) throw new RequestError("图片质量无效");
      const resolved = integration?.resolve(form, assetRole);
      const generationSize: ImageSize = resolved?.size ?? (assetRole === "expression" ? "1024x1024" : size);
      const changeSet = parseChangeSet(form);
      const baseWardrobeBrief = optionalText(form, "baseWardrobeBrief", 300);
      if (baseWardrobeBrief && assetRole !== "body-front") {
        throw new RequestError("基础服装说明只能用于 body-front 身材与服装锚点");
      }

      const project = await registry.readProject(projectId);
      const version = project.versions.find((item) => item.id === versionId);
      if (!version) throw new RequestError("角色版本不存在");
      assertSingleVariableChange(changeSet, version.status);

      const referenceAssetIds = parseJson<unknown[]>(form.get("referenceAssetIds"), []);
      if (!Array.isArray(referenceAssetIds) || !referenceAssetIds.every((id) => typeof id === "string")) {
        throw new RequestError("批准资产引用无效");
      }
      const rawParentAssetId = form.get("parentAssetId");
      if (rawParentAssetId !== null && typeof rawParentAssetId !== "string") {
        throw new RequestError("父资产字段无效");
      }
      const parentAssetId = typeof rawParentAssetId === "string" && rawParentAssetId.trim()
        ? rawParentAssetId.trim()
        : undefined;
      if (parentAssetId && !referenceAssetIds.includes(parentAssetId)) {
        throw new RequestError("父资产必须包含在批准资产引用中");
      }
      const sourceFiles = new Map<string, File>();
      const sources: ReferenceSource[] = [];
      for (const assetId of referenceAssetIds) {
        const approved = await registry.readApprovedAsset(projectId, assetId);
        const id = `asset:${assetId}`;
        const extension = fileExtension(approved.contentType);
        sourceFiles.set(id, new File(
          [Uint8Array.from(approved.bytes)],
          `${approved.asset.role}.${extension}`,
          { type: approved.contentType },
        ));
        sources.push({ id, kind: "asset", role: approved.asset.role });
      }

      const sessionImages = form.getAll("image").filter((value): value is File => value instanceof File);
      const sessionRoles = form.getAll("imageRole");
      if (sessionImages.length > 4) throw new RequestError("会话参考图最多 4 张");
      if (sessionImages.length !== sessionRoles.length) throw new RequestError("每张参考图必须声明职责");
      for (const [index, file] of sessionImages.entries()) {
        validateSessionFile(file);
        const role = sessionRoles[index];
        if (typeof role !== "string" || !isAssetRole(role)) throw new RequestError("参考图职责无效");
        const id = `session:${index}`;
        sourceFiles.set(id, file);
        sources.push({ id, kind: "session", role });
      }
      if (sources.length === 0) {
        return context.json({ error: "至少需要一张会话参考图或一个已批准资产" }, 400);
      }
      assertAssetOperation({
        project,
        version,
        role: assetRole,
        changeSet,
        ...(parentAssetId ? { parentAssetId } : {}),
        referenceAssetIds,
      });

      const ordered = orderReferenceSources(sources);
      assertGenerationReferenceContract(assetRole, ordered);
      const prompt = compileIdentityPrompt({
        mode: project.mode,
        characterTag: `${project.characterTag}-${version.id}`,
        assetRole,
        immutableDescriptor: version.immutableDescriptor,
        parentStateId: changeSet.sourceStateId,
        referenceRoles: ordered.map((source) => source.role),
        ...(baseWardrobeBrief ? { baseWardrobeBrief } : {}),
        changeSet,
      });
      const images = ordered.map((source) => {
        const file = sourceFiles.get(source.id);
        if (!file) throw new RequestError("参考资产解析失败");
        return file;
      });
      const result = await provider.editImage({
        apiKey,
        baseUrl,
        model: resolved?.model ?? model,
        ...(resolved ? { providerId: resolved.providerId, promptOptimization: resolved.promptOptimization } : {}),
        prompt,
        size: generationSize,
        quality: resolved?.quality ?? quality,
        images,
      });
      const recipeDraft: GenerationRecipe = {
        compilerVersion: "1.0.0",
        templateId: `${assetRole}-${assetRole === "face-three-quarter" ? "v2" : "v1"}`,
        provider: result.provider,
        model: result.model,
        size: result.size,
        quality: resolved?.quality ?? quality,
        referenceAssetIds: [...referenceAssetIds],
        ...(parentAssetId ? { parentAssetId } : {}),
        changeSet,
        latencyMs: result.latencyMs,
        completedAt: new Date().toISOString(),
      };
      return context.json({ ...result, recipeDraft, promptPreview: prompt });
    } catch (error) {
      if (error instanceof ProviderError) {
        return context.json({ error: error.message }, error.status as 400);
      }
      if (error instanceof RequestError) return context.json({ error: error.message }, 400);
      if (error instanceof Error && /项目|版本|资产|父|身份|压力测试|配方|引用|状态|模卡|表情|服装|动作|无效/.test(error.message)) {
        return context.json({ error: error.message }, 400);
      }
      return context.json({ error: "图片生成失败，请检查参数后重试" }, 400);
    }
  });
}
