# Animated README walkthrough

This original, self-contained SVG visual is generated from canonical Construction Vocabulary Trainer data and source drawings. It borrows the *workflow idea* of an information-rich, animated README product card from [ChanMeng666's SVG Animation Studio](https://github.com/ChanMeng666/chanmeng-svg-animation-studio), but **copies none of its templates, art, helper code or fonts**.

## Regenerate and verify

Requires Node.js 22 (no npm install). From the repository root:

```sh
node scripts/build-readme-demo.mjs
node scripts/test-readme-demo.mjs
```

`npm test` and `npm run validate` include the same tests. The `--check` mode refuses stale checked-in SVGs.

## What it shows

1. **Duct Bank / Electrical** — actual pack title and term count from `data/learning-packs.json`.
2. **duct bank** — the actual `duct-bank` diagram geometry and technical CSS from `src/visuals.js` / `src/styles.css`. The term exists in this pack.
3. **Start Smart 10** — real application entry point from `index.html`; no fake completion, accuracy or progress numbers.

The entire illustration is a schematic demonstration, **not an actual screenshot**. It never uses localStorage, personal learner data, site account information, client drawings or cloud APIs.

## Github compatibility and accessibility

- Single SVG image (<300 KB), inline shapes and CSS only; no script, `foreignObject`, base64 photo, external fetch or externally loaded font.
- CSS `@keyframes` highlights successive stages; every stage is fully visible when animations are unsupported. A `prefers-reduced-motion: reduce` rule disables motion and leaves all content visible.
- Explicit SVG `<title>`, `<desc>`, `role="img"` and descriptive parent README `alt`. Vector text uses widely available system-font fallbacks; fonts may vary between viewers.
- Images embedded using `<img>` in GitHub are sandboxed. The SVG must be visually checked in the live README for layout and motion. A link to `assets/promo/readme.svg` is retained as a purely static illustration.

## Visual QA / future updates

- Check at desktop and narrow viewport widths for legibility and clipping. The generated SVG has a 1500 x 480 viewBox.
- Capture one frame in each of the 3 phases as well as a screenshot with reduced-motion emulation; do not accept only source/regex checks as visual evidence.
- Rebuild when learning pack content, copy, diagram classes or original drawing geometry changes; the automated check will reject stale generated data.
- The animation is **documentation-only**. Do not import it into the offline PWA runtime or into quiz answer visuals.

References: [Issue #24](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/24).
