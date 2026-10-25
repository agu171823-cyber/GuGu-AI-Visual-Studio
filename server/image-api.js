"use strict";

const fs = require("fs");
const path = require("path");
const net = require("net");

const DEFAULT_SETTINGS = {
  providers: {
    default: {
      label: "147 图片",
      baseUrl: "https://147ai.com/v1",
      apiKey: "",
      defaultModel: "gpt-image-2.5-flare",
      models: [
        { id: "gpt-image-2.5-flare", label: "GPT Image 2.5 Flare" },
        { id: "gpt-image-2.5-sunburst", label: "GPT Image 2.5 Sunburst" }
      ]
    },
    volc: {
      label: "火山 Seedream",
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      apiKey: "",
      defaultModel: "doubao-seedream-5-0-flash-260915",
      watermark: true,
      models: [
        { id: "doubao-seedream-5-0-flash-260915", label: "豆包 Seedream 5.0 Flash" },
        { id: "doubao-seedream-5-0-pro-260628", label: "豆包 Seedream 5.0 Pro" }
      ]
    }
  }
};

const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
  "image/gif",
  "image/tiff",
  "image/heic",
  "image/heif"
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function loadSettings(filePath) {
  ensureDirectory(path.dirname(filePath));
  if (!fs.existsSync(filePath)) return clone(DEFAULT_SETTINGS);
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return mergeSettings(clone(DEFAULT_SETTINGS), parsed, { acceptSecrets: true });
  } catch (error) {
    throw new Error(`配置文件读取失败：${error.message}`);
  }
}

function saveSettings(filePath, settings) {
  ensureDirectory(path.dirname(filePath));
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, filePath);
}

function normalizeBaseUrl(value, fallback) {
  const text = String(value || fallback || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(text)) throw new Error("Base URL 必须以 http:// 或 https:// 开头");
  return text;
}

function mergeSettings(current, input, options = {}) {
  const next = clone(current || DEFAULT_SETTINGS);
  const incoming = input?.providers || {};
  for (const id of ["default", "volc"]) {
    const before = next.providers[id] || clone(DEFAULT_SETTINGS.providers[id]);
    const patch = incoming[id] || {};
    before.label = String(patch.label || before.label).trim();
    before.baseUrl = normalizeBaseUrl(patch.baseUrl, before.baseUrl);
    before.defaultModel = String(patch.defaultModel || before.defaultModel).trim();
    before.models = mergeModelLists(DEFAULT_SETTINGS.providers[id]?.models, Array.isArray(patch.models) ? patch.models : before.models);
    if (typeof patch.watermark === "boolean") before.watermark = patch.watermark;
    if (options.acceptSecrets && typeof patch.apiKey === "string") {
      before.apiKey = patch.apiKey.trim();
    } else if (typeof patch.apiKey === "string" && patch.apiKey.trim() && !patch.apiKey.includes("…")) {
      before.apiKey = patch.apiKey.trim();
    }
    next.providers[id] = before;
  }
  return next;
}

function maskSecret(secret) {
  const value = String(secret || "");
  if (!value) return "";
  if (value.length < 9) return `${value.slice(0, 2)}…${value.slice(-2)}`;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function publicSettings(settings) {
  const output = { providers: {} };
  for (const [id, provider] of Object.entries(settings?.providers || {})) {
    output.providers[id] = {
      label: provider.label,
      baseUrl: provider.baseUrl,
      defaultModel: provider.defaultModel,
      models: clone(provider.models || []),
      watermark: provider.watermark !== false,
      configured: Boolean(provider.apiKey),
      apiKeyMasked: maskSecret(provider.apiKey)
    };
  }
  return output;
}

function providerFor(settings, providerId) {
  const id = String(providerId || "default");
  const provider = settings?.providers?.[id];
  if (!provider) throw withStatus(`图片渠道不存在：${id}`, 400, "PROVIDER_NOT_FOUND");
  if (!provider.apiKey) throw withStatus(`请先配置“${provider.label || id}”的 API Key`, 401, "API_KEY_MISSING");
  return { id, ...provider };
}

function modelForProvider(provider, requestedModel) {
  const model = String(requestedModel || provider?.defaultModel || "").trim();
  const allowed = new Set((provider?.models || []).map((item) => String(item?.id || "").trim()).filter(Boolean));
  if (!model || (allowed.size && !allowed.has(model))) {
    throw withStatus(`模型“${model || "未指定"}”不属于图片渠道“${provider?.label || provider?.id || "未知"}”`, 400, "MODEL_NOT_AVAILABLE");
  }
  return model;
}

function isVolcProvider(provider) {
  try {
    const host = new URL(provider?.baseUrl || "").hostname;
    return /(^|\.)volces\.com$/i.test(host) || /(^|\.)bytepluses\.com$/i.test(host);
  } catch {
    return false;
  }
}

function mergeModelLists(bundled, configured) {
  const models = new Map();
  for (const item of [...(bundled || []), ...(configured || [])]) {
    const id = String(item?.id || "").trim();
    if (!id) continue;
    models.set(id, { id, label: String(item?.label || id).trim() });
  }
  return Array.from(models.values());
}

function imageGenerationUrl(provider) {
  const fallback = DEFAULT_SETTINGS.providers.volc.baseUrl;
  const url = new URL(normalizeBaseUrl(provider?.baseUrl, fallback));
  const pathname = url.pathname.replace(/\/+$/, "");
  url.pathname = /\/images\/generations$/i.test(pathname)
    ? pathname
    : `${pathname}/images/generations`.replace(/\/{2,}/g, "/");
  return url.toString().replace(/\/$/, "");
}

function isSeedreamFlashModel(model) {
  return /^doubao-seedream-5-0-flash(?:-|$)/i.test(String(model || ""));
}

function buildVolcImageRequest(provider, payload, images) {
  const sources = Array.isArray(images) ? images.filter(Boolean) : [];
  return {
    model: payload.model,
    prompt: String(payload.prompt || ""),
    ...(sources.length ? { image: sources.length === 1 ? sources[0] : sources } : {}),
    size: payload.size,
    stream: false,
    watermark: provider?.watermark !== false,
    output_format: payload.outputFormat === "jpeg" ? "jpeg" : "png",
    response_format: "url",
    ...(["precise", "stickerPack", "imageGenerate", "characterStudio"].includes(payload.mode) && !isSeedreamFlashModel(payload.model) ? {
      optimize_prompt_options: { mode: payload.promptOptimization === "fast" ? "fast" : "standard" }
    } : {})
  };
}

function buildOpenAiGenerationRequest(payload) {
  return {
    model: String(payload.model || ""),
    prompt: String(payload.prompt || ""),
    size: String(payload.size || ""),
    n: 1,
    ...(payload.quality ? { quality: String(payload.quality) } : {})
  };
}

function isGptImage2Model(model) {
  return /^gpt-image-2(?:\.|$|-)/i.test(String(model || ""));
}

function parseDataUrl(source, maxBytes = 30 * 1024 * 1024) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(source || ""));
  if (!match) throw withStatus("图片数据格式无效，需要 Base64 data URL", 400, "INVALID_IMAGE_DATA");
  const mime = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mime)) throw withStatus(`不支持的图片格式：${mime}`, 415, "UNSUPPORTED_IMAGE_TYPE");
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!buffer.length) throw withStatus("图片内容为空", 400, "EMPTY_IMAGE");
  if (buffer.length > maxBytes) throw withStatus("单张图片不能超过 30MB", 413, "IMAGE_TOO_LARGE");
  return { mime, buffer };
}

function extensionForMime(mime) {
  const normalized = String(mime || "").split(";")[0].trim().toLowerCase();
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  if (normalized === "image/bmp") return "bmp";
  if (normalized === "image/tiff") return "tiff";
  if (normalized === "image/heic") return "heic";
  if (normalized === "image/heif") return "heif";
  return "png";
}

function extractImageSource(payload) {
  const visited = new Set();
  const directKeys = ["url", "image_url", "imageUrl", "output_url", "outputUrl", "b64_json", "base64", "image_base64"];
  const containerKeys = ["data", "images", "image", "output", "result", "results"];

  function normalize(value, hint) {
    const text = String(value || "").trim();
    if (/^(https?:\/\/|data:image\/)/i.test(text)) return text;
    if (text && (/base64|b64/i.test(hint) || (text.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(text)))) {
      return `data:image/png;base64,${text.replace(/\s/g, "")}`;
    }
    return "";
  }

  function scan(value, hint = "") {
    if (!value) return "";
    if (typeof value === "string") return normalize(value, hint);
    if (typeof value !== "object" || visited.has(value)) return "";
    visited.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = scan(item, hint);
        if (found) return found;
      }
      return "";
    }
    for (const key of directKeys) {
      const found = normalize(value[key], key);
      if (found) return found;
    }
    for (const key of containerKeys) {
      const found = scan(value[key], key);
      if (found) return found;
    }
    return "";
  }

  return scan(payload);
}

function isPrivateHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (net.isIP(host) === 4) {
    const parts = host.split(".").map(Number);
    return parts[0] === 10
      || parts[0] === 127
      || parts[0] === 0
      || (parts[0] === 169 && parts[1] === 254)
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168);
  }
  if (net.isIP(host) === 6) return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
  return false;
}

function withStatus(message, statusCode = 500, code = "ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function planHistoryDeletion(jobs, input) {
  const ids = input?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw withStatus("请选择要删除的历史记录", 400, "HISTORY_SELECTION_REQUIRED");
  }
  if (ids.length > 200) {
    throw withStatus("一次最多删除 200 条历史记录", 400, "TOO_MANY_HISTORY_ITEMS");
  }

  const normalizedIds = [...new Set(ids
    .map((id) => String(id || "").trim())
    .filter(Boolean))];
  if (normalizedIds.length === 0) {
    throw withStatus("请选择要删除的历史记录", 400, "HISTORY_SELECTION_REQUIRED");
  }

  const requested = new Set(normalizedIds);
  const selected = (jobs || []).filter((job) => requested.has(String(job.id)));
  const active = selected.filter((job) => !["succeeded", "failed"].includes(job.status));
  if (active.length) {
    throw withStatus("运行中的任务不能删除，请等待任务结束", 409, "HISTORY_JOB_ACTIVE");
  }

  const selectedIds = new Set(selected.map((job) => String(job.id)));
  return {
    selected,
    remaining: (jobs || []).filter((job) => !selectedIds.has(String(job.id)))
  };
}

function jobFileNames(job) {
  const names = [job?.result?.filename, job?.source?.filename]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value === path.basename(value));
  return [...new Set(names)];
}

module.exports = {
  DEFAULT_SETTINGS,
  ALLOWED_IMAGE_MIMES,
  loadSettings,
  saveSettings,
  mergeSettings,
  publicSettings,
  providerFor,
  modelForProvider,
  isVolcProvider,
  imageGenerationUrl,
  isSeedreamFlashModel,
  buildVolcImageRequest,
  buildOpenAiGenerationRequest,
  isGptImage2Model,
  parseDataUrl,
  extensionForMime,
  extractImageSource,
  isPrivateHostname,
  planHistoryDeletion,
  jobFileNames,
  withStatus
};
