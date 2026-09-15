# Construction Vocabulary Trainer

Personal multilingual construction vocabulary trainer for civil estimating and site work.

The project is designed to be maintained by **ChatGPT, Claude, or a human** without a database or backend.

## Current version

The trainer currently includes **60 civil-construction terms**, each with:

- English term and pronunciation.
- Plain-English definition.
- Practical Russian explanation and translation.
- Vietnamese translation.
- Realistic construction example sentence.
- Scenario clue for recall practice.
- Related terminology and common-mistake notes.
- A dedicated educational SVG-style diagram.

The vocabulary covers drainage, underground utilities, pipe embedment, earthworks, pavement structure, concrete, duct banks, civil drawings/survey, estimating, and tender language.

## Learning features

- Search and category filters.
- English -> Russian practice.
- Russian -> English practice.
- Vietnamese -> English practice.
- **Typed active recall**: type the English term yourself without answer choices; capitalization and hyphens are normalized.
- Definition -> term questions.
- Scenario -> term questions.
- Diagram -> term questions with answer labels removed.
- Fill-in-the-blank questions.
- **Similar terms** practice for commonly confused concepts such as `RFI / RFQ`, `cut / fill`, `subgrade / subbase`, `trench box / shoring`, `unit price / lump sum`, and `allowance / contingency`.
- **Category focus** so a session can target only Drainage, Earthworks, Utilities, Roadworks, Estimating, etc.
- Mixed practice mode that includes typed recall and Similar terms questions.
- **Smart review** that prioritizes due words, then weak words, then new words.
- **Quick 10** sessions for short study breaks.
- Browser speech pronunciation without revealing hidden answers before recall questions.
- Spaced repetition using `new -> learning -> review -> mastered`.
- Weak-word ranking based on mistakes.
- Due-review queue.
- Accuracy and progress statistics.
- Export/import learning progress as JSON.
- Installable PWA shell with offline use after the first successful online load.

## Vocabulary files

Vocabulary is modular so it can grow without turning one JSON file into a maintenance problem:

- `data/terms.json` - original 31-term core set.
- `data/terms-expansion.json` - 29-term expansion set and default home for future additions.
- `data/categories.json` - controlled category list.
- `data/term.schema.json` - vocabulary schema.

The app loads all vocabulary modules and treats them as one 60-term dictionary. Validation checks duplicate IDs across files.

## Visual files

- `src/visuals.js` - diagrams for the core vocabulary.
- `src/visuals-extra.js` - diagrams for the expansion vocabulary.
- `src/visuals-all.js` - combined renderer and quiz-safe label stripping.
- `src/quiz.css` - quiz-specific styling including typed recall.

Every term must have a dedicated diagram. CI fails if visual coverage is incomplete.

## Other main files

- `src/app.js` - dictionary, typed recall, Similar terms, category focus, spaced review, speech and session logic.
- `src/styles.css` - main interface styles.
- `AI_INSTRUCTIONS.md` - mandatory maintenance rules for ChatGPT / Claude.
- `scripts/validate-terms.mjs` - multilingual vocabulary quality and duplicate checks.
- `scripts/validate-visuals.mjs` - diagram coverage and frontend contract checks.
- `manifest.webmanifest` / `sw.js` - installable/offline app support.

## Run locally

The app uses `fetch()` to load JSON, so open it through a small local web server rather than double-clicking `index.html`.

With Python:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

With Node:

```bash
npx serve .
```

Validate the repository with:

```bash
npm run validate
```

GitHub Actions runs the same validation automatically on pushes and pull requests.

## Put it online with GitHub Pages

This is a fully static app and can be served directly from this repository.

One-time setup on GitHub:

1. Open the repository.
2. Go to **Settings -> Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select branch **main**.
5. Select folder **/(root)**.
6. Click **Save**.

Expected address after publication:

`https://taiduc1302.github.io/construction-vocabulary-trainer/`

All application paths are relative, so the project works from the repository sub-path.

## Install on a phone

After GitHub Pages is enabled and the site has been opened once online:

- **iPhone / iPad:** Safari -> Share -> Add to Home Screen.
- **Android / Chrome:** browser menu -> Install app / Add to Home screen.

The service worker caches the trainer, both vocabulary modules, and all diagram modules for offline use.

Learning progress is stored in that browser/device. Use **Export progress** before clearing browser data or moving to another device, then use **Import progress** on the new device.

## Add words through ChatGPT or Claude

A typical request can be as short as:

> Add `hydrant`, `transformer pad`, and `traffic control` to my construction vocabulary trainer.

The AI must read `AI_INSTRUCTIONS.md`, check all vocabulary files for duplicates, add the multilingual entry, add a dedicated diagram, add a Similar terms pairing when useful, run validation, and preserve existing term IDs whenever possible.

You can also send a screenshot or a term encountered at work and say:

> I saw this on a drawing. Explain it and add it to my dictionary.

The AI should identify the concept but create a **generic educational schematic**, not commit confidential project drawings.

## Learning model

Each browser keeps personal progress separately. Correct answers increase the review interval; wrong answers shorten it and increase the weak-word score.

Current review intervals are approximately:

`1 -> 3 -> 7 -> 14 -> 30 -> 60 days`

Progress is intentionally **not committed to GitHub**.

## Privacy

The repository contains generic vocabulary data only. Do not commit company-confidential drawings, tender documents, prices, customer information, credentials, or private project data.
