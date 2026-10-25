import { useEffect, useRef, useState } from "react";
import type { AssetChangeSet, CharacterAsset } from "../../shared/asset-schema";
import { AssetTransfer } from './AssetTransfer';
import type { CharacterProject, CharacterVersion } from "../../shared/project-schema";
import {
  EXPRESSION_SIX,
  HUMAN_MODEL_CARD_COMPLEMENTS,
  isCanonicalRole,
  isStressTestRole,
  type AssetRole,
} from "../../shared/templates";
import type { PendingAsset } from "../App";
import { chooseBoardAssets } from "../delivery-readiness";
import { ImagePreviewDialog, type PreviewImage } from "./ImagePreviewDialog";
import { StateAssetEditor } from "./StateAssetEditor";
import { VersionTimeline } from "./VersionTimeline";

export type DerivedAssetRequest = {
  role: AssetRole;
  stateId: string;
  changeSet: AssetChangeSet;
  preferredParentRole: "face-front" | "body-front" | "half-neutral";
};

export type AssetWorkspaceTab = "model-card" | "expressions" | "wardrobe" | "action";

type Props = {
  project: CharacterProject;
  version: CharacterVersion;
  assets: CharacterAsset[];
  pendingResults: PendingAsset[];
  generating: boolean;
  onGenerate(requests: DerivedAssetRequest[]): void;
  onAccept(stateId: string): void;
  onReject(stateId: string): void;
  onRetry(stateId: string): void;
  onCreateIdentityVersion(): void;
  onOpenExports(): void;
  initialTab?: AssetWorkspaceTab;
};

function uniqueStateId(prefix: string, index = 0): string {
  return `${prefix}-${Date.now().toString(36)}${index ? `-${index + 1}` : ""}`;
}

export function AssetGroupWorkspace({
  project,
  version,
  assets,
  pendingResults,
  generating,
  onGenerate,
  onAccept,
  onReject,
  onRetry,
  onCreateIdentityVersion,
  onOpenExports,
  initialTab = "model-card",
}: Props) {
  const [tab, setTab] = useState<AssetWorkspaceTab>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);
  const [wardrobe, setWardrobe] = useState("");
  const [action, setAction] = useState("");
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);
  const registryOrderRef = useRef<string[]>([]);
  const derivedAssets = assets.filter((asset) =>
    asset.versionId === version.id && !isCanonicalRole(asset.role) && !isStressTestRole(asset.role));
  const derivedPendingResults = pendingResults.filter((pending) =>
    !isCanonicalRole(pending.role) && !isStressTestRole(pending.role) && Boolean(pending.stateId));
  const modelCardPendingResults = derivedPendingResults.filter((pending) =>
    pending.role.startsWith("model-card-"));
  const occupiedModelCardRoles = new Set([
    ...derivedAssets.filter((asset) => asset.role.startsWith("model-card-")).map((asset) => asset.role),
    ...modelCardPendingResults.map((pending) => pending.role),
  ]);
  const missingModelCardComplements = HUMAN_MODEL_CARD_COMPLEMENTS.filter((item) =>
    !occupiedModelCardRoles.has(item.role));
  const boardSelection = chooseBoardAssets(project, version, assets);
  const expressionPendingResults = derivedPendingResults.filter((pending) => pending.role === "expression");
  const occupiedExpressionInstructions = new Set([
    ...derivedAssets
      .filter((asset) => asset.role === "expression" && asset.status === "ready")
      .map((asset) => asset.changeSet.instruction),
    ...expressionPendingResults
      .map((pending) => pending.changeSet?.instruction)
      .filter((instruction): instruction is string => Boolean(instruction)),
  ]);
  const missingExpressionPresets = EXPRESSION_SIX.filter((item) =>
    !occupiedExpressionInstructions.has(item.instruction));
  const modelCardReady = derivedAssets.filter((asset) => asset.role.startsWith("model-card-")).length;
  const expressionReady = derivedAssets.filter((asset) => asset.role === "expression").length;
  const wardrobeReady = derivedAssets.filter((asset) => asset.role === "wardrobe-state").length;
  const actionReady = derivedAssets.filter((asset) => asset.role === "action-reference").length;
  const recentAssets = [...derivedAssets].reverse().slice(0, 6);
  const entriesByStateId = new Map<string, { asset?: CharacterAsset; pending?: PendingAsset }>();
  for (const asset of derivedAssets) entriesByStateId.set(asset.stateId, { asset });
  for (const pending of derivedPendingResults) {
    entriesByStateId.set(pending.stateId!, {
      ...entriesByStateId.get(pending.stateId!),
      pending,
    });
  }
  registryOrderRef.current = registryOrderRef.current.filter((stateId) => entriesByStateId.has(stateId));
  for (const stateId of entriesByStateId.keys()) {
    if (!registryOrderRef.current.includes(stateId)) registryOrderRef.current.push(stateId);
  }
  const registryEntries = registryOrderRef.current.map((stateId) => ({
    stateId,
    ...entriesByStateId.get(stateId)!,
  }));

  function generateModelCard(): void {
    const batch = Date.now().toString(36);
    onGenerate(missingModelCardComplements.map((item) => {
      const index = HUMAN_MODEL_CARD_COMPLEMENTS.indexOf(item);
      const stateId = `model-card-${item.stateKey}-${batch}-${index + 1}`;
      return {
        role: item.role,
        stateId,
        changeSet: {
          category: item.role === "model-card-side-action" ? "action" as const : "camera" as const,
          instruction: item.instruction,
          sourceStateId: "base",
          targetStateId: stateId,
        },
        preferredParentRole: index < 2 ? "face-front" as const : "body-front" as const,
      };
    }));
  }

  function generateExpressions(): void {
    const batch = Date.now().toString(36);
    onGenerate(missingExpressionPresets.map((item) => {
      const index = EXPRESSION_SIX.indexOf(item);
      const stateId = `expression-${item.stateKey}-${batch}-${index + 1}`;
      return {
        role: "expression",
        stateId,
        changeSet: {
          category: "expression",
          instruction: item.instruction,
          sourceStateId: "base",
          targetStateId: stateId,
        },
        preferredParentRole: "half-neutral",
      };
    }));
  }

  function generateSingle(
    role: "wardrobe-state" | "action-reference",
    category: "wardrobe" | "action",
    instruction: string,
  ): void {
    const prefix = category === "wardrobe" ? "wardrobe" : "action";
    const stateId = uniqueStateId(prefix);
    onGenerate([{
      role,
      stateId,
      changeSet: {
        category,
        instruction: instruction.trim(),
        sourceStateId: "base",
        targetStateId: stateId,
      },
      preferredParentRole: "body-front",
    }]);
  }

  return (
    <div className="asset-production-layout">
      <section className="asset-workspace workflow-panel" aria-labelledby="asset-workspace-title">
        <header className="workflow-header asset-workspace-header">
          <div>
            <p className="kicker">STEP 3 · MAKE & DOWNLOAD</p>
            <h2 id="asset-workspace-title">接下来想制作什么？</h2>
          </div>
          <div className="locked-version-chip">
            <span>标准形象已锁定</span>
            <strong>{project.displayName} · {version.id}</strong>
          </div>
        </header>

        {project.mode === "realistic-virtual-character" && (
          <section className="delivery-readiness-panel" aria-label="交付素材进度">
            <div>
              <p className="kicker">DELIVERY READINESS</p>
              <h3>交付素材进度</h3>
              <div className="delivery-readiness-summary">
                <div className="delivery-readiness-item">
                  <span>下游模型调用</span>
                  <strong>模型参考包已就绪</strong>
                </div>
                <div className="delivery-readiness-item">
                  <span>展示板必需素材</span>
                  <strong>
                    展示板素材 {boardSelection.baseReady + boardSelection.expressionReady}/
                    {boardSelection.baseRequired + boardSelection.expressionRequired}
                  </strong>
                  <small>
                    六种表情：已完成 {boardSelection.expressionReady}/{boardSelection.expressionRequired}
                  </small>
                </div>
              </div>
            </div>
            {boardSelection.expressionReady < boardSelection.expressionRequired ? (
              <button className="delivery-readiness-action" type="button" onClick={() => setTab("expressions")}>
                去制作六种表情
              </button>
            ) : (
              <span className="delivery-ready-mark">展示板表情素材已齐</span>
            )}
          </section>
        )}

        <nav className="studio-action-grid" aria-label="角色素材工作台">
          <button type="button" aria-label="五张模卡" aria-pressed={tab === "model-card"} onClick={() => setTab("model-card")}>
            <span aria-hidden="true">▣</span><strong>五张模卡</strong><small>{modelCardReady}/4 张补图已确认</small>
          </button>
          <button type="button" aria-label="六种表情" aria-pressed={tab === "expressions"} onClick={() => setTab("expressions")}>
            <span aria-hidden="true">☺</span><strong>六种表情</strong><small>{expressionReady}/6 张已确认</small>
          </button>
          <button type="button" aria-label="更换服装" aria-pressed={tab === "wardrobe"} onClick={() => setTab("wardrobe")}>
            <span aria-hidden="true">◇</span><strong>更换服装</strong><small>已有 {wardrobeReady} 个造型</small>
          </button>
          <button type="button" aria-label="制作动作" aria-pressed={tab === "action"} onClick={() => setTab("action")}>
            <span aria-hidden="true">↗</span><strong>制作动作</strong><small>已有 {actionReady} 个动作</small>
          </button>
          <button className="export-action-card" aria-label="下载与发送" type="button" onClick={onOpenExports}>
            <span aria-hidden="true">↓</span><strong>下载与发送</strong><small>展示板、图片与参考包</small>
          </button>
        </nav>

        <div className="asset-generator-body">
          {tab === "model-card" && (
            <section className="preset-panel">
              <div><p className="kicker">MODEL CARD</p><h3>标准五张模卡</h3></div>
              <p>复用已批准正脸锚点，再补自然肖像、半身、全身与侧面轻动作。每张独立审核。</p>
              <ol>{HUMAN_MODEL_CARD_COMPLEMENTS.map((item) => <li key={item.stateKey}>{item.instruction}</li>)}</ol>
              <button
                className="primary-action"
                type="button"
                disabled={generating || missingModelCardComplements.length === 0}
                onClick={generateModelCard}
              >
                {generating
                  ? "正在生成…"
                  : missingModelCardComplements.length > 0
                    ? `生成 ${missingModelCardComplements.length} 张模卡补图`
                    : modelCardPendingResults.length > 0
                      ? "请审核或重试当前结果"
                      : "模卡补图已齐备"}<b aria-hidden="true">↗</b>
              </button>
            </section>
          )}

          {tab === "expressions" && (
            <section className="preset-panel">
              <div><p className="kicker">EXPRESSION RANGE / 6 ASSETS</p><h3>六种基础表情</h3></div>
              <p>生成正面胸口以上表情肖像，完整保留头顶、脸部与肩部；只改变表情强度，身份、发型、服装、背景、光线和机位保持稳定。</p>
              <ol>{EXPRESSION_SIX.map((item) => <li key={item.stateKey}>{item.instruction}</li>)}</ol>
              <button
                className="primary-action"
                type="button"
                disabled={generating || missingExpressionPresets.length === 0}
                onClick={generateExpressions}
              >
                {generating
                  ? "正在生成…"
                  : missingExpressionPresets.length > 0
                    ? `生成 ${missingExpressionPresets.length} 种缺失表情`
                    : expressionPendingResults.length > 0
                      ? "请审核或重试当前结果"
                      : "六种表情已齐备"}<b aria-hidden="true">↗</b>
              </button>
            </section>
          )}

          {tab === "wardrobe" && (
            <StateAssetEditor
              title="更换服装"
              description="描述新造型，人物身份和身材比例会保持不变。"
              value={wardrobe}
              placeholder="例如：米白色西装"
              buttonLabel="生成 1 张服装状态"
              generating={generating}
              onChange={setWardrobe}
              onGenerate={() => generateSingle("wardrobe-state", "wardrobe", wardrobe)}
            />
          )}

          {tab === "action" && (
            <StateAssetEditor
              title="制作动作参考"
              description="只改变姿态和动作，人物身份、身体比例和当前服装保持不变。"
              value={action}
              placeholder="例如：自然向前行走"
              buttonLabel="生成 1 张动作参考"
              generating={generating}
              onChange={setAction}
              onGenerate={() => generateSingle("action-reference", "action", action)}
            />
          )}
        </div>

        {registryEntries.length > 0 && (
          <section className="derived-registry" aria-label="派生资产审核与登记">
            <header><strong>待确认与已完成素材</strong><span>{derivedAssets.length} 已确认 / {derivedPendingResults.length} 待确认</span></header>
            <div className="asset-review-grid" aria-live="polite">
              {registryEntries.map(({ stateId, asset, pending }) => {
                const accepted = Boolean(asset && !pending);
                const role = pending?.role ?? asset!.role;
                const imageSrc = pending?.status === "ready" && pending.result
                  ? `data:image/png;base64,${pending.result.imageB64}`
                  : accepted
                    ? `/api/character/projects/${encodeURIComponent(project.id)}/assets/${encodeURIComponent(asset!.id)}`
                    : "";
                const imageAlt = accepted ? `${stateId} 已确认资产` : `${stateId} 生成结果`;
                return (
                  <article
                    className="asset-review-card"
                    key={stateId}
                    aria-label={`${stateId} 派生资产审核槽位`}
                  >
                    <div className={`asset-frame${imageSrc ? "" : " is-placeholder"}`}>
                      {imageSrc ? (
                        <button
                          type="button"
                          className="asset-preview-trigger"
                          aria-label={`放大查看${imageAlt}`}
                          onClick={() => setPreviewImage({ src: imageSrc, alt: imageAlt })}
                        >
                          <img className="asset-review-image" src={imageSrc} alt={imageAlt} />
                        </button>
                      ) : pending?.status === "failed" ? (
                        <div className="asset-failure-state">
                          <p>{pending.error ?? "生成失败"}</p>
                          <button
                            type="button"
                            disabled={generating}
                            onClick={() => onRetry(stateId)}
                          >
                            仅重试{pending.role} · 1 次调用
                          </button>
                        </div>
                      ) : (
                        <div className="generating-mark"><span />正在生成 {stateId}</div>
                      )}
                      {accepted && (
                        <div className="accepted-asset-overlay" aria-hidden="true">
                          <span>✓</span><strong>已确认</strong>
                        </div>
                      )}
                    </div>
                    {accepted && asset && <AssetTransfer projectId={project.id} versionId={asset.versionId} assetId={asset.id} />}
                    <footer>
                      <div><strong>{role}</strong><small>{stateId}</small></div>
                      {pending?.status === "ready" && (
                        <div className="review-actions">
                          <button type="button" onClick={() => onReject(stateId)}>不满意</button>
                          <button className="accept-button" type="button" onClick={() => onAccept(stateId)}>确认使用</button>
                        </div>
                      )}
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        {recentAssets.length > 0 && (
          <section className="recent-assets" aria-labelledby="recent-assets-title">
            <header><div><p className="kicker">RECENT</p><h3 id="recent-assets-title">最近完成</h3></div><span>{derivedAssets.length} 个素材</span></header>
            <div>{recentAssets.map((asset) => <button key={asset.id} type="button" onClick={() => setPreviewImage({ src: `/api/character/projects/${encodeURIComponent(project.id)}/assets/${encodeURIComponent(asset.id)}`, alt: asset.changeSet.instruction || asset.role })}><img src={`/api/character/projects/${encodeURIComponent(project.id)}/assets/${encodeURIComponent(asset.id)}`} alt={asset.changeSet.instruction || asset.role} /><small>{asset.changeSet.instruction || asset.role}</small></button>)}</div>
          </section>
        )}
        <footer className="delivery-launch">
          <div><p className="kicker">READY TO SHARE</p><strong>把已确认素材整理为展示板或模型参考包</strong></div>
          <button className="primary-action" type="button" onClick={onOpenExports}>
            打开下载与发送 <b aria-hidden="true">↗</b>
          </button>
        </footer>
        <details className="character-management">
          <summary>角色管理 <small>版本、历史与身份修改</small></summary>
          <button className="identity-change-button" type="button" onClick={() => setIdentityDialogOpen(true)}>修改身份特征并创建新版本</button>
          <VersionTimeline project={project} assets={assets} />
        </details>
      </section>

      {identityDialogOpen && (
        <dialog className="identity-version-dialog" open aria-labelledby="identity-dialog-title">
          <p className="kicker">IDENTITY CHANGE DETECTED</p>
          <h2 id="identity-dialog-title">将创建 v{project.versions.length + 1}</h2>
          <p>{version.id} 不会被覆盖。新身份会从当前描述继承，但必须重新建立锚点并通过三项压力测试。</p>
          <div>
            <button type="button" onClick={() => setIdentityDialogOpen(false)}>取消</button>
            <button className="primary-action" type="button" onClick={() => {
              setIdentityDialogOpen(false);
              onCreateIdentityVersion();
            }}>创建身份新版本 <b aria-hidden="true">↗</b></button>
          </div>
        </dialog>
      )}
      <ImagePreviewDialog image={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
