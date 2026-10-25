(function exposeModel3DUtils(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Model3DUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createModel3DUtils() {
  "use strict";

  const supportedFormats = Object.freeze(["glb", "gltf", "obj", "fbx", "stl"]);
  const ratioOptions = Object.freeze([
    ["1:1", 1],
    ["16:9", 16 / 9],
    ["9:16", 9 / 16],
    ["4:3", 4 / 3],
    ["3:4", 3 / 4],
    ["3:2", 3 / 2],
    ["2:3", 2 / 3],
    ["21:9", 21 / 9]
  ]);

  function detectFormat(filename) {
    const extension = String(filename || "").split(".").pop().toLowerCase();
    return supportedFormats.includes(extension) ? extension : "";
  }

  function validateFile(file, maximumBytes = 200 * 1024 * 1024) {
    if (!file || typeof file.size !== "number") throw new Error("请选择 3D 模型文件");
    const format = detectFormat(file.name);
    if (!format) throw new Error("仅支持 GLB、GLTF、OBJ、FBX 或 STL 模型");
    if (!file.size) throw new Error("模型文件为空");
    if (file.size > maximumBytes) throw new Error(`模型文件不能超过 ${Math.round(maximumBytes / 1024 / 1024)}MB`);
    return format;
  }

  function ratioNumber(label) {
    return ratioOptions.find(([name]) => name === label)?.[1] || 1;
  }

  function cropRect(width, height, ratio) {
    const sourceWidth = Math.max(1, Math.round(Number(width) || 1));
    const sourceHeight = Math.max(1, Math.round(Number(height) || 1));
    const target = Math.max(0.01, Number(ratio) || 1);
    let cropWidth;
    let cropHeight;
    if (sourceWidth / sourceHeight > target) {
      cropHeight = sourceHeight;
      cropWidth = Math.round(sourceHeight * target);
    } else {
      cropWidth = sourceWidth;
      cropHeight = Math.round(sourceWidth / target);
    }
    return {
      x: Math.round((sourceWidth - cropWidth) / 2),
      y: Math.round((sourceHeight - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight
    };
  }

  function safeBaseName(filename) {
    return String(filename || "model")
      .replace(/\.[^.]+$/, "")
      .replace(/[^A-Za-z0-9\u4e00-\u9fff_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "model";
  }

  function captureFilename(modelName, now = new Date()) {
    const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z").replace("T", "-");
    return `${safeBaseName(modelName)}-3d-${stamp}.png`;
  }

  return { supportedFormats, ratioOptions, detectFormat, validateFile, ratioNumber, cropRect, captureFilename };
});
