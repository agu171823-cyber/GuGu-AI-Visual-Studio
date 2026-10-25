import { useState } from "react";
import type { PhotoMetrics } from "../lib/photo-metrics";
import { CANONICAL_ROLE_LABELS, type AssetRole } from "../../shared/templates";
import { ImagePreviewDialog, type PreviewImage } from "./ImagePreviewDialog";
import { ReferenceThumbnail } from "./ReferenceThumbnail";

export type AssignedReference = {
  file: File;
  role: AssetRole;
  metrics: PhotoMetrics;
};

type Props = {
  value: AssignedReference[];
  onChange(value: AssignedReference[]): void;
};

const REFERENCE_ROLES: Array<{ value: AssetRole; label: string }> = [
  { value: "face-front", label: "正脸 / 身份主锚点" },
  { value: "face-three-quarter", label: CANONICAL_ROLE_LABELS["face-three-quarter"] },
  { value: "body-front", label: "正面全身" },
  { value: "body-side", label: "侧面全身" },
  { value: "body-back", label: "背面全身" },
];
const DEFAULT_ROLES: AssetRole[] = [
  "face-front",
  "face-three-quarter",
  "body-front",
  "body-side",
  "body-back",
];
const FALLBACK_METRICS: PhotoMetrics = {
  width: 0,
  height: 0,
  orientation: "square",
  brightness: "neutral",
  luminance: 0.5,
  warnings: [],
};

export function ReferenceRoleAssigner({ value, onChange }: Props) {
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const duplicateRoles = new Set(
    value.map((item) => item.role).filter((role, index, roles) => roles.indexOf(role) !== index),
  );

  function addFiles(files: FileList | null): void {
    if (!files) return;
    const accepted = [...files]
      .filter((file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type))
      .filter((file) => file.size <= 15 * 1024 * 1024)
      .slice(0, Math.max(0, 4 - value.length));
    const additions = accepted.map((file, index): AssignedReference => ({
      file,
      role: DEFAULT_ROLES[value.length + index] ?? "body-front",
      metrics: FALLBACK_METRICS,
    }));
    onChange([...value, ...additions]);
  }

  return (
    <section className="desk-card reference-assigner" aria-labelledby="reference-title">
      <div className="section-heading">
        <span className="section-index">02</span>
        <div>
          <p className="kicker">REFERENCE DUTIES</p>
          <h2 id="reference-title">分配参考图职责</h2>
        </div>
      </div>
      <p className="section-copy">
        一张清晰身份图即可开始；额外角度或身体图只是可选补充。上传顺序会被保留，原图不会写入项目。
      </p>

      <label className="reference-dropzone">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          aria-label="上传人物参考图"
          onChange={(event) => addFiles(event.target.files)}
        />
        <span className="drop-mark">＋</span>
        <strong>添加 1–4 张已有参考图</strong>
        <small>PNG / JPEG / WebP · 单张不超过 15 MB</small>
      </label>

      {value.length > 0 && (
        <ol className="reference-list">
          {value.map((reference, index) => (
            <li key={`${reference.file.name}-${reference.file.lastModified}-${index}`}>
              <span className="reference-number">{String(index + 1).padStart(2, "0")}</span>
              <ReferenceThumbnail
                file={reference.file}
                alt={`参考图 ${reference.file.name}`}
                onOpen={setPreview}
              />
              <div className="reference-file">
                <strong>{reference.file.name}</strong>
                <small>{(reference.file.size / 1024 / 1024).toFixed(2)} MB</small>
              </div>
              <label>
                <span className="sr-only">参考图职责</span>
                <select
                  aria-label="参考图职责"
                  value={reference.role}
                  onChange={(event) => onChange(value.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, role: event.target.value as AssetRole }
                      : item))}
                >
                  {REFERENCE_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </label>
              <button
                className="icon-button"
                type="button"
                aria-label={`移除 ${reference.file.name}`}
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}

      {duplicateRoles.size > 0 && (
        <p className="inline-warning" role="status">
          重复职责：{[...duplicateRoles].join("、")}。允许保留，但建议每张图承担不同信息。
        </p>
      )}

      <ImagePreviewDialog image={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
