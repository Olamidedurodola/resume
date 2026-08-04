import { NextResponse } from "next/server";
import { normalizeJobUrl } from "@/lib/ats";
import { scrapeJob } from "@/lib/scrape";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    if (!body.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    const url = normalizeJobUrl(body.url);
    const scraped = await scrapeJob(url);
    return NextResponse.json(scraped);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
