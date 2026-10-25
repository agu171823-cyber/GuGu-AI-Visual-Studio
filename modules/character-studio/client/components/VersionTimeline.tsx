import type { CharacterAsset } from "../../shared/asset-schema";
import type { CharacterProject } from "../../shared/project-schema";
import { isCanonicalRole, isStressTestRole } from "../../shared/templates";

type Props = {
  project: CharacterProject;
  assets: CharacterAsset[];
};

export function VersionTimeline({ project, assets }: Props) {
  return (
    <aside className="version-timeline" aria-label="身份版本时间线">
      <header>
        <p className="kicker">VERSION LINEAGE</p>
        <h3>身份版本</h3>
      </header>
      <ol>
        {project.versions.map((version) => {
          const versionAssets = assets.filter((asset) => asset.versionId === version.id);
          const canonicalCount = versionAssets.filter((asset) => isCanonicalRole(asset.role)).length;
          const derivedCount = versionAssets.filter((asset) =>
            !isCanonicalRole(asset.role) && !isStressTestRole(asset.role)).length;
          const passed = version.stressTests.filter((result) => result.passed).length;
          return (
            <li key={version.id} className={version.id === project.currentVersionId ? "current" : ""}>
              <div className="version-node" aria-hidden="true" />
              <div>
                <strong>{version.id} · {version.status.toUpperCase()}</strong>
                <small>{version.createdFromVersionId ? `源自 ${version.createdFromVersionId}` : "初始身份版本"}</small>
              </div>
              <dl>
                <div><dt>规范视图</dt><dd>{canonicalCount}/6</dd></div>
                <div><dt>压力测试</dt><dd>{passed}/3</dd></div>
                <div><dt>派生资产</dt><dd>{derivedCount}</dd></div>
              </dl>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
