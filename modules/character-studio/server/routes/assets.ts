import { validProvider, validStoredSize } from "../../shared/gugu";
import type { Hono } from "hono";
import type { AssetChangeSet, GenerationRecipe } from "../../shared/asset-schema";
import { isAssetRole } from "../../shared/templates";
import type { ProjectRegistry } from "../storage/project-registry";

const ROOT_FIELDS = new Set([
  "imageB64",
  "versionId",
  "assetRole",
  "stateId",
  "parentAssetId",
  "changeSet",
  "recipe",
]);
const RECIPE_FIELDS = new Set([
  "compilerVersion",
  "templateId",
  "provider",
  "model",
  "size",
  "quality",
  "referenceAssetIds",
  "parentAssetId",
  "changeSet",
  "latencyMs",
  "completedAt",
]);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknown(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).some((key) => !allowed.has(key));
}

function parseChangeSet(value: unknown): AssetChangeSet | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value.category !== "string"
    || !CHANGE_CATEGORIES.has(value.category)
    || typeof value.instruction !== "string"
    || typeof value.sourceStateId !== "string"
    || typeof value.targetStateId !== "string"
  ) return undefined;
  return value as AssetChangeSet;
}

export function registerAssetRoutes(app: Hono, registry: ProjectRegistry): void {
  app.post("/api/projects/:projectId/assets", async (context) => {
    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "资产请求格式无效" }, 400);
    }
    if (!isRecord(body) || unknown(body, ROOT_FIELDS)) {
      return context.json({ error: "资产请求包含未允许字段" }, 400);
    }
    const changeSet = parseChangeSet(body.changeSet);
    if (
      typeof body.imageB64 !== "string"
      || typeof body.versionId !== "string"
      || !isAssetRole(body.assetRole)
      || !changeSet
      || !isRecord(body.recipe)
      || unknown(body.recipe, RECIPE_FIELDS)
    ) {
      return context.json({ error: "资产请求缺少有效字段" }, 400);
    }
    const recipeBase = body.recipe;
    if (
      typeof recipeBase.compilerVersion !== "string"
      || typeof recipeBase.templateId !== "string"
      || !validProvider(recipeBase.provider)
      || typeof recipeBase.model !== "string"
      || !validStoredSize(recipeBase.size)
      || !["low", "medium", "high"].includes(String(recipeBase.quality))
      || !Array.isArray(recipeBase.referenceAssetIds)
      || !recipeBase.referenceAssetIds.every((id) => typeof id === "string")
    ) {
      return context.json({ error: "生成配方无效" }, 400);
    }
    const parentAssetId = typeof body.parentAssetId === "string" ? body.parentAssetId : undefined;
    const recipe = {
      ...recipeBase,
      ...(parentAssetId ? { parentAssetId } : {}),
      changeSet,
    } as GenerationRecipe;
    try {
      const asset = await registry.saveApprovedAsset({
        projectId: context.req.param("projectId"),
        versionId: body.versionId,
        assetRole: body.assetRole,
        stateId: typeof body.stateId === "string" ? body.stateId : changeSet.targetStateId,
        imageB64: body.imageB64,
        ...(parentAssetId ? { parentAssetId } : {}),
        recipe,
      });
      return context.json(asset, 201);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "资产保存失败" }, 400);
    }
  });

  app.get("/api/projects/:projectId/assets/:assetId", async (context) => {
    try {
      const file = await registry.readApprovedAsset(
        context.req.param("projectId"),
        context.req.param("assetId"),
      );
      const body = Uint8Array.from(file.bytes).buffer;
      return context.body(body, 200, {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Asset-Role": file.asset.role,
      });
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "资产读取失败" }, 404);
    }
  });
}
