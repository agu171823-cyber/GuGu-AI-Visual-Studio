import { useState } from "react";
import type { CharacterAsset } from "../../shared/asset-schema";
import { CANONICAL_ROLES, type CanonicalRole } from "../../shared/templates";
import type { PendingAsset } from "../App";
import {
  CANONICAL_ROLE_LABELS,
  CanonicalAssetCard,
} from "./CanonicalAssetCard";
import { ImagePreviewDialog, type PreviewImage } from "./ImagePreviewDialog";
import {
  BaseWardrobeAnchorInput,
  type BaseWardrobeDraft,
} from "./BaseWardrobeAnchorInput";

type Props = {
  stage: "references-ready" | "anchor-review" | "canonical-review";
  projectId: string;
  versionId: string;
  assets: CharacterAsset[];
  pendingResults: PendingAsset[];
  baseWardrobe?: BaseWardrobeDraft;
  onBaseWardrobeChange?(value: BaseWardrobeDraft): void;
  onGenerateAnchor(): void;
  onGenerateRemaining(): void;
  onAccept(role: CanonicalRole): void;
  onReject(role: CanonicalRole): void;
  onRetry?(role: CanonicalRole): void;
};

export function IdentityAnchorStage({
  stage,
  projectId,
  versionId,
  assets,
  pendingResults,
  baseWardrobe = { brief: "", reference: null },
  onBaseWardrobeChange = () => undefined,
  onGenerateAnchor,
  onGenerateRemaining,
  onAccept,
  onReject,
  onRetry,
}: Props) {
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const acceptedAssets = assets.filter((asset) =>
    asset.versionId === versionId && asset.status === "ready" && CANONICAL_ROLES.includes(asset.role as CanonicalRole));
  const acceptedByRole = new Map(acceptedAssets.map((asset) => [asset.role, asset]));
  const pendingByRole = new Map(pendingResults.map((pending) => [pending.role, pending]));
  const bodyAnchorPending = pendingByRole.get("body-front");
  const accepted = new Set(acceptedAssets.map((asset) => asset.role));
  const remaining = CANONICAL_ROLES.filter((role) => !accepted.has(role));
  const bodyAnchorAccepted = accepted.has("body-front");
  const nextBatchCount = bodyAnchorAccepted
    ? remaining.filter((role) => role !== "face-front" && role !== "body-front").length
    : 1;
  const reviewRoles = CANONICAL_ROLES.filter((role) => {
    const pending = pendingByRole.get(role);
    return Boolean(pending && !acceptedByRole.has(role));
  });

  return (
    <section className="workflow-panel" aria-labelledby="anchor-title">
      <header className="workflow-header">
        <div>
          <p className="kicker">STEP 2 · STANDARD LOOK</p>
          <h2 id="anchor-title">确认角色的标准形象</h2>
        </div>
        <p>先确认人物身份，再补齐标准角度。完成后会在本步骤内检查一致性。</p>
      </header>

      <div className="guided-progress-summary" aria-label={`标准形象进度 ${accepted.size} / ${CANONICAL_ROLES.length}`}>
        <strong>{accepted.size} / {CANONICAL_ROLES.length}</strong>
        <span>标准形象已确认</span>
        <div><i style={{ width: `${accepted.size / CANONICAL_ROLES.length * 100}%` }} /></div>
      </div>

      <div className="registry-strip">
        {CANONICAL_ROLES.map((role, index) => (
          <div key={role} className={accepted.has(role) ? "ready" : ""}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{CANONICAL_ROLE_LABELS[role]}</strong>
            <small>{accepted.has(role) ? "已确认" : "等待建立"}</small>
          </div>
        ))}
      </div>

      {stage === "references-ready" && (
        <div className="empty-workflow-state">
          <span className="target-mark" aria-hidden="true">＋</span>
          <h3>先生成一张身份基准照</h3>
          <p>这一步会发起 1 次图片生成。确认后，后续角度都会以它为人物身份依据。</p>
          <button className="primary-action" type="button" onClick={onGenerateAnchor}>
            生成身份基准照 · 1 次 <b aria-hidden="true">↗</b>
          </button>
        </div>
      )}

      {reviewRoles.length > 0 && <section className="current-review-section" aria-labelledby="current-review-title">
        <header><div><p className="kicker">CURRENT TASK</p><h3 id="current-review-title">请检查这次生成结果</h3></div><p>人物是否相同、比例是否自然、服装是否符合预期？</p></header>
        <div className="asset-review-grid" aria-live="polite">
        {reviewRoles.map((role) => (
          <CanonicalAssetCard
            key={role}
            projectId={projectId}
            role={role}
            acceptedAsset={acceptedByRole.get(role)}
            pending={pendingByRole.get(role)}
            onAccept={onAccept}
            onReject={onReject}
            onRetry={onRetry}
            onPreview={setPreview}
          />
        ))}
        </div>
      </section>}

      {stage === "canonical-review"
        && accepted.has("face-front")
        && !bodyAnchorAccepted
        && (!bodyAnchorPending || bodyAnchorPending.status === "failed") && (
        <BaseWardrobeAnchorInput
          value={baseWardrobe}
          onChange={onBaseWardrobeChange}
        />
      )}

      {stage === "canonical-review" && pendingResults.length === 0 && remaining.length > 0 && (
        <div className="workflow-callout">
          <div>
            <p className="kicker">{bodyAnchorAccepted ? "DOUBLE ANCHOR ACCEPTED" : "FACE ANCHOR ACCEPTED"}</p>
            <h3>{bodyAnchorAccepted ? "身份与身材双锚点已确认" : "下一步：body-front 身材与基础服装锚点"}</h3>
            <p>{bodyAnchorAccepted
              ? `下一批将生成其余 ${nextBatchCount} 个标准角度；每张仍由你分别确认。`
              : "先建立正面全身照，确认身材比例和基础服装后，再生成其他角度。"}</p>
          </div>
          <button className="primary-action" type="button" onClick={onGenerateRemaining}>
            {bodyAnchorAccepted ? `生成其余 ${nextBatchCount} 个标准角度` : "生成正面全身照 · 1 次"} <b aria-hidden="true">↗</b>
          </button>
        </div>
      )}

      <ImagePreviewDialog image={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
