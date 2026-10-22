/* Frontend Remix — style engine: injects per-style CSS + icons from bundled assets. */
(function () {
  "use strict";
  if (window.__frxStyleEngine) return;

  const api = typeof browser !== "undefined" ? browser : chrome;

  const CATALOG = {\