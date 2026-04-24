import { Sparkle } from "lucide-react";
import { Composer, type ComposerProps } from "@/components/composer/Composer";

type ConversationHomeProps = {
  composer: ComposerProps;
  hermesVersion: string;
  onUseSuggestion: (value: string) => void;
};

const suggestions = [
  "What files are in this space?",
  "What's on my schedule today?",
  "Help me plan a small project."
];

export function ConversationHome({ composer, hermesVersion, onUseSuggestion }: ConversationHomeProps) {
  return (
    <div className="home-view">
      <div className="main-top-title">New Conversation</div>
      <div className="home-center">
        <div className="hermes-mark" aria-label={`Hermes ${hermesVersion}`}>
          <Sparkle size={13} />
        </div>
        <h1>What can I help with?</h1>
        <p>Ask anything, run commands, explore files, or manage your scheduled tasks.</p>
        <Composer {...composer} />
        <div className="suggestion-list">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => onUseSuggestion(suggestion)}>
              <Sparkle size={12} />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
