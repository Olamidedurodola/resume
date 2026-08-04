"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { atsLabel, canAutoApply } from "@/lib/ats";
import type { Application } from "@/lib/types";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${params.id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Not found");
    setApp(data);
  }, [params.id]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [load]);

  async function prepare() {
    setBusy("prepare");
    setError("");
    try {
      const res = await fetch(`/api/jobs/${params.id}/prepare`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prepare failed");
      setApp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function apply() {
    setBusy("apply");
    setError("");
    try {
      const res = await fetch(`/api/jobs/${params.id}/apply`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Apply failed");
      setApp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function saveEdits() {
    if (!app) return;
    setBusy("save");
    setError("");
    try {
      const res = await fetch(`/api/jobs/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailored_resume: app.tailored_resume,
          cover_letter: app.cover_letter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setApp(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  if (!app && !error) {
    return <p className="pulse-soft text-[var(--ink-soft)]">Loading application…</p>;
  }

  if (!app) {
    return (
      <div>
        <p className="text-[var(--signal)]">{error}</p>
        <Link href="/" className="btn btn-secondary mt-4 inline-flex">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`status-pill status-${app.status}`}>{app.status}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              {atsLabel(app.ats)}
            </span>
            {!canAutoApply(app.ats) ? (
              <span className="text-xs font-semibold text-[var(--signal)]">
                Manual submit required
              </span>
            ) : null}
          </div>
          <h1 className="display text-4xl md:text-5xl">{app.title}</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            {app.company}
            {app.location ? ` · ${app.location}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-secondary" href={app.url} target="_blank" rel="noreferrer">
            Open posting
          </a>
          <button className="btn btn-secondary" onClick={prepare} disabled={Boolean(busy)}>
            {busy === "prepare" ? "Preparing…" : "Re-prepare"}
          </button>
          <button className="btn btn-primary" onClick={apply} disabled={Boolean(busy)}>
            {busy === "apply" ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>

      {error ? <p className="text-[var(--signal)] font-medium">{error}</p> : null}
      {app.error ? (
        <p className="panel rounded-xl p-4 text-[var(--signal)] text-sm">{app.error}</p>
      ) : null}
      {app.apply_notes ? (
        <div className="panel rounded-xl p-4 text-sm whitespace-pre-wrap text-[var(--ink-soft)]">
          {app.apply_notes}
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Tailored resume</h2>
            <button className="btn btn-secondary" onClick={saveEdits} disabled={Boolean(busy)}>
              {busy === "save" ? "Saving…" : "Save edits"}
            </button>
          </div>
          <textarea
            className="field min-h-[28rem] font-mono text-sm"
            value={app.tailored_resume}
            onChange={(e) => setApp({ ...app, tailored_resume: e.target.value })}
          />
        </div>
        <div className="panel rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-lg">Cover letter</h2>
          <textarea
            className="field min-h-[28rem]"
            value={app.cover_letter}
            onChange={(e) => setApp({ ...app, cover_letter: e.target.value })}
          />
        </div>
      </div>

      <div className="panel rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Job description excerpt</h2>
        <p className="text-sm text-[var(--ink-soft)] whitespace-pre-wrap max-h-80 overflow-auto">
          {app.description || "No description scraped."}
        </p>
      </div>
    </div>
  );
}
