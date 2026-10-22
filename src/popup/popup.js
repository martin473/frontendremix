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

  // ---- system fonts: no download, so no site's security policy can block them.
  // Firefox doesn't let extensions list installed fonts, so we test a broad list
  // of common macOS / Windows / Linux fonts and keep the ones that are installed.
  const CANDIDATE_FONTS = [
    "American Typewriter", "Andale Mono", "Arial", "Arial Black", "Arial Narrow", "Arial Rounded MT Bold",
    "Avenir", "Avenir Next", "Avenir Next Condensed", "Baskerville", "Big Caslon", "Bodoni 72",
    "Bradley Hand", "Brush Script MT", "Calibri", "Cambria", "Candara", "Chalkboard", "Chalkboard SE",
    "Chalkduster", "Charter", "Cochin", "Comic Sans MS", "Consolas", "Constantia", "Copperplate",
    "Corbel", "Courier", "Courier New", "DejaVu Sans", "DejaVu Serif", "DejaVu Sans Mono", "Didot",
    "Franklin Gothic Medium", "Futura", "Garamond", "Geneva", "Georgia", "Gill Sans", "Helvetica",
    "Helvetica Neue", "Herculanum", "Hoefler Text", "Impact", "Iowan Old Style", "Lucida Console",
    "Lucida Grande", "Lucida Sans Unicode", "Luminari", "Marker Felt", "Menlo", "Monaco",
    "Noteworthy", "Optima", "Palatino", "Palatino Linotype", "Papyrus", "Phosphate", "Rockwell",
    "Segoe Print", "Segoe Script", "Segoe UI", "SF Mono", "SF Pro Display", "SF Pro Text",
    "Skia", "Snell Roundhand", "Tahoma", "Times", "Times New Roman", "Trattatello", "Trebuchet MS",
    "Ubuntu", "Ubuntu Mono", "Verdana", "Zapfino",
    "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"
  ];
  const GENERIC = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"]);

  function detectInstalledFonts() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const sample = "mmmmmmmmmmlli1WQgy@#&";
    const bases = ["monospace", "serif", "sans-serif"];
    const baseWidths = bases.map(function (b) { ctx.font = "72px " + b; return ctx.measureText(sample).width; });
    return CANDIDATE_FONTS.filter(function (name) {
      if (GENERIC.has(name)) return true;
      // installed if it renders differently from at least one fallback
      return bases.some(function (b, i) {
        ctx.font = '72px "' + name + '", ' + b;
        return Math.abs(ctx.measureText(sample).width - baseWidths[i]) > 0.5;
      });
    });
  }
  // Fonts the user imported from their Mac (every installed family) - see the
  // "Import all my fonts" panel. Saved in extension storage, so it's a one-time step.
  let importedFonts = [];
  async function loadImportedFonts() {
    try {
      const got = await api.storage.local.get("frxImportedFonts");
      importedFonts = Array.isArray(got.frxImportedFonts) ? got.frxImportedFonts : [];
    } catch (e) { importedFonts = []; }
  }
  let systemFonts = null;
  function getSystemFonts() {
    if (!systemFonts) {
      const set = new Set(importedFonts.concat(detectInstalledFonts()));
      systemFonts = Array.from(set).sort(function (a, b) {
        const ga = GENERIC.has(a), gb = GENERIC.has(b);
        if (ga !== gb) return ga ? 1 : -1;            // generic families last
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      });
    }
    return systemFonts;
  }
  function cssFamily(name) { return GENERIC.has(name) ? name : '"' + name.replace(/"/g, "") + '"'; }

  // ---- searchable font picker, every name drawn in its own typeface
  let openPanel = null;
  function closePanel() { if (openPanel) { openPanel.remove(); openPanel = null; } }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

  function buildPicker(font, onPick) {
    const wrap = el("div", "frx-pick");
    const btn = el("button", "frx-input frx-pick-btn");
    btn.type = "button";
    let chosen = font.overrideSystem || "";
    function paintBtn() {
      btn.textContent = chosen || "Pick a font\u2026";
      btn.style.fontFamily = chosen ? cssFamily(chosen) : "";
    }
    paintBtn();
    btn.addEventListener("click", function () {
      if (openPanel && openPanel.parentNode === wrap) { closePanel(); return; }
      closePanel();
      const panel = el("div", "frx-pick-panel");
      const search = el("input", "frx-input frx-pick-search");
      search.type = "search";
      const all = getSystemFonts();
      search.placeholder = "Search " + all.length + " fonts\u2026";
      const list = el("ul", "frx-pick-list");
      // only style rows once they scroll into view: thousands of fonts stay fast
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.style.fontFamily = cssFamily(en.target.dataset.font); io.unobserve(en.target); }
        });
      }, { root: list });
      function render() {
        const q = search.value.trim().toLowerCase();
        list.innerHTML = "";
        const hits = q ? all.filter(function (n) { return n.toLowerCase().indexOf(q) !== -1; }) : all;
        hits.slice(0, 500).forEach(function (name) {
          const li = el("li", "frx-pick-item" + (name === chosen ? " frx-pick-item--on" : ""), name);
          li.dataset.font = name;
          li.title = name;
          li.addEventListener("click", function () {
            chosen = name; paintBtn(); closePanel(); onPick(name);
          });
          list.appendChild(li);
          io.observe(li);
        });
        if (!hits.length) list.appendChild(el("li", "frx-pick-empty", "No installed font matches \u201c" + search.value + "\u201d"));
        else if (hits.length > 500) list.appendChild(el("li", "frx-pick-empty", (hits.length - 500) + " more \u2014 keep typing to narrow down"));
      }
      search.addEventListener("input", render);
      search.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); const first = list.querySelector(".frx-pick-item"); if (first) first.click(); }
      });
      panel.appendChild(search);
      panel.appendChild(list);
      wrap.appendChild(panel);
      openPanel = panel;
      render();
      search.focus();
    });
    wrap.appendChild(btn);
    return { node: wrap, value: function () { return chosen; } };
  }

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
    // picking a font applies it right away (Apply re-applies)
    const picker = buildPicker(font, function () { input.hidden = true; form.requestSubmit(); });
    const applyBtn = el("button", "frx-btn frx-btn--primary", "Apply");
    applyBtn.type = "submit";
    form.appendChild(picker.node);
    form.appendChild(applyBtn);

    const urlToggle = el("button", "frx-clear frx-url-toggle", "or use a font URL\u2026");
    urlToggle.type = "button";
    input.type = "url";
    input.placeholder = "https://fonts.googleapis.com/css2?family=...";
    input.value = font.overrideSystem ? "" : (font.overrideTo || "");
    input.hidden = !input.value;
    input.setAttribute("aria-label", "Font URL for " + font.name);
    urlToggle.addEventListener("click", function () { input.hidden = !input.hidden; if (!input.hidden) input.focus(); });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const url = input.hidden ? "" : input.value.trim();
      const sys = picker.value();
      rowError.hidden = true;
      if (!url && !sys) {
        rowError.hidden = false;
        rowError.textContent = "Pick a font (or paste a font URL) first.";
        return;
      }
      applyBtn.disabled = true;
      applyBtn.textContent = url ? "Downloading..." : "Applying...";
      const msg = url ? { type: "FRX_APPLY_OVERRIDE", fontName: font.name, fontUrl: url }
                      : { type: "FRX_APPLY_OVERRIDE", fontName: font.name, systemFont: sys };
      toContent(msg).then(function (resp) {
        applyBtn.disabled = false;
        applyBtn.textContent = "Apply";
        if (resp && resp.ok) {
          setStatus("Remixed " + font.name + " \u2192 " + (sys && !url ? sys : (resp.family || "custom font")) + ".", "ok");
          load();
        } else {
          rowError.hidden = false;
          rowError.textContent = (resp && resp.error) || "Failed to apply override.";
        }
      });
    });
    li.appendChild(form);
    li.appendChild(input);
    li.appendChild(urlToggle);
    const actions = el("div", "frx-item-actions");
    const current = el("span", "frx-current");
    if (font.overridden && font.overrideTo) {
      current.textContent = "Now: " + String(font.overrideTo).replace(/^https?:\/\//, "").slice(0, 60);
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

  // ---- import every installed font family from the Mac (one-time)
  const IMPORT_CMD = "system_profiler SPFontsDataType | sed -n 's/^ *Family: //p' | sort -u | pbcopy";
  const imp = {
    toggle: document.getElementById("frx-import-toggle"),
    panel: document.getElementById("frx-import"),
    cmd: document.getElementById("frx-import-cmd"),
    copy: document.getElementById("frx-import-copy"),
    text: document.getElementById("frx-import-text"),
    save: document.getElementById("frx-import-save"),
    note: document.getElementById("frx-import-note")
  };
  function paintImportToggle() {
    imp.toggle.textContent = importedFonts.length
      ? importedFonts.length + " fonts imported \u2014 update"
      : "Import all my fonts";
  }
  imp.cmd.textContent = IMPORT_CMD;
  imp.toggle.addEventListener("click", function () { imp.panel.hidden = !imp.panel.hidden; });
  imp.copy.addEventListener("click", function () {
    navigator.clipboard.writeText(IMPORT_CMD).then(function () { imp.copy.textContent = "Copied!"; });
  });
  imp.save.addEventListener("click", async function () {
    const names = Array.from(new Set(imp.text.value.split(/\r?\n/).map(function (l) { return l.trim(); })
      .filter(function (l) { return l && l.length < 120 && !/^[.#]/.test(l); })));
    if (!names.length) { imp.note.textContent = "Paste the list first (run the command, then Cmd+V here)."; return; }
    await api.storage.local.set({ frxImportedFonts: names });
    importedFonts = names; systemFonts = null;
    imp.note.textContent = "Saved " + names.length + " fonts.";
    imp.text.value = ""; imp.panel.hidden = true;
    paintImportToggle(); renderFonts();
  });

  // ---- page styles (Flat / Material / Brutalist / Frutiger Aero / Claymation)
  const styleBtns = Array.from(document.querySelectorAll(".frx-style"));
  const styleNone = document.getElementById("frx-style-none");
  function paintStyle(active) {
    styleBtns.forEach(function (b) { b.classList.toggle("frx-style--on", b.dataset.style === active); });
    styleNone.hidden = !active;
  }
  function selectStyle(style) {
    if (typeof tabId !== "number") return;
    styleBtns.forEach(function (b) { b.disabled = true; });
    bgSend({ type: "FRX_SELECT_STYLE", tabId: tabId, style: style }).then(function (resp) {
      styleBtns.forEach(function (b) { b.disabled = false; });
      if (resp && resp.ok) {
        paintStyle(resp.style);
        const label = style ? (styleBtns.find(function (b) { return b.dataset.style === style; }) || {}).textContent : "";
        // fonts in use change with the style, so rescan, then show the result
        load().then(function () {
          setStatus(style ? "Page remixed: " + label + " style." : "Page style removed.", style ? "ok" : "info");
        });
      } else {
        setStatus((resp && resp.error) || "Could not apply the style.", "error");
      }
    });
  }
  styleBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      selectStyle(b.classList.contains("frx-style--on") ? "" : b.dataset.style);   // click again = off
    });
  });
  styleNone.addEventListener("click", function () { selectStyle(""); });

  loadImportedFonts().then(function () { paintImportToggle(); return load(); }).then(function () {
    return toContent({ type: "FRX_GET_STYLE" });
  }).then(function (r) { if (r && r.ok) paintStyle(r.style); });
})();
