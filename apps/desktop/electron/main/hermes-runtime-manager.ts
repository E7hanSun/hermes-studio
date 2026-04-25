import type { WebContents } from "electron";
import { existsSync } from "node:fs";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { ConversationEvent, ConversationSummary, MessageInput, Profile, RuntimeStatus, Space } from "@hermes-studio/bridge";
import { channels } from "@hermes-studio/bridge";
import {
  appendHermesProfileArgs,
  getHermesRuntimeStatus,
  isCommandAvailable,
  resolveHermesRuntime
} from "./hermes-paths";

type RuntimeContext = {
  profile?: Profile;
  space?: Space;
};

type RuntimeCommand = {
  command: string;
  args: string[];
};

type RunningConversation = {
  process: ChildProcessWithoutNullStreams;
};

export class HermesRuntimeManager {
  private readonly runningConversations = new Map<string, RunningConversation>();

  getStatus(): RuntimeStatus {
    const activeProcess = [...this.runningConversations.values()].find((conversation) => conversation.process.pid);

    if (activeProcess?.process.pid) {
      return getHermesRuntimeStatus(activeProcess.process.pid);
    }

    return getHermesRuntimeStatus();
  }

  sendMessage(sender: WebContents, input: MessageInput, context: RuntimeContext): { conversationId: string } {
    const conversationId = input.conversationId ?? this.createConversationId();
    const title = toTitle(input.text);

    this.emit(sender, {
      type: "conversation.started",
      conversationId,
      title,
      input: input.text,
      createdAt: new Date().toISOString()
    });

    const runtimeCommand = this.resolveRuntimeCommand(input, context);

    if (!runtimeCommand) {
      this.emit(sender, {
        type: "runtime.error",
        conversationId,
        message: "Managed Hermes runtime is unavailable. Run scripts/vendor-hermes.sh before starting a real conversation."
      });
      return { conversationId };
    }

    this.runHermesCli(sender, input, context, conversationId, title, runtimeCommand);
    return { conversationId };
  }

  listConversations(context: RuntimeContext): ConversationSummary[] {
    const command = this.resolveSessionCommand(context);

    if (!command || !isCommandAvailable(command.command)) {
      return [];
    }

    const result = spawnSync(command.command, [...command.args, "sessions", "list", "--limit", "50"], {
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true
    });

    if (result.error || result.status !== 0) {
      return [];
    }

    const conversations = parseSessionList(result.stdout, context.profile?.name ?? "Hermes");
    return conversations;
  }

  loadConversationEvents(conversationId: string, context: RuntimeContext): ConversationEvent[] {
    const command = this.resolveSessionCommand(context);

    if (!command || !isCommandAvailable(command.command)) {
      return [];
    }

    const tempDir = mkdtempSync(join(tmpdir(), "hermes-studio-session-"));
    const outputPath = join(tempDir, `${conversationId}.jsonl`);

    try {
      const result = spawnSync(command.command, [...command.args, "sessions", "export", outputPath, "--session-id", conversationId], {
        encoding: "utf8",
        timeout: 10000,
        windowsHide: true
      });

      if (result.error || result.status !== 0 || !existsSync(outputPath)) {
        return [];
      }

      return parseExportedSession(readFileSync(outputPath, "utf8"), conversationId);
    } finally {
      rmSync(tempDir, { force: true, recursive: true });
    }
  }

  private runHermesCli(
    sender: WebContents,
    input: MessageInput,
    context: RuntimeContext,
    conversationId: string,
    title: string,
    runtimeCommand: RuntimeCommand
  ): void {
    const cwd = context.space?.path && existsSync(context.space.path) ? context.space.path : process.cwd();

    this.emit(sender, {
      type: "thinking.started",
      conversationId,
      title: "Hermes CLI"
    });
    this.emit(sender, {
      type: "thinking.updated",
      conversationId,
      text: `Starting ${runtimeCommand.command} in ${basename(cwd) || cwd}.`
    });

    const child = spawn(runtimeCommand.command, runtimeCommand.args, {
      cwd,
      env: {
        ...process.env,
        HERMES_STUDIO: "1"
      },
      windowsHide: true
    });

    this.runningConversations.set(conversationId, { process: child });

    let hasAssistantOutput = false;
    let stderrTail = "";

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      if (!text) {
        return;
      }

      hasAssistantOutput = true;
      this.emit(sender, {
        type: "message.delta",
        conversationId,
        text
      });
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrTail = `${stderrTail}${chunk.toString()}`.slice(-2000);
      this.emit(sender, {
        type: "thinking.updated",
        conversationId,
        text: stderrTail.trim() || "Hermes is running."
      });
    });

    child.on("error", (error) => {
      this.runningConversations.delete(conversationId);
      this.emit(sender, {
        type: "runtime.error",
        conversationId,
        message: `Failed to start Hermes: ${error.message}`
      });
    });

    child.on("close", (exitCode) => {
      this.runningConversations.delete(conversationId);

      if (exitCode === 0) {
        if (!hasAssistantOutput) {
          this.emit(sender, {
            type: "message.delta",
            conversationId,
            text: "Hermes finished without emitting a response."
          });
        }
        this.emit(sender, { type: "message.completed", conversationId });
        return;
      }

      this.emit(sender, {
        type: "runtime.error",
        conversationId,
        message: `Hermes exited with code ${exitCode ?? "unknown"}.${stderrTail ? `\n\n${stderrTail.trim()}` : ""}`
      });
    });
  }

  private resolveRuntimeCommand(input: MessageInput, context: RuntimeContext): RuntimeCommand | null {
    const runtime = resolveHermesRuntime();

    if (runtime) {
      return {
        command: runtime.command,
        args: [...appendHermesProfileArgs(runtime, context.profile?.id), "chat", "-q", input.text, "--source", "studio"]
      };
    }

    return null;
  }

  private resolveSessionCommand(context: RuntimeContext): RuntimeCommand | null {
    const runtime = resolveHermesRuntime();

    return runtime ? { command: runtime.command, args: appendHermesProfileArgs(runtime, context.profile?.id) } : null;
  }

  private createConversationId(): string {
    return `studio-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private emit(sender: WebContents, event: ConversationEvent): void {
    if (!sender.isDestroyed()) {
      sender.send(channels.runtimeSubscribe, event);
    }
  }

  private emitLater(sender: WebContents, event: ConversationEvent, delay: number): void {
    setTimeout(() => this.emit(sender, event), delay);
  }
}

function toTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "New Conversation";
  }

  return trimmed.length > 46 ? `${trimmed.slice(0, 43)}...` : trimmed;
}

function parseSessionList(output: string, profile: string): ConversationSummary[] {
  const lines = stripAnsi(output)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !/^[─-]+$/.test(line.trim()));
  const headerIndex = lines.findIndex((line) => line.includes("Last Active") && line.includes("ID"));

  if (headerIndex === -1) {
    return [];
  }

  const header = lines[headerIndex] ?? "";
  const titleMode = header.includes("Title");
  const body = lines.slice(headerIndex + 1);

  return body
    .map((line) => parseSessionListLine(line, titleMode, profile))
    .filter((conversation): conversation is ConversationSummary => conversation !== null);
}

function parseSessionListLine(line: string, titleMode: boolean, profile: string): ConversationSummary | null {
  const columns = line.trim().split(/\s{2,}/);

  if (titleMode) {
    if (columns.length < 4) {
      return null;
    }

    const [title, preview, lastActive, id] = columns;
    return toConversationSummary({
      id,
      title: title && title !== "—" ? title : preview,
      lastActive,
      profile
    });
  }

  if (columns.length < 4) {
    return null;
  }

  const [preview, lastActive, source, id] = columns;
  return toConversationSummary({
    id,
    title: preview,
    lastActive,
    profile: source && source !== "cli" ? source : profile
  });
}

function toConversationSummary(input: { id?: string; title?: string; lastActive?: string; profile: string }): ConversationSummary | null {
  if (!input.id) {
    return null;
  }

  const title = (input.title || input.id).trim();

  return {
    id: input.id.trim(),
    title: title.length > 64 ? `${title.slice(0, 61)}...` : title,
    group: groupFromLastActive(input.lastActive ?? ""),
    profile: input.profile,
    timeLabel: normalizeLastActive(input.lastActive ?? "")
  };
}

function groupFromLastActive(value: string): ConversationSummary["group"] {
  const normalized = value.trim().toLowerCase();

  if (!normalized || normalized.includes("just") || normalized.includes("min") || normalized.endsWith("m ago") || normalized.endsWith("h ago")) {
    return "today";
  }

  if (normalized.includes("yesterday")) {
    return "week";
  }

  const dayMatch = normalized.match(/^(\d+)\s*d/);
  if (dayMatch) {
    const days = Number.parseInt(dayMatch[1] ?? "0", 10);
    return days <= 7 ? "week" : days <= 14 ? "fortnight" : "older";
  }

  return "older";
}

function normalizeLastActive(value: string): string {
  return value
    .trim()
    .replace(/\s+ago$/i, "")
    .replace(/^just now$/i, "now")
    .replace(/^yesterday$/i, "1d") || "now";
}

function parseExportedSession(contents: string, conversationId: string): ConversationEvent[] {
  const records = contents
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as Record<string, unknown>];
      } catch {
        return [];
      }
    });
  const session = records.find((record) => Array.isArray(record.messages)) ?? records[0];
  const messages = extractMessages(session, records);
  const firstUser = messages.find((message) => message.role === "user");
  const title = stringValue(session?.title) || firstUser?.text || conversationId;
  const startedAt = numberOrStringDate(session?.started_at ?? session?.startedAt) ?? new Date().toISOString();
  const events: ConversationEvent[] = [
    {
      type: "conversation.started",
      conversationId,
      title: toTitle(title),
      input: firstUser?.text || title,
      createdAt: startedAt
    }
  ];

  for (const message of messages) {
    if (message === firstUser || message.role === "system" || !message.text) {
      continue;
    }

    if (message.role === "user") {
      events.push({
        type: "message.delta",
        conversationId,
        text: `\n\nUser: ${message.text}`
      });
      continue;
    }

    events.push({
      type: "message.delta",
      conversationId,
      text: `${message.text}\n\n`
    });
  }

  events.push({ type: "message.completed", conversationId });
  return events;
}

function extractMessages(session: Record<string, unknown> | undefined, records: Array<Record<string, unknown>>): Array<{ role: string; text: string }> {
  const source = Array.isArray(session?.messages) ? session?.messages : records;

  return source.flatMap((message) => {
    const record = message as Record<string, unknown>;
    const nested = record.message && typeof record.message === "object" ? (record.message as Record<string, unknown>) : record;
    const role = stringValue(nested.role) || stringValue(record.role);
    const text = contentToText(nested.content ?? record.content);

    return role && text ? [{ role, text }] : [];
  });
}

function contentToText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return stringValue(record.text) || stringValue(record.content) || "";
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrStringDate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return null;
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}
