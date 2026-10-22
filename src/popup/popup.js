/* Frontend Remix - popup logic */
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

  function updateResetState() {
    els.reset.disabled = !fonts.some(function (f) { return f.overridden; });
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
    const badge = font.overridden ? "frx-badge frx-badge--active" : "frx-badge frx-badge--count";
    head.appendChild(el("span", badge, font.overridden ? "Overridden" : font.count + " el"));
    li.appendChild(head);
    const rowError = el("div", "frx-row-error");
    rowError.hidden = true;
    const form = el("form", "frx-form");
    const input = el("input", "frx-input");
    input.type = "url";
    input.placeholder = "https://fonts.googleapis.com/css2?family=...";
    input.value = font.overrideTo || "";
    input.setAttribute("aria-label", "New font URL for " + font.name);
    const applyBtn = el("button", "frx-btn frx-btn--primary", "Apply");
    applyBtn.type = "submit";
    form.appendChild(input);
    form.appendChild(applyBtn);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const url = input.value.trim();
      rowError.hidden = true;
      if (!url) {
        rowError.hidden = false;
        rowError.textContent = "Enter a font URL first.";
        return;
      }
      applyBtn.disabled = true;
      applyBtn.textContent = "Applying...";
      toContent({ type: "FRX_APPLY_OVERRIDE", fontName: font.name, fontUrl: url }).then(function (resp) {
        applyBtn.disabled = false;
        applyBtn.textContent = "Apply";
        if (resp && resp.ok) {
          setStatus("Remixed " + font.name + ".", "ok");
          load();
        } else {
          rowError.hidden = false;
          rowError.textContent = (resp && resp.error) || "Failed to apply override.";
        }
      });
    });
    li.appendChild(form);
    const actions = el("div", "frx-item-actions");
    const current = el("span", "frx-current");
    if (font.overridden && font.overrideTo) {
      current.textContent = "Now: " + String(font.overrideTo).replace(/^https?:\/\//, "");
      current.title = font.overrideTo;
    } else if (font.overridden) {
      current.textContent = "Override active";
    } else {
      current.textContent = font.count + " element" + (font.count === 1 ? "" : "s") + " using this font";
    }
    actions.appendChild(current);
    if (font.overridden) {
      const clearBtn = el("button", "frx-clear", "Clear");
      clearBtn.type = "button";
      clearBtn.addEventListener("click", function () {
        clearBtn.disabled = true;
        toContent({ type: "FRX_CLEAR_OVERRIDE", fontName: font.name }).then(function (resp) {
          clearBtn.disabled = false;
          if (resp && resp.ok) {
            setStatus("Reverted " + font.name + ".", "info");
            load();
          } else {
            rowError.hidden = false;
            rowError.textContent = (resp && resp.error) || "Failed to clear override.";
          }
        });
      });
      actions.appendChild(clearBtn);
    }
    li.appendChild(actions);
    li.appendChild(rowError);
    return li;
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

  async function load() {
    showState("loading");
    if (tabId === null) {
      const tab = await bgSend({ type: "FRX_BG_GET_TAB" });
      if (!tab || !tab.ok) {
        showState("empty");
        els.title.textContent = "Cannot access this page";
        setStatus((tab && tab.error) || "This page cannot be remixed.", "error");
        return;
      }
      tabId = tab.tabId;
      els.title.textContent = tab.title || tab.url || "Current page";
      els.title.title = tab.url || "";
    }
    const res = await toContent({ type: "FRX_SCAN_FONTS" });
    if (!res || !res.ok) {
      fonts = [];
      showState("empty");
      setStatus((res && res.error) || "Unable to scan this page.", "error");
      return;
    }
    fonts = res.fonts || [];
    setStatus("", null);
    renderFonts();
  }

  els.refresh.addEventListener("click", function () {
    load();
  });

  els.reset.addEventListener("click", function () {
    els.reset.disabled = true;
    toContent({ type: "FRX_RESET_ALL" }).then(function (resp) {
      if (resp && resp.ok) {
        setStatus("All overrides cleared.", "info");
        load();
      } else {
        els.reset.disabled = false;
        setStatus((resp && resp.error) || "Failed to reset.", "error");
      }
    });
  });

  load();
})();
