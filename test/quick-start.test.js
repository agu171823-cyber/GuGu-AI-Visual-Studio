"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { probeExistingApp, positiveInteger } = require("../scripts/quick-start");

test("quick start recognizes an already-running Gugu server", async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://127.0.0.1:8797/api/health");
    assert.equal(options.headers.Accept, "application/json");
    return { ok: true, json: async () => ({ app: "GuGu AI Visual Studio", version: "2.9.3" }) };
  };
  assert.equal(await probeExistingApp("http://127.0.0.1:8797", fetchImpl), true);
});

test("quick start keeps recognizing the legacy app name during an upgrade", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ app: "Gugu Image Edit", version: "2.9.2" }) });
  assert.equal(await probeExistingApp("http://127.0.0.1:8797", fetchImpl), true);
});

test("quick start does not mistake another service for Gugu", async () => {
  assert.equal(await probeExistingApp("http://127.0.0.1:8797", async () => ({ ok: true, json: async () => ({ app: "Other" }) })), false);
  assert.equal(await probeExistingApp("http://127.0.0.1:8797", async () => { throw new Error("offline"); }), false);
});

test("quick start validates custom ports", () => {
  assert.equal(positiveInteger("9000", 8797), 9000);
  assert.equal(positiveInteger("0", 8797), 8797);
  assert.equal(positiveInteger("70000", 8797), 8797);
  assert.equal(positiveInteger("invalid", 8797), 8797);
});
