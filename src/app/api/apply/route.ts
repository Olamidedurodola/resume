import { NextResponse } from "next/server";
import { applyToJob } from "@/lib/apply/engines";
import type { Application, Profile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function canRunBrowserAutomation() {
  // Chromium + Playwright is unreliable on Vercel serverless.
  // Enable explicitly with APPLY_BROWSER=1 on a long-running host.
  if (process.env.APPLY_BROWSER === "1") return true;
  if (process.env.VERCEL) return false;
  return true;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profile?: Profile;
      application?: Application;
    };
    if (!body.profile || !body.application) {
      return NextResponse.json(
        { error: "profile and application are required" },
        { status: 400 },
      );
    }

    if (!canRunBrowserAutomation()) {
      return NextResponse.json({
        ok: false,
        status: "needs_manual",
        notes:
          "Browser auto-apply is disabled on this host (Vercel). Materials are ready — open the posting on your phone and paste from LinkApply, or run APPLY_BROWSER=1 on a desktop/worker.",
        screenshot_path: "",
        mobile_hint: true,
      });
    }

    const result = await applyToJob(body.application, body.profile);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
