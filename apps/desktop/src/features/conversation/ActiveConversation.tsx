import { Copy, FileText, Terminal, Timer, Zap } from "lucide-react";
import type { Profile, Space } from "@hermes-studio/bridge";
import { Composer, type ComposerProps } from "@/components/composer/Composer";

type ActiveConversationProps = {
  composer: ComposerProps;
  profiles: Profile[];
  spaces: Space[];
  onBackHome: () => void;
};

export function ActiveConversation({ composer, profiles, spaces }: ActiveConversationProps) {
  return (
    <div className="active-view">
      <div className="active-title-row">
        <span>Design Hermes Studio Desktop</span>
        <small>hermes-agent</small>
      </div>

      <div className="conversation-stream">
        <div className="user-message-wrap">
          <div className="user-message">
            Codex could not read the local image at `/var/folders/.../image.png`.
            I tried to read image metadata first, then inspect the active Pencil UI instead.
          </div>
          <div className="message-meta">
            <span>10:42</span>
            <Copy size={12} />
          </div>
        </div>

        <section className="assistant-run">
          <div className="run-label">
            <Timer size={13} />
            <span>Thinking</span>
          </div>
          <p>Executing disk space check</p>
          <p className="muted-line">I need to inspect the current workspace and verify what is already present.</p>
        </section>

        <section className="tool-block">
          <div className="tool-header">
            <div>
              <Terminal size={13} />
              <span>terminal</span>
            </div>
            <small>running...</small>
          </div>
          <code>command -v pnpm</code>
          <pre>{`/Users/ember/Library/pnpm/pnpm
v10.30.3`}</pre>
        </section>

        <section className="assistant-run">
          <div className="run-label">
            <Zap size={13} />
            <span>Thinking</span>
          </div>
          <p>Reading the Electron scaffold plan</p>
          <p className="streaming-line">Creating the shell, sidebar, composer, and mock runtime states<span /></p>
        </section>

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
