# Reproducible promotional visuals

This is a **build-time** illustration generator, not a website feature. It draws from the project's real `data/terms.json`, the actual `src/visuals-all.js` SVG renderer and `src/styles.css` technical-diagram rules. No user profiles, progress, external AI APIs, web requests or proprietary project drawings are accessed.

The initial illustrations are **not screenshots**: the browser window is a vector recreation of the real app's Dictionary visual card, labelled as illustrative in the SVG description. No results, metrics, testimonials or app-store availability are fabricated.

## Generate / check

From repository root, with Node 22+:

```sh
node tools/promo/generate.mjs
node tools/promo/generate.mjs --check
node tools/promo/test.mjs
node tools/promo/generate.mjs --dry-run
```

The single source of truth is [`tools/promo/promo.config.json`](../tools/promo/promo.config.json). Current targets:

| Target | Output | Pixels |
| --- | --- | --- |
| README illustration | `assets/promo/readme.svg` | 1600 x 780 |
| Open Graph | `assets/promo/og.svg` | 1200 x 630 |
| LinkedIn landscape | `assets/promo/linkedin.svg` | 1200 x 627 |
| Instagram portrait | `assets/promo/instagram-portrait.svg` | 1080 x 1350 |

Assets are deterministic. Changing the featured term, its canonical visual, branding text or source CSS requires regenerating the assets and reviewing the resulting diff. `npm run validate` includes the promo tests through the existing lightweight delivery validator; there is no new recurring Actions workflow or browser dependency.

## Published social preview (Issue #24 P1)

- The reviewed, generated PNG is committed at [`assets/promo/og.png`](../assets/promo/og.png) (1200 × 630, optimized under 100 KB).
- Both the public main page and generic term-page template now publish absolute HTTPS `og:image`, Open Graph metadata and Twitter large-image card tags. The public `term.html` page uses generic share metadata because a social crawler cannot run JavaScript to resolve each `?term=` query; do not claim per-term previews.
- `scripts/test-social-preview.mjs` validates both HTML heads, exact PNG signature and pixel dimensions, size budget and service-worker separation. It is included in `npm test` and `npm run validate`.
- This is an **illustration**, not a real screenshot; it contains only public, source-derived terminology and an SVG technical diagram. It contains no learner profiles, progress or client drawings.
- Repository-level GitHub **Social preview** is configured in GitHub repository settings and cannot be set by HTML metadata alone. A repository maintainer must upload the same PNG there if a repository-card preview is desired. Site link preview varies by social-platform cache; manually request re-scraping where necessary.
- To regenerate a new PNG after source/design changes, use `node tools/promo/generate.mjs --png` with the optional local Sharp dependency, verify appearance, and commit the reviewed `assets/promo/og.png`. Image rendering is deliberately not part of every CI run.

### PNGs for social posts

Actual social platforms generally need **PNG/JPEG**, not SVG. These repo SVGs are editable masters and README-friendly artwork; **do not set `og:image` to the SVG**. Install the optional build-only encoder, then export PNGs at the exact dimensions:

```sh
npm install --no-save --prefix tools/promo sharp@0.34.5
node tools/promo/generate.mjs --png
```

This emits the four PNGs alongside the SVGs; validate visual quality and copy before using the PNGs in a social post or uploading a 1200x630 PNG to the GitHub repository's **Social preview** settings. The reviewed 1200x630 OG PNG is already deployed with social meta tags. The optional remaining PNG variants are manual authoring outputs and are not required by the site's service worker.

### Optional real-app screenshot

For an actual UI capture, start the static app locally, then use a **new isolated browser context** to avoid any personal learner data:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
# in a separate terminal
npm install --no-save --prefix tools/promo playwright-core@1.56.1
node tools/promo/capture.mjs --url http://127.0.0.1:4173/
node tools/promo/generate.mjs --screenshot tools/promo/screenshots/dictionary.png --out tools/promo/out
node tools/promo/generate.mjs --screenshot tools/promo/screenshots/dictionary.png --out tools/promo/out --png
```

- `capture.mjs` accepts only localhost and writes only to the Git-ignored `tools/promo/screenshots/` directory.
- `generate.mjs` refuses to place embedded screenshot designs into the tracked `assets/promo/` by default. Keep optional screenshot outputs in `tools/promo/out/` or a separate local folder.
- Scrutinize screenshots for private names, balance/account information, client drawings, browser tabs and project identifiers even when using an isolated browser.
- Never commit the personal screenshot or generated image with embedded personal data. `screenshots/` and `out/` are ignored by Git.

## Provenance and licensing

This is **original implementation**, inspired by the config-driven, exact-dimension workflow of [ChanMeng666/chanmeng-app-promo-studio](https://github.com/ChanMeng666/chanmeng-app-promo-studio). We did **not** copy its source code, templates, fonts, presets, logos or sample screenshots. All text and geometry shown are derived from this repository's project assets and canonical vocabulary. That upstream's code is MIT licensed; future verbatim/adapted code reuse requires preserving its MIT copyright and licence notices.

No React, Next.js, Sharp, Playwright, font files or video renderers are added to the **runtime**. Optional build tools live only in the local authoring workflow.

Completed subsequent work under [Issue #24](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/24): the animated, source-backed README card and opt-in educational animations with `prefers-reduced-motion` and quiz-safe static fallbacks are now on `main`.
