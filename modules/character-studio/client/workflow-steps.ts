import type { Stage } from "./App";

export const WORKFLOW_STEPS = [
  { id: "project-setup", label: "添加参考" },
  { id: "anchor-review", label: "确认角色" },
  { id: "canonical-review", label: "标准形象与一致性记录" },
  { id: "stress-testing", label: "标准形象与一致性记录" },
  { id: "asset-production", label: "制作与下载" },
  { id: "export-ready", label: "制作与下载" },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"];

export function stageToWorkflowStep(stage: Stage): WorkflowStepId {
  if (stage === "references-ready") return "anchor-review";
  if (stage === "stress-testing") return "canonical-review";
  if (stage === "version-locked") return "asset-production";
  return stage;
}
