import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "../server/app";

async function readProjectSources(roots: string[]): Promise<string> {
  const paths = (await Promise.all(roots.map(collectTypeScriptFiles))).flat();
  return (await Promise.all(paths.map((path) => readFile(path, "utf8")))).join("\n");
}

async function collectTypeScriptFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = join(root, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(target);
    return /\.tsx?$/.test(entry.name) ? [target] : [];
  }));
  return nested.flat();
}

describe("packaging security boundaries", () => {
  it("does not persist secrets or uploaded reference images", async () => {
    const sourceFiles = await readProjectSources(["client", "server", "shared"]);
    expect(sourceFiles).not.toMatch(/(?:localStorage|sessionStorage)\.setItem\([^)]*apiKey/i);
    expect(sourceFiles).not.toMatch(/writeFile[^\n]*(reference|original|upload)/i);
    expect(sourceFiles).not.toMatch(/console\.(log|error)[^\n]*(apiKey|authorization)/i);
  });

  it("keeps local projects out of version control and the launcher ASCII-only", async () => {
    const ignore = await readFile("../../.gitignore", "utf8");
    expect(ignore).toMatch(/^data\/$/m);
    const launcher = await readFile("../../quick-start.cmd");
    expect([...launcher].every(byte => byte <= 0x7f)).toBe(true);
    const packaging = await readFile("../../scripts/build-portable.ps1", "utf8");
    expect(packaging).not.toMatch(/@\([^)]*'data'/);
  });

  it("documents consent, key privacy, the 147 dependency, and asset provenance", async () => {
    const readme = await readFile("README.md", "utf8");
    expect(readme).toMatch(/成年人/);
    expect(readme).toMatch(/授权/);
    expect(readme).toMatch(/API Key/);
    expect(readme).toMatch(/147AI|147/);
    expect(readme).toMatch(/来源|provenance/i);
    expect(readme).toMatch(/许可|license/i);
  });

  it("exposes the one-command local launcher", async () => {
    const packageJson = JSON.parse(await readFile("../../package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(packageJson.scripts?.start).toBe("node server/server.js");
  });

  it("returns the same JSON 404 for unknown POST API routes with and without static files", async () => {
    const expected = { error: "API 路由不存在" };
    const apiOnlyResponse = await createApp().request("/api/not-here", { method: "POST" });
    expect(apiOnlyResponse.status).toBe(404);
    expect(apiOnlyResponse.headers.get("content-type")).toContain("application/json");
    expect(await apiOnlyResponse.json()).toEqual(expected);

    const staticRoot = await mkdtemp(join(tmpdir(), "character-static-"));
    try {
      await writeFile(join(staticRoot, "index.html"), "<!doctype html><title>character smoke</title>");
      const app = createApp({ staticRoot });

      const pageResponse = await app.request("/a/local/client/route");
      expect(pageResponse.status).toBe(200);
      expect(await pageResponse.text()).toContain("character smoke");

      const apiResponse = await app.request("/api/not-here", { method: "POST" });
      expect(apiResponse.status).toBe(404);
      expect(apiResponse.headers.get("content-type")).toContain("application/json");
      expect(await apiResponse.json()).toEqual(expected);
    } finally {
      await rm(staticRoot, { recursive: true, force: true });
    }
  });

  it("rejects cross-site mutations and oversized bodies before route parsing", async () => {
    const app = createApp();
    const crossSite = await app.request("/api/validate-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://attacker.example",
        "Sec-Fetch-Site": "cross-site",
      },
      body: JSON.stringify({
        apiKey: "sk-fake",
        baseUrl: "https://147ai.com/v1",
        model: "gpt-image-2",
      }),
    });
    expect(crossSite.status).toBe(403);

    const oversized = await app.request("/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: `sk-${"x".repeat(20_000)}`,
        baseUrl: "https://147ai.com/v1",
        model: "gpt-image-2",
      }),
    });
    expect(oversized.status).toBe(413);
  });
});
