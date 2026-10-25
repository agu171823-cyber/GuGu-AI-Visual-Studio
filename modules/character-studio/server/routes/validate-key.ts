import type { Hono } from "hono";
import { ProviderError, type ImageProvider } from "../providers/provider";

export function registerValidateKeyRoute(app: Hono, provider: ImageProvider): void {
  app.post("/api/validate-key", async (context) => {
    let body: Record<string, unknown>;
    try {
      body = await context.req.json<Record<string, unknown>>();
    } catch {
      return context.json({ error: "请求格式无效" }, 400);
    }
    const apiKey = typeof body.apiKey === "string" ? body.apiKey : "";
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl : "";
    const model = typeof body.model === "string" ? body.model : "";
    if (!apiKey || !baseUrl || !model) return context.json({ error: "请填写 Key、Base URL 和模型" }, 400);
    if (model !== "gpt-image-2") return context.json({ error: "当前仅支持 gpt-image-2" }, 400);

    try {
      return context.json(await provider.validateKey({ apiKey, baseUrl, model }));
    } catch (error) {
      if (error instanceof ProviderError) return context.json({ error: error.message }, error.status as 400);
      return context.json({ error: error instanceof Error ? error.message : "Key 检测失败" }, 400);
    }
  });
}
