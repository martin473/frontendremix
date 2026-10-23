VERDICT: MVP_COMPLETE

# Evaluation — Frontend Remix popup (round 1, eval)

Evaluated `build/` against `.forge/DESIGN.md` and `.forge/PLAN.md`. All 8 MVP checklist items are implemented and the design doc's "How to verify" commands all pass.

## Verification results

| Check | Result |
|---|---|
| `ls -la` / file count | 56 files (excludes `.forge`) — matches expected |
| `node --check` on all 4 JS files | PASS (background.js, content.js, style-engine.js, popup.js) |
| manifest valid JSON | PASS — name `Frontend Remix`, version `1.2.0` |
| manifest gecko id | PASS — `frontend-remix@martin473.github.io` |
| manifest `nativeMessaging` perm | PASS — `["activeTab","scripting","storage","nativeMessaging"]` |
| manifest background both keys | PASS — `service_worker` + `scripts` both present |
| popup ids present | PASS — "all 22 ids present" |
| native helper answers | PASS — `{"ok": true, "fonts": ["DejaVu Sans", "DejaVu Sans Mono", "DejaVu Serif"]}` |
| `cmp native/install.sh` diff | PASS — differs only in the usage comment line |
| old style names grep | PASS — no `flat`/`material`/`frutiger`/`claymation` anywhere |
| `style-engine.js` in `ensure()` | PASS — `FILES = ["content/style-engine.js", "content/content.js"]` |
| automated build checks | 5/5 PASS (files_written, manifest_json_valid, no_empty_sources, javascript_parses, required_files_present) |

## Checklist item-by-item

1. **Native helper shipped** — `native/frx_fonts_host.py` + `native/install.sh` exist, are the reference copies with exactly the two allowed edits (Linux font dirs appended; usage comment → `bash ~/frontendremix/src/native/install.sh`). `allowed_extensions` = `["frontend-remix@martin473.github.io"]`. Helper runs and returns real fonts on this server. ✓
2. **manifest.json** — gecko id, `strict_min_version` 121.0, `nativeMessaging` in permissions, both background keys, version 1.2.0; all other keys unchanged. ✓
3. **popup.html** — has `#frx-loading`, `#frx-empty`, keeps `#frx-style-picker`/`#frx-style-clear`/`#frx-style-status`, has `#frx-import` panel with all parts (`frx-import-cmd`, `frx-import-copy`, `frx-paste-cmd`, `frx-import-text`, `frx-import-save`, `frx-paste-note`, `frx-import-note`, `frx-import-retry`), footer `#frx-import-toggle`, hidden `#frx-perm` + `#frx-perm-grant`. All 22 ids JS looks up exist. ✓
4. **Style dropdown** — `fillStylePicker()` populates from `STYLES` after "None"; `change` → `selectStyle(value)` sends `FRX_APPLY_STYLE` or `FRX_CLEAR_STYLE`; `#frx-style-clear` clears and resets; status shown in `#frx-style-status`; picker/clear disabled while busy (`styleBusy`); successful change calls `load()` to rescan. Boot does `FRX_GET_STYLE` and selects the current style. ✓
5. **Every installed font** — `loadImportedFonts` (storage `frxImportedFonts`), `syncInstalledFonts(cmd)` via `sendNativeMessage("frontend_remix_fonts", {cmd})` called with `"list"` on every open; Chrome `queryLocalFonts` guarded and only called from the toggle click; union in `getSystemFonts()` with case-insensitive sort; `INSTALL_CMD` = `bash ~/frontendremix/src/native/install.sh`; setup panel + "Check again" (`#frx-import-retry`) and paste fallback; `#frx-import-toggle` reads "N fonts on this Mac — rescan" when helper ok and does `{cmd:"deep"}`. Every per-font picker uses `getSystemFonts()`. ✓
6. **background.js** — `ensure()` injects `["content/style-engine.js", "content/content.js"]`; no other changes. ✓
7. **Firefox site access** — `checkPermissions()` calls `api.permissions.contains({origins:["<all_urls>"]})` on boot; shows `#frx-perm` when false; `#frx-perm-grant` click calls `api.permissions.request` then reloads state. ✓
8. **Font-swap kept working** — `load`/`renderFonts`/`buildItem`/override/clear/reset handlers intact; content.js handles all FRX_* messages; style-engine exposes `window.__frxStyleEngine` with `applyStyle`/`clearStyle`/`getCurrentStyle`. ✓

## Next steps

1. **(Polish, optional)** `popup/popup.css`: deduplicate the two `.frx-footer` rule blocks (lines ~50 and ~99) into one — purely cosmetic, no behavioural impact.
2. **(Polish, optional)** `popup/popup.js` boot: call `queryChromeFonts()` never on boot (already correct) but consider surfacing a hint in `#frx-paste-note` if `queryLocalFonts` is absent under Firefox — nice-to-have only.
3. **(Manual QA)** Load unpacked in Firefox 121+: confirm popup renders, Style dropdown switches all 5 styles, "Show all my fonts" lists helper fonts, and the permission box appears on a fresh install. Requires a real browser; not automatable here.

Nothing blocking: every MVP checklist item is implemented and verified. Remaining items are polish and browser-only manual QA.
