# LinkApply

Personal job auto-apply assistant. Paste a job link; LinkApply scrapes the posting, tailors your resume and cover letter, tracks the application, and can fill (and optionally submit) forms on **Greenhouse**, **Lever**, and **Ashby**.

## Quick start

```bash
cd personal-apply
npm install
npx playwright install chromium
cp .env.example .env.local
# add OPENAI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Fill **Profile** (name, email, resume text at minimum).
2. Leave **Auto-submit** off until you trust dry-run fills.
3. On **Queue**, paste a job URL → **Add & prepare**.
4. Open the application, review materials, click **Apply**.

## What it does

| Step | Behavior |
|------|----------|
| Ingest | Detects ATS from the URL, scrapes title/company/description |
| Prepare | Uses OpenAI (or a local heuristic fallback) to tailor resume + cover letter |
| Apply | Playwright fills common fields and uploads a text resume artifact |
| Track | SQLite queue with statuses: scraped → ready → applying → submitted / needs_manual / failed |

## Safety defaults

- `auto_submit` is **off** by default → apply runs fill the form and screenshot, but do not click submit.
- Turn on auto-submit in Profile only when you are ready for real submissions.
- Workday and unknown boards get materials prepared; you submit manually.

## Environment

```env
OPENAI_API_KEY=sk-...
```

Without a key, prepare still works using your saved resume/template.

## Data

Local only, under `personal-apply/data/`:

- `linkapply.db` — profile + applications
- `artifacts/` — resume text uploads + screenshots

Do not commit this folder.

## Limits (honest MVP)

- Best on Greenhouse / Lever / Ashby public apply forms.
- Custom screening questions, CAPTCHAs, logins, and Workday flows often need manual finish.
- Resume upload is plain text (`.txt`) for reliability; PDF export can come later.
- Built for **your** use on a machine you control — not a multi-tenant SaaS.
