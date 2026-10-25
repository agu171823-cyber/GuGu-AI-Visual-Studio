"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createTeamStore } = require("../server/team-db");

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "gugu-team-db-"));
  const store = createTeamStore({ dataDir: directory, adminPassword: "Admin-test-123!" });
  return { store, close() { store.close(); fs.rmSync(directory, { recursive: true, force: true }); } };
}

test("team store bootstraps one active admin and pending registrations", (t) => {
  const app = fixture();
  t.after(() => app.close());
  const admin = app.store.getUserByUsername("admin");
  assert.equal(admin.role, "admin");
  assert.equal(admin.status, "active");

  const pending = app.store.register({ username: "同事_01", password: "Member-test-123!" });
  assert.equal(pending.status, "pending");
  assert.equal(pending.availableBalance, 0);
  assert.equal(app.store.authenticate("同事_01", "Member-test-123!").id, pending.id);
});

test("admin approval, sessions, credit adjustment and revocation are consistent", (t) => {
  const app = fixture();
  t.after(() => app.close());
  const admin = app.store.getUserByUsername("admin");
  const pending = app.store.register({ username: "member01", password: "Member-test-123!" });
  const active = app.store.setUserStatus({ adminUserId: admin.id, userId: pending.id, status: "active" });
  assert.equal(active.status, "active");
  assert.equal(app.store.adjustBalance({ adminUserId: admin.id, userId: pending.id, delta: 100, note: "测试充值" }).balance, 100);

  const session = app.store.createSession(pending.id, 60);
  assert.equal(app.store.lookupSession(session.token).username, "member01");
  app.store.setUserStatus({ adminUserId: admin.id, userId: pending.id, status: "disabled" });
  assert.equal(app.store.lookupSession(session.token), null);
});

test("credit holds prevent overspending, settle once, and release failures", (t) => {
  const app = fixture();
  t.after(() => app.close());
  const admin = app.store.getUserByUsername("admin");
  const member = app.store.register({ username: "member02", password: "Member-test-123!" });
  app.store.setUserStatus({ adminUserId: admin.id, userId: member.id, status: "active" });
  app.store.adjustBalance({ adminUserId: admin.id, userId: member.id, delta: 30, note: "测试充值" });

  app.store.reserveCredit({ id: "job:one", userId: member.id, amount: 20, description: "图片生成" });
  assert.equal(app.store.publicUser(app.store.getUserById(member.id)).availableBalance, 10);
  assert.throws(() => app.store.reserveCredit({ id: "job:two", userId: member.id, amount: 15 }), /积分不足/);
  assert.equal(app.store.settleCredit({ id: "job:one", route: "jobs/imageGenerate", model: "fixture" }), true);
  assert.equal(app.store.settleCredit({ id: "job:one", route: "jobs/imageGenerate", model: "fixture" }), false);
  assert.equal(app.store.publicUser(app.store.getUserById(member.id)).balance, 10);

  app.store.reserveCredit({ id: "job:three", userId: member.id, amount: 10, description: "失败任务" });
  assert.equal(app.store.releaseCredit({ id: "job:three", route: "jobs/precise", status: "failed" }), true);
  assert.equal(app.store.publicUser(app.store.getUserById(member.id)).availableBalance, 10);
  assert.equal(app.store.listUsage(member.id).length, 2);
});

test("jobs are persisted with per-user idempotency", (t) => {
  const app = fixture();
  t.after(() => app.close());
  const admin = app.store.getUserByUsername("admin");
  const job = { id: "job-a", userId: admin.id, clientRequestId: "request-a", status: "queued", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  app.store.saveJob(job);
  assert.equal(app.store.loadJobs()[0].id, "job-a");
  assert.equal(app.store.findJobByClientRequest(admin.id, "request-a").id, "job-a");
  app.store.deleteJobs({ userId: admin.id, ids: ["job-a"] });
  assert.equal(app.store.loadJobs().length, 0);
});
