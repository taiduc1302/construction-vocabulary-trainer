# Learning quality and spaced-review rules

This document records the corrected behavior of Dictionary lookup, definition questions, language support and spaced review. It is part of [Issue #29](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/29).

## Dictionary search

Dictionary filtering uses the same `normalizeTermSearch` normalization as the public work-term lookup: Unicode NFKC, case-insensitive, punctuation/spacing normalization, Russian and Vietnamese. It searches the **visible** term fields, including English names, aliases, translations, explanations, examples and drawing abbreviations; it no longer stringifies arbitrary JSON records. Category filtering and the existing 24-card pagination remain unchanged.

## Answer-safe questions

In *Definition → term* questions the displayed definition is copied and any whole-word or whole-phrase occurrence of the English answer is replaced with `_____`. The source vocabulary definition is never modified. Embedded substrings in other words are not masked, and other question types remain unchanged.

## Learner feedback language

Correct/incorrect feedback always shows the English term and its English meaning. Extra translations appear **only** when the learner selected Russian or Vietnamese support in onboarding. English-only learners see neither extra-language explanation. This also applies to drawing callout feedback. Changing the learning path takes effect on the next answer; no learner profile data migration is required.

## Spaced-repetition scoring

A correct practice answer is always counted as an attempt, but **mastery level increases only on a due review**. A correct answer before the next due date leaves both the level and next due date intact. A wrong answer immediately decreases the level and makes the term due for relearning. Existing v3 saved records and portable progress backups remain readable without migration.

Example: answering `duct bank` correctly five times within a few minutes yields five correct attempts, but not five days' worth of spaced review. This avoids false mastery while preserving the existing practice and daily goal statistics.

## Verification

- `scripts/test-learning-quality.mjs`: multilingual search, aliases, answer masking, Russian/Vietnamese/English feedback.
- `scripts/test-learning-state.mjs`: same-day repetition, due-date retention, genuine due-review progression, wrong-answer resetting.
- Full `npm run validate` checks syntax, PWA offline module caching and all existing content/learning contracts.
- Browser regression checks dictionary search and answer feedback across onboarding languages.

No external model, API key, cloud sync or new runtime library is needed.
