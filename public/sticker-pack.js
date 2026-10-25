"use strict";

(function attachStickerPack(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StickerPack = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createStickerPack() {
  const PACK_CONFIGS = Object.freeze({
    6: Object.freeze({ count: 6, columns: 3, rows: 2, size: "2496x1664" }),
    9: Object.freeze({ count: 9, columns: 3, rows: 3, size: "2048x2048" }),
    12: Object.freeze({ count: 12, columns: 3, rows: 4, size: "1776x2368" })
  });

  const DEFAULT_CAPTIONS = Object.freeze([
    "收到", "好的", "好耶", "无语", "震惊", "加油",
    "委屈", "困了", "笑死", "拜托", "摸鱼中", "抱抱"
  ]);

  const STYLE_PROMPTS = Object.freeze({
    cute: "Q萌手绘贴纸风，圆润比例，大头小身体，色彩明快，线条干净",
    comic: "活泼漫画贴纸风，表情夸张，动作有张力，鲜明配色和趣味效果线",
    soft: "软萌治愈贴纸风，柔和配色，温暖光感，可爱细腻的手绘质感"
  });

  const MEME_TONE_EXAMPLES = Object.freeze([
    "稳了", "这波可以", "让我看看", "有点东西", "我先撤了", "不愧是我",
    "问题不大", "拿捏了", "就离谱", "懂的都懂", "主打一个", "在线吃瓜",
    "正在加载", "我裂开了", "先躺一会", "好家伙", "别催了", "马上到"
  ]);

  function normalizeCount(value) {
    const count = Number(value);
    return PACK_CONFIGS[count] ? count : 12;
  }

  function packForCount(value) {
    return PACK_CONFIGS[normalizeCount(value)];
  }

  function normalizeStyle(value) {
    return STYLE_PROMPTS[value] ? value : "cute";
  }

  function normalizeCaptionMode(value) {
    return value === "random" ? "random" : "custom";
  }

  function defaultCaptions(value) {
    return DEFAULT_CAPTIONS.slice(0, normalizeCount(value));
  }

  function normalizeCaptions(captions, value) {
    const count = normalizeCount(value);
    const defaults = defaultCaptions(count);
    const source = Array.isArray(captions) ? captions : [];
    return defaults.map((fallback, index) => String(source[index] || "").trim().slice(0, 12) || fallback);
  }

  function randomMemeExamples(count, random = Math.random) {
    const pool = [...MEME_TONE_EXAMPLES];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.max(0, Math.min(0.999999, Number(random()) || 0)) * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }
    return pool.slice(0, Math.min(normalizeCount(count), pool.length));
  }

  function buildPrompt({ count = 12, captions = [], captionMode = "custom", style = "cute", extra = "" } = {}) {
    const pack = packForCount(count);
    const mode = normalizeCaptionMode(captionMode);
    const extraText = String(extra || "").trim();
    const captionInstruction = mode === "random"
      ? [
          `请先理解图片1中的人物或宠物、表情、动作、身份线索和场景，再由你自动创作 ${pack.count} 条互不重复的简体中文短梗。`,
          "文案必须同时遵守两条创作规则：①自然匹配常见、流行的网络热梗和聊天语气，不生硬堆梗；②至少三分之一必须结合上传画面的具体内容进行想象和脑补，写成只有看过这张图才觉得好玩的场景短句。",
          `每条建议 2—8 个汉字，口语化、好懂、好笑、适合聊天发送。语气灵感可参考但不要机械照抄：${randomMemeExamples(pack.count).join("、")}。`,
          `严格创作 ${pack.count} 条，每格只放一条；不得重复、不得出现解释、序号、引号、标签、英文翻译或额外文字。`
        ].join("\n")
      : (() => {
          const words = normalizeCaptions(captions, pack.count);
          const captionList = words.map((word, index) => `${index + 1}.「${word}」`).join("；");
          return `按从左到右、从上到下的顺序，只使用以下 ${pack.count} 条文字：${captionList}。文字必须逐字准确、醒目、完整，不要翻译，不要改写，不要添加其他文字。`;
        })();
    return [
      `把图片1中的同一个人物或宠物设计成一张完整的 Q 版表情包宫格。最终只输出一张完整图片，严格为 ${pack.columns} 列 × ${pack.rows} 行，共 ${pack.count} 个独立表情，不得增加、减少或合并格子。`,
      "自动判断主体是人物还是宠物。人物要保留可识别的脸部特征、发型、服装颜色和标志性配饰；宠物要保留品种、毛色花纹、耳朵、眼睛和标志性特征。所有格子必须是同一个主体，身份统一。",
      `统一视觉风格：${STYLE_PROMPTS[normalizeStyle(style)]}。每格使用不同且清晰的表情、姿势和动作，与文字语义一致。`,
      captionInstruction,
      "每个表情使用白色贴纸描边，格子之间留足白色间距，纯白或近白背景，主体和文字不得跨格、重叠或被裁切。不要水印、Logo、页码、标题或额外角色。",
      "参考图只用于识别主体，不照搬照片背景；直接生成适合聊天软件使用的完整表情包联系表。",
      extraText ? `用户补充要求：${extraText}` : ""
    ].filter(Boolean).join("\n");
  }

  return {
    PACK_CONFIGS,
    normalizeCount,
    packForCount,
    normalizeStyle,
    normalizeCaptionMode,
    defaultCaptions,
    normalizeCaptions,
    randomMemeExamples,
    buildPrompt
  };
});
