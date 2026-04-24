import { ArrowUp, AtSign, ImagePlus, Mic, Paperclip } from "lucide-react";

export type ComposerProps = {
  value: string;
  profile: string;
  space: string;
  model: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function Composer({ value, profile, space, model, onChange, onSubmit }: ComposerProps) {
  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        aria-label="Message Hermes"
        placeholder="Message Hermes..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="composer-toolbar">
        <div className="composer-tools">
          <button type="button" aria-label="Attach file">
            <Paperclip size={14} />
          </button>
          <button type="button" aria-label="Voice input">
            <Mic size={14} />
          </button>
          <div className="composer-divider" />
          <button type="button" className="inline-control">
            <AtSign size={13} />
            <span>{profile}</span>
          </button>
          <button type="button" className="inline-control">
            <span>{space}</span>
          </button>
          <button type="button" className="inline-control">
            <span>{model}</span>
          </button>
        </div>
        <div className="composer-actions">
          <button type="button" aria-label="Context attachments">
            <ImagePlus size={14} />
          </button>
          <button type="button" className="count-button" aria-label="Context count">
            3
          </button>
          <button className="send-button" type="submit" aria-label="Send message" disabled={!value.trim()}>
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}
