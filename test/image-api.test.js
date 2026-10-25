"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_SETTINGS,
  mergeSettings,
  publicSettings,
  parseDataUrl,
  extractImageSource,
  isPrivateHostname,
  isGptImage2Model,
  isVolcProvider,
  imageGenerationUrl,
  isSeedreamFlashModel,
  buildVolcImageRequest,
  buildOpenAiGenerationRequest,
  providerFor,
  modelForProvider,
  planHistoryDeletion,
  jobFileNames
} = require("../server/image-api");

test("settings preserve an existing secret when the browser submits an empty key", () => {
  const current = structuredClone(DEFAULT_SETTINGS);
  current.providers.default.apiKey = "secret-value";
  const next = mergeSettings(current, { providers: { default: { apiKey: "", baseUrl: "https://example.com/v1" } } });
  assert.equal(next.providers.default.apiKey, "secret-value");
  assert.equal(next.providers.default.baseUrl, "https://example.com/v1");
});

test("public settings never expose API keys", () => {
  const current = structuredClone(DEFAULT_SETTINGS);
  current.providers.volc.apiKey = "abcdefghijklmnop";
  const output = publicSettings(current);
  assert.equal(output.providers.volc.configured, true);
  assert.equal("apiKey" in output.providers.volc, false);
  assert.match(output.providers.volc.apiKeyMasked, /…/);
});

test("data URL parsing validates image content", () => {
  const parsed = parseDataUrl("data:image/png;base64,aGVsbG8=");
  assert.equal(parsed.mime, "image/png");
  assert.equal(parsed.buffer.toString(), "hello");
  assert.throws(() => parseDataUrl("data:text/plain;base64,aGVsbG8="), /不支持的图片格式/);
});

test("image response extraction accepts URL and base64 response shapes", () => {
  assert.equal(extractImageSource({ data: [{ url: "https://cdn.example.com/a.png" }] }), "https://cdn.example.com/a.png");
  assert.equal(extractImageSource({ result: { b64_json: "aGVsbG8=" } }), "data:image/png;base64,aGVsbG8=");
});

test("provider and host classification keeps routing boundaries strict", () => {
  assert.equal(isGptImage2Model("gpt-image-2.5-flare"), true);
  assert.equal(isVolcProvider({ baseUrl: "https://ark.cn-beijing.volces.com/api/v3" }), true);
  assert.equal(isVolcProvider({ baseUrl: "https://volces.com.evil.example/v1" }), false);
  assert.equal(isPrivateHostname("127.0.0.1"), true);
  assert.equal(isPrivateHostname("192.168.1.20"), true);
  assert.equal(isPrivateHostname("cdn.example.com"), false);
});

test("volc image generation URL accepts both an API root and the full endpoint", () => {
  assert.equal(
    imageGenerationUrl({ baseUrl: "https://ark.cn-beijing.volces.com/api/v3" }),
    "https://ark.cn-beijing.volces.com/api/v3/images/generations"
  );
  assert.equal(
    imageGenerationUrl({ baseUrl: "https://ark.cn-beijing.volces.com/api/v3/images/generations" }),
    "https://ark.cn-beijing.volces.com/api/v3/images/generations"
  );
  assert.equal(isSeedreamFlashModel("doubao-seedream-5-0-flash-260915"), true);
  assert.equal(isSeedreamFlashModel("doubao-seedream-5-0-pro-260628"), false);
});

test("saved volc settings inherit newly bundled Seedream models", () => {
  const current = structuredClone(DEFAULT_SETTINGS);
  const next = mergeSettings(current, {
    providers: {
      volc: {
        defaultModel: "doubao-seedream-5-0-pro-260628",
        models: [{ id: "doubao-seedream-5-0-pro-260628", label: "旧版已保存模型" }]
      }
    }
  });
  assert.deepEqual(next.providers.volc.models.map((item) => item.id), [
    "doubao-seedream-5-0-flash-260915",
    "doubao-seedream-5-0-pro-260628"
  ]);
  assert.equal(next.providers.volc.defaultModel, "doubao-seedream-5-0-pro-260628");
});

test("Seedream Flash request matches the Ark non-streaming URL response contract", () => {
  const body = buildVolcImageRequest(
    { watermark: true },
    {
      mode: "precise",
      model: "doubao-seedream-5-0-flash-260915",
      prompt: "只修改标记区域",
      size: "2K",
      outputFormat: "png",
      promptOptimization: "fast"
    },
    ["data:image/png;base64,aGVsbG8="]
  );
  assert.equal(body.model, "doubao-seedream-5-0-flash-260915");
  assert.equal(body.size, "2K");
  assert.equal(body.stream, false);
  assert.equal(body.watermark, true);
  assert.equal(body.response_format, "url");
  assert.equal(body.image, "data:image/png;base64,aGVsbG8=");
  assert.equal("optimize_prompt_options" in body, false);
});

test("sticker pack uses fast prompt optimization when the Seedream model supports it", () => {
  const body = buildVolcImageRequest(
    { watermark: false },
    {
      mode: "stickerPack",
      model: "doubao-seedream-5-0-pro-260628",
      prompt: "生成 3×3 完整表情包宫格",
      size: "2048x2048",
      outputFormat: "png",
      promptOptimization: "fast"
    },
    ["data:image/png;base64,aGVsbG8="]
  );
  assert.deepEqual(body.optimize_prompt_options, { mode: "fast" });
  assert.equal(body.watermark, false);
});

test("text-only Seedream generation omits the image field and enables Pro prompt optimization", () => {
  const body = buildVolcImageRequest(
    { watermark: true },
    {
      mode: "imageGenerate",
      model: "doubao-seedream-5-0-pro-260628",
      prompt: "电影感城市夜景",
      size: "2816x1584",
      outputFormat: "jpeg",
      promptOptimization: "standard"
    },
    []
  );
  assert.equal("image" in body, false);
  assert.equal(body.output_format, "jpeg");
  assert.deepEqual(body.optimize_prompt_options, { mode: "standard" });
});

test("147 text generation uses the JSON generations contract", () => {
  assert.deepEqual(buildOpenAiGenerationRequest({
    model: "gpt-image-2.5-sunburst",
    prompt: "一只坐在月球上的橘猫",
    size: "2048x2048",
    quality: "high"
  }), {
    model: "gpt-image-2.5-sunburst",
    prompt: "一只坐在月球上的橘猫",
    size: "2048x2048",
    n: 1,
    quality: "high"
  });
});

test("selected models must belong to the selected image provider", () => {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.providers.default.apiKey = "test-default-key";
  settings.providers.volc.apiKey = "test-volc-key";
  const provider = providerFor(settings, "default");
  assert.equal(modelForProvider(provider, "gpt-image-2.5-sunburst"), "gpt-image-2.5-sunburst");
  assert.throws(() => modelForProvider(provider, "doubao-seedream-5-0-pro-260628"), /不属于图片渠道/);
  assert.throws(() => providerFor(settings, "unknown"), /图片渠道不存在/);
});

test("history deletion selects only matching completed records", () => {
  const jobs = [
    { id: "done", status: "succeeded" },
    { id: "failed", status: "failed" },
    { id: "other", status: "succeeded" }
  ];
  const deletion = planHistoryDeletion(jobs, { ids: ["done", "failed", "done", "missing"] });
  assert.deepEqual(deletion.selected.map((job) => job.id), ["done", "failed"]);
  assert.deepEqual(deletion.remaining.map((job) => job.id), ["other"]);
});

test("history deletion rejects empty selections and active jobs", () => {
  assert.throws(
    () => planHistoryDeletion([{ id: "live", status: "submitting" }], { ids: ["live"] }),
    /运行中的任务不能删除/
  );
  assert.throws(() => planHistoryDeletion([], { ids: [] }), /请选择要删除/);
});

test("history file cleanup keeps each job result and its exact source snapshot together", () => {
  assert.deepEqual(jobFileNames({
    result: { filename: "result.png" },
    source: { filename: "source.jpg" }
  }), ["result.png", "source.jpg"]);
  assert.deepEqual(jobFileNames({
    result: { filename: "same.png" },
    source: { filename: "same.png" }
  }), ["same.png"]);
  assert.deepEqual(jobFileNames({ result: { filename: "../unsafe.png" } }), []);
});
