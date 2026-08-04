import fs from "fs";
import path from "path";
import { chromium, type Page } from "playwright";
import { artifactsDir } from "../db";
import type { Application, Profile } from "../types";

export interface ApplyResult {
  ok: boolean;
  status: "submitted" | "needs_manual" | "failed";
  notes: string;
  screenshot_path: string;
  error?: string;
}

async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

async function fillByLabels(
  page: Page,
  map: Record<string, string>,
  opts?: { exact?: boolean },
) {
  for (const [label, value] of Object.entries(map)) {
    if (!value) continue;
    const pattern = opts?.exact
      ? new RegExp(`^${label}$`, "i")
      : new RegExp(label, "i");
    const field = page
      .getByLabel(pattern)
      .or(page.getByPlaceholder(pattern))
      .first();
    if (await field.count()) {
      try {
        await field.fill(value, { timeout: 2500 });
      } catch {
        /* field may be non-text */
      }
    }
  }
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

async function tryUploadResume(page: Page, resumePath: string) {
  const inputs = page.locator('input[type="file"]');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    try {
      await input.setInputFiles(resumePath);
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

function writeTempResume(app: Application, profile: Profile): string {
  const dir = artifactsDir();
  const file = path.join(dir, `${app.id}-resume.txt`);
  const body =
    app.tailored_resume ||
    profile.resume_text ||
    `${profile.full_name}\n${profile.email}\n${profile.phone}`;
  fs.writeFileSync(file, body, "utf8");
  return file;
}

async function screenshot(page: Page, id: string): Promise<string> {
  const file = path.join(artifactsDir(), `${id}-apply.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

export async function applyGreenhouse(
  app: Application,
  profile: Profile,
  autoSubmit: boolean,
): Promise<ApplyResult> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const resumePath = writeTempResume(app, profile);
  try {
    await page.goto(app.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);

    // Many Greenhouse boards use an Apply button that expands the form.
    const applyBtn = page.getByRole("button", { name: /apply/i }).first();
    if (await applyBtn.count()) {
      await applyBtn.click({ timeout: 5000 }).catch(() => undefined);
      await page.waitForTimeout(800);
    }

    const { first, last } = splitName(profile.full_name);
    // Exact labels first so a generic "name" match cannot overwrite First Name.
    await fillByLabels(
      page,
      {
        "first name": first,
        "last name": last,
        email: profile.email,
        phone: profile.phone,
        "linkedin profile": profile.linkedin_url,
        website: profile.portfolio_url || profile.linkedin_url,
      },
      { exact: false },
    );

    const fullNameField = page.getByLabel(/^name$/i).first();
    if (await fullNameField.count()) {
      await fullNameField.fill(profile.full_name).catch(() => undefined);
    }

    const cover = page
      .getByLabel(/cover letter|additional information/i)
      .or(page.locator('textarea[name*="cover" i]'))
      .first();
    if ((await cover.count()) && app.cover_letter) {
      await cover.fill(app.cover_letter).catch(() => undefined);
    }

    await tryUploadResume(page, resumePath);

    const shot = await screenshot(page, app.id);

    if (!autoSubmit) {
      await browser.close();
      return {
        ok: true,
        status: "needs_manual",
        notes:
          "Form filled in dry-run mode (auto_submit=false). Review screenshot, then enable auto-submit or finish manually.",
        screenshot_path: shot,
      };
    }

    const submit = page
      .getByRole("button", { name: /submit application|submit|apply/i })
      .last();
    if (!(await submit.count())) {
      await browser.close();
      return {
        ok: false,
        status: "needs_manual",
        notes: "Could not find a submit button after filling the form.",
        screenshot_path: shot,
      };
    }

    await submit.click({ timeout: 8000 });
    await page.waitForTimeout(2500);
    const finalShot = await screenshot(page, `${app.id}-submitted`);
    await browser.close();
    return {
      ok: true,
      status: "submitted",
      notes: "Submitted via Greenhouse automation.",
      screenshot_path: finalShot,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    let shot = "";
    try {
      shot = await screenshot(page, `${app.id}-error`);
    } catch {
      /* ignore */
    }
    await browser.close().catch(() => undefined);
    return {
      ok: false,
      status: "failed",
      notes: "Greenhouse apply failed.",
      screenshot_path: shot,
      error: message,
    };
  }
}

export async function applyLever(
  app: Application,
  profile: Profile,
  autoSubmit: boolean,
): Promise<ApplyResult> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const resumePath = writeTempResume(app, profile);
  try {
    const applyUrl = app.url.includes("/apply")
      ? app.url
      : app.url.replace(/\/?$/, "/apply");
    await page.goto(applyUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);

    await fillByLabels(page, {
      name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      "current location": profile.location,
      location: profile.location,
      linkedin: profile.linkedin_url,
      "linkedin url": profile.linkedin_url,
      website: profile.portfolio_url,
      "portfolio url": profile.portfolio_url,
    });

    const cover = page.locator('textarea[name*="additional" i], textarea').first();
    if ((await cover.count()) && app.cover_letter) {
      await cover.fill(app.cover_letter).catch(() => undefined);
    }

    await tryUploadResume(page, resumePath);
    const shot = await screenshot(page, app.id);

    if (!autoSubmit) {
      await browser.close();
      return {
        ok: true,
        status: "needs_manual",
        notes:
          "Lever form filled in dry-run mode. Enable auto-submit on your profile to submit automatically.",
        screenshot_path: shot,
      };
    }

    const submit = page.getByRole("button", { name: /submit application|submit/i }).first();
    if (!(await submit.count())) {
      await browser.close();
      return {
        ok: false,
        status: "needs_manual",
        notes: "Lever submit control not found.",
        screenshot_path: shot,
      };
    }
    await submit.click({ timeout: 8000 });
    await page.waitForTimeout(2500);
    const finalShot = await screenshot(page, `${app.id}-submitted`);
    await browser.close();
    return {
      ok: true,
      status: "submitted",
      notes: "Submitted via Lever automation.",
      screenshot_path: finalShot,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    let shot = "";
    try {
      shot = await screenshot(page, `${app.id}-error`);
    } catch {
      /* ignore */
    }
    await browser.close().catch(() => undefined);
    return {
      ok: false,
      status: "failed",
      notes: "Lever apply failed.",
      screenshot_path: shot,
      error: message,
    };
  }
}

export async function applyAshby(
  app: Application,
  profile: Profile,
  autoSubmit: boolean,
): Promise<ApplyResult> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const resumePath = writeTempResume(app, profile);
  try {
    await page.goto(app.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);

    const applyBtn = page.getByRole("button", { name: /apply/i }).first();
    if (await applyBtn.count()) {
      await applyBtn.click({ timeout: 5000 }).catch(() => undefined);
      await page.waitForTimeout(1000);
    }

    await fillByLabels(page, {
      "full name": profile.full_name,
      name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      linkedin: profile.linkedin_url,
      website: profile.portfolio_url,
      location: profile.location,
    });

    const cover = page.getByLabel(/cover letter|additional/i).first();
    if ((await cover.count()) && app.cover_letter) {
      await cover.fill(app.cover_letter).catch(() => undefined);
    }

    await tryUploadResume(page, resumePath);
    const shot = await screenshot(page, app.id);

    if (!autoSubmit) {
      await browser.close();
      return {
        ok: true,
        status: "needs_manual",
        notes:
          "Ashby form filled in dry-run mode. Review screenshot before enabling auto-submit.",
        screenshot_path: shot,
      };
    }

    const submit = page.getByRole("button", { name: /submit|apply/i }).last();
    if (!(await submit.count())) {
      await browser.close();
      return {
        ok: false,
        status: "needs_manual",
        notes: "Ashby submit control not found.",
        screenshot_path: shot,
      };
    }
    await submit.click({ timeout: 8000 });
    await page.waitForTimeout(2500);
    const finalShot = await screenshot(page, `${app.id}-submitted`);
    await browser.close();
    return {
      ok: true,
      status: "submitted",
      notes: "Submitted via Ashby automation.",
      screenshot_path: finalShot,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    let shot = "";
    try {
      shot = await screenshot(page, `${app.id}-error`);
    } catch {
      /* ignore */
    }
    await browser.close().catch(() => undefined);
    return {
      ok: false,
      status: "failed",
      notes: "Ashby apply failed.",
      screenshot_path: shot,
      error: message,
    };
  }
}

export async function applyToJob(
  app: Application,
  profile: Profile,
): Promise<ApplyResult> {
  const autoSubmit = Boolean(profile.auto_submit);
  if (app.ats === "greenhouse") return applyGreenhouse(app, profile, autoSubmit);
  if (app.ats === "lever") return applyLever(app, profile, autoSubmit);
  if (app.ats === "ashby") return applyAshby(app, profile, autoSubmit);

  return {
    ok: false,
    status: "needs_manual",
    notes: `Auto-apply is not implemented for ${app.ats}. Materials were prepared — open the link and submit manually.`,
    screenshot_path: "",
  };
}
