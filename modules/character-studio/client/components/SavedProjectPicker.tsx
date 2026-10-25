import type { CharacterProject } from "../../shared/project-schema";

type Props = {
  projects: CharacterProject[];
  onOpen(projectId: string): void;
};

export function SavedProjectPicker({ projects, onOpen }: Props) {
  if (!projects.length) return null;
  return (
    <section className="saved-projects" aria-labelledby="saved-projects-title">
      <header>
        <div><p className="kicker">LOCAL PROJECTS</p><h2 id="saved-projects-title">继续本地角色项目</h2></div>
        <span>{projects.length} 个可重开项目</span>
      </header>
      <div>
        {projects.map((project) => {
          const version = project.versions.find((item) => item.id === project.currentVersionId);
          return (
            <article key={project.id}>
              <div><strong>{project.title}</strong><small>{project.characterTag}-{project.currentVersionId}</small></div>
              <span>{version?.status.toUpperCase()} · {project.assets.length} ASSETS</span>
              <button type="button" onClick={() => onOpen(project.id)}>打开 {project.title}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
