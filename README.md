# Construction Vocabulary Trainer

Personal multilingual construction vocabulary trainer for civil estimating and site work.

The project is designed to be maintained by **ChatGPT, Claude, or a human** without a database or backend.

## Current version

The trainer currently includes **31 civil-construction terms**, each with:

- English term and pronunciation.
- Plain-English definition.
- Practical Russian explanation and translation.
- Vietnamese translation.
- Realistic construction example sentence.
- Scenario clue for recall practice.
- Related terminology and common-mistake notes.
- A dedicated educational SVG-style diagram.

## Learning features

- Search and category filters.
- English -> Russian practice.
- Russian -> English practice.
- Vietnamese -> English practice.
- Definition -> term questions.
- Scenario -> term questions.
- Diagram -> term questions.
- Fill-in-the-blank questions.
- Mixed practice mode.
- **Smart review** that prioritizes due words, then weak words, then new words.
- **Quick 10** sessions for short study breaks.
- Browser speech pronunciation for vocabulary cards.
- Spaced repetition using `new -> learning -> review -> mastered`.
- Weak-word ranking based on mistakes.
- Due-review queue.
- Accuracy and progress statistics.
- Export/import learning progress as JSON.
- Installable PWA shell with offline use after the first successful online load.

## Main files

- `data/terms.json` - source of truth for vocabulary.
- `data/categories.json` - controlled category list.
- `data/term.schema.json` - vocabulary schema.
- `src/visuals.js` - dedicated diagrams for vocabulary terms.
- `src/app.js` - dictionary, quiz, spaced review, speech and session logic.
- `src/styles.css` - main interface styles.
- `src/quiz.css` - quiz-specific rules that hide visual answer hints.
- `AI_INSTRUCTIONS.md` - mandatory maintenance rules for ChatGPT / Claude.
- `scripts/validate-terms.mjs` - vocabulary quality checks.
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

After GitHub publishes it, the expected address is:

`https://taiduc1302.github.io/construction-vocabulary-trainer/`

All application paths are relative, so the project works correctly from the repository sub-path.

## Install on a phone

After GitHub Pages is enabled and the site has been opened once online:

- **iPhone / iPad:** Safari -> Share -> Add to Home Screen.
- **Android / Chrome:** browser menu -> Install app / Add to Home screen.

The service worker caches the trainer, vocabulary data and diagrams for offline use.

Learning progress is stored in that browser/device. Use **Export progress** before clearing browser data or moving to another device, then use **Import progress** on the new device.

## Add words through ChatGPT or Claude

A typical request can be as short as:

> Add `headwall`, `daylighting`, and `shoring` to my construction vocabulary trainer.

The AI must read `AI_INSTRUCTIONS.md`, check for duplicates, update the multilingual entry, add a dedicated diagram, run validation, and preserve existing term IDs whenever possible.

You can also send a screenshot or a term encountered at work and say:

> I saw this on a drawing. Explain it and add it to my dictionary.

The AI should identify the concept but create a **generic educational schematic**, not commit confidential project drawings.

## Learning model

Each browser keeps personal progress separately. Correct answers increase the review interval; wrong answers shorten it and increase the weak-word score.

Current review intervals are approximately:

`1 -> 3 -> 7 -> 14 -> 30 -> 60 days`

Progress is intentionally **not committed to GitHub**.

## Initial focus

The vocabulary is aimed at civil estimating and heavy civil work, including earthworks, excavation, drainage, utilities, roadworks, concrete, duct banks, civil drawings, estimating and tendering.

## Privacy

The repository contains generic vocabulary data only. Do not commit company-confidential drawings, tender documents, prices, customer information, credentials, or private project data.
