/* Frontend Remix — popup logic */
(function () {
  "use strict";
  const api = typeof browser !== "undefined" ? browser : chrome;

  const els = {
    title: document.getElementById("frx-page-title"),
    status: document.getElementById("frx-status"),
    loading: document.getElementById("frx-loading"),
    list: document.getElementById("frx-list"),
    empty: document.getElementById("frx-empty"),
    reset: document.getElementById("frx-reset"),
    refresh: document.getElementById("frx-refresh")
  };

  let tabId = null;
  let fonts = [];

  function setStatus(message, kind) {
    if (!message) {
      els.status.hidden = true;
      els.status.textContent = "";
      els.status.className = "frx-status";
      return;
    }
    els.status.hidden = false;
    els.status.textContent = message;
    els.status.className = "frx-status frx-status--" + (kind || "info");
  }

  function bgSend(payload) {
    return new Promise(function (resolve) {
      try {
        api.runtime.sendMessage(payload, function (resp) {
          void api.runtime.lastError;
          resolve(resp || { ok: false, error: "No response" });
        });
      } catch (e) {
        resolve({ ok: false, error: String(e && e.message ? e.message : e) });
      }
    });
  }

  function toContent(message) {
    if (typeof tabId !== "number") return Promise.resolve({ ok: false, error: "No active tab" });
    return bgSend({ type: "FRX_BG_FORWARD", tabId: tabId, payload: message });
  }

  function showState(state) {
    els.loading.hidden = state !== "loading";
    els.list.hidden = state !== "list";
    els.empty.hidden = state !== "empty";
  }

  function renderFonts() {
    els.list.innerHTML = "";
    if (!fonts.length) {
      showState("empty");
      els.reset.disabled = true;
      return;
    }
    showState("list");
    fonts.forEach(function (font) {
      els.list.appendChild(buildItem(font));
    });
    updateResetState();
  }

  function updateResetState() {
    const any = fonts.some(function (f) { return f.overridden; });
    els.reset.disabled = !any;
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function buildItem(font) {
    const li = el("li", "frx-item" + (font.overridden ? " frx-item--active" : ""));

    const head = el("div", "frx-item-head");
    const titleWrap = el("div", "frx-font-title");
    titleWrap.appendChild(el("div", "frx-font-name", font.name));
    const meta = el("div", "frx-font-meta");
    if (font.source) {
      const a = el("a", null, font.source);
      a.href = font.source;
      a.title = font.source;
      a.target = "_blank";
      a.rel = "noreferrer noopener";
      meta.textContent = "Source: ";
      meta.appendChild(a);
    } else {
      meta.textContent = "No source URL found (local/system font)";
    }
    titleWrap.appendChild(meta);
    head.appendChild(titleWrap);

    if (font.overridden) {
      head.appendChild(el("span", "frx-badge frx-badge--active", "Overridden"));
    } else {
      head.appendChild(el("span", "frx-badge frx-badge--count", font.count + " el"));
    }
    li.appendChild(head);

    const form = el(