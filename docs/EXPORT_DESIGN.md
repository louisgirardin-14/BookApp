# Export design direction

## Objective

The export is for Instagram. Every decision below is in service of that: a
1080×1350 (4:5 portrait) image that reads well as a feed post or Story, holds
up after Instagram's re-compression (no hairline-thin strokes, no text under
~20px at final size), and is worth someone actually posting — which means it
needs to look designed, not generated.

## Aesthetic direction: bookstagram, not fitness-app

Explored and explicitly rejected: a Strava/Duolingo-style gamified look
(streaks, badges, bold stat blocks). What we're building toward instead is
the "bookstagram" mood board look — warm, a little imperfect, poetic:

- **Palette**: warm neutrals (cream, paper) plus one soft accent — dusty
  rose, mustard, sage, terracotta. Reference: the color-swatch mood board
  (mustard/rose/brown/cream) shared in this thread.
- **Typography**: a script/handwritten display face for titles, paired with
  a clean serif for supporting text. Built and then reverted once already
  (`Caveat` + `Playfair Display` via Google Fonts) — worth reviving inside
  the new template system rather than the old raw-canvas one.
- **Motifs**: small decorative touches over stat blocks — a poetic caption
  line instead of a book count, a ribbon/bookmark accent, moon-or-star
  rating marks instead of a plain count.
- **Imperfection**: slightly tilted/staggered photos (scrapbook/polaroid
  framing) read as more "made by a person" than a rigid grid.

## The timeline mechanic

Reference: the "Cameras Timeline" infographic shared in this thread. The
mechanic that makes it work:

- A single connector — not a straight line — winds down the page.
- Entries alternate left/right off the connector, each with a short label
  (here: date) and a small visual (here: a cover thumbnail) on a line
  running off the spine.
- Small filled circles cap the connector's start and end.

Applied to books: each entry is a cover thumbnail + the date finished,
alternating sides down a winding spine, most recent (or first) book at the
top. This is a distinct third export style, not a replacement for Grid or
Spines.

**Connector should be pluggable, not fixed** — different moods call for
different paths:
- `wave` — smooth S-curve (the reference image's style)
- `zigzag` — angular, more graphic/modern
- `straight` — a plain vertical line, for a quieter look

**Known constraint**: a winding timeline with alternating entries only reads
well up to somewhere around 8–10 books before the page gets cramped or the
connector gets too tightly coiled. For ranges with more books than that,
the reasonable options are (a) cap and show the N most recent/significant,
or (b) let the canvas grow taller than the standard Instagram post ratio for
a Story-only export. Not resolved yet — flagging so it doesn't get missed.

## Architecture: moving off raw canvas

### Where we are
`renderExport.ts` hand-draws everything with imperative `CanvasRenderingContext2D`
calls — pixel coordinates, manual text baselines, manual image-fit math. It
works, but nobody who isn't reading TypeScript can change how it looks, and
every new visual idea means more canvas arithmetic.

### Where we're going
Move to a **declarative template + data-binding** model — the same pattern
production apps use for this exact kind of dynamic social image (Spotify
Wrapped, BeReal's recap, Duolingo's year-in-review): the layout is CSS, the
dynamic parts are named slots, and a rendering engine composites the two at
generation time.

Concretely: **Satori**, via Next.js's built-in `next/og` (`ImageResponse`).
No new dependency — it ships with Next.js. A layout is written as JSX with a
constrained but real subset of CSS (flexbox, borders, radius, transforms,
background images, and raw `<svg>` for custom vector work like the winding
connector). It renders server-side and returns a PNG directly.

This buys us three things at once:
1. **A designer can actually touch it.** The layout lives as JSX/CSS, not
   canvas draw calls. Once we have something from a designer (Figma or
   otherwise), translating it into this template is a much smaller step
   than reverse-engineering it into pixel math.
2. **Cover images stop needing the CORS workaround.** The current
   `/api/image-proxy` route exists solely because a browser `<canvas>`
   taints itself on cross-origin pixel reads. Satori renders server-side —
   a plain `fetch` has no such restriction, so book covers can be referenced
   directly regardless of source.
3. **Clean separation of "what it looks like" from "what data it shows."**
   New layouts become new templates, not new draw functions.

### How it fits the existing Export page
The Export page keeps its current UX (pick range/theme/layout, hit
Generate, Save/Share via the native share sheet). For a Satori-based layout,
"Generate" fetches a PNG from a Route Handler instead of drawing to canvas
directly, then paints that image onto the same `<canvas>` element the rest
of the page already treats as the preview/save surface — so Save/Share and
the rest of the page don't need to change.

## Phased plan

1. **(this pass)** Prove the architecture on the new Timeline layout: a
   Satori/`next/og` Route Handler, the winding SVG connector with pluggable
   style, alternating cover+date entries. This is the first template built
   this way.
2. Migrate Grid and Spines onto the same template system and retire the
   raw-canvas renderer entirely, so there's one rendering model, not two.
3. Bring in the designer's actual layout once available; wire book data into
   whatever slots they define.
4. Revisit the bookish decorative touches (handwritten title, poetic
   caption, texture, ribbon/moon motifs) inside the new template system,
   where they're CSS instead of canvas calls.
