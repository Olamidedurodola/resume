"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { atsLabel, canAutoApply, normalizeJobUrl } from "@/lib/ats";
import {
  deleteApplication,
  getApplicationByUrl,
  getProfile,
  listApplications,
  newApplicationId,
  upsertApplication,
} from "@/lib/client-store";
import type { Application } from "@/lib/types";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [installHint, setInstallHint] = useState(false);
  const [apps, setApps] = useState<Application[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);

  const load = useCallback(async () => {
    setApps(await listApplications());
  }, []);

  useEffect(() => {
    load().catch(() => setError("Could not load applications"));
  }, [load]);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void> });
      setInstallHint(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone);
    if (isIos) setInstallHint(true);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const profile = await getProfile();
      if (!profile.full_name || !profile.email) {
        throw new Error("Fill in your name and email on Profile first.");
      }

      const normalized = normalizeJobUrl(url);
      const existing = await getApplicationByUrl(normalized);
      if (existing) {
        throw new Error("This job link is already in your queue.");
      }

      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const scraped = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scraped.error || "Scrape failed");

      const prepareRes = await fetch("/api/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          title: scraped.title,
          company: scraped.company,
          description: scraped.description,
        }),
      });
      const materials = await prepareRes.json();
      if (!prepareRes.ok) throw new Error(materials.error || "Prepare failed");

      const now = new Date().toISOString();
      const app: Application = {
        id: newApplicationId(),
        url: normalized,
        ats: scraped.ats,
        company: scraped.company,
        title: scraped.title,
        location: scraped.location,
        description: scraped.description,
        status: canAutoApply(scraped.ats) ? "ready" : "prepared",
        tailored_resume: materials.tailored_resume || "",
        cover_letter: materials.cover_letter || "",
        screening_answers: JSON.stringify(materials.screening_answers || {}),
        apply_notes: materials.match_notes || "",
        error: "",
        screenshot_path: "",
        created_at: now,
        updated_at: now,
        submitted_at: null,
      };
      await upsertApplication(app);
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function removeApp(id: string) {
    await deleteApplication(id);
    await load();
  }

  async function installApp() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      setInstallHint(false);
    }
  }

  return (
    <div className="space-y-6">
      {installHint ? (
        <div className="panel rounded-2xl p-4 text-sm text-[var(--ink-soft)] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p>
            {deferredPrompt
              ? "Install LinkApply on your home screen for one-tap access."
              : "On iPhone: Share → Add to Home Screen to install the PWA."}
          </p>
          {deferredPrompt ? (
            <button className="btn btn-primary !py-2" onClick={installApp}>
              Install
            </button>
          ) : null}
        </div>
      ) : null}

      <section className="rise panel rounded-[28px] p-6 md:p-10 overflow-hidden relative">
        <div className="absolute inset-y-0 right-0 w-1/2 opacity-40 pointer-events-none hidden md:block">
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, transparent 20%, rgba(31,107,74,0.18) 50%, rgba(196,92,38,0.16) 100%)",
            }}
          />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--moss)] mb-3">
          Personal auto-apply
        </p>
        <h1 className="display text-4xl sm:text-5xl md:text-7xl max-w-3xl text-[var(--ink)]">
          Drop a job link. Walk away with an application.
        </h1>
        <p className="mt-4 max-w-xl text-base md:text-lg text-[var(--ink-soft)]">
          Works on your phone as an installable app. Data stays on this device; scrape and
          AI prepare run in the cloud.
        </p>

        <form onSubmit={onSubmit} className="rise-delay mt-7 max-w-2xl space-y-3">
          <label className="label" htmlFor="job-url">
            Job URL
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="job-url"
              className="field"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="Paste Greenhouse, Lever, or Ashby link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button className="btn btn-primary whitespace-nowrap" disabled={loading}>
              {loading ? "Working…" : "Add & prepare"}
            </button>
          </div>
          {error ? <p className="text-[var(--signal)] text-sm font-medium">{error}</p> : null}
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="display text-3xl">Queue</h2>
          <span className="text-sm text-[var(--ink-soft)]">{apps.length} tracked</span>
        </div>

        {apps.length === 0 ? (
          <div className="panel rounded-2xl p-6 text-[var(--ink-soft)]">
            No links yet. Paste a job URL above from your phone or laptop.
          </div>
        ) : (
          <ul className="space-y-3">
            {apps.map((app) => (
              <li
                key={app.id}
                className="panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`status-pill status-${app.status}`}>{app.status}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                      {atsLabel(app.ats)}
                    </span>
                  </div>
                  <Link
                    href={`/applications/${app.id}`}
                    className="font-bold text-lg leading-snug hover:underline"
                  >
                    {app.title || "Untitled role"}
                  </Link>
                  <p className="text-sm text-[var(--ink-soft)] truncate mt-1">
                    {app.company}
                    {app.location ? ` · ${app.location}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="btn btn-secondary !py-2" href={`/applications/${app.id}`}>
                    Open
                  </Link>
                  <a
                    className="btn btn-secondary !py-2"
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source
                  </a>
                  <button className="btn btn-danger !py-2" onClick={() => removeApp(app.id)}>
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
