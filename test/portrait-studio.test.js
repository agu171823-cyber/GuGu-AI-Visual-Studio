"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const portraitStudio = require("../server/portrait-studio");

function request(overrides = {}) {
  return {
    mode: "portraitStudio",
    size: "1x1",
    prompt: "浏览器占位提示词",
    portrait: {
      styleId: "clear-natural-light",
      styleVersion: portraitStudio.VERSION,
      shotId: "hero",
      ratio: "2:3",
      resolution: "1K",
      quality: "medium",
      expression: { id: "auto", intensity: "balanced" },
      questionnaire: { usage: "profile", mood: "natural", intensity: "light" },
      overrides: { scene: "", camera: "", wardrobe: "", action: "", lighting: "" },
      extra: "保留红色外套",
      directedInstruction: "",
      adultConsent: true,
      rightsConsent: true,
      saveSource: false,
      seriesId: "series-001",
      settingsSignature: "v1-12345678",
      ...overrides
    }
  };
}

test("portrait studio exposes twelve versioned styles and four series shots", () => {
  const options = portraitStudio.publicOptions();
  assert.equal(options.styles.length, 12);
  assert.deepEqual(options.shots.map((item) => item.id), ["hero", "environment", "action", "detail"]);
  assert.equal(options.styles.every((item) => item.version === portraitStudio.VERSION), true);
  assert.equal(options.sizes["2K"]["2:3"], "1664x2496");
});

test("portrait payload is compiled on the server and keeps series association metadata", () => {
  const prepared = portraitStudio.preparePortraitPayload(request());
  assert.equal(prepared.size, "1024x1536");
  assert.equal(prepared.outputFormat, "png");
  assert.equal(prepared.portrait.shotLabel, "主肖像");
  assert.equal(prepared.portrait.seriesId, "series-001");
  assert.equal(prepared.portrait.settingsSignature, "v1-12345678");
  assert.match(prepared.prompt, /第一张图片拥有最高身份优先级/);
  assert.match(prepared.prompt, /保留红色外套/);
  assert.match(prepared.prompt, /只出现同一个主要人物/);
  assert.doesNotMatch(prepared.prompt, /浏览器占位提示词/);
});

test("portrait consent, style version, expression, and output size are validated", () => {
  assert.throws(() => portraitStudio.preparePortraitPayload(request({ adultConsent: false })), /成年人/);
  assert.throws(() => portraitStudio.preparePortraitPayload(request({ rightsConsent: false })), /肖像使用授权/);
  assert.throws(() => portraitStudio.preparePortraitPayload(request({ styleVersion: "old" })), /版本已更新/);
  assert.throws(() => portraitStudio.preparePortraitPayload(request({ expression: { id: "unknown", intensity: "balanced" } })), /表情无效/);
  assert.throws(() => portraitStudio.preparePortraitPayload(request({ resolution: "8K" })), /比例或分辨率无效/);
});

test("portrait advanced overrides cannot inject unsupported fields", () => {
  assert.throws(() => portraitStudio.preparePortraitPayload(request({
    overrides: { scene: "庭院", camera: "50mm", wardrobe: "", action: "", lighting: "", identity: "换成别人" }
  })), /只能调整场景/);
});
