/* Frontend Remix — style engine: injects per-style CSS + icons from bundled assets. */
(function () {
  "use strict";
  if (window.__frxStyleEngine) return;

  const api = typeof browser !== "undefined" ? browser : chrome;

  const CATALOG = {
    "brutalism": "Brutalism",
    "swiss": "Swiss",
    "bento": "Bento Grid",
    "editorial": "Editorial",
    "retro-y2k": "Retro / Y2K"
  };

  const FILES = ["fonts.css", "borders.css", "buttons.css", "spacing.css", "layout.css"];
  const ICONS = ["check", "arrow", "close", "settings"];
  const LINK_ATTR = "data-frx-style-link";
  const ICON_ATTR = "data-frx-style-icon";
  const STYLE_ID = "__frontend_remix_style__";

  let current = "";

  function valid(style) {
    return typeof style === "string" && Object.prototype.hasOwnProperty.call(CATALOG, style);
  }

  function assetUrl(style, rel) {
    try {\