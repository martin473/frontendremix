# Frontend Remix — Design Document (Updated)
Repo: https://github.com/martin473/frontendremix

## Concept
Firefox browser extension that detects all rendered fonts on any page, allows swapping any detected font with any valid font URL (Google Fonts preferred but any working URL accepted). Popup-based UI.

## Font Detection
- Scan ALL `font-family` declarations (body, headings, paragraphs, buttons, etc.)
- Check computed styles via Playwright `getComputedStyle()` or `document.fonts`
- Detect font URLs via CSS `@font-face` rules (`font-family` + `src` URL)
- Show each detected font with its source URL (if available) or fallback

## Font Replacement
- Pop up overlay showing: current font name, source URL (if found), input for new URL
- User can enter any valid font URL (Google Fonts preferred, any working URL accepted)
- Extension injects `<style>` tag overriding `font-family` for matching selectors
- Live rerender: changes apply immediately without page reload

## UI Pattern (Extension Popup)
- Click Firefox toolbar icon → popup opens
- Popup shows: "Fonts on this page" list + input fields per font
- Each item: [Font Name] → [New URL input] → [Apply]
- Example: "Verdana → https://fonts.googleapis.com/css2?family=..." or any valid URL

## Technical Requirements
- Firefox WebExtension (manifest v2 or v3)
- Content script: scans page, injects `<style>` overrides
- Background script: handles popup interaction, communicates with content script
- Popup HTML: simple form showing detected fonts with input fields

## Override Mechanism Options (to be decided)
- **Option A**: Inject CSS overriding `font-family` rules (fastest, preserves layout)
- **Option B**: Modify `document.fonts` entries directly (cleaner, may miss inline styles)
- **Option C**: Replace CSS text nodes in stylesheet content (most invasive)

Recommendation: Start with Option A (CSS injection via `<style>` tag); move to B if needed.

## Persistence
- Session-level default: changes persist for current page load until refresh
- Optional: save preferences per domain (localStorage in extension) — not required for MVP

## MVP Scope Checklist
- [ ] Detect all fonts on a page
- [ ] Show popup with current fonts
- [ ] Accept new font URL input
- [ ] Inject CSS override
- [ ] Rerender live
