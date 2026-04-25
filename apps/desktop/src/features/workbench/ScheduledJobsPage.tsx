import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Bot, CalendarClock, CheckCircle2, Clock3, MessageSquare, Pause, Play, Plus, RotateCw, Trash2, X } from "lucide-react";
import type { CreateScheduledJobInput, InstalledSkill, ScheduledJob, UpdateScheduledJobInput } from "@hermes-studio/bridge";
import type { ReactNode } from "react";

type ScheduledJobsPageProps = {
  installedSkills: InstalledSkill[];
  jobs: ScheduledJob[];
  selectedJob: ScheduledJob | null;
  onCreateJob: (input: CreateScheduledJobInput) => Promise<void>;
  onUpdateJob: (input: UpdateScheduledJobInput) => Promise<void>;
  onPauseJob: (jobId: string) => Promise<void>;
  onRefreshJobs: () => Promise<void>;
  onRemoveJob: (jobId: string) => Promise<void>;
  onResumeJob: (jobId: string) => Promise<void>;
  onRunJobNow: (jobId: string) => Promise<void>;
  onSelectJob: (job: ScheduledJob) => void;
};

type JobDialogMode = "create" | "edit";

type JobFormState = {
  name: string;
  schedule: string;
  delivery: string;
  prompt: string;
  skills: string[];
};

const deliveryTargets = ["local", "origin", "telegram", "discord", "slack", "email", "sms", "feishu", "dingtalk"];

const emptyForm: JobFormState = {
  name: "",
  schedule: "every 2h",
  delivery: "local",
  prompt: "",
  skills: []
};

export function ScheduledJobsPage({
  installedSkills,
  jobs,
  selectedJob,
  onCreateJob,
  onUpdateJob,
  onPauseJob,
  onRefreshJobs,
  onRemoveJob,
  onResumeJob,
  onRunJobNow,
  onSelectJob
}: ScheduledJobsPageProps) {
  const [dialogMode, setDialogMode] = useState<JobDialogMode | null>(null);
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null);
  const activeCount = jobs.filter((job) => job.status === "active" || job.status === "queued").length;
  const pausedCount = jobs.filter((job) => job.status === "paused").length;
  const failedCount = jobs.filter((job) => job.status === "failed" || job.lastRunStatus === "failed").length;

  function openCreateDialog(): void {
    setEditingJob(null);
    setDialogMode("create");
  }

  function openEditDialog(job: ScheduledJob): void {
    onSelectJob(job);
    setEditingJob(job);
    setDialogMode("edit");
  }

  function closeDialog(): void {
    setDialogMode(null);
    setEditingJob(null);
  }

  return (
    <div className="workbench-page scheduled-jobs-page">
      <div className="main-top-title">Scheduled Jobs</div>
      <header className="workbench-header scheduled-jobs-header">
        <div>
          <h1>Scheduled Jobs</h1>
          <p>Schedule fresh Hermes sessions with prompts, delivery targets, and optional skills.</p>
        </div>
        <div className="scheduled-jobs-actions">
          <button className="secondary-action compact-action" type="button" onClick={() => void onRefreshJobs()}>
            <RotateCw size={14} />
            Refresh
          </button>
          <button className="primary-action compact-action" type="button" onClick={openCreateDialog}>
            <Plus size={14} />
            New Job
          </button>
        </div>
      </header>

      <section className="job-metric-grid">
        <MetricCard icon={<Clock3 size={18} />} label="Total jobs" tone="blue" value={jobs.length} />
        <MetricCard icon={<Play size={18} />} label="Running" tone="green" value={activeCount} />
        <MetricCard icon={<Pause size={18} />} label="Paused" tone="gold" value={pausedCount} />
        <MetricCard icon={<AlertCircle size={18} />} label="Failed" tone="red" value={failedCount} />
      </section>

      <section className="jobs-board" aria-label="Scheduled jobs">
        {jobs.map((job) => (
          <button
            className={`job-card ${selectedJob?.id === job.id ? "job-card-active" : ""}`}
            key={job.id}
            type="button"
            onClick={() => openEditDialog(job)}
          >
            <span className="job-card-icon">
              <CalendarClock size={18} />
            </span>
            <span className="job-card-body">
              <span className="job-card-title-row">
                <strong>{job.name}</strong>
                <span className={`job-status-dot job-status-${job.status}`} />
              </span>
              <span className="job-card-schedule">
                <Clock3 size={13} />
                {job.schedule}
              </span>
              <span className="job-card-line">
                <MessageSquare size={13} />
                {job.prompt}
              </span>
              <span className="job-card-meta">
                <span>
                  <CalendarClock size={13} />
                  Next: {formatDateTime(job.nextRunAt)}
                </span>
                <span>
                  <Bot size={13} />
                  {job.delivery}
                </span>
                <span>{job.skills.length ? job.skills.join(", ") : "no skills"}</span>
              </span>
            </span>
            <span className={job.status === "paused" ? "job-card-switch" : "job-card-switch job-card-switch-on"} />
          </button>
        ))}
      </section>

      {dialogMode ? (
        <JobDialog
          installedSkills={installedSkills}
          job={editingJob}
          mode={dialogMode}
          onClose={closeDialog}
          onCreateJob={onCreateJob}
          onPauseJob={onPauseJob}
          onRemoveJob={onRemoveJob}
          onResumeJob={onResumeJob}
          onRunJobNow={onRunJobNow}
          onUpdateJob={onUpdateJob}
        />
      ) : null}
    </div>
  );
}

function MetricCard({ icon, label, tone, value }: { icon: ReactNode; label: string; tone: "blue" | "green" | "gold" | "red"; value: number }) {
  return (
    <div className="job-metric-card">
      <span className={`job-metric-icon job-metric-${tone}`}>{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function JobDialog({
  installedSkills,
  job,
  mode,
  onClose,
  onCreateJob,
  onPauseJob,
  onRemoveJob,
  onResumeJob,
  onRunJobNow,
  onUpdateJob
}: {
  installedSkills: InstalledSkill[];
  job: ScheduledJob | null;
  mode: JobDialogMode;
  onClose: () => void;
  onCreateJob: (input: CreateScheduledJobInput) => Promise<void>;
  onPauseJob: (jobId: string) => Promise<void>;
  onRemoveJob: (jobId: string) => Promise<void>;
  onResumeJob: (jobId: string) => Promise<void>;
  onRunJobNow: (jobId: string) => Promise<void>;
  onUpdateJob: (input: UpdateScheduledJobInput) => Promise<void>;
}) {
  const [form, setForm] = useState<JobFormState>(toFormState(job));
  const [isSaving, setIsSaving] = useState(false);
  const selectedSkillNames = useMemo(() => new Set(form.skills), [form.skills]);
  const isEditMode = mode === "edit" && job;

  useEffect(() => {
    setForm(toFormState(job));
  }, [job]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);

    if (isEditMode) {
      await onUpdateJob({ jobId: job.id, ...form });
    } else {
      await onCreateJob(form);
    }

    setIsSaving(false);
    onClose();
  }

  function patchForm(patch: Partial<JobFormState>): void {
    setForm((current) => ({ ...current, ...patch }));
  }

  function toggleSkill(skillName: string): void {
    setForm((current) => ({
      ...current,
      skills: current.skills.includes(skillName) ? current.skills.filter((name) => name !== skillName) : [...current.skills, skillName]
    }));
  }

  async function handleRemove(): Promise<void> {
    if (!job || !window.confirm(`Remove scheduled job "${job.name}"?`)) {
      return;
    }

    await onRemoveJob(job.id);
    onClose();
  }

  return (
    <div className="job-dialog-backdrop" role="presentation">
      <form className="job-dialog" onSubmit={(event) => void handleSubmit(event)}>
        <div className="job-dialog-header">
          <div>
            <h2>{isEditMode ? "Edit Scheduled Job" : "New Scheduled Job"}</h2>
            <p>{isEditMode ? "Update the cron session prompt, cadence, delivery, and attached skills." : "Create a fresh Hermes cron session from a self-contained prompt."}</p>
          </div>
          <button className="icon-action" type="button" aria-label="Close dialog" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="job-dialog-content">
          <div className="job-dialog-grid">
            <label>
              <span>Name</span>
              <input value={form.name} onChange={(event) => patchForm({ name: event.target.value })} placeholder="Morning brief" />
            </label>
            <label>
              <span>Schedule</span>
              <input value={form.schedule} onChange={(event) => patchForm({ schedule: event.target.value })} placeholder="30m, every 2h, 0 9 * * *" />
            </label>
            <label>
              <span>Delivery</span>
              <select value={form.delivery} onChange={(event) => patchForm({ delivery: event.target.value })}>
                {deliveryTargets.map((target) => (
                  <option key={target} value={target}>
                    {target}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="job-dialog-prompt">
            <span>Prompt</span>
            <textarea
              value={form.prompt}
              onChange={(event) => patchForm({ prompt: event.target.value })}
              placeholder="Use a self-contained prompt. Cron jobs run in fresh Hermes sessions."
            />
          </label>

          <div className="job-skill-picker">
            {installedSkills.map((skill) => (
              <button
                className={selectedSkillNames.has(skill.name) ? "job-skill-chip job-skill-chip-active" : "job-skill-chip"}
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.name)}
              >
                {skill.name}
              </button>
            ))}
          </div>

          {job ? (
            <div className="job-dialog-details">
              <div className="key-value job-key-value">
                <span>Status</span>
                <strong>{job.status}</strong>
              </div>
              <div className="key-value job-key-value">
                <span>Next run</span>
                <strong>{formatDateTime(job.nextRunAt)}</strong>
              </div>
              <div className="key-value job-key-value">
                <span>Last run</span>
                <strong>{formatDateTime(job.lastRunAt)} · {job.lastRunStatus}</strong>
              </div>
              <div className="key-value job-key-value">
                <span>Output</span>
                <strong>{job.outputPath}</strong>
              </div>
            </div>
          ) : null}
        </div>

        <div className="job-dialog-footer">
          {job ? (
            <div className="job-dialog-secondary-actions">
              {job.status === "paused" ? (
                <button className="secondary-action compact-action" type="button" onClick={() => void onResumeJob(job.id)}>
                  <Play size={14} />
                  Resume
                </button>
              ) : (
                <button className="secondary-action compact-action" type="button" onClick={() => void onPauseJob(job.id)}>
                  <Pause size={14} />
                  Pause
                </button>
              )}
              <button className="secondary-action compact-action" type="button" onClick={() => void onRunJobNow(job.id)}>
                <RotateCw size={14} />
                Run
              </button>
              <button className="secondary-action compact-action danger-action" type="button" onClick={() => void handleRemove()}>
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          ) : null}

          <div className="job-dialog-primary-actions">
            <button className="secondary-action compact-action" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-action compact-action" disabled={isSaving || !form.name.trim() || !form.prompt.trim()} type="submit">
              {isEditMode ? <CheckCircle2 size={14} /> : <Plus size={14} />}
              {isEditMode ? "Save Changes" : "Create Job"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function toFormState(job: ScheduledJob | null): JobFormState {
  if (!job) {
    return emptyForm;
  }

  return {
    name: job.name,
    schedule: job.schedule,
    delivery: job.delivery,
    prompt: job.prompt,
    skills: job.skills
  };
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
