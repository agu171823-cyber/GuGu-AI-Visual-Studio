"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DEFAULT_COSTS = Object.freeze({
  imageGenerate: 15,
  expand: 15,
  precise: 15,
  productBackground: 15,
  materialTransfer: 15,
  stickerPack: 15,
  portraitStudio: 15,
  characterStudio: 15
});

function createTeamStore({ dataDir, adminUsername = "admin", adminPassword = "", adminInitialBalance = 100000 } = {}) {
  if (!dataDir) throw new Error("dataDir is required");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "team.db"));
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','disabled')),
      balance INTEGER NOT NULL DEFAULT 0 CHECK(balance >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      approved_at TEXT,
      last_login_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS wallet_holds (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL CHECK(amount >= 0),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','settled','released')),
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      balance_after INTEGER NOT NULL,
      related_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      route TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT '',
      cost INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT '',
      related_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS admin_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(admin_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(target_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS team_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      registration_enabled INTEGER NOT NULL DEFAULT 1,
      costs_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      client_request_id TEXT NOT NULL DEFAULT '',
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_holds_user_status ON wallet_holds(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_usage_user_created ON api_usage(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_jobs_user_created ON jobs(user_id, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_user_request ON jobs(user_id, client_request_id) WHERE client_request_id <> '';
  `);

  const now = nowIso();
  db.prepare("INSERT OR IGNORE INTO team_settings (id, registration_enabled, costs_json, updated_at) VALUES (1, 1, ?, ?)")
    .run(JSON.stringify(DEFAULT_COSTS), now);

  let bootstrap = null;
  if (Number(db.prepare("SELECT COUNT(*) AS n FROM users").get().n) === 0) {
    const generated = !adminPassword;
    const password = adminPassword || generatePassword();
    const user = insertUser({ username: adminUsername, password, role: "admin", status: "active", balance: adminInitialBalance });
    bootstrap = { user: publicUser(user), password: generated ? password : "", generated };
  }

  function transaction(operation) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      try { db.exec("ROLLBACK"); } catch {}
      throw error;
    }
  }

  function insertUser({ username, password, role = "user", status = "pending", balance = 0 }) {
    const clean = validateUsername(username);
    validatePassword(password);
    const { hash, salt } = hashPassword(password);
    const timestamp = nowIso();
    const info = db.prepare(`
      INSERT INTO users (username, password_hash, password_salt, role, status, balance, created_at, updated_at, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(clean, hash, salt, role, status, nonNegativeInteger(balance), timestamp, timestamp, status === "active" ? timestamp : null);
    return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  }

  function register({ username, password }) {
    const settings = getSettings();
    if (!settings.registrationEnabled) throw problem("管理员已暂停新用户注册", 403, "REGISTRATION_DISABLED");
    try {
      return publicUser(insertUser({ username, password, role: "user", status: "pending", balance: 0 }));
    } catch (error) {
      if (/UNIQUE/i.test(String(error.message))) throw problem("用户名已被使用", 409, "USERNAME_TAKEN");
      throw error;
    }
  }

  function authenticate(username, password) {
    const row = db.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(String(username || "").trim());
    if (!row || !verifyPassword(String(password || ""), row.password_hash, row.password_salt)) return null;
    return row;
  }

  function createSession(userId, ttlSeconds = 60 * 60 * 24 * 14) {
    deleteExpiredSessions();
    const token = crypto.randomBytes(32).toString("hex");
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    db.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .run(tokenHash(token), userId, createdAt, expiresAt);
    db.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?").run(createdAt, createdAt, userId);
    return { token, expiresAt };
  }

  function lookupSession(token) {
    if (!token) return null;
    deleteExpiredSessions();
    const row = db.prepare(`
      SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at >= ?
    `).get(tokenHash(token), nowIso());
    return row || null;
  }

  function destroySession(token) {
    if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
  }

  function destroyUserSessions(userId) {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  }

  function deleteExpiredSessions() {
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(nowIso());
  }

  function publicUser(row) {
    if (!row) return null;
    const reserved = Number(db.prepare("SELECT COALESCE(SUM(amount), 0) AS n FROM wallet_holds WHERE user_id = ? AND status = 'active'").get(row.id).n);
    return {
      id: Number(row.id),
      username: row.username,
      role: row.role,
      isAdmin: row.role === "admin",
      status: row.status,
      balance: Number(row.balance),
      reservedBalance: reserved,
      availableBalance: Number(row.balance) - reserved,
      createdAt: row.created_at,
      approvedAt: row.approved_at || null,
      lastLoginAt: row.last_login_at || null
    };
  }

  function getUserById(id) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(Number(id));
  }

  function getUserByUsername(username) {
    return db.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(String(username || "").trim());
  }

  function listUsers() {
    return db.prepare("SELECT * FROM users ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, id ASC").all().map(publicUser);
  }

  function setUserStatus({ adminUserId, userId, status }) {
    if (!['pending', 'active', 'disabled'].includes(status)) throw problem("用户状态无效", 400, "INVALID_USER_STATUS");
    const target = getUserById(userId);
    if (!target) throw problem("用户不存在", 404, "USER_NOT_FOUND");
    if (target.role === "admin" && status !== "active") throw problem("不能停用主管理员", 400, "ADMIN_PROTECTED");
    const timestamp = nowIso();
    db.prepare("UPDATE users SET status = ?, approved_at = CASE WHEN ? = 'active' THEN COALESCE(approved_at, ?) ELSE approved_at END, updated_at = ? WHERE id = ?")
      .run(status, status, timestamp, timestamp, target.id);
    if (status !== "active") destroyUserSessions(target.id);
    audit(adminUserId, "user.status", target.id, JSON.stringify({ from: target.status, to: status }));
    return publicUser(getUserById(target.id));
  }

  function resetPassword({ adminUserId, userId, password }) {
    validatePassword(password);
    const target = getUserById(userId);
    if (!target) throw problem("用户不存在", 404, "USER_NOT_FOUND");
    const { hash, salt } = hashPassword(password);
    db.prepare("UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?")
      .run(hash, salt, nowIso(), target.id);
    destroyUserSessions(target.id);
    audit(adminUserId, "user.password_reset", target.id, "管理员重置密码");
  }

  function adjustBalance({ adminUserId, userId, delta, note = "管理员调整" }) {
    const amount = integer(delta);
    if (!amount) throw problem("积分调整必须为非零整数", 400, "INVALID_CREDIT_AMOUNT");
    return transaction(() => {
      const target = getUserById(userId);
      if (!target) throw problem("用户不存在", 404, "USER_NOT_FOUND");
      const reserved = activeReserved(target.id);
      const next = Number(target.balance) + amount;
      if (next < reserved) throw problem("调整后余额不能低于已冻结积分", 409, "BALANCE_RESERVED");
      const timestamp = nowIso();
      db.prepare("UPDATE users SET balance = ?, updated_at = ? WHERE id = ?").run(next, timestamp, target.id);
      db.prepare("INSERT INTO transactions (user_id, amount, type, description, balance_after, related_id, created_at) VALUES (?, ?, ?, ?, ?, '', ?)")
        .run(target.id, amount, amount > 0 ? "admin_credit" : "admin_debit", String(note || "管理员调整").slice(0, 300), next, timestamp);
      audit(adminUserId, amount > 0 ? "credit.add" : "credit.remove", target.id, JSON.stringify({ amount, note: String(note || "") }));
      return publicUser(getUserById(target.id));
    });
  }

  function reserveCredit({ id, userId, amount, description = "生成任务" }) {
    const cost = nonNegativeInteger(amount);
    if (!cost) return null;
    return transaction(() => {
      const existing = db.prepare("SELECT * FROM wallet_holds WHERE id = ?").get(id);
      if (existing) return existing;
      const user = getUserById(userId);
      if (!user || user.status !== "active") throw problem("账号不可用", 403, "ACCOUNT_UNAVAILABLE");
      if (Number(user.balance) - activeReserved(user.id) < cost) throw problem("可用积分不足", 402, "INSUFFICIENT_CREDITS");
      const timestamp = nowIso();
      db.prepare("INSERT INTO wallet_holds (id, user_id, amount, status, description, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?, ?)")
        .run(id, user.id, cost, String(description).slice(0, 300), timestamp, timestamp);
      return db.prepare("SELECT * FROM wallet_holds WHERE id = ?").get(id);
    });
  }

  function settleCredit({ id, route, model = "", status = "ok" }) {
    return transaction(() => {
      const hold = db.prepare("SELECT * FROM wallet_holds WHERE id = ?").get(id);
      if (!hold || hold.status !== "active") return false;
      const user = getUserById(hold.user_id);
      const next = Number(user.balance) - Number(hold.amount);
      const timestamp = nowIso();
      db.prepare("UPDATE users SET balance = ?, updated_at = ? WHERE id = ?").run(next, timestamp, user.id);
      db.prepare("UPDATE wallet_holds SET status = 'settled', updated_at = ? WHERE id = ?").run(timestamp, id);
      db.prepare("INSERT INTO transactions (user_id, amount, type, description, balance_after, related_id, created_at) VALUES (?, ?, 'spend', ?, ?, ?, ?)")
        .run(user.id, -Number(hold.amount), hold.description, next, id, timestamp);
      db.prepare("INSERT INTO api_usage (user_id, route, model, cost, status, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(user.id, route, String(model), Number(hold.amount), String(status), id, timestamp);
      return true;
    });
  }

  function releaseCredit({ id, route, model = "", status = "failed" }) {
    return transaction(() => {
      const hold = db.prepare("SELECT * FROM wallet_holds WHERE id = ?").get(id);
      if (!hold || hold.status !== "active") return false;
      const timestamp = nowIso();
      db.prepare("UPDATE wallet_holds SET status = 'released', updated_at = ? WHERE id = ?").run(timestamp, id);
      db.prepare("INSERT INTO api_usage (user_id, route, model, cost, status, related_id, created_at) VALUES (?, ?, ?, 0, ?, ?, ?)")
        .run(hold.user_id, route, String(model), String(status).slice(0, 600), id, timestamp);
      return true;
    });
  }

  function activeReserved(userId) {
    return Number(db.prepare("SELECT COALESCE(SUM(amount), 0) AS n FROM wallet_holds WHERE user_id = ? AND status = 'active'").get(userId).n);
  }

  function releaseActiveHoldsByPrefix(prefix, route, status = "error: app restarted") {
    const rows = db.prepare("SELECT id FROM wallet_holds WHERE status = 'active' AND id LIKE ?").all(`${String(prefix)}%`);
    for (const row of rows) releaseCredit({ id: row.id, route, status });
    return rows.length;
  }

  function listTransactions(userId, limit = 100) {
    return db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT ?").all(Number(userId), clampLimit(limit));
  }

  function listUsage(userId, limit = 100) {
    return db.prepare("SELECT * FROM api_usage WHERE user_id = ? ORDER BY id DESC LIMIT ?").all(Number(userId), clampLimit(limit));
  }

  function getSettings() {
    const row = db.prepare("SELECT * FROM team_settings WHERE id = 1").get();
    let costs = { ...DEFAULT_COSTS };
    try { costs = { ...costs, ...JSON.parse(row.costs_json) }; } catch {}
    for (const key of Object.keys(costs)) costs[key] = nonNegativeInteger(costs[key]);
    return { registrationEnabled: Boolean(row.registration_enabled), costs, updatedAt: row.updated_at };
  }

  function updateSettings({ adminUserId, registrationEnabled, costs }) {
    const current = getSettings();
    const nextCosts = { ...current.costs };
    if (costs && typeof costs === "object") {
      for (const key of Object.keys(DEFAULT_COSTS)) {
        if (costs[key] !== undefined) nextCosts[key] = Math.min(100000, nonNegativeInteger(costs[key]));
      }
    }
    const timestamp = nowIso();
    db.prepare("UPDATE team_settings SET registration_enabled = ?, costs_json = ?, updated_at = ? WHERE id = 1")
      .run(registrationEnabled === undefined ? Number(current.registrationEnabled) : Number(Boolean(registrationEnabled)), JSON.stringify(nextCosts), timestamp);
    audit(adminUserId, "settings.update", null, JSON.stringify({ registrationEnabled, costs: nextCosts }));
    return getSettings();
  }

  function costFor(mode) {
    return getSettings().costs[mode] ?? 0;
  }

  function audit(adminUserId, action, targetUserId, detail) {
    db.prepare("INSERT INTO admin_audit (admin_user_id, action, target_user_id, detail, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(adminUserId || null, String(action), targetUserId || null, String(detail || "").slice(0, 2000), nowIso());
  }

  function listAudit(limit = 100) {
    return db.prepare(`
      SELECT a.*, au.username AS admin_username, tu.username AS target_username
      FROM admin_audit a
      LEFT JOIN users au ON au.id = a.admin_user_id
      LEFT JOIN users tu ON tu.id = a.target_user_id
      ORDER BY a.id DESC LIMIT ?
    `).all(clampLimit(limit));
  }

  function saveJob(job) {
    const timestamp = job.updatedAt || nowIso();
    db.prepare(`
      INSERT INTO jobs (id, user_id, client_request_id, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
    `).run(job.id, job.userId, job.clientRequestId || "", JSON.stringify(job), job.createdAt || timestamp, timestamp);
  }

  function loadJobs() {
    return db.prepare("SELECT data_json FROM jobs ORDER BY created_at DESC").all().flatMap((row) => {
      try { return [JSON.parse(row.data_json)]; } catch { return []; }
    });
  }

  function deleteJobs({ userId, ids, allowAll = false }) {
    const clean = Array.from(new Set((Array.isArray(ids) ? ids : []).map(String)));
    if (!clean.length) return;
    const statement = allowAll
      ? db.prepare("DELETE FROM jobs WHERE id = ?")
      : db.prepare("DELETE FROM jobs WHERE id = ? AND user_id = ?");
    transaction(() => {
      for (const id of clean) allowAll ? statement.run(id) : statement.run(id, userId);
    });
  }

  function findJobByClientRequest(userId, clientRequestId) {
    if (!clientRequestId) return null;
    const row = db.prepare("SELECT data_json FROM jobs WHERE user_id = ? AND client_request_id = ?").get(userId, clientRequestId);
    if (!row) return null;
    try { return JSON.parse(row.data_json); } catch { return null; }
  }

  function overview() {
    return {
      users: Number(db.prepare("SELECT COUNT(*) AS n FROM users").get().n),
      pendingUsers: Number(db.prepare("SELECT COUNT(*) AS n FROM users WHERE status = 'pending'").get().n),
      activeUsers: Number(db.prepare("SELECT COUNT(*) AS n FROM users WHERE status = 'active'").get().n),
      jobs: Number(db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n),
      spentCredits: Math.abs(Number(db.prepare("SELECT COALESCE(SUM(amount), 0) AS n FROM transactions WHERE type = 'spend'").get().n))
    };
  }

  return {
    bootstrap,
    register,
    authenticate,
    createSession,
    lookupSession,
    destroySession,
    publicUser,
    getUserById,
    getUserByUsername,
    listUsers,
    setUserStatus,
    resetPassword,
    adjustBalance,
    reserveCredit,
    settleCredit,
    releaseCredit,
    releaseActiveHoldsByPrefix,
    listTransactions,
    listUsage,
    getSettings,
    updateSettings,
    costFor,
    recordAudit: audit,
    listAudit,
    saveJob,
    loadJobs,
    deleteJobs,
    findJobByClientRequest,
    overview,
    close: () => db.close()
  };
}

function validateUsername(value) {
  const username = String(value || "").trim();
  if (!/^[\p{L}\p{N}_.-]{3,32}$/u.test(username)) throw problem("用户名需为 3–32 位中文、字母、数字、点、横线或下划线", 400, "INVALID_USERNAME");
  return username;
}

function validatePassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) throw problem("密码长度需为 8–128 位", 400, "INVALID_PASSWORD");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") };
}

function verifyPassword(password, hash, salt) {
  try {
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function generatePassword() {
  return `${crypto.randomBytes(6).toString("base64url")}Aa9!`;
}

function nowIso() { return new Date().toISOString(); }
function integer(value) { const n = Number(value); return Number.isFinite(n) ? Math.round(n) : 0; }
function nonNegativeInteger(value) { return Math.max(0, integer(value)); }
function clampLimit(value) { return Math.max(1, Math.min(500, integer(value) || 100)); }
function problem(message, statusCode, code) { const error = new Error(message); error.statusCode = statusCode; error.code = code; return error; }

module.exports = { createTeamStore, DEFAULT_COSTS };
