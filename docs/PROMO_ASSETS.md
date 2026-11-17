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

### PNGs for social posts

Actual social platforms generally need **PNG/JPEG**, not SVG. These repo SVGs are editable masters and README-friendly artwork; **do not set `og:image` to the SVG**. Install the optional build-only encoder, then export PNGs at the exact dimensions:

```sh
npm install --no-save --prefix tools/promo sharp@0.34.5
node tools/promo/generate.mjs --png
```

This emits the four PNGs alongside the SVGs; validate visual quality and copy before using the PNGs in a social post or uploading a 1200x630 PNG to the GitHub repository's **Social preview** settings. The current PR doesn't change the production website's metadata, and the PNGs are not required by the site's service worker. If a PNG should be deployed, add that reviewed file to version control in a separate change and update the social meta tags.

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

Next planned steps under [Issue #24](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/24): animated self-contained README card, followed by opt-in educational animations with `prefers-reduced-motion` and quiz-safe static fallbacks.
