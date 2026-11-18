# Google AI Studio → iPhone pilot (web app, not native iOS)

**Status:** preparation complete; Google AI Studio project and physical-iPhone test have **not** been run.  
**Source baseline:** `main` commit `55d22589398cf897fcc2ef40debe75524283b603` (2026-11-18).  
**Production:** https://taiduc1302.github.io/construction-vocabulary-trainer/  
**Canonical corpus:** 331 distinct term IDs across `data/terms.json` and `data/terms-expansion.json`, and 14 learning packs in `data/learning-packs.json`.

## What we are testing

Google AI Studio **Build** can import code from GitHub and build a **web** application, normally with React and an optional Node server. It can create native **Android** projects; it does **not** supply a one-click native iOS application or `.ipa`. For iPhone, the pilot is a **mobile web app** tested in Safari. Later it can be installed as a standalone PWA from a stable HTTPS origin if the service worker and manifest are verified. A shared AI Studio preview URL alone is **not proof** that install/offline mode works.

The current GitHub Pages app already supports `Safari → Share → Add to Home Screen → Open as Web App`. Try that first to establish a real-device baseline; Google AI Studio is an optional parallel UX/platform experiment, not a prerequisite.

Official references:
- https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- https://support.apple.com/en-ca/guide/iphone/iphea86e5236/ios

## Source isolation and import (human Google account required)

1. Keep this repository's `main` and GitHub Pages as the production source of truth. Do **not** connect AI Studio two-way GitHub sync to production `main`.
2. Create an **isolated GitHub copy/repository** for the pilot if AI Studio cannot reliably select a nonproduction branch. Do not import user progress, private client materials or credentials.
3. On a desktop browser open https://aistudio.google.com/ → **Build** → `+` **Add files** → **Import from GitHub**, and select the isolated copy. Do not assume the static HTML will run in the default React preview without adaptation.
4. Run the inspection-first prompt below. Save its compatibility report and file plan in the pilot repository. Do not let the agent throw away existing code or fabricate vocabulary.
5. Recreate/prove one complete vertical slice (onboarding → pack → real diagram → answer → persistence → reload) **before** asking for a visual redesign.
6. Use **Share** for authorized web preview on the same Google account (subject to the sharing settings). For a Home Screen app, host a reviewed static build on an independent HTTPS staging origin, validate installation/offline, and only then consider production. Google Cloud Run is optional and may incur costs; a working web app does not require Gemini API usage or a database.
7. After testing, move changes back as a reviewed PR with actual test evidence, not a direct AI Studio push to `main`.

## Copy/paste into Google AI Studio Build after importing the isolated code

> You are adapting the existing Civil Construction English Trainer, **not** creating a different app.
>
> **Before changing any code**, inspect README.md, AI_INSTRUCTIONS.md, package.json, data/term.schema.json, data/terms.json, data/terms-expansion.json, data/learning-packs.json, docs/GOOGLE_AI_STUDIO_HANDOFF.md, src/learning-state.js, src/progress-backup.js, src/active-session.js, src/practice-engine.js, src/learner-profile.js, src/term-search.js, src/visuals-all.js, src/visual-sequences.js, src/term-page.js, and existing tests. Produce a compatibility matrix: unchanged modules / adapter-needed modules / unsupported features / validation approach. Stop after this matrix; do not modify files until I approve the migration map.
>
> Build an **iPhone Safari-first WEB proof of concept**, not an Android app and not an invented iOS binary. Preserve the existing product name, the canonical **331 unique vocabulary IDs** and **14 pack IDs**, English/Russian/Vietnamese text, quizzes and visual answer-hiding, estimator and drawing exercises, and three construction-sequence diagrams (culvert, trench box, duct bank). Do not change term or pack IDs.
>
> Retain the existing Today, Practice, Dictionary, Drawing, and Progress navigation. Preserve My Words, spaced review, Quick 10 state recovery across reloads, profile persistence and validated JSON backup/import/Undo. Reuse pure ES-module logic and validated artwork instead of regenerating content. Incremental Dictionary rendering and mobile touch targets must be maintained. The application must work **without Gemini, authentication, cloud accounts or a database**.
>
> If React/Vite is required, wrap or adapt one tested feature at a time, documenting every state/storage/API change. Do not expose API keys, use paid cloud services without approval, overwrite the original repository or secretly change the release URL. Do not collect private user data or copy real civil tender documents.
>
> Show `npm run validate` or equivalent regression results, screenshots for 390 px mobile and desktop, and explicit untested items. A working preview is **not** equivalent to a validated iPhone install.

## iPhone test sequence (record device, iOS and build SHA)

First export progress from the existing production app. Browser storage is **origin-specific**: the Pages version and a separately hosted AI Studio pilot will **not automatically share** learning progress, even on the same phone. For imported progress, use a controlled test backup before any personal backup.

- [ ] **Safari baseline:** open production URL, add to Home Screen with **Open as Web App**, launch from icon, check icon, app name, top/bottom safe areas and portrait layout.
- [ ] **Fresh onboarding:** choose role, work area and RU/VI support; verify a real learning pack appears, change selection later.
- [ ] **Pack and review:** run Quick 10, answer four questions, close/restart the app, resume and finish; check results, scoring, nonrepeating targets and session history.
- [ ] **Dictionary:** search `DB2`, `culvert`, `шпунт` and a Vietnamese diacritic; open term details, diagram and related links; use My Words.
- [ ] **Illustrations:** play/pause and keyboard/reduced-motion fallback for culvert, trench box and duct bank; check that quiz images do not expose the answer.
- [ ] **Data safety:** export JSON, import controlled backup, verify profile/learning state, Undo last import. Check isolated/staging storage does not overwrite production.
- [ ] **Offline:** after first successful online launch, enable Airplane Mode; reopen home and dictionary, finish a cached practice question if supported; reconnect and update.
- [ ] **Touch and usability:** check 320–430 px widths, landscape, scroll, speech/audio where available, touch targets, high contrast, VoiceOver if available, error/empty states.
- [ ] **Security and cost:** no secrets in client source/network, no surprise Gemini calls or paid hosting; repository maintainer mode never treated as secure authentication.
- [ ] **Compare with production:** document feature parity, crashes, missing content, exact hosting URL, source SHA, screenshots and release decision.

## Exit criteria

The AI Studio preview can be considered an **iPhone web prototype** only after the above critical paths pass on a physical device. It is **not** a native App Store app. Do not replace the public GitHub Pages release until independent source tests, real-device acceptance, backup safety and rollback are documented.

Owner-controlled external steps (AI Studio login, private project/share URL, iPhone use and screenshots) cannot be asserted as completed by GitHub automation. Record them in the pilot issue when available.
