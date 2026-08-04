import { NextResponse } from "next/server";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const app = getApplication(id);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(app);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const app = getApplication(id);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json();
  const updated = updateApplication(id, {
    tailored_resume: body.tailored_resume ?? app.tailored_resume,
    cover_letter: body.cover_letter ?? app.cover_letter,
    screening_answers:
      typeof body.screening_answers === "string"
        ? body.screening_answers
        : body.screening_answers
          ? JSON.stringify(body.screening_answers)
          : app.screening_answers,
    status: body.status ?? app.status,
    apply_notes: body.apply_notes ?? app.apply_notes,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  deleteApplication(id);
  return NextResponse.json({ ok: true });
}
