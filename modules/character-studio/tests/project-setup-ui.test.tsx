/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { suggestedProjectName } from "../client/App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function adultPortraitFile(): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "adult.png", {
    type: "image/png",
  });
}

describe("project setup", () => {
  it("requires a purpose, references, and both rights confirmations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "真人模卡" }));
    const next = screen.getByRole("button", { name: "创建角色并继续" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    await user.upload(screen.getByLabelText("上传人物参考图"), adultPortraitFile());
    await user.click(screen.getByLabelText("人物为成年人"));
    await user.click(screen.getByLabelText("我拥有照片或角色设计使用权"));
    expect(next.disabled).toBe(false);
  });

  it("keeps the setup free of profile and project metadata fields", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "写实虚拟角色" }));

    expect(screen.queryByLabelText("三围")).toBeNull();
    expect(screen.queryByLabelText("角色名称")).toBeNull();
    expect(screen.queryByLabelText("项目名称")).toBeNull();
  });

  it("keeps existing projects and backup import behind one small action", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByText(/继续已有角色/)).toBeNull();
    expect(screen.queryByRole("dialog", { name: "已有角色与备份" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "打开已有角色" }));
    expect(screen.getByRole("dialog", { name: "已有角色与备份" })).toBeTruthy();
    expect(screen.getByLabelText("导入旧版角色项目目录")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "关闭已有角色" }));
    expect(screen.queryByRole("dialog", { name: "已有角色与备份" })).toBeNull();
  });

  it("names new projects from a useful reference filename, with a safe fallback", () => {
    expect(suggestedProjectName("Linda Chen.png", "human-model-card", ["Linda Chen"]))
      .toBe("Linda Chen 2");
    expect(suggestedProjectName("22.png", "realistic-virtual-character"))
      .toBe("虚拟角色");
  });

  it("defaults the first reference to face-front and warns on duplicate roles", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:reference"),
      revokeObjectURL: vi.fn(),
    });
    render(<App />);
    await user.click(screen.getByRole("button", { name: "真人模卡" }));
    const input = screen.getByLabelText("上传人物参考图");
    await user.upload(input, [adultPortraitFile(), adultPortraitFile()]);

    const roles = screen.getAllByLabelText("参考图职责") as HTMLSelectElement[];
    expect(roles[0].value).toBe("face-front");
    await user.selectOptions(roles[1], "face-front");
    expect(screen.getAllByRole("status").map(node => node.textContent).join(" ")).toMatch(/重复职责/);
  });
});
