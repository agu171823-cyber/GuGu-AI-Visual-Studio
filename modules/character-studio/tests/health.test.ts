import { describe, expect, it } from "vitest";
import { createApp } from "../server/app";

describe("health", () => {
  it("identifies the local character asset app", async () => {
    const response = await createApp().request("/api/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      app: "character-model-card-studio",
    });
  });
});
