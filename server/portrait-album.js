"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PROJECT_ID = /^project-[a-f0-9]{12}$/;
const VERSION_ID = /^v\d+$/;
const JOB_ID = /^[0-9a-f-]{36}$/i;

function createPortraitAlbum({ dataDir, projectRoot, root: configuredRoot, outputDir, findJob }) {
  const root = configuredRoot || path.join(dataDir, "portrait-album");
  const projects = projectRoot || path.join(dataDir, "character-studio", "projects");
  const indexPath = path.join(root, "index.json");
  fs.mkdirSync(root, { recursive: true });

  function readIndex() {
    if (!fs.existsSync(indexPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("写真作品索引无效");
    return parsed;
  }

  function writeIndex(items) {
    const temporary = `${indexPath}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(items, null, 2)}\n`);
    fs.renameSync(temporary, indexPath);
  }

  function readLockedProject(projectId, versionId) {
    if (!PROJECT_ID.test(projectId) || !VERSION_ID.test(versionId)) throw new Error("人物或版本编号无效");
    const projectPath = path.join(projects, projectId, "project.json");
    if (!fs.existsSync(projectPath)) throw new Error("人物项目不存在");
    const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
    const version = project.versions?.find((item) => item.id === versionId);
    if (project.id !== projectId || !version || version.status !== "locked") throw new Error("请选择已确认的人物版本");
    return project;
  }

  function list(projectId) {
    if (projectId && !PROJECT_ID.test(projectId)) throw new Error("人物编号无效");
    return readIndex().filter((item) => !projectId || item.projectId === projectId);
  }

  function save({ projectId, versionId, jobIds }) {
    const project = readLockedProject(projectId, versionId);
    if (!Array.isArray(jobIds) || jobIds.length < 1 || jobIds.length > 4 || new Set(jobIds).size !== jobIds.length) {
      throw new Error("请选择 1–4 张不同的写真成片");
    }
    const jobs = jobIds.map((id) => {
      if (typeof id !== "string" || !JOB_ID.test(id)) throw new Error("写真任务编号无效");
      const job = findJob(id);
      if (!job || job.mode !== "portraitStudio" || job.status !== "succeeded" || !job.result?.filename) {
        throw new Error("只能保存已完成的写真成片");
      }
      const filename = job.result.filename;
      if (filename !== path.basename(filename) || !/\.png$/i.test(filename)) throw new Error("写真结果文件无效");
      if (!fs.existsSync(path.join(outputDir, filename))) throw new Error("写真结果文件已不存在");
      return job;
    });
    const seriesIds = new Set(jobs.map((job) => job.portrait?.seriesId));
    if (seriesIds.size !== 1 || seriesIds.has(undefined) || seriesIds.has("")) throw new Error("写真成片必须来自同一系列");
    const index = readIndex();
    const existing = new Set(index.filter((item) => item.projectId === projectId && item.versionId === versionId).map((item) => item.jobId));
    const created = [];
    for (const job of jobs) {
      if (existing.has(job.id)) continue;
      const id = crypto.randomUUID();
      fs.copyFileSync(path.join(outputDir, job.result.filename), path.join(root, `${id}.png`));
      created.push({
        id, projectId, versionId, displayName: project.displayName, jobId: job.id,
        seriesId: job.portrait.seriesId, shotId: job.portrait.shotId,
        styleId: job.portrait.styleId, model: job.model, size: job.size,
        createdAt: new Date().toISOString(), imageUrl: `/api/studio/portraits/${id}/image`
      });
    }
    if (created.length) writeIndex([...created, ...index]);
    return { created, items: list(projectId) };
  }

  function imagePath(id) {
    if (!JOB_ID.test(id) || !readIndex().some((item) => item.id === id)) throw new Error("写真作品不存在");
    const filename = path.join(root, `${id}.png`);
    if (!fs.existsSync(filename)) throw new Error("写真图片不存在");
    return filename;
  }

  return { list, save, imagePath };
}

module.exports = { createPortraitAlbum };
