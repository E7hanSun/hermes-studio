import { useMemo, useState } from "react";
import { Check, Download, ExternalLink, Search, ShieldCheck, Sparkles } from "lucide-react";
import type { HubSkill, InstalledSkill, SkillSource } from "@hermes-studio/bridge";

type SkillSelection =
  | { kind: "installed"; skill: InstalledSkill }
  | { kind: "hub"; skill: HubSkill }
  | null;

type SkillsPageProps = {
  hubSkills: HubSkill[];
  installedSkills: InstalledSkill[];
  selectedSkill: SkillSelection;
  onInstallHubSkill: (skillId: string) => Promise<void>;
  onSearchHub: (query: string, source: SkillSource | "all") => void;
  onSelectSkill: (selection: SkillSelection) => void;
  onSetEnabled: (skillId: string, enabled: boolean) => void;
};

const hubSources: Array<{ label: string; value: SkillSource | "all" }> = [
  { label: "All", value: "all" },
  { label: "Official", value: "official" },
  { label: "skills.sh", value: "skills-sh" },
  { label: "GitHub", value: "github" },
  { label: "Well-known", value: "well-known" },
  { label: "Community", value: "community" }
];

export function SkillsPage({
  hubSkills,
  installedSkills,
  selectedSkill,
  onInstallHubSkill,
  onSearchHub,
  onSelectSkill,
  onSetEnabled
}: SkillsPageProps) {
  const [activeTab, setActiveTab] = useState<"installed" | "hub">("installed");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SkillSource | "all">("all");

  const enabledCount = installedSkills.filter((skill) => skill.enabled).length;
  const visibleInstalledSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (activeTab !== "installed" || !normalizedQuery) {
      return installedSkills;
    }

    return installedSkills.filter((skill) =>
      [skill.name, skill.description, skill.category, skill.source, ...skill.tags].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [activeTab, installedSkills, query]);

  function handleSearch(nextQuery = query, nextSource = source): void {
    setQuery(nextQuery);
    setSource(nextSource);

    if (activeTab === "hub") {
      onSearchHub(nextQuery, nextSource);
    }
  }

  return (
    <div className="workbench-page">
      <div className="main-top-title">Skills</div>
      <header className="workbench-header">
        <div>
          <h1>Skills</h1>
          <p>Manage installed Hermes skills and add new capabilities from the official Skill Hub.</p>
        </div>
      </header>

      <div className="skills-layout">
        <section className="skills-main-panel">
          <div className="skills-toolbar">
            <div className="segmented-control" role="tablist" aria-label="Skill sections">
              <button className={activeTab === "installed" ? "segmented-active" : ""} type="button" onClick={() => setActiveTab("installed")}>
                Installed
              </button>
              <button
                className={activeTab === "hub" ? "segmented-active" : ""}
                type="button"
                onClick={() => {
                  setActiveTab("hub");
                  onSearchHub(query, source);
                }}
              >
                Skill Hub
              </button>
            </div>

            <label className="skills-search">
              <Search size={14} />
              <input
                placeholder={activeTab === "hub" ? "Search hub skills..." : "Filter installed skills..."}
                type="text"
                value={query}
                onChange={(event) => handleSearch(event.target.value, source)}
              />
            </label>

            {activeTab === "hub" ? (
              <select className="skills-source-select" value={source} onChange={(event) => handleSearch(query, event.target.value as SkillSource | "all")}>
                {hubSources.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="skills-stats">
            <span>{installedSkills.length} installed</span>
            <span>{enabledCount} enabled</span>
            <span>{hubSkills.length} hub results</span>
          </div>

          {activeTab === "installed" ? (
            <div className="skill-list">
              {visibleInstalledSkills.map((skill) => (
                <InstalledSkillRow
                  active={selectedSkill?.kind === "installed" && selectedSkill.skill.id === skill.id}
                  key={skill.id}
                  skill={skill}
                  onSelect={() => onSelectSkill({ kind: "installed", skill })}
                  onSetEnabled={(enabled) => onSetEnabled(skill.id, enabled)}
                />
              ))}
            </div>
          ) : (
            <div className="skill-list">
              {hubSkills.map((skill) => (
                <HubSkillRow
                  active={selectedSkill?.kind === "hub" && selectedSkill.skill.id === skill.id}
                  key={skill.id}
                  skill={skill}
                  onInstall={() => void onInstallHubSkill(skill.id)}
                  onSelect={() => onSelectSkill({ kind: "hub", skill })}
                />
              ))}
            </div>
          )}
        </section>

        <SkillDetail selection={selectedSkill ?? defaultSelection(installedSkills, hubSkills)} />
      </div>
    </div>
  );
}

function InstalledSkillRow({
  active,
  skill,
  onSelect,
  onSetEnabled
}: {
  active: boolean;
  skill: InstalledSkill;
  onSelect: () => void;
  onSetEnabled: (enabled: boolean) => void;
}) {
  return (
    <article className={`skill-row ${active ? "skill-row-active" : ""}`}>
      <button className="skill-row-main" type="button" onClick={onSelect}>
        <div className="skill-row-title">
          <Sparkles size={15} />
          <strong>{skill.name}</strong>
          <span>{skill.source}</span>
        </div>
        <p>{skill.description}</p>
        <div className="skill-tag-row">
          <span>{skill.category}</span>
          <span>{skill.slashCommand}</span>
          <span>{skill.trustLevel}</span>
        </div>
      </button>
      <label className="toggle-control">
        <input checked={skill.enabled} type="checkbox" onChange={(event) => onSetEnabled(event.target.checked)} />
        <span>{skill.enabled ? "Enabled" : "Off"}</span>
      </label>
    </article>
  );
}

function HubSkillRow({
  active,
  skill,
  onInstall,
  onSelect
}: {
  active: boolean;
  skill: HubSkill;
  onInstall: () => void;
  onSelect: () => void;
}) {
  return (
    <article className={`skill-row ${active ? "skill-row-active" : ""}`}>
      <button className="skill-row-main" type="button" onClick={onSelect}>
        <div className="skill-row-title">
          <Sparkles size={15} />
          <strong>{skill.name}</strong>
          <span>{skill.source}</span>
        </div>
        <p>{skill.description}</p>
        <div className="skill-tag-row">
          <span>{skill.category}</span>
          <span>{skill.trustLevel}</span>
          <span>{skill.securityStatus}</span>
        </div>
      </button>
      <button className="secondary-action compact-action" disabled={skill.installed || skill.securityStatus === "blocked"} type="button" onClick={onInstall}>
        {skill.installed ? <Check size={14} /> : <Download size={14} />}
        {skill.installed ? "Installed" : "Add"}
      </button>
    </article>
  );
}

function SkillDetail({ selection }: { selection: SkillSelection }) {
  if (!selection) {
    return (
      <aside className="skill-detail-panel">
        <h2>No skill selected</h2>
        <p>Select an installed skill or hub result to preview its SKILL.md metadata.</p>
      </aside>
    );
  }

  const skill = selection.skill;
  const installed = selection.kind === "installed";
  const tags = skill.tags.join(", ");

  return (
    <aside className="skill-detail-panel">
      <div className="skill-detail-heading">
        <div>
          <h2>{skill.name}</h2>
          <p>{skill.description}</p>
        </div>
        <span className="status-pill">
          <ShieldCheck size={12} />
          {skill.trustLevel}
        </span>
      </div>

      <div className="key-value skill-key-value">
        <span>Source</span>
        <strong>{skill.source}</strong>
      </div>
      <div className="key-value skill-key-value">
        <span>Category</span>
        <strong>{skill.category}</strong>
      </div>
      <div className="key-value skill-key-value">
        <span>{installed ? "Path" : "Command"}</span>
        <strong>{installed ? (skill as InstalledSkill).path : (skill as HubSkill).installCommand}</strong>
      </div>
      <div className="key-value skill-key-value">
        <span>{installed ? "Slash" : "Installs"}</span>
        <strong>{installed ? (skill as InstalledSkill).slashCommand : `${(skill as HubSkill).weeklyInstalls ?? 0}/week`}</strong>
      </div>
      <div className="key-value skill-key-value">
        <span>Tags</span>
        <strong>{tags || "none"}</strong>
      </div>

      <div className="skill-preview-heading">
        <span>SKILL.md Preview</span>
        <ExternalLink size={13} />
      </div>
      <pre className="skill-preview">{skill.contentPreview}</pre>
    </aside>
  );
}

function defaultSelection(installedSkills: InstalledSkill[], hubSkills: HubSkill[]): SkillSelection {
  if (installedSkills[0]) {
    return { kind: "installed", skill: installedSkills[0] };
  }

  if (hubSkills[0]) {
    return { kind: "hub", skill: hubSkills[0] };
  }

  return null;
}
