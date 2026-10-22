# Frontend Remix — Style Swap Extension (Design)
Repo: martin473/frontendremix

## Concept
Extend the existing Firefox font-extension to full-page style swaps. User opens any webpage, clicks the toolbar icon (popup), selects one of 5 design styles from a dropdown. The plugin replaces page elements (fonts, borders, buttons, icons, spacing, layout) with locally-bundled assets matching that style. All assets bundled locally to avoid CORS / external-fetch issues.

## 5 Styles
- Flat: clean 2D, solid colors, thin 1px borders, sans-serif (Inter/Helvetica), minimal spacing (8px grid), simple rectangles.
- Material: elevation shadows, rounded 4-8px buttons, ripple-like hover, Roboto/Material font, 16px spacing, floating cards.
- Brutalist: raw, bold borders (3-4px solid black), unpolished typography (system/default bold), high-contrast, no rounded corners, tight 4px grid.
- Frutiger Aero: glossy gradients, rounded 12px buttons, soft shadows, blue/silver tones, Arial/Frutiger-style sans, 12px spacing, glassy icons.
- Claymation: soft 12px rounded everything, muted warm colors, playful thick borders, rounded icon shapes, Comic/soft sans font, 16px loose spacing, slight shadows.

## Local Asset Bundle (per style)
Saved under `assets/<style>/` locally in extension package (no external fetch):
- fonts/ → local WOFF / TTF files and CSS @font-face rules for that style
- borders/ → CSS snippets defining border styles (border-radius, border-width, border-color, border-style)
- buttons/ → CSS snippets for button appearance (padding, background, border-radius, font-weight, hover state)
- icons/ → small SVG icon set for common UI elements (check, arrow, close, settings) in that style
- spacing/ → CSS variables (spacing-unit, gap, margin-base)
- layout/ → layout pattern CSS (grid/flex rules for cards/sections)

Because of CORS/security issues these are embedded in the extension, not fetched at runtime.

## MVP Scope Checklist
- [ ] Design doc written and assets planned (this doc)
- [ ] manifest.json updated with new assets and permissions (if needed)
- [ ] popup.html has dropdown `<select>` with 5 style names
- [ ] content script reads dropdown selection, applies style CSS + replaces icons via injected `<style>` and `<link>` tags using local asset paths (chrome-extension://.../assets/<style>/...)
- [ ] background script listens to popup messages and sends selected style to content script on active tab
- [ ] All 5 style folders created with at least: font CSS, border snippet, button snippet, 3 icon SVGs, spacing variables, layout snippet
- [ ] Build verification passes (manifest valid, files present, JS parses, no empty sources)
- [ ] Commit to github_repo (martin473/frontendremix)

## Message Contract
- popup → background: `{action:"selectStyle", style:"flat"}`
- background → content: `{action:"applyStyle", style:"flat"}`
- content → background: `{action:"styleApplied", style:"flat", changed: true}`

## Out of Scope
- Full page real-time redesign beyond CSS injection / icon swap
- Downloading external assets at runtime (all local)
- User-defined custom styles
- Persisting per-domain preferences (optional later)

## Retain Existing Font Feature
The repo already had a font-detection/replacement feature. Do NOT drop it. The rebuilt extension must still:
- Detect all font-family declarations on the page (computed styles / document.fonts / @font-face)
- Show detected fonts in the popup with a text input for a new font URL
- Inject a CSS override so the new font applies live without page reload
The style-swap feature is ADDED alongside it in the same popup.

## Build Order (create files in this order)
1. manifest.json (v2, permissions: activeTab, storage, <all_urls>)
2. background/background.js (message routing popup -> content)
3. content/content.js (apply style + font swap, inject <style>/<link> from assets/)
4. content/style-engine.js (style catalog: 5 styles, loads assets/<style>/*.css)
5. popup/popup.html + popup/popup.css + popup/popup.js (style dropdown + font list)
6. assets/flat/*, assets/material/*, assets/brutalist/*, assets/frutiger-aero/*, assets/claymation/*
   each containing: fonts.css, borders.css, buttons.css, spacing.css, layout.css, icons/*.svg
