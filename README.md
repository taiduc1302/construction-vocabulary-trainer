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
- English -> Russian, Russian -> English, and Vietnamese -> English practice.
- **Typed active recall** without answer choices.
- Definition, scenario, diagram, and fill-in-the-blank questions.
- **Similar terms** practice for confusing pairs such as `RFI / RFQ`, `cut / fill`, `subgrade / subbase`, `trench box / shoring`, `unit price / lump sum`, and `allowance / contingency`.
- **My focus list** for words explicitly added from chat because the owner encountered or wants to learn them now.
- **Category focus** for Drainage, Earthworks, Utilities, Roadworks, Estimating, Tendering, etc.
- **Adaptive Smart Review** that weights overdue words, error rate, recent mistakes, and mastery level instead of using a fixed priority list.
- **Quick 10** sessions with saved session history.
- Browser speech pronunciation without revealing hidden answers before recall questions.
- Spaced repetition using `new -> learning -> review -> mastered`.
- Adaptive weak-word ranking.
- Due-review queue.
- **Daily goal** with configurable reviews/day.
- **Learning streak** based on completed daily goals.
- **7-day activity chart**, total review count, recent session history, hardest-word list, and focus-word count.
- **Drawing Challenge** using generic civil plan/section scenes. Answers also update the spaced-repetition record for the vocabulary term being tested.
- Export/import of the complete browser learning state as JSON.
- Installable PWA shell with offline use after the first successful online load.

## My focus list

`data/focus-terms.json` is the bridge between chat and the learning app.

When the owner asks ChatGPT or Claude to **add a word to the dictionary**, that means the word should become a current learning target even if the vocabulary entry already exists.

Example:

> Add `duct bank` to my construction dictionary.

Expected behaviour:

1. Search for `duct bank` in the existing vocabulary.
2. If missing, create the full multilingual entry and diagram.
3. If it already exists, reuse the existing canonical entry rather than creating a duplicate.
4. In both cases, add/update its canonical ID in `data/focus-terms.json`.
5. The app will then show it as `focus` and it can be trained with **Practice -> My focus list**.

Repeated requests update `last_requested_at` and `request_count` instead of creating duplicates. Therefore a response that only says “this term already exists” is incomplete.

The initial focus-list entry is `duct-bank`, added after this behaviour was introduced.

## Drawing Challenge

`src/drawing-challenges.js` contains generic educational drawings, never project drawings. The initial scenes are:

1. Road drainage plan — catch basin, storm sewer, manhole, culvert, ditch.
2. Road structure section — overlay, base course, subbase, subgrade, curb and gutter.
3. Utility trench section — backfill, bedding, duct bank, shoring, trench.

Each feature is identified by a neutral callout letter. The learner is asked which callout corresponds to a vocabulary term.

## Adaptive learning state

Learning data is stored locally in the browser in a versioned state managed by `src/learning-state.js`.

The v2 state contains:

- per-term spaced-repetition progress;
- recent correct/incorrect results for adaptive weighting;
- daily attempts and correct answers;
- configurable daily goal;
- completed Quick-session history.

The app automatically migrates the previous `construction-vocab-progress-v1` localStorage format into the v2 state. Existing learned-word progress is therefore preserved when upgrading.

Learning state is intentionally **not committed to GitHub**. Use **Export progress** before clearing browser data or moving devices, then **Import progress** on the new device.

The repository focus list is different: it intentionally is committed so a chat request can change what the owner wants to study without needing access to the browser's localStorage.

## Vocabulary files

Vocabulary is modular so it can grow without turning one JSON file into a maintenance problem:

- `data/terms.json` - original 31-term core set.
- `data/terms-expansion.json` - 29-term expansion set and default home for future additions.
- `data/focus-terms.json` - current personal learning-focus IDs requested through chat.
- `data/categories.json` - controlled category list.
- `data/term.schema.json` - vocabulary schema.

The app loads all vocabulary modules and treats them as one 60-term dictionary. Validation checks duplicate IDs across files and verifies that every focus-list ID exists.

## Visual and learning modules

- `src/visuals.js` - diagrams for the core vocabulary.
- `src/visuals-extra.js` - diagrams for the expansion vocabulary.
- `src/visuals-all.js` - combined renderer and quiz-safe label stripping.
- `src/drawing-challenges.js` - generic multi-feature civil drawing exercises.
- `src/learning-state.js` - progress migration, adaptive weighting, daily goal, streaks, and session history.
- `src/app.js` - application orchestration, focus-list loading, and practice logic.
- `src/styles.css` - main interface styles.
- `src/quiz.css` - typed recall and quiz styling.
- `src/progress.css` - learning analytics and drawing challenge styling.
- `AI_INSTRUCTIONS.md` - mandatory maintenance rules for ChatGPT / Claude.
- `scripts/validate-terms.mjs` - multilingual vocabulary, duplicate, and focus-list checks.
- `scripts/validate-visuals.mjs` - diagram, drawing challenge, focus-list frontend, and other contract checks.
- `manifest.webmanifest` / `sw.js` - installable/offline app support.

Every term must have a dedicated diagram. CI fails if visual coverage is incomplete or if a Drawing Challenge/focus-list entry references a missing term.

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

The service worker caches the trainer for offline use. Vocabulary JSON and the focus list use **network-first** loading when online so chat-driven repository updates appear without manually changing the PWA cache version every time; cached copies are used when offline.

## Add words through ChatGPT or Claude

In a chat with GitHub connected, a request can be as short as:

> Add `hydrant` to my construction dictionary in `taiduc1302/construction-vocabulary-trainer`.

or:

> I saw `stub-out` today. Add it to my construction dictionary.

The AI must read `AI_INSTRUCTIONS.md`. If the word already exists, it must still update **My focus list** rather than stopping. If the word is new, it creates the full vocabulary content and then also adds it to the focus list.

You can also send a screenshot or a term encountered at work and say:

> I saw this on a drawing. Explain it and add it to my dictionary.

The AI should identify the concept but create a **generic educational schematic**, not commit confidential project drawings.

## Review intervals

Current spaced-review intervals are approximately:

`1 -> 3 -> 7 -> 14 -> 30 -> 60 days`

Wrong answers reduce the level immediately. Smart Review additionally considers recent mistakes and overdue time when selecting the next word.

## Privacy

The repository contains generic vocabulary data and a non-confidential list of vocabulary IDs the owner wants to study. Do not commit company-confidential drawings, tender documents, prices, customer information, credentials, private project data, or exported personal browser learning-state files.
