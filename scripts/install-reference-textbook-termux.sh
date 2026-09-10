#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

EXPECTED_SHA="c6c0ca958ff846861abd8b64fb8b22d9fa732c302995deb11bb133fad47ddcf9"
TARGET="public/textbook/Power-Engineering-Fourth-Class-Part-A-Edition-3.5.pdf"

cd "$(git rev-parse --show-toplevel)"

echo "Updating the study app first..."
git pull --rebase

SOURCE=""
for candidate in \
  "$HOME/storage/downloads/under 100MB.pdf" \
  "/sdcard/Download/under 100MB.pdf" \
  "$HOME/storage/downloads/Power Engineering Fourth Class - A.pdf" \
  "/sdcard/Download/Power Engineering Fourth Class - A.pdf"
do
  if [ -f "$candidate" ]; then
    SOURCE="$candidate"
    break
  fi
done

if [ -z "$SOURCE" ]; then
  SOURCE="$(find "$HOME/storage/downloads" /sdcard/Download -maxdepth 1 -type f -iname '*.pdf' 2>/dev/null | while read -r file; do
    hash="$(sha256sum "$file" | awk '{print $1}')"
    if [ "$hash" = "$EXPECTED_SHA" ]; then
      printf '%s\n' "$file"
      break
    fi
  done)"
fi

if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
  echo "I could not find the exact textbook PDF in your Downloads folder."
  echo "Make sure the file you attached in ChatGPT is also saved in your phone Downloads folder, then run this script again."
  exit 1
fi

ACTUAL_SHA="$(sha256sum "$SOURCE" | awk '{print $1}')"
if [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
  echo "The PDF found is not the exact textbook file you attached. Nothing was changed."
  exit 1
fi

mkdir -p "$(dirname "$TARGET")"
cp -f "$SOURCE" "$TARGET"

echo "Verified the correct 1,858 page reference textbook."
echo "Adding it to GitHub..."

git add "$TARGET"
if git diff --cached --quiet; then
  echo "The correct reference textbook is already committed."
else
  git commit -m "Add permanent reference textbook"
  git push origin main
fi

echo "Waiting for GitHub Pages deployment..."
RUN_ID="$(gh run list --workflow deploy-pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
if [ -n "$RUN_ID" ] && [ "$RUN_ID" != "null" ]; then
  gh run watch "$RUN_ID" --exit-status
fi

echo "Done. The app now uses the built-in textbook and users do not upload their own copy."
