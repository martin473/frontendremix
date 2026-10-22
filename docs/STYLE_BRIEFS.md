# Web Design Style Briefs

Oct 22, 2026 · @Sweet

Five briefs for building a site in one style each: Brutalism, Swiss, Bento, Editorial and Retro/Y2K. Every brief uses the same sections, so a developer can compare styles or swap one for another. The style list and positioning come from Vikilinks' [web design styles guide](https://vikilinks.com/blog/web-design-styles). The tokens, rules and checklists are starting values to tune for each brand.

## Applies to every style

- **Accessibility:** body text meets WCAG 2.2 AA contrast (4.5:1, or 3:1 for 24px+ text). Every interactive element shows a visible focus state, and touch targets are at least 44 × 44px.
- **Motion:** all animation sits behind `prefers-reduced-motion`. Nothing essential depends on hover alone.
- **Responsive:** design at 375px first, then 768px, 1280px and 1600px. No horizontal scroll at any width.
- **Tokens first:** colors, type scale, spacing, radius, border and shadow live as CSS custom properties before any component is built.
- **Performance:** LCP under 2.5s on mid-range mobile. Load no more than two web font families, subset them, and use `font-display: swap`.

Each brief covers: **Intent and fit**, **Palette**, **Typography**, **Layout and spacing**, **Components**, **Imagery and motion**, **Avoid**, and **Done when**.

## 1. Brutalism / Neobrutalism

**Intent and fit:** Raw, loud and memorable: the structure is the decoration, and it is meant to be seen. It suits creative studios, bold startups, portfolios and campaigns, but not a clinic or an accountant. Build the neobrutalist variant (flat color, thick black outlines, hard offset shadows) unless the brand asks for full raw HTML brutalism.

**Palette**

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | #000000 | Text, every border, every shadow |
| `--paper` | #FFFDF5 | Page background |
| `--accent-1` | #FFE14D (yellow) | Primary buttons, highlights |
| `--accent-2` | #FF5C5C (red) | Alerts, hover state |
| `--accent-3` | #4D7CFF (blue) | Links, secondary cards |
| `--accent-4` | #7CF29C (green) | Success, tags |

Use no gradients and no opacity tints. Every color is a solid fill, and black text sits on every accent.

**Typography**

- Display: a heavy grotesk such as Archivo Black or Space Grotesk 700, in uppercase for H1–H2 with tight tracking (-0.02em).
- Body and UI: a monospace such as JetBrains Mono or Space Mono at 16–18px with 1.5 line height.
- Scale: 72 / 48 / 32 / 24 / 18 / 14px, with H1 using `clamp(40px, 8vw, 96px)`.

**Layout and spacing**

- Use a visible 12-column grid with a 4px base unit. Sections are separated by 3px rules, not whitespace.
- Allow deliberate asymmetry, such as offset cards and blocks that break the column. Content still reads in a clear single order on mobile.
- Use no border radius anywhere (`--radius: 0`).

**Components**

- **Border:** `3px solid var(--ink)` on cards, inputs, buttons and images.
- **Shadow:** a hard offset `6px 6px 0 var(--ink)` with no blur. Buttons press in on `:active` by translating 4px and shrinking the shadow to 2px.
- **Buttons:** accent fill, uppercase label, 14px × 24px padding.
- **Inputs:** a white field with a 3px border. Focus adds an `--accent-1` background, not a glow.
- **Links:** underlined 2px, and on hover they invert to black background with white text.
- **Marquee/ticker bands** are allowed in the hero or footer only, and must pause on hover and under reduced motion.

**Imagery and motion:** Use high-contrast photography or flat cut-out illustrations framed with the border and shadow. Motion is snappy (100ms, `steps()` or linear) with no easing flourishes.

**Avoid**

- Low-contrast "ironic" color pairs. The article's main warning for this style is usability and accessibility, so loud must still mean legible.
- Hiding navigation or making users hunt for it.
- Mixing in soft shadows, gradients or rounded corners.

**Done when**

- [ ] Every text/background pair passes AA, including on all four accents.
- [ ] Borders and shadows come from tokens, with no one-off values.
- [ ] The mobile layout drops asymmetric offsets and stays in one column with no overflow.
- [ ] The marquee respects `prefers-reduced-motion`.

## 2. Swiss (International Typographic Style)

**Intent and fit:** Objective, precise and trustworthy: the grid and the type carry everything. It suits corporate, finance, B2B and editorial sites. The risk is feeling cold, so give one accent color a real job.

**Palette**

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | #111111 | Text |
| `--paper` | #FFFFFF | Background |
| `--grey` | #E6E6E6 | Rules, secondary surfaces |
| `--muted` | #6B6B6B | Captions, metadata (AA on white) |
| `--accent` | #E30613 (Swiss red) | One job only: primary CTA, active state, key figure |

**Typography**

- One family only: Helvetica Now, Neue Haas Grotesk, or Inter as the free fallback.
- Text is flush left and ragged right, never justified or centered.
- Weight contrast comes from 400 vs 700 only. Display sizes use tracking of -0.03em.
- Scale on a modular 1.333 ratio: 76 / 57 / 43 / 32 / 24 / 18 / 14px.
- Body is 18px with 1.45 line height and a 60–70 character measure.

**Layout and spacing**

- 12-column grid with 24px gutters and an 8px baseline. Every element snaps to columns and baseline.
- Strong verticals: headings may hang in columns 1–3 with body in columns 4–12.
- Use whitespace as structure. Spacing scale: 8 / 16 / 24 / 48 / 96px.
- Thin 1px rules separate sections. No boxes, shadows or radius.

**Components**

- **Buttons:** rectangular with 0 radius. Primary is an `--accent` fill with white text; secondary is a 1px ink outline.
- **Nav:** a text-only horizontal list, with the active item underlined in `--accent`.
- **Data:** tables with hairline rules only, numerals tabular (`font-variant-numeric: tabular-nums`) and right-aligned.
- **Cards:** not used. Group content with grid position and rules instead.

**Imagery and motion:** Use objective photography cropped to grid modules, or flat geometric diagrams. Do not apply filters. Motion is minimal: 150ms opacity or position changes, linear.

**Avoid**

- Centered layouts, decorative fonts, more than one accent, or drop shadows.
- Elements that ignore the grid "just this once."

**Done when**

- [ ] A grid overlay (toggle with a dev key) shows every block aligned at 375, 768 and 1280px.
- [ ] Only one font family loads.
- [ ] Red appears in no more than 3 places per screen.

## 3. Bento grid

**Intent and fit:** Organized, modern and modular. Each feature or stat gets its own tile, and the tiles lock together like a bento box. It suits product pages, SaaS feature sections and dashboards. The main risk is cramming, so each tile makes exactly one point.

**Palette**

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | #F5F5F7 | Page background |
| `--tile` | #FFFFFF | Default tile |
| `--tile-dark` | #1D1D1F | Contrast tile (1–2 per grid) |
| `--text` | #1D1D1F | Text on light tiles |
| `--muted` | #6E6E73 | Supporting text (AA on white) |
| `--accent` | #0071E3 | Links, key numbers, one highlight tile |

Dark mode swaps `--bg` to #000000 and `--tile` to #1C1C1E.

**Typography**

- A neutral sans such as Inter, SF Pro or Geist, weights 400 / 600 / 700.
- Tile title 24–28px/600. Use 56–80px/700 for a hero stat inside a tile, with 1–2 lines of 15–17px supporting copy.
- Never more than about 25 words of body text in one tile.

**Layout and spacing**

- CSS Grid: `grid-template-columns: repeat(4, 1fr)` at desktop, 2 at tablet and 1 at mobile, with a 16px gap (12px on mobile).
- Tiles span 1×1, 2×1, 1×2 or 2×2 cells. Use one 2×2 hero tile per grid and at most 8 tiles per section.
- Use `grid-auto-flow: dense`, but the DOM order must match the reading order.
- Tile padding is 24px (32px for 2×2), with radius 24px (16px on mobile).
- Tiles use `min-height`, never fixed height, so content can grow without overflowing.

**Components**

- **Tile variants:** stat, feature (icon + title + line), media (image or video fills the tile), quote, and CTA.
- **Surface:** no borders. Use a subtle shadow `0 1px 2px rgba(0,0,0,.04)` or none, with separation coming from the gap.
- **Hover:** if a tile is a link, scale it to 1.02 and lift the shadow over 200ms ease-out. The whole tile is the hit area.

**Imagery and motion:** Use product screenshots, 3D renders or cropped UI fragments that bleed off a tile edge. Tiles may fade or slide up 16px as they enter, staggered 60ms.

**Avoid**

- More than 8 tiles per section, or tiles holding paragraphs.
- Equal-size tiles everywhere, which kills the rhythm.
- Fixed heights, which overflow once copy is translated or text is zoomed.

**Done when**

- [ ] Desktop to tablet to mobile reflows without gaps or orphaned tiles.
- [ ] The tab order matches the visual order.
- [ ] Tiles survive 200% text zoom with no clipped content.

## 4. Editorial

**Intent and fit:** Authoritative, literary and crafted: a magazine on the web, with big type and long-form storytelling. It suits publishers, content-led brands and agencies. The risk is slow loading from heavy type and media, so performance is part of the brief.

**Palette**

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | #1A1A1A | Text |
| `--paper` | #FAF7F2 | Background (warm off-white) |
| `--rule` | #D9D3C7 | Hairlines, dividers |
| `--muted` | #5E5A54 | Bylines, captions |
| `--accent` | #B3261E (oxblood) | Kickers, drop caps, pull-quote marks |

**Typography**

- Display: a high-contrast serif such as Playfair Display, Fraunces or GT Super at 64–120px for headlines, set tight (1.0–1.1 line height).
- Body: a text serif such as Source Serif 4 or Newsreader at 19–21px, 1.6 line height, with a 65–72 character measure.
- UI and labels: a small sans (Inter 13–14px) in uppercase for kickers and section labels, tracked +0.08em.
- Details: drop caps on lead paragraphs, old-style numerals in body text, and hanging punctuation where supported.

**Layout and spacing**

- 12-column grid. The article body sits in columns 4–9, while pull quotes, images and sidenotes break out to columns 2–11 or full bleed.
- The homepage uses magazine modules: one lead story at 8 columns beside a stack of 4 columns, then 3-up and 4-up rows.
- Generous vertical rhythm: 32px between paragraphs and blocks, and 96–128px between story sections.
- Separate with hairline `--rule` lines, not cards.

**Components**

- **Story card:** kicker, headline, 1-line dek, byline, and read time.
- **Pull quote:** 32–40px display serif with an `--accent` quote mark, breaking the column.
- **Figure:** full-bleed or breakout image with a caption and credit in `--muted` 14px.
- **Reading UI:** a progress bar and a sticky minimal header that hides on scroll down.
- **Buttons:** text links with an underline offset (`text-underline-offset: 4px`). Use a solid button only for subscribe.

**Imagery and motion:** Use art-directed photography with `<picture>` crops per breakpoint and generous captions. Motion is minimal: images fade in once loaded, and there is no parallax.

**Avoid**

- Loading more than 2 families or 4 weights. Variable fonts count as one file.
- Autoplay video, and layout shift from images that have no `aspect-ratio`.
- Centering long body text.

**Done when**

- [ ] A long article scores LCP under 2.5s and CLS under 0.1 on mobile.
- [ ] The body measure stays at 72 characters or fewer at every width.
- [ ] Every image has width/height or `aspect-ratio` plus alt text.

## 5. Retro / Y2K

**Intent and fit:** Playful, nostalgic and energetic, with chrome, neon, bubbly shapes and early-2000s digital optimism. It suits lifestyle, beauty, youth and music brands. The guide recommends it as an accent on a cleaner base, so build a clean layout first and apply Y2K treatments to heroes, headings and a few signature components.

**Palette**

| Token | Value | Use |
| --- | --- | --- |
| `--base` | #0B0B1A | Dark base background (or #F4F1FF light) |
| `--text` | #FFFFFF | Text on the dark base |
| `--neon-pink` | #FF3DCB | Primary accent, CTAs |
| `--neon-cyan` | #2DF5FF | Secondary accent, links |
| `--lime` | #C6FF3D | Badges, highlights |
| `--chrome` | linear-gradient(180deg, #FFFFFF 0%, #B8C2CC 45%, #5F6B78 50%, #E3E8ED 100%) | Display type, buttons, frames |

Keep neon for accents and glows. Body text stays white on the dark base, or near-black on the light base.

**Typography**

- Display: a wide or bubbly face such as Syne ExtraBold, Monument Extended or Rubik Mono One. Add a chrome fill via `background-clip: text` for H1 only.
- Body: a clean rounded sans such as Nunito or Manrope at 17px, 1.55 line height.
- Optional pixel or bitmap face (Silkscreen) for tiny labels and tags only.

**Layout and spacing**

- Build on a standard 12-column grid with an 8px unit; the layout itself stays tidy.
- Floating decorative elements (stars, orbs, sparkles) are absolutely positioned, `aria-hidden`, and `pointer-events: none`. Keep them off text.
- Use pill radius (999px) for buttons and tags, and 20–28px radius for cards.

**Components**

- **Buttons:** pill shape with a chrome or neon gradient fill, a 1px inner highlight, and a soft neon glow (`0 0 24px` in the accent color) on hover.
- **Cards:** a glassy surface (`rgba(255,255,255,.08)` with `backdrop-filter: blur(16px)`) and a 1px gradient border.
- **Stickers and badges:** rotated -4° to 6°, with a lime or pink fill.
- **Optional retro chrome:** an OS-window frame (title bar plus 3 dots) around one feature or screenshot. Use it once per page.

**Imagery and motion:** Use 3D chrome objects, holographic gradients, film-grain overlays (an SVG noise filter at 6–10% opacity) and lo-fi photo flash. Motion can be bouncy, with springy hovers and slowly drifting stars, but only behind `prefers-reduced-motion`.

**Avoid**

- Neon text on neon backgrounds, or chrome type for anything longer than a headline.
- Treating every element. The guide warns this style can look dated rather than intentional, so pick 3–4 signature moves and stop.
- Decorative layers that cover text or catch clicks.

**Done when**

- [ ] Body text passes AA, and chrome H1s have a solid-color fallback that also passes.
- [ ] Turning off all decoration layers leaves a clean, usable site.
- [ ] Reduced-motion mode stops every looping animation.

## Side by side

| Style | Mood | Best for | Grid / unit | Radius | Border | Shadow | Main risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Brutalism | Raw, loud | Studios, bold startups, portfolios | 12 col / 4px | 0 | 3px black | 6px hard offset | Legibility and accessibility |
| Swiss | Objective, precise | Corporate, finance, B2B | 12 col / 8px baseline | 0 | 1px rules | None | Cold, rigid |
| Bento | Organized, modular | SaaS, product, dashboards | 4 col tiles / 16px gap | 24px | None | Subtle or none | Cramming |
| Editorial | Authoritative, crafted | Publishers, content brands | 12 col / 32px rhythm | 0 | Hairline rules | None | Slow loading |
| Retro / Y2K | Playful, nostalgic | Lifestyle, beauty, music | 12 col / 8px | Pill / 24px | 1px gradient | Neon glow | Looking dated |

## Sources

- [Web design styles](https://vikilinks.com/blog/web-design-styles), Vikilinks: the style list, best-fit industries, moods and main risks. Tokens, type choices and checklists are recommendations added for this brief.
