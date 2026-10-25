import { useState } from "react";
import type { CharacterAsset } from "../../shared/asset-schema";
import type { CharacterProject, CharacterVersion } from "../../shared/project-schema";
import {
  CANONICAL_ROLES,
  CANONICAL_ROLE_LABELS,
  STRESS_TEST_ROLES,
  isCanonicalRole,
  isStressTestRole,
  type AssetRole,
} from "../../shared/templates";
import { WORKFLOW_STEPS, type WorkflowStepId } from "../workflow-steps";
import type { AssignedReference } from "./ReferenceRoleAssigner";
import { ImagePreviewDialog, type PreviewImage } from "./ImagePreviewDialog";
import { ReferenceThumbnail } from "./ReferenceThumbnail";
import { WorkflowHistoryAssetCard, type HistoryMetadata } from "./WorkflowHistoryAssetCard";

type Props = {
  step: WorkflowStepId;
  project: CharacterProject;
  version: CharacterVersion;
  assets: CharacterAsset[];
  references: AssignedReference[];
  onReturn(): void;
};

const ROLE_LABELS: Partial<Record<AssetRole, string>> = {
  "face-front": "正脸身份锚点",
  "face-three-quarter": CANONICAL_ROLE_LABELS["face-three-quarter"],
  "body-front": "正面全身",
  "body-side": "侧面全身",
  "body-back": "背面全身",
  "half-neutral": "中性半身",
  "stress-lighting": "光线变化",
  "stress-angle": "角度变化",
  "stress-action": "动作变化",
};

const DERIVED_GROUPS = [
  { label: "模卡", roles: ["model-card-natural", "model-card-half", "model-card-full", "model-card-side-action"] },
  { label: "表情", roles: ["expression"] },
  { label: "服装", roles: ["wardrobe-state"] },
  { label: "动作", roles: ["action-reference"] },
  { label: "其他", roles: ["custom"] },
] as const;

function displayDate(value?: string): string {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN");
}

function metadata(...items: Array<[string, string | undefined]>): HistoryMetadata[] {
  return items.map(([label, value]) => ({ label, value: value || "未记录" }));
}

function ProjectHistory({ project, references, onPreview }: {
  project: CharacterProject;
  references: AssignedReference[];
  onPreview(image: PreviewImage): void;
}) {
  const profile = [
    ["艺名", project.optionalProfile.stageName],
    ["身高", project.optionalProfile.heightCm ? `${project.optionalProfile.heightCm} cm` : undefined],
    ["胸围", project.optionalProfile.bustCm ? `${project.optionalProfile.bustCm} cm` : undefined],
    ["腰围", project.optionalProfile.waistCm ? `${project.optionalProfile.waistCm} cm` : undefined],
    ["臀围", project.optionalProfile.hipsCm ? `${project.optionalProfile.hipsCm} cm` : undefined],
    ["鞋码", project.optionalProfile.shoeSize],
    ["联系信息", project.optionalProfile.contact],
  ].filter((item): item is [string, string] => typeof item[1] === "string" && Boolean(item[1]));
  return (
    <div className="workflow-history-body">
      <dl className="workflow-history-summary">
        <div><dt>项目类型</dt><dd>{project.mode}</dd></div>
        <div><dt>项目名称</dt><dd>{project.title}</dd></div>
        <div><dt>角色名称</dt><dd>{project.displayName}</dd></div>
        <div><dt>角色标签</dt><dd>{project.characterTag}</dd></div>
        <div><dt>创建时间</dt><dd>{displayDate(project.createdAt)}</dd></div>
      </dl>
      {profile.length > 0 && (
        <section className="workflow-history-subsection" aria-labelledby="history-profile-title">
          <h3 id="history-profile-title">可选模特资料</h3>
          <dl className="workflow-history-summary">
            {profile.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>
      )}
      <section className="workflow-history-subsection" aria-labelledby="history-reference-title">
        <h3 id="history-reference-title">当前会话参考图</h3>
        {references.length === 0 ? (
          <p className="workflow-history-notice">原始参考未保存，仅保存了已接受资产</p>
        ) : (
          <ul className="workflow-history-references">
            {references.map((reference, index) => (
              <li key={`${reference.file.name}-${reference.file.lastModified}-${index}`}>
                <ReferenceThumbnail
                  file={reference.file}
                  alt={`参考图 ${reference.file.name}`}
                  onOpen={onPreview}
                />
                <div><strong>{reference.file.name}</strong><small>{reference.role}</small></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function WorkflowHistoryPanel({
  step,
  project,
  version,
  assets,
  references,
  onReturn,
}: Props) {
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const stepLabel = WORKFLOW_STEPS.find((item) => item.id === step)?.label ?? step;
  const readyAssets = assets.filter((asset) =>
    asset.versionId === version.id && asset.status === "ready");
  const faceAnchor = readyAssets.find((asset) => asset.role === "face-front");
  const canonical = CANONICAL_ROLES.map((role) => ({
    role,
    asset: readyAssets.find((asset) => asset.role === role),
  }));
  const stress = STRESS_TEST_ROLES.map((role) => {
    const review = version.stressTests.find((item) => item.role === role);
    return {
      role,
      review,
      asset: review ? readyAssets.find((asset) => asset.id === review.assetId) : undefined,
    };
  });
  const derived = readyAssets.filter((asset) =>
    !isCanonicalRole(asset.role) && !isStressTestRole(asset.role));
  const boards = project.boards.filter((board) => board.versionId === version.id);

  return (
    <section className="workflow-history-panel" aria-labelledby="workflow-history-title">
      <header className="workflow-history-header">
        <div>
          <p className="kicker">READ-ONLY WORKFLOW HISTORY</p>
          <h2 id="workflow-history-title">正在回看：{stepLabel}</h2>
          <p>这里仅展示已保存记录，不会改变当前进度或触发生成。</p>
        </div>
        <button type="button" className="back-button" onClick={onReturn}>返回当前步骤</button>
      </header>

      {step === "project-setup" && (
        <ProjectHistory project={project} references={references} onPreview={setPreview} />
      )}

      {step === "anchor-review" && (
        <div className="workflow-history-grid">
          <WorkflowHistoryAssetCard
            projectId={project.id}
            asset={faceAnchor}
            title="face-front"
            emptyText="当前版本没有已接受的身份锚点"
            metadata={metadata(
              ["配方模板", faceAnchor?.recipe.templateId],
              ["模型", faceAnchor?.recipe.model],
              ["尺寸", faceAnchor?.recipe.size],
              ["完成时间", displayDate(faceAnchor?.recipe.completedAt)],
            )}
            onPreview={setPreview}
          />
        </div>
      )}

      {step === "canonical-review" && (
        <div className="workflow-history-body">
          <section className="workflow-history-subsection">
            <h3>标准形象</h3>
            <div className="workflow-history-grid">
              {canonical.map(({ role, asset }) => {
                const oldSquare = role === "face-three-quarter" && asset && /^(\d+)x\1$/.test(asset.recipe.size);
                const title = role === "face-three-quarter"
                  ? `微侧半身${oldSquare ? "（旧版方图）" : ""}`
                  : role;
                return <WorkflowHistoryAssetCard
                  key={role}
                  projectId={project.id}
                  asset={asset}
                  title={title}
                  emptyText={`当前版本缺少${ROLE_LABELS[role] ?? role}`}
                  ariaLabel={`${title} 规范历史资产`}
                  dataRole={role}
                  metadata={asset ? metadata(
                    ["角色", ROLE_LABELS[role] ?? role],
                    ...(role === "face-three-quarter" ? [["尺寸", asset.recipe.size] as [string, string]] : []),
                    ...(oldSquare ? [["说明", "旧版图片保留；新生成使用 2:3 微侧半身"] as [string, string]] : []),
                  ) : []}
                  onPreview={setPreview}
                />;
              })}
            </div>
          </section>
          <section className="workflow-history-subsection">
            <h3>一致性检查</h3>
            <div className="workflow-history-grid">
              {stress.map(({ role, review, asset }) => (
                <WorkflowHistoryAssetCard
                  key={role}
                  projectId={project.id}
                  asset={asset}
                  title={role}
                  emptyText={review ? "记录存在，但图片资产不可用" : "当前版本没有该项一致性检查记录"}
                  metadata={metadata(
                    ["审核结论", review ? review.passed ? "已通过" : "未通过" : "未审核"],
                    ["审核时间", displayDate(review?.reviewedAt)],
                  )}
                  onPreview={setPreview}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {step === "stress-testing" && (
        <div className="workflow-history-grid">
          {stress.map(({ role, review, asset }) => (
            <WorkflowHistoryAssetCard
              key={role}
              projectId={project.id}
              asset={asset}
              title={role}
              emptyText={review ? "记录存在，但图片资产不可用" : "当前版本没有该项压力测试记录"}
              metadata={metadata(
                ["审核结论", review ? review.passed ? "已通过" : "未通过" : "未审核"],
                ["审核时间", displayDate(review?.reviewedAt)],
              )}
              onPreview={setPreview}
            />
          ))}
        </div>
      )}

      {step === "asset-production" && (
        <div className="workflow-history-body">
          {DERIVED_GROUPS.map((group) => {
            const groupAssets = derived.filter((asset) =>
              (group.roles as readonly string[]).includes(asset.role));
            if (groupAssets.length === 0) return null;
            return (
              <section className="workflow-history-subsection" key={group.label}>
                <h3>{group.label}</h3>
                <div className="workflow-history-grid">
                  {groupAssets.map((asset) => (
                    <WorkflowHistoryAssetCard
                      key={asset.id}
                      projectId={project.id}
                      asset={asset}
                      title={asset.role}
                      emptyText=""
                      metadata={metadata(
                        ["状态编号", asset.stateId],
                        ["变更类别", asset.changeSet.category],
                        ["变更说明", asset.changeSet.instruction],
                        ["来源资产", asset.parentAssetId],
                      )}
                      onPreview={setPreview}
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {derived.length === 0 && (
            <p className="workflow-history-notice">当前版本没有已接受的派生资产</p>
          )}
        </div>
      )}

      {step === "export-ready" && (
        <div className="workflow-history-body">
          {boards.length === 0 ? (
            <p className="workflow-history-notice">
              当前版本没有已记录的交付；本地下载不会自动写回项目。
            </p>
          ) : (
            <ul className="workflow-history-deliveries">
              {boards.map((board) => {
                const usedAssets = board.assetIds.map((assetId) => ({
                  assetId,
                  asset: readyAssets.find((asset) => asset.id === assetId),
                }));
                const availableCount = usedAssets.filter((item) => item.asset).length;
                return (
                  <li key={board.id} aria-label={`交付记录 ${board.fileName}`}>
                    <div className="workflow-history-delivery-summary">
                      <strong>{board.fileName}</strong>
                      <span>{board.kind}</span>
                      <span>{displayDate(board.createdAt)}</span>
                      <small>{availableCount}/{usedAssets.length} 个所用资产可用</small>
                    </div>
                    <ul className="workflow-history-delivery-assets" aria-label={`${board.fileName} 所用资产`}>
                      {usedAssets.map(({ assetId, asset }) => (
                        <li key={assetId} className={asset ? "available" : "missing"}>
                          {asset
                            ? `${assetId} · ${asset.role}`
                            : `${assetId} · 记录存在，但所用资产不可用`}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <ImagePreviewDialog image={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
