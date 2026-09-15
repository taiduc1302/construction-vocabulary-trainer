# AI Instructions for Maintaining the Vocabulary Trainer

This repository is a personal learning system for construction vocabulary. These rules apply to ChatGPT, Claude, and other AI agents.

## Source of truth

`data/terms.json` is the canonical vocabulary file.

Before adding a term:
1. Read the existing file.
2. Check for duplicates, spelling variants, and near-synonyms.
3. Reuse an existing category from `data/categories.json` when possible.
4. Preserve all required fields.

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
- `visual`: concise visual description that the app can turn into a schematic.
- `related_terms`: ids or terms that help build associations.
- `common_mistakes`: optional but encouraged.
- `difficulty`: integer 1-5.

## Content standards

- Prefer civil / heavy civil examples over generic building examples.
- Keep definitions accurate but easy to remember.
- Do not fabricate code requirements, municipal standards, prices, project facts, or dimensions unless the user supplied them.
- Generic dimensions may be used only as clearly illustrative examples.
- Distinguish similar terms explicitly, e.g. `culvert` vs `storm sewer`, `subgrade` vs `subbase`, `allowance` vs `contingency`.
- Russian should sound natural to a Russian-speaking construction professional.
- Vietnamese should use standard modern Vietnamese and practical construction wording.
- Avoid company names, confidential tender information, client data, bid prices, credentials, and proprietary documents.

## Visuals

Every term must have a `visual` field. It should describe a simple schematic rather than depend on a copyrighted image. Example:

`Road cross-section with a pipe carrying ditch water under the roadway, arrows showing water flow.`

The frontend renders this as a simple educational diagram.

## Learning design

When adding terms, also think about how they can be tested:
- English -> Russian meaning
- Russian -> English recall
- English -> Vietnamese recognition
- scenario -> term
- image/schematic -> term
- fill in the blank
- distinguish from a similar term

## Editing workflow

When asked to add words:
1. Fetch `data/terms.json`.
2. Add or improve terms.
3. Keep valid JSON.
4. Run or reproduce the checks in `scripts/validate-terms.mjs`.
5. Commit with a concise message such as `Add drainage vocabulary`.

When asked to improve a word, update the existing entry instead of creating a duplicate.

## User-facing shorthand

The owner may simply say:

`Add headwall, daylighting and trench shield to my dictionary.`

Treat that as authorization to update this repository following these rules.
