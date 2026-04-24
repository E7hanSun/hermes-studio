import { useEffect, useMemo, useState } from "react";
import type { AppInfo, MemoryDocument, MemoryDocumentKey, Profile, RuntimeStatus, Settings, Space } from "@hermes-studio/bridge";
import { AppShell } from "@/components/shell/AppShell";
import { ActiveConversation } from "@/features/conversation/ActiveConversation";
import type { ComposerProps } from "@/components/composer/Composer";
import { emptyConversation, reduceConversationEvent, type ConversationState } from "@/features/conversation/conversation-state";
import { ConversationHome } from "@/features/conversation/ConversationHome";
import { PersonalMemoryPage } from "@/features/workbench/PersonalMemoryPage";
import { ProfilesPage } from "@/features/workbench/ProfilesPage";
import { SettingsPage } from "@/features/workbench/SettingsPage";
import { SpacesPage } from "@/features/workbench/SpacesPage";
import { mockConversations } from "@/mocks/conversations";

export type ViewMode = "home" | "active" | "memory" | "skills" | "scheduled-jobs" | "spaces" | "profiles" | "settings";

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [draft, setDraft] = useState("");
  const [conversation, setConversation] = useState<ConversationState>(emptyConversation);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [memoryDocuments, setMemoryDocuments] = useState<MemoryDocument[]>([]);
  const [activeMemoryDocument, setActiveMemoryDocument] = useState<MemoryDocumentKey>("notes");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    async function loadInitialData(): Promise<void> {
      if (!window.hermesStudio) {
        return;
      }

      const [info, profileList, memoryList, spaceList, profile, space, runtime, loadedSettings] = await Promise.all([
        window.hermesStudio.app.getInfo(),
        window.hermesStudio.profiles.list(),
        window.hermesStudio.memory.list(),
        window.hermesStudio.spaces.list(),
        window.hermesStudio.profiles.getCurrent(),
        window.hermesStudio.spaces.getCurrent(),
        window.hermesStudio.runtime.getStatus(),
        window.hermesStudio.settings.get()
      ]);

      setAppInfo(info);
      setProfiles(profileList);
      setMemoryDocuments(memoryList);
      setSpaces(spaceList);
      setCurrentProfile(profile);
      setCurrentSpace(space);
      setRuntimeStatus(runtime);
      setSettings(loadedSettings);
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
        renderActiveView({
          viewMode,
          composer: composerProps,
          conversation,
          profiles,
          spaces,
          currentProfile,
          currentSpace,
          appInfo,
          runtimeStatus,
          settings,
          memoryDocuments,
          activeMemoryDocument,
          onSelectMemoryDocument: setActiveMemoryDocument,
          onSaveMemoryDocument: async (key, content) => {
            if (!window.hermesStudio) {
              return null;
            }

            const updatedDocument = await window.hermesStudio.memory.update({ key, content });
            setMemoryDocuments((current) => current.map((document) => (document.key === updatedDocument.key ? updatedDocument : document)));
            return updatedDocument;
          },
          onSelectProfile: async (profileId) => {
            if (!window.hermesStudio) {
              return;
            }
            setCurrentProfile(await window.hermesStudio.profiles.setCurrent(profileId));
          },
          onSelectSpace: async (spaceId) => {
            if (!window.hermesStudio) {
              return;
            }
            setCurrentSpace(await window.hermesStudio.spaces.setCurrent(spaceId));
          },
          onAddSpace: async (path) => {
            if (!window.hermesStudio) {
              return { ok: false, error: "Desktop bridge is unavailable." };
            }

            const result = await window.hermesStudio.spaces.add({ path });
            setSpaces(result.spaces);
            setCurrentSpace(result.currentSpace);
            return result.ok ? { ok: true } : { ok: false, error: result.error };
          },
          onRemoveSpace: async (spaceId) => {
            if (!window.hermesStudio) {
              return { ok: false, error: "Desktop bridge is unavailable." };
            }

            const result = await window.hermesStudio.spaces.remove(spaceId);
            setSpaces(result.spaces);
            setCurrentSpace(result.currentSpace);
            return result.ok ? { ok: true } : { ok: false, error: result.error };
          }
        })
      )}
    </AppShell>
  );
}

type ActiveViewProps = {
  viewMode: ViewMode;
  composer: ComposerProps;
  conversation: ConversationState;
  profiles: Profile[];
  spaces: Space[];
  currentProfile: Profile | null;
  currentSpace: Space | null;
  appInfo: AppInfo | null;
  runtimeStatus: RuntimeStatus | null;
  settings: Settings | null;
  memoryDocuments: MemoryDocument[];
  activeMemoryDocument: MemoryDocumentKey;
  onSelectMemoryDocument: (key: MemoryDocumentKey) => void;
  onSaveMemoryDocument: (key: MemoryDocumentKey, content: string) => Promise<MemoryDocument | null>;
  onSelectProfile: (profileId: string) => void;
  onSelectSpace: (spaceId: string) => void;
  onAddSpace: (path: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onRemoveSpace: (spaceId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

function renderActiveView({
  viewMode,
  composer,
  conversation,
  profiles,
  spaces,
  currentProfile,
  currentSpace,
  appInfo,
  runtimeStatus,
  settings,
  memoryDocuments,
  activeMemoryDocument,
  onSelectMemoryDocument,
  onSaveMemoryDocument,
  onSelectProfile,
  onSelectSpace,
  onAddSpace,
  onRemoveSpace
}: ActiveViewProps) {
  if (viewMode === "active") {
    return <ActiveConversation composer={composer} conversation={conversation} profiles={profiles} spaces={spaces} />;
  }

  if (viewMode === "profiles") {
    return <ProfilesPage profiles={profiles} currentProfile={currentProfile} onSelectProfile={onSelectProfile} />;
  }

  if (viewMode === "memory") {
    return (
      <PersonalMemoryPage
        activeDocumentKey={activeMemoryDocument}
        documents={memoryDocuments}
        onSaveDocument={onSaveMemoryDocument}
        onSelectDocument={onSelectMemoryDocument}
      />
    );
  }

  if (viewMode === "spaces") {
    return (
      <SpacesPage
        spaces={spaces}
        currentSpace={currentSpace}
        onAddSpace={onAddSpace}
        onRemoveSpace={onRemoveSpace}
        onSelectSpace={onSelectSpace}
      />
    );
  }

  if (viewMode === "settings") {
    return <SettingsPage appInfo={appInfo} runtimeStatus={runtimeStatus} settings={settings} />;
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
