## Files (in build order - logic before markup before styling)

`background/background.js` — existing MV3 background logic (message routing, action handling). No changes; verify it uses no service-worker-only APIs (no `importScripts`, `self.registration`, `clients`, `skipWaiting`). Talks to `popup/popup.js` and `content/content.js` via runtime messages.

`manifest.json` — extension manifest; single source of truth for load targets. Must contain:
- `background`: both `service_worker: "background/background.js"` and `scripts: ["background/background.js"]`.
- `browser_specific_settings.gecko`: `{ id: "frontend-remix@martin473", strict_min_version: "121.0" }`.
- `version`: `"1.1.1"`.
All other keys (permissions, host_permissions, action, icons, content_scripts, web_accessible_resources) unchanged. No functions/handlers; consumed by Chrome + Firefox at load time.

`popup/popup.html`, `popup/popup.css`, `popup/popup.js` — unchanged popup UI; not touched by this fix.

`content/style-engine.js`, `content/content.js` — unchanged content scripts; not touched.

`assets/*` — unchanged style/font/icon assets.

## Message contract

No message types are added or changed by this fix. Existing contract (unchanged):
- popup → background: `runtime.sendMessage({ type: "..." })` with reply object; not modified here.
- background → content: `tabs.sendMessage(...)`; not modified here.
This task only edits `manifest.json`; message shapes stay exactly as-is.

## Checklist mapping

1. `background` has both keys → `manifest.json` `background.service_worker` + `background.scripts`.
2. Firefox settings → `manifest.json` `browser_specific_settings.gecko.id` / `.strict_min_version`.
3. Version bump → `manifest.json` `version` = `"1.1.1"`.
4. Valid JSON, other keys unchanged → `manifest.json` (verify with `node -e JSON.parse`).
5. Background stays plain → `background/background.js` (confirm via grep, do not rewrite).

## Out of scope

- No changes to `assets/`, `popup/`, or `content/`.
- No change to font-swap feature.
- No rewrite of `background/background.js`.
- No new permissions, no new manifest keys beyond the two required.
