import { useEffect, useMemo, useState } from "react";
import type {
  AppInfo,
  CreateScheduledJobInput,
  HubSkill,
  InstalledSkill,
  MemoryDocument,
  MemoryDocumentKey,
  ModelConfig,
  Profile,
  RuntimeStatus,
  ScheduledJob,
  Settings,
  SkillSource,
  Space,
  UpdateScheduledJobInput
} from "@hermes-studio/bridge";
import { AppShell } from "@/components/shell/AppShell";
import { ActiveConversation } from "@/features/conversation/ActiveConversation";
import type { ComposerProps } from "@/components/composer/Composer";
import { emptyConversation, reduceConversationEvent, type ConversationState } from "@/features/conversation/conversation-state";
import { ConversationHome } from "@/features/conversation/ConversationHome";
import { ModelsPage } from "@/features/workbench/ModelsPage";
import { PersonalMemoryPage } from "@/features/workbench/PersonalMemoryPage";
import { ProfilesPage } from "@/features/workbench/ProfilesPage";
import { ScheduledJobsPage } from "@/features/workbench/ScheduledJobsPage";
import { SettingsPage } from "@/features/workbench/SettingsPage";
import { SkillsPage } from "@/features/workbench/SkillsPage";
import { SpacesPage } from "@/features/workbench/SpacesPage";
import type { ConversationEvent, ConversationSummary } from "@hermes-studio/bridge";

export type ViewMode = "home" | "active" | "memory" | "models" | "skills" | "scheduled-jobs" | "spaces" | "profiles" | "settings";

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [draft, setDraft] = useState("");
  const [conversation, setConversation] = useState<ConversationState>(emptyConversation);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [memoryDocuments, setMemoryDocuments] = useState<MemoryDocument[]>([]);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [activeMemoryDocument, setActiveMemoryDocument] = useState<MemoryDocumentKey>("notes");
  const [installedSkills, setInstalledSkills] = useState<InstalledSkill[]>([]);
  const [hubSkills, setHubSkills] = useState<HubSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<{ kind: "installed"; skill: InstalledSkill } | { kind: "hub"; skill: HubSkill } | null>(null);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [selectedScheduledJob, setSelectedScheduledJob] = useState<ScheduledJob | null>(null);
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

      const [info, profileList, memoryList, loadedModelConfig, installedSkillList, hubSkillList, scheduledJobList, spaceList, profile, space, runtime, loadedSettings, loadedConversations] = await Promise.all([
        window.hermesStudio.app.getInfo(),
        window.hermesStudio.profiles.list(),
        window.hermesStudio.memory.list(),
        window.hermesStudio.models.getConfig(),
        window.hermesStudio.skills.listInstalled(),
        window.hermesStudio.skills.searchHub({ query: "", source: "all" }),
        window.hermesStudio.scheduledJobs.list(),
        window.hermesStudio.spaces.list(),
        window.hermesStudio.profiles.getCurrent(),
        window.hermesStudio.spaces.getCurrent(),
        window.hermesStudio.runtime.getStatus(),
        window.hermesStudio.settings.get(),
        window.hermesStudio.conversations.list()
      ]);

      setAppInfo(info);
      setProfiles(profileList);
      setMemoryDocuments(memoryList);
      setModelConfig(loadedModelConfig);
      setInstalledSkills(installedSkillList);
      setHubSkills(hubSkillList);
      setSelectedSkill(installedSkillList[0] ? { kind: "installed", skill: installedSkillList[0] } : null);
      setScheduledJobs(scheduledJobList);
      setSelectedScheduledJob(scheduledJobList[0] ?? null);
      setSpaces(spaceList);
      setCurrentProfile(profile);
      setCurrentSpace(space);
      setRuntimeStatus(runtime);
      setSettings(loadedSettings);
      setConversations(loadedConversations);
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

      if (event.type === "message.completed" || event.type === "runtime.error") {
        void refreshConversations();
      }
    });
  }, []);

  async function refreshConversations(): Promise<void> {
    if (!window.hermesStudio) {
      return;
    }

    setConversations(await window.hermesStudio.conversations.list());
  }

  async function selectConversation(conversationId: string): Promise<void> {
    if (!window.hermesStudio) {
      return;
    }

    const events = await window.hermesStudio.conversations.load(conversationId);
    setConversation(events.reduce((current: ConversationState, event: ConversationEvent) => reduceConversationEvent(current, event), emptyConversation));
    setConversations((current) => current.map((conversation) => ({ ...conversation, active: conversation.id === conversationId })));
    setViewMode("active");
  }

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
          const result = await window.hermesStudio.runtime.sendMessage({
            text,
            profileId: currentProfile.id,
            spaceId: currentSpace.id,
            model
          });
          setConversations((current) => current.map((conversation) => ({ ...conversation, active: conversation.id === result.conversationId })));
        }
        setDraft("");
      }
    }),
    [currentProfile, currentSpace, draft, model]
  );

  return (
    <AppShell
      appInfo={appInfo}
      conversations={conversations}
      activeView={viewMode}
      onNewConversation={() => {
        setConversation(emptyConversation);
        setConversations((current) => current.map((conversation) => ({ ...conversation, active: false })));
        setViewMode("home");
      }}
      onSelectConversation={(conversationId) => void selectConversation(conversationId)}
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
          modelConfig,
          installedSkills,
          hubSkills,
          selectedSkill,
          scheduledJobs,
          selectedScheduledJob,
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
          onInstallHubSkill: async (skillId) => {
            if (!window.hermesStudio) {
              return;
            }

            const result = await window.hermesStudio.skills.installFromHub(skillId);
            setInstalledSkills(result.installedSkills);
            setHubSkills(result.hubSkills);

            if (result.ok) {
              setSelectedSkill({ kind: "installed", skill: result.installedSkill });
            }
          },
          onSearchHub: async (query, source) => {
            if (!window.hermesStudio) {
              return;
            }

            setHubSkills(await window.hermesStudio.skills.searchHub({ query, source }));
          },
          onSelectSkill: setSelectedSkill,
          onSetSkillEnabled: async (skillId, enabled) => {
            if (!window.hermesStudio) {
              return;
            }

            const nextInstalledSkills = await window.hermesStudio.skills.setEnabled(skillId, enabled);
            setInstalledSkills(nextInstalledSkills);
            setSelectedSkill((current) => {
              if (current?.kind !== "installed" || current.skill.id !== skillId) {
                return current;
              }

              const updatedSkill = nextInstalledSkills.find((skill) => skill.id === skillId);
              return updatedSkill ? { kind: "installed", skill: updatedSkill } : current;
            });
          },
          onCreateScheduledJob: async (input) => {
            if (!window.hermesStudio) {
              return;
            }

            const result = await window.hermesStudio.scheduledJobs.create(input);
            setScheduledJobs(result.jobs);

            if (result.selectedJob) {
              setSelectedScheduledJob(result.selectedJob);
            }
          },
          onUpdateScheduledJob: async (input) => {
            if (!window.hermesStudio) {
              return;
            }

            const result = await window.hermesStudio.scheduledJobs.update(input);
            setScheduledJobs(result.jobs);

            if (result.selectedJob) {
              setSelectedScheduledJob(result.selectedJob);
            }
          },
          onRefreshScheduledJobs: async () => {
            if (!window.hermesStudio) {
              return;
            }

            const jobs = await window.hermesStudio.scheduledJobs.list();
            setScheduledJobs(jobs);
            setSelectedScheduledJob((current) => jobs.find((job) => job.id === current?.id) ?? jobs[0] ?? null);
          },
          onPauseScheduledJob: async (jobId) => {
            if (!window.hermesStudio) {
              return;
            }

            const result = await window.hermesStudio.scheduledJobs.pause(jobId);
            setScheduledJobs(result.jobs);
            setSelectedScheduledJob(result.selectedJob ?? null);
          },
          onResumeScheduledJob: async (jobId) => {
            if (!window.hermesStudio) {
              return;
            }

            const result = await window.hermesStudio.scheduledJobs.resume(jobId);
            setScheduledJobs(result.jobs);
            setSelectedScheduledJob(result.selectedJob ?? null);
          },
          onRunScheduledJobNow: async (jobId) => {
            if (!window.hermesStudio) {
              return;
            }

            const result = await window.hermesStudio.scheduledJobs.runNow(jobId);
            setScheduledJobs(result.jobs);
            setSelectedScheduledJob(result.selectedJob ?? null);
          },
          onRemoveScheduledJob: async (jobId) => {
            if (!window.hermesStudio) {
              return;
            }

            const result = await window.hermesStudio.scheduledJobs.remove(jobId);
            setScheduledJobs(result.jobs);
            setSelectedScheduledJob(result.selectedJob ?? null);
          },
          onSelectScheduledJob: setSelectedScheduledJob,
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
  modelConfig: ModelConfig | null;
  installedSkills: InstalledSkill[];
  hubSkills: HubSkill[];
  selectedSkill: { kind: "installed"; skill: InstalledSkill } | { kind: "hub"; skill: HubSkill } | null;
  scheduledJobs: ScheduledJob[];
  selectedScheduledJob: ScheduledJob | null;
  activeMemoryDocument: MemoryDocumentKey;
  onSelectMemoryDocument: (key: MemoryDocumentKey) => void;
  onSaveMemoryDocument: (key: MemoryDocumentKey, content: string) => Promise<MemoryDocument | null>;
  onInstallHubSkill: (skillId: string) => Promise<void>;
  onSearchHub: (query: string, source: SkillSource | "all") => Promise<void>;
  onSelectSkill: (selection: { kind: "installed"; skill: InstalledSkill } | { kind: "hub"; skill: HubSkill } | null) => void;
  onSetSkillEnabled: (skillId: string, enabled: boolean) => Promise<void>;
  onCreateScheduledJob: (input: CreateScheduledJobInput) => Promise<void>;
  onUpdateScheduledJob: (input: UpdateScheduledJobInput) => Promise<void>;
  onRefreshScheduledJobs: () => Promise<void>;
  onPauseScheduledJob: (jobId: string) => Promise<void>;
  onResumeScheduledJob: (jobId: string) => Promise<void>;
  onRunScheduledJobNow: (jobId: string) => Promise<void>;
  onRemoveScheduledJob: (jobId: string) => Promise<void>;
  onSelectScheduledJob: (job: ScheduledJob) => void;
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
  modelConfig,
  installedSkills,
  hubSkills,
  selectedSkill,
  scheduledJobs,
  selectedScheduledJob,
  activeMemoryDocument,
  onSelectMemoryDocument,
  onSaveMemoryDocument,
  onInstallHubSkill,
  onSearchHub,
  onSelectSkill,
  onSetSkillEnabled,
  onCreateScheduledJob,
  onUpdateScheduledJob,
  onRefreshScheduledJobs,
  onPauseScheduledJob,
  onResumeScheduledJob,
  onRunScheduledJobNow,
  onRemoveScheduledJob,
  onSelectScheduledJob,
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

  if (viewMode === "models") {
    return <ModelsPage modelConfig={modelConfig} />;
  }

  if (viewMode === "skills") {
    return (
      <SkillsPage
        hubSkills={hubSkills}
        installedSkills={installedSkills}
        selectedSkill={selectedSkill}
        onInstallHubSkill={onInstallHubSkill}
        onSearchHub={onSearchHub}
        onSelectSkill={onSelectSkill}
        onSetEnabled={onSetSkillEnabled}
      />
    );
  }

  if (viewMode === "scheduled-jobs") {
    return (
      <ScheduledJobsPage
        installedSkills={installedSkills}
        jobs={scheduledJobs}
        selectedJob={selectedScheduledJob}
        onCreateJob={onCreateScheduledJob}
        onUpdateJob={onUpdateScheduledJob}
        onPauseJob={onPauseScheduledJob}
        onRefreshJobs={onRefreshScheduledJobs}
        onRemoveJob={onRemoveScheduledJob}
        onResumeJob={onResumeScheduledJob}
        onRunJobNow={onRunScheduledJobNow}
        onSelectJob={onSelectScheduledJob}
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
    models: {
      title: "Models",
      description: "Provider setup, primary model, credentials, fallback, and auxiliary model routing will live here."
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
