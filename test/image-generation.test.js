"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const imageGeneration = require("../public/image-generation");

test("GPT image generation keeps the 6mang ratio and 1K/2K/4K presets", () => {
  assert.equal(imageGeneration.sizeFor("gpt-image-2.5-flare", "16:9", "4K"), "3840x2160");
  assert.equal(imageGeneration.sizeFor("gpt-image-2.5-sunburst", "2:3", "1K"), "672x1008");
  assert.equal(imageGeneration.sizeFor("gpt-image-2.5-flare", "1:1", "2K"), "2048x2048");
});

test("Seedream Flash and Pro use valid exact 1K/1.5K/2K output sizes", () => {
  assert.equal(imageGeneration.sizeFor("doubao-seedream-5-0-flash-260915", "9:16", "1.5K"), "1080x1920");
  assert.equal(imageGeneration.sizeFor("doubao-seedream-5-0-pro-260628", "4:3", "2K"), "2368x1776");
  assert.equal(imageGeneration.isSeedreamProModel("doubao-seedream-5-0-pro-260628"), true);
});

test("image generation normalizes reference mentions and caps references at ten", () => {
  assert.equal(imageGeneration.normalizePrompt("参考 @图片 1 生成角色"), "参考 图片1 生成角色");
  assert.equal(imageGeneration.validateReferenceCount(10), 10);
  assert.throws(() => imageGeneration.validateReferenceCount(11), /最多允许 10 张/);
});
