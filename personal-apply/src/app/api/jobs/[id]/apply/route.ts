import { NextResponse } from "next/server";
import { applyToJob } from "@/lib/apply/engines";
import { getApplication, getProfile, updateApplication } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    let app = getApplication(id);
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = getProfile();
    if (!profile.full_name || !profile.email) {
      return NextResponse.json(
        { error: "Complete your profile before applying." },
        { status: 400 },
      );
    }
    if (!app.tailored_resume && !profile.resume_text) {
      return NextResponse.json(
        { error: "Prepare materials first (or add a resume on Profile)." },
        { status: 400 },
      );
    }

    app = updateApplication(id, { status: "applying", error: "" });
    const result = await applyToJob(app, profile);
    const updated = updateApplication(id, {
      status: result.status,
      apply_notes: [app.apply_notes, result.notes].filter(Boolean).join("\n\n"),
      screenshot_path: result.screenshot_path || app.screenshot_path,
      error: result.error || "",
      submitted_at:
        result.status === "submitted" ? new Date().toISOString() : app.submitted_at,
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
