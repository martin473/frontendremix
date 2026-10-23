## Files (in build order — logic before markup before styling)

1. `native/frx_fonts_host.py` — native messaging host (copied from `.forge/reference/native/`). Functions: `read_message`, `send_message`, `family_from_sfnt`, `families_from_dfont`, `families_from_file`, `scan_files`, `scan_system_profiler`, `clean`, `main`. Edit: append 4 Linux dirs to `FONT_DIRS`. Speaks stdio JSON framed messages to `popup.js` via `api.runtime.sendNativeMessage("frontend_remix_fonts", …)`.
2. `native/install.sh` — one-time registration script. Edit: usage comment -> `bash ~/frontendremix/src/native/install.sh`. Writes host manifest JSON with `allowed_extensions` = `["frontend-remix@martin473.github.io"]`.
3. `manifest.json` — version `1.2.0`; `browser_specific_settings.gecko.id` = `frontend-remix@martin473.github.io`; add `"nativeMessaging"` to `permissions`; keep both `background.service_worker` and `background.scripts`; all other keys unchanged.
4. `background/background.js` — `ensure()` injects `["content/style-engine.js", "content/content.js"]` (edit `FILES`). Handlers unchanged: `FRX_BG_GET_TAB`, `FRX_BG_FORWARD`, `FRX_BG_FETCH_FONT`; talks to content script by `tabs.sendMessage`.
5. `popup/popup.js` — the logic. Must contain: `detectInstalledFonts`, `loadImportedFonts`, `getSystemFonts` (union of imported + Chrome `queryLocalFonts` + `CANDIDATE_FONTS`, dedupe + case-insensitive sort), `cssFamily`; style handlers `fillStylePicker`, `selectStyle`, `paintStyle` + style change/clear listeners; font-helper group `paintImportToggle`, `saveFontList`, `syncInstalledFonts(cmd)`, `INSTALL_CMD`; perm group `checkPermissions`/`grantPermissions` (`api.permissions.contains`/`.request`); existing `load`, `renderFonts`, `buildItem`, `setStatus`, `bgSend`, `toContent`, `showState`; boot sequence: load imported fonts -> paint toggle -> `syncInstalledFonts("list")` -> `load()` -> `FRX_GET_STYLE` -> permission check. Ids it looks up: `frx-page-title, frx-status, frx-loading, frx-list, frx-empty, frx-reset, frx-refresh, frx-style-picker, frx-style-clear, frx-style-status, frx-import-toggle, frx-import, frx-import-cmd, frx-import-copy, frx-paste-cmd, frx-import-text, frx-import-save, frx-paste-note, frx-import-note, frx-import-retry, frx-perm, frx-perm-grant`.
6. `popup/popup.html` — markup. Add `#frx-loading` and `#frx-empty` inside `<main>`; keep style bar (`#frx-style-picker`, `#frx-style-clear`, `#frx-style-status`); add `#frx-import` setup panel (its parts) and footer `#frx-import-toggle`; add hidden `#frx-perm` box with `#frx-perm-grant`. Every id in popup.js must exist here.
7. `popup/popup.css` — add rules for the import panel, footer, perm box (adapted from reference `.frx-import`/`.frx-footer`), and loading/empty states.

## Message contract

| type | direction | payload | reply |
|---|---|---|---|
| `FRX_BG_GET_TAB` | popup -> bg | `{}` | `{ok:true, tabId, url, title}` or `{ok:false, error}` |
| `FRX_BG_FORWARD` | popup -> bg | `{tabId, payload}` | forwards payload to content, returns its reply |
| `FRX_BG_FETCH_FONT` | popup -> bg | `{url}` | `{ok:true, family, faces}` or `{ok:false, error}` |
| `FRX_SCAN_FONTS` | popup -> content | `{}` | `{ok:true, fonts:[{name,source,count,overridden,overrideSystem,overrideTo}]}` |
| `FRX_APPLY_OVERRIDE` | popup -> content | `{fontName, systemFont|fontUrl}` | `{ok:true, family}` or `{ok:false, error}` |
| `FRX_CLEAR_OVERRIDE` | popup -> content | `{fontName}` | `{ok:true}` |
| `FRX_RESET_ALL` | popup -> content | `{}` | `{ok:true}` |
| `FRX_APPLY_STYLE` | popup -> content | `{style}` | `{ok:true, style, fixed}` or `{ok:false, error}` |
| `FRX_CLEAR_STYLE` | popup -> content | `{}` | `{ok:true, style:""}` |
| `FRX_GET_STYLE` | popup -> content | `{}` | `{ok:true, style}` |
| `FRX_PING` | bg -> content | `{}` | `{ok:true}` |
| native `frontend_remix_fonts` | popup -> host | `{cmd:"list"|"deep"}` | `{ok:true, fonts:[...]}` or `{ok:false, error}` |

## Checklist mapping

1. Native helper shipped -> `native/frx_fonts_host.py` (copy + Linux dirs), `native/install.sh` (copy + usage comment).
2. Manifest -> `manifest.json` (id, nativeMessaging, background both keys, version 1.2.0).
3. Popup markup -> `popup/popup.html` (`#frx-loading`, `#frx-empty`, style bar kept, `#frx-import` panel, `#frx-import-toggle`, `#frx-perm` + `#frx-perm-grant`).
4. Style dropdown -> `popup.js` `fillStylePicker` + `selectStyle` + `paintStyle` + listeners; content `FRX_GET_STYLE`/`FRX_APPLY_STYLE`/`FRX_CLEAR_STYLE`; rescan via `load()`.
5. Every installed font -> `popup.js` `loadImportedFonts` + `syncInstalledFonts` (native `frontend_remix_fonts`, cache `storage.local.frxImportedFonts`) + optional `queryLocalFonts` + `CANDIDATE_FONTS`; `getSystemFonts` union/sort; `paintImportToggle`/`INSTALL_CMD`; every per-font picker uses `getSystemFonts()`.
6. Background re-injection -> `background.js` `FILES` incl. `content/style-engine.js` first.
7. Firefox site access -> `popup.js` `checkPermissions`/`grantPermissions`, `#frx-perm`/`#frx-perm-grant` in `popup.html`, styles in `popup.css`.
8. Font-swap kept working -> existing `load`/`renderFonts`/`buildItem`/override handlers in `popup.js` unchanged in behaviour.

## Out of scope

- No changes to `assets/` (the 5 styles) or `content/style-engine.js`.
- No new content-script message types.
- No old style names / old grid buttons (flat, material, brutalist, frutiger-aero, claymation).
- No rewrite of files already satisfying the checklist (content.js, style-engine.js, assets, icons).
- No new build tooling, no extra features beyond this MVP list.
