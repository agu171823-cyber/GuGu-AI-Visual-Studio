import { join } from "node:path";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { create147Provider } from "./providers/147";
import type { ImageProvider } from "./providers/provider";
import { registerAssetRoutes } from "./routes/assets";
import { registerExportRoutes } from "./routes/exports";
import { registerGenerateRoute, type GenerationIntegration } from "./routes/generate";
import { registerProjectRoutes } from "./routes/projects";
import { registerValidateKeyRoute } from "./routes/validate-key";
import {
  createProjectRegistry,
  type ProjectRegistry,
} from "./storage/project-registry";

export type AppDependencies = {
  provider?: ImageProvider;
  integration?: GenerationIntegration;
  projectRegistry?: ProjectRegistry;
  projectRoot?: string;
  staticRoot?: string;
};

export function createApp(dependencies: AppDependencies = {}): Hono {
  const app = new Hono();
  const provider = dependencies.provider ?? create147Provider();
  const projectRoot = dependencies.projectRoot ?? join(process.cwd(), "projects");
  const projectRegistry = dependencies.projectRegistry
    ?? createProjectRegistry(projectRoot);

  app.get("/api/health", (context) =>
    context.json({ ok: true, app: "character-model-card-studio" }),
  );

  app.use("/api/*", async (context, next) => {
    if (!new Set(["POST", "PUT", "PATCH", "DELETE"]).has(context.req.method)) return next();
    if (context.req.header("Sec-Fetch-Site") === "cross-site") {
      return context.json({ error: "拒绝跨站请求" }, 403);
    }
    const origin = context.req.header("Origin");
    if (origin) {
      let allowed = false;
      try {
        const parsed = new URL(origin);
        allowed = parsed.protocol === "http:"
          && (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost")
          && (dependencies.integration ? parsed.origin === new URL(context.req.url).origin : parsed.port === "4810");
      } catch {
        allowed = false;
      }
      if (!allowed) return context.json({ error: "请求来源无效" }, 403);
    }
    return next();
  });

  const tooLarge = (context: Context) => context.json({ error: "请求体过大" }, 413);
  app.use("/api/validate-key", bodyLimit({ maxSize: 16 * 1024, onError: tooLarge }));
  app.use("/api/generate", bodyLimit({ maxSize: 64 * 1024 * 1024, onError: tooLarge }));
  app.use("/api/projects", bodyLimit({ maxSize: 256 * 1024, onError: tooLarge }));
  app.use("/api/projects/:projectId", bodyLimit({ maxSize: 256 * 1024, onError: tooLarge }));
  app.use(
    "/api/projects/:projectId/transitions",
    bodyLimit({ maxSize: 16 * 1024, onError: tooLarge }),
  );
  app.use(
    "/api/projects/:projectId/assets",
    bodyLimit({ maxSize: 41 * 1024 * 1024, onError: tooLarge }),
  );
  app.use(
    "/api/projects/:projectId/exports",
    bodyLimit({ maxSize: 41 * 1024 * 1024, onError: tooLarge }),
  );

  if (!dependencies.integration) registerValidateKeyRoute(app, provider);
  registerProjectRoutes(app, projectRegistry);
  registerGenerateRoute(app, provider, projectRegistry, dependencies.integration);
  registerAssetRoutes(app, projectRegistry);
  registerExportRoutes(app, projectRegistry, projectRoot);

  const unknownApiRoute = (context: Context) =>
    context.json({ error: "API 路由不存在" }, 404);
  app.all("/api", unknownApiRoute);
  app.all("/api/*", unknownApiRoute);

  if (dependencies.staticRoot) {
    app.use("/assets/*", serveStatic({ root: dependencies.staticRoot }));
    app.get("*", async (context, next) =>
      serveStatic({ root: dependencies.staticRoot, path: "index.html" })(context, next));
  }

  return app;
}
