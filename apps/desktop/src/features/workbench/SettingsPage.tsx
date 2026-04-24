import { Activity, CheckCircle2, Monitor, PackageCheck, Plug, RadioTower, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import type { AppInfo, RuntimeStatus, Settings } from "@hermes-studio/bridge";

type SettingsPageProps = {
  appInfo: AppInfo | null;
  runtimeStatus: RuntimeStatus | null;
  settings: Settings | null;
};

export function SettingsPage({ appInfo, runtimeStatus, settings }: SettingsPageProps) {
  const runtimeOk = runtimeStatus?.state === "idle" || runtimeStatus?.state === "running";

  return (
    <div className="workbench-page">
      <div className="main-top-title">Settings</div>
      <header className="workbench-header">
        <div>
          <h1>Settings</h1>
          <p>Runtime health, gateway services, toolsets, MCP connections, and desktop configuration entry points.</p>
        </div>
      </header>

      <div className="settings-grid">
        <section className="settings-panel">
          <div className="panel-heading">
            <PackageCheck size={16} />
            <h2>Hermes Runtime</h2>
          </div>
          <KeyValue label="Lock ref" value={appInfo?.hermesVersion.ref ?? "unknown"} />
          <KeyValue label="Commit" value={shortCommit(appInfo?.hermesVersion.commit)} />
          <KeyValue label="Status" value={runtimeStatus?.state ?? "loading"} />
          {runtimeStatus?.state === "idle" && runtimeStatus.vendorPath ? <KeyValue label="Vendor path" value={runtimeStatus.vendorPath} /> : null}
          {runtimeStatus?.state === "missing" ? <p className="doctor-warning">{runtimeStatus.message}</p> : null}
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <Monitor size={16} />
            <h2>Desktop App</h2>
          </div>
          <KeyValue label="App version" value={appInfo?.version ?? "0.1.0"} />
          <KeyValue label="Platform" value={appInfo?.platform ?? "unknown"} />
          <KeyValue label="Default model" value={settings?.defaultModel ?? "GPT-5.4 Mini"} />
          <KeyValue label="Theme" value={settings?.theme ?? "light"} />
        </section>

        <section className="settings-panel settings-panel-wide">
          <div className="panel-heading">
            {runtimeOk ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
            <h2>Doctor</h2>
          </div>
          <div className="doctor-list">
            <DoctorItem ok={Boolean(appInfo)} label="Desktop bridge is responding" />
            <DoctorItem ok={runtimeOk} label="Vendored Hermes runtime is available" />
            <DoctorItem ok={Boolean(settings)} label="Settings store is reachable" />
            <DoctorItem ok label="Renderer is isolated from direct Node access" />
          </div>
        </section>

        <section className="settings-panel settings-panel-wide">
          <div className="panel-heading">
            <Activity size={16} />
            <h2>Configuration Areas</h2>
          </div>
          <div className="config-pill-row">
            <span>Model / Provider</span>
            <span>API Keys</span>
            <span>Permissions</span>
            <span>Display</span>
            <span>Voice</span>
            <span>Logs</span>
            <span>Advanced Config</span>
          </div>
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <RadioTower size={16} />
            <h2>Gateway & Cron</h2>
          </div>
          <KeyValue label="Gateway" value="foreground / service capable" />
          <KeyValue label="Scheduler tick" value="60 seconds" />
          <KeyValue label="Jobs file" value="~/.hermes/cron/jobs.json" />
          <KeyValue label="Output path" value="~/.hermes/cron/output/" />
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <Wrench size={16} />
            <h2>Toolsets</h2>
          </div>
          <div className="config-pill-row">
            <span>web</span>
            <span>terminal</span>
            <span>file</span>
            <span>browser</span>
            <span>memory</span>
            <span>skills</span>
            <span>cronjob</span>
            <span>delegation</span>
          </div>
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <Plug size={16} />
            <h2>MCP</h2>
          </div>
          <p className="panel-copy">External MCP servers will appear here with per-server tool filtering and startup status.</p>
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <ShieldCheck size={16} />
            <h2>Security</h2>
          </div>
          <p className="panel-copy">Command approval, prompt-injection checks, and renderer isolation stay managed by the desktop shell.</p>
        </section>
      </div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="key-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DoctorItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="doctor-item">
      {ok ? <CheckCircle2 size={14} /> : <TriangleAlert size={14} />}
      <span>{label}</span>
    </div>
  );
}

function shortCommit(commit?: string): string {
  if (!commit || commit === "unknown") {
    return "unknown";
  }

  return commit.slice(0, 12);
}
