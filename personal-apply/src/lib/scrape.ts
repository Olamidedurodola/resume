import * as cheerio from "cheerio";
import { detectAts } from "./ats";
import type { AtsProvider } from "./types";

export interface ScrapedJob {
  url: string;
  ats: AtsProvider;
  company: string;
  title: string;
  location: string;
  description: string;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractMeta($: cheerio.CheerioAPI, ...keys: string[]): string {
  for (const key of keys) {
    const content =
      $(`meta[property="${key}"]`).attr("content") ||
      $(`meta[name="${key}"]`).attr("content");
    if (content) return cleanText(content);
  }
  return "";
}

function guessCompanyFromUrl(url: string, ats: AtsProvider): string {
  try {
    const u = new URL(url);
    if (ats === "greenhouse") {
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[0] ? parts[0].replace(/-/g, " ") : u.hostname;
    }
    if (ats === "lever") {
      const host = u.hostname.replace("jobs.", "");
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[0] || host.split(".")[0] || "Company";
    }
    if (ats === "ashby") {
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[0] || "Company";
    }
    return u.hostname.replace("www.", "").split(".")[0] || "Company";
  } catch {
    return "Company";
  }
}

export async function scrapeJob(url: string): Promise<ScrapedJob> {
  const ats = detectAts(url);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; LinkApply/1.0; personal job assistant)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch job page (${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, nav, footer, header").remove();

  const title =
    cleanText($("h1").first().text()) ||
    extractMeta($, "og:title", "twitter:title") ||
    cleanText($("title").text()).split("|")[0]?.trim() ||
    "Untitled role";

  const location =
    cleanText(
      $('[class*="location"], [data-qa="location"], .location, #location')
        .first()
        .text(),
    ) ||
    extractMeta($, "job:location") ||
    "";

  let description = "";
  const candidates = [
    "#content",
    ".content",
    ".job-post",
    ".job__description",
    "[data-qa='job-description']",
    ".posting-page",
    ".ashby-job-posting-brief-description",
    "article",
    "main",
  ];

  for (const sel of candidates) {
    const text = cleanText($(sel).first().text());
    if (text.length > 200) {
      description = text.slice(0, 20000);
      break;
    }
  }

  if (!description) {
    description = cleanText($("body").text()).slice(0, 20000);
  }

  // Greenhouse (and similar) pages often include the apply form after the JD.
  for (const marker of [
    "Apply for this job",
    "Submit application",
    "* indicates a required field",
  ]) {
    const idx = description.indexOf(marker);
    if (idx > 400) {
      description = description.slice(0, idx).trim();
      break;
    }
  }

  description = description.replace(/^Back to jobs/i, "").trim();

  const companyMeta =
    extractMeta($, "og:site_name") ||
    cleanText($('[class*="company"], .company-name').first().text()) ||
    guessCompanyFromUrl(url, ats);

  return {
    url,
    ats,
    company: companyMeta,
    title,
    location,
    description,
  };
}
