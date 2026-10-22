/* Frontend Remix — content script: scans rendered fonts and injects CSS overrides. */
(function () {
  "use strict";
  if (window.__frontendRemixInjected) return;
  window.__frontendRemixInjected = true;

  const STYLE_ID = "__frontend_remix_overrides__";
  const FONTFACE_STYLE_ID = "__frontend_remix_fontfaces__";
  const overrides = new Map();

  function splitFontFamilies(value) {
    if (!value || typeof value !== "string") return [];
    const parts = [];
    let current = "";
    let quote = null;
    for (let i = 0; i < value.length; i++) {
      const ch = value[i];
      if (quote) {
        if (ch === quote) quote = null;
        else current += ch;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === ",") {
        parts.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts.filter(Boolean);
  }

  function primaryFamily(value) {
    const list = splitFontFamilies(value);
    return list.length ? list[0] : "";
  }

  function collectFontFaceSources() {
    const sources = {};
    const sheets = Array.from(document.styleSheets || []);
    for (const sheet of sheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch (e) {
        continue;
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (!rule || rule.type !== CSSRule.FONT_FACE_RULE) continue;
        const family = rule.style && rule.style.getPropertyValue("font-family");
        const src = rule.style && rule.style.getPropertyValue("src");
        if (!family || !src) continue;
        const name = family.replace(/["']/g, "").trim().toLowerCase();
        const urlMatch = src.match(/url\(\s*(["']?)([^"')]+)\1\s*\)/i);
        if (name && urlMatch && urlMatch[2] && !sources[name]) {
          sources[name] = urlMatch[2].trim();
        }
      }
    }
    return sources;
  }

  function detectRenderedFonts() {
    const counts = new Map();
    const samples = new Map();
    const elements = document.querySelectorAll(
      "body, body *:not(script):not(style):not(link):not(meta):not(head)"
    );
    const limit = 4000;
    let inspected = 0;
    for (const el of elements) {
      if (inspected++ > limit) break;
      let cs;
      try {
        cs = window.getComputedStyle(el);
      } catch (e) {
        continue;
      }
      if (!cs || cs.display === "none" || cs.visibility === "hidden") continue;
      const family = primaryFamily(cs.fontFamily);
      if (!family) continue;
      const key = family.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
      if (!samples.has(key)) samples.set(key, family);
    }
    const sources = collectFontFaceSources();
    const result = [];
    for (const [key, count] of counts.entries()) {
      result.push({ key: key, name: samples.get(key) || key, count: count, source: sources[key] || null });
    }
    result.sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
    return result;
  }

  function getStyleEl(id, marker) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      el.setAttribute("data-frontend-remix", marker);
      (document.head || document.documentElement).appendChild(el);
    }
    return el;
  }

  function cssSafe(key) {
    return key.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function applyOverride(originalName, fontUrl) {
    const key = originalName.toLowerCase();
    const safeFamily = "FRX-" + cssSafe(key);
    const fontFaceEl = getStyleEl(FONTFACE_STYLE_ID, "fontfaces");
    let remoteFamily = null;
    try {
      const u = new URL(fontUrl, document.baseURI);
      const familyParam = u.searchParams.get("family");
      if (familyParam) remoteFamily = familyParam.split(":")[0].replace(/\+/g, " ").trim();
      const pathMatch = u.pathname.match(/\/css2?\/([^/]+)/);
      if (!remoteFamily && pathMatch) remoteFamily = pathMatch[1].split(":")[0].replace(/\+/g, " ").trim();
    } catch (e) {
      remoteFamily = null;
    }
    const importRule = '@import url("' + fontUrl.replace(/"/g, '\\"') + '");';
    const targetFamily = remoteFamily
      ? '"' + remoteFamily + '", "' + safeFamily + '", sans-serif'
      : '"' + safeFamily + '", sans-serif';
    overrides.set(key, targetFamily);
    let css = importRule + "\n";
    if (!remoteFamily) {
      css += '@font-face { font-family: "' + safeFamily + '"; src: url("' + fontUrl.replace(/"/g, '\\"') + '"); }\n';
    }
    fontFaceEl.textContent = css;
    renderOverrides();
  }

  function renderOverrides() {
    const el = getStyleEl(STYLE_ID, "overrides");
    let css = "";
    for (const [key, target] of overrides.entries()) {
      const attr = "data-frx-" + cssSafe(key);
      css += "[" + attr + "], [" + attr + "] * { font-family: " + target + " !important; }\n";
    }
    el.textContent = css;
    tagElements();
  }

  function tagElements() {
    if (overrides.size === 0) return;
    const elements = document.querySelectorAll("body, body *");
    const limit = 4000;
    let inspected = 0;
    for (const el of elements) {
      if (inspected++ > limit) break;
      let cs;
      try {
        cs = window.getComputedStyle(el);
      } catch (e) {
        continue;
      }
      const family = primaryFamily(cs.fontFamily);
      if (!family) continue;
      const key = family.toLowerCase();
      if (overrides.has(key)) el.setAttribute("data-frx-" + cssSafe(key), "1");
    }
  }

  function clearOverride(originalName) {
    const key = originalName.toLowerCase();
    if (!overrides.has(key)) return false;
    overrides.delete(key);
    const attr = "data-frx-" + cssSafe(key);
    document.querySelectorAll("[" + attr + "]").forEach(function (el) {
      el.removeAttribute(attr);
    });
    renderOverrides();
    return true;
  }

  function resetAll() {
    overrides.clear();
    const ov = document.getElementById(STYLE_ID);
    if (ov) ov.textContent = "";
    const ff = document.getElementById(FONTFACE_STYLE_ID);
    if (ff) ff.textContent = "";
    document.querySelectorAll("*").forEach(function (el) {
      Array.from(el.attributes || []).forEach(function (attr) {
        if (attr.name.indexOf("data-frx-") === 0) el.removeAttribute(attr.name);
      });
    });
  }

  function isValidUrl(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const u = new URL(url, document.baseURI);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  function handleMessage(msg) {
    if (!msg || typeof msg.type !== "string") return { ok: false, error: "Invalid message" };
    try {
      switch (msg.type) {
        case "FRX_SCAN_FONTS": {
          const fonts = detectRenderedFonts().map(function (f) {
            return Object.assign({}, f, {
              overridden: overrides.has(f.key),
              overrideTo: overrides.get(f.key) || null
            });
          });
          return { ok: true, fonts: fonts };
        }
        case "FRX_APPLY_OVERRIDE":
          if (!msg.fontName) return { ok: false, error: "Missing font name" };
          if (!isValidUrl(msg.fontUrl)) return { ok: false, error: "Invalid URL" };
          applyOverride(msg.fontName, msg.fontUrl);
          return { ok: true };
        case "FRX_CLEAR_OVERRIDE":
          return { ok: clearOverride(msg.fontName || "") };
        case "FRX_RESET_ALL":
          resetAll();
          return { ok: true };
        case "FRX_PING":
          return { ok: true };
        default:
          return { ok: false, error: "Unknown message: " + msg.type };
      }
    } catch (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    }
  }

  const api = typeof browser !== "undefined" ? browser : chrome;
  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      sendResponse(handleMessage(msg));
      return true;
    });
  }

  window.__frontendRemix = {
    scan: detectRenderedFonts,
    apply: applyOverride,
    clear: clearOverride,
    reset: resetAll
  };
})();
