import { useState } from "react";
import type { StressTestResult } from "../../shared/project-schema";
import type { StressTestRole } from "../../shared/templates";
import type { PendingAsset } from "../App";
import { ImagePreviewDialog, type PreviewImage } from "./ImagePreviewDialog";

type Props = {
  projectId: string;
  versionId: string;
  baselineAssetId?: string;
  results: StressTestResult[];
  canLock: boolean;
  locked: boolean;
  pendingResults: PendingAsset[];
  generating: boolean;
  onGenerate(): void;
  onRetry(role: StressTestRole): void;
  onReject(role: StressTestRole): void;
  onApproveAll(): void;
};

const TESTS: Array<{ role: StressTestRole; title: string; copy: string }> = [
  {
    role: "stress-lighting",
    title: "光线变化",
    copy: "只改变光线；脸型、五官、身材比例与基础服装保持一致。身材或服装变化即不通过。",
  },
  {
    role: "stress-angle",
    title: "角度变化",
    copy: "只改变机位和透视；身份、身材比例与基础服装保持一致。身材或服装变化即不通过。",
  },
  {
    role: "stress-action",
    title: "动作变化",
    copy: "只改变关节角度和重心；身份、身材比例与基础服装保持一致。身材或服装变化即不通过。",
  },
];

export function StressTestStage({
  projectId,
  versionId,
  baselineAssetId,
  results,
  canLock,
  locked,
  pendingResults,
  generating,
  onGenerate,
  onRetry,
  onReject,
  onApproveAll,
}: Props) {
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);
  const generated = TESTS.every((test) =>
    pendingResults.some((pending) => pending.role === test.role && pending.status === "ready"));
  const allReviewable = TESTS.every((test) =>
    results.some((result) => result.role === test.role && result.passed)
    || pendingResults.some((pending) => pending.role === test.role
      && pending.status === "ready" && pending.result));
  return (
    <section className="workflow-panel" aria-labelledby="stress-title">
      <header className="workflow-header">
        <div>
          <p className="kicker">STEP 2 · FINAL CHECK</p>
          <h2 id="stress-title">最后确认：不同场景下还是同一个人</h2>
        </div>
        <p>把三张结果与标准形象比较；都一致时，只需一次确认即可进入素材制作。</p>
      </header>

      <div className="stress-generation-bar" aria-live="polite">
        <div>
          <strong>{generated ? "3 组检查图已生成，请逐项比较" : "准备好后，一次生成 3 组一致性检查图"}</strong>
          <small>会发起 3 次图片生成 · 失败不会自动重试</small>
        </div>
        <button type="button" disabled={generating || generated} onClick={onGenerate}>
          {generating ? "正在生成检查图…" : generated ? "检查图已生成" : "生成 3 组检查图"}
        </button>
      </div>

      <div className="stress-grid">
        {TESTS.map((test, index) => {
          const review = results.find((result) => result.role === test.role && result.passed);
          const checked = Boolean(review);
          const pending = pendingResults.find((item) => item.role === test.role);
          const reviewable = Boolean(pending?.status === "ready" && pending.result) || checked;
          const imageSrc = pending?.result
            ? `data:image/png;base64,${pending.result.imageB64}`
            : review?.assetId
              ? `/api/character/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(review.assetId)}`
              : "";
          return (
            <article key={test.role} className={checked ? "passed" : pending?.status === "failed" ? "failed" : ""}>
              <span className="stress-index">T{index + 1}</span>
              <div className="consistency-comparison">
                <div className="comparison-image"><span>标准形象</span>{baselineAssetId
                  ? <img src={`/api/character/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(baselineAssetId)}`} alt="角色标准形象" />
                  : <div className="stress-symbol" aria-hidden="true" />}</div>
                <div className={`stress-visual${imageSrc ? " has-image" : ""}`}><span>本次结果</span>
                {imageSrc ? (
                  <button
                    type="button"
                    className="stress-preview-trigger"
                    aria-label={`放大查看${test.title}压力测试结果`}
                    onClick={() => setPreviewImage({
                      src: imageSrc,
                      alt: `${test.title}压力测试结果`,
                    })}
                  >
                    <img
                      className="stress-review-image"
                      src={imageSrc}
                      alt={`${test.title}压力测试结果`}
                    />
                  </button>
                ) : pending?.status === "failed" ? (
                  <div className="stress-failure" role="alert">
                    <strong>生成失败</strong>
                    <small>{pending.error || "未获得可审核的测试图"}</small>
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => onRetry(test.role)}
                    >
                      仅重试{test.title} · 1 次调用
                    </button>
                  </div>
                ) : (
                  <div className={`stress-symbol ${test.role}`} aria-hidden="true" />
                )}
                </div>
              </div>
              <h3>{test.title}</h3>
              <p>{test.copy}</p>
              <ul className="consistency-checklist" aria-label={`${test.title}检查要点`}>
                <li>脸型与五官相同</li><li>身材与比例相同</li><li>基础服装相同</li>
              </ul>
              <div className="stress-review-actions" aria-label={`${test.title}审核`}>
                <span>{checked ? "已确认一致" : reviewable ? "确认无误后在页面底部一次完成" : "等待检查图"}</span>
                <button
                  type="button"
                  className="stress-reject"
                  aria-pressed={false}
                  disabled={generating || !reviewable}
                  onClick={() => onReject(test.role)}
                >有明显变化，重新生成</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="lock-bar">
        <div>
          <span>{results.filter((result) => result.passed).length} / 3 项已确认一致</span>
          <strong>{locked ? `${versionId} 已成为标准形象` : allReviewable ? "确认三张图一致后，直接进入素材制作" : "先生成并检查三张一致性图片"}</strong>
        </div>
        <button type="button" disabled={(!canLock && !allReviewable) || locked || generating} onClick={onApproveAll}>
          {locked ? "角色标准形象已确认" : "三张都一致，确认角色"}
        </button>
      </div>
      <ImagePreviewDialog image={previewImage} onClose={() => setPreviewImage(null)} />
    </section>
  );
}
