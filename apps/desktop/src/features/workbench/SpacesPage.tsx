import { Check, Folder, GitBranch, Plus } from "lucide-react";
import type { Space } from "@hermes-studio/bridge";

type SpacesPageProps = {
  spaces: Space[];
  currentSpace: Space | null;
  onSelectSpace: (spaceId: string) => void;
};

export function SpacesPage({ spaces, currentSpace, onSelectSpace }: SpacesPageProps) {
  return (
    <div className="workbench-page">
      <div className="main-top-title">Spaces</div>
      <header className="workbench-header">
        <div>
          <h1>Spaces</h1>
          <p>Local folders and project contexts Hermes can operate inside.</p>
        </div>
        <button className="secondary-action" type="button" disabled>
          <Plus size={14} />
          Add Folder
        </button>
      </header>

      <div className="entity-list">
        {spaces.map((space) => {
          const active = space.id === currentSpace?.id;
          return (
            <button
              className={`entity-row ${active ? "entity-row-active" : ""}`}
              key={space.id}
              type="button"
              onClick={() => onSelectSpace(space.id)}
            >
              <div className="entity-icon">
                <Folder size={16} />
              </div>
              <div className="entity-row-main">
                <div className="entity-row-title">
                  <span>{space.name}</span>
                  {active ? (
                    <span className="status-pill">
                      <Check size={12} />
                      Current
                    </span>
                  ) : null}
                </div>
                <p>{space.path}</p>
              </div>
              <div className="entity-row-side">
                {space.gitBranch ? (
                  <span>
                    <GitBranch size={13} />
                    {space.gitBranch}
                  </span>
                ) : (
                  <span>No git branch</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
