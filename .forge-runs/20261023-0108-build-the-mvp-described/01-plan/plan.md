## Files (in build order - logic before markup before styling)

1. `content/style-engine.js` - Style registry + CSS/icon injection engine. Functions: `CATALOG` (5 styles), `assetUrl(style,rel)`, `addLink`, `applyIcons`, `tagIcons`, `applyStyle(style)`, `clearStyle()`, `getCurrentStyle()`, `valid(style)`. Talks to: `chrome.runtime.getURL` for `assets/<style>/*`; sets `data-frx-style` + `--frx-icon-*` on `<html>`; exposes `window.__frxStyleEngine`.

2. `content/content.js` - Existing font-swap (scan/apply/clear/reset, FontFace-from-bytes) UNCHANGED. Handlers `FRX_APPLY_STYLE` / `FRX_CLEAR_STYLE` / `FRX_GET_STYLE` delegate to `window.__frxStyleEngine`. `FRX_PING` for injection check.

3. `background/background.js` - Message router. `FRX_BG_FORWARD` (ensure content script injected, then forward), `FRX_BG_GET_TAB`, `FRX_BG_FETCH_FONT` (unchanged font download).

4. `popup/popup.html` - Markup: header, `#frx-style-picker` `<select>`, `#frx-style-clear` button, `#frx-style-status` status, font list `#frx-list`, `#frx-refresh`, `#frx-reset`.

5. `popup/popup.js` - Populate picker from `STYLES` catalog; on change send `FRX_APPLY_STYLE`; clear button sends `FRX_CLEAR_STYLE`; on load send `FRX_GET_STYLE` to sync selected value. Keep all existing font override UI logic intact.

6. `popup/popup.css` - Style bar styling; keep existing card/list styles.

7. `manifest.json` - MV3; `web_accessible_resources` exposes `assets/*` for `chrome-extension://` injection.

8. `assets/<style>/{fonts,borders,buttons,spacing,layout}.css` + `assets/<style>/icons/*.svg` for `brutalism`, `swiss`, `bento`, `editorial`, `retro-y2k`. Tokens-first, per brief.

## Message contract

- `FRX_BG_GET_TAB` {} -> `{ok, tabId, url, title}` | `{ok:false, error}`
- `FRX_BG_FORWARD` {tabId, payload} -> content reply or `{ok:false, error}`
- `FRX_BG_FETCH_FONT` {url} -> `{ok, family, faces:[{b64,mime,style,weight,unicodeRange}]}` | `{ok:false,error}`
- `FRX_SCAN_FONTS` {} -> `{ok, fonts:[{key,name,count,source,overridden,overrideTo,overrideSystem}]}`
- `FRX_APPLY_OVERRIDE` {fontName, fontUrl? | systemFont?} -> `{ok, family}` | `{ok:false,error}`
- `FRX_CLEAR_OVERRIDE` {fontName} -> `{ok}`
- `FRX_RESET_ALL` {} -> `{ok}`
- `FRX_APPLY_STYLE` {style} -> `{ok, style}` | `{ok:false,error}`
- `FRX_CLEAR_STYLE` {} -> `{ok, style:''}`
- `FRX_GET_STYLE` {} -> `{ok, style}`
- `FRX_PING` {} -> `{ok}`

## Checklist mapping

- 5 new styles replace old -> `assets/<style>/*.css` + `icons/*.svg` (files 8)
- Per-style fonts/borders/buttons/spacing/layout/icons -> `assets/<style>/` (file 8)
- Dropdown selecting 5 styles -> `popup.html` `#frx-style-picker` + `popup.js` catalog/populate (files 4,5)
- Content script injects selected CSS/icons from chrome-extension:// -> `style-engine.js` `applyStyle`/`addLink`/`applyIcons` (file 1)
- Keep font-swap intact -> `content.js` unchanged font logic; `background.js` `FRX_BG_FETCH_FONT` (files 2,3)
- AA contrast, reduced-motion, responsive, tokens-first -> each style's `fonts.css` tokens + `@media (prefers-reduced-motion)` guards in `buttons.css` (file 8)
- Bundled icons for CORS avoidance -> `assets/<style>/icons/*.svg` via `web_accessible_resources` (files 1,7,8)

## Out of scope

- No new fonts fetch UI changes beyond existing.
- No per-element style overrides, theme editor, or live preview.
- No options page, no sync across tabs, no analytics.
- No new icons beyond arrow/check/close/settings.
- No changes to font detection heuristics.
- No GitHub push from build step.
