import { NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/lib/db";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getProfile());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<Profile>;
  const updated = updateProfile({
    full_name: body.full_name ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    location: body.location ?? "",
    linkedin_url: body.linkedin_url ?? "",
    portfolio_url: body.portfolio_url ?? "",
    work_authorization: body.work_authorization ?? "",
    resume_text: body.resume_text ?? "",
    default_cover_letter: body.default_cover_letter ?? "",
    answers_json: body.answers_json ?? "{}",
    auto_submit: body.auto_submit ? 1 : 0,
    openai_model: body.openai_model || "gpt-4o-mini",
  });
  return NextResponse.json(updated);
}
