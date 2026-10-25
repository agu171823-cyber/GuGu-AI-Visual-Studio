import { useEffect, useMemo, useRef, useState } from "react";
import type { CharacterAsset } from "../../shared/asset-schema";
import type { CharacterProject, CharacterVersion } from "../../shared/project-schema";
import type { ClientApi } from "../api";
import { exportBodyOnlyCrop } from "../board/body-only";
import {
  buildHumanModelCardLayout,
  buildVirtualCharacterLayout,
} from "../board/layouts";
import { downloadCanvas, loadBrowserImage, renderBoard } from "../board/render";
import { chooseBoardAssets } from "../delivery-readiness";
import type { AssetWorkspaceTab } from "./AssetGroupWorkspace";

type Props = {
  api: ClientApi;
  project: CharacterProject;
  version: CharacterVersion;
  assets: CharacterAsset[];
  onBack(target?: AssetWorkspaceTab): void;
};

function assetUrl(projectId: string, assetId: string): string {
  return `/api/character/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`;
}

export function BoardComposer({ api, project, version, assets, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [bodyOnly, setBodyOnly] = useState(false);
  const [cropPercent, setCropPercent] = useState(24);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [packUrl, setPackUrl] = useState('');
  const [exporting, setExporting] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const boardSelection = useMemo(
    () => chooseBoardAssets(project, version, assets),
    [assets, project, version],
  );
  const boardAssets = boardSelection.assets;
  const layout = useMemo(() => project.mode === "human-model-card"
    ? buildHumanModelCardLayout({
      assets: boardAssets,
      displayName: project.displayName,
      showProfile,
      profile: project.optionalProfile,
    })
    : buildVirtualCharacterLayout({
      assets: boardAssets,
      displayName: project.displayName,
      characterTag: `${project.characterTag}-${version.id}`,
      stateLabels: ["BASE", ...version.derivedStateIds.slice(0, 4).map((state) => state.toUpperCase())],
    }), [boardAssets, project, showProfile, version]);
  const boardComplete = boardSelection.complete;

  async function refreshPreview(): Promise<void> {
    if (!canvasRef.current) return;
    setError("");
    setPreviewReady(false);
    try {
      await renderBoard(canvasRef.current, layout);
      setPreviewReady(true);
      setStatus(`${layout.width} × ${layout.height} 预览已更新`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "画板预览失败");
    }
  }

  useEffect(() => {
    void refreshPreview();
  }, [layout]);

  async function exportModelPack(): Promise<void> {
    if (exporting) return;
    setExporting(true);
    setError("");
    try {
      const result = await api.exportProject(project.id, "model-pack", {
        versionId: version.id,
        includeBodyOnly: false,
      });
      setStatus(`模型参考包已准备就绪（${result.relativeFiles.length} 个文件），请点击下方下载链接`);
      if (result.downloadUrl) setPackUrl(result.downloadUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "模型参考包导出失败");
    } finally {
      setExporting(false);
    }
  }

  async function exportExperimentalBody(): Promise<void> {
    const source = assets.find((asset) =>
      asset.versionId === version.id && asset.role === "body-front" && asset.status === "ready");
    if (!source) {
      setError("当前版本缺少 body-front，无法进行身体裁切实验");
      return;
    }
    try {
      const image = await loadBrowserImage(assetUrl(project.id, source.id));
      const canvas = exportBodyOnlyCrop(image, cropPercent / 100);
      downloadCanvas(canvas, `${project.characterTag.slice(1)}-${version.id}-experimental-body-only.png`);
      setStatus("实验性身体裁切已下载；它不会替代任何规范资产");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "身体裁切导出失败");
    }
  }

  return (
    <section className="board-composer workflow-panel" aria-labelledby="board-title">
      <header className="workflow-header">
        <div><p className="kicker">DOWNLOAD & SHARE</p><h2 id="board-title">下载与发送</h2></div>
        <p>制作可直接查看的展示板，或导出给图片、视频工具使用的角色参考包。这里不会调用图片模型。</p>
      </header>

      <div className="board-grid">
        <div className="board-preview-frame">
          <canvas ref={canvasRef} aria-label="角色展示板预览" />
        </div>
        <aside className="board-controls">
          <div className="delivery-spec">
            <span>BOARD FORMAT</span>
            <strong>{project.mode === "human-model-card" ? "A4 / PORTRAIT" : "3:2 / LANDSCAPE"}</strong>
            <small>{layout.width} × {layout.height} PNG</small>
          </div>
          {project.mode === "human-model-card" && (
            <label className="toggle-row">
              <input type="checkbox" checked={showProfile} onChange={(event) => setShowProfile(event.target.checked)} />
              <span>在展示板显示可选模特资料</span>
            </label>
          )}
          <button type="button" onClick={() => void refreshPreview()}>刷新画板预览</button>
          <button
            className="primary-action"
            type="button"
            disabled={!boardComplete || !previewReady}
            onClick={() => canvasRef.current && downloadCanvas(
              canvasRef.current,
              `${project.characterTag.slice(1)}-${version.id}-display-board.png`,
            )}
          >导出展示板 PNG <b aria-hidden="true">↗</b></button>
          {!boardComplete && (
            <p className="inline-warning">
              当前画板缺少精确槽位：{boardSelection.missing.join("、")}。无关资产不会替代必需视图。
            </p>
          )}
          {project.mode === "realistic-virtual-character"
            && boardSelection.expressionReady < boardSelection.expressionRequired && (
            <button
              className="expression-return-button"
              type="button"
              onClick={() => onBack("expressions")}
            >
              返回制作六种表情
            </button>
          )}
          <button className="model-pack-button" disabled={exporting} type="button" onClick={() => void exportModelPack()}>
            导出模型参考包
          </button>
          {packUrl && <a className="primary-action" href={packUrl} download={`${project.characterTag.slice(1)}-${version.id}-model-pack.zip`}>下载模型参考包 ZIP</a>}

          <details className="body-only-experiment">
            <summary>实验：身体参考裁切</summary>
            <label className="toggle-row">
              <input type="checkbox" checked={bodyOnly} onChange={(event) => setBodyOnly(event.target.checked)} />
              <span>启用实验性身体裁切</span>
            </label>
            {bodyOnly && (
              <>
                <label>
                  <span>身体裁切起点（10–45%）：{cropPercent}%</span>
                  <input type="range" min="10" max="45" value={cropPercent} onChange={(event) => setCropPercent(Number(event.target.value))} />
                </label>
                <p>手动裁切，不做人脸检测；输出会永久标注 EXPERIMENTAL。</p>
                <button type="button" onClick={() => void exportExperimentalBody()}>下载实验裁切</button>
              </>
            )}
          </details>
          <button className="back-button" type="button" onClick={() => onBack("model-card")}>返回资产生产</button>
        </aside>
      </div>
      <div className="board-status" aria-live="polite">
        {status && <p>{status}</p>}
        {error && <p className="error-banner" role="alert">{error}</p>}
      </div>
    </section>
  );
}
