# Pipes, precast structures and utility castings — field and estimating vocabulary

**Scope added on 2026-11-27:** 129 new terms, including a canonical generic **pipe** entry, across materials, pipe geometry, fittings, construction, testing, factory-made precast concrete units and metal castings. The previous 387 terms remain unchanged; the dictionary now contains **516** terms.

This topic intentionally distinguishes the following procurement items:

- **Pipes:** linear products, material / strength class, effective lay length, diameter, pipe bells, gaskets and fittings.
- **Precast concrete:** manufactured manhole bases, risers, cones, flat tops, grade rings, catch basin boxes, vaults, culverts, headwalls and special factory openings.
- **Utility castings:** typically metal **frames, manhole covers and catch basin grates**, ordered to the specified type, opening, traffic load class, material and finished elevation. These are *not* the same item as a precast manhole or box.

## Crown, obvert and invert — the important pipe geometry

### A simplified circular pipe section

```
               Finished ground / road
  --------------------------------------------------
                      |  cover
                      v
                .-------------.
             .-'  OUTSIDE TOP '-.  <-- TOP OF PIPE
            /    .--------- .    \
           |     |  OBVERT  |     | <-- INSIDE TOP (CROWN)
           |-----+----CL----+-----| <-- SPRINGLINE / CENTRELINE
           |     |  INVERT  |     | <-- INSIDE BOTTOM (FLOWLINE)
            \    '---------'    /
             '-._____________.-'    <-- BOTTOM OF PIPE (OUTSIDE)
```

The ASCII schematic is conceptual; term cards include actual SVG cross-sections. In this vocabulary the **pipe crown** is described as the **top inside of the pipe**, also called **obvert** in sewer / civil design. The **invert** is the bottom inside. *Top of pipe* and *bottom of pipe* refer to exterior surfaces. Because some specifications use "crown" differently, the dimensions and drawing legend have priority when deciding whether an elevation denotes the inner or outer surface.

### Helpful calculations (circular pipe of uniform wall thickness)

```text
Obvert / inner crown elevation = Invert elevation + Actual inside diameter
Top-of-pipe elevation          = Obvert elevation + Wall thickness
Bottom-of-pipe elevation       = Invert elevation - Wall thickness
Pipe centreline elevation      = Invert elevation + (Actual inside diameter / 2)
Cover depth                    = Finished grade elevation - Top-of-pipe elevation
Slope (%)                      = (Upstream invert - Downstream invert) / horizontal run × 100
```

Use **actual product inside diameter and wall thickness**, not an assumed nominal diameter. Crossings between two pipes require the minimum **clearance between the two exterior surfaces**, not just their centrelines. Concrete pipe bell profiles may locally increase outside dimensions and require clearance review.

### Example

Assume an approved typical circular pipe section with **invert 100.00 m**, **actual inside diameter 300 mm**, **wall 40 mm**, **finished grade 101.20 m**:

- **Obvert / inner crown = 100.30 m**.
- **Top of pipe = 100.34 m** (exterior).
- **Bottom of pipe = 99.96 m** (exterior).
- **Centreline elevation = 100.15 m**.
- **Cover = 0.86 m** to the exterior top, at that cross-section.

These are illustrations only; they are not an approved manufacturer's wall profile. For many pipe systems the wall profile, liner, socket or shape is not uniform; use actual dimensions and the project-defined reference elevations.

## Six new practice packs

1. **Pipes: Materials & Sizes** — RCP, PVC SDR 28 / SDR 35, DIP, HDPE, nominal/actual dimensions and pipe classes.
2. **Pipes: Crown, Invert & Embedment** — obvert, flowline, springline, cover, trench haunch, embedment, grade and upstream/downstream inverts.
3. **Pipe Joints & Fittings** — bell/spigot, joint gaskets, coupling, fusion, flange, restrained joints, adapters, tees, bends and casing.
4. **Pipe Installation & QA** — open trench, trenchless methods, laser, lowering, cut lengths, CCTV, pressure, leakage and deflection tests.
5. **Precast Manholes & Drainage** — base, risers, cones, flat-top, grade rings, catch basin box, vault, culvert, seals, cored openings.
6. **Castings: Frames, Covers & Grates** — manhole frame and cover, cast-iron / ductile-iron castings, grates, curb inlets and grade adjustment.

The existing **Underground Utilities** pack also includes the key new anchor terms. All new terms have English definitions, RU explanation, RU and VI translations, example, a separate original educational SVG, warning, related-term links and English search aliases. Search aliases recognize **obvert**, **crown overt**, **RCP**, **DIP**, **SDR35**, **MH frame and cover**, **precast MH** and **castings**.

## Four new typed concept trees

The existing **term-tree** model is used rather than a new diagram framework:

- **Pipes: services and materials** — gravity/pressure, concrete/PVC/HDPE/DIP and related joint/fitting families. These classification axes **can overlap**.
- **Pipe section: obvert, invert and elevations** — the pipe itself is the root; crown, invert, top of pipe, springline, inside/outside dimensions and covers are **parts and measurement references**, not imaginary subtypes.
- **Precast structures: pieces and assemblies** — precast manhole, catch basin, vault and box culvert; base/riser/cone or outlet components separated from installation operations.
- **Utility castings: frames, lids and grates** — cast iron/ductile iron, cover assemblies and grate types; grade-adjustment tasks kept separate from casting types.

## Estimating reminders

Before pricing a pipe / precast installation, check:

1. Pipe material, **class**, diameter, invert, slope, specified **effective lay length**, joint system and pipe support / bedding detail. Separate linear metres from factory section counts, cut pipe, fittings and joint materials.
2. Excavation quantities, shoring / trench box, dewatering, bedding, haunching, pipe zone / protective backfill and general backfill with actual trench geometry and pay-item inclusions.
3. Tie-ins, bends, couplings, field coring and flexible manhole connections. Distinguish **Saddle Connection / Wye Fitting**, approved transition couplings and material / outside-diameter compatibility.
4. Precast units by type, internal diameter, total depth, **actual riser heights**, cone vs flat top, grade rings, approved access/steps, pipe opening elevations, benching and sump depth.
5. Precast delivery, unloading, engineered lifting inserts and clutches, lifting equipment / reach, bedding and **joint sealing**. Verify exactly what the supplier quote includes.
6. **Castings**: whether the bid unit includes the frame, cover / grate and adjustment rings. Match exact curb inlet type, load rating, rim grade, lock/watertight requirements and traffic-control / asphalt restoration.
7. Tests and owner inspection: air/water leakage, hydrostatic pressure, pipe deflection, CCTV, disinfection / sampling and as-built surveys as applicable. Never apply one acceptance method to every pipe type.

Avoid assuming the precast supplier includes castings, or that a manhole casting includes the precast riser. Likewise, **grey cast iron casting**, **ductile iron casting**, and **ductile iron pipe** are different deliverables.

## Reference points

- Municipal **MMCD** specifications and standard details used in British Columbia: the issued owner supplements and contract drawings control accepted materials, installation and testing requirements.
- [ASTM C76/C76M](https://www.astm.org/c0076_c0076m-24.html): reinforced concrete culvert, storm drain and sewer pipe — RCP product standard (edition must be confirmed for the project).
- [ASTM C478/C478M](https://www.astm.org/c0478_c0478m-22a.html): circular precast reinforced concrete manhole sections — reference only; use owner-approved editions.
- [CSA Group](https://www.csagroup.org/): Canadian pipe material and installation standards, where specified.
- [American Concrete Pipe Association](https://www.concretepipe.org/): technical resources for concrete pipe and precast drainage systems.

This is a language and takeoff learning aid, **not** approved design, lifting, pressure-test, confined-space or excavation instructions. Confirm latest project specifications, product approvals and engineering requirements.
