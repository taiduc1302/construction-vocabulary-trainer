# AI Instructions for Maintaining the Vocabulary Trainer

This repository is a personal learning system for construction vocabulary. These rules apply to ChatGPT, Claude, and other AI agents.

## Vocabulary source of truth

Vocabulary is intentionally modular:

- `data/terms.json` contains the original/core vocabulary.
- `data/terms-expansion.json` contains the current expansion pack and is the default location for new terms.
- `data/categories.json` contains the controlled category list.
- `data/focus-terms.json` contains the owner's current personal learning focus list.

Treat all `data/terms*.json` files together as one vocabulary. Term IDs must be unique across every vocabulary file.

Before adding a term:
1. Read all existing `data/terms*.json` files.
2. Check for duplicates, spelling variants, abbreviations, and near-synonyms.
3. Reuse an existing category from `data/categories.json` when possible.
4. Preserve all required fields.
5. Add a dedicated educational diagram using the same term `id`.
6. Run the full validation command: `npm run validate`.

For normal new vocabulary, append to `data/terms-expansion.json` and add its diagram to `src/visuals-extra.js`. Do not move old terms between files without a good reason because browser learning progress is keyed by term ID.

Do not add a term if the resulting repository would fail validation.

## What “add this word to my dictionary” means

This phrase expresses learning intent, not merely a request to create a database row.

When the owner says something like:

`Add duct bank to my dictionary.`

always do the following:

1. Search the whole vocabulary for the term, aliases, spelling variants, and obvious canonical equivalents.
2. If the term does **not** exist, create the complete vocabulary entry and its dedicated diagram.
3. If the term **already exists**, do not stop with “already exists.” Review the existing entry for obvious gaps or inaccuracies, but do not rewrite good content just to make a commit.
4. Whether the term was new or already present, **upsert its canonical ID into `data/focus-terms.json`**. This is the concrete action that means “I want to learn this word now.”
5. If the ID is already in the focus list, update `last_requested_at` and increment `request_count` rather than creating a duplicate.
6. If the user supplied an alias or abbreviation, focus the canonical vocabulary ID and explain the mapping briefly.
7. The final response should say that the word is now in **My focus list**. Do not respond only that it already existed.

`data/focus-terms.json` entries use this shape:

```json
{
  "id": "duct-bank",
  "added_at": "2026-09-15",
  "last_requested_at": "2026-09-15",
  "request_count": 1
}
```

Use the user's local calendar date when available. Keep `added_at` unchanged on later requests.

The focus list is intentionally stored in the repository because this is the owner's personal trainer. Never put confidential project information into focus-list notes or metadata.

## Required fields per term

- `id`: lowercase kebab-case unique id.
- `term`: standard English construction term.
- `pronunciation`: IPA or a simple pronunciation hint when useful.
- `category`: one controlled category id.
- `definition_en`: plain-English explanation, written for a working construction estimator.
- `explanation_ru`: practical Russian explanation, not merely a literal translation.
- `translation_ru`: one or more natural Russian equivalents.
- `translation_vi`: one or more natural Vietnamese equivalents.
- `example_en`: realistic construction sentence.
- `scenario`: a short real-world clue usable in quizzes.
- `visual`: concise description of what the educational diagram should show.
- `related_terms`: related ids or terms that help build associations.
- `common_mistakes`: optional but strongly encouraged for confusing terminology.
- `difficulty`: integer 1-5.

## Content standards

- Prefer civil / heavy civil / estimating examples over generic building examples.
- Keep definitions technically accurate but easy to remember.
- Use terminology that a contractor, estimator, civil designer, supplier, or field crew would realistically use in Canada when applicable.
- Do not fabricate code requirements, municipal standards, prices, project facts, or dimensions unless the user supplied them.
- Generic dimensions may be used only as clearly illustrative examples.
- Distinguish similar terms explicitly, e.g. `culvert` vs `storm sewer`, `subgrade` vs `subbase`, `trench box` vs `shoring`, `allowance` vs `contingency`, `RFI` vs `RFQ`, `unit price` vs `lump sum`.
- Russian should sound natural to a Russian-speaking construction professional and explain the concept, not just translate it.
- Vietnamese should use standard modern Vietnamese and practical construction wording.
- Avoid company names, confidential tender information, client data, bid prices, credentials, and proprietary documents.

## Visual standard

Every vocabulary entry must have both:

1. A `visual` description in its `data/terms*.json` entry.
2. A dedicated SVG-style diagram keyed by the same `id` in either `src/visuals.js` or `src/visuals-extra.js`.

The combined renderer is `src/visuals-all.js`.

The diagram should teach the physical idea quickly. Prefer:
- cross-sections for buried utilities, pavement layers, excavation and drainage;
- plan views for alignment, stationing and takeoff concepts;
- simplified tables/forms for estimating and tendering terms;
- arrows showing flow, direction, elevation, connection or sequence where useful.

Do not depend on copyrighted web images. Do not commit project drawings or screenshots just to illustrate a term. If the user provides a work screenshot to explain a word, identify the concept and create a clean generic schematic instead.

Visual quizzes remove answer labels and captions through `src/visuals-all.js`, so the geometry must still make sense without seeing the answer word.

## Drawing Challenge standard

`src/drawing-challenges.js` contains multi-feature generic civil drawings for contextual recognition practice.

Rules:
- Never copy a client/project drawing into the repository.
- Create generic educational plan views or sections.
- Use neutral callout letters such as A, B, C instead of writing the answer term on the scene.
- Every `termId` referenced by a drawing challenge must exist in the vocabulary.
- Prefer realistic combinations of features that an estimator could see together on a drawing.
- A Drawing Challenge answer updates the same spaced-repetition record as other practice modes.
- Add a new scene only when it teaches a useful context that the single-term diagrams do not already provide.

CI validates drawing `termId` references.

## Learning design

When adding terms, make them usable in several forms of retrieval practice:
- English -> Russian meaning
- Russian -> English recall
- Vietnamese -> English recall
- typed English recall without answer choices
- definition -> term
- scenario -> term
- diagram -> term
- fill in the blank
- distinguish from a similar term
- focused practice by construction category
- contextual recognition in a generic drawing when appropriate

The `scenario` must not contain the answer itself or an obvious grammatical variant of it.

If a new term has a commonly confused counterpart, consider adding the pair to `confusablePairs` in `src/app.js` so it appears in **Similar terms** practice.

## Adaptive review and learning state

`src/learning-state.js` owns browser learning state. It is versioned and currently uses v2.

The state contains:
- per-term spaced-repetition records;
- recent answer results used by adaptive weighting;
- daily attempts/correct counts;
- daily-goal setting;
- completed Quick-session history.

The legacy `construction-vocab-progress-v1` localStorage key is migrated automatically into v2. Preserve this migration path unless there is a deliberate future migration.

Smart Review uses adaptive weighting. Overdue terms, high error rate, recent mistakes, and low mastery raise a word's selection weight. Mastered words that are not due are deprioritized.

`My focus list` is separate from browser mastery. It represents words the owner has explicitly encountered or asked to learn, and is sourced from `data/focus-terms.json`.

Do not commit user learning-state exports to the repository. Do not reset or rename stable term IDs casually because those IDs link vocabulary to the user's stored history.

The app uses the statuses:

`new -> learning -> review -> mastered`

## Editing workflow

When asked to add or improve words:
1. Fetch all `data/terms*.json` files, `data/categories.json`, `data/focus-terms.json`, and relevant existing visuals.
2. Resolve the requested wording to an existing canonical term if possible.
3. Add or improve the vocabulary entry when needed, normally in `data/terms-expansion.json`.
4. Add/update its diagram when needed, normally in `src/visuals-extra.js`.
5. Upsert the canonical term ID into `data/focus-terms.json` every time the owner explicitly asks to add/learn the word.
6. Add a Similar terms pairing when useful.
7. Consider whether the term belongs in an existing Drawing Challenge or justifies a new generic scene.
8. Keep valid JSON and JavaScript.
9. Run or reproduce `npm run validate`.
10. Confirm the automated GitHub Action passes.
11. Commit with concise messages.

When asked to improve a word, update the existing entry instead of creating a duplicate.

## User-facing shorthand

The owner may simply say:

`Add hydrant, transformer pad and traffic control to my dictionary.`

Treat that as authorization to update this repository and put all three canonical IDs into the focus list.

The owner may also provide a screenshot or term encountered at work and say something like:

`I saw this on a drawing. Add it to my dictionary.`

In that case, identify the terminology carefully, avoid copying confidential project content, create or reuse the generic educational entry, and add the canonical term to the focus list.
