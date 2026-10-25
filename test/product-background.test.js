"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const productBackground = require("../public/product-background");

test("product background prompt fixes product and background roles", () => {
  const prompt = productBackground.buildPrompt({ extra: "产品放在桌面中央", aspectSource: "background" });
  assert.match(prompt, /图片1：产品原图/);
  assert.match(prompt, /图片2：用户指定的背景图/);
  assert.match(prompt, /Logo、商标、文字内容和排版/);
  assert.match(prompt, /输出画面比例跟随图片2/);
  assert.match(prompt, /产品放在桌面中央/);
});

test("product background output size follows the selected image aspect", () => {
  const sizes = ["2048x2048", "2816x1584", "1584x2816", "2368x1776", "1776x2368"];
  assert.equal(productBackground.nearestSizeForAspect(1600, 900, sizes), "2816x1584");
  assert.equal(productBackground.nearestSizeForAspect(900, 1600, sizes), "1584x2816");
  assert.equal(productBackground.nearestSizeForAspect(1200, 1200, sizes), "2048x2048");
});

test("product background aspect source only accepts the two defined roles", () => {
  assert.equal(productBackground.normalizeAspectSource("background"), "background");
  assert.equal(productBackground.normalizeAspectSource("product"), "product");
  assert.equal(productBackground.normalizeAspectSource("unexpected"), "product");
});
