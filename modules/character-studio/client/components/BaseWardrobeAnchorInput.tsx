import { useState } from "react";
import { ImagePreviewDialog, type PreviewImage } from "./ImagePreviewDialog";
import { ReferenceThumbnail } from "./ReferenceThumbnail";

const MAX_REFERENCE_BYTES = 15 * 1024 * 1024;
const ALLOWED_REFERENCE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export type BaseWardrobeDraft = {
  brief: string;
  reference: File | null;
};

type Props = {
  value: BaseWardrobeDraft;
  onChange(value: BaseWardrobeDraft): void;
};

export function BaseWardrobeAnchorInput({ value, onChange }: Props) {
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewImage | null>(null);

  function selectReference(file: File | undefined): void {
    if (!file) return;
    if (!ALLOWED_REFERENCE_TYPES.has(file.type)) {
      setError("基础服装参考仅支持 PNG、JPEG 或 WebP 图片。");
      return;
    }
    if (file.size > MAX_REFERENCE_BYTES) {
      setError("基础服装参考图不能超过 15 MB。");
      return;
    }
    setError("");
    onChange({ ...value, reference: file });
  }

  return (
    <section className="base-wardrobe-anchor" aria-labelledby="base-wardrobe-title">
      <div className="base-wardrobe-copy">
        <p className="kicker">BASE WARDROBE / SESSION ONLY</p>
        <h3 id="base-wardrobe-title">定义这版角色的基础服装</h3>
        <p>用简短文字描述服装；也可附加 1 张服装参考图。留空时使用完整覆盖的中性日常服装，正脸锚点只用于面部身份。参考图只在当前会话中使用，接受后的正面全身图才会成为后续视图真源。</p>
      </div>

      <div className="base-wardrobe-fields">
        <div className="base-wardrobe-brief">
          <label htmlFor="base-wardrobe-brief">基础服装描述</label>
          <textarea
            id="base-wardrobe-brief"
            value={value.brief}
            maxLength={300}
            placeholder="例如：米白色西装、直筒长裤、黑色低跟鞋"
            onChange={(event) => onChange({ ...value, brief: event.target.value })}
          />
          <small>{value.brief.length} / 300</small>
        </div>

        <div className="base-wardrobe-reference">
          <div className="base-wardrobe-upload">
            <label htmlFor="base-wardrobe-reference">上传基础服装参考图</label>
            <small>可选 · 单张 · PNG / JPEG / WebP · 最大 15 MB</small>
            <input
              id="base-wardrobe-reference"
              type="file"
              onChange={(event) => {
                selectReference(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </div>

          {value.reference && (
            <div className="base-wardrobe-preview">
              <ReferenceThumbnail
                file={value.reference}
                alt={`基础服装参考 ${value.reference.name}`}
                onOpen={setPreview}
              />
              <div>
                <strong>{value.reference.name}</strong>
                <small>再次上传即可替换</small>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="移除基础服装参考图"
                onClick={() => onChange({ ...value, reference: null })}
              >
                ×
              </button>
            </div>
          )}
          {error && <p className="inline-warning" role="alert">{error}</p>}
        </div>
      </div>

      <ImagePreviewDialog image={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
