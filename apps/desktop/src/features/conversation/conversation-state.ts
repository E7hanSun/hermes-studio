import type { ConversationEvent, ToolCall } from "@hermes-studio/bridge";

export type ConversationItem =
  | {
      id: string;
      kind: "user";
      text: string;
      createdAt: string;
    }
  | {
      id: string;
      kind: "thinking";
      title: string;
      text: string;
      status: "running" | "done";
    }
  | {
      id: string;
      kind: "tool";
      tool: ToolCall;
    }
  | {
      id: string;
      kind: "assistant";
      text: string;
      status: "streaming" | "done";
    }
  | {
      id: string;
      kind: "error";
      text: string;
    };

export type ConversationState = {
  id: string | null;
  title: string;
  items: ConversationItem[];
};

export const emptyConversation: ConversationState = {
  id: null,
  title: "New Conversation",
  items: []
};

export function reduceConversationEvent(state: ConversationState, event: ConversationEvent): ConversationState {
  switch (event.type) {
    case "conversation.started":
      return {
        id: event.conversationId,
        title: event.title,
        items: [
          {
            id: `${event.conversationId}-user`,
            kind: "user",
            text: event.input,
            createdAt: event.createdAt
          }
        ]
      };

    case "thinking.started":
      return appendItem(state, {
        id: `${event.conversationId}-thinking`,
        kind: "thinking",
        title: event.title,
        text: "",
        status: "running"
      });

    case "thinking.updated":
      return updateItem(state, `${event.conversationId}-thinking`, (item) =>
        item.kind === "thinking" ? { ...item, text: event.text } : item
      );

    case "tool.started":
      return appendItem(state, {
        id: event.tool.id,
        kind: "tool",
        tool: event.tool
      });

    case "tool.output":
      return updateItem(state, event.toolCallId, (item) =>
        item.kind === "tool"
          ? {
              ...item,
              tool: {
                ...item.tool,
                output: [...(item.tool.output ?? []), event.output]
              }
            }
          : item
      );

    case "tool.finished":
      return updateItem(state, event.toolCallId, (item) =>
        item.kind === "tool"
          ? {
              ...item,
              tool: {
                ...item.tool,
                status: event.exitCode === 0 ? "finished" : "failed"
              }
            }
          : item
      );

    case "message.delta": {
      const assistantId = `${event.conversationId}-assistant`;
      const existing = state.items.find((item) => item.id === assistantId);

      if (!existing) {
        return appendItem(state, {
          id: assistantId,
          kind: "assistant",
          text: event.text,
          status: "streaming"
        });
      }

      return updateItem(state, assistantId, (item) =>
        item.kind === "assistant" ? { ...item, text: item.text + event.text } : item
      );
    }

    case "message.completed":
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.kind === "assistant" && item.id === `${event.conversationId}-assistant`) {
            return { ...item, status: "done" };
          }

          if (item.kind === "thinking") {
            return { ...item, status: "done" };
          }

          return item;
        })
      };

    case "runtime.error":
      return appendItem(state, {
        id: `${event.conversationId}-runtime-error`,
        kind: "error",
        text: event.message
      });

    default:
      return state;
  }
}

function appendItem(state: ConversationState, item: ConversationItem): ConversationState {
  return {
    ...state,
    items: [...state.items.filter((existing) => existing.id !== item.id), item]
  };
}

function updateItem(
  state: ConversationState,
  id: string,
  update: (item: ConversationItem) => ConversationItem
): ConversationState {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? update(item) : item))
  };
}
