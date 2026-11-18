# Construction sequence learning diagrams

Three intentionally simplified, learner-controlled illustrations are available in the **Dictionary** and the public term pages: [culvert](../term.html?term=culvert), [duct bank](../term.html?term=duct-bank), and [trench box](../term.html?term=trench-box).

## Purpose and safety

These illustrations show conceptual construction stages. They are **not engineered designs, takeoff instructions, excavation safety procedures or a substitute for approved project documents**.

- Culvert: crossing preparation, bedding/barrel, backfill/road restoration, and water-flow path.
- Duct bank: trench, conduit placement/spacers, concrete encasement, and backfill.
- Trench box: excavation, shield placement, working within shield, safety controls. **A shield does not necessarily shore trench walls.**
- Before field use, verify safety procedures, site-specific specifications, quantities and drawings. Do not infer dimensions or technical approvals from 320×180 schematic SVGs.

## Architecture

`src/visual-sequences.js` owns the data, instructional copy, SVG stages and opt-in controls. `src/visual-sequences.css` owns progressive stage reveal and reduced-motion behavior. Both are imported only on the index Dictionary and public term pages.

A sequence begins at step 1, and advances on Play, Next step or Replay. Play advances automatically every 2 seconds; Pause suspends progression. On devices requesting reduced motion, Play shows the completed static stage immediately and Next step remains available for deliberate step-by-step navigation. Removed cards stop their timers at the next tick. No remote assets, account tracking, or backend are involved.

The regular `renderTermVisual(term,{quiz:true})` remains **static and answer-safe**. Never import or insert `renderConstructionSequence` in quiz markup. Do not add explanatory stage labels to quiz diagrams before the answer is submitted.

## Regression criteria

Run `npm run validate`, which now includes `scripts/test-visual-sequences.mjs`:

- Three canonical term IDs and four accurate instructional stages each
- SVG stage groups and explicit cautions
- Keyboard-usable native buttons, `role="status"` and `aria-live`
- Pause/Replay/Next; CSS reduced motion; PWA offline dependency coverage
- Static quiz diagram remains free of new stage clues and SVG text labels

Verify desktop and 390px mobile rendering, light/dark, on-demand playback, step changes and pause/resume using the browser regression script before merge.

Implementation is original and uses no source, graphics, fonts or runtime libraries from external animation tools. The design approach was informed by [ChanMeng666's SVG Animation Studio](https://github.com/ChanMeng666/chanmeng-svg-animation-studio). See [Issue #24](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/24).
