# Frontend Remix — fully working popup: style dropdown + every installed font

## Goal
In Firefox (121+), opening the extension popup on a normal web page must:
1. show the fonts used on the page, each with a dropdown to replace it,
2. offer **every font installed on the user's Mac** in those dropdowns (not just a fixed list),
3. have a working **Style** dropdown that applies / switches / clears the 5 page styles.
Chrome must keep loading too. Nothing else changes.

## What is broken on main today (fix all of it)
1. **The popup crashes on open.** `popup/popup.js` uses `document.getElementById("frx-loading")` and
   `document.getElementById("frx-empty")`, but `popup/popup.html` has no such elements, so `showState()`
   throws on the first `load()` and nothing renders. Every id that `popup.js` looks up must exist in
   `popup.html`.
2. **The Style dropdown is inert.** `#frx-style-picker` is never filled and has no listeners.
3. **Only ~80 hard-coded fonts are offered.** Firefox cannot list installed fonts for extensions, so a
   small native helper is needed (it already exists, see "Reference material").
4. **Re-injection misses the style engine.** `background/background.js` `ensure()` injects only
   `content/content.js`; it must inject `["content/style-engine.js", "content/content.js"]` in that
   order, otherwise styles fail with "Style engine unavailable" on tabs opened before install.
5. **Firefox does not grant `<all_urls>` automatically** for MV3 add-ons, so content scripts may not run.

## Reference material (read it; do not copy blindly)
`.forge/reference/` holds the user's earlier working version of this popup. It was built for an OLD style
set (flat / material / brutalist / frutiger-aero / claymation) — do NOT bring back those styles or
their names. Use it for the font-helper logic and the setup panel:
- `.forge/reference/native/frx_fonts_host.py` and `install.sh` — the native font helper (works).
- `.forge/reference/popup/popup.js` — see the section starting at the comment
  `every installed font, read straight from the Mac by the native helper` (host name
  `frontend_remix_fonts`, `api.runtime.sendNativeMessage`, caching in `storage.local` under
  `frxImportedFonts`, the "Show all my fonts" setup panel, "Check again", paste-a-list fallback).
- `.forge/reference/popup/popup.html` / `popup.css` — markup and styles of that setup panel.

## MVP Scope Checklist
1. **Native helper shipped in the repo.** Create `native/` by COPYING the reference files exactly with
   `run_command`:  `mkdir -p native && cp .forge/reference/native/frx_fonts_host.py .forge/reference/native/install.sh native/ && chmod +x native/frx_fonts_host.py`
   Then make exactly these two edits and nothing else:
   - in `native/frx_fonts_host.py`, append to `FONT_DIRS`: `"/usr/share/fonts"`,
     `"/usr/local/share/fonts"`, `os.path.join(HOME, ".local/share/fonts")`, `os.path.join(HOME, ".fonts")`
     (Linux folders; harmless on a Mac, and lets the helper be tested on this server);
   - in `native/install.sh`, change the usage comment to `bash ~/frontendremix/src/native/install.sh`.
   Keep `allowed_extensions` = `["frontend-remix@martin473.github.io"]`.
2. **manifest.json**:
   - `browser_specific_settings.gecko.id` → `"frontend-remix@martin473.github.io"` (must match the helper);
     keep `strict_min_version` `"121.0"`;
   - add `"nativeMessaging"` to `permissions`;
   - keep `background` with BOTH `service_worker` and `scripts` → `background/background.js`;
   - `version` → `"1.2.0"`; every other key unchanged.
3. **popup.html**: add the missing `#frx-loading` and `#frx-empty` elements inside `<main>`; keep the existing
   Style bar (`#frx-style-picker`, `#frx-style-clear`, `#frx-style-status`); add the fonts setup panel
   (`#frx-import` and its parts, adapted from the reference) and a footer button `#frx-import-toggle`
   ("Show all my fonts"); add a hidden `#frx-perm` box with a `#frx-perm-grant` button (see item 7).
   Every `getElementById` id used in popup.js must exist in popup.html.
4. **Style dropdown (popup.js)**: on load, fill `#frx-style-picker` with one `<option>` per entry of
   `STYLES` (value = key, text = label) after the existing "None" option; send
   `{type:"FRX_GET_STYLE"}` through `toContent()` and select the current style. On `change`: value `""` →
   `{type:"FRX_CLEAR_STYLE"}`, otherwise `{type:"FRX_APPLY_STYLE", style:value}`; `#frx-style-clear` sends
   `FRX_CLEAR_STYLE` and resets the dropdown to "None". Show the result in `#frx-style-status`; disable the
   dropdown while a request is in flight; after a successful change call `load()` to rescan fonts.
5. **Every installed font (popup.js)**: port the reference helper logic. Font list for the per-font
   dropdowns = union of (a) the cached helper list from `storage.local.frxImportedFonts`, refreshed on every
   popup open via `sendNativeMessage("frontend_remix_fonts", {cmd:"list"})`, (b) in Chrome only, if
   `window.queryLocalFonts` exists, its families (call it only from a user click; ignore errors), and (c) the
   existing canvas-detected `CANDIDATE_FONTS`. De-duplicate, sort case-insensitively. When the helper is not
   installed, show the setup panel with the command `bash ~/frontendremix/src/native/install.sh` and a
   "Check again" button; when it is, `#frx-import-toggle` reads "N fonts on this Mac — rescan" and does a
   `{cmd:"deep"}` scan. Every per-font dropdown must contain the full list.
6. **background.js**: `ensure()` injects `["content/style-engine.js", "content/content.js"]`. No other changes.
7. **Site access in Firefox (popup.js)**: on open, `api.permissions.contains({origins:["<all_urls>"]})`; if
   false, show `#frx-perm` ("Allow Frontend Remix on all websites") whose button calls
   `api.permissions.request({origins:["<all_urls>"]})` from the click handler, then reloads the popup state.
8. Keep the font-swap feature (scan, apply by system font or URL, clear, reset all) working as now.

## Out of scope
- Any change to `assets/` (the 5 styles), `content/style-engine.js`, or the content-script message types.
- Bringing back the old style names or the old style grid buttons.
- Rewriting files that already satisfy the checklist.

## How to verify (run these; all must pass)
- `node --check` passes for every `.js` file.
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"` succeeds, and the manifest has
  gecko id `frontend-remix@martin473.github.io`, `nativeMessaging` in permissions, both background keys,
  version `1.2.0`.
- Every popup id exists:
  `node -e "const fs=require('fs');const js=fs.readFileSync('popup/popup.js','utf8'),html=fs.readFileSync('popup/popup.html','utf8');const ids=[...js.matchAll(/getElementById\(\"([^\"]+)\"\)/g)].map(m=>m[1]);const miss=ids.filter(i=>!html.includes('id=\"'+i+'\"'));console.log(miss.length?'MISSING '+miss.join(','):'all '+ids.length+' ids present');process.exit(miss.length?1:0)"`
- The helper answers: `printf '\x0f\x00\x00\x00{"cmd": "list"}' | python3 native/frx_fonts_host.py | tail -c +5`
  prints JSON with `"ok": true` and a `fonts` list (non-empty whenever `ls /usr/share/fonts` shows fonts on
  this server; an empty list is fine if the server has no font files).
- `cmp native/install.sh .forge/reference/native/install.sh` differs only in the usage comment line.
- `grep -n "flat\|material\|frutiger\|claymation" popup/popup.js popup/popup.html` finds nothing.
- `grep -n "style-engine.js" background/background.js` shows it in the `ensure()` file list.
