# AI Instructions for Maintaining the Vocabulary Trainer

This repository is a personal learning system for construction vocabulary. These rules apply to ChatGPT, Claude and other AI agents.

## Source of truth

Vocabulary/data is intentionally modular:

- `data/terms.json` — original/core vocabulary.
- `data/terms-expansion.json` — expansion vocabulary and default location for new terms.
- `data/categories.json` — controlled categories.
- `data/focus-terms.json` — words the owner explicitly wants to learn now.
- `data/term-meta.json` — optional English aliases and common drawing labels/abbreviations.
- `data/estimator-challenges.json` — generic estimator decision exercises linked to vocabulary.
- `data/fill-examples.json` — exercise-only canonical fill sentences where needed.
- `data/vocabulary-backlog.json` — acknowledged future concepts with priority/reason.

Treat all `data/terms*.json` files together as one vocabulary. Stable term IDs are the key linking cards, progress, focus, visuals, metadata and challenges.

Before adding or editing vocabulary, read the relevant current data files and existing visuals. Do not create duplicates or casually rename an existing ID.

## What “add this word to my dictionary” means

It expresses learning intent, not merely “create a database row.”

When the owner says, for example:

`Add duct bank to my dictionary.`

always:

1. Search the whole vocabulary plus aliases/obvious spelling variants for the canonical term.
2. If missing, create the complete vocabulary entry and dedicated diagram.
3. If already present, reuse it; review obvious gaps but do not rewrite good content only to create a commit.
4. **Upsert the canonical ID into `data/focus-terms.json` whether the card was new or existing.**
5. If already focused, keep `added_at`, update `last_requested_at`, and increment `request_count`.
6. If the user supplied an alias or abbreviation, map it to the canonical term and explain that mapping briefly.
7. Final response must say that the term is now in **My focus list**. Do not stop at “already exists.”

Example focus entry:

```json
{
  "id": "duct-bank",
  "added_at": "2026-09-15",
  "last_requested_at": "2026-09-15",
  "request_count": 1
}
```

Use the user's local calendar date when available. Never put confidential project information in focus metadata.

## Required vocabulary fields

Every full card must include:

- `id` — unique lowercase kebab-case ID;
- `term` — canonical English construction term;
- `pronunciation`;
- `category` — existing controlled category;
- `definition_en`;
- `explanation_ru` — practical explanation, not only literal translation;
- `translation_ru` — non-empty array;
- `translation_vi` — non-empty array;
- `example_en` — realistic construction sentence;
- `scenario` — recall clue;
- `visual` — generic diagram description;
- `related_terms` — useful associations;
- `common_mistakes` — optional but strongly recommended;
- `difficulty` — integer 1–5.

For normal new vocabulary, append to `data/terms-expansion.json` and add the diagram to `src/visuals-extra.js`.

## Content standards

- Prefer civil/heavy-civil/estimating use cases over generic building examples.
- Keep definitions technically accurate and memorable.
- Use practical Canadian-contractor language when applicable, but do not invent owner/municipality standards.
- Do not fabricate code requirements, prices, dimensions, project facts or bid assumptions.
- Distinguish confusing concepts explicitly (`RFI/RFQ`, `allowance/contingency`, `subgrade/subbase`, etc.).
- Russian should sound natural to a Russian-speaking construction professional.
- Vietnamese should use practical modern construction wording.
- `scenario` must not reveal the answer term or an obvious grammatical variant.
- Fill practice requires a source sentence containing the exact canonical term. If natural `example_en` intentionally uses an inflected form, add an exercise-only override to `data/fill-examples.json` instead of making the example unnatural.
- Every `related_terms` value should resolve to an existing term/name, a controlled category, or an acknowledged item in `data/vocabulary-backlog.json`.
- Remove a backlog entry once the concept becomes a full vocabulary card.
- Never commit company names, confidential drawings, tender documents, bid prices, customer information, credentials or private project facts.

## English aliases and drawing abbreviations

`data/term-meta.json` is the optional metadata layer.

Use `aliases_en` only for legitimate, unambiguous English equivalents that should be accepted by typed recall, e.g. `watermain` / `water main`.

Use `drawing_labels` only for genuinely common drawing abbreviations/labels that are useful to recognize, e.g. `CB`, `MH`, `INV`, `STA`.

Important rules:

- Drawing abbreviations are **not universal standards**. They can vary by owner, consultant, municipality and discipline.
- Never tell the learner that a label is always/officially one meaning unless a specific authoritative standard is being discussed.
- The app must continue to show a “verify project legend/specifications” warning.
- Avoid ambiguous duplicate labels across two canonical terms in the metadata layer. CI treats ambiguous duplicates as an error.
- If a new term should accept an alias or drawing label, add it to `term-meta.json` and run the full validation gate.
- Do not move these optional learning conventions into the canonical definition unless they are part of the concept itself.

## Estimator Challenge standard

`data/estimator-challenges.json` contains generic estimator decision practice. Its purpose is to teach how vocabulary participates in real estimating decisions, not to store project-specific bid logic.

Every challenge must:

- have a unique `id`;
- link to one existing canonical `term_id`;
- use the **same controlled category** as the linked term;
- have a clear `title`, `scenario`, `question` and `explanation`;
- have at least three unique answer options;
- have exactly **one** option with `correct: true`;
- keep all `correct` values boolean;
- use generic, defensible estimating reasoning rather than pretending one contractor-specific workflow is universally required;
- avoid client/project names, quantities, bid prices or confidential tender details.

A correct/incorrect Estimator Challenge answer updates the same spaced-repetition record as the linked vocabulary term.

When adding a challenge, ask whether the scenario materially teaches estimating judgment. Do not create filler questions that merely restate the definition.

## Visual standard

Every vocabulary entry requires:

1. a `visual` description in the term JSON;
2. a dedicated SVG-style diagram keyed by the same ID in `src/visuals.js` or `src/visuals-extra.js`.

Prefer cross-sections for buried utilities/pavement/excavation, plan views for alignments/takeoff concepts, simplified tables/forms for estimating/tendering, and arrows for flow/direction/elevation/sequence.

Do not depend on copyrighted web images or copy client/project drawings. If the user supplies a work screenshot, identify the concept and create a clean generic educational schematic.

Visual quiz rendering must remain answer-safe. All used `tv-*` classes must exist in CSS; CI checks this contract.

## Drawing Challenge standard

`src/drawing-challenges.js` contains generic multi-feature civil scenes.

Rules:

- never copy a client/project drawing;
- use neutral callout letters instead of answer names;
- every referenced `termId` must exist;
- callout labels must be unique within a scene and visibly present;
- do not leak the target through title, description/figcaption, SVG text or accessibility/ARIA text;
- every used `dc-*` class must exist;
- prefer realistic combinations of features an estimator might see together;
- answers update the linked term's spaced-repetition record.

## Practice behavior

`src/practice-engine.js` owns pure/testable selection and recall helpers. Preserve these invariants:

- Focus, Due, Weak and New are **strict scopes**; never silently substitute unrelated terms after filtering.
- Smart/Focus may use adaptive weighting.
- Typed recall normalizes punctuation, hyphens, capitalization and spacing and accepts only legitimate aliases.
- Typed active recall may use Russian, Vietnamese, definition, scenario or drawing-label prompts. Prompt generation must avoid leaking the canonical answer.
- Drawing-abbreviation mode must keep the project-legend warning visible.
- Estimator mode must only use challenges whose linked term is inside the current practice pool.
- Multiple-choice options must be unique and should provide four choices when possible.
- Quick 10 freezes its starting term pool, avoids normal target repeats until the pool is exhausted, and locks scope/category/mode while active.
- Keep pure logic in `practice-engine.js` rather than moving it into DOM-heavy code when it can reasonably be tested independently.

If a new term has a useful confused counterpart, consider adding it to `confusablePairs` in `src/app.js`.

## Learning state

`src/learning-state.js` owns browser state and currently uses **v3**.

It stores per-term progress, recent results for adaptive weighting, daily attempts/correct counts, each historical day's goal, the current goal, and completed Quick-session history.

Migration support that must remain safe unless deliberately superseded:

- `construction-vocab-state-v2` → v3;
- `construction-vocab-progress-v1` → v3.

Normalize malformed counters/timestamps/partial imports and unavailable localStorage. Invalid data must not create `NaN` values or crash the trainer.

Changing today's daily goal must not retroactively rewrite whether earlier days met their historical goals.

Focus-list intent is separate from browser mastery. Never commit exported browser learning-state files.

## PWA / cache rules

`sw.js` provides offline support while avoiding stale chat-driven updates.

- Mutable HTML, JS, CSS, JSON and the manifest use network-first behavior online with cached fallback offline.
- Every runtime module/data file/local stylesheet/icon used by the app must be represented in the service-worker precache when appropriate.
- Any new runtime data file (including metadata/challenge files) must be added to `sw.js` in the same change.
- `scripts/validate-pwa.mjs` and learning-content tests check this wiring; do not weaken validators simply to make CI pass.
- Correctness must not depend on remembering to bump the cache name for every vocabulary edit, though a cache-version bump is still reasonable for major app-shell changes.

## Validation workflow

For normal vocabulary work:

1. Fetch current term files, categories, focus list, metadata, fill overrides, backlog and relevant visuals.
2. Resolve requested wording to the canonical term.
3. Add/improve the card when needed.
4. Add/update the dedicated visual when needed.
5. Remove it from backlog if it became a full card; add intentional unresolved related concepts to backlog.
6. Update optional `term-meta.json` only for legitimate aliases/common labels.
7. Upsert focus metadata every time the owner explicitly asks to add/learn the word.
8. Add Similar Terms / Drawing Challenge / Estimator Challenge only when they genuinely improve learning.
9. Update `sw.js` if a new runtime file was introduced.
10. Run `npm run validate`.
11. Confirm GitHub Actions passes on the **final commit**, not an earlier one.
12. During a deep audit, inspect uploaded audit logs instead of trusting only the green badge.

For runtime changes, consider whether to add/extend:

- `scripts/test-learning-state.mjs`;
- `scripts/test-practice-engine.mjs`;
- `scripts/test-drawing-challenges.mjs`;
- `scripts/test-learning-content.mjs`;
- `scripts/audit-content.mjs`;
- `scripts/validate-visuals.mjs`;
- `scripts/validate-pwa.mjs`.

GitHub Actions intentionally runs checks independently, uses shell `pipefail`, uploads audit logs and fails at the end if any gate fails. Do not collapse it to an opaque single step or remove `pipefail` from piped checks.

## GitHub Pages

`.github/workflows/deploy-pages.yml` is the deployment workflow. GitHub Pages must first be enabled in repository **Settings → Pages → Source: GitHub Actions**. Until then the workflow performs a successful preflight/skip. Do not claim the public trainer is live until an actual Pages deployment succeeds and the site URL is verified.

## User-facing shorthand

The owner may simply say:

`Add hydrant, transformer pad and traffic control to my dictionary.`

Treat that as authorization to update this repository and focus the canonical terms.

The owner may also send a screenshot and say:

`I saw this on a drawing. Add it to my dictionary.`

Identify the terminology carefully, avoid copying confidential content, create/reuse the generic educational concept, and focus its canonical ID.
