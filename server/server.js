"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  loadSettings,
  saveSettings,
  mergeSettings,
  publicSettings,
  providerFor,
  modelForProvider,
  isVolcProvider,
  imageGenerationUrl,
  buildVolcImageRequest,
  buildOpenAiGenerationRequest,
  isGptImage2Model,
  parseDataUrl,
  extensionForMime,
  extractImageSource,
  isPrivateHostname,
  planHistoryDeletion,
  jobFileNames,
  withStatus
} = require("./image-api");
const { preparePortraitPayload, publicOptions: publicPortraitOptions } = require("./portrait-studio");
const imageGeneration = require("../public/image-generation");
const { createCharacterService } = require("./character-studio.cjs");
const { createPortraitAlbum } = require("./portrait-album");
const { createTeamStore } = require("./team-db");

const rootDir = path.resolve(__dirname, "..");
loadDotEnv(path.join(rootDir, ".env"));

const publicDir = path.join(rootDir, "public");
const configDir = process.env.GUGU_CONFIG_DIR ? path.resolve(process.env.GUGU_CONFIG_DIR) : path.join(rootDir, "config");
const dataDir = process.env.GUGU_DATA_DIR ? path.resolve(process.env.GUGU_DATA_DIR) : path.join(rootDir, "data");
const outputDir = process.env.GUGU_OUTPUT_DIR ? path.resolve(process.env.GUGU_OUTPUT_DIR) : path.join(rootDir, "output");
const settingsPath = path.join(configDir, "settings.json");
const jobsPath = path.join(dataDir, "jobs.json");
for (const directory of [configDir, dataDir, outputDir]) fs.mkdirSync(directory, { recursive: true });

const host = process.env.HOST || "127.0.0.1";
const port = positiveInteger(process.env.PORT, 8797);
const concurrency = Math.max(1, Math.min(4, positiveInteger(process.env.JOB_CONCURRENCY, 1)));
const maxRequestBytes = Math.max(20, positiveInteger(process.env.MAX_REQUEST_MB, 180)) * 1024 * 1024;
const { requestUpstream, readResultBytes } = require("./image-transport").createImageTransport();
const teamStore = createTeamStore({
  dataDir,
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  adminInitialBalance: positiveInteger(process.env.ADMIN_INITIAL_BALANCE, 100000)
});
if (teamStore.bootstrap?.generated) {
  console.log(`[bootstrap] 管理员账号 ${teamStore.bootstrap.user.username} 的一次性初始密码：${teamStore.bootstrap.password}`);
  console.log("[bootstrap] 请登录管理后台后立即设置一个新的强密码。");
}

let settings = loadSettings(settingsPath);
const primaryAdmin = teamStore.getUserByUsername(process.env.ADMIN_USERNAME || "admin");
let jobs = loadJobs();
teamStore.releaseActiveHoldsByPrefix("character:", "character/generate");
const payloads = new Map();
const queue = [];
let activeJobs = 0;
const characterServices = new Map();
const portraitAlbums = new Map();

function storageForUser(user) {
  const isPrimaryAdmin = Number(user.id) === Number(primaryAdmin?.id);
  const userRoot = isPrimaryAdmin ? dataDir : path.join(dataDir, "users", String(user.id));
  const userOutputDir = isPrimaryAdmin ? outputDir : path.join(outputDir, "users", String(user.id));
  const projectRoot = isPrimaryAdmin
    ? path.join(dataDir, "character-studio", "projects")
    : path.join(userRoot, "character-studio", "projects");
  const portraitRoot = isPrimaryAdmin
    ? path.join(dataDir, "portrait-album")
    : path.join(userRoot, "portrait-album");
  for (const directory of [userRoot, userOutputDir, projectRoot, portraitRoot]) fs.mkdirSync(directory, { recursive: true });
  return { userRoot, outputDir: userOutputDir, projectRoot, portraitRoot };
}

function portraitAlbumFor(user) {
  if (!portraitAlbums.has(user.id)) {
    const storage = storageForUser(user);
    portraitAlbums.set(user.id, createPortraitAlbum({
      projectRoot: storage.projectRoot,
      root: storage.portraitRoot,
      outputDir: storage.outputDir,
      findJob: (id) => jobs.find((item) => item.id === id && Number(item.userId) === Number(user.id))
    }));
  }
  return portraitAlbums.get(user.id);
}

function characterServiceFor(user) {
  if (characterServices.has(user.id)) return characterServices.get(user.id);
  const storage = storageForUser(user);
  const service = createCharacterService({
    projectRoot: storage.projectRoot,
    getOptions: () => ({ providers: Object.fromEntries(Object.entries(publicSettings(settings).providers).map(([id, item]) => [id, { label: item.label, configured: item.configured, models: item.models.filter(model => /^(gpt-image-2\.5-(flare|sunburst)|doubao-seedream-5-0-(flash|pro)-\d+)$/.test(model.id)) }])) }),
    sizeFor: imageGeneration.sizeFor,
    generate: async (input) => {
      const provider = providerFor(settings, input.providerId);
      const model = modelForProvider(provider, input.model);
      const images = await Promise.all(input.images.map(async file => `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`));
      const holdId = `character:${crypto.randomUUID()}`;
      teamStore.reserveCredit({ id: holdId, userId: user.id, amount: teamStore.costFor("characterStudio"), description: `角色素材 ${model}` });
      return new Promise((resolve, reject) => {
        queue.push({ run: async () => {
          const started = Date.now();
          try {
            const response = await requestUpstream(provider, {mode:"characterStudio",model,prompt:input.prompt,size:input.size,quality:input.quality,outputFormat:"png",promptOptimization:input.promptOptimization,image:images[0],referenceImages:images.slice(1),noRetry:true});
            const source = extractImageSource(response.data);
            if (!source) throw new Error("上游没有返回图片");
            const result = await readResultBytes(source, "png");
            if (result.buffer.length > 30 * 1024 * 1024) throw new Error("角色资产超过 30MB，请降低分辨率");
            if (!result.buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error("模型未返回 PNG 图片，请手动重试；角色参考包需要 PNG 原图");
            teamStore.settleCredit({ id: holdId, route: "character/generate", model });
            resolve({imageB64:result.buffer.toString("base64"),provider:input.providerId,model,size:input.size,latencyMs:Date.now()-started});
          } catch(error) {
            const safe = String(error.message || "角色图片生成失败").split(provider.apiKey).join("[redacted]").slice(0, 600);
            teamStore.releaseCredit({ id: holdId, route: "character/generate", model, status: `error: ${safe}` });
            reject(new Error(safe));
          }
        }});
        pumpQueue();
      });
    }
  });
  characterServices.set(user.id, service);
  return service;
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".hdr": "application/octet-stream"
};

const server = http.createServer(async (req, res) => {
  try {
    setSecurityHeaders(res);
    const url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
    if (url.pathname.startsWith("/api/")) {
      validateOrigin(req);
      await handleApi(req, res, url);
      return;
    }
    serveStatic(url.pathname, res);
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${statusCode} ${error.code || "ERROR"}: ${error.message}`);
    if (!res.headersSent) sendJson(res, statusCode, { error: error.message || "服务器错误", code: error.code || "SERVER_ERROR" });
    else res.end();
  }
});

server.listen(port, host, () => {
  console.log(`GuGu AI Visual Studio running at http://${host}:${port}`);
  if (host === "0.0.0.0") console.log(`[network] 请通过本机局域网 IP 或 PUBLIC_ORIGIN 访问端口 ${port}`);
});

const SESSION_COOKIE = "gugu_team_session";
const loginAttempts = new Map();

function loginAttemptKey(req, username) {
  return `${req.socket?.remoteAddress || "unknown"}:${String(username || "").trim().toLowerCase()}`;
}

function assertLoginAllowed(req, username) {
  const key = loginAttemptKey(req, username);
  const entry = loginAttempts.get(key);
  if (!entry || Date.now() - entry.firstAt > 10 * 60 * 1000) { loginAttempts.delete(key); return; }
  if (entry.count >= 5) throw withStatus("登录失败次数过多，请 10 分钟后再试", 429, "LOGIN_RATE_LIMITED");
}

function recordLoginFailure(req, username) {
  const key = loginAttemptKey(req, username);
  const entry = loginAttempts.get(key);
  if (!entry || Date.now() - entry.firstAt > 10 * 60 * 1000) loginAttempts.set(key, { count: 1, firstAt: Date.now() });
  else entry.count += 1;
}

function clearLoginFailures(req, username) {
  loginAttempts.delete(loginAttemptKey(req, username));
}

function parseCookies(header) {
  if (!header) return {};
  const result = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    try { result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim()); } catch {}
  }
  return result;
}

function requestIsSecure(req) {
  return Boolean(req.socket?.encrypted) || String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
}

function setSessionCookie(res, token, maxAgeSec, req) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}${requestIsSecure(req) ? "; Secure" : ""}`);
}

function clearSessionCookie(res, req) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${requestIsSecure(req) ? "; Secure" : ""}`);
}

function getRequestUser(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const user = teamStore.lookupSession(token);
  return user?.status === "active" ? user : null;
}

function requireUser(req) {
  const user = getRequestUser(req);
  if (!user) throw withStatus("请先登录", 401, "AUTH_REQUIRED");
  return user;
}

function requireAdmin(user) {
  if (user?.role !== "admin") throw withStatus("需要管理员权限", 403, "ADMIN_REQUIRED");
}

function modeDescription(mode) {
  return ({
    imageGenerate: "图片生成",
    expand: "图片扩展",
    precise: "精确编辑",
    productBackground: "产品换背景",
    materialTransfer: "材质迁移",
    stickerPack: "Q版表情包",
    portraitStudio: "人像写真",
    characterStudio: "角色素材"
  })[mode] || String(mode || "生成任务");
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, app: "GuGu AI Visual Studio", version: require("../package.json").version });
    return;
  }
  if (url.pathname === "/api/auth/register" && req.method === "POST") {
    const body = await readJson(req);
    const user = teamStore.register({ username: body.username, password: body.password });
    sendJson(res, 201, { user, message: "注册成功，请等待管理员审核后登录" });
    return;
  }
  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    const body = await readJson(req);
    assertLoginAllowed(req, body.username);
    const user = teamStore.authenticate(body.username, body.password);
    if (!user) {
      recordLoginFailure(req, body.username);
      throw withStatus("用户名或密码错误", 401, "INVALID_CREDENTIALS");
    }
    if (user.status === "pending") throw withStatus("账号正在等待管理员审核", 403, "ACCOUNT_PENDING");
    if (user.status !== "active") throw withStatus("账号已被停用，请联系管理员", 403, "ACCOUNT_DISABLED");
    clearLoginFailures(req, body.username);
    const session = teamStore.createSession(user.id);
    setSessionCookie(res, session.token, 60 * 60 * 24 * 14, req);
    sendJson(res, 200, { user: teamStore.publicUser(teamStore.getUserById(user.id)), team: teamStore.getSettings() });
    return;
  }
  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    teamStore.destroySession(token);
    clearSessionCookie(res, req);
    sendJson(res, 200, { ok: true });
    return;
  }
  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const user = getRequestUser(req);
    sendJson(res, 200, { user: user ? teamStore.publicUser(user) : null, team: teamStore.getSettings() });
    return;
  }

  const user = requireUser(req);

  if (url.pathname === "/api/billing/transactions" && req.method === "GET") {
    sendJson(res, 200, { transactions: teamStore.listTransactions(user.id, url.searchParams.get("limit")) });
    return;
  }
  if (url.pathname === "/api/billing/usage" && req.method === "GET") {
    sendJson(res, 200, { usage: teamStore.listUsage(user.id, url.searchParams.get("limit")) });
    return;
  }

  if (url.pathname.startsWith("/api/admin/")) requireAdmin(user);
  if (url.pathname === "/api/admin/overview" && req.method === "GET") {
    sendJson(res, 200, { ...teamStore.overview(), queue: { active: activeJobs, waiting: queue.length, concurrency } });
    return;
  }
  if (url.pathname === "/api/admin/users" && req.method === "GET") {
    sendJson(res, 200, { users: teamStore.listUsers() });
    return;
  }
  const adminJobMatch = /^\/api\/admin\/jobs\/([0-9a-f-]+)$/i.exec(url.pathname);
  if (adminJobMatch && req.method === "DELETE") {
    const targetJob = jobs.find((item) => item.id === adminJobMatch[1]);
    if (!targetJob) throw withStatus("任务不存在", 404, "JOB_NOT_FOUND");
    if (!["succeeded", "failed"].includes(targetJob.status)) throw withStatus("运行中的任务不能删除", 409, "JOB_ACTIVE");
    const owner = teamStore.getUserById(targetJob.userId);
    const deletedFiles = deleteJobFiles(targetJob, storageForUser(owner).outputDir);
    jobs = jobs.filter((item) => item.id !== targetJob.id);
    teamStore.deleteJobs({ userId: targetJob.userId, ids: [targetJob.id], allowAll: true });
    teamStore.recordAudit(user.id, "job.delete", targetJob.userId, JSON.stringify({ jobId: targetJob.id, deletedFiles }));
    sendJson(res, 200, { deleted: true, deletedFiles });
    return;
  }
  const adminUserDataMatch = /^\/api\/admin\/users\/(\d+)\/(transactions|usage|jobs|content)$/.exec(url.pathname);
  if (adminUserDataMatch && req.method === "GET") {
    const targetId = Number(adminUserDataMatch[1]);
    if (!teamStore.getUserById(targetId)) throw withStatus("用户不存在", 404, "USER_NOT_FOUND");
    if (adminUserDataMatch[2] === "transactions") sendJson(res, 200, { transactions: teamStore.listTransactions(targetId, url.searchParams.get("limit")) });
    else if (adminUserDataMatch[2] === "usage") sendJson(res, 200, { usage: teamStore.listUsage(targetId, url.searchParams.get("limit")) });
    else if (adminUserDataMatch[2] === "jobs") sendJson(res, 200, { jobs: jobs.filter((item) => Number(item.userId) === targetId).slice(0, 100).map(publicJob) });
    else {
      const targetUser = teamStore.getUserById(targetId);
      const storage = storageForUser(targetUser);
      const projects = await characterServiceFor(targetUser).registry.listProjects();
      const portraits = portraitAlbumFor(targetUser).list("");
      const projectStats = directoryStats(storage.projectRoot);
      const portraitStats = directoryStats(storage.portraitRoot);
      const outputStats = directoryStats(storage.outputDir, Number(targetId) === Number(primaryAdmin?.id) ? new Set(["users"]) : null);
      sendJson(res, 200, { content: {
        projects: projects.map((item) => ({ id: item.id, displayName: item.displayName, updatedAt: item.updatedAt, versions: item.versions?.length || 0, assets: item.assets?.length || 0 })),
        portraits: portraits.map((item) => ({ id: item.id, displayName: item.displayName, createdAt: item.createdAt })),
        storage: { files: projectStats.files + portraitStats.files + outputStats.files, bytes: projectStats.bytes + portraitStats.bytes + outputStats.bytes }
      } });
    }
    return;
  }
  const adminStatusMatch = /^\/api\/admin\/users\/(\d+)\/status$/.exec(url.pathname);
  if (adminStatusMatch && req.method === "POST") {
    sendJson(res, 200, { user: teamStore.setUserStatus({ adminUserId: user.id, userId: Number(adminStatusMatch[1]), status: (await readJson(req)).status }) });
    return;
  }
  const adminPasswordMatch = /^\/api\/admin\/users\/(\d+)\/password$/.exec(url.pathname);
  if (adminPasswordMatch && req.method === "POST") {
    const body = await readJson(req);
    teamStore.resetPassword({ adminUserId: user.id, userId: Number(adminPasswordMatch[1]), password: body.password });
    sendJson(res, 200, { ok: true });
    return;
  }
  if (url.pathname === "/api/admin/credit" && req.method === "POST") {
    const body = await readJson(req);
    const target = body.userId ? teamStore.getUserById(body.userId) : teamStore.getUserByUsername(body.username);
    if (!target) throw withStatus("用户不存在", 404, "USER_NOT_FOUND");
    sendJson(res, 200, { user: teamStore.adjustBalance({ adminUserId: user.id, userId: target.id, delta: body.amount, note: body.note }) });
    return;
  }
  if (url.pathname === "/api/admin/team-settings" && req.method === "GET") {
    sendJson(res, 200, teamStore.getSettings());
    return;
  }
  if (url.pathname === "/api/admin/team-settings" && req.method === "PUT") {
    sendJson(res, 200, teamStore.updateSettings({ adminUserId: user.id, ...(await readJson(req)) }));
    return;
  }
  if (url.pathname === "/api/admin/audit" && req.method === "GET") {
    sendJson(res, 200, { items: teamStore.listAudit(url.searchParams.get("limit")) });
    return;
  }

  const portraitAlbum = portraitAlbumFor(user);
  if (url.pathname === "/api/studio/portraits" && req.method === "GET") {
    try { sendJson(res, 200, { items: portraitAlbum.list(url.searchParams.get("projectId") || "") }); }
    catch (error) { throw withStatus(error.message, 400, "INVALID_PORTRAIT_ALBUM"); }
    return;
  }
  if (url.pathname === "/api/studio/portraits" && req.method === "POST") {
    try { sendJson(res, 201, portraitAlbum.save(await readJson(req))); }
    catch (error) { throw withStatus(error.message, 400, "INVALID_PORTRAIT_ALBUM"); }
    return;
  }
  const portraitImageMatch = /^\/api\/studio\/portraits\/([0-9a-f-]{36})\/image$/i.exec(url.pathname);
  if (portraitImageMatch && req.method === "GET") {
    let filename;
    try { filename = portraitAlbum.imagePath(portraitImageMatch[1]); }
    catch (error) { throw withStatus(error.message, 404, "PORTRAIT_NOT_FOUND"); }
    res.writeHead(200, { "Content-Type": "image/png", "Content-Length": fs.statSync(filename).size, "Cache-Control": "private, max-age=31536000, immutable" });
    fs.createReadStream(filename).pipe(res);
    return;
  }
  if (url.pathname.startsWith("/api/character/")) {
    await characterServiceFor(user).listener(req, res);
    return;
  }
  if (url.pathname === "/api/status" && req.method === "GET") {
    sendJson(res, 200, {
      app: "GuGu AI Visual Studio",
      version: require("../package.json").version,
      providers: publicSettings(settings).providers,
      queue: { active: activeJobs, waiting: queue.length, concurrency },
      user: teamStore.publicUser(user),
      costs: teamStore.getSettings().costs,
      ...(user.role === "admin" ? { outputDirectory: storageForUser(user).outputDir } : {})
    });
    return;
  }

  if (url.pathname === "/api/portrait-options" && req.method === "GET") {
    sendJson(res, 200, publicPortraitOptions());
    return;
  }

  if (url.pathname === "/api/settings" && req.method === "POST") {
    requireAdmin(user);
    const body = await readJson(req);
    settings = mergeSettings(settings, body);
    saveSettings(settingsPath, settings);
    sendJson(res, 200, publicSettings(settings));
    return;
  }

  if (url.pathname === "/api/jobs" && req.method === "POST") {
    const incoming = await readJson(req);
    const existing = findIdempotentJob(user.id, incoming.clientRequestId);
    if (existing) {
      sendJson(res, 200, publicJob(existing));
      return;
    }
    let body = incoming;
    if (incoming.mode === "portraitStudio") {
      try {
        body = preparePortraitPayload(incoming);
      } catch (error) {
        throw withStatus(error.message || "写真参数无效", 400, "INVALID_PORTRAIT_SETTINGS");
      }
    }
    validateJobPayload(body);
    const unfinished = jobs.filter((item) => Number(item.userId) === Number(user.id) && ["queued", "preprocessing", "submitting", "saving"].includes(item.status));
    if (unfinished.length >= 10) throw withStatus("你的排队任务已达到 10 个，请等待已有任务完成", 429, "USER_QUEUE_LIMIT");
    const id = crypto.randomUUID();
    const holdId = `job:${id}`;
    const creditCost = teamStore.costFor(body.mode);
    teamStore.reserveCredit({ id: holdId, userId: user.id, amount: creditCost, description: `${modeDescription(body.mode)} ${body.model || ""}`.trim() });
    const now = new Date().toISOString();
    const sourceInput = body.comparisonImage || body.image || "";
    try {
      const source = (body.mode === "portraitStudio" && body.portrait?.saveSource !== true) || !sourceInput
        ? null
        : persistSourceSnapshot(id, body.mode, sourceInput, storageForUser(user).outputDir);
      const job = {
        id,
        userId: user.id,
        username: user.username,
        holdId,
        creditCost,
        clientRequestId: String(body.clientRequestId || ""),
        mode: body.mode,
        providerId: String(body.providerId || (body.mode === "precise" ? "volc" : "default")),
        model: String(body.model || ""),
        prompt: String(body.prompt || "").slice(0, 5000),
        size: String(body.size || ""),
        status: "queued",
        stage: "排队等待",
        progress: 5,
        createdAt: now,
        updatedAt: now,
        result: null,
        error: null,
        usage: null,
        requestId: "",
        source,
        generation: body.mode === "imageGenerate" ? {
          aspectRatio: String(body.aspectRatio || ""),
          sizeTier: String(body.sizeTier || ""),
          quality: String(body.quality || "medium"),
          outputFormat: String(body.outputFormat || "png"),
          promptOptimization: String(body.promptOptimization || "standard")
        } : null,
        portrait: body.mode === "portraitStudio" ? body.portrait : null
      };
      jobs.unshift(job);
      payloads.set(id, body);
      queue.push(id);
      persistJobs();
      pumpQueue();
      sendJson(res, 202, publicJob(job));
    } catch (error) {
      teamStore.releaseCredit({ id: holdId, route: `jobs/${body.mode}`, model: body.model || "", status: `create error: ${error.message}` });
      throw error;
    }
    return;
  }

  const jobMatch = /^\/api\/jobs\/([0-9a-f-]+)$/i.exec(url.pathname);
  if (jobMatch && req.method === "GET") {
    const job = jobs.find((item) => item.id === jobMatch[1] && (Number(item.userId) === Number(user.id) || user.role === "admin"));
    if (!job) throw withStatus("任务不存在", 404, "JOB_NOT_FOUND");
    sendJson(res, 200, publicJob(job));
    return;
  }

  if (url.pathname === "/api/history" && req.method === "GET") {
    sendJson(res, 200, { items: jobs.filter((item) => Number(item.userId) === Number(user.id)).slice(0, 100).map(publicJob) });
    return;
  }

  if (url.pathname === "/api/history" && req.method === "DELETE") {
    const body = await readJson(req);
    const ownedJobs = jobs.filter((item) => Number(item.userId) === Number(user.id));
    const deletion = planHistoryDeletion(ownedJobs, body);
    const selectedIds = new Set(deletion.selected.map((item) => item.id));
    const retainedFiles = new Set(deletion.remaining.flatMap(jobFileNames));
    jobs = jobs.filter((item) => !selectedIds.has(item.id));
    persistJobs();
    teamStore.deleteJobs({ userId: user.id, ids: [...selectedIds] });

    let deletedFiles = 0;
    const failedFiles = [];
    for (const job of deletion.selected) {
      for (const filename of jobFileNames(job)) {
        if (retainedFiles.has(filename)) continue;
        const target = path.join(storageForUser(user).outputDir, filename);
        try {
          if (fs.existsSync(target)) {
            fs.unlinkSync(target);
            deletedFiles += 1;
          }
        } catch {
          failedFiles.push(filename);
        }
      }
    }

    sendJson(res, 200, {
      deletedRecords: deletion.selected.length,
      deletedFiles,
      failedFiles: failedFiles.length
    });
    return;
  }

  const fileMatch = /^\/api\/files\/([^/]+)$/.exec(url.pathname);
  if (fileMatch && req.method === "GET") {
    const filename = decodeURIComponent(fileMatch[1]);
    const ownerJob = jobs.find((item) => jobFileNames(item).includes(filename));
    if (!ownerJob || (Number(ownerJob.userId) !== Number(user.id) && user.role !== "admin")) throw withStatus("结果文件不存在", 404, "FILE_NOT_FOUND");
    const owner = teamStore.getUserById(ownerJob.userId);
    serveOutputFile(filename, storageForUser(owner).outputDir, res, url.searchParams.get("download") === "1");
    return;
  }

  throw withStatus("接口不存在", 404, "NOT_FOUND");
}

function validateJobPayload(body) {
  if (!body || !["imageGenerate", "expand", "precise", "productBackground", "materialTransfer", "stickerPack", "portraitStudio"].includes(body.mode)) throw withStatus("请选择有效的图片处理模式", 400, "INVALID_MODE");
  if (body.mode !== "imageGenerate" && !body.image) throw withStatus("请先上传原图", 400, "IMAGE_REQUIRED");
  if (body.image) parseDataUrl(body.image);
  if (body.comparisonImage) parseDataUrl(body.comparisonImage);
  const refs = Array.isArray(body.referenceImages) ? body.referenceImages.filter(Boolean) : [];
  if (body.mode === "expand" && refs.length) throw withStatus("图片扩展只需要一张原图", 400, "TOO_MANY_IMAGES");
  if (body.mode === "precise" && refs.length > 9) throw withStatus("精确编辑最多允许 9 张额外参考图", 400, "TOO_MANY_IMAGES");
  if (body.mode === "productBackground" && refs.length !== 1) throw withStatus("产品换背景需要一张产品图和一张背景图", 400, "PRODUCT_BACKGROUND_IMAGES_REQUIRED");
  if (body.mode === "materialTransfer" && refs.length !== 1) throw withStatus("材质迁移需要一张主体 / 结构图和一张材质参考图", 400, "MATERIAL_TRANSFER_IMAGES_REQUIRED");
  if (body.mode === "stickerPack" && refs.length) throw withStatus("Q 版表情包只需要一张人物或宠物照片", 400, "TOO_MANY_IMAGES");
  if (body.mode === "portraitStudio" && refs.length > 3) throw withStatus("写真策展室最多允许 4 张人物参考图", 400, "TOO_MANY_IMAGES");
  if (body.mode === "imageGenerate" && refs.length > 9) throw withStatus("图片生成最多允许 10 张参考图", 400, "TOO_MANY_IMAGES");
  refs.forEach((source) => parseDataUrl(source));
  if (!String(body.prompt || "").trim()) throw withStatus("请填写编辑要求", 400, "PROMPT_REQUIRED");
  if (!/^\d+x\d+$/i.test(String(body.size || ""))) throw withStatus("输出尺寸无效", 400, "INVALID_SIZE");
  if (body.mode === "stickerPack" && !["2496x1664", "2048x2048", "1776x2368"].includes(String(body.size))) throw withStatus("表情包尺寸必须对应 6、9 或 12 张完整宫格", 400, "INVALID_STICKER_PACK_SIZE");
  if (body.mode === "precise" && !["png", "jpeg"].includes(body.outputFormat)) throw withStatus("输出格式只支持 PNG 或 JPEG", 400, "INVALID_OUTPUT_FORMAT");
  if (body.mode === "imageGenerate" && !["png", "jpeg"].includes(body.outputFormat)) throw withStatus("输出格式只支持 PNG 或 JPEG", 400, "INVALID_OUTPUT_FORMAT");
  if (body.mode === "imageGenerate") {
    const ratio = imageGeneration.ratio(body.aspectRatio);
    const tier = imageGeneration.tier(body.sizeTier, body.model);
    if (ratio !== body.aspectRatio || tier !== body.sizeTier || imageGeneration.sizeFor(body.model, ratio, tier) !== body.size) {
      throw withStatus("图片生成的比例、尺寸档位或输出尺寸不匹配", 400, "INVALID_GENERATION_SIZE");
    }
  }
}

function findIdempotentJob(userId, clientRequestId) {
  const key = String(clientRequestId || "");
  if (!key) return null;
  return jobs.find((job) => Number(job.userId) === Number(userId) && job.clientRequestId === key)
    || teamStore.findJobByClientRequest(userId, key)
    || null;
}

function pumpQueue() {
  while (activeJobs < concurrency && queue.length) {
    const id = queue.shift();
    if (typeof id === "object" && id.run) {
      activeJobs += 1;
      id.run().finally(() => { activeJobs -= 1; pumpQueue(); });
      continue;
    }
    const job = jobs.find((item) => item.id === id);
    const payload = payloads.get(id);
    if (!job || !payload) continue;
    activeJobs += 1;
    processJob(job, payload)
      .catch(() => {})
      .finally(() => {
        activeJobs -= 1;
        payloads.delete(id);
        pumpQueue();
      });
  }
}

async function processJob(job, payload) {
  try {
    updateJob(job, { status: "preprocessing", stage: "检查图片与参数", progress: 15 });
    const provider = providerFor(settings, job.providerId);
    const model = modelForProvider(provider, payload.model);
    updateJob(job, { model, status: "submitting", stage: `正在提交到${provider.label}`, progress: 30 });

    const upstream = await requestUpstream(provider, { ...payload, model });
    const source = extractImageSource(upstream.data);
    if (!source) throw withStatus("上游没有返回可用的图片", 502, "IMAGE_MISSING");

    updateJob(job, { status: "saving", stage: "正在保存结果到本机", progress: 85, requestId: upstream.requestId || "" });
    const owner = teamStore.getUserById(job.userId);
    if (!owner) throw withStatus("任务所属用户不存在", 500, "JOB_OWNER_MISSING");
    const result = await persistResult(job, source, payload.outputFormat, storageForUser(owner).outputDir);
    updateJob(job, {
      status: "succeeded",
      stage: "生成完成",
      progress: 100,
      result,
      usage: safeUsage(upstream.data?.usage),
      completedAt: new Date().toISOString()
    });
    teamStore.settleCredit({ id: job.holdId, route: `jobs/${job.mode}`, model: job.model, status: "ok" });
  } catch (error) {
    updateJob(job, {
      status: "failed",
      stage: "生成失败",
      progress: 100,
      error: {
        code: error.code || classifyError(error),
        message: error.message || "生成失败",
        statusCode: Number(error.statusCode) || 500
      },
      completedAt: new Date().toISOString()
    });
    teamStore.releaseCredit({ id: job.holdId, route: `jobs/${job.mode}`, model: job.model, status: `error: ${String(error.message || error).slice(0, 500)}` });
    throw error;
  }
}

async function persistResult(job, source, requestedFormat, targetOutputDir) {
  const { buffer, mime } = await readResultBytes(source, requestedFormat);
  const ext = extensionForMime(mime || `image/${requestedFormat || "png"}`);
  const filename = `${Date.now()}_${job.mode}_${job.id}.${ext}`;
  fs.mkdirSync(targetOutputDir, { recursive: true });
  fs.writeFileSync(path.join(targetOutputDir, filename), buffer);
  return {
    filename,
    url: `/api/files/${encodeURIComponent(filename)}`,
    downloadUrl: `/api/files/${encodeURIComponent(filename)}?download=1`,
    mime: mime || `image/${ext}`,
    bytes: buffer.length
  };
}

function persistSourceSnapshot(jobId, mode, source, targetOutputDir) {
  const decoded = parseDataUrl(source);
  const ext = extensionForMime(decoded.mime);
  const filename = `${Date.now()}_${mode}_${jobId}_source.${ext}`;
  fs.mkdirSync(targetOutputDir, { recursive: true });
  fs.writeFileSync(path.join(targetOutputDir, filename), decoded.buffer);
  return {
    filename,
    url: `/api/files/${encodeURIComponent(filename)}`,
    downloadUrl: `/api/files/${encodeURIComponent(filename)}?download=1`,
    mime: decoded.mime,
    bytes: decoded.buffer.length
  };
}

function serveOutputFile(filename, targetOutputDir, res, download) {
  if (filename !== path.basename(filename)) throw withStatus("文件名无效", 400, "INVALID_FILE");
  const filePath = path.join(targetOutputDir, filename);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw withStatus("结果文件不存在", 404, "FILE_NOT_FOUND");
  const ext = path.extname(filename).toLowerCase();
  const headers = {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Content-Length": fs.statSync(filePath).size,
    "Cache-Control": "private, max-age=31536000, immutable"
  };
  if (download) headers["Content-Disposition"] = `attachment; filename="${filename.replace(/[^A-Za-z0-9._-]/g, "_")}"`;
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

function deleteJobFiles(job, targetOutputDir) {
  let deleted = 0;
  for (const filename of jobFileNames(job)) {
    const target = path.join(targetOutputDir, filename);
    try {
      if (filename === path.basename(filename) && fs.existsSync(target) && fs.statSync(target).isFile()) {
        fs.unlinkSync(target);
        deleted += 1;
      }
    } catch {}
  }
  return deleted;
}

function directoryStats(root, ignoredRootDirectories = null) {
  if (!root || !fs.existsSync(root)) return { files: 0, bytes: 0 };
  const result = { files: 0, bytes: 0 };
  const pending = [root];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (current === root && entry.isDirectory() && ignoredRootDirectories?.has(entry.name)) continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(target);
      else if (entry.isFile()) { result.files += 1; result.bytes += fs.statSync(target).size; }
    }
  }
  return result;
}

function updateJob(job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  teamStore.saveJob(job);
}

function publicJob(job) {
  return {
    id: job.id,
    userId: Number(job.userId),
    username: job.username || "",
    mode: job.mode,
    providerId: job.providerId,
    model: job.model,
    prompt: job.prompt,
    size: job.size,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt || null,
    source: job.source || null,
    result: job.result,
    error: job.error,
    usage: job.usage,
    requestId: job.requestId || "",
    creditCost: Number(job.creditCost || 0),
    generation: job.generation || null,
    portrait: job.portrait || null
  };
}

function safeUsage(usage) {
  if (!usage || typeof usage !== "object") return null;
  const clean = {};
  for (const key of ["generated_images", "input_images", "output_tokens", "total_tokens"]) {
    if (Number.isFinite(Number(usage[key]))) clean[key] = Number(usage[key]);
  }
  return Object.keys(clean).length ? clean : null;
}

function classifyError(error) {
  const text = String(error?.message || "");
  if (/safety|moderation|content.policy/i.test(text)) return "CONTENT_REJECTED";
  if (/quota|billing|insufficient/i.test(text)) return "QUOTA_EXCEEDED";
  return "GENERATION_FAILED";
}

function loadJobs() {
  let loaded = teamStore.loadJobs();
  if (!loaded.length && fs.existsSync(jobsPath)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(jobsPath, "utf8"));
      if (Array.isArray(legacy) && primaryAdmin) {
        loaded = legacy.map((job) => ({ ...job, userId: primaryAdmin.id, username: primaryAdmin.username, holdId: "", creditCost: 0 }));
        for (const job of loaded) teamStore.saveJob(job);
      }
    } catch {}
  }
  return loaded.map((job) => {
    if (!["queued", "preprocessing", "submitting", "saving"].includes(job.status)) return job;
    const failed = {
      ...job,
      status: "failed",
      stage: "任务因程序重启而中断",
      progress: 100,
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: { code: "APP_RESTARTED", message: "任务因程序重启而中断，冻结积分已自动释放", statusCode: 500 }
    };
    if (failed.holdId) teamStore.releaseCredit({ id: failed.holdId, route: `jobs/${failed.mode}`, model: failed.model, status: "error: app restarted" });
    teamStore.saveJob(failed);
    return failed;
  });
}

function persistJobs() {
  for (const job of jobs) teamStore.saveJob(job);
}

function serveStatic(pathname, res) {
  const requested = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
  const resolved = path.resolve(publicDir, requested);
  if (!resolved.startsWith(`${publicDir}${path.sep}`) && resolved !== path.join(publicDir, "index.html")) throw withStatus("路径无效", 400, "INVALID_PATH");
  let target = resolved;
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) target = path.join(publicDir, "index.html");
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-cache"
  });
  fs.createReadStream(target).pipe(res);
}

function validateOrigin(req) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
  const origin = req.headers.origin;
  if (!origin) return;
  const requestHost = String(req.headers.host || "").trim();
  const configured = String(process.env.PUBLIC_ORIGIN || "").split(",").map((item) => item.trim().replace(/\/$/, "")).filter(Boolean);
  const allowed = new Set([
    ...configured,
    `http://${host}:${port}`,
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    ...(configured.length === 0 && requestHost ? [`http://${requestHost}`, `https://${requestHost}`] : [])
  ]);
  if (!allowed.has(origin)) throw withStatus("请求来源不受信任", 403, "UNTRUSTED_ORIGIN");
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self' 'sha256-X/s5dzChuEUkUxoy7B4i+S+moxvHzdwdfLEB8r/Zyks='; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxRequestBytes) {
        reject(withStatus(`请求不能超过 ${Math.round(maxRequestBytes / 1024 / 1024)}MB`, 413, "REQUEST_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch { reject(withStatus("请求 JSON 格式无效", 400, "INVALID_JSON")); }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Content-Length": body.length, "Cache-Control": "no-store" });
  res.end(body);
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

process.on("SIGINT", () => {
  persistJobs();
  server.close(() => { teamStore.close(); process.exit(0); });
});
process.on("SIGTERM", () => { server.close(() => { teamStore.close(); process.exit(0); }); });

module.exports = { server, validateJobPayload, publicJob };
