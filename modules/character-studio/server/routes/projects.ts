import type { Hono } from "hono";
import type { OptionalHumanProfile, ProjectMode } from "../../shared/project-schema";
import { isStressTestRole } from "../../shared/templates";
import type { ProjectRegistry } from "../storage/project-registry";

const PROJECT_FIELDS = new Set(["mode", "title", "displayName", "optionalProfile"]);
const PROFILE_FIELDS = new Set([
  "stageName",
  "heightCm",
  "bustCm",
  "waistCm",
  "hipsCm",
  "shoeSize",
  "contact",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasUnknownKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).some((key) => !allowed.has(key));
}

function statusFor(error: unknown): 400 | 404 {
  return error instanceof Error && /不存在/.test(error.message) ? 404 : 400;
}

export function registerProjectRoutes(app: Hono, registry: ProjectRegistry): void {
  app.get("/api/projects", async (context) => context.json(await registry.listProjects()));

  app.post("/api/projects", async (context) => {
    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "项目请求格式无效" }, 400);
    }
    if (!isRecord(body) || hasUnknownKeys(body, PROJECT_FIELDS)) {
      return context.json({ error: "项目请求包含未允许字段" }, 400);
    }
    if (body.mode !== "human-model-card" && body.mode !== "realistic-virtual-character") {
      return context.json({ error: "项目模式无效" }, 400);
    }
    if (typeof body.title !== "string" || typeof body.displayName !== "string") {
      return context.json({ error: "项目名称和角色显示名不能为空" }, 400);
    }
    let optionalProfile: OptionalHumanProfile | undefined;
    if (body.optionalProfile !== undefined) {
      if (!isRecord(body.optionalProfile) || hasUnknownKeys(body.optionalProfile, PROFILE_FIELDS)) {
        return context.json({ error: "真人资料包含未允许字段" }, 400);
      }
      if (body.mode !== "human-model-card" && Object.keys(body.optionalProfile).length > 0) {
        return context.json({ error: "虚拟角色模式不保存真人资料" }, 400);
      }
      optionalProfile = body.optionalProfile as OptionalHumanProfile;
    }
    try {
      const project = await registry.createProject({
        mode: body.mode as ProjectMode,
        title: body.title,
        displayName: body.displayName,
        ...(optionalProfile ? { optionalProfile } : {}),
      });
      return context.json(project, 201);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "项目创建失败" }, 400);
    }
  });

  app.get("/api/projects/:projectId", async (context) => {
    try {
      return context.json(await registry.readProject(context.req.param("projectId")));
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : "项目读取失败" },
        statusFor(error),
      );
    }
  });

  app.post("/api/projects/:projectId/transitions", async (context) => {
    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "状态转换请求格式无效" }, 400);
    }
    if (!isRecord(body) || typeof body.action !== "string") {
      return context.json({ error: "状态转换请求格式无效" }, 400);
    }
    const projectId = context.req.param("projectId");
    try {
      if (body.action === "create-version" && Object.keys(body).length === 1) {
        return context.json(await registry.createIdentityVersion(projectId), 201);
      }
      if (
        body.action === "review-stress"
        && Object.keys(body).every((key) => ["action", "versionId", "role", "assetId", "passed"].includes(key))
        && typeof body.versionId === "string"
        && isStressTestRole(body.role)
        && typeof body.passed === "boolean"
        && (body.assetId === undefined || typeof body.assetId === "string")
      ) {
        return context.json(await registry.recordStressReview({
          projectId,
          versionId: body.versionId,
          role: body.role,
          ...(typeof body.assetId === "string" ? { assetId: body.assetId } : {}),
          passed: body.passed,
        }));
      }
      if (
        body.action === "lock-version"
        && Object.keys(body).every((key) => ["action", "versionId"].includes(key))
        && typeof body.versionId === "string"
      ) {
        return context.json(await registry.lockVersion(projectId, body.versionId));
      }
      return context.json({ error: "状态转换动作或字段无效" }, 400);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "状态转换失败" }, 400);
    }
  });
}
