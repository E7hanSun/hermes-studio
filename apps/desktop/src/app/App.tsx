import { useEffect, useMemo, useState } from "react";
import type { AppInfo, Profile, Space } from "@hermes-studio/bridge";
import { AppShell } from "@/components/shell/AppShell";
import { ActiveConversation } from "@/features/conversation/ActiveConversation";
import { ConversationHome } from "@/features/conversation/ConversationHome";
import { mockConversations } from "@/mocks/conversations";

export type ViewMode = "home" | "active";

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [draft, setDraft] = useState("");
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);

  useEffect(() => {
    async function loadInitialData(): Promise<void> {
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

        await window.hermesStudio.runtime.sendMessage({
          text,
          profileId: currentProfile.id,
          spaceId: currentSpace.id,
          model
        });
        setViewMode("active");
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
    >
      {viewMode === "home" ? (
        <ConversationHome
          composer={composerProps}
          hermesVersion={appInfo?.hermesVersion.ref ?? "v2026.4.23"}
          onUseSuggestion={setDraft}
        />
      ) : (
        <ActiveConversation
          composer={composerProps}
          profiles={profiles}
          spaces={spaces}
          onBackHome={() => setViewMode("home")}
        />
      )}
    </AppShell>
  );
}
