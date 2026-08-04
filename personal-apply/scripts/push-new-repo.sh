#!/usr/bin/env bash
# Push personal-apply/ to a new empty private GitHub repo as the root.
# Usage: ./scripts/push-new-repo.sh https://github.com/YOU/linkapply.git
set -euo pipefail
REMOTE="${1:-}"
if [[ -z "$REMOTE" ]]; then
  echo "Usage: $0 https://github.com/<user>/<private-repo>.git"
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
rsync -a --exclude node_modules --exclude .next --exclude data --exclude '.git' "$ROOT/" "$TMP/"
cd "$TMP"
git init
git add .
git -c user.email="linkapply@local" -c user.name="LinkApply" commit -m "Initial LinkApply PWA"
git branch -M main
git remote add origin "$REMOTE"
git push -u origin main
echo "Pushed to $REMOTE"
