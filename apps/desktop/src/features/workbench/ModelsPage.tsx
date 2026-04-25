import { useMemo, useState } from "react";
import { Bot, Check, ChevronDown, Edit3, Eye, ExternalLink, Plus, Trash2, X } from "lucide-react";
import type { ModelConfig, ModelProvider } from "@hermes-studio/bridge";
import anthropicIcon from "@/assets/providers/anthropic.svg";
import arkIcon from "@/assets/providers/ark.svg";
import customIcon from "@/assets/providers/custom.svg";
import googleIcon from "@/assets/providers/google.svg";
import minimaxIcon from "@/assets/providers/minimax.svg";
import moonshotIcon from "@/assets/providers/moonshot.svg";
import ollamaIcon from "@/assets/providers/ollama.svg";
import openaiIcon from "@/assets/providers/openai.svg";
import openrouterIcon from "@/assets/providers/openrouter.svg";
import siliconflowIcon from "@/assets/providers/siliconflow.svg";

type ModelsPageProps = {
  modelConfig: ModelConfig | null;
};

type AddDialogStep = "choose" | "configure";

type ProviderSetupKind = "api-key" | "oauth" | "custom" | "local";

type ProviderCatalogItem = {
  id: string;
  name: string;
  icon: string;
  providerValue: string;
  defaultModel: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  authTypes: Array<"api-key" | "oauth">;
  kind: ProviderSetupKind;
  customProviderName?: string;
  requiresBaseUrl?: boolean;
  requiresContextLength?: boolean;
  defaultBaseUrl?: string;
  docsUrl: string;
};

const providerCatalog: ProviderCatalogItem[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    icon: anthropicIcon,
    providerValue: "anthropic",
    defaultModel: "claude-sonnet-4-6",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "sk-ant-api03-...",
    authTypes: ["api-key", "oauth"],
    kind: "api-key",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "openai-codex",
    name: "OpenAI Codex",
    icon: openaiIcon,
    providerValue: "openai-codex",
    defaultModel: "gpt-5.4",
    apiKeyLabel: "OAuth credential",
    apiKeyPlaceholder: "Managed by hermes login --provider openai-codex",
    authTypes: ["oauth"],
    kind: "oauth",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: googleIcon,
    providerValue: "gemini",
    defaultModel: "gemini-2.5-pro",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "AIza...",
    authTypes: ["api-key", "oauth"],
    kind: "api-key",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: openrouterIcon,
    providerValue: "openrouter",
    defaultModel: "openai/gpt-5.4-mini",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "sk-or-v1-...",
    authTypes: ["api-key"],
    kind: "api-key",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "minimax-cn",
    name: "MiniMax (CN)",
    icon: minimaxIcon,
    providerValue: "minimax-cn",
    defaultModel: "minimax-text-01",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "sk-...",
    authTypes: ["api-key"],
    kind: "api-key",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "moonshot-cn",
    name: "Moonshot (CN)",
    icon: moonshotIcon,
    providerValue: "kimi-coding-cn",
    defaultModel: "kimi-k2-0905-preview",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "sk-...",
    authTypes: ["api-key"],
    kind: "api-key",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "moonshot-global",
    name: "Moonshot (Global)",
    icon: moonshotIcon,
    providerValue: "kimi-coding",
    defaultModel: "kimi-k2-0905-preview",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "sk-...",
    authTypes: ["api-key"],
    kind: "api-key",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "siliconflow-cn",
    name: "SiliconFlow (CN)",
    icon: siliconflowIcon,
    providerValue: "custom",
    defaultModel: "Qwen/Qwen3-Coder",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "sk-...",
    authTypes: ["api-key"],
    kind: "custom",
    customProviderName: "SiliconFlow (CN)",
    requiresBaseUrl: true,
    defaultBaseUrl: "https://api.siliconflow.cn/v1",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "ollama",
    name: "Ollama",
    icon: ollamaIcon,
    providerValue: "custom",
    defaultModel: "qwen2.5-coder:32b",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "optional for local Ollama",
    authTypes: ["api-key"],
    kind: "local",
    customProviderName: "Local Ollama",
    requiresBaseUrl: true,
    requiresContextLength: true,
    defaultBaseUrl: "http://localhost:11434/v1",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  },
  {
    id: "custom",
    name: "Custom",
    icon: customIcon,
    providerValue: "custom",
    defaultModel: "your-model-name",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "optional for local endpoint",
    authTypes: ["api-key"],
    kind: "custom",
    customProviderName: "Custom Endpoint",
    requiresBaseUrl: true,
    defaultBaseUrl: "http://localhost:8000/v1",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/integrations/providers"
  }
];

export function ModelsPage({ modelConfig }: ModelsPageProps) {
  const defaultProviderId = modelConfig?.primary.provider;
  const providers = useMemo(() => prioritizeProviders(modelConfig?.providers ?? [], defaultProviderId), [defaultProviderId, modelConfig?.providers]);
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(providers[0]?.id ?? null);
  const [addStep, setAddStep] = useState<AddDialogStep | null>(null);
  const [selectedProvider, setSelectedProvider] = useState(providerCatalog[0]);

  function openProviderPicker(): void {
    setSelectedProvider(providerCatalog[0]);
    setAddStep("choose");
  }

  return (
    <div className="workbench-page models-page">
      <div className="main-top-title">Models</div>
      <header className="models-provider-header">
        <h1>AI Model Providers</h1>
        <button className="primary-action compact-action" type="button" onClick={openProviderPicker}>
          <Plus size={14} />
          Add Provider
        </button>
      </header>

      {modelConfig ? (
        <section className="provider-list-panel">
          {providers.map((provider) => {
            const expanded = expandedProviderId === provider.id;
            return (
              <ProviderRow
                defaultProviderId={defaultProviderId}
                expanded={expanded}
                key={provider.id}
                modelConfig={modelConfig}
                onToggle={() => setExpandedProviderId(expanded ? null : provider.id)}
                provider={provider}
              />
            );
          })}
        </section>
      ) : (
        <section className="models-empty-state">
          <h2>Model configuration is loading</h2>
          <p>Hermes Studio will read providers and credentials from the desktop bridge.</p>
        </section>
      )}

      {addStep === "choose" ? (
        <ProviderPickerDialog
          onClose={() => setAddStep(null)}
          onSelect={(provider) => {
            setSelectedProvider(provider);
            setAddStep("configure");
          }}
        />
      ) : null}

      {addStep === "configure" ? (
        <ProviderConfigureDialog
          provider={selectedProvider}
          onBack={() => setAddStep("choose")}
          onClose={() => setAddStep(null)}
        />
      ) : null}
    </div>
  );
}

function ProviderRow({
  defaultProviderId,
  expanded,
  modelConfig,
  onToggle,
  provider
}: {
  defaultProviderId?: string;
  expanded: boolean;
  modelConfig: ModelConfig;
  onToggle: () => void;
  provider: ModelProvider;
}) {
  const credential = modelConfig.credentials.find((item) => item.provider === provider.id || item.provider.startsWith(`${provider.id}:`));
  const isDefault = provider.id === defaultProviderId;
  const configured = provider.status === "configured" || provider.status === "oauth-ready";
  const modelName = isDefault ? modelConfig.primary.model : fallbackModelName(provider);
  const authLabel = provider.status === "oauth-ready" ? "OAuth" : "API key";
  const credentialSource = credential?.source ?? (provider.status === "oauth-ready" ? "~/.hermes/auth.json" : "~/.hermes/.env");
  const credentialSaved = configured ? "Configured" : `${authLabel} not saved`;

  return (
    <article className={`provider-list-item ${expanded ? "provider-list-item-expanded" : ""}`}>
      <div className="provider-row-main">
        <button className="provider-row-trigger" type="button" onClick={onToggle}>
          <ProviderAvatar providerId={provider.id} providerName={provider.name} />
          <span className="provider-row-copy">
            <span className="provider-row-title">
              <strong>{provider.name}</strong>
              {isDefault ? <span className="model-badge">Default</span> : null}
            </span>
            <span className="provider-row-meta">
              <span>{provider.name}</span>
              <span>{authLabel}</span>
              <span>{modelName}</span>
              <span className={configured ? "model-status-dot model-status-ok" : "model-status-dot model-status-missing"} />
              <span>{credentialSaved}</span>
            </span>
          </span>
        </button>

        <div className="provider-row-actions">
          {!isDefault ? (
            <button className="icon-action" type="button" aria-label={`Set ${provider.name} as default`} disabled>
              <Check size={14} />
            </button>
          ) : null}
          <button className="icon-action" type="button" aria-label={`Edit ${provider.name}`} onClick={onToggle}>
            <Edit3 size={14} />
          </button>
          <button className="icon-action" type="button" aria-label={`Remove ${provider.name}`} disabled>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="provider-expanded-config">
          <div className="provider-expanded-heading">
            <strong>Provider Configuration</strong>
            <ChevronDown size={14} />
          </div>
          <div className="provider-config-row">
            <div>
              <strong>{authLabel}</strong>
              <p>{configured ? `Credential is available from ${credentialSource}.` : `No ${authLabel.toLowerCase()} credential is saved yet.`}</p>
            </div>
            <span className={configured ? "credential-status-ok" : "credential-status-warning"}>{configured ? "Configured" : "Missing"}</span>
          </div>
          <label className="provider-api-field">
            <span>{provider.status === "oauth-ready" ? "OAuth source" : "Replace API key"}</span>
            <div>
              <input disabled={provider.status === "oauth-ready"} placeholder={credential?.label ?? (provider.status === "oauth-ready" ? "~/.hermes/auth.json" : "sk-...")} type="password" />
              <button className="icon-action" type="button" aria-label="Show API key" disabled>
                <Eye size={14} />
              </button>
              <button className="primary-action compact-action" type="button" disabled>
                <Check size={14} />
              </button>
              <button className="icon-action" type="button" aria-label="Clear API key" disabled>
                <X size={14} />
              </button>
            </div>
            <small>{provider.status === "oauth-ready" ? "OAuth credentials are managed in ~/.hermes/auth.json." : "Leave this blank if you want to keep the currently saved API key."}</small>
          </label>
        </div>
      ) : null}
    </article>
  );
}

function ProviderPickerDialog({ onClose, onSelect }: { onClose: () => void; onSelect: (provider: ProviderCatalogItem) => void }) {
  return (
    <div className="job-dialog-backdrop" role="presentation">
      <section className="provider-dialog provider-picker-dialog">
        <DialogHeader description="Configure a new AI model provider" onClose={onClose} title="Add AI Provider" />
        <div className="provider-picker-grid">
          {providerCatalog.map((provider) => (
            <button className="provider-picker-option" key={provider.id} type="button" onClick={() => onSelect(provider)}>
              <ProviderAvatar icon={provider.icon} providerName={provider.name} />
              <strong>{provider.name}</strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProviderConfigureDialog({ onBack, onClose, provider }: { onBack: () => void; onClose: () => void; provider: ProviderCatalogItem }) {
  const [authType, setAuthType] = useState(provider.authTypes[0]);
  const usesApiKey = authType === "api-key";
  const requiresApiKey = usesApiKey && provider.kind !== "local";
  const isCustomProvider = provider.providerValue === "custom";
  const poolKey = isCustomProvider ? `custom:${provider.customProviderName ?? provider.name}` : provider.providerValue;

  return (
    <div className="job-dialog-backdrop" role="presentation">
      <section className="provider-dialog provider-configure-dialog">
        <DialogHeader description="Configure a new AI model provider" onClose={onClose} title="Add AI Provider" />
        <div className="provider-selected-card">
          <ProviderAvatar icon={provider.icon} providerName={provider.name} />
          <div>
            <strong>{provider.name}</strong>
            <button className="provider-link-button" type="button" onClick={onBack}>
              Change provider
            </button>
            <a className="provider-link-button" href={provider.docsUrl} rel="noreferrer" target="_blank">
              View docs <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <label className="provider-form-field">
          <span>Display name</span>
          <input defaultValue={provider.name} />
        </label>
        <div className="provider-form-grid">
          <label className="provider-form-field">
            <span>model.provider</span>
            <input defaultValue={provider.providerValue} />
            <small>Saved in `~/.hermes/config.yaml`. Use `custom` for OpenAI-compatible endpoints with `base_url`.</small>
          </label>
          <label className="provider-form-field">
            <span>model.default</span>
            <input defaultValue={provider.defaultModel} />
            <small>The provider-specific model id Hermes sends to the runtime provider.</small>
          </label>
        </div>
        {provider.authTypes.length > 1 ? (
          <label className="provider-form-field">
            <span>Authentication</span>
            <select value={authType} onChange={(event) => setAuthType(event.target.value as "api-key" | "oauth")}>
              {provider.authTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "oauth" ? "OAuth login" : "API key"}
                </option>
              ))}
            </select>
            <small>Hermes supports both API key and OAuth for this provider.</small>
          </label>
        ) : null}
        {provider.requiresBaseUrl ? (
          <label className="provider-form-field">
            <span>model.base_url</span>
            <input defaultValue={provider.defaultBaseUrl} placeholder="https://host.example/v1" />
            <small>Direct OpenAI-compatible endpoint. When set, Hermes calls this URL and ignores built-in provider routing.</small>
          </label>
        ) : null}
        <label className="provider-form-field">
          <span>{usesApiKey ? "model.api_key / credential pool" : provider.apiKeyLabel}</span>
          <div>
            <input disabled={!usesApiKey} placeholder={usesApiKey ? provider.apiKeyPlaceholder : "OAuth credentials are saved in ~/.hermes/auth.json"} type="password" />
            <button className="icon-action" type="button" aria-label="Show API key" disabled>
              <Eye size={14} />
            </button>
          </div>
          <small>
            {usesApiKey
              ? `${requiresApiKey ? "Required" : "Optional"} for this provider. API keys are saved to ~/.hermes/.env or ~/.hermes/auth.json credential_pool.`
              : "Hermes runs the provider OAuth flow and stores tokens in ~/.hermes/auth.json."}
          </small>
        </label>
        {provider.requiresContextLength ? (
          <label className="provider-form-field">
            <span>Context length</span>
            <input defaultValue="32768" />
            <small>Recommended for local Ollama agent use; Hermes docs suggest at least 16k-32k for tool-heavy sessions.</small>
          </label>
        ) : null}
        <label className="provider-form-field">
          <span>credential_pool_strategies.{poolKey}</span>
          <select defaultValue="fill_first">
            <option value="fill_first">fill_first</option>
            <option value="round_robin">round_robin</option>
            <option value="least_used">least_used</option>
            <option value="random">random</option>
          </select>
          <small>Used when multiple credentials exist for the same provider pool.</small>
        </label>
        <div className="provider-dialog-footer">
          <button className="secondary-action compact-action" type="button" onClick={onBack}>
            Back
          </button>
          <button className="primary-action compact-action" type="button" disabled>
            Add Provider
          </button>
        </div>
      </section>
    </div>
  );
}

function DialogHeader({ description, onClose, title }: { description: string; onClose: () => void; title: string }) {
  return (
    <div className="provider-dialog-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <button className="icon-action" type="button" aria-label="Close dialog" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

function ProviderAvatar({ icon, providerId, providerName }: { icon?: string; providerId?: string; providerName: string }) {
  const resolvedIcon = icon ?? providerIconForId(providerId, providerName);
  const initials = providerName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .replace(/[^A-Z]/gi, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="provider-avatar">
      {resolvedIcon ? <img alt="" src={resolvedIcon} /> : initials || <Bot size={18} />}
    </span>
  );
}

function providerIconForId(providerId: string | undefined, providerName: string): string | undefined {
  const normalized = `${providerId ?? ""} ${providerName}`.toLowerCase();

  if (normalized.includes("anthropic")) {
    return anthropicIcon;
  }

  if (normalized.includes("openai")) {
    return openaiIcon;
  }

  if (normalized.includes("gemini") || normalized.includes("google")) {
    return googleIcon;
  }

  if (normalized.includes("openrouter")) {
    return openrouterIcon;
  }

  if (normalized.includes("minimax")) {
    return minimaxIcon;
  }

  if (normalized.includes("moonshot") || normalized.includes("kimi")) {
    return moonshotIcon;
  }

  if (normalized.includes("siliconflow")) {
    return siliconflowIcon;
  }

  if (normalized.includes("ollama")) {
    return ollamaIcon;
  }

  if (normalized.includes("ark") || normalized.includes("bytedance")) {
    return arkIcon;
  }

  if (normalized.includes("custom")) {
    return customIcon;
  }

  return undefined;
}

function fallbackModelName(provider: ModelProvider): string {
  if (provider.id === "anthropic") {
    return "claude-sonnet-4-6";
  }

  if (provider.id === "openai-codex") {
    return "gpt-5.4";
  }

  if (provider.id === "custom") {
    return "custom model";
  }

  if (provider.status === "oauth-ready") {
    return "oauth";
  }

  return "not selected";
}

function prioritizeProviders(providers: ModelProvider[], defaultProviderId?: string): ModelProvider[] {
  return [...providers].sort((left, right) => {
    if (left.id === defaultProviderId) {
      return -1;
    }

    if (right.id === defaultProviderId) {
      return 1;
    }

    const leftConfigured = left.status === "configured" || left.status === "oauth-ready";
    const rightConfigured = right.status === "configured" || right.status === "oauth-ready";

    if (leftConfigured !== rightConfigured) {
      return leftConfigured ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}
