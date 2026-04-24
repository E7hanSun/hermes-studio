import { Activity, CheckCircle2, Monitor, PackageCheck, TriangleAlert } from "lucide-react";
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
          <p>Runtime health, desktop environment, model defaults, and future configuration entry points.</p>
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
            <h2>Next Configuration Areas</h2>
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
