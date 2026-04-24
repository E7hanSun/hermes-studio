import { useEffect, useMemo, useState } from "react";
import type { AppInfo, Profile, Space } from "@hermes-studio/bridge";
import { AppShell } from "@/components/shell/AppShell";
import { ActiveConversation } from "@/features/conversation/ActiveConversation";
import type { ComposerProps } from "@/components/composer/Composer";
import { emptyConversation, reduceConversationEvent, type ConversationState } from "@/features/conversation/conversation-state";
import { ConversationHome } from "@/features/conversation/ConversationHome";
import { mockConversations } from "@/mocks/conversations";

export type ViewMode = "home" | "active" | "memory" | "skills" | "scheduled-jobs" | "spaces" | "profiles" | "settings";

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [draft, setDraft] = useState("");
  const [conversation, setConversation] = useState<ConversationState>(emptyConversation);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);

  useEffect(() => {
    async function loadInitialData(): Promise<void> {
      if (!window.hermesStudio) {
        return;
      }

      const [info, profileList, spaceList, profile, space] = await Promise.all([
        window.hermesStudio.app.getInfo(),
        window.hermesStudio.profiles.list(),
        window.hermesStudio.spaces.list(),
        window.hermesStudio.profiles.getCurrent(),
        window.hermesStudio.spaces.getCurrent()
      ]);

      setAppInfo(info);
      setProfiles(profileList);
      setSpaces(spaceList);
      setCurrentProfile(profile);
      setCurrentSpace(space);
    }

    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!window.hermesStudio) {
      return undefined;
    }

    return window.hermesStudio.runtime.onEvent((event) => {
      setConversation((current) => reduceConversationEvent(current, event));
      setViewMode("active");
    });
  }, []);

  const model = currentProfile?.model ?? "GPT-5.4 Mini";

  const composerProps = useMemo(
    () => ({
      value: draft,
      profile: currentProfile?.name ?? "coder",
      space: currentSpace?.name ?? "Home",
      model,
      onChange: setDraft,
      onSubmit: async () => {
        const text = draft.trim();
        if (!text || !currentProfile || !currentSpace) {
          return;
        }

        setViewMode("active");
        if (window.hermesStudio) {
          await window.hermesStudio.runtime.sendMessage({
            text,
            profileId: currentProfile.id,
            spaceId: currentSpace.id,
            model
          });
        }
        setDraft("");
      }
    }),
    [currentProfile, currentSpace, draft, model]
  );

  return (
    <AppShell
      appInfo={appInfo}
      conversations={mockConversations}
      activeView={viewMode}
      onNewConversation={() => setViewMode("home")}
      onNavigate={setViewMode}
    >
      {viewMode === "home" ? (
        <ConversationHome
          composer={composerProps}
          hermesVersion={appInfo?.hermesVersion.ref ?? "v2026.4.23"}
          onUseSuggestion={setDraft}
        />
      ) : (
        renderActiveView(viewMode, composerProps, conversation, profiles, spaces)
      )}
    </AppShell>
  );
}

function renderActiveView(
  viewMode: ViewMode,
  composer: ComposerProps,
  conversation: ConversationState,
  profiles: Profile[],
  spaces: Space[]
) {
  if (viewMode === "active") {
    return <ActiveConversation composer={composer} conversation={conversation} profiles={profiles} spaces={spaces} />;
  }

  return <PlaceholderPage viewMode={viewMode as Exclude<ViewMode, "home" | "active">} />;
}

function PlaceholderPage({ viewMode }: { viewMode: Exclude<ViewMode, "home" | "active"> }) {
  const labels: Record<typeof viewMode, { title: string; description: string }> = {
    memory: {
      title: "Personal Memory",
      description: "My Notes and User Profile will share a lightweight knowledge-base layout here."
    },
    skills: {
      title: "Skills",
      description: "Installed skills, browse/search, and current profile enablement will live here."
    },
    "scheduled-jobs": {
      title: "Scheduled Jobs",
      description: "Active jobs, paused jobs, recent runs, and create-job flows will live here."
    },
    spaces: {
      title: "Spaces",
      description: "Local folders, git branches, and current workspace context will live here."
    },
    profiles: {
      title: "Profiles",
      description: "Long-lived Hermes identities, models, skills, and profile actions will live here."
    },
    settings: {
      title: "Settings",
      description: "Model provider, permissions, display, voice, doctor, logs, and advanced config will live here."
    }
  };

  return (
    <div className="placeholder-page">
      <div className="main-top-title">{labels[viewMode].title}</div>
      <section>
        <h1>{labels[viewMode].title}</h1>
        <p>{labels[viewMode].description}</p>
      </section>
    </div>
  );
}
