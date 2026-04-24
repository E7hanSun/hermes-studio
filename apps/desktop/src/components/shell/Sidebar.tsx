import {
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CircleUserRound,
  MessageSquarePlus,
  Settings,
  Sparkles
} from "lucide-react";
import type { AppInfo, ConversationSummary } from "@hermes-studio/bridge";
import type { ViewMode } from "@/app/App";

type SidebarProps = {
  appInfo: AppInfo | null;
  conversations: ConversationSummary[];
  activeView: ViewMode;
  onNewConversation: () => void;
  onNavigate: (viewMode: ViewMode) => void;
};

const navItems = [
  { label: "Skills", icon: Sparkles, view: "skills" },
  { label: "Scheduled Jobs", icon: CalendarClock, view: "scheduled-jobs" },
  { label: "Spaces", icon: BriefcaseBusiness, view: "spaces" },
  { label: "Profiles", icon: CircleUserRound, view: "profiles" }
] as const;

export function Sidebar({ appInfo, conversations, activeView, onNewConversation, onNavigate }: SidebarProps) {
  const today = conversations.filter((conversation) => conversation.group === "today");
  const yesterday = conversations.filter((conversation) => conversation.group === "yesterday");

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <button className={`sidebar-item ${activeView === "home" ? "sidebar-item-active" : "sidebar-item-plain"}`} type="button" onClick={onNewConversation}>
          <MessageSquarePlus size={14} />
          <span>New Conversation</span>
        </button>

        <section className="memory-group">
          <button className={`sidebar-item sidebar-item-plain ${activeView === "memory" ? "sidebar-item-active" : ""}`} type="button" onClick={() => onNavigate("memory")}>
            <BookOpen size={14} />
            <span>Personal Memory</span>
          </button>
        </section>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`sidebar-item sidebar-item-plain ${activeView === item.view ? "sidebar-item-active" : ""}`}
                type="button"
                key={item.label}
                onClick={() => onNavigate(item.view)}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="conversation-list">
          <div className="section-title">Conversations</div>
          <ConversationGroup title="Today" conversations={today} activeView={activeView} />
          <ConversationGroup title="Yesterday" conversations={yesterday} activeView={activeView} />
          <button className="view-all" type="button">View all</button>
        </section>
      </div>

      <div className="sidebar-footer">
        <button className={`sidebar-item sidebar-item-plain ${activeView === "settings" ? "sidebar-item-active" : ""}`} type="button" onClick={() => onNavigate("settings")}>
          <Settings size={14} />
          <span>Settings</span>
        </button>
        <div className="version-line">{appInfo?.hermesVersion.ref ?? "Hermes"}</div>
      </div>
    </aside>
  );
}

function ConversationGroup({
  title,
  conversations,
  activeView
}: {
  title: string;
  conversations: ConversationSummary[];
  activeView: ViewMode;
}) {
  return (
    <div className="conversation-group">
      <div className="conversation-group-title">{title}</div>
      {conversations.map((conversation) => {
        const active = activeView === "active" && conversation.active;
        return (
          <button className={`conversation-item ${active ? "conversation-item-active" : ""}`} key={conversation.id} type="button">
            <span>{conversation.title}</span>
            <time>{conversation.timeLabel}</time>
          </button>
        );
      })}
    </div>
  );
}
