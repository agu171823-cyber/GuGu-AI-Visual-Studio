import { describe, expect, it } from "vitest";
import {
  assertSingleVariableChange,
  compileIdentityPrompt,
  orderReferenceSources,
} from "../server/prompt/identity-compiler";

describe("identity-first prompt compiler", () => {
  it("defines the slight-side asset as a waist-up portrait rather than a face close-up", () => {
    const prompt = compileIdentityPrompt({
      mode: "human-model-card",
      characterTag: "@mina-v1",
      assetRole: "face-three-quarter",
      immutableDescriptor: { visibleNotes: [] },
      referenceRoles: ["face-front", "body-front"],
      changeSet: { category: "identity", instruction: "建立微侧半身", sourceStateId: "base", targetStateId: "base" },
    });
    expect(prompt).toContain("微侧半身");
    expect(prompt).toContain("与中性半身相同的 2:3 竖幅、腰部以上景别");
    expect(prompt).toContain("不生成脸部特写或全身远景");
  });
  it.each([
    "face-front",
    "face-three-quarter",
    "body-front",
    "body-side",
    "body-back",
    "half-neutral",
    "stress-lighting",
    "stress-angle",
    "stress-action",
    "model-card-natural",
    "model-card-half",
    "model-card-full",
    "model-card-side-action",
  ] as const)("uses a positive adult studio contract for fixed role %s", (role) => {
    const prompt = compileIdentityPrompt({
      mode: "realistic-virtual-character",
      characterTag: "@lin-v1",
      assetRole: role,
      immutableDescriptor: { visibleNotes: ["成年女性角色，黑色长发"] },
      parentStateId: "base",
      changeSet: {
        category: role === "stress-lighting" ? "lighting"
          : role === "stress-angle" ? "camera"
            : role === "stress-action" || role === "model-card-side-action" ? "action"
              : "identity",
        instruction: `建立 ${role} 固定角色资产`,
        sourceStateId: "base",
        targetStateId: role,
      },
    });

    expect(prompt).toContain("明确成年");
    expect(prompt).toContain("完整着装");
    expect(prompt).toContain("单一变化");
    expect(prompt).not.toMatch(/色情|骚扰|虚假新闻|失败验收/);
  });

  it("describes ordered face and body references plus immutable stress clothing", () => {
    const prompt = compileIdentityPrompt({
      mode: "human-model-card",
      characterTag: "@mina-v1",
      assetRole: "stress-action",
      immutableDescriptor: { visibleNotes: [] },
      parentStateId: "base",
      referenceRoles: ["face-front", "body-front"],
      changeSet: {
        category: "action",
        instruction: "执行动作一致性压力测试",
        sourceStateId: "base",
        targetStateId: "stress-action",
      },
    });

    expect(prompt).toContain("第 1 张：face-front，用于面部身份");
    expect(prompt).toContain("第 2 张：body-front，用于体型与基础服装");
    expect(prompt).toContain("头身比");
    expect(prompt).toContain("腰线");
    expect(prompt).toContain("鞋履");
    expect(prompt).toContain("只改变关节角度和重心");
  });

  it("includes a sanitized session-only base wardrobe brief for body-front", () => {
    const prompt = compileIdentityPrompt({
      mode: "human-model-card",
      characterTag: "@mina-v1",
      assetRole: "body-front",
      immutableDescriptor: { visibleNotes: [] },
      parentStateId: "base",
      referenceRoles: ["face-front", "wardrobe-state"],
      baseWardrobeBrief: "米白色西装\u0000、直筒长裤、黑色低跟鞋",
      changeSet: {
        category: "identity",
        instruction: "建立正面全身锚点",
        sourceStateId: "base",
        targetStateId: "base",
      },
    });

    expect(prompt).toContain("基础服装说明");
    expect(prompt).toContain("米白色西装 、直筒长裤、黑色低跟鞋");
    expect(prompt).not.toContain("\u0000");
  });

  it("uses a full-coverage neutral outfit when body-front has no wardrobe input", () => {
    const prompt = compileIdentityPrompt({
      mode: "realistic-virtual-character",
      characterTag: "@lin-v1",
      assetRole: "body-front",
      immutableDescriptor: { visibleNotes: [] },
      parentStateId: "base",
      referenceRoles: ["face-front"],
      changeSet: {
        category: "identity",
        instruction: "建立正面全身锚点",
        sourceStateId: "base",
        targetStateId: "base",
      },
    });

    expect(prompt).toContain("正脸参考只决定面部身份，不沿用其中的服装");
    expect(prompt).toContain("圆领长袖上衣");
    expect(prompt).toContain("直筒长裤");
    expect(prompt).toContain("包脚鞋");
    expect(prompt).toContain("领口完整覆盖");
  });

  it("keeps identity and safety before the single requested change", () => {
    const prompt = compileIdentityPrompt({
      mode: "realistic-virtual-character",
      characterTag: "@lin-v1",
      assetRole: "wardrobe-state",
      immutableDescriptor: { visibleNotes: ["黑色直发", "银色耳钉"] },
      parentStateId: "base",
      changeSet: {
        category: "wardrobe",
        instruction: "改为米白色西装",
        sourceStateId: "base",
        targetStateId: "business",
      },
    });

    expect(prompt.indexOf("[不可变身份合同]")).toBeLessThan(
      prompt.indexOf("[本次单一变化]"),
    );
    expect(prompt).toContain("@lin-v1");
    expect(prompt).toMatch(/成年人|成年外观/);
    expect(prompt).toMatch(/身份.*稳定/);
    expect(prompt).not.toContain("\u0000");
  });

  it("frames expressions as clothing-locked chest-up portraits", () => {
    const prompt = compileIdentityPrompt({
      mode: "realistic-virtual-character",
      characterTag: "@lin-v1",
      assetRole: "expression",
      immutableDescriptor: { visibleNotes: [] },
      parentStateId: "base",
      referenceRoles: ["face-front", "half-neutral", "body-front"],
      changeSet: {
        category: "expression",
        instruction: "轻微微笑",
        sourceStateId: "base",
        targetStateId: "expression-slight-smile",
      },
    });

    expect(prompt).toContain("胸口以上");
    expect(prompt).toContain("头顶");
    expect(prompt).toContain("完整脸部");
    expect(prompt).toContain("half-neutral");
    expect(prompt).toContain("复制其服装类别");
    expect(prompt).toContain("轻微微笑");
  });

  it("orders face, body, state, then session references", () => {
    const ordered = orderReferenceSources([
      { id: "raw", kind: "session", role: "body-front" },
      { id: "state", kind: "asset", role: "wardrobe-state" },
      { id: "body", kind: "asset", role: "body-front" },
      { id: "face", kind: "asset", role: "face-front" },
      { id: "face-2", kind: "asset", role: "face-three-quarter" },
    ]);

    expect(ordered.map((item) => item.id)).toEqual([
      "face",
      "face-2",
      "body",
      "state",
      "raw",
    ]);
  });

  it("sanitizes bounded notes and rejects an empty change", () => {
    const prompt = compileIdentityPrompt({
      mode: "human-model-card",
      characterTag: "@mina-v1",
      assetRole: "model-card-natural",
      immutableDescriptor: { visibleNotes: [`清晰痣点\u0000${"a".repeat(800)}`] },
      parentStateId: "base",
      changeSet: {
        category: "camera",
        instruction: "自然平视中景",
        sourceStateId: "base",
        targetStateId: "natural-card",
      },
    });
    expect(prompt).not.toContain("\u0000");
    expect(prompt.length).toBeLessThan(4_000);

    expect(() => compileIdentityPrompt({
      mode: "human-model-card",
      characterTag: "@mina-v1",
      assetRole: "model-card-natural",
      immutableDescriptor: { visibleNotes: [] },
      parentStateId: "base",
      changeSet: {
        category: "camera",
        instruction: " \n\t ",
        sourceStateId: "base",
        targetStateId: "natural-card",
      },
    })).toThrow(/变化指令不能为空/);
  });

  it("forces identity changes onto a new version once locked", () => {
    expect(() => assertSingleVariableChange({
      category: "identity",
      instruction: "更改脸型",
      sourceStateId: "base",
      targetStateId: "base-2",
    }, "locked")).toThrow("身份变化必须创建新版本");

    expect(() => assertSingleVariableChange({
      category: "wardrobe",
      instruction: "更换西装",
      sourceStateId: "base",
      targetStateId: "business",
    }, "locked")).not.toThrow();
  });

  it.each([
    {
      role: "body-back" as const,
      category: "identity" as const,
      unsafeInstruction: "建立 body-back 规范视图",
      requiredPhrases: ["专业角色服装目录", "完整服装覆盖", "客观工作室构图"],
      removedPhrase: "保持发型轮廓与身体比例",
    },
    {
      role: "half-neutral" as const,
      category: "identity" as const,
      unsafeInstruction: "建立 half-neutral 规范视图",
      requiredPhrases: ["专业角色设定", "腰部以上", "完整服装覆盖", "客观工作室构图"],
      removedPhrase: "中性半身锚点",
    },
    {
      role: "model-card-full" as const,
      category: "camera" as const,
      unsafeInstruction: "正面全身自然站姿，完整呈现身体比例",
      requiredPhrases: ["专业人物模卡目录", "明确成年", "完整日常服装覆盖", "客观工作室构图"],
      removedPhrase: "完整呈现身体比例",
    },
    {
      role: "model-card-side-action" as const,
      category: "action" as const,
      unsafeInstruction: "侧面轻动作，保持身份和身体比例",
      requiredPhrases: ["专业人物模卡目录", "明确成年", "完整日常服装覆盖", "自然端庄", "客观工作室构图"],
      removedPhrase: "保持身份和身体比例",
    },
  ])("frames $role as a fully clothed adult studio reference", ({
    role,
    category,
    unsafeInstruction,
    requiredPhrases,
    removedPhrase,
  }) => {
    const prompt = compileIdentityPrompt({
      mode: "realistic-virtual-character",
      characterTag: "@lin-v1",
      assetRole: role,
      immutableDescriptor: { visibleNotes: ["成年女性角色，黑色长发"] },
      parentStateId: "base",
      changeSet: {
        category,
        instruction: unsafeInstruction,
        sourceStateId: "base",
        targetStateId: "base",
      },
    });

    for (const phrase of requiredPhrases) expect(prompt).toContain(phrase);
    expect(prompt).not.toContain(unsafeInstruction);
    expect(prompt).not.toContain(removedPhrase);
  });
});
