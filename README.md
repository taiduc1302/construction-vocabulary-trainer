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
- **Typed active recall** without answer choices; punctuation, hyphens and spacing variants are normalized.
- Definition, scenario, diagram, and fill-in-the-blank questions.
- **Validated fill prompts**: natural examples may use an inflected form (`conduits`, `compact`, `mill`, etc.), while `data/fill-examples.json` provides a canonical-term exercise sentence only where needed.
- **Similar terms** practice for confusing pairs such as `RFI / RFQ`, `cut / fill`, `subgrade / subbase`, `trench box / shoring`, `unit price / lump sum`, and `allowance / contingency`.
- **My focus list** for words explicitly added from chat because the owner encountered or wants to learn them now.
- **Strict practice scopes**: Focus, Due, Weak, and New never silently substitute unrelated words when a filtered pool is empty.
- **Category focus** for Drainage, Earthworks, Utilities, Roadworks, Estimating, Tendering, etc.
- **Adaptive Smart Review** that weights overdue words, error rate, recent mistakes, and mastery level instead of using a fixed priority list.
- **Quick 10** sessions with a frozen starting pool, no target repeats until that pool is exhausted, locked session filters, clear next-question controls, and saved session history.
- Browser speech pronunciation without revealing hidden answers before recall questions.
- Spaced repetition using `new -> learning -> review -> mastered`.
- Adaptive weak-word ranking.
- Due-review queue.
- **Daily goal** with configurable reviews/day.
- **Learning streak** based on each day's historical goal rather than today's goal being applied retroactively.
- **7-day activity chart**, total review count, recent session history, hardest-word list, and focus-word count.
- **Drawing Challenge** using generic civil plan/section scenes. Answers also update the spaced-repetition record for the vocabulary term being tested.
- Export/import of the complete browser learning state as JSON.
- Installable PWA shell with fresh online updates and offline fallback.

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
3. Underground utility section — backfill, bedding, duct bank, shoring, trench.

Each feature is identified by a neutral callout letter. The learner is asked which callout corresponds to a vocabulary term. CI verifies target IDs, unique labels, CSS coverage, behavioural target selection, and that title/caption/SVG/accessibility text does not reveal the answer.

## Adaptive learning state

Learning data is stored locally in the browser in a versioned state managed by `src/learning-state.js`.

The current **v3** state contains:

- per-term spaced-repetition progress;
- recent correct/incorrect results for adaptive weighting;
- sanitized counters and timestamps;
- daily attempts and correct answers;
- the historical goal stored with each active day so later goal changes do not rewrite old streaks;
- configurable current daily goal;
- completed Quick-session history, capped to a safe size.

The app automatically migrates both the previous `construction-vocab-state-v2` state and the older `construction-vocab-progress-v1` format into v3. Malformed or partial stored/imported data is normalized instead of being allowed to produce broken counters or `NaN` values. Storage access failures also fail safely rather than crashing the trainer.

Learning state is intentionally **not committed to GitHub**. Use **Export progress** before clearing browser data or moving devices, then **Import progress** on the new device.

The repository focus list is different: it intentionally is committed so a chat request can change what the owner wants to study without needing access to the browser's localStorage.

## Vocabulary files

Vocabulary is modular so it can grow without turning one JSON file into a maintenance problem:

- `data/terms.json` - original 31-term core set.
- `data/terms-expansion.json` - 29-term expansion set and default home for future additions.
- `data/fill-examples.json` - exercise-only canonical-term sentences for entries whose natural example intentionally uses another grammatical form.
- `data/focus-terms.json` - current personal learning-focus IDs requested through chat.
- `data/vocabulary-backlog.json` - acknowledged related concepts worth adding later, with priority and reason.
- `data/categories.json` - controlled category list.
- `data/term.schema.json` - vocabulary schema.

The app loads the vocabulary modules and treats them as one 60-term dictionary. Validation checks duplicate IDs, focus references, fill sources, and whether related concepts resolve to a current term/category or the explicit backlog.

## Main modules

- `src/visuals.js` - diagrams for the core vocabulary.
- `src/visuals-extra.js` - diagrams for the expansion vocabulary.
- `src/visuals-all.js` - combined renderer and quiz-safe label stripping.
- `src/drawing-challenges.js` - generic multi-feature civil drawing exercises.
- `src/learning-state.js` - state migration, sanitization, adaptive weighting, daily goals, streaks, and session history.
- `src/practice-engine.js` - recall normalization, strict scope/category selection, no-repeat pool helpers, and option deduplication.
- `src/app.js` - application orchestration, focus/fill data loading, practice UI, Quick 10, and drawing challenge wiring.
- `src/styles.css`, `src/quiz.css`, `src/progress.css` - interface styling.
- `AI_INSTRUCTIONS.md` - mandatory maintenance rules for ChatGPT / Claude.
- `manifest.webmanifest` / `sw.js` - installable/offline app support.

## Audit and tests

Run the complete repository gate with:

```bash
npm run validate
```

Run behavioral tests only with:

```bash
npm test
```

The validation gate currently covers:

- vocabulary structure, duplicate IDs, translations, category references, focus-list integrity, fill prompts, and acknowledged related-concept backlog;
- content quality checks including normalized duplicate names, answer leakage in scenarios, date validity, and malformed arrays;
- dedicated visual coverage for every term and matching `tv-*` CSS classes;
- Drawing Challenge IDs, callouts, target-selection behavior, user-visible/accessibility answer leakage, and `dc-*` CSS classes;
- PWA dependency coverage so runtime modules/data cannot be omitted from offline precache;
- network-first refresh policy for mutable HTML/JS/CSS/JSON while retaining offline fallback;
- learning-state migration, sanitization, scheduling, weakness/adaptive weighting, daily goals, streaks, and session history;
- practice-engine recall normalization, strict scope filtering, no-repeat preference, aliases, and unique options;
- JavaScript syntax and manifest JSON validity.

GitHub Actions runs these checks on pull requests and pushes to `main`. Independent checks use `pipefail`, continue long enough to collect every diagnostic result, upload audit logs as an artifact, and then fail the workflow if any gate failed.

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

The service worker precaches the trainer for offline use. Mutable app resources — HTML, JavaScript, CSS, JSON and the web manifest — use **network-first** loading when online, with cached copies used as fallback offline. This prevents chat-driven vocabulary or code updates from being hidden behind a stale cache-first app shell.

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

The repository contains generic vocabulary data, exercise metadata, an explicit vocabulary backlog, and a non-confidential list of vocabulary IDs the owner wants to study. Do not commit company-confidential drawings, tender documents, prices, customer information, credentials, private project data, or exported personal browser learning-state files.
