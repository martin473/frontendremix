/* Frontend Remix — content script: scans rendered fonts and injects CSS overrides. */
(function () {
  "use strict";
  if (window.__frontendRemixInjected) return;
  window.__frontendRemixInjected = true;

  const STYLE_ID = "__frontend_remix_overrides__";
  const FONTFACE_STYLE_ID = "__frontend_remix_fontfaces__";
  // key (lowercased original family) -> { name, url, family, faces: [FontFace], css }
  const overrides = new Map();
  const api = typeof browser !== "undefined" ? browser : chrome;

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
      "body, body *:not(script):not(style):not(link):not(meta):not(head):not(img):not(svg):not(svg *)" +
      ":not(video):not(audio):not(canvas):not(iframe):not(picture):not(source):not(br):not(hr)"
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
      let key = null, family = null;
      for (const [k, rec] of overrides.entries()) {
        if (el.hasAttribute("data-frx-" + cssSafe(k))) { key = k; family = rec.name; break; }
      }
      if (!key) {
        family = primaryFamily(cs.fontFamily);
        if (!family || /^frx-/i.test(family)) continue;
        key = family.toLowerCase();
      }
      counts.set(key, (counts.get(key) || 0) + 1);
      if (!samples.has(key)) samples.set(key, family);
    }
    for (const [k, rec] of overrides.entries()) {
      if (!counts.has(k)) { counts.set(k, 0); samples.set(k, rec.name); }
    }
    const sources = collectFontFaceSources();
    const result = [];
    for (const [key, count] of counts.entries()) {
      const rec = overrides.get(key);
      result.push({ key: key, name: samples.get(key) || key, count: count,
                    source: sources[key] || null,
                    overridden: !!rec, overrideTo: rec ? (rec.system || rec.url) : null,
                    overrideSystem: rec ? rec.system || null : null });
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

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function renderFontFaces() {
    let css = "";
    for (const rec of overrides.values()) css += rec.css || "";
    getStyleEl(FONTFACE_STYLE_ID, "fontfaces").textContent = css;
  }

  function applySystemFont(originalName, systemFont) {
    const key = originalName.toLowerCase();
    if (overrides.has(key)) removeFaces(overrides.get(key));
    const clean = String(systemFont).replace(/["\\;{}]/g, "").trim();
    if (!clean) return { ok: false, error: "Pick a font first." };
    overrides.set(key, {
      name: originalName, url: null, system: clean, family: clean, faces: [], css: "",
      target: '"' + clean + '", "' + originalName.replace(/"/g, "") + '", sans-serif'
    });
    renderFontFaces();
    renderOverrides();
    return { ok: true, family: clean };
  }

  async function applyOverride(originalName, fontUrl) {
    const key = originalName.toLowerCase();
    const family = "FRX-" + (cssSafe(key) || "font");
    // the page's Content-Security-Policy can block font downloads (e.g. reddit:
    // font-src 'self' data:), so the background script downloads the font instead
    const res = await api.runtime.sendMessage({ type: "FRX_BG_FETCH_FONT", url: fontUrl });
    if (!res || !res.ok) return { ok: false, error: (res && res.error) || "Could not download the font." };

    if (overrides.has(key)) removeFaces(overrides.get(key));
    const faces = [];
    let css = "";
    let anyLoaded = false;
    for (const f of res.faces) {
      const desc = {};
      if (f.style) desc.style = f.style;
      if (f.weight) desc.weight = f.weight;
      if (f.unicodeRange) desc.unicodeRange = f.unicodeRange;
      // 1) FontFace from raw bytes: not a network load, so font-src CSP doesn't apply
      try {
        const bytes = b64ToBytes(f.b64);
        const ff = new FontFace(family, bytes.buffer, desc);
        await ff.load();
        document.fonts.add(ff);
        faces.push(ff);
        anyLoaded = true;
      } catch (e) {
        // 2) fallback: data: URL, which most CSPs (reddit's included) still allow
        css += "@font-face { font-family: \"" + family + "\"; src: url(\"data:" + (f.mime || "font/woff2") +
               ";base64," + f.b64 + "\")" + (f.style ? "; font-style: " + f.style : "") +
               (f.weight ? "; font-weight: " + f.weight : "") +
               (f.unicodeRange ? "; unicode-range: " + f.unicodeRange : "") + "; }\n";
      }
    }
    if (!anyLoaded && !css) return { ok: false, error: "The font file could not be loaded." };
    overrides.set(key, {
      name: originalName, url: fontUrl, family: family, faces: faces, css: css,
      target: '"' + family + '", "' + originalName.replace(/"/g, "") + '", sans-serif'
    });
    renderFontFaces();
    renderOverrides();
    return { ok: true, family: res.family || null };
  }

  function removeFaces(rec) {
    for (const ff of rec.faces || []) {
      try { document.fonts.delete(ff); } catch (e) { /* ignore */ }
    }
  }

  function renderOverrides() {
    const el = getStyleEl(STYLE_ID, "overrides");
    let css = "";
    for (const [key, rec] of overrides.entries()) {
      const attr = "data-frx-" + cssSafe(key);
      // tripled attribute = specificity 0,3,0, so a per-font pick beats a page style's fonts
      css += "[" + attr + "][" + attr + "][" + attr + "] { font-family: " + rec.target + " !important; }\n";
    }
    el.textContent = css;
    tagElements();
  }

  function tagElements() {
    if (overrides.size === 0) return;
    const toTag = [];
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
      if (Array.from(el.attributes).some(function (a) { return a.name.indexOf("data-frx-") === 0; })) continue;
      const family = primaryFamily(cs.fontFamily);
      if (!family) continue;
      const key = family.toLowerCase();
      if (overrides.has(key)) toTag.push([el, "data-frx-" + cssSafe(key)]);
    }
    // tag after scanning: tagging the parent first would change what its children compute
    toTag.forEach(function (t) { t[0].setAttribute(t[1], "1"); });
  }

  function clearOverride(originalName) {
    const key = originalName.toLowerCase();
    if (!overrides.has(key)) return false;
    removeFaces(overrides.get(key));
    overrides.delete(key);
    renderFontFaces();
    const attr = "data-frx-" + cssSafe(key);
    document.querySelectorAll("[" + attr + "]").forEach(function (el) {
      el.removeAttribute(attr);
    });
    renderOverrides();
    return true;
  }

  function resetAll() {
    for (const rec of overrides.values()) removeFaces(rec);
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

  // ---- page style: flag <html> (all bundle CSS is scoped to it) + swap common icons
  let currentStyle = "";
  const ICON_HINTS = [
    ["check", /check|tick|done|success|confirm/i],
    ["close", /close|dismiss|remove|cancel|cross|x-mark/i],
    ["settings", /setting|gear|cog|config|prefer/i],
    ["arrow", /arrow|next|prev|chevron|caret|forward|back/i]
  ];
  function guessIcon(el) {
    const hay = [el.getAttribute("alt"), el.getAttribute("title"), el.getAttribute("aria-label"),
                 el.getAttribute("src"), el.getAttribute("class")].join(" ");
    for (const h of ICON_HINTS) if (h[1].test(hay)) return h[0];
    return null;
  }
  function restoreIcons() {
    document.querySelectorAll("img[data-frx-orig-src]").forEach(function (img) {
      img.setAttribute("src", img.getAttribute("data-frx-orig-src"));
      if (img.hasAttribute("data-frx-orig-srcset")) img.setAttribute("srcset", img.getAttribute("data-frx-orig-srcset"));
      img.removeAttribute("data-frx-orig-src");
      img.removeAttribute("data-frx-orig-srcset");
    });
  }
  function swapIcons(style) {
    let n = 0;
    const imgs = document.querySelectorAll("img");
    for (let i = 0; i < imgs.length && i < 800; i++) {
      const img = imgs[i];
      const w = img.width || img.naturalWidth || 0, h = img.height || img.naturalHeight || 0;
      if (!w || !h || w > 48 || h > 48) continue;           // icons only
      const kind = guessIcon(img);
      if (!kind) continue;
      if (!img.hasAttribute("data-frx-orig-src")) {
        img.setAttribute("data-frx-orig-src", img.getAttribute("src") || "");
        if (img.hasAttribute("srcset")) img.setAttribute("data-frx-orig-srcset", img.getAttribute("srcset"));
      }
      img.removeAttribute("srcset");
      img.setAttribute("src", api.runtime.getURL("assets/" + style + "/icons/" + kind + ".svg"));
      n++;
    }
    return n;
  }
  function applyStyle(style) {
    restoreIcons();
    if (!style) {
      document.documentElement.removeAttribute("data-frx-style");
      currentStyle = "";
      return { ok: true, style: "", icons: 0 };
    }
    document.documentElement.setAttribute("data-frx-style", style);
    currentStyle = style;
    let icons = 0;
    try { icons = swapIcons(style); } catch (e) { /* icons are best-effort */ }
    return { ok: true, style: style, icons: icons };
  }

  function handleMessage(msg) {
    if (!msg || typeof msg.type !== "string") return { ok: false, error: "Invalid message" };
    try {
      switch (msg.type) {
        case "FRX_SCAN_FONTS": {
          return { ok: true, fonts: detectRenderedFonts() };
        }
        case "FRX_APPLY_OVERRIDE":
          if (!msg.fontName) return { ok: false, error: "Missing font name" };
          if (msg.systemFont) return applySystemFont(msg.fontName, msg.systemFont);
          if (!isValidUrl(msg.fontUrl)) return { ok: false, error: "Invalid URL" };
          return applyOverride(msg.fontName, msg.fontUrl).catch(function (e) {
            return { ok: false, error: String(e && e.message ? e.message : e) };
          });
        case "FRX_CLEAR_OVERRIDE":
          return { ok: clearOverride(msg.fontName || "") };
        case "FRX_RESET_ALL":
          resetAll();
          return { ok: true };
        case "FRX_PING":
          return { ok: true };
        case "FRX_APPLY_STYLE":
          return applyStyle(msg.style || "");
        case "FRX_GET_STYLE":
          return { ok: true, style: currentStyle };
        default:
          return { ok: false, error: "Unknown message: " + msg.type };
      }
    } catch (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    }
  }

  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      Promise.resolve(handleMessage(msg)).then(sendResponse);
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
