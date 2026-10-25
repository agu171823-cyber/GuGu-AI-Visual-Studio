import { useEffect, useState } from "react";
import type { CharacterAsset } from "../../shared/asset-schema";
import type { PreviewImage } from "./ImagePreviewDialog";
import { AssetTransfer } from './AssetTransfer';

export type HistoryMetadata = {
  label: string;
  value: string;
};

type Props = {
  projectId: string;
  asset?: CharacterAsset;
  title: string;
  emptyText: string;
  metadata?: HistoryMetadata[];
  ariaLabel?: string;
  dataRole?: string;
  onPreview(image: PreviewImage): void;
};

function assetUrl(projectId: string, assetId: string): string {
  return `/api/character/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`;
}

export function WorkflowHistoryAssetCard({
  projectId,
  asset,
  title,
  emptyText,
  metadata = [],
  ariaLabel,
  dataRole,
  onPreview,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = asset
    ? { src: assetUrl(projectId, asset.id), alt: `${title} 历史资产` }
    : null;

  useEffect(() => {
    setImageFailed(false);
  }, [asset?.id]);

  return (
    <article
      className="workflow-history-card"
      aria-label={ariaLabel ?? `${title} 历史资产记录`}
      data-role={dataRole}
    >
      <div className="workflow-history-media">
        {image && !imageFailed ? (
          <button
            type="button"
            className="workflow-history-preview"
            aria-label={`放大查看${image.alt}`}
            onClick={() => onPreview(image)}
          >
            <img
              className="workflow-history-image"
              src={image.src}
              alt={image.alt}
              onError={() => setImageFailed(true)}
            />
          </button>
        ) : (
          <p className="workflow-history-empty">
            {imageFailed ? "记录存在，但图片资产不可用" : emptyText}
          </p>
        )}
        {asset && !imageFailed && (
          <div className="workflow-history-confirmed" aria-hidden="true">
            <span>✓</span><strong>已确认</strong>
          </div>
        )}
      </div>
      {asset && <AssetTransfer projectId={projectId} versionId={asset.versionId} assetId={asset.id} />}
      <footer className="workflow-history-card-copy">
        <h3>{title}</h3>
        {asset && <small>{asset.id}</small>}
        {metadata.length > 0 && (
          <dl>
            {metadata.map((item) => (
              <div key={`${item.label}-${item.value}`}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </footer>
    </article>
  );
}
