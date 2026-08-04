# Move LinkApply to a new private GitHub repo

This cloud agent **cannot create** private repositories (GitHub token lacks `createRepository`). Do this once in the GitHub UI, then push.

## Target repo

Private repo: https://github.com/Olamidedurodola/linkapply

The cloud agent token is scoped to `resume` only, so it cannot push to `linkapply` until that repo is granted to the Cursor GitHub App (or you push from your machine).

## Push from your machine (fastest)

From the resume checkout / PR branch:

```bash
cd personal-apply
./scripts/push-new-repo.sh https://github.com/Olamidedurodola/linkapply.git
```

Or manually:

```bash
cd personal-apply
git init
git add .
git commit -m "Initial LinkApply PWA"
git branch -M main
git remote add origin https://github.com/Olamidedurodola/linkapply.git
git push -u origin main
```

## 3. Connect Vercel

1. [vercel.com/new](https://vercel.com/new) → import `linkapply`
2. Root directory: `.` (repo root)
3. Environment variables:
   - `OPENAI_API_KEY`
4. Deploy

## 4. Install on your phone

- **Android Chrome:** menu → Install app / Add to Home screen  
- **iPhone Safari:** Share → Add to Home Screen  

Your profile and queue stay on that phone’s browser storage.

## Optional: tell the agent the new repo URL

Once the empty private repo exists, paste the URL (e.g. `https://github.com/YOU/linkapply`) and ask the agent to push — if the token can write to that repo, it can complete the move.
