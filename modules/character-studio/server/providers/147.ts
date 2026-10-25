import { ProviderError, type EditImageInput, type ImageProvider, type ValidateKeyInput } from "./provider";

const ALLOWED_147_HOST = /(^|\.)147ai\.(com|cn)$/i;

export function normalizeApiKey(value: string): string {
  let key = value.trim();
  if (
    key.length >= 2 &&
    ((key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'")))
  ) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/^Bearer\s+/i, "").trim();
  if (/^sk-sk-/i.test(key)) throw new Error("API Key 重复填写了 sk- 前缀");
  if (!key || /\s/.test(key)) throw new Error("API Key 为空或包含空格");
  return key;
}

export function normalizeBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Base URL 格式不正确");
  }
  if (url.protocol !== "https:") throw new Error("Base URL 必须使用 HTTPS");
  if (url.username || url.password) throw new Error("Base URL 不能包含账号或密码");
  if (!ALLOWED_147_HOST.test(url.hostname)) throw new Error("Base URL 必须是 147ai.com 或 147ai.cn 域名");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function safeRequestId(value: string | null): string | undefined {
  const candidate = value?.trim();
  return candidate && /^[A-Za-z0-9._:-]{4,80}$/.test(candidate) ? candidate : undefined;
}

function includeRequestId(message: string, requestId?: string): string {
  return requestId ? `${message} 请求 ID：${requestId}` : message;
}

export function describeUpstreamError(status: number, rawMessage: string, rawRequestId?: string): string {
  const message = rawMessage.toLowerCase();
  const requestId = safeRequestId(rawRequestId ?? null);
  if (status === 401 || /invalid.?token|unauthor/.test(message)) {
    return includeRequestId("当前 API Key 未被 147 接受，请重新创建 Key 并检查模型分组。", requestId);
  }
  if (/moderation|content.?policy|content_policy|safety/.test(message)) {
    return includeRequestId(
      "请求被上游内容审核拒绝；上游未说明具体拦截层（文字提示、参考图或输出图）。请调整补充要求或更换参考图后手动重试。",
      requestId,
    );
  }
  if (status === 404 || /model.*(not found|invalid)/.test(message)) {
    return includeRequestId("接口地址或模型不可用，请检查 Base URL、模型名和 147 令牌分组。", requestId);
  }
  if (/size|dimension|resolution/.test(message)) {
    return includeRequestId("当前模型不支持所选图片尺寸，请改用其他画幅。", requestId);
  }
  if (status === 429 || /quota|billing|insufficient|余额/.test(message)) {
    return includeRequestId("147 账户额度不足或请求过于频繁，请检查余额后稍后重试。", requestId);
  }
  if (status >= 500) return includeRequestId("147 图片服务暂时不可用，请稍后重试。", requestId);
  return includeRequestId(`图片生成失败（HTTP ${status}），请检查参数后重试。`, requestId);
}

async function responsePayload(response: Response): Promise<{ data: Record<string, unknown> | null; raw: string }> {
  const raw = await response.text();
  try {
    return { data: raw ? (JSON.parse(raw) as Record<string, unknown>) : null, raw };
  } catch {
    return { data: null, raw };
  }
}

function upstreamMessage(data: Record<string, unknown> | null, raw: string): string {
  const error = data?.error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return raw;
}

function upstreamSignal(data: Record<string, unknown> | null, raw: string): string {
  const values = [upstreamMessage(data, raw)];
  const error = data?.error;
  if (error && typeof error === "object") {
    const errorRecord = error as Record<string, unknown>;
    for (const key of ["code", "type", "reason"] as const) {
      if (typeof errorRecord[key] === "string") values.push(errorRecord[key]);
    }
  }
  for (const key of ["code", "type"] as const) {
    if (typeof data?.[key] === "string") values.push(data[key]);
  }
  return values.join(" ");
}

async function checkedPayload(response: Response): Promise<Record<string, unknown> | null> {
  const { data, raw } = await responsePayload(response);
  if (!response.ok) {
    const publicStatus = response.status >= 500 ? 502 : response.status;
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("request-id") ?? undefined;
    throw new ProviderError(
      publicStatus,
      describeUpstreamError(response.status, upstreamSignal(data, raw), requestId),
    );
  }
  return data;
}

export function create147Provider(fetchImpl: typeof fetch = fetch): ImageProvider {
  return {
    async validateKey(input: ValidateKeyInput) {
      const apiKey = normalizeApiKey(input.apiKey);
      const baseUrl = normalizeBaseUrl(input.baseUrl);
      const response = await fetchImpl(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      const data = await checkedPayload(response);
      const models = Array.isArray(data?.data) ? data.data : [];
      return {
        valid: true,
        modelAvailable: models.some(
          (candidate) => candidate && typeof candidate === "object" && "id" in candidate && candidate.id === input.model,
        ),
      };
    },

    async editImage(input: EditImageInput) {
      const apiKey = normalizeApiKey(input.apiKey);
      const baseUrl = normalizeBaseUrl(input.baseUrl);
      const form = new FormData();
      input.images.forEach((image, index) => {
        const extension = image.type === "image/jpeg" ? "jpg" : image.type === "image/webp" ? "webp" : "png";
        form.append("image", image, `reference-${index + 1}.${extension}`);
      });
      form.append("model", input.model.trim());
      form.append("prompt", input.prompt);
      form.append("input_fidelity", "high");
      form.append("size", input.size);
      form.append("quality", input.quality);
      form.append("output_format", "png");
      form.append("n", "1");

      const startedAt = Date.now();
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}/images/edits`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
          body: form,
          signal: AbortSignal.timeout(180_000),
        });
      } catch (error) {
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
          throw new ProviderError(504, "图片生成超过 3 分钟，请稍后手动重试。");
        }
        throw new ProviderError(502, "无法连接 147 图片服务，请检查网络后重试。");
      }

      const data = await checkedPayload(response);
      const items = Array.isArray(data?.data) ? data.data : [];
      const first = items[0];
      const imageB64 = first && typeof first === "object" && "b64_json" in first ? first.b64_json : undefined;
      if (typeof imageB64 !== "string" || !imageB64) {
        throw new ProviderError(502, "147 返回成功，但响应中没有图片数据。");
      }
      return {
        imageB64,
        provider: "147",
        model: input.model.trim(),
        size: input.size,
        latencyMs: Date.now() - startedAt,
      };
    },
  };
}
