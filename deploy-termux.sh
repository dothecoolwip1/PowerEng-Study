#!/data/data/com.termux/files/usr/bin/bash
set -e
REPO="https://github.com/dothecoolwip1/PowerEng-Study.git"
REPO_API="repos/dothecoolwip1/PowerEng-Study/pages"

git init
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO"
git add .
git commit -m "Add Power Engineering Study app" || true
git push -u origin main

if gh api -X POST "$REPO_API" -f build_type=workflow >/dev/null 2>&1; then
  echo "GitHub Pages enabled with GitHub Actions."
else
  echo "Pages may already be enabled, or this GitHub plan may not allow Pages from a private repository."
fi

gh workflow run deploy-pages.yml || true

echo
echo "Repository upload finished."
echo "Expected site URL: https://dothecoolwip1.github.io/PowerEng-Study/"
echo "Use: gh run list"
