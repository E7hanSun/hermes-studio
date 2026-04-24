import { useEffect, useMemo, useState } from "react";
import { Check, FileText, Save } from "lucide-react";
import type { MemoryDocument, MemoryDocumentKey } from "@hermes-studio/bridge";

const MEMORY_LIMITS: Record<MemoryDocumentKey, number> = {
  notes: 2200,
  profile: 1375
};

type PersonalMemoryPageProps = {
  documents: MemoryDocument[];
  activeDocumentKey: MemoryDocumentKey;
  onSelectDocument: (key: MemoryDocumentKey) => void;
  onSaveDocument: (key: MemoryDocumentKey, content: string) => Promise<MemoryDocument | null>;
};

export function PersonalMemoryPage({ activeDocumentKey, documents, onSaveDocument, onSelectDocument }: PersonalMemoryPageProps) {
  const activeDocument = documents.find((document) => document.key === activeDocumentKey) ?? documents[0];
  const [draft, setDraft] = useState(activeDocument?.content ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    setDraft(activeDocument?.content ?? "");
    setStatus("idle");
  }, [activeDocument?.content, activeDocument?.key]);

  const limit = activeDocument ? MEMORY_LIMITS[activeDocument.key] : 0;
  const usage = limit > 0 ? Math.min(100, Math.round((draft.length / limit) * 100)) : 0;
  const entries = useMemo(() => draft.split("§").map((entry) => entry.trim()).filter(Boolean), [draft]);
  const isOverLimit = draft.length > limit;
  const isDirty = activeDocument ? draft !== activeDocument.content : false;

  async function handleSave(): Promise<void> {
    if (!activeDocument || isOverLimit || !isDirty) {
      return;
    }

    setStatus("saving");
    const updatedDocument = await onSaveDocument(activeDocument.key, draft);
    setStatus(updatedDocument ? "saved" : "idle");
  }

  return (
    <div className="workbench-page">
      <div className="main-top-title">Personal Memory</div>
      <header className="workbench-header">
        <div>
          <h1>Personal Memory</h1>
          <p>Curated Hermes memory files stored under ~/.hermes/memories and loaded at session start.</p>
        </div>
        <button className="primary-action" disabled={!isDirty || isOverLimit || status === "saving"} type="button" onClick={() => void handleSave()}>
          <Save size={14} />
          {status === "saving" ? "Saving" : "Save"}
        </button>
      </header>

      <div className="memory-layout">
        <aside className="memory-document-list">
          {documents.map((document) => {
            const documentLimit = MEMORY_LIMITS[document.key];
            const documentUsage = Math.round((document.content.length / documentLimit) * 100);
            const active = document.key === activeDocument?.key;

            return (
              <button
                className={`memory-document-card ${active ? "memory-document-card-active" : ""}`}
                key={document.key}
                type="button"
                onClick={() => onSelectDocument(document.key)}
              >
                <span className="entity-icon">
                  <FileText size={16} />
                </span>
                <strong>{document.title}</strong>
                <span>{document.fileName}</span>
                <span>{document.content.length}/{documentLimit} chars · {documentUsage}%</span>
              </button>
            );
          })}
        </aside>

        {activeDocument ? (
          <section className="memory-editor-panel">
            <div className="memory-editor-header">
              <div>
                <h2>{activeDocument.title}</h2>
                <p>{activeDocument.description}</p>
              </div>
              <div className="memory-file-meta">
                <span>{activeDocument.fileName}</span>
                <span>{activeDocument.path}</span>
              </div>
            </div>

            <div className="memory-usage-row">
              <span>{draft.length}/{limit} chars</span>
              <span>{entries.length} entries</span>
              <span>{usage}% full</span>
              {status === "saved" ? (
                <span className="memory-saved">
                  <Check size={13} />
                  Saved
                </span>
              ) : null}
            </div>
            <div className="memory-usage-bar" aria-hidden="true">
              <span style={{ width: `${usage}%` }} />
            </div>

            <textarea
              className={`memory-textarea ${isOverLimit ? "memory-textarea-error" : ""}`}
              spellCheck={false}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setStatus("idle");
              }}
            />

            <p className={isOverLimit ? "form-feedback form-feedback-error" : "form-feedback"}>
              {isOverLimit
                ? `This file is ${draft.length - limit} characters over the Hermes limit.`
                : "Separate memory entries with §. Changes are persisted but only appear in new Hermes sessions."}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
