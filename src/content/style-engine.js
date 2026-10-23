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

  function rmLinks() {
    var nodes = document.querySelectorAll("link[" + LINK_ATTR + "]");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  function rmIcons() {
    var nodes = document.querySelectorAll("link[" + ICON_ATTR + "]");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  function addLink(style, file) {
    var href = assetUrl(style, file);
    if (!href) return null;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = href;
    link.setAttribute(LINK_ATTR, file);
    (document.head || document.documentElement).appendChild(link);
    return link;
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
      (document.head || document.documentElement).appendChild(link);
    }
  }


  function tagIcons(style) {
    if (!valid(style)) return;
    var root = document.documentElement;
    for (var i = 0; i < ICONS.length; i++) {
      var href = assetUrl(style, 'icons/' + ICONS[i] + '.svg');
      if (href) root.style.setProperty('--frx-icon-' + ICONS[i], 'url(' + href + ')');
    }
    root.setAttribute('data-frx-style', style);
  }

  function clearStyle() {
    rmLinks();
    rmIcons();
    var root = document.documentElement;
    root.removeAttribute('data-frx-style');
    for (var i = 0; i < ICONS.length; i++) root.style.removeProperty('--frx-icon-' + ICONS[i]);
    current = '';
    return { ok: true, style: '' };
  }

  function applyStyle(style) {
    if (!valid(style)) return { ok: false, error: 'Unknown style: ' + String(style) };
    rmLinks();
    rmIcons();
    for (var i = 0; i < FILES.length; i++) addLink(style, FILES[i]);
    applyIcons(style);
    tagIcons(style);
    current = style;
    return { ok: true, style: style };
  }

  function getCurrentStyle() { return current; }

  window.__frxStyleEngine = {
    CATALOG: CATALOG, FILES: FILES, ICONS: ICONS,
    valid: valid, assetUrl: assetUrl,
    applyStyle: applyStyle, clearStyle: clearStyle, getCurrentStyle: getCurrentStyle
  };
})();
