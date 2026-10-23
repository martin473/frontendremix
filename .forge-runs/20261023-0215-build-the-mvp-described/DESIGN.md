REPLACE ALL 5 STYLES IN FRONTEND REMIX
Replace current assets (flat/material/brutalist/frutiger-aero/claymation) with these 5 new styles based on the design brief below.

1. Brutalism / Neobrutalism
Palette: --ink #000, --paper #FFFDF5, --accent-1 #FFE14D, --accent-2 #FF5C5C, --accent-3 #4D7CFF, --accent-4 #7CF29C
Rules: 3px solid #000 borders, hard offset shadow 6px 6px 0 #000, no radius, monospace body, grotesk display uppercase, 12-col/4px grid, 3px section rules.

2. Swiss / International Typographic Style
Palette: --ink #111, --paper #FFFFFF, --grey #E6E6E6, --muted #6B6B6B, --accent #E30613
Rules: one family only (Helvetica/Inter), flush-left ragged-right, 12-col grid 24px gutters 8px baseline, 1px rules, 0 radius, no cards/shadows.

3. Bento grid
Palette: --bg #F5F5F7, --tile #FFFFFF, --tile-dark #1D1D1F, --text #1D1D1F, --muted #6E6E73, --accent #0071E3
Rules: 4-col tiles, 16px gap (12px mobile), 24px radius, no borders, subtle shadow, dense grid flow, max 8 tiles per section.

4. Editorial
Palette: --ink #1A1A1A, --paper #FAF7F2, --rule #D9D3C7, --muted #5E5A54, --accent #B3261E
Rules: Playfair/GT Super display 64-120px, Source Serif 4 body 19-21px 1.6 line-height, 12-col grid with body in cols 4-9, hairline rules, generous whitespace 32-128px.

5. Retro / Y2K
Palette: --base #0B0B1A (dark) or #F4F1FF (light), --text #FFFFFF, --neon-pink #FF3DCB, --neon-cyan #2DF5FF, --lime #C6FF3D, chrome gradient
Rules: wide bubbly display (Syne/Monument), rounded sans body (Nunito/Manrope), pill radius 999px, glassy surfaces, neon glow, decorative elements aria-hidden.

INSTRUCTION FOR AGENT:
- Read /opt/forge-working/DESIGN_new.md and build on top of existing /opt/forge-working/build/ (manifest v3, background, content/content.js, popup/*.html/css).
- For each style create assets/<style>/ with fonts.css, borders.css, buttons.css, spacing.css, layout.css, icons/*.svg (bundled locally for CORS avoidance).
- Add dropdown to popup selecting 5 styles; extend content script to inject selected style CSS/icons from chrome-extension:// URLs.
- Keep existing font-swap feature (FRX_BG_FETCH_FONT etc) fully intact.
- Make all 5 pass brief rules (AA contrast, reduced-motion, responsive, tokens-first, performance).
- Commit artifacts to github_owner=martin473 github_repo=frontendremix via origin remote at https://github.com/martin473/frontendremix.git.
