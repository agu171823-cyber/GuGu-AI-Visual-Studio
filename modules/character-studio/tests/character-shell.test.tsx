/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import App from "../client/App";

it("renders the shared portrait creation character shell", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: "人物与角色素材" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "真人模卡" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "写实虚拟角色" })).toBeTruthy();
});
