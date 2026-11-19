# UX and accessibility audit — 2026-11-18

## Scope and source provenance

- Baseline: `main` at `d7b1a23bbe7a47e84bb1a4095cd7a1e1532cc35d`; no open PRs were observed.
- Repository rules: `AI_INSTRUCTIONS.md` was reviewed. Stable vocabulary IDs, content, spaced repetition, session persistence, and quiz-selection rules are untouched.
- Related outstanding release tasks: [#31](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/31) and [#33](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/33). They remain unresolved.
- Design ideas only, **read-only**: `taiduc1302/design-reference-library` (semantic tokens, responsive states and focus indicators). No modifications to the reference repository.
- Investigated `ChanMeng666/a11y-loop` v0.4.1. Its top-level license is **MIT**; dependencies include `playwright@1.64.1`, `@axe-core/playwright@4.14.0`, `axe-core@4.14.0`, `culori@^4.0.2`, `tabbable@^6.5.0`, with optional MCP SDK and Zod peers. No code or dependencies from it were installed, copied or vendored. Used its multi-state review method only.

## Source-verified UX/a11y findings and changes

| Confirmed source-level defect | Proposed change in this PR |
| --- | --- |
| Progress-import input had `display:none`, preventing ordinary keyboard reachability | Keep input in focus order using visually-hidden technique; outline its visible label on keyboard focus |
| Onboarding advertises `aria-modal=true` without focus management | Initial heading focus, inert background, Tab/Shift+Tab containment, Escape/Close, and return focus |
| Translucent focus outline lacks a reliable high-contrast indication; links not covered | Opaque focus outline including links, skip links for both pages, dark/forced-colors visibility |
| A failed app-data fetch appended a message at body end | Inline polite loading state, alert on error, and retry control; equivalent recoverable term-page failure |
| New answer feedback dynamically appeared without an announced status | Polite atomic live regions for choice, typed, and drawing answers; semantic question headings |
| Dictionary's no-match message already existed | Preserve existing behavior; add executable browser assertion |

This does not claim a completed WCAG audit or verified assistive-technology compatibility.

## Reproducible offline QA

No GitHub Actions invocation or external package installation is required by these scripts.

1. From a complete **trusted local checkout** run `node scripts/test-accessibility-contract.mjs`.
2. Run `npm test` and `npm run validate`. The new dependency-free source contract runs as part of both.
3. Start a local HTTP server with `python3 -m http.server 4173 --bind 127.0.0.1`. In another shell run `npm run test:a11y-browser`, with Playwright already installed in a trusted test environment. It saves evidence to `audit-logs/a11y/`.
4. Run the existing `node scripts/regression-browser.mjs` against the same local server, including session, backup, visual, multilingual lookup, mobile and offline PWA scenarios.
5. Review screenshots and the keyboard flow manually. Screen reader (VoiceOver/TalkBack), iPhone/Android installation and Windows hardware checks are separate release gates.

## QA status at time of PR creation

| Gate | Status | Evidence / limits |
| --- | --- | --- |
| Current main, open PRs, project rules and upstream license | **Inspected** | GitHub connector responses, baseline commit |
| Source-level defects | **Inspected** | Exact DOM/CSS/JS behavior in baseline |
| Isolated code changes | **Committed** | Branch diff; no modifications to main |
| Offline source contract | **Added, not yet executed on complete checkout** | `scripts/test-accessibility-contract.mjs` |
| Full app regression and `npm run validate` | **NOT RUN** | No complete local checkout available in this session |
| Headless Chromium (320 px, keyboard, forced colors, dark, reduced motion, loading/error/empty) | **NOT RUN** | Script added; screenshots/results not yet generated |
| Screen reader / real Windows, iPhone and Android | **NOT RUN** | Device/manual evidence is required |

## Merge gate

Keep this PR **draft**. Before merging: execute full offline validations and both browser runners; examine resulting screenshots at 320 px, forced colors and dark mode; perform manual keyboard walkthrough of focus handling, import, error and empty states; record unresolved assistive-technology and device checks honestly. No automated merge or GitHub Actions are authorized by this audit. A clean browser audit alone is not an engineering claim of WCAG conformance.
