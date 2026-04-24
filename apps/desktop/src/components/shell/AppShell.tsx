import type { AppInfo, ConversationSummary } from "@hermes-studio/bridge";
import type { ViewMode } from "@/app/App";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type AppShellProps = {
  appInfo: AppInfo | null;
  conversations: ConversationSummary[];
  activeView: ViewMode;
  children: React.ReactNode;
  onNewConversation: () => void;
  onNavigate: (viewMode: ViewMode) => void;
};

export function AppShell({ appInfo, conversations, activeView, children, onNewConversation, onNavigate }: AppShellProps) {
  return (
    <div className="window-frame">
      <TopBar />
      <div className="app-body">
        <Sidebar
          appInfo={appInfo}
          conversations={conversations}
          activeView={activeView}
          onNewConversation={onNewConversation}
          onNavigate={onNavigate}
        />
        <main className="main-area">{children}</main>
      </div>
    </div>
  );
}
