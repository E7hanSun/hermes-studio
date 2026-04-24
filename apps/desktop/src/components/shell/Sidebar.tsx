import {
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  CircleUserRound,
  Layers3,
  MessageSquarePlus,
  Settings,
  Sparkles
} from "lucide-react";
import type { AppInfo, ConversationSummary } from "@hermes-studio/bridge";

type SidebarProps = {
  appInfo: AppInfo | null;
  conversations: ConversationSummary[];
  activeView: "home" | "active";
  onNewConversation: () => void;
};

const navItems = [
  { label: "Skills", icon: Sparkles },
  { label: "Scheduled Jobs", icon: CalendarClock },
  { label: "Spaces", icon: BriefcaseBusiness },
  { label: "Profiles", icon: CircleUserRound }
];

export function Sidebar({ appInfo, conversations, activeView, onNewConversation }: SidebarProps) {
  const today = conversations.filter((conversation) => conversation.group === "today");
  const yesterday = conversations.filter((conversation) => conversation.group === "yesterday");

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <button className="sidebar-item sidebar-item-active" type="button" onClick={onNewConversation}>
          <MessageSquarePlus size={14} />
          <span>New Conversation</span>
        </button>

        <section className="memory-group">
          <div className="sidebar-item sidebar-item-plain">
            <BookOpen size={14} />
            <span>Personal Memory</span>
            <ChevronRight className="sidebar-caret" size={13} />
          </div>
          <div className="memory-subitems">
            <div className="sidebar-subitem">My Notes</div>
            <div className="sidebar-subitem sidebar-subitem-active">User Profile</div>
          </div>
        </section>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className="sidebar-item sidebar-item-plain" type="button" key={item.label}>
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
        <button className="sidebar-item sidebar-item-plain" type="button">
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
  activeView: "home" | "active";
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
