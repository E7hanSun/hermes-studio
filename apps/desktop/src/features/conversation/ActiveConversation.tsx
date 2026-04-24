import { Copy, FileText, Terminal, Timer, Zap } from "lucide-react";
import type { Profile, Space } from "@hermes-studio/bridge";
import { Composer, type ComposerProps } from "@/components/composer/Composer";
import type { ConversationItem, ConversationState } from "./conversation-state";

type ActiveConversationProps = {
  composer: ComposerProps;
  conversation: ConversationState;
  profiles: Profile[];
  spaces: Space[];
};

export function ActiveConversation({ composer, conversation, profiles, spaces }: ActiveConversationProps) {
  return (
    <div className="active-view">
      <div className="active-title-row">
        <span>{conversation.title}</span>
        <small>hermes-agent</small>
      </div>

      <div className="conversation-stream">
        {conversation.items.length === 0 ? (
          <section className="assistant-run">
            <div className="run-label">
              <Timer size={13} />
              <span>Waiting</span>
            </div>
            <p>Send a message to start the mock Hermes runtime event stream.</p>
          </section>
        ) : (
          conversation.items.map((item) => <ConversationItemView item={item} key={item.id} />)
        )}

        <section className="context-strip">
          <FileText size={13} />
          <span>{profiles.length} profiles</span>
          <span>{spaces.length} spaces</span>
        </section>
      </div>

      <div className="active-composer">
        <Composer {...composer} />
      </div>
    </div>
  );
}

function ConversationItemView({ item }: { item: ConversationItem }) {
  if (item.kind === "user") {
    return (
      <div className="user-message-wrap">
        <div className="user-message">{item.text}</div>
        <div className="message-meta">
          <span>{formatTime(item.createdAt)}</span>
          <Copy size={12} />
        </div>
      </div>
    );
  }

  if (item.kind === "thinking") {
    return (
      <section className="assistant-run">
        <div className="run-label">
          <Timer size={13} />
          <span>{item.title}</span>
        </div>
        <p className={item.status === "running" ? "streaming-line" : undefined}>
          {item.text || "Preparing the next step"}
          {item.status === "running" ? <span /> : null}
        </p>
      </section>
    );
  }

  if (item.kind === "tool") {
    return (
      <section className="tool-block">
        <div className="tool-header">
          <div>
            <Terminal size={13} />
            <span>{item.tool.title}</span>
          </div>
          <small>{item.tool.status === "running" ? "running..." : item.tool.status}</small>
        </div>
        {item.tool.command ? <code>{item.tool.command}</code> : null}
        {item.tool.output?.length ? <pre>{item.tool.output.join("\n")}</pre> : null}
      </section>
    );
  }

  return (
    <section className="assistant-run">
      <div className="run-label">
        <Zap size={13} />
        <span>Hermes</span>
      </div>
      <p className={item.status === "streaming" ? "streaming-line" : undefined}>
        {item.text}
        {item.status === "streaming" ? <span /> : null}
      </p>
    </section>
  );
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
