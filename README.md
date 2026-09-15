# Construction Vocabulary Trainer

Personal multilingual construction vocabulary trainer for civil estimating and site work.

The project is designed to be maintained by **ChatGPT, Claude, or a human** without a database or backend.

## What it does

- English construction terms with plain-English definitions.
- Russian explanation and translation.
- Vietnamese translation.
- Real civil-construction example sentences.
- Visual schematic for each term.
- Search and category filters.
- Practice modes: multiple choice, EN -> RU, RU -> EN, fill-in-the-blank, visual recognition and scenario questions.
- Spaced-review state stored locally in the browser.
- Weak-word review based on mistakes.
- Export/import learning progress as JSON.

## Main files

- `data/terms.json` - source of truth for vocabulary.
- `data/categories.json` - controlled category list.
- `data/term.schema.json` - schema and field documentation.
- `AI_INSTRUCTIONS.md` - rules for ChatGPT / Claude when adding or editing terms.
- `index.html` - app shell.
- `src/app.js` - dictionary, quiz and review logic.
- `src/styles.css` - interface styles.
- `scripts/validate-terms.mjs` - data quality checks.

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

## Add words through ChatGPT or Claude

A typical request can be as short as:

> Add `headwall`, `daylighting`, and `shoring` to my construction vocabulary trainer. Use realistic civil examples and create visual cues.

The AI should read `AI_INSTRUCTIONS.md`, update `data/terms.json`, validate the data, and preserve the existing schema.

## Learning model

Each browser keeps personal progress separately. A word moves through:

`new -> learning -> review -> mastered`

Correct answers increase the review interval. Wrong answers shorten it and increase the word's weak-word score.

Progress is intentionally **not committed to GitHub**. Use Export/Import in the app if you want to move progress between devices.

## Initial focus

The first vocabulary set is aimed at civil estimating and heavy civil work: earthworks, drainage, utilities, roadworks, concrete, duct banks, drawings, estimating and tendering.

## Privacy

The repository contains vocabulary data only. Do not commit company-confidential drawings, tender documents, prices, customer information, credentials, or private project data.
