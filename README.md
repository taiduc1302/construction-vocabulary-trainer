# Construction Vocabulary Trainer

Personal multilingual construction-vocabulary trainer for civil estimating and site work. It is designed to be maintained directly by **ChatGPT, Claude, or a human** without a database or backend.

## Current version

**v1.1.0** uses a growing modular civil-construction vocabulary. The Today screen and validation logs report the live term count, so documentation does not need manual count updates. Each vocabulary card includes:

- English term and pronunciation;
- plain-English definition;
- practical Russian explanation and translation;
- Vietnamese translation;
- realistic construction example;
- scenario clue;
- related terminology and common mistakes;
- a dedicated educational SVG-style diagram.

The vocabulary covers drainage, underground utilities, trench/pipe embedment, earthworks, roadworks, concrete, duct banks, drawings/survey, estimating and tendering.

## Intended user workflow

GitHub is the maintenance backend, not the daily user interface.

The normal owner workflow is deliberately only two surfaces:

1. **ChatGPT** — identify or add a construction word. ChatGPT maintains GitHub, the Focus list, visuals and validation.
2. **Trainer PWA** — learn the words from the Today screen, Practice, Dictionary, Drawing and Progress.

The owner should not need to edit JSON, manage commits, open Actions or browse repository settings during normal use.

The Today screen includes an **Add a word you saw today** bridge. The owner enters a term and the trainer prepares the exact repository-aware ChatGPT prompt. On supported phones it can use the native Share sheet; Copy prompt is always available as a fallback.

On iPhone, the web version also shows temporary first-run guidance for **Safari → Share → Add to Home Screen**. Once installed as a PWA, that guidance disappears automatically.

## Daily-use UX

v1.1 is organized around fast phone use and a validation-gated ChatGPT → GitHub → trainer workflow:

- **Today** is the default screen, with the daily goal, learning stats and a primary **Smart 10** action.
- One-tap shortcuts open Focus words, Due review, Estimator scenarios, Drawing abbreviations, Drawing Challenge, Dictionary and Progress.
- Mobile navigation is reduced to five primary destinations: **Today / Practice / Dictionary / Drawing / Progress**.
- Due and Weak lists remain available from Progress instead of occupying permanent navigation space.
- Practice scope/category/mode controls live under **Practice settings**, keeping the normal training flow uncluttered.
- Every answered normal question gets an inline **Next question** action; Drawing Challenge gets **Next drawing**.
- An active Quick 10 is protected: shortcuts resume the frozen session instead of silently changing its scope or mode.
- Dictionary cards default to **Compact** on phones and can be switched to Detailed; the preference is remembered locally.
- Export/Import are grouped into a secondary **Data** menu.
- The Today screen can generate/share the correct ChatGPT add-word command without requiring the owner to remember the repository name.
- **Vocabulary Inbox** lets the owner capture terms locally during work without leaving the trainer, then send them to ChatGPT in reviewable batches of up to 25.
- Inbox terms stay only on that device until shared; after a validated release, published Focus terms are marked **Synced** and can be cleared without deleting unsynced captures.
- First-run iPhone install help appears only when appropriate and can be dismissed temporarily.
- Controls keep at least 44 px touch targets, the bottom navigation respects iPhone safe areas, and reduced-motion preferences are honored.
- The interface automatically follows the device **dark/light theme** while technical diagrams keep a high-contrast educational rendering.

## Learning features

- Search and category filters.
- EN → RU, RU → EN and VI → EN practice.
- **Typed active recall** with prompts that can come from Russian, Vietnamese, an English definition, a work scenario or a drawing abbreviation.
- Legitimate English aliases are accepted; punctuation, hyphens, capitalization and spacing are normalized.
- **Drawing abbreviations** practice for common labels such as `CB`, `MH`, `STM`, `SAN`, `WM`, `INV`, `STA`, `FM` and others. These are learning aids, not universal standards — always verify the project legend/specifications.
- **Estimator scenarios**: generic decision questions about takeoff structure, addenda, utility uncertainty, production, unit pricing, duct-bank cost components and similar estimating situations.
- Definition, scenario, diagram and fill-in-the-blank questions.
- Validated fill prompts through `data/fill-examples.json` where a natural example uses an inflected form.
- **Similar terms** practice for confusing pairs such as `RFI / RFQ`, `cut / fill`, `subgrade / subbase`, `trench box / shoring`, `unit price / lump sum`, and `allowance / contingency`.
- **My focus list** for words explicitly added from chat.
- Strict Focus / Due / Weak / New scopes: filters never silently substitute unrelated terms.
- Category-focused practice.
- Adaptive Smart Review using overdue time, error history, recent mistakes and mastery level.
- **Recent Focus words receive a temporary recency boost**, so terms just added from work appear more often without permanently crowding out due/weak vocabulary.
- **Quick 10** with a frozen starting pool, no target repeats until that pool is exhausted, locked filters and saved session history.
- Speech pronunciation without revealing hidden answers before recall.
- Spaced-repetition states: `new -> learning -> review -> mastered`.
- Adaptive weak-word ranking and Due Review queue.
- Configurable daily goal, streak, 7-day activity, hardest words and recent sessions.
- **Drawing Challenge** with generic civil plan/section scenes; answers update the same term progress.
- Export/import of browser learning state.
- Installable PWA with network-first online refresh and offline fallback.

## Vocabulary Inbox

`src/vocab-inbox.js` provides a small local capture queue for workday terminology.

Typical flow:

1. See a term on a drawing/site note and type it into Today.
2. Tap **Save for later** instead of switching apps.
3. Keep capturing terms during the day; duplicates are removed case-insensitively.
4. Open **Vocabulary Inbox** and tap **Send next batch to ChatGPT**. AI batches are capped at 25 terms so every term can be reviewed properly.
5. After ChatGPT confirms validation + Pages deployment, tap **Refresh vocabulary**.
6. Captures that map to the published Focus list (canonical term, legitimate alias, or known drawing label) show **Synced**.
7. Tap **Clear synced** to remove only confirmed captures; unresolved items remain.

The Inbox is localStorage-only, bounded to 100 terms, and is deliberately separate from GitHub and browser learning progress. It should contain terminology only — not project names, prices, confidential notes, client information or tender details.

## Chat → My focus list

`data/focus-terms.json` is the bridge between chat and the trainer.

When the owner says:

> Add `duct bank` to my construction dictionary.

that means **learning intent**, not merely “create a JSON row.” The expected workflow is:

1. Search all vocabulary/aliases for the canonical term.
2. If missing, create the complete multilingual card and diagram.
3. If it already exists, reuse it rather than creating a duplicate.
4. In both cases, upsert the canonical ID into `data/focus-terms.json`.
5. Repeated requests update `last_requested_at` and `request_count`.
6. The app marks it `focus` and exposes it under **Practice → My focus list**.

A response that only says “already exists” is incomplete.

## Drawing abbreviations and aliases

`data/term-meta.json` stores optional learning metadata separately from canonical vocabulary cards:

- `aliases_en` — legitimate English equivalents accepted by typed recall;
- `drawing_labels` — common drawing abbreviations/labels used for recognition practice.

Example:

```json
"watermain": {
  "aliases_en": ["water main"],
  "drawing_labels": ["WM"]
}
```

Drawing conventions vary by owner, municipality and consultant. The app therefore displays a **verify project legend** warning instead of presenting these labels as universal standards.

## Estimator scenarios

`data/estimator-challenges.json` contains generic, non-project-specific estimator decisions. Each challenge:

- links to one existing canonical `term_id`;
- uses the same vocabulary category as that term;
- presents a scenario and question;
- has multiple unique options with exactly one intended correct answer;
- explains the estimating reasoning after the answer;
- updates spaced-repetition progress for the linked term.

The initial set covers utility crossing uncertainty, addenda, trench material breakdown, unit pricing, production-rate reconciliation, allowances, duct-bank cost components and mill/overlay limits.

Do not store client drawings, bid prices or confidential tender facts in these scenarios.

## Drawing Challenge

`src/drawing-challenges.js` contains generic educational drawings, never project drawings. Current scenes:

1. Road drainage plan — catch basin, storm sewer, manhole, culvert, ditch.
2. Road structure section — overlay, base course, subbase, subgrade, curb and gutter.
3. Underground utility section — backfill, bedding, duct bank, shoring, trench.

CI validates target IDs, callout uniqueness, CSS coverage, behavioral selection and answer leakage through visible/accessibility text.

## Adaptive learning state

Browser progress is managed by `src/learning-state.js` and currently uses state **v3**. It stores:

- per-term spaced-repetition records;
- recent answer results for adaptive weighting;
- daily attempts/correct counts;
- historical daily goal for each active day;
- current daily-goal setting;
- completed Quick-session history.

The app migrates `construction-vocab-state-v2` and the older `construction-vocab-progress-v1` into v3. Malformed stored/imported values are sanitized rather than allowed to create `NaN` counters or crash the app.

Learning state is local to the browser and is **not committed to GitHub**. Use Export/Import before clearing browser data or moving devices.

## Data files

- `data/terms.json` — original 31-term core.
- `data/terms-expansion.json` — expansion vocabulary and default home for new terms.
- `data/categories.json` — controlled categories.
- `data/focus-terms.json` — terms explicitly requested through chat.
- `data/term-meta.json` — optional English aliases and common drawing labels.
- `data/estimator-challenges.json` — generic estimator decision exercises.
- `data/fill-examples.json` — canonical fill sentences where needed.
- `data/vocabulary-backlog.json` — acknowledged future related concepts.
- `data/term.schema.json` — vocabulary-card schema.

The app combines the two term files into one live dictionary; its size grows as chat-added vocabulary is validated.

## Main modules

- `src/app.js` — application orchestration and learning UI.
- `src/ui-enhancements.js` — Today shortcuts, mobile routing, compact dictionary state, inline Next actions and UX safety around active Quick 10 sessions.
- `src/onboarding.js` — iPhone install guidance, repository-aware ChatGPT prompts, recent Focus sync and Inbox UI behavior.
- `src/vocab-inbox.js` — bounded local capture queue, deduplication, persistence and safe recovery from storage failures.
- `src/practice-engine.js` — recall normalization, metadata merge, prompt generation, practice selection and challenge helpers.
- `src/learning-state.js` — state migration, scheduling, adaptive weighting, daily goals/streaks and sessions.
- `src/drawing-challenges.js` — multi-feature drawing exercises.
- `src/visuals.js`, `src/visuals-extra.js`, `src/visuals-all.js` — term diagrams and quiz-safe rendering.
- `src/styles.css`, `src/quiz.css`, `src/progress.css` — core interface styling.
- `src/ux.css` — Today-first/mobile interaction layer.
- `src/dark.css` — automatic system dark-theme overrides.
- `src/onboarding.css` — install/chat bridge styling and responsive behavior.
- `AI_INSTRUCTIONS.md` — maintenance contract for AI agents.
- `sw.js` / `manifest.webmanifest` — PWA/offline support.

## Audit and tests

Run the complete gate:

```bash
npm run validate
```

Run behavioral/content tests only:

```bash
npm test
```

CI validates, among other things:

- vocabulary structure, categories, focus metadata, fill prompts and related-term backlog;
- content-quality and answer-leak checks;
- 100% dedicated visual coverage for the current vocabulary and SVG CSS contracts;
- Drawing Challenge scene/callout behavior;
- PWA runtime/precache dependencies (recursively discovered from the index/import graph) and network-first freshness;
- local Vocabulary Inbox parsing, deduplication, bounded persistence, storage-failure safety and published Focus sync matching;
- learning-state migration, sanitization, scheduling, adaptive weighting, goals, streaks and sessions;
- recall normalization, aliases, varied typed prompts, strict practice scopes and option uniqueness;
- drawing-label metadata uniqueness and referenced term IDs;
- estimator challenge IDs, categories, option structure and exactly-one-correct-answer contract;
- UI/runtime/PWA wiring for the learning modes;
- **mobile UX contract**: Today-first flow, five-tab navigation, one-tap routing, safe Quick 10 resume, inline Next controls, compact cards, dark mode, 44 px touch targets, iPhone safe-area handling, install guidance and the ChatGPT add-word bridge;
- JavaScript syntax and manifest JSON validity.

GitHub Actions uses `pipefail`, collects independent diagnostics, uploads audit logs, and fails at the final gate if any check failed.

## Run locally

Because the app loads JSON with `fetch()`, serve it through HTTP rather than double-clicking `index.html`.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

The repository already contains `.github/workflows/deploy-pages.yml`. GitHub Pages is release-gated: a normal publish occurs only after `Validate vocabulary` completes successfully on `main`.

One-time GitHub setting:

1. Open the repository settings in the **GitHub website** (not the GitHub mobile app).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

The GitHub mobile app does not expose the complete repository administration UI, so Pages setup should be done once in Safari/desktop browser. After that, normal use should not require GitHub at all.

Direct push-to-Pages publishing is intentionally disabled. The deploy workflow checks out the exact validated commit; manual deployment re-runs the full validation gate before publishing.

Expected site address after publication:

`https://taiduc1302.github.io/construction-vocabulary-trainer/`

Do not assume the site is live merely because the repository or workflow exists; verify the actual deployment first.


### Safe chat-to-live release flow

1. ChatGPT/Claude prepares the complete vocabulary change (card + visual + Focus metadata + any related metadata).
2. The change must be atomic: one complete commit, or a short-lived branch/PR that is merged only when complete.
3. `Validate vocabulary` runs first.
4. Only a successful validation run can trigger GitHub Pages deployment.
5. The Today screen can show the latest Focus additions; use **Refresh vocabulary** after an AI confirms the change if the app was already open.

This prevents incomplete multi-commit states from briefly appearing in the live trainer.

## Install on a phone

After the Pages site is live and opened once online:

- iPhone/iPad: Safari → Share → Add to Home Screen.
- Android/Chrome: browser menu → Install app / Add to Home screen.

The app itself reminds iPhone users of the Safari install path until it is installed, with a temporary dismiss option.

Mutable HTML/JS/CSS/JSON use network-first loading when online, with cached fallback offline, so chat-driven updates are not hidden behind a stale app shell.

## Add words through ChatGPT / Claude

The preferred path is still **ChatGPT**. If you are already inside the trainer, the Today-screen add-word bridge can prepare one repository-aware request for a single term or a comma-separated batch. The trainer itself never writes to GitHub or stores credentials.

A manual request can still be as short as:

> Add `hydrant` to my construction dictionary in `taiduc1302/construction-vocabulary-trainer`.

or:

> I saw `stub-out` today. Add it to my construction dictionary.

The agent must follow `AI_INSTRUCTIONS.md`, update My focus list even when the term already exists, run the validation gate and confirm the final GitHub Action.

A screenshot from work can be used to identify a term, but the repository should contain a clean **generic educational schematic**, not the confidential project drawing.

## Review intervals

Approximate spaced-review intervals:

`1 -> 3 -> 7 -> 14 -> 30 -> 60 days`

Wrong answers reduce mastery immediately. Smart Review also considers recent mistakes and overdue time.

## Privacy

The repository may contain generic vocabulary, learning metadata, estimator exercises, an explicit vocabulary backlog and the non-confidential IDs the owner wants to study. Do not commit company-confidential drawings, tender documents, prices, customer information, credentials, private project data or exported browser learning-state files.
