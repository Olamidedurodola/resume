import type { AtsProvider } from "./types";

export function detectAts(url: string): AtsProvider {
  const u = url.toLowerCase();
  if (
    u.includes("greenhouse.io") ||
    u.includes("boards.greenhouse") ||
    u.includes("job-boards.greenhouse")
  ) {
    return "greenhouse";
  }
  if (u.includes("lever.co") || u.includes("jobs.lever")) {
    return "lever";
  }
  if (u.includes("ashbyhq.com") || u.includes("jobs.ashby")) {
    return "ashby";
  }
  if (u.includes("myworkdayjobs.com") || u.includes("workday.com")) {
    return "workday";
  }
  return "unknown";
}

export function normalizeJobUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("URL is required");
  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("Invalid job URL");
  }
  url.hash = "";
  return url.toString();
}

export function atsLabel(ats: AtsProvider): string {
  switch (ats) {
    case "greenhouse":
      return "Greenhouse";
    case "lever":
      return "Lever";
    case "ashby":
      return "Ashby";
    case "workday":
      return "Workday";
    default:
      return "Unknown ATS";
  }
}

export function canAutoApply(ats: AtsProvider): boolean {
  return ats === "greenhouse" || ats === "lever" || ats === "ashby";
}
