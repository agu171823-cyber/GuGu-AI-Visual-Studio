"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createPortraitAlbum } = require("../server/portrait-album");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gugu-portrait-album-"));
  t.after(() => {
    const relative = path.relative(os.tmpdir(), root);
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) fs.rmSync(root, { recursive: true, force: true });
  });
  const dataDir = path.join(root, "data");
  const outputDir = path.join(root, "output");
  const projectId = "project-123456789abc";
  fs.mkdirSync(path.join(dataDir, "character-studio", "projects", projectId), { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "character-studio", "projects", projectId, "project.json"), JSON.stringify({
    id: projectId, displayName: "测试人物", versions: [{ id: "v1", status: "locked" }]
  }));
  const jobs = new Map();
  const album = createPortraitAlbum({ dataDir, outputDir, findJob: (id) => jobs.get(id) });
  return { album, jobs, dataDir, outputDir, projectId };
}

test("已确认人物的写真独立保存，历史结果移除后仍能读取且重复保存不复制", (t) => {
  const { album, jobs, outputDir, projectId, dataDir } = fixture(t);
  const jobId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  fs.writeFileSync(path.join(outputDir, "result.png"), Buffer.from([137, 80, 78, 71]));
  jobs.set(jobId, { id: jobId, mode: "portraitStudio", status: "succeeded", result: { filename: "result.png" }, portrait: { seriesId: "series-1", shotId: "hero", styleId: "clear-natural-light" }, model: "gpt-image-2.5-flare", size: "1024x1536" });
  const saved = album.save({ projectId, versionId: "v1", jobIds: [jobId] });
  assert.equal(saved.created.length, 1);
  assert.equal(album.save({ projectId, versionId: "v1", jobIds: [jobId] }).created.length, 0);
  fs.unlinkSync(path.join(outputDir, "result.png"));
  const reloaded = createPortraitAlbum({ dataDir, outputDir, findJob: (id) => jobs.get(id) });
  assert.equal(reloaded.list(projectId).length, 1);
  assert.deepEqual(fs.readFileSync(reloaded.imagePath(saved.created[0].id)), Buffer.from([137, 80, 78, 71]));
});

test("拒绝草稿人物、未完成任务和混合写真系列", (t) => {
  const { album, jobs, outputDir, projectId, dataDir } = fixture(t);
  const firstId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const secondId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  fs.writeFileSync(path.join(outputDir, "one.png"), "one");
  fs.writeFileSync(path.join(outputDir, "two.png"), "two");
  jobs.set(firstId, { id: firstId, mode: "portraitStudio", status: "succeeded", result: { filename: "one.png" }, portrait: { seriesId: "a", shotId: "hero" } });
  jobs.set(secondId, { id: secondId, mode: "portraitStudio", status: "succeeded", result: { filename: "two.png" }, portrait: { seriesId: "b", shotId: "action" } });
  assert.throws(() => album.save({ projectId, versionId: "v1", jobIds: [firstId, secondId] }), /同一系列/);
  jobs.get(secondId).status = "failed";
  assert.throws(() => album.save({ projectId, versionId: "v1", jobIds: [secondId] }), /已完成/);
  const manifest = path.join(dataDir, "character-studio", "projects", projectId, "project.json");
  fs.writeFileSync(manifest, JSON.stringify({ id: projectId, versions: [{ id: "v1", status: "draft" }] }));
  assert.throws(() => album.save({ projectId, versionId: "v1", jobIds: [firstId] }), /已确认/);
  assert.equal(album.list(projectId).length, 0);
});
