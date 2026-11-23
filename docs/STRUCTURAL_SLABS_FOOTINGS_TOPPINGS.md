# Structural slabs, strip footings, conduits and toppings — vocabulary expansion

**Added 2026-11-23:** 50 new illustrated EN/RU/VI terms for structural concrete and MEP coordination. Existing `strip-footing`, `conduit`, `concrete-slab`, `rebar`, and `slab-on-grade` remain authoritative vocabulary IDs. In English search, `conduits` maps to `conduit`, `topping` maps to `topping-slab`, and `continuous footing` maps to `strip-footing`.

Two new learning packs:
- **Structural Slabs & Shoring** (`structural-slabs`, 27 terms): structural load paths, suspended slabs, one-way/two-way designs, drop panels, steel decks, temporary support, joints and bar detailing.
- **Toppings & Embedded Services** (`concrete-toppings-and-embeds`, 24 terms): separate topping systems, leveling and finishing, concrete pours, conduits, sleeves and slab openings.
- **Concrete & Foundations** (updated): strip and stepped footings, foundation walls, wall starters, reinforcement and vapour control.

## Technical distinctions learners should remember

| Related words | Practical meaning |
| --- | --- |
| **Suspended slab vs slab on grade** | The first spans between structural supports and carries bending; the latter receives support from prepared ground or a base. |
| **One-way slab vs two-way slab** | Terms describe the intended principal load path and reinforcement arrangement, not merely floor shape. |
| **Flat plate vs flat slab** | A flat plate is generally a constant-depth beamless slab on columns; a flat slab may use drop panels and/or column capitals. Use actual structural details. |
| **Metal deck vs composite slab** | Metal deck may be formwork only or participate in composite action. Composite behavior must be specified and engineered. |
| **Topping slab vs structural slab** | A topping is an additional course. It is not automatically load-bearing. Bonded and unbonded toppings have different interface and detail requirements. |
| **Floor screed vs screeding** | Floor screed refers to a placed leveling course; screeding is the operation of striking fresh material to level. |
| **Rebar chair vs concrete cover** | The chair physically supports bars; cover is the required distance from outer concrete face to the nearest reinforcing steel. |
| **Construction joint vs cold joint vs pour strip** | A construction joint is intentionally planned; a cold joint occurs after an unplanned delay that prevents normal merging; a pour/closure strip is an intentionally left gap to be filled later. |
| **Embedded conduit vs conduit sleeve vs penetration** | The first is a protective electrical raceway cast into concrete, the second forms a passage for a raceway, and the third is an opening through the concrete element. |
| **Footing vs strip footing vs stepped footing** | Footing is the general base; strip footing is continuous beneath a wall or line of supports; stepped footing changes bearing level along its run. |

## Estimating and coordination checklist

1. **Read structural plans and sections together:** distinguish top of slab (TOS), soffit/underside (if specified), slab thickness, drop panels, slab depressions and grade changes. Do not assume a typical section covers every bay.
2. **Quantities:** take off structural slab and topping separately; reconcile overlapping area/volume and additional concrete at thickening or beams. Check the tender's measurement rules before using area, thickness or volume.
3. **Foundation package:** separate footing excavation, bearing preparation, continuous and stepped footings, wall starter bars, formwork faces, keyways and any under-slab insulation or vapour membrane shown.
4. **MEP coordination:** review approved shop drawings and structural openings for embedded conduits, sleeves, floor boxes, blockouts, pipe penetrations and their routes before concrete. Confirm cover, spacing, reinforcement conflicts and inspection requirements.
5. **Temporary works:** price slab formwork, shoring/falsework and reshoring only as required by approved sequence and engineered capacity. A permanent steel deck may not eliminate all temporary propping.
6. **Topping and finishing:** identify bonded or unbonded interfaces, substrate preparation, separators, screed thickness, machine or broom finish, joint detailing and curing; do not equate floor screed with structural topping.
7. **Project-specific restrictions:** drilling/coring PT slabs, cutting rebar, large conduit bundles and slab openings require appropriate engineering review. The educational diagrams are **not** approved construction details.

## Provenance and quality

Terminology cross-checked against the American Concrete Institute and technical industry references. No upstream drawings or proprietary content copied; the SVGs in this repo are simplified original teaching schematics.

- [ACI — Concrete Slab](https://www.concrete.org/topicsinconcrete/topicdetail.aspx?search=slab%2C+concrete), distinguishing supported slabs and slab-on-ground.
- [ACI — Suspended slabs, ACI 302.1R-15 §5.3](https://www.concrete.org/Portals/0/Files/PDF/302.1R-15_Chapter5.pdf) for framing, reinforcement, deck, shoring, joints and tolerances.
- [ACI — Concrete terminology](https://www.concrete.org/portals/0/files/pdf/ACI_Concrete_Terminology.pdf).
- [ACI — Contraction/isolation/expansion/construction/cold joint distinctions](https://www.concrete.org/frequentlyaskedquestions/faqid/864.aspx).
- [ACI — Footing families](https://www.concrete.org/frequentlyaskedquestions.aspx?faqid=885).
- [IIBEC — Bonded and unbonded topping considerations](https://iibec.org/publication-post/key-design-considerations-for-concrete-topping-slabs-in-split-slab-construction/).

## Implementation and QA

Each of the 50 new IDs has a dedicated SVG entry in `src/visuals-extra.js`, with the existing quiz-safe mode stripping labels. Language translations, construction examples, related links and search aliases are stored in the existing JSON schema. `scripts/test-structural-vocabulary.mjs` checks this group and is reached by the existing learning-content validation workflow. No new GitHub Actions workflow, production service-worker logic or PWA runtime dependency is introduced by the terminology update.
