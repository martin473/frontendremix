## Files (in build order - logic before markup before styling)

1. `manifest.json` - MV3 manifest. Declares service_worker `background/background.js`, content scripts `content/style-engine.js` + `content/content.js` (document_idle, <all_urls>), popup `popup/popup.html`, web_accessible_resources `assets/*` for `<all_urls>`. No handlers; talks to every other file via runtime message types below.

2. `content/style-engine.js` - per-style CSS/icon injector. Exposes `window.__frxStyleEngine = { CATALOG, FILES, ICONS, valid(style), assetUrl(style, rel), applyStyle(style)->Promise, clearStyle()->{ok,style}, getCurrentStyle() }`. CATALOG = brutalism|swiss|bento|editorial|retro-y2k. FILES = fonts,borders,buttons,spacing,layout .css. Fetches `api.runtime.getURL('assets/<style>/<file>')`, injects inline `<style data-frx-style-el>` (falls back to `<link data-frx-style-link>`), preloads `icons/{check,arrow,close,settings}.svg` as `<link data-frx-icon-id>`, sets `--frx-icon-*` vars + `data-frx-style` on `<html>`. Reads manifest web_accessible_resources; talks to popup via `FRX_APPLY_STYLE`/`FRX_CLEAR_STYLE`/`FRX_GET_STYLE`.

3. `content/content.js` - font detection + swap (unchanged feature). scan/detect rendered fonts, FONT_FACE src collection, `applyOverride(name,url)`, `applySystemFont`, `clearOverride`, `resetAll`, message router. Style ids: `__frontend_remix_overrides__`, `__frontend_remix_fontfaces__`; attr `data-frx-<key>`. Delegates style msgs to `window.__frxStyleEngine`.

4. `background/background.js` - service worker. Handles font fetch (`FRX_BG_FETCH_FONT`) with CORS-safe fetch + base64 reply; default style persistence (`chrome.storage`); relays style apply/clear to tab. Message targets: popup + content.

5. `popup/popup.js` - popup controller. Fills `#frx-style-picker` from `__frxStyleEngine.CATALOG`, wires `#frx-style-picker` change -> FRX_APPLY_STYLE, `#frx-style-clear` -> FRX_CLEAR_STYLE, `#frx-refresh` -> FRX_SCAN, `#frx-reset` -> FRX_RESET_ALL; renders `#frx-list` per font row with override/clear buttons; updates `#frx-status`, `#frx-style-status`, `#frx-page-title`.

6. `popup/popup.html` - popup markup. Elements: `#frx-title`, `#frx-page-title`, `#frx-style-picker`, `#frx-style-clear`, `#frx-style-status`, `#frx-refresh`, `#frx-reset`, `#frx-status`, `#frx-list`. Loads `popup.css`, `popup.js`.

7. `popup/popup.css` - popup styling only (toolbar, list, status, style bar). Token-first, AA contrast, reduced-motion.

8. `assets/<style>/{fonts,borders,buttons,spacing,layout}.css` + `assets/<style>/icons/{check,arrow,close,settings}.svg` for each of brutalism, swiss, bento, editorial, retro-y2k - per-style tokens + rules from design brief. Consumed by style-engine.js via extension URLs.

## Message contract

- `FRX_PING` -> `{ok:true}` (content liveness).
- `FRX_SCAN` -> `{ok:true, fonts:[{key,name,count,source,overridden,overrideTo,overrideSystem}]}` (content).
- `FRX_APPLY_FONT` `{fontName,fontUrl}` -> `{ok, error?}` (content).
- `FRX_APPLY_SYSTEM_FONT` `{fontName,systemFont}` -> `{ok, error?}` (content).
- `FRX_CLEAR_OVERRIDE` `{fontName}` -> `{ok}` (content).
- `FRX_RESET_ALL` -> `{ok:true}` (content).
- `FRX_APPLY_STYLE` `{style}` -> `{ok, style}` (content -> style-engine).
- `FRX_CLEAR_STYLE` -> `{ok:true}` (content -> style-engine).
- `FRX_GET_STYLE` -> `{ok:true, style}` (content).
- `FRX_BG_FETCH_FONT` `{url}` -> `{ok, base64, contentType}` or `{ok:false,error}` (background).
- `FRX_SET_DEFAULT_STYLE` `{style}` / `FRX_GET_DEFAULT_STYLE` -> `{ok, style}` (background/storage).

## Checklist mapping

- 5 new styles replace old: `content/style-engine.js` CATALOG + `assets/<style>/*` files (all 5 dirs present).
- Dropdown selecting 5 styles: `popup/popup.html` `#frx-style-picker` + `popup/popup.js` populate/change handler -> FRX_APPLY_STYLE.
- Inject style CSS/icons from chrome-extension:// URLs: `style-engine.js` `assetUrl`+`injectCss`+`applyIcons`+`tagIcons`.
- Keep font-swap intact: `content/content.js` full pipeline + `background/background.js` FRX_BG_FETCH_FONT + popup font list handlers.
- Local bundled assets (no CORS): `assets/<style>/fonts.css` @font-face local files + `manifest.json` web_accessible_resources.
- Per-style tokens/borders/buttons/spacing/layout: 5 CSS files per `assets/<style>/`.
- AA contrast / reduced-motion / responsive / tokens-first: every `assets/<style>/*.css` (tokens in fonts.css/borders.css, `@media (prefers-reduced-motion: reduce)` in buttons.css, responsive in layout.css).
- Commit to github: repo root git origin remote (post-build step, not a source file).

## Out of scope

- No new font providers or remote font downloads beyond existing swap.
- No options page, no sync across tabs beyond storage default.
- No per-element style overrides / CSS export / theme editor.
- No build tooling, bundler, or tests beyond JS parse check.
- No Firefox-specific manifest variants.
- No visual polish beyond one pass; no icon raster assets beyond existing PNGs.
