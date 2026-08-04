# Move LinkApply to a new private GitHub repo

This cloud agent **cannot create** private repositories (GitHub token lacks `createRepository`). Do this once in the GitHub UI, then push.

## 1. Create the private repo

On GitHub (logged in as you):

1. **New repository**
2. Name: `linkapply` (or any name)
3. Visibility: **Private**
4. Do **not** add a README / .gitignore / license (empty repo)
5. Create

## 2. Push this app as the repo root

From a machine with access to this project (or after cloning the resume PR branch):

```bash
# If you still have the resume monorepo:
cd personal-apply

git init
git add .
git commit -m "Initial LinkApply PWA"
git branch -M main
git remote add origin https://github.com/<YOUR_USER>/linkapply.git
git push -u origin main
```

Or with GitHub CLI:

```bash
cd personal-apply
gh repo create linkapply --private --source=. --remote=origin --push
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
