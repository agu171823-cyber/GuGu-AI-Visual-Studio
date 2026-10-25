import type { ProjectMode } from "../../shared/project-schema";

export type ProjectDraft = {
  mode: ProjectMode | null;
};

type Props = {
  value: ProjectDraft;
  onChange(value: ProjectDraft): void;
};

export function ProjectLauncher({ value, onChange }: Props) {
  return (
    <section className="desk-card project-launcher" aria-labelledby="project-setup-title">
      <div className="section-heading">
        <span className="section-index">01</span>
        <div>
          <p className="kicker">START A CHARACTER</p>
          <h2 id="project-setup-title">先选择要创建的角色</h2>
        </div>
      </div>

      <div className="mode-grid">
        <button
          className="mode-choice"
          type="button"
          aria-label="真人模卡"
          aria-pressed={value.mode === "human-model-card"}
          onClick={() => onChange({ mode: "human-model-card" })}
        >
          <span className="mode-code">适合真人或模特</span>
          <strong>真人模卡</strong>
          <small>制作标准视图与 A4 模卡</small>
        </button>
        <button
          className="mode-choice"
          type="button"
          aria-label="写实虚拟角色"
          aria-pressed={value.mode === "realistic-virtual-character"}
          onClick={() => onChange({ mode: "realistic-virtual-character" })}
        >
          <span className="mode-code">适合原创数字角色</span>
          <strong>写实虚拟角色</strong>
          <small>制作标准角度、表情集和角色设定板</small>
        </button>
      </div>

    </section>
  );
}
