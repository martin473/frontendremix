## Files (in build order - logic before markup before styling)

1. content/style-engine.js - style catalog + CSS/icon injection engine. CATALOG holds the 5 new keys (brutalism, swiss, bento, editorial, retro-y2k) with labels; FILES=[fonts.css,borders.css,buttons.css,spacing.css,layout.css]; ICONS=[check,arrow,close,settings]. Functions: valid, assetUrl, rmLinks, rmIcons, addLink, applyIcons, tagIcons, applyStyle (remove the duplicated applyStyle), clearStyle, getCurrentStyle. Exposes window.__frxStyleEngine. Talks to content.js (window global) and assets/<style>/* via api.runtime.getURL.

2. content/content.js - add style message cases: FRX_APPLY_STYLE -> __frxStyleEngine.applyStyle(msg.style); FRX_CLEAR_STYLE -> clearStyle(); FRX_GET_STYLE -> {ok,style}. Keep FRX_SCAN_FONTS, FRX_APPLY_OVERRIDE, FRX_CLEAR_OVERRIDE, FRX_RESET_ALL, FRX_PING untouched (font-swap intact). Talks to background, style-engine.js, popup.

3. background/background.js - unchanged logic: forwards FRX_BG_FORWARD, serves FRX_BG_FETCH_FONT (font-swap), returns FRX_BG_GET_TAB {ok,tabId,url,title}. Talks to popup + content.

4. popup/popup.html - add style bar above font list: select#frx-style-picker (5 options), button#frx-style-clear, div#frx-style-status. Keep existing ids frx-page-title, frx-status, frx-list, frx-reset, frx-refresh.

5. popup/popup.js - add STYLES map (5 keys -> labels); initStylePicker() populates the select and reads FRX_GET_STYLE; handlers applyStyle() sends FRX_APPLY_STYLE, clearStyle() sends FRX_CLEAR_STYLE, both re-call load(). Keep existing font functions (detect, buildItem, bgSend, toContent, load, reset).

6. popup/popup.css - add .frx-style-bar, #frx-style-picker, .frx-btn--style rules only; leave existing font rows unchanged.

7. manifest.json - add web_accessible_resources [{resources:[assets/*], matches:[<all_urls>]}] so extension CSS/icons load in pages; bump version to 1.1.0. Keep permissions/background/content_scripts.

8. assets/<style>/{fonts,borders,buttons,spacing,layout}.css + assets/<style>/icons/{check,arrow,close,settings}.svg for brutalism, swiss, bento, editorial, retro-y2k - tokens-first custom properties per brief palette, AA contrast, prefers-reduced-motion media query, responsive breakpoints, local font stacks via @font-face. Delete old assets/{flat,material,brutalist,frutiger-aero,claymation} if present.

## Message contract

- FRX_BG_GET_TAB (popup -> bg) -> {ok, tabId, url, title} | {ok:false, error}.
- FRX_BG_FORWARD (popup -> bg) {tabId, payload} -> forwards to content, replies with content reply.
- FRX_BG_FETCH_FONT (content -> bg) {url} -> {ok, family, faces:[{b64,mime,style,weight,unicodeRange}]} | {ok:false,error} (font-swap, unchanged).
- FRX_PING (bg -> content) -> {ok:true}.
- FRX_SCAN_FONTS (popup -> content) -> {ok, fonts:[{key,name,count,source,overridden,overrideTo,overrideSystem}]}.
- FRX_APPLY_OVERRIDE (popup -> content) {fontName, fontUrl?|systemFont?} -> {ok, family?} | {ok:false,error}.
- FRX_CLEAR_OVERRIDE (popup -> content) {fontName} -> {ok}.
- FRX_RESET_ALL (popup -> content) -> {ok:true}.
- FRX_APPLY_STYLE (popup -> content) {style} -> {ok, style} | {ok:false,error}.
- FRX_CLEAR_STYLE (popup -> content) -> {ok, style:''}.
- FRX_GET_STYLE (popup -> content) -> {ok, style}.

## Checklist mapping

- Detect all fonts -> content/content.js detectRenderedFonts() (+ collectFontFaceSources).
- Popup with current fonts -> popup/popup.html #frx-list + popup/popup.js renderFonts()/buildItem().
- Accept new font URL -> popup/popup.js buildItem() input + FRX_APPLY_OVERRIDE.
- Inject CSS override -> content/content.js applyOverride()/applySystemFont() -> #__frontend_remix_overrides__ / #__frontend_remix_fontfaces__.
- Rerender live -> content/content.js renderFontFaces() + popup re-load() after apply.
- 5 new style assets -> assets/<style>/* + content/style-engine.js CATALOG/FILES/ICONS.
- Style dropdown -> popup/popup.html #frx-style-picker + popup/popup.js initStylePicker() -> FRX_APPLY_STYLE -> applyStyle().
- Local assets / CORS -> manifest.json web_accessible_resources + assetUrl() via api.runtime.getURL.
- Font-swap intact -> background/background.js fetchFont/FRX_BG_FETCH_FONT untouched; content font handlers untouched.

## Out of scope

- Per-domain persistence of style/font choices (session-only for MVP).
- Theme editor / custom token overrides, dark-mode toggle, per-element overrides.
- Remote font CDN fetching for style assets (all bundled locally).
- Multi-frame / iframe styling, popup redesign, icon-set expansion beyond 4 icons.
- Automated Playwright visual regression, i18n, store listing assets.
