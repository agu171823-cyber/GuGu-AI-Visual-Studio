"use strict";
const { isVolcProvider, buildVolcImageRequest, imageGenerationUrl, buildOpenAiGenerationRequest, parseDataUrl, extensionForMime, withStatus, isPrivateHostname } = require("./image-api");
function createImageTransport({ fetchImpl = fetch, upstreamTimeoutMs = 15 * 60 * 1000 } = {}) {
async function requestUpstream(provider, payload) {
  const images = [payload.image, ...(Array.isArray(payload.referenceImages) ? payload.referenceImages.filter(Boolean) : [])].filter(Boolean);
  if (isVolcProvider(provider)) {
    const body = buildVolcImageRequest(provider, payload, images);
    return fetchJson(imageGenerationUrl(provider), {
      retryLimit: payload.noRetry ? 1 : 3,
      method: "POST",
      headers: authHeaders(provider, true),
      body: JSON.stringify(body)
    });
  }

  if (payload.mode === "imageGenerate" && images.length === 0) {
    return fetchJson(`${provider.baseUrl}/images/generations`, {
      retryLimit: payload.noRetry ? 1 : 3,
      method: "POST",
      headers: authHeaders(provider, true),
      body: JSON.stringify(buildOpenAiGenerationRequest(payload))
    });
  }

  const form = new FormData();
  form.append("model", payload.model || provider.defaultModel);
  form.append("prompt", String(payload.prompt || ""));
  form.append("size", String(payload.size || ""));
  form.append("n", "1");
  if (payload.quality) form.append("quality", String(payload.quality));
  if (payload.outputFormat) form.append("output_format", String(payload.outputFormat));
  images.forEach((source) => {
    const decoded = parseDataUrl(source);
    const field = images.length > 1 ? "image[]" : "image";
    form.append(field, new Blob([decoded.buffer], { type: decoded.mime }), `input.${extensionForMime(decoded.mime)}`);
  });
  return fetchJson(`${provider.baseUrl}/images/edits`, {
    retryLimit: payload.noRetry ? 1 : 3,
    method: "POST",
    headers: authHeaders(provider, false),
    body: form
  });
}

function authHeaders(provider, json) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${provider.apiKey}`,
    ...(json ? { "Content-Type": "application/json" } : {})
  };
}

async function fetchJson(url, options) {
  const { retryLimit = 3, ...fetchOptions } = options;
  let lastError;
  for (let attempt = 0; attempt < retryLimit; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), upstreamTimeoutMs);
    try {
      const response = await fetchImpl(url, { ...fetchOptions, signal: controller.signal });
      const requestId = response.headers.get("x-request-id") || response.headers.get("request-id") || "";
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
      if (!response.ok) {
        const message = data?.error?.message || data?.message || data?.raw || `上游 HTTP ${response.status}`;
        const error = withStatus(message, response.status, response.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR");
        if (response.status === 429 && attempt < retryLimit - 1) {
          const retryAfter = Math.max(1, Math.min(10, Number(response.headers.get("retry-after")) || (attempt + 1) * 2));
          await delay(retryAfter * 1000);
          lastError = error;
          continue;
        }
        throw error;
      }
      return { data, requestId };
    } catch (error) {
      if (error.name === "AbortError") throw withStatus("上游等待超过 15 分钟，未自动重新提交以避免重复扣费", 504, "UPSTREAM_TIMEOUT");
      if (error.statusCode) throw error;
      throw withStatus(`上游网络连接失败：${error.message}`, 502, "UPSTREAM_NETWORK_ERROR");
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || withStatus("上游请求失败", 502, "UPSTREAM_ERROR");
}

async function readResultBytes(source, requestedFormat) {
  let buffer;
  let mime;
  if (/^data:image\//i.test(source)) {
    const decoded = parseDataUrl(source, 80 * 1024 * 1024);
    buffer = decoded.buffer;
    mime = decoded.mime;
  } else {
    const parsed = new URL(source);
    if (!/^https:$/.test(parsed.protocol) || isPrivateHostname(parsed.hostname)) throw withStatus("上游结果地址不安全，已拒绝下载", 502, "UNSAFE_RESULT_URL");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2 * 60 * 1000);
    try {
      const response = await fetchImpl(source, { signal: controller.signal, headers: { Accept: "image/*" } });
      if (!response.ok) throw withStatus(`结果下载失败：HTTP ${response.status}`, 502, "RESULT_DOWNLOAD_FAILED");
      mime = (response.headers.get("content-type") || "image/png").split(";")[0].toLowerCase();
      if (!mime.startsWith("image/")) throw withStatus("上游结果不是图片", 502, "RESULT_NOT_IMAGE");
      buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 80 * 1024 * 1024) throw withStatus("生成结果超过 80MB，已拒绝保存", 502, "RESULT_TOO_LARGE");
    } finally {
      clearTimeout(timer);
    }
  }
  return { buffer, mime: mime || `image/${requestedFormat || "png"}` };
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
return {requestUpstream, readResultBytes};
}
module.exports = {createImageTransport};
