"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const materialTransfer = require("../public/material-transfer");

test("material transfer prompt fixes image roles and preserves structure", () => {
  const prompt = materialTransfer.buildPrompt({
    strength: "strong",
    materialHint: "温润半透明白玉",
    extra: "只替换盔甲，皮肤不变"
  });
  assert.match(prompt, /图片1 是主体 \/ 结构图/);
  assert.match(prompt, /图片2 是材质参考图/);
  assert.match(prompt, /不得改变图片1的几何结构/);
  assert.match(prompt, /温润半透明白玉/);
  assert.match(prompt, /只替换盔甲，皮肤不变/);
});

test("material transfer strength defaults to balanced and validates exactly two images", () => {
  assert.equal(materialTransfer.normalizeStrength("subtle"), "subtle");
  assert.equal(materialTransfer.normalizeStrength("unexpected"), "balanced");
  assert.equal(materialTransfer.connectionLabel(0), "主体 / 结构");
  assert.equal(materialTransfer.connectionLabel(1), "材质参考");
  assert.equal(materialTransfer.connectionLabel(2), "多余参考 3");
  assert.equal(materialTransfer.validateInputCount(2), true);
  assert.throws(() => materialTransfer.validateInputCount(1), /需要两张图片/);
  assert.throws(() => materialTransfer.validateInputCount(3), /只接受两张图片/);
});

test("material transfer output size follows the structure image aspect", () => {
  const sizes = ["2048x2048", "2816x1584", "1584x2816", "2368x1776", "1776x2368"];
  assert.equal(materialTransfer.nearestSizeForAspect(1600, 900, sizes), "2816x1584");
  assert.equal(materialTransfer.nearestSizeForAspect(900, 1600, sizes), "1584x2816");
  assert.equal(materialTransfer.nearestSizeForAspect(1200, 1200, sizes), "2048x2048");
});
