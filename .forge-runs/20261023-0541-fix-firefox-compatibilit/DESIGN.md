# Frontend Remix — Firefox compatibility fix

## Problem
Loading the extension in Firefox fails with:

    background.service_worker is currently disabled. Add background.scripts.

`manifest.json` declares the background script only as `"background": {"service_worker": "background/background.js"}`.
Firefox (Manifest V3) does not run extension service workers; it needs `background.scripts`.

## Goal
The same extension loads without errors in **both Firefox (121+) and Chrome**, with every existing feature unchanged.

## MVP Scope Checklist
1. `manifest.json` → `background` contains BOTH keys, pointing at the same file:
   `"background": { "service_worker": "background/background.js", "scripts": ["background/background.js"] }`
   (Firefox 121+ uses `scripts` and ignores `service_worker`; Chrome uses `service_worker`.)
2. `manifest.json` gains Firefox settings:
   `"browser_specific_settings": { "gecko": { "id": "frontend-remix@martin473", "strict_min_version": "121.0" } }`
3. `manifest.json` `version` bumped from `1.1.0` to `1.1.1`.
4. `manifest.json` stays valid JSON; every other key (permissions, host_permissions, action, icons,
   content_scripts, web_accessible_resources) is unchanged.
5. `background/background.js` keeps working as a plain background script: it must not use
   service-worker-only APIs (`importScripts`, `self.registration`, `clients`, `skipWaiting`). It currently
   does not — confirm, do not rewrite it.

## Out of scope
- Any change to the 5 styles in `assets/`, the popup, or the content scripts.
- Any change to the font-swap feature.
- Rewriting files that already satisfy the checklist.

## How to verify
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"` succeeds.
- `manifest.json` has `background.scripts` = `["background/background.js"]`, `background.service_worker` =
  `"background/background.js"`, `browser_specific_settings.gecko.id` = `"frontend-remix@martin473"`,
  and `version` = `"1.1.1"`.
- `grep -nE "importScripts|self\.registration|clients\.|skipWaiting" background/background.js` finds nothing.
