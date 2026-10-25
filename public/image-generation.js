(function exposeImageGeneration(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ImageGeneration = api;
})(typeof window !== "undefined" ? window : globalThis, function createImageGeneration() {
  "use strict";

  const RATIO_OPTIONS = [
    ["16:9", "16:9 · 横屏"],
    ["9:16", "9:16 · 竖屏"],
    ["2:3", "2:3 · 竖版"],
    ["3:2", "3:2 · 横版"],
    ["3:4", "3:4 · 竖版"],
    ["4:3", "4:3 · 横版"],
    ["21:9", "21:9 · 超宽"],
    ["1:1", "1:1 · 方形"]
  ];

  const GPT_TIER_OPTIONS = [["1K", "1K"], ["2K", "2K"], ["4K", "4K"]];
  const SEEDREAM_TIER_OPTIONS = [["1K", "1K"], ["1.5K", "1.5K"], ["2K", "2K"]];

  const GPT_PRESET_SIZES = {
    "16:9": { "1K": "1280x720", "2K": "2048x1152", "4K": "3840x2160" },
    "9:16": { "1K": "720x1280", "2K": "1152x2048", "4K": "2160x3840" },
    "2:3": { "1K": "672x1008", "2K": "1344x2016", "4K": "2336x3504" },
    "3:2": { "1K": "1008x672", "2K": "2016x1344", "4K": "3504x2336" },
    "3:4": { "1K": "768x1024", "2K": "1536x2048", "4K": "2448x3264" },
    "4:3": { "1K": "1024x768", "2K": "2048x1536", "4K": "3264x2448" },
    "21:9": { "1K": "1344x576", "2K": "2688x1152", "4K": "3840x1648" },
    "1:1": { "1K": "1024x1024", "2K": "2048x2048", "4K": "2880x2880" }
  };

  const SEEDREAM_PRESET_SIZES = {
    "16:9": { "1K": "1424x800", "1.5K": "1920x1080", "2K": "2816x1584" },
    "9:16": { "1K": "800x1424", "1.5K": "1080x1920", "2K": "1584x2816" },
    "2:3": { "1K": "832x1248", "1.5K": "1248x1872", "2K": "1664x2496" },
    "3:2": { "1K": "1248x832", "1.5K": "1872x1248", "2K": "2496x1664" },
    "3:4": { "1K": "864x1152", "1.5K": "1296x1728", "2K": "1776x2368" },
    "4:3": { "1K": "1152x864", "1.5K": "1728x1296", "2K": "2368x1776" },
    "21:9": { "1K": "1568x672", "1.5K": "2304x992", "2K": "3136x1344" },
    "1:1": { "1K": "1024x1024", "1.5K": "1536x1536", "2K": "2048x2048" }
  };

  function isSeedreamModel(model) {
    return /^doubao-seedream-5-0-(?:flash|pro)(?:-|$)/i.test(String(model || ""));
  }

  function isSeedreamProModel(model) {
    return /^doubao-seedream-5-0-pro(?:-|$)/i.test(String(model || ""));
  }

  function ratio(value) {
    return RATIO_OPTIONS.some(([id]) => id === value) ? value : "1:1";
  }

  function tier(value, model) {
    const options = isSeedreamModel(model) ? SEEDREAM_TIER_OPTIONS : GPT_TIER_OPTIONS;
    return options.some(([id]) => id === value) ? value : (isSeedreamModel(model) ? "2K" : "2K");
  }

  function sizeFor(model, selectedRatio, selectedTier) {
    const safeRatio = ratio(selectedRatio);
    const safeTier = tier(selectedTier, model);
    const presets = isSeedreamModel(model) ? SEEDREAM_PRESET_SIZES : GPT_PRESET_SIZES;
    return presets[safeRatio][safeTier];
  }

  function normalizePrompt(value) {
    return String(value || "").replace(/@图片\s*(\d+)/g, "图片$1").trim();
  }

  function validateReferenceCount(count) {
    const number = Number(count) || 0;
    if (number < 0 || number > 10) throw new Error("图片生成最多允许 10 张参考图");
    return number;
  }

  return {
    RATIO_OPTIONS,
    GPT_TIER_OPTIONS,
    SEEDREAM_TIER_OPTIONS,
    GPT_PRESET_SIZES,
    SEEDREAM_PRESET_SIZES,
    isSeedreamModel,
    isSeedreamProModel,
    ratio,
    tier,
    sizeFor,
    normalizePrompt,
    validateReferenceCount
  };
});
