import type { AppInfo, ConversationSummary } from "@hermes-studio/bridge";
import { useState } from "react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="window-frame">
      <TopBar />
      <div className={`app-body ${sidebarCollapsed ? "app-body-sidebar-collapsed" : ""}`}>
        <Sidebar
          appInfo={appInfo}
          conversations={conversations}
          activeView={activeView}
          collapsed={sidebarCollapsed}
          onNewConversation={onNewConversation}
          onNavigate={onNavigate}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        />
        <main className="main-area">{children}</main>
      </div>
    </div>
  );
}
