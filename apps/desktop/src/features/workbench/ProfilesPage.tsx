import { Bot, Check, Cpu } from "lucide-react";
import type { Profile } from "@hermes-studio/bridge";

type ProfilesPageProps = {
  profiles: Profile[];
  currentProfile: Profile | null;
  onSelectProfile: (profileId: string) => void;
};

export function ProfilesPage({ profiles, currentProfile, onSelectProfile }: ProfilesPageProps) {
  return (
    <div className="workbench-page">
      <div className="main-top-title">Profiles</div>
      <header className="workbench-header">
        <div>
          <h1>Profiles</h1>
          <p>Long-lived Hermes identities with their own model, skills, memory, and working style.</p>
        </div>
        <button className="secondary-action" type="button" disabled>
          Create Profile
        </button>
      </header>

      <div className="entity-grid">
        {profiles.map((profile) => {
          const active = profile.id === currentProfile?.id;
          return (
            <button
              className={`entity-card ${active ? "entity-card-active" : ""}`}
              key={profile.id}
              type="button"
              onClick={() => onSelectProfile(profile.id)}
            >
              <div className="entity-card-top">
                <div className="entity-icon">
                  <Bot size={16} />
                </div>
                {active ? (
                  <span className="status-pill">
                    <Check size={12} />
                    Current
                  </span>
                ) : null}
              </div>
              <h2>{profile.name}</h2>
              <p>{profile.description}</p>
              <div className="entity-meta">
                <Cpu size={13} />
                <span>{profile.model}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
