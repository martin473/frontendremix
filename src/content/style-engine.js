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
