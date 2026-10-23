/* Frontend Remix - style engine: injects per-style CSS + icons from bundled assets. */
(function () {
  "use strict";
  if (window.__frxStyleEngine) return;

  var api = typeof browser !== "undefined" ? browser : chrome;

  var CATALOG = {
    "brutalism": { label: "Brutalism" },
    "swiss": { label: "Swiss" },
    "bento": { label: "Bento" },
    "editorial": { label: "Editorial" },
    "retro-y2k": { label: "Retro / Y2K" }
  };

  var FILES = ["fonts.css", "borders.css", "buttons.css", "spacing.css", "layout.css"];
  var ICONS = ["check", "arrow", "close", "settings"];
  var STYLE_ATTR = "data-frx-style-el";
  var LINK_ATTR = "data-frx-style-link";
  var ICON_ATTR = "data-frx-icon-id";
  var current = "";

  function valid(style) {
    return typeof style === "string" && Object.prototype.hasOwnProperty.call(CATALOG, style);
  }

  function assetUrl(style, relPath) {
    try {
      return api.runtime.getURL("assets/" + style + "/" + relPath);
    } catch (e) {
      return "";
    }
  }

  function head() {
    return document.head || document.documentElement;
  }

  function removeAll(selector) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  function rmLinks() {
    removeAll("link[" + LINK_ATTR + "]");
    removeAll("style[" + STYLE_ATTR + "]");
  }

  function rmIcons() {
    removeAll("link[" + ICON_ATTR + "]");
  }

  // Inject CSS content. Prefer inline <style> populated from fetch() so the
  // host page's style-src CSP cannot block an extension:// stylesheet link.
  function injectCss(style, file) {
    var href = assetUrl(style, file);
    if (!href) return Promise.resolve(null);
    return fetch(href, { credentials: "omit" })
      .then(function (r) {
        if (!r.ok) throw new Error("status " + r.status);
        return r.text();
      })
      .then(function (text) {
        var el = document.createElement("style");
        el.setAttribute(STYLE_ATTR, style + ":" + file);
        el.setAttribute("data-frx", "1");
        el.textContent = text;
        head().appendChild(el);
        return el;
      })
      .catch(function () {
        // Fallback: <link> (works when CSP permits extension resources).
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = href;
        link.setAttribute(LINK_ATTR, file);
        head().appendChild(link);
        return link;
      });
  }

  function applyIcons(style) {
    if (!valid(style)) return;
    for (var i = 0; i < ICONS.length; i++) {
      var href = assetUrl(style, "icons/" + ICONS[i] + ".svg");
      if (!href) continue;
      var link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.setAttribute(ICON_ATTR, style + ":" + ICONS[i]);
      head().appendChild(link);
    }
  }

  function tagIcons(style) {
    if (!valid(style)) return;
    var root = document.documentElement;
    for (var i = 0; i < ICONS.length; i++) {
      var href = assetUrl(style, "icons/" + ICONS[i] + ".svg");
      if (href) root.style.setProperty("--frx-icon-" + ICONS[i], "url(" + href + ")");
    }
    root.setAttribute("data-frx-style", style);
  }

  function clearStyle() {
    rmLinks();
    rmIcons();
    var root = document.documentElement;
    root.removeAttribute("data-frx-style");
    for (var i = 0; i < ICONS.length; i++) root.style.removeProperty("--frx-icon-" + ICONS[i]);
    current = "";
    return { ok: true, style: "" };
  }

  function applyStyle(style) {
    if (!valid(style)) return { ok: false, error: "Unknown style: " + String(style) };
    rmLinks();
    rmIcons();
    var jobs = FILES.map(function (file) { return injectCss(style, file); });
    applyIcons(style);
    tagIcons(style);
    current = style;
    // Resolve once all stylesheets are injected (or have fallen back).
    return Promise.all(jobs).then(function () {
      return { ok: true, style: style };
    });
  }

  function getCurrentStyle() { return current; }

  window.__frxStyleEngine = {
    CATALOG: CATALOG, FILES: FILES, ICONS: ICONS,
    valid: valid, assetUrl: assetUrl,
    applyStyle: applyStyle, clearStyle: clearStyle, getCurrentStyle: getCurrentStyle
  };
})();
