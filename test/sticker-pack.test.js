"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const stickerPack = require("../public/sticker-pack");

test("sticker pack exposes the three complete fast-grid layouts", () => {
  assert.deepEqual(stickerPack.packForCount(6), { count: 6, columns: 3, rows: 2, size: "2496x1664" });
  assert.deepEqual(stickerPack.packForCount(9), { count: 9, columns: 3, rows: 3, size: "2048x2048" });
  assert.deepEqual(stickerPack.packForCount(12), { count: 12, columns: 3, rows: 4, size: "1776x2368" });
  assert.equal(stickerPack.normalizeCount("unexpected"), 12);
});

test("sticker pack captions always match the selected grid count", () => {
  assert.deepEqual(stickerPack.normalizeCaptions(["收到", "", "OK"], 6), ["收到", "好的", "OK", "无语", "震惊", "加油"]);
  assert.equal(stickerPack.defaultCaptions(9).length, 9);
  assert.equal(stickerPack.normalizeCaptions(new Array(20).fill("好"), 12).length, 12);
});

test("sticker pack prompt locks identity, layout, captions, and single-sheet output", () => {
  const prompt = stickerPack.buildPrompt({
    count: 9,
    captions: ["收到", "好的", "好耶", "无语", "震惊", "加油", "委屈", "困了", "笑死"],
    style: "comic",
    extra: "服装保持蓝色"
  });
  assert.match(prompt, /3 列 × 3 行，共 9 个/);
  assert.match(prompt, /人物还是宠物/);
  assert.match(prompt, /同一个主体，身份统一/);
  assert.match(prompt, /1.「收到」/);
  assert.match(prompt, /9.「笑死」/);
  assert.match(prompt, /最终只输出一张完整图片/);
  assert.match(prompt, /服装保持蓝色/);
});

test("random caption mode asks AI for popular memes and image-specific punchlines", () => {
  const prompt = stickerPack.buildPrompt({
    count: 6,
    captionMode: "random",
    captions: ["这条自定义文字不应被使用"],
    style: "cute"
  });
  assert.equal(stickerPack.normalizeCaptionMode("random"), "random");
  assert.equal(stickerPack.normalizeCaptionMode("unexpected"), "custom");
  assert.match(prompt, /常见、流行的网络热梗/);
  assert.match(prompt, /结合上传画面的具体内容进行想象和脑补/);
  assert.match(prompt, /2—8 个汉字/);
  assert.match(prompt, /严格创作 6 条/);
  assert.doesNotMatch(prompt, /这条自定义文字不应被使用/);
});
