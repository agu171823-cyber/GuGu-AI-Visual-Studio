import type { CharacterAsset } from "../../shared/asset-schema";
import { CANONICAL_ROLE_LABELS, type CanonicalRole } from "../../shared/templates";
import type { PendingAsset } from "../App";
import type { PreviewImage } from "./ImagePreviewDialog";
import { AssetTransfer } from './AssetTransfer';

export { CANONICAL_ROLE_LABELS } from "../../shared/templates";

type Props = {
  projectId: string;
  role: CanonicalRole;
  acceptedAsset?: CharacterAsset;
  pending?: PendingAsset;
  onAccept(role: CanonicalRole): void;
  onReject(role: CanonicalRole): void;
  onRetry?(role: CanonicalRole): void;
  onPreview(image: PreviewImage): void;
};

export function CanonicalAssetCard({
  projectId,
  role,
  acceptedAsset,
  pending,
  onAccept,
  onReject,
  onRetry,
  onPreview,
}: Props) {
  const label = CANONICAL_ROLE_LABELS[role];
  const acceptedSrc = acceptedAsset
    ? `/api/character/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(acceptedAsset.id)}`
    : "";
  const pendingSrc = pending?.status === "ready" && pending.result
    ? `data:image/png;base64,${pending.result.imageB64}`
    : "";
  const imageSrc = acceptedSrc || pendingSrc;

  return (
    <article
      className={`asset-review-card${acceptedAsset ? " is-accepted" : ""}`}
      aria-label={`${label}审核`}
    >
      <div className={`asset-frame${imageSrc ? " has-image" : " is-placeholder"}`}>
        {imageSrc ? (
          <button
            className="asset-preview-trigger"
            type="button"
            aria-label={`放大查看${label}`}
            onClick={() => onPreview({ src: imageSrc, alt: label })}
          >
            <img className="asset-review-image" src={imageSrc} alt={label} />
          </button>
        ) : pending?.status === "failed" ? (
          <div className="asset-failure-state">
            <p>{pending.error ?? "生成失败"}</p>
            {onRetry && (
              <button type="button" onClick={() => onRetry(role)}>
                仅重试{label} · 1 次调用
              </button>
            )}
          </div>
        ) : pending?.status === "generating" || pending?.status === "queued" ? (
          <div className="generating-mark"><span />正在生成{label}</div>
        ) : (
          <p className="asset-empty-label">等待生成</p>
        )}

        {acceptedAsset && (
          <div className="accepted-asset-overlay" aria-label={`${label} 已确认`}>
            <span aria-hidden="true">✓</span>
            <strong>已确认</strong>
          </div>
        )}
      </div>

      {role === "body-front" && !acceptedAsset && pending?.status === "ready" && pending.result && (
        <div className="body-anchor-review-note">
          <strong>接受前请逐项检查</strong>
          <p>检查头身比、肩胯、腰线、躯干与四肢长度、关节位置与自然站立重心。</p>
          <p>确认基础服装的层次、上装、下装、鞋履和配饰与预期一致；接受后将成为后续视图真源。</p>
        </div>
      )}

      {acceptedAsset && <AssetTransfer projectId={projectId} versionId={acceptedAsset.versionId} assetId={acceptedAsset.id} />}
      <footer>
        <div>
          <strong>{label}</strong>
          <small className="sr-only">内部职责：{role}</small>
        </div>
        {!acceptedAsset && pending?.status === "ready" && pending.result && (
          <div className="review-actions">
            <button type="button" onClick={() => onReject(role)}>不满意</button>
            <button className="accept-button" type="button" onClick={() => onAccept(role)}>
              确认使用
            </button>
          </div>
        )}
      </footer>
    </article>
  );
}
