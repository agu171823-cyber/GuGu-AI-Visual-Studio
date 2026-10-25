import type { Hono } from "hono";
import { join } from "node:path";
import { assembleModelPack } from "../export/model-pack";
import type { ProjectRegistry } from "../storage/project-registry";

export function registerExportRoutes(
  app: Hono,
  registry: ProjectRegistry,
  projectRoot: string,
): void {
  app.post("/api/projects/:projectId/exports", async (context) => {
    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "导出请求格式无效" }, 400);
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return context.json({ error: "导出请求格式无效" }, 400);
    }
    const input = body as Record<string, unknown>;
    if (Object.keys(input).some((key) => !["kind", "versionId", "includeBodyOnly"].includes(key))) {
      return context.json({ error: "导出请求包含未允许字段" }, 400);
    }
    if (input.kind !== "model-pack") {
      return context.json({ error: "展示板由浏览器本地 Canvas 直接导出" }, 400);
    }
    if (typeof input.versionId !== "string") {
      return context.json({ error: "导出版本无效" }, 400);
    }
    try {
      const projectId = context.req.param("projectId");
      const result = await assembleModelPack({
        projectId,
        versionId: input.versionId,
        includeBodyOnly: input.includeBodyOnly === true,
      }, registry, join(projectRoot, projectId, "exports"));
      return context.json({
        exportId: result.exportId,
        kind: result.kind,
        relativeFiles: result.relativeFiles,
      }, 201);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "模型参考包导出失败" }, 400);
    }
  });
}
