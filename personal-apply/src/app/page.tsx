"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Application } from "@/lib/types";
import { atsLabel } from "@/lib/ats";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [autoApply, setAutoApply] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apps, setApps] = useState<Application[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setApps(data);
  }, []);

  useEffect(() => {
    load().catch(() => setError("Could not load applications"));
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          prepare: true,
          apply: autoApply,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add job");
      }
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function removeApp(id: string) {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-8">
      <section className="rise panel rounded-[28px] p-7 md:p-10 overflow-hidden relative">
        <div className="absolute inset-y-0 right-0 w-1/2 opacity-40 pointer-events-none hidden md:block">
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, transparent 20%, rgba(31,107,74,0.18) 50%, rgba(196,92,38,0.16) 100%)",
            }}
          />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--moss)] mb-4">
          Personal auto-apply
        </p>
        <h1 className="display text-5xl md:text-7xl max-w-3xl text-[var(--ink)]">
          Drop a job link. Walk away with an application.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-[var(--ink-soft)]">
          LinkApply scrapes the posting, tailors your resume and cover letter, then fills
          Greenhouse, Lever, and Ashby forms for you.
        </p>

        <form onSubmit={onSubmit} className="rise-delay mt-8 max-w-2xl space-y-4">
          <label className="label" htmlFor="job-url">
            Job URL
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="job-url"
              className="field"
              placeholder="https://boards.greenhouse.io/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button className="btn btn-primary whitespace-nowrap" disabled={loading}>
              {loading ? "Working…" : "Add & prepare"}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
            />
            Also run apply now (uses profile auto-submit setting for actual submit)
          </label>
          {error ? <p className="text-[var(--signal)] text-sm font-medium">{error}</p> : null}
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="display text-3xl">Application queue</h2>
          <span className="text-sm text-[var(--ink-soft)]">{apps.length} tracked</span>
        </div>

        {apps.length === 0 ? (
          <div className="panel rounded-2xl p-8 text-[var(--ink-soft)]">
            No links yet. Paste a Greenhouse, Lever, or Ashby job URL above.
          </div>
        ) : (
          <ul className="space-y-3">
            {apps.map((app) => (
              <li
                key={app.id}
                className="panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`status-pill status-${app.status}`}>{app.status}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                      {atsLabel(app.ats)}
                    </span>
                  </div>
                  <Link href={`/applications/${app.id}`} className="font-bold text-lg hover:underline">
                    {app.title || "Untitled role"}
                  </Link>
                  <p className="text-sm text-[var(--ink-soft)] truncate">
                    {app.company}
                    {app.location ? ` · ${app.location}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="btn btn-secondary" href={`/applications/${app.id}`}>
                    Open
                  </Link>
                  <a className="btn btn-secondary" href={app.url} target="_blank" rel="noreferrer">
                    Source
                  </a>
                  <button className="btn btn-danger" onClick={() => removeApp(app.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
