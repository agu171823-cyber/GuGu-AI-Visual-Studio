import { describe, expect, it } from "vitest";
import {
  CANONICAL_ROLES,
  STRESS_TEST_ROLES,
} from "../shared/templates";
import {
  PNG_BASE64,
  createApiTestFixture,
  seedLockedProject,
  seedApprovedAsset,
  validGenerateForm,
} from "./helpers/server-fixture";

describe("character project APIs", () => {
  it("creates and reads a project without accepting secret fields", async () => {
    const { app } = await createApiTestFixture();
    const response = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "realistic-virtual-character",
        title: "Lin",
        displayName: "Lin",
      }),
    });
    expect(response.status).toBe(201);
    const project = await response.json() as { id: string; characterTag: string };
    expect(project.id).toMatch(/^project-/);
    expect(project.characterTag).toBe("@lin");

    const rejected = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "human-model-card",
        title: "Bad",
        displayName: "Bad",
        apiKey: "sk-must-not-persist",
      }),
    });
    expect(rejected.status).toBe(400);
    expect(await rejected.text()).not.toContain("sk-must-not-persist");
  });

  it("rejects generation without both rights gates", async () => {
    const { app, project } = await createApiTestFixture();
    const form = validGenerateForm(project.id);
    form.set("rightsConsent", "false");
    form.append("image", new File([Buffer.from(PNG_BASE64, "base64")], "adult.png", { type: "image/png" }));
    form.append("imageRole", "face-front");

    const response = await app.request("/api/generate", {
      method: "POST",
      body: form,
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "必须确认成年人和使用权" });
  });

  it("keeps approved anchors and parent assets in compiled priority order", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    const face = await seedApprovedAsset(registry, project, "face-front");
    const body = await seedApprovedAsset(registry, project, "body-front");
    await seedLockedProject(registry, project);
    const state = await seedApprovedAsset(registry, project, "wardrobe-state");
    const form = validGenerateForm(project.id, {
      referenceAssetIds: [state.id, body.id, face.id],
    });
    form.set("parentAssetId", state.id);
    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(200);
    expect(providerCalls[0].images.map((image) => image.name)).toEqual([
      "face-front.png",
      "body-front.png",
      "wardrobe-state.png",
    ]);
    const payload = await response.json() as Record<string, unknown>;
    expect(payload).toHaveProperty("recipeDraft");
    expect(payload).toHaveProperty("promptPreview");
    expect(payload).not.toHaveProperty("apiKey");
  });

  it("forces expression generation to the square portrait contract", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    const locked = await seedLockedProject(registry, project);
    const face = locked.assets.find((asset) => asset.role === "face-front")!;
    const body = locked.assets.find((asset) => asset.role === "body-front")!;
    const half = locked.assets.find((asset) => asset.role === "half-neutral")!;
    const form = validGenerateForm(project.id, {
      referenceAssetIds: [half.id, face.id, body.id],
    });
    form.set("assetRole", "expression");
    form.set("parentAssetId", half.id);
    form.set("size", "1024x1536");
    form.set("changeSet", JSON.stringify({
      category: "expression",
      instruction: "轻微微笑",
      sourceStateId: "base",
      targetStateId: "expression-slight-smile",
    }));

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(200);
    expect(providerCalls[0].size).toBe("1024x1024");
    expect(await response.json()).toMatchObject({
      size: "1024x1024",
      recipeDraft: { size: "1024x1024" },
    });
  });

  it("keeps legacy face-parent expression retries compatible with the new contract", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    const locked = await seedLockedProject(registry, project);
    const face = locked.assets.find((asset) => asset.role === "face-front")!;
    const body = locked.assets.find((asset) => asset.role === "body-front")!;
    const form = validGenerateForm(project.id, { referenceAssetIds: [face.id, body.id] });
    form.set("assetRole", "expression");
    form.set("parentAssetId", face.id);
    form.set("changeSet", JSON.stringify({
      category: "expression",
      instruction: "专注表情",
      sourceStateId: "base",
      targetStateId: "expression-failed-legacy",
    }));

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(200);
    expect(providerCalls[0].size).toBe("1024x1024");
    expect(providerCalls[0].images.map((image) => image.name)).toEqual([
      "face-front.png",
      "body-front.png",
    ]);
  });

  it("requires the accepted face anchor before generating body-front", async () => {
    const { app, project, providerCalls } = await createApiTestFixture();
    const form = validGenerateForm(project.id);
    form.set("assetRole", "body-front");
    form.set("changeSet", JSON.stringify({
      category: "identity",
      instruction: "建立正面全身锚点",
      sourceStateId: "base",
      targetStateId: "base",
    }));
    form.append(
      "image",
      new File([Buffer.from(PNG_BASE64, "base64")], "body.png", { type: "image/png" }),
    );
    form.append("imageRole", "body-front");

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(400);
    expect(await response.text()).toMatch(/face-front|正脸/);
    expect(providerCalls).toHaveLength(0);
  });

  it("requires both accepted anchors before generating later canonical views", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    const face = await seedApprovedAsset(registry, project, "face-front");
    const form = validGenerateForm(project.id, { referenceAssetIds: [face.id] });
    form.set("assetRole", "body-side");
    form.set("changeSet", JSON.stringify({
      category: "identity",
      instruction: "建立侧面全身视图",
      sourceStateId: "base",
      targetStateId: "base",
    }));

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(400);
    expect(await response.text()).toMatch(/body-front|正面全身/);
    expect(providerCalls).toHaveLength(0);
  });

  it("rejects old-version anchors for new-version canonical generation and acceptance", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    await seedLockedProject(registry, project);
    const versioned = await registry.createIdentityVersion(project.id);
    const oldFace = versioned.assets.find((asset) =>
      asset.versionId === "v1" && asset.role === "face-front")!;
    const changeSet = {
      category: "identity" as const,
      instruction: "建立 v2 正面全身锚点",
      sourceStateId: "base",
      targetStateId: "base",
    };
    const form = validGenerateForm(project.id, { referenceAssetIds: [oldFace.id] });
    form.set("versionId", "v2");
    form.set("assetRole", "body-front");
    form.set("changeSet", JSON.stringify(changeSet));

    const generated = await app.request("/api/generate", { method: "POST", body: form });

    expect(generated.status).toBe(400);
    expect(await generated.text()).toMatch(/同版本|当前版本/);
    expect(providerCalls).toHaveLength(0);

    const accepted = await app.request(`/api/projects/${project.id}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageB64: PNG_BASE64,
        versionId: "v2",
        assetRole: "body-front",
        stateId: "base",
        changeSet,
        recipe: {
          compilerVersion: "1.0.0",
          templateId: "body-front-v1",
          provider: "147",
          model: "gpt-image-2",
          size: "1024x1536",
          quality: "medium",
          referenceAssetIds: [oldFace.id],
          changeSet,
        },
      }),
    });
    expect(accepted.status).toBe(400);
    expect(await accepted.text()).toMatch(/同版本|当前版本/);
  });

  it("allows a new face anchor to inherit one previous-version face source", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    await seedLockedProject(registry, project);
    const versioned = await registry.createIdentityVersion(project.id);
    const oldFace = versioned.assets.find((asset) =>
      asset.versionId === "v1" && asset.role === "face-front")!;
    const form = validGenerateForm(project.id, { referenceAssetIds: [oldFace.id] });
    form.set("versionId", "v2");
    form.set("assetRole", "face-front");
    form.set("changeSet", JSON.stringify({
      category: "identity",
      instruction: "建立 v2 正脸身份锚点",
      sourceStateId: "source",
      targetStateId: "base",
    }));

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(200);
    expect(providerCalls).toHaveLength(1);
    expect(providerCalls[0].images.map((image) => image.name)).toEqual(["face-front.png"]);
  });

  it("rejects face inheritance that skips the direct predecessor version", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    await seedLockedProject(registry, project, "v1");
    await registry.createIdentityVersion(project.id);
    await seedLockedProject(registry, project, "v2");
    const versioned = await registry.createIdentityVersion(project.id);
    const v1Face = versioned.assets.find((asset) =>
      asset.versionId === "v1" && asset.role === "face-front")!;
    const changeSet = {
      category: "identity" as const,
      instruction: "建立 v3 正脸身份锚点",
      sourceStateId: "source",
      targetStateId: "base",
    };
    const form = validGenerateForm(project.id, { referenceAssetIds: [v1Face.id] });
    form.set("versionId", "v3");
    form.set("assetRole", "face-front");
    form.set("changeSet", JSON.stringify(changeSet));

    const generated = await app.request("/api/generate", { method: "POST", body: form });

    expect(generated.status).toBe(400);
    expect(await generated.text()).toMatch(/直接上一版本|v2/);
    expect(providerCalls).toHaveLength(0);

    const accepted = await app.request(`/api/projects/${project.id}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageB64: PNG_BASE64,
        versionId: "v3",
        assetRole: "face-front",
        stateId: "base",
        changeSet,
        recipe: {
          compilerVersion: "1.0.0",
          templateId: "face-front-v1",
          provider: "147",
          model: "gpt-image-2",
          size: "1024x1536",
          quality: "medium",
          referenceAssetIds: [v1Face.id],
          changeSet,
        },
      }),
    });
    expect(accepted.status).toBe(400);
    expect(await accepted.text()).toMatch(/直接上一版本|v2/);
  });

  it("accepts one body and one wardrobe session reference for body-front", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    const face = await seedApprovedAsset(registry, project, "face-front");
    const form = validGenerateForm(project.id, { referenceAssetIds: [face.id] });
    form.set("assetRole", "body-front");
    form.set("baseWardrobeBrief", "米白色西装、直筒长裤、黑色低跟鞋");
    form.set("changeSet", JSON.stringify({
      category: "identity",
      instruction: "建立正面全身锚点",
      sourceStateId: "base",
      targetStateId: "base",
    }));
    form.append("image", new File([Buffer.from(PNG_BASE64, "base64")], "body.png", { type: "image/png" }));
    form.append("imageRole", "body-side");
    form.append("image", new File([Buffer.from(PNG_BASE64, "base64")], "wardrobe.png", { type: "image/png" }));
    form.append("imageRole", "wardrobe-state");

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(200);
    expect(providerCalls[0].images.map((image) => image.name)).toEqual([
      "face-front.png",
      "body.png",
      "wardrobe.png",
    ]);
    expect(providerCalls[0].prompt).toContain("米白色西装、直筒长裤、黑色低跟鞋");
  });

  it("rejects competing session references for canonical body generation", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    const face = await seedApprovedAsset(registry, project, "face-front");
    const form = validGenerateForm(project.id, { referenceAssetIds: [face.id] });
    form.set("assetRole", "body-front");
    form.set("changeSet", JSON.stringify({
      category: "identity",
      instruction: "建立正面全身锚点",
      sourceStateId: "base",
      targetStateId: "base",
    }));
    form.append("image", new File([Buffer.from(PNG_BASE64, "base64")], "expression.png", { type: "image/png" }));
    form.append("imageRole", "expression");

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(400);
    expect(await response.text()).toMatch(/会话参考|服装|身体/);
    expect(providerCalls).toHaveLength(0);
  });

  it("requires face and body anchors for body-locked derived roles", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    await seedLockedProject(registry, project);
    const locked = await registry.readProject(project.id);
    const face = locked.assets.find((asset) => asset.role === "face-front")!;
    const form = validGenerateForm(project.id, { referenceAssetIds: [face.id] });
    form.set("assetRole", "model-card-natural");
    form.set("parentAssetId", face.id);
    form.set("changeSet", JSON.stringify({
      category: "camera",
      instruction: "自然正面肖像",
      sourceStateId: "base",
      targetStateId: "model-card-natural",
    }));

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(400);
    expect(await response.text()).toMatch(/face-front.*body-front|身材.*锚点/);
    expect(providerCalls).toHaveLength(0);
  });

  it("rejects the old six-image stress payload and accepts only face plus body anchors", async () => {
    const { app, project, registry, providerCalls } = await createApiTestFixture();
    for (const role of ["face-front", "body-front", "face-three-quarter", "body-side", "body-back", "half-neutral"] as const) {
      await seedApprovedAsset(registry, project, role);
    }
    const current = await registry.readProject(project.id);
    const canonical = current.assets.filter((asset) => CANONICAL_ROLES.includes(asset.role as typeof CANONICAL_ROLES[number]));
    const face = canonical.find((asset) => asset.role === "face-front")!;
    const body = canonical.find((asset) => asset.role === "body-front")!;
    const stressChange = {
      category: "lighting",
      instruction: "仅改变自然主光方向",
      sourceStateId: "base",
      targetStateId: "stress-lighting",
    };

    const oldForm = validGenerateForm(project.id, { referenceAssetIds: canonical.map((asset) => asset.id) });
    oldForm.set("assetRole", "stress-lighting");
    oldForm.set("parentAssetId", face.id);
    oldForm.set("changeSet", JSON.stringify(stressChange));
    const rejected = await app.request("/api/generate", { method: "POST", body: oldForm });

    expect(rejected.status).toBe(400);
    expect(await rejected.text()).toMatch(/face-front.*body-front|两个锚点/);
    expect(providerCalls).toHaveLength(0);

    const exactForm = validGenerateForm(project.id, { referenceAssetIds: [face.id, body.id] });
    exactForm.set("assetRole", "stress-lighting");
    exactForm.set("parentAssetId", face.id);
    exactForm.set("changeSet", JSON.stringify(stressChange));
    const accepted = await app.request("/api/generate", { method: "POST", body: exactForm });

    expect(accepted.status).toBe(200);
    expect(providerCalls[0].images.map((image) => image.name)).toEqual([
      "face-front.png",
      "body-front.png",
    ]);
    expect(providerCalls[0].prompt).toContain("第 1 张：face-front，用于面部身份");
    expect(providerCalls[0].prompt).toContain("第 2 张：body-front，用于体型与基础服装");
  });

  it("accepts a session-only wardrobe brief only for body-front", async () => {
    const { app, project, providerCalls } = await createApiTestFixture();
    const form = validGenerateForm(project.id);
    form.set("assetRole", "face-front");
    form.set("baseWardrobeBrief", "米白色西装");
    form.set("changeSet", JSON.stringify({
      category: "identity",
      instruction: "建立标准正脸",
      sourceStateId: "source",
      targetStateId: "base",
    }));
    form.append(
      "image",
      new File([Buffer.from(PNG_BASE64, "base64")], "adult.png", { type: "image/png" }),
    );
    form.append("imageRole", "face-front");

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(400);
    expect(await response.text()).toMatch(/基础服装|body-front/);
    expect(providerCalls).toHaveLength(0);
  });

  it("carries the selected parent asset into a derived generation recipe", async () => {
    const { app, project, registry } = await createApiTestFixture();
    await seedLockedProject(registry, project);
    const locked = await registry.readProject(project.id);
    const parent = locked.assets.find((asset) => asset.role === "body-front")!;
    const face = locked.assets.find((asset) => asset.role === "face-front")!;
    const form = validGenerateForm(project.id, { referenceAssetIds: [parent.id, face.id] });
    form.set("assetRole", "wardrobe-state");
    form.set("parentAssetId", parent.id);
    form.set("changeSet", JSON.stringify({
      category: "wardrobe",
      instruction: "米白色西装",
      sourceStateId: "base",
      targetStateId: "wardrobe-ivory",
    }));

    const response = await app.request("/api/generate", { method: "POST", body: form });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      recipeDraft: { parentAssetId: parent.id },
    });
  });

  it("requires a reference and never saves an unapproved generation", async () => {
    const { app, project, registry } = await createApiTestFixture();
    const response = await app.request("/api/generate", {
      method: "POST",
      body: validGenerateForm(project.id),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "至少需要一张会话参考图或一个已批准资产" });
    expect((await registry.readProject(project.id)).assets).toHaveLength(0);
  });

  it("accepts the exact recipe draft returned by identity generation", async () => {
    const { app, project, registry } = await createApiTestFixture();
    const form = validGenerateForm(project.id);
    const changeSet = {
      category: "identity",
      instruction: "建立标准正脸",
      sourceStateId: "source",
      targetStateId: "base",
    };
    form.set("assetRole", "face-front");
    form.set("changeSet", JSON.stringify(changeSet));
    form.append(
      "image",
      new File([Buffer.from(PNG_BASE64, "base64")], "adult.png", { type: "image/png" }),
    );
    form.append("imageRole", "face-front");

    const generated = await app.request("/api/generate", { method: "POST", body: form });
    expect(generated.status).toBe(200);
    const result = await generated.json() as { imageB64: string; recipeDraft: Record<string, unknown> };

    const accepted = await app.request(`/api/projects/${project.id}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageB64: result.imageB64,
        versionId: "v1",
        assetRole: "face-front",
        stateId: "base",
        changeSet,
        recipe: result.recipeDraft,
      }),
    });

    expect(accepted.status).toBe(201);
    expect((await registry.readProject(project.id)).assets).toHaveLength(1);
  });

  it("persists only an explicitly approved generated asset", async () => {
    const { app, project, registry } = await createApiTestFixture();
    const response = await app.request(`/api/projects/${project.id}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageB64: PNG_BASE64,
        versionId: "v1",
        assetRole: "face-front",
        stateId: "base",
        changeSet: {
          category: "identity",
          instruction: "建立标准正脸",
          sourceStateId: "source",
          targetStateId: "base",
        },
        recipe: {
          compilerVersion: "1.0.0",
          templateId: "face-front-v1",
          provider: "147",
          model: "gpt-image-2",
          size: "1024x1536",
          quality: "medium",
          referenceAssetIds: [],
        },
      }),
    });
    expect(response.status).toBe(201);
    expect((await registry.readProject(project.id)).assets).toHaveLength(1);

    const rejected = await app.request(`/api/projects/${project.id}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageB64: PNG_BASE64, promptPreview: "do not persist" }),
    });
    expect(rejected.status).toBe(400);
  });

  it("rejects forged whole-project snapshots and incomplete lock commands", async () => {
    const { app, project } = await createApiTestFixture();
    const forged = structuredClone(project);
    forged.versions[0].status = "locked";
    forged.versions[0].lockedAt = new Date().toISOString();
    const response = await app.request(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forged),
    });
    expect(response.status).toBe(404);

    const rejected = await app.request(`/api/projects/${project.id}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock-version", versionId: "v1" }),
    });
    expect(rejected.status).toBe(400);
    expect(await rejected.text()).toMatch(/不能锁定|未全部通过/);
  });

  it("locks only through server-reviewed stress assets", async () => {
    const { app, project, registry } = await createApiTestFixture();
    for (const role of ["face-front", "body-front", "face-three-quarter", "body-side", "body-back", "half-neutral"] as const) {
      await seedApprovedAsset(registry, project, role);
    }
    for (const role of STRESS_TEST_ROLES) {
      const asset = await seedApprovedAsset(registry, project, role);
      const review = await app.request(`/api/projects/${project.id}/transitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review-stress",
          versionId: "v1",
          role,
          assetId: asset.id,
          passed: true,
        }),
      });
      expect(review.status).toBe(200);
    }

    const locked = await app.request(`/api/projects/${project.id}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock-version", versionId: "v1" }),
    });
    expect(locked.status).toBe(200);
    expect(await locked.json()).toMatchObject({
      versions: [{ id: "v1", status: "locked" }],
    });
  });

  it("creates identity versions through a server-owned transition", async () => {
    const { app, project, registry } = await createApiTestFixture();
    await seedLockedProject(registry, project);
    const response = await app.request(`/api/projects/${project.id}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-version" }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      currentVersionId: "v2",
      versions: [
        { id: "v1", status: "locked" },
        { id: "v2", status: "draft", createdFromVersionId: "v1" },
      ],
    });
  });
});
