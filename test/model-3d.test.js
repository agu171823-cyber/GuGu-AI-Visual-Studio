"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { supportedFormats, detectFormat, validateFile, ratioNumber, cropRect, captureFilename } = require("../public/model-3d-utils");

test("3D model preview accepts the five formats exposed by 6mang", () => {
  assert.deepEqual(supportedFormats, ["glb", "gltf", "obj", "fbx", "stl"]);
  assert.equal(detectFormat("scene.GLB"), "glb");
  assert.equal(detectFormat("mesh.usdz"), "");
});

test("3D model validation rejects empty, unsupported, and oversized files", () => {
  assert.equal(validateFile({ name: "chair.obj", size: 1024 }), "obj");
  assert.throws(() => validateFile({ name: "chair.zip", size: 10 }), /仅支持/);
  assert.throws(() => validateFile({ name: "chair.glb", size: 0 }), /为空/);
  assert.throws(() => validateFile({ name: "chair.glb", size: 101 }, 100), /不能超过/);
});

test("3D capture ratios use centered crops", () => {
  assert.equal(ratioNumber("16:9"), 16 / 9);
  assert.deepEqual(cropRect(1600, 1200, 1), { x: 200, y: 0, width: 1200, height: 1200 });
  assert.deepEqual(cropRect(1200, 1600, 16 / 9), { x: 0, y: 463, width: 1200, height: 675 });
});

test("3D capture filenames are local-safe PNG names", () => {
  assert.equal(captureFilename("Ghost Pack.obj", new Date("2026-10-01T12:34:56Z")), "Ghost-Pack-3d-20261001-123456Z.png");
});

test("3D capture can become the material-transfer structure master", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
  const workspace = fs.readFileSync(path.join(root, "public", "model-3d-workspace.js"), "utf8");
  const app = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
  assert.match(html, /id="model3dSendMaterialButton"[^>]*>用作材质迁移结构母版/);
  assert.match(workspace, /sendCapture\("materialTransfer"\)/);
  assert.match(app, /loadMaterialTransferFile\("structure", file\)/);
});
