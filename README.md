# Power Engineering Study

A mobile-first, offline-first Fourth Class Power Engineering study platform generated from the supplied Part A textbook.

## Current release

Version 0.1.0 implements the architecture and the first full content-review pass. The complete PDF has been structurally ingested into 12 units, 56 chapters, and objective-based lesson sections. Unit A-1 includes a curated verified formula set, and Unit A-1 Chapter 2 is the representative fully enhanced lesson.

The project intentionally does not pretend that automatically extracted equations are verified. Raw equation candidates remain visibly labelled until a human review pass confirms them.

## Included features

- Mobile-first React and TypeScript application shell
- Bottom navigation, Android safe-area spacing, light, dark, and system themes
- 12 units and 56 detected chapters
- Objective-based lesson sections with PDF page references
- Local search across textbook text, chapters, formulas, and self tests
- Formula Center with KaTeX rendering
- 31 verified Unit A-1 formulas plus 877 raw equation candidates
- Calculation Lab with explicit calculation functions and answer tolerances
- Textbook Self-Test center with textbook answers stored separately
- Reusable quiz engine built from the extracted self-test pool
- Mistake Book
- Flashcards with SM-2 style scheduling fields
- Bookmarks and chapter-linked notes
- Progress and attempt tracking
- Ask the Textbook retrieval interface
- Original PDF import and page viewer using PDF.js
- IndexedDB through Dexie with schema versions
- PWA service worker and offline precaching through Vite PWA
- JSON backup of personal study data
- Source-validation and ingestion scripts

## Install and run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Textbook import

The structured study database is already included under `public/data`.

The original PDF itself is not duplicated inside the project. In the app, open **Original textbook** and import your local PDF once. It is stored in IndexedDB on that device so source pages can be opened offline.

## Re-run ingestion

```bash
python scripts/textbook-processing/extract_pdf.py "/path/to/textbook.pdf" public/data
python scripts/textbook-processing/validate_data.py public/data
```

No OCR is used when a selectable text layer is available.

## Project structure

```text
src/
  app/
  components/
  pages/
  db/
  services/
  store/
  types/
  styles/
public/
  data/
  icons/
scripts/
  textbook-processing/
tests/
```

## Content verification

`verified` means manually curated against source pages.

`processed` means the structural parser has organized the material.

`raw_extraction` means the item came from automatic extraction and should be checked against its source page before being treated as authoritative.

## Security

No API key is embedded in the frontend. The Ask the Textbook screen currently performs local retrieval only. A future AI explanation layer should call a secure backend or serverless endpoint using `VITE_ASK_TEXTBOOK_ENDPOINT` only as a public endpoint address, never as a secret.

## Next content pass

The architecture is ready for the remaining verification work: review formulas unit by unit, normalize self-test question types, expand flashcards from verified definitions, add verified worked examples, and add chapter-specific generated calculation templates only where the textbook supports them.


## GitHub Pages deployment

This project is configured for the repository path `/PowerEng-Study/` and includes a GitHub Actions Pages workflow at `.github/workflows/deploy-pages.yml`.

After pushing to `main`, open repository Settings, then Pages, and select GitHub Actions as the publishing source. The workflow builds the Vite app and deploys the `dist` directory.

The expected public project URL is `https://dothecoolwip1.github.io/PowerEng-Study/`.
