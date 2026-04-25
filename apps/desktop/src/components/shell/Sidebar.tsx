import {
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  CircleUserRound,
  Cpu,
  Plus,
  Settings,
  Sparkles
} from "lucide-react";
import { useState } from "react";
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
  { label: "Models", icon: Cpu, view: "models" },
  { label: "Skills", icon: Sparkles, view: "skills" },
  { label: "Scheduled Jobs", icon: CalendarClock, view: "scheduled-jobs" },
  { label: "Spaces", icon: BriefcaseBusiness, view: "spaces" },
  { label: "Profiles", icon: CircleUserRound, view: "profiles" }
] as const;

export function Sidebar({ appInfo, conversations, activeView, onNewConversation, onNavigate }: SidebarProps) {
  const today = conversations.filter((conversation) => conversation.group === "today");
  const week = conversations.filter((conversation) => conversation.group === "week");
  const fortnight = conversations.filter((conversation) => conversation.group === "fortnight");
  const older = conversations.filter((conversation) => conversation.group === "older");

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <button className={`sidebar-item ${activeView === "home" ? "sidebar-item-active" : "sidebar-item-plain"}`} type="button" onClick={onNewConversation}>
          <Plus size={16} />
          <span>New Conversation</span>
        </button>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className={`sidebar-item sidebar-item-plain ${activeView === "memory" ? "sidebar-item-active" : ""}`} type="button" onClick={() => onNavigate("memory")}>
            <BookOpen size={14} />
            <span>Personal Memory</span>
          </button>

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
          <ConversationGroup title="Today" conversations={today} activeView={activeView} />
          <ConversationGroup title="This Week" conversations={week} activeView={activeView} />
          <ConversationGroup title="Last Two Weeks" conversations={fortnight} activeView={activeView} />
          <ConversationGroup title="Older Than A Month" conversations={older} activeView={activeView} />
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
  const [expanded, setExpanded] = useState(true);

  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="conversation-group">
      <button className="conversation-group-toggle" type="button" onClick={() => setExpanded((current) => !current)}>
        <ChevronDown className={expanded ? "" : "conversation-group-collapsed"} size={13} />
        <span>{title}</span>
      </button>
      {expanded
        ? conversations.map((conversation) => {
            const active = activeView === "active" && conversation.active;
            return (
              <button className={`conversation-item ${active ? "conversation-item-active" : ""}`} key={conversation.id} type="button">
                <span className="conversation-profile-pill">{conversation.profile}</span>
                <span className="conversation-title-text">{conversation.title}</span>
                <time>{conversation.timeLabel}</time>
              </button>
            );
          })
        : null}
    </div>
  );
}
