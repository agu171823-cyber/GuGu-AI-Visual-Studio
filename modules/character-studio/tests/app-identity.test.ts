import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createApp } from "../server/app";

describe("character model card app identity", () => {
  it("uses the independent app name and health identity", async () => {
    const response = await createApp().request("/api/health");
    expect(await response.json()).toEqual({
      ok: true,
      app: "character-model-card-studio",
    });
  });

  it("uses registered ports and ignores local projects", async () => {
    const server = await readFile("../../server/server.js", "utf8");
    const ignore = await readFile("../../.gitignore", "utf8");
    expect(server).toContain('8797');
    expect(server).toContain('characterServiceFor(user).listener');
    expect(ignore).toContain('data/');
  });
});
