import type { AppInfo, ConversationSummary } from "@hermes-studio/bridge";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type AppShellProps = {
  appInfo: AppInfo | null;
  conversations: ConversationSummary[];
  activeView: "home" | "active";
  children: React.ReactNode;
  onNewConversation: () => void;
};

export function AppShell({ appInfo, conversations, activeView, children, onNewConversation }: AppShellProps) {
  return (
    <div className="window-frame">
      <TopBar />
      <div className="app-body">
        <Sidebar
          appInfo={appInfo}
          conversations={conversations}
          activeView={activeView}
          onNewConversation={onNewConversation}
        />
        <main className="main-area">{children}</main>
      </div>
    </div>
  );
}
