import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canAutoApply, normalizeJobUrl } from "@/lib/ats";
import { prepareMaterials } from "@/lib/ai";
import {
  getApplicationByUrl,
  getProfile,
  insertApplication,
  listApplications,
  updateApplication,
} from "@/lib/db";
import { scrapeJob } from "@/lib/scrape";
import { applyToJob } from "@/lib/apply/engines";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  return NextResponse.json(listApplications());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      prepare?: boolean;
      apply?: boolean;
    };
    if (!body.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const url = normalizeJobUrl(body.url);
    const existing = getApplicationByUrl(url);
    if (existing) {
      return NextResponse.json(
        { error: "This job link is already tracked", application: existing },
        { status: 409 },
      );
    }

    const profile = getProfile();
    if (!profile.full_name || !profile.email) {
      return NextResponse.json(
        { error: "Fill in your name and email on the Profile page first." },
        { status: 400 },
      );
    }

    const scraped = await scrapeJob(url);
    let app = insertApplication({
      id: randomUUID(),
      url,
      ats: scraped.ats,
      company: scraped.company,
      title: scraped.title,
      location: scraped.location,
      description: scraped.description,
      status: "scraped",
      tailored_resume: "",
      cover_letter: "",
      screening_answers: "{}",
      apply_notes: "",
      error: "",
      screenshot_path: "",
      submitted_at: null,
    });

    const shouldPrepare = body.prepare !== false;
    if (shouldPrepare) {
      const materials = await prepareMaterials({
        profile,
        title: app.title,
        company: app.company,
        description: app.description,
      });
      app = updateApplication(app.id, {
        tailored_resume: materials.tailored_resume,
        cover_letter: materials.cover_letter,
        screening_answers: JSON.stringify(materials.screening_answers),
        apply_notes: materials.match_notes,
        status: canAutoApply(app.ats) ? "ready" : "prepared",
      });
    }

    if (body.apply) {
      app = updateApplication(app.id, { status: "applying", error: "" });
      const result = await applyToJob(app, profile);
      app = updateApplication(app.id, {
        status: result.status,
        apply_notes: [app.apply_notes, result.notes].filter(Boolean).join("\n\n"),
        screenshot_path: result.screenshot_path || app.screenshot_path,
        error: result.error || "",
        submitted_at: result.status === "submitted" ? new Date().toISOString() : null,
      });
    }

    return NextResponse.json(app, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
