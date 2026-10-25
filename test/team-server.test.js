"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const { spawn } = require("child_process");

test("LAN team server enforces registration approval, roles, and authenticated APIs", async (t) => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "gugu-team-server-"));
  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      PUBLIC_ORIGIN: origin,
      ADMIN_PASSWORD: "Admin-test-123!",
      GUGU_DATA_DIR: path.join(temporary, "data"),
      GUGU_CONFIG_DIR: path.join(temporary, "config"),
      GUGU_OUTPUT_DIR: path.join(temporary, "output")
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", (chunk) => { logs += chunk; });
  child.stderr.on("data", (chunk) => { logs += chunk; });
  t.after(async () => {
    if (!child.killed) child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve)).catch(() => {});
    fs.rmSync(temporary, { recursive: true, force: true });
  });
  await waitForHealth(origin, child, () => logs);

  assert.equal((await fetch(`${origin}/api/health`)).status, 200);
  assert.equal((await fetch(`${origin}/api/status`)).status, 401);

  const adminLogin = await jsonRequest(origin, "/api/auth/login", { username: "admin", password: "Admin-test-123!" });
  assert.equal(adminLogin.response.status, 200);
  const adminCookie = cookieFrom(adminLogin.response);
  assert.ok(adminCookie.includes("gugu_team_session="));

  const registration = await jsonRequest(origin, "/api/auth/register", { username: "team_member", password: "Member-test-123!" });
  assert.equal(registration.response.status, 201);
  assert.equal(registration.body.user.status, "pending");
  assert.equal((await jsonRequest(origin, "/api/auth/login", { username: "team_member", password: "Member-test-123!" })).response.status, 403);

  const users = await authedJson(origin, "/api/admin/users", adminCookie);
  const member = users.body.users.find((item) => item.username === "team_member");
  assert.ok(member);
  const content = await authedJson(origin, `/api/admin/users/${member.id}/content`, adminCookie);
  assert.equal(content.response.status, 200);
  assert.deepEqual(content.body.content.projects, []);
  assert.deepEqual(content.body.content.portraits, []);
  assert.deepEqual(content.body.content.storage, { files: 0, bytes: 0 });
  assert.equal((await authedJson(origin, `/api/admin/users/${member.id}/status`, adminCookie, "POST", { status: "active" })).response.status, 200);
  assert.equal((await authedJson(origin, "/api/admin/credit", adminCookie, "POST", { userId: member.id, amount: 50, note: "测试" })).body.user.availableBalance, 50);

  const memberLogin = await jsonRequest(origin, "/api/auth/login", { username: "team_member", password: "Member-test-123!" });
  const memberCookie = cookieFrom(memberLogin.response);
  assert.equal(memberLogin.response.status, 200);
  assert.equal((await authedJson(origin, "/api/status", memberCookie)).response.status, 200);
  assert.equal((await authedJson(origin, "/api/admin/overview", memberCookie)).response.status, 403);
  assert.equal((await authedJson(origin, "/api/settings", memberCookie, "POST", { providers: {} })).response.status, 403);
  assert.deepEqual((await authedJson(origin, "/api/history", memberCookie)).body.items, []);

  const rejectedOrigin = await fetch(`${origin}/api/auth/logout`, { method: "POST", headers: { Cookie: memberCookie, Origin: "http://evil.invalid" } });
  assert.equal(rejectedOrigin.status, 403);
});

async function jsonRequest(origin, route, body) {
  const response = await fetch(`${origin}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body)
  });
  return { response, body: await response.json() };
}

async function authedJson(origin, route, cookie, method = "GET", body) {
  const response = await fetch(`${origin}${route}`, {
    method,
    headers: { Accept: "application/json", Cookie: cookie, Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { response, body: await response.json() };
}

function cookieFrom(response) {
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHealth(origin, child, logs) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server exited early: ${logs()}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`server did not start: ${logs()}`);
}
