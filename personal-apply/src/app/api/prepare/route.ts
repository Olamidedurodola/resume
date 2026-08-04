import { NextResponse } from "next/server";
import { prepareMaterials } from "@/lib/ai";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profile?: Profile;
      title?: string;
      company?: string;
      description?: string;
    };
    if (!body.profile || !body.title) {
      return NextResponse.json(
        { error: "profile and title are required" },
        { status: 400 },
      );
    }
    const materials = await prepareMaterials({
      profile: body.profile,
      title: body.title,
      company: body.company || "",
      description: body.description || "",
    });
    return NextResponse.json(materials);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
