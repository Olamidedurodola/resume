import { NextResponse } from "next/server";
import { prepareMaterials } from "@/lib/ai";
import { canAutoApply } from "@/lib/ats";
import { getApplication, getProfile, updateApplication } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const app = getApplication(id);
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = getProfile();
    const materials = await prepareMaterials({
      profile,
      title: app.title,
      company: app.company,
      description: app.description,
    });
    const updated = updateApplication(id, {
      tailored_resume: materials.tailored_resume,
      cover_letter: materials.cover_letter,
      screening_answers: JSON.stringify(materials.screening_answers),
      apply_notes: materials.match_notes,
      status: canAutoApply(app.ats) ? "ready" : "prepared",
      error: "",
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
