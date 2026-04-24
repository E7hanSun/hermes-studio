import { FormEvent, useState } from "react";
import { Check, Folder, Plus, X } from "lucide-react";
import type { Space } from "@hermes-studio/bridge";

type SpacesPageProps = {
  spaces: Space[];
  currentSpace: Space | null;
  onSelectSpace: (spaceId: string) => void;
  onAddSpace: (path: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onRemoveSpace: (spaceId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export function SpacesPage({ spaces, currentSpace, onAddSpace, onRemoveSpace, onSelectSpace }: SpacesPageProps) {
  const [workspacePath, setWorkspacePath] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const result = await onAddSpace(workspacePath);

    if (result.ok) {
      setWorkspacePath("");
      setFeedback("Workspace added and selected.");
    } else {
      setFeedback(result.error);
    }

    setIsSaving(false);
  }

  async function handleRemove(spaceId: string): Promise<void> {
    setFeedback(null);
    const result = await onRemoveSpace(spaceId);

    if (!result.ok) {
      setFeedback(result.error);
    }
  }

  return (
    <div className="workbench-page">
      <div className="main-top-title">Spaces</div>
      <header className="workbench-header">
        <div>
          <h1>Spaces</h1>
          <p>Add and switch workspaces for your sessions.</p>
        </div>
      </header>

      <div className="workspace-panel">
        <div className="entity-list">
          {spaces.map((space) => {
            const active = space.id === currentSpace?.id;

            return (
              <div className={`entity-row workspace-row ${active ? "entity-row-active" : ""}`} key={space.id}>
                <div className="entity-icon">
                  <Folder size={16} />
                </div>
                <button className="workspace-row-main" type="button" onClick={() => onSelectSpace(space.id)}>
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
                </button>
                <div className="workspace-actions">
                  {!active ? (
                    <button className="secondary-action compact-action" type="button" onClick={() => onSelectSpace(space.id)}>
                      Use
                    </button>
                  ) : null}
                  <button className="icon-action" type="button" aria-label={`Remove ${space.name}`} onClick={() => void handleRemove(space.id)}>
                    <X size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <form className="workspace-form" onSubmit={(event) => void handleSubmit(event)}>
          <input
            aria-label="Workspace path"
            className="workspace-input"
            placeholder="Add workspace path, e.g. /Users/ember/code"
            type="text"
            value={workspacePath}
            onChange={(event) => setWorkspacePath(event.target.value)}
          />
          <button className="primary-action" disabled={isSaving} type="submit">
            <Plus size={14} />
            Add
          </button>
        </form>

        <p className={feedback?.includes("added") ? "form-feedback form-feedback-success" : "form-feedback"}>
          {feedback ?? "Paths are validated as existing directories before saving."}
        </p>
      </div>
    </div>
  );
}
