/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "../client/App";
import { adultPortraitFile, createFakeClientApi, makeAppState } from "./helpers/ui-fixture";

afterEach(cleanup);

describe("saved local projects", () => {
  it("reopens a locked project with its assets and history", async () => {
    const user = userEvent.setup();
    const project = makeAppState("version-locked").project!;
    const { api } = createFakeClientApi();
    api.listProjects = async () => [project];
    api.readProject = async () => project;

    render(<App api={api} />);

    await user.click(screen.getByRole("button", { name: "打开已有角色" }));
    await user.click(await screen.findByRole("button", { name: `打开 ${project.title}` }));
    expect(await screen.findByText(/v1 · LOCKED/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "接下来想制作什么？" })).toBeTruthy();
    expect((screen.getByLabelText("人物为成年人") as HTMLInputElement).checked).toBe(false);
  });

  it("lets an empty reopened project reattach its session references", async () => {
    const user = userEvent.setup();
    const project = makeAppState("references-ready").project!;
    const { api } = createFakeClientApi();
    api.listProjects = async () => [project];
    api.readProject = async () => project;

    render(<App api={api} />);

    await user.click(screen.getByRole("button", { name: "打开已有角色" }));
    await user.click(await screen.findByRole("button", { name: `打开 ${project.title}` }));
    const input = await screen.findByLabelText("上传人物参考图");
    await user.upload(input, adultPortraitFile());
    expect(screen.getByText("adult.png")).toBeTruthy();
  });
});
