"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Profile } from "@/lib/types";

const empty: Profile = {
  id: 1,
  full_name: "",
  email: "",
  phone: "",
  location: "",
  linkedin_url: "",
  portfolio_url: "",
  work_authorization: "",
  resume_text: "",
  default_cover_letter: "",
  answers_json: '{\n  "years_experience": "",\n  "notice_period": "",\n  "salary_expectation": "",\n  "visa_sponsorship_needed": "No"\n}',
  auto_submit: 0,
  openai_model: "gpt-4o-mini",
  updated_at: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile({
          ...data,
          answers_json:
            data.answers_json && data.answers_json !== "{}"
              ? JSON.stringify(JSON.parse(data.answers_json), null, 2)
              : empty.answers_json,
        });
      })
      .catch(() => setMessage("Could not load profile"));
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      JSON.parse(profile.answers_json || "{}");
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProfile({
        ...data,
        answers_json: JSON.stringify(JSON.parse(data.answers_json || "{}"), null, 2),
      });
      setMessage("Profile saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="display text-5xl">Your profile</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Saved once, reused on every application. Auto-submit stays off until you turn it on.
        </p>
      </div>

      <form onSubmit={onSave} className="panel rounded-[24px] p-6 md:p-8 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="field" value={profile.full_name} onChange={(e) => set("full_name", e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="field" type="email" value={profile.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="field" value={profile.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="field" value={profile.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <input className="field" value={profile.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
          </div>
          <div>
            <label className="label">Portfolio URL</label>
            <input className="field" value={profile.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Work authorization</label>
          <input
            className="field"
            placeholder="e.g. Eligible to work in the EU; needs visa sponsorship"
            value={profile.work_authorization}
            onChange={(e) => set("work_authorization", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Base resume (markdown or plain text)</label>
          <textarea
            className="field min-h-56"
            value={profile.resume_text}
            onChange={(e) => set("resume_text", e.target.value)}
            placeholder="Paste your full resume here"
          />
        </div>

        <div>
          <label className="label">Default cover letter tone / template</label>
          <textarea
            className="field min-h-32"
            value={profile.default_cover_letter}
            onChange={(e) => set("default_cover_letter", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Screening answers (JSON)</label>
          <textarea
            className="field min-h-40 font-mono text-sm"
            value={profile.answers_json}
            onChange={(e) => set("answers_json", e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="label">OpenAI model</label>
            <input
              className="field"
              value={profile.openai_model}
              onChange={(e) => set("openai_model", e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={Boolean(profile.auto_submit)}
              onChange={(e) => set("auto_submit", e.target.checked ? 1 : 0)}
            />
            Auto-submit filled forms (off = dry-run fill only)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          {message ? <span className="text-sm font-medium">{message}</span> : null}
        </div>
      </form>
    </div>
  );
}
