# AI Instructions for Maintaining the Vocabulary Trainer

This repository is a personal learning system for construction vocabulary. These rules apply to ChatGPT, Claude, and other AI agents.

## Vocabulary source of truth

Vocabulary is intentionally modular:

- `data/terms.json` contains the original/core vocabulary.
- `data/terms-expansion.json` contains the current expansion pack and is the default location for new terms.
- `data/categories.json` contains the controlled category list.

Treat all `data/terms*.json` files together as one vocabulary. Term IDs must be unique across every vocabulary file.

Before adding a term:
1. Read all existing `data/terms*.json` files.
2. Check for duplicates, spelling variants, abbreviations, and near-synonyms.
3. Reuse an existing category from `data/categories.json` when possible.
4. Preserve all required fields.
5. Add a dedicated educational diagram using the same term `id`.
6. Run the full validation command: `npm run validate`.

For normal new vocabulary, append to `data/terms-expansion.json` and add its diagram to `src/visuals-extra.js`. Do not move old terms between files without a good reason because browser learning progress is keyed by term ID and stable project structure makes AI maintenance safer.

Do not add a term if the resulting repository would fail validation.

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

## Learning design

When adding terms, make them usable in several forms of retrieval practice:
- English -> Russian meaning
- Russian -> English recall
- Vietnamese -> English recall
- definition -> term
- scenario -> term
- diagram -> term
- fill in the blank
- distinguish from a similar term

The `scenario` must not contain the answer itself or an obvious grammatical variant of it.

If a new term has a commonly confused counterpart, consider adding the pair to `confusablePairs` in `src/app.js` so it appears in **Similar terms** practice.

## Spaced review

The browser stores personal learning progress locally. Do not commit an individual's learning history into the repository. The app uses the statuses:

`new -> learning -> review -> mastered`

Keep changes to vocabulary data backward-compatible with existing term ids whenever possible. Renaming an id can orphan stored progress, so only change ids when necessary.

## Editing workflow

When asked to add or improve words:
1. Fetch all `data/terms*.json` files, `data/categories.json`, and relevant existing visuals.
2. Add or improve terms, normally in `data/terms-expansion.json`.
3. Add/update their diagrams, normally in `src/visuals-extra.js`.
4. Add a Similar terms pairing when useful.
5. Keep valid JSON and JavaScript.
6. Run or reproduce `npm run validate`.
7. Confirm the automated GitHub Action passes.
8. Commit with a concise message such as `Add drainage vocabulary`.

When asked to improve a word, update the existing entry instead of creating a duplicate.

## User-facing shorthand

The owner may simply say:

`Add headwall, daylighting and trench shield to my dictionary.`

Treat that as authorization to update this repository following these rules.

The owner may also provide a screenshot or term encountered at work and say something like:

`I saw this on a drawing. Add it to my dictionary.`

In that case, identify the terminology carefully, avoid copying confidential project content, and create a generic educational entry and diagram.
