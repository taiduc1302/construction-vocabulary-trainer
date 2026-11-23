# Construction vocabulary concept trees

This feature responds to an actual discovery issue: **suspended slab** is already in the canonical 387-term library, but it can be difficult to spot because the Dictionary renders 24 cards at first and uses a category filter. The new Today links open **Suspended slab** or the broader slab tree directly; typing a Dictionary query resets the previous category filter and puts exact term matches first. Offline PWA cache changes from v24 to v25 so updated dictionary data and tree resources are precached on a successful service-worker update.

## What a tree means

A tree is not an alphabetical list of all `related_terms`. It has **two distinct kinds of relationship**:

1. **Types, load paths and design variations** — nested branches, for example `concrete slab → suspended slab → one-way slab`. The "load path", "system", "installation" or other facet is explicitly labelled on each node. These are curated **learning groups**. A post-tensioned slab can also be two-way; the tree does not assert that classifications are mutually exclusive.
2. **Associated parts, features and work** — a separate section grouped into:
   - Parts, layers and features (reinforcement, slab edge, soffit, metal deck where required);
   - Construction and temporary works (slab formwork, falsework, reshoring, base preparation);
   - Services, interfaces and design checks (embedded conduit, openings, sleeves, cover and connections).

All connections are conditional on what the approved plans and specifications require. For instance: a suspended cast-in-place slab can need temporary forms and reshoring, but these are **not slab subtypes**; a topping slab is not automatically a structural slab; a conduit sleeve is a service passage, not a type of electrical conduit.

## Where to find it

- [Suspended slab](../term.html?term=suspended-slab) — structural types, reinforcement, soffit, formwork/reshoring and MEP coordination
- [Concrete slab](../term.html?term=concrete-slab) — ground-supported vs suspended
- [Footing](../term.html?term=footing) — continuous strip, pad, raft and stepped variations
- [Conduit](../term.html?term=conduit) — raceway types, fittings, bends, sleeves and inspection
- [Topping slab](../term.html?term=topping-slab) — bonded / unbonded methods, finishes, layers

A compact **Explore vocabulary trees** section on Today provides entry points. Any highlighted term/related component is a link to its own page. The page retains all existing translations, examples, diagrams and My Words actions. Unmapped terms still use the original related-term links.

## Data model and maintenance

Edit [`data/term-trees.json`](../data/term-trees.json), not the source JavaScript for each new branch. The model is versioned (`version:1`) with `families` containing:
- `id`, `title`, `root`, `description`;
- `nodes`: `{id,parent,facet}` with an existing vocabulary `id`. The root's parent is `null`. The `facet` is a human-readable distinction like `Ground-supported`, `Load path` or `Column-supported form`. Avoid implying exclusive classifications.
- `connections`: `{owner,id,group,label}`. The `owner` must be one of the family tree's nodes and the target `id` must exist in the vocabulary. The group must be `parts`, `methods` or `coordination`. The short label explains why the concept is associated and whether it is optional.
- `note`: a caution that appears on every rendered term tree.

Curated types are always clickable. Terms that are related *only* as components can also display the family where they belong, making navigation bidirectional. The renderer escapes text and validates IDs, cycles, missing parents, duplicate relationships and invalid groups.

To add a fifth family, extend the JSON with an already-existing canonical root and members; create any missing terms through the established vocabulary workflow first. **Do not** make `related_terms` into automatic parent-child links: that would incorrectly imply a coupling is a type of sewer main, or that shoring is a subtype of slab.

## QA

- `node scripts/test-term-trees.mjs` — 387 terms, four families, all term references, exact search, direct link, hierarchy, group separation, mobile-friendly markup, keyboard access, broken parent, cyclic relationship and stale PWA asset controls.
- `node scripts/test-learning-content.mjs` — the original learning-content suite plus concept-tree regression.
- `npm run validate` — full vocabulary, illustrations and PWA asset validation, including all newly added files.
- Browser smoke test when available: open Today → Suspended slab; tap types; return to Dictionary and enter `suspended slab` with another category selected; verify one exact card; load the same term offline after installing/refreshing the PWA.
- **Physical iPhone/Android installation remains a separate unverified acceptance step**, tracked by the PWA beta issue. CI success is not proof of iPhone Safari rendering.

## Grounding

The classification caveat and distinction between ground-supported and suspended slabs follow [ACI concrete slab terminology](https://www.concrete.org/topicsinconcrete/topicdetail.aspx?search=slab%2C+concrete). Suspended systems, formwork, steel deck and shoring references are in [ACI 302.1R Chapter 5](https://www.concrete.org/Portals/0/Files/PDF/302.1R-15_Chapter5.pdf). Concept trees are learning aids, **not** engineered plans or an authorization to modify slab reinforcement, formwork or conduits.
