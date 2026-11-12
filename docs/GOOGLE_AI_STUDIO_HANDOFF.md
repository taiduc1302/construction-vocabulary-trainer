# Google AI Studio Build handoff and migration gate

Updated: 2026-11-12. Product: **Civil Construction English Trainer**.

## Decision

**Ready to import as a controlled WEB prototype, not ready to replace the production PWA or ship a native mobile app without further work.**

The current release is a static, framework-free HTML/CSS/ES-module PWA hosted on GitHub Pages. Source content lives in JSON. Learning progress and public learner settings are browser-local; there is no user authentication, database, cloud synchronization, or Gemini backend.

Google AI Studio Build supports **Import from GitHub** and web-app generation (React by default, with optional Node.js runtime), as well as a separate native Android Kotlin/Jetpack Compose workflow. Import capability does NOT guarantee the current static files will run unchanged in AI Studio's generated runtime.

Official product documentation:
- https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- https://ai.google.dev/gemini-api/docs/aistudio-android
- https://ai.google.dev/gemini-api/docs/aistudio-deploying

## Non-negotiable source-of-truth rules

1. Keep `main` + current Pages deployment as the production baseline. AI Studio must not push directly to `main`.
2. Use a **separate proof-of-concept repository** or an isolated branch and pull requests. Capture a backup export of progress before testing on real devices.
3. Read `AI_INSTRUCTIONS.md`, `README.md`, `data/term.schema.json`, and every existing validator before restructuring. Treat `npm run validate` as a release gate.
4. Do not alter canonical term IDs, category IDs, learning-pack IDs, drawing labels or metadata semantics; imported learner progress uses those IDs.
5. Preserve the 229 validated vocabulary cards, ten learning packs, their diagrams, EN/RU/VI content, spaced repetition, estimator and drawing challenges, and visual answer-hiding rules.
6. Keep public personal My Words separate from the maintainer repository Focus file. Maintainer Mode is a local UI preference, not authentication.
7. No invented construction standards, live project drawings, company tender data, fake stats, account details, API keys or embedded private documents.
8. Do not introduce Gemini calls simply to render existing, deterministic vocabulary. Adding AI is a separate opt-in feature.

## Proposed path (preferred)

### Stage 0 — Repository baseline and backup

- Start from a SHA that passes the repo's validation workflow.
- Record the baseline SHA, pack/card counts, current release URL and visual screenshots.
- Export learning progress from the app before any user-state experiments.
- Import **via Google AI Studio → Build → Add files (+) → Import from GitHub**, selecting the isolated proof-of-concept code, not the working `main` branch for automatic writes.

### Stage 1 — Web proof of concept

Preserve the current static app first. Do not ask AI Studio to generate a visually appealing but functionally different trainer from a one-line prompt.

If the imported app requires a React/Vite project, migrate in layers:
- Keep `data/*.json` as the canonical content source; expose unchanged data files to the browser.
- Reuse pure, testable logic from `src/learning-state.js`, `src/practice-engine.js`, `src/learner-profile.js`, `src/term-search.js`, and `src/vocab-inbox.js`.
- Wrap existing drawing/term SVG renderers, preserving the quiz answer-hiding contract.
- Recreate Today, Practice, Dictionary, Drawing and Progress screens incrementally.
- Reuse localStorage keys and backward-compatible progress import/export; do NOT silently change the progress data model.
- Preserve dictionary incremental rendering (24 cards initially) and the active-session pack-switch guard.
- Only retire the existing service worker after an equivalent tested offline-cache strategy is in place.

### Stage 2 — UX, mobile and state tests

Verify:
- First-time public onboarding; edit role/focus/language; no GitHub knowledge needed.
- 10 packs with correct term IDs; pack switch does not interrupt an ongoing Quick 10.
- Quick 10 never repeats an eligible target before it has exhausted available terms; special Estimator/Similar Terms questions do not bypass this intent.
- EN/RU/VI, diacritics, abbreviations and aliases resolve; `DB2`, `CB`, `sheet pile`, `шпунт` and Vietnamese examples behave correctly.
- Every canonical term's public link loads, displays the proper diagram, and can be shared.
- Estimator and drawing exercises neither reveal answers in prompts/visuals nor claim project-specific standards.
- My Words is local; repository Focus is maintainer-only.
- Progress/mastery/due dates/streaks survive refresh, offline use, export/import, browser restart and manual device transfer.
- Offline mode is usable after initial installation; online updates do not show stale content.
- Keyboard, touch targets, screen-reader labels, error/empty/loading states, reduced-motion and phone-sized layouts work.
- No personal data or credentials appear in public bundle or console output.

**Do not declare the replacement production-ready merely because the preview renders.** Run the equivalent of `npm run validate` and real browser/device smoke tests against the old application.

### Stage 3 — Optional Gemini feature

Potential first opt-in feature: **Explain this term** for terms not yet in the approved dictionary.

For a web app, perform Gemini API calls **server-side only**, with the key in AI Studio Secrets / a server environment variable; never embed keys in browser bundles. Set usage limits and monitor costs. Do not allow a model response to directly change curated term JSON, learner mastery, or published repository content without human review.

**No backend is required just for existing learning features.** Keeping GitHub Pages remains the simplest low-cost production path until AI features, accounts or cross-device sync justify server hosting.

### Native Android / iOS decision

AI Studio's Android generator creates Kotlin and Jetpack Compose code. That is a **new client implementation**, not a one-click compilation of the web PWA; sharing canonical JSON and expected behaviors is realistic, sharing all UI/runtime JS unchanged is not.

Google AI Studio does not supply an equivalent native iOS generator in the current Android documentation. For iPhone, prioritize the existing installable Safari PWA unless a validated iOS-specific distribution requirement arises.

## Initial Google AI Studio prompt (copy only after importing a protected repo)

> You are working with an existing public open-source application called Civil Construction English Trainer. This is a controlled migration, not a greenfield redesign.
>
> FIRST inspect README.md, AI_INSTRUCTIONS.md, package.json, data/term.schema.json, data/learning-packs.json, the existing src modules and test scripts. Produce a short compatibility map: what can run unchanged, what must be adapted to AI Studio, and what functionality must remain identical. Do not modify files until this map is complete.
>
> Goal: build a clean, accessible, responsive **web** proof of concept using the existing approved vocabulary data and learning logic, keeping the original GitHub Pages app untouched.
>
> Preserve the exact term IDs, 229 vocabulary cards, ten packs, illustrations, RU/VI translations, typed recall, spaced repetition, estimator/drawing challenges, My Words, backup/import and shareable links. Implement incremental dictionary rendering, unseen-question preference and active-session pack-switch protection. The UI should feel like a clear learning product for estimators, coordinators, field staff, engineers and students, not a maintainer dashboard.
>
> Reuse pure JavaScript modules and existing tests where possible. If React is required, migrate one screen at a time and explain any semantic or persistence changes. No direct pushes to production main, no hidden paid services, no browser-exposed API keys, no fabricated data. Keep the app usable without Gemini, authentication or a backend.
>
> Before any deploy, show the validation results and compare the application screen by screen against the current GitHub Pages baseline. Record any untested behavior and ask for review rather than calling it verified.

## Readiness checklist

| Item | Status |
| --- | --- |
| Current static app and content are importable source files | Ready |
| Canonical term/pack IDs, diagrams, data and JS learning logic | Available |
| PWA and local progress export/import | Available in current web version |
| Automated content, learning, PWA, UX and release contracts | Available; must also run for migrated code |
| React/Vite / AI Studio runtime compatibility | **Not yet demonstrated** |
| Google AI Studio project, linked repository and preview | **Not created or verified** |
| iOS/Android real-device and assistive-technology smoke testing | **Still required** |
| Cloud accounts, secure AI API, costs and multi-device sync | **Optional future scope, not implemented** |
| Production replacement approval | **Not granted** |

## Cost and deployment

Stay with the existing Pages deployment until a new runtime genuinely helps. AI Studio Cloud Run publishing may incur costs; Google documentation describes a limited Starter Tier for eligible accounts (up to two services) and standard deployments with billing. Confirm eligibility and cost ceilings before creating paid infrastructure.
