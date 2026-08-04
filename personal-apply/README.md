# LinkApply

Personal job-application PWA. Paste a job link on your phone, get tailored materials, track the queue, and finish applications from an installable home-screen app.

## Deploy on Vercel (private repo)

1. Create a **private** GitHub repo (e.g. `linkapply`) — this environment cannot create repos for you.
2. Push this app as the repo root (see [MOVE.md](./MOVE.md)).
3. In Vercel: **Add New Project** → import that private repo → Framework: Next.js.
4. Set env var:
   - `OPENAI_API_KEY` = your key (optional but recommended)
5. Deploy. Open the URL on your phone → **Add to Home Screen** / Install.

### Mobile PWA

- Installable (manifest + service worker)
- Profile & applications stored in **IndexedDB on the device** (private, offline-friendly)
- Scrape + AI prepare run on Vercel API routes
- Full Playwright auto-submit is **off on Vercel** by default (serverless cannot run Chromium reliably). On mobile, **Apply** opens the posting and you can **Copy** resume/cover letter into the form.

To run browser auto-apply on a machine with Chromium:

```bash
APPLY_BROWSER=1 npm run start
```

## Local development

```bash
npm install
npx playwright install chromium   # only if you want local browser apply
cp .env.example .env.local
npm run dev
```

## Stack

- Next.js App Router + PWA (`@ducanh2912/next-pwa`)
- Client store: IndexedDB (`idb`)
- ATS scrape: Greenhouse / Lever / Ashby / Workday detect
- AI prepare: OpenAI (heuristic fallback without a key)
