"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { atsLabel, canAutoApply } from "@/lib/ats";
import {
  getApplication,
  getProfile,
  upsertApplication,
} from "@/lib/client-store";
import type { Application } from "@/lib/types";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const found = await getApplication(params.id);
    if (!found) throw new Error("Not found on this device");
    setApp(found);
  }, [params.id]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [load]);

  async function prepare() {
    if (!app) return;
    setBusy("prepare");
    setError("");
    try {
      const profile = await getProfile();
      const res = await fetch("/api/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          title: app.title,
          company: app.company,
          description: app.description,
        }),
      });
      const materials = await res.json();
      if (!res.ok) throw new Error(materials.error || "Prepare failed");
      const updated = await upsertApplication({
        ...app,
        tailored_resume: materials.tailored_resume || "",
        cover_letter: materials.cover_letter || "",
        screening_answers: JSON.stringify(materials.screening_answers || {}),
        apply_notes: materials.match_notes || "",
        status: canAutoApply(app.ats) ? "ready" : "prepared",
        error: "",
      });
      setApp(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function apply() {
    if (!app) return;
    setBusy("apply");
    setError("");
    try {
      const profile = await getProfile();
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, application: app }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Apply failed");
      const updated = await upsertApplication({
        ...app,
        status: result.status || "needs_manual",
        apply_notes: [app.apply_notes, result.notes].filter(Boolean).join("\n\n"),
        screenshot_path: result.screenshot_path || app.screenshot_path,
        error: result.error || "",
        submitted_at:
          result.status === "submitted" ? new Date().toISOString() : app.submitted_at,
      });
      setApp(updated);
      if (result.mobile_hint || result.status === "needs_manual") {
        window.open(app.url, "_blank", "noopener,noreferrer");
      }
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
      const updated = await upsertApplication(app);
      setApp(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function copyText(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1600);
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`status-pill status-${app.status}`}>{app.status}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              {atsLabel(app.ats)}
            </span>
            {!canAutoApply(app.ats) ? (
              <span className="text-xs font-semibold text-[var(--signal)]">
                Manual submit
              </span>
            ) : null}
          </div>
          <h1 className="display text-3xl sm:text-4xl md:text-5xl">{app.title}</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            {app.company}
            {app.location ? ` · ${app.location}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-secondary !py-2" href={app.url} target="_blank" rel="noreferrer">
            Open posting
          </a>
          <button className="btn btn-secondary !py-2" onClick={prepare} disabled={Boolean(busy)}>
            {busy === "prepare" ? "Preparing…" : "Re-prepare"}
          </button>
          <button className="btn btn-primary !py-2" onClick={apply} disabled={Boolean(busy)}>
            {busy === "apply" ? "Applying…" : "Apply / open form"}
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

      <div className="grid gap-4">
        <div className="panel rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-lg">Tailored resume</h2>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary !py-2"
                type="button"
                onClick={() => copyText("resume", app.tailored_resume)}
              >
                {copied === "resume" ? "Copied" : "Copy"}
              </button>
              <button className="btn btn-secondary !py-2" onClick={saveEdits} disabled={Boolean(busy)}>
                {busy === "save" ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <textarea
            className="field min-h-[22rem] font-mono text-sm"
            value={app.tailored_resume}
            onChange={(e) => setApp({ ...app, tailored_resume: e.target.value })}
          />
        </div>
        <div className="panel rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-lg">Cover letter</h2>
            <button
              className="btn btn-secondary !py-2"
              type="button"
              onClick={() => copyText("cover", app.cover_letter)}
            >
              {copied === "cover" ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            className="field min-h-[16rem]"
            value={app.cover_letter}
            onChange={(e) => setApp({ ...app, cover_letter: e.target.value })}
          />
        </div>
      </div>

      <div className="panel rounded-2xl p-4 sm:p-5 space-y-3">
        <h2 className="font-bold text-lg">Job description excerpt</h2>
        <p className="text-sm text-[var(--ink-soft)] whitespace-pre-wrap max-h-72 overflow-auto">
          {app.description || "No description scraped."}
        </p>
      </div>
    </div>
  );
}
