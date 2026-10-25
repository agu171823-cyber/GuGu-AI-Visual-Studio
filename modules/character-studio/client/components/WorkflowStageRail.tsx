import type { WorkflowStepId } from "../workflow-steps";

type Props = {
  currentStep: WorkflowStepId;
  viewedStep: WorkflowStepId | null;
  onSelect(step: WorkflowStepId): void;
};

export function WorkflowStageRail({ currentStep, viewedStep, onSelect }: Props) {
  const steps: Array<{ label: string; target: WorkflowStepId; matches: WorkflowStepId[] }> = [
    { label: "添加参考", target: "project-setup", matches: ["project-setup"] },
    { label: "确认角色", target: "canonical-review", matches: ["anchor-review", "canonical-review", "stress-testing"] },
    { label: "制作与下载", target: "asset-production", matches: ["asset-production", "export-ready"] },
  ];
  const currentIndex = Math.max(0, steps.findIndex((item) => item.matches.includes(currentStep)));
  return (
    <nav className="stage-rail guided-stage-rail" aria-label="角色制作进度">
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isViewed = step.matches.includes(viewedStep as WorkflowStepId);
        const accessible = index <= currentIndex;
        const accessibleName = !accessible
          ? `尚未开放 第 ${index + 1} 步 ${step.label}`
          : isCurrent
            ? `${isViewed ? "返回当前任务" : "查看当前记录"}：第 ${index + 1} 步 ${step.label}`
            : `查看已完成记录：第 ${index + 1} 步 ${step.label}`;
        return (
          <button
            key={step.label}
            type="button"
            disabled={!accessible}
            aria-current={isCurrent ? "step" : undefined}
            aria-pressed={!isCurrent && accessible ? isViewed : undefined}
            aria-label={accessibleName}
            className={`${isCurrent ? "current" : index < currentIndex ? "complete" : "future"}${isViewed ? " viewing" : ""}`}
            onClick={() => onSelect(isCurrent ? currentStep : step.target)}
          >
            <span>{index < currentIndex ? "✓" : String(index + 1).padStart(2, "0")}</span>
            <span className="stage-copy"><small>第 {index + 1} 步</small><strong>{step.label}</strong></span>
          </button>
        );
      })}
    </nav>
  );
}
