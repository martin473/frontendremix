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
    refresh: document.getElementById("frx-refresh"),
    stylePicker: document.getElementById("frx-style-picker"),
    styleClear: document.getElementById("frx-style-clear"),
    styleStatus: document.getElementById("frx-style-status")
  };
  let tabId = null;
  let fonts = [];

  // ---- style catalog (mirrors content/style-engine.js CATALOG)
  const STYLES = {
    "brutalism": "Brutalism",
    "swiss": "Swiss",
    "bento": "Bento Grid",
    "editorial": "Editorial",
    "retro-y2k": "Retro / Y2K"
  };
  let currentStyle = "";
  let styleBusy = false;

  // ---- system fonts: no download, so no site's security policy can block them.
  // Firefox doesn't let extensions list installed fonts, so we test a broad list
  // of common fonts; the native helper (below) adds everything else.
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

  // Every installed font family on the Mac, from the native font helper (or pasted
  // by hand as a fallback). Cached in extension storage; refreshed on each popup open.
  let importedFonts = [];
  let chromeFonts = [];
  async function loadImportedFonts() {
    try {
      const got = await api.storage.local.get("frxImportedFonts");
      importedFonts = Array.isArray(got.frxImportedFonts) ? got.frxImportedFonts : [];
    } catch (e) { importedFonts = []; }
  }

  async function queryChromeFonts() {
    if (typeof window.queryLocalFonts !== "function") return;
    try {
      const list = await window.queryLocalFonts();
      const fams = list.map(function (f) { return f.family; }).filter(Boolean);
      if (fams.length) { chromeFonts = fams; systemFonts = null; }
    } catch (e) { /* user denied or unsupported */ }
  }

  let systemFonts = null;
  function getSystemFonts() {
    if (!systemFonts) {
      const set = new Set(importedFonts.concat(chromeFonts, detectInstalledFonts()));
      systemFonts = Array.from(set).sort(function (a, b) {
        const ga = GENERIC.has(a), gb = GENERIC.has(b);
        if (ga !== gb) return ga ? 1 : -1;            // generic families last
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      });
    }
    return systemFonts;
  }
  function cssFamily(name) { return GENERIC.has(name) ? name : '"' + name.replace(/"/g, "") + '"'; }

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
    if (els.loading) els.loading.hidden = state !== "loading";
    if (els.list) els.list.hidden = state !== "list";
    if (els.empty) els.empty.hidden = state !== "empty";
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
    const picker = el("select", "frx-input frx-picker");
    picker.setAttribute("aria-label", "System font for " + font.name);
    const ph = el("option", null, "Pick a system font\u2026");
    ph.value = "";
    picker.appendChild(ph);
    getSystemFonts().forEach(function (name) {
      const opt = el("option", null, name);
      opt.value = name;
      opt.style.fontFamily = GENERIC.has(name) ? name : '"' + name + '"';
      if (font.overrideSystem === name) opt.selected = true;
      picker.appendChild(opt);
    });
    picker.addEventListener("change", function () {
      picker.style.fontFamily = picker.value ? cssFamily(picker.value) : "";
    });
    if (font.overrideSystem) picker.style.fontFamily = cssFamily(font.overrideSystem);
    const applyBtn = el("button", "frx-btn frx-btn--primary", "Apply");
    applyBtn.type = "submit";
    form.appendChild(picker);
    form.appendChild(applyBtn);

    const urlToggle = el("button", "frx-clear frx-url-toggle", "or use a font URL\u2026");
    urlToggle.type = "button";
    const input = el("input", "frx-input");
    input.type = "url";
    input.placeholder = "https://fonts.googleapis.com/css2?family=...";
    input.value = font.overrideSystem ? "" : (font.overrideTo || "");
    input.hidden = !input.value;
    input.setAttribute("aria-label", "Font URL for " + font.name);
    urlToggle.addEventListener("click", function () { input.hidden = !input.hidden; if (!input.hidden) input.focus(); });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const url = input.hidden ? "" : input.value.trim();
      const sys = picker.value;
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

  // ---- page style dropdown
  function fillStylePicker() {
    Object.keys(STYLES).forEach(function (key) {
      if (els.stylePicker.querySelector('option[value="' + key + '"]')) return;
      const opt = el("option", null, STYLES[key]);
      opt.value = key;
      els.stylePicker.appendChild(opt);
    });
  }

  function selectStyle(style) {
    if (typeof tabId !== "number") return;
    styleBusy = true;
    els.stylePicker.disabled = true;
    els.styleClear.disabled = true;
    currentStyle = style;
    const msg = style ? { type: "FRX_APPLY_STYLE", style: style } : { type: "FRX_CLEAR_STYLE" };
    toContent(msg).then(function (resp) {
      if (resp && resp.ok) {
        currentStyle = style;
        els.stylePicker.value = style || "";
        const label = style ? STYLES[style] || style : "";
        const kept = resp.fixed ? " " + resp.fixed + " fixed-size area" + (resp.fixed === 1 ? "" : "s") +
          " kept " + (resp.fixed === 1 ? "its" : "their") + " spacing so nothing overflows." : "";
        els.styleStatus.textContent = style ? "Style applied: " + label + "." + kept : "Page style removed.";
        setStatus("", null);
        // fonts in use change with the style, so rescan
        load();
      } else {
        els.styleStatus.textContent = (resp && resp.error) || "Could not apply the style.";
      }
    }).then(function () {
      styleBusy = false;
      els.stylePicker.disabled = false;
      els.styleClear.disabled = false;
    });
  }

  fillStylePicker();
  els.stylePicker.addEventListener("change", function () {
    if (styleBusy) return;
    selectStyle(els.stylePicker.value);
  });
  els.styleClear.addEventListener("click", function () {
    if (styleBusy) return;
    selectStyle("");
  });

  // ---- every installed font, read straight from the Mac by the native helper
  // (native/frx_fonts_host.py). The last list is cached so the picker opens instantly,
  // then refreshed in the background each time the popup opens.
  const HOST = "frontend_remix_fonts";
  const INSTALL_CMD = "bash ~/frontendremix/src/native/install.sh";
  const PASTE_CMD = "system_profiler SPFontsDataType | sed -n 's/^ *Family: //p' | sort -u | pbcopy";
  const imp = {
    toggle: document.getElementById("frx-import-toggle"),
    panel: document.getElementById("frx-import"),
    cmd: document.getElementById("frx-import-cmd"),
    copy: document.getElementById("frx-import-copy"),
    pasteCmd: document.getElementById("frx-paste-cmd"),
    text: document.getElementById("frx-import-text"),
    save: document.getElementById("frx-import-save"),
    pasteNote: document.getElementById("frx-paste-note"),
    note: document.getElementById("frx-import-note"),
    retry: document.getElementById("frx-import-retry")
  };
  let helperOk = null;          // null = not asked yet, true/false after asking
  let scanning = false;

  function paintImportToggle() {
    if (scanning) { imp.toggle.textContent = "Scanning your fonts\u2026"; return; }
    if (helperOk) {
      imp.toggle.textContent = importedFonts.length + " fonts on this Mac \u2014 rescan";
      imp.toggle.title = "Do a deep rescan (also finds fonts activated by font managers)";
    } else {
      imp.toggle.textContent = importedFonts.length ? importedFonts.length + " fonts \u2014 show all" : "Show all my fonts";
      imp.toggle.title = "";
    }
  }
  async function saveFontList(names) {
    importedFonts = names; systemFonts = null;   // picker re-reads the list next time it opens
    try { await api.storage.local.set({ frxImportedFonts: names }); } catch (e) { /* ignore */ }
  }
  async function syncInstalledFonts(cmd) {
    scanning = true; paintImportToggle();
    try {
      const res = await api.runtime.sendNativeMessage(HOST, { cmd: cmd || "list" });
      if (!res || !res.ok || !Array.isArray(res.fonts)) throw new Error((res && res.error) || "No reply from the font helper.");
      helperOk = true;
      await saveFontList(res.fonts);
      imp.panel.hidden = true;
      return res.fonts.length;
    } catch (e) {
      helperOk = false;
      imp.note.textContent = /No such native application|not found/i.test(String(e && e.message))
        ? "The font helper isn't set up yet."
        : "Font helper error: " + ((e && e.message) || e);
      return -1;
    } finally {
      scanning = false; paintImportToggle();
    }
  }

  imp.cmd.textContent = INSTALL_CMD;
  imp.pasteCmd.textContent = PASTE_CMD;
  imp.toggle.addEventListener("click", function () {
    if (scanning) return;
    queryChromeFonts();
    if (helperOk) {
      syncInstalledFonts("deep").then(function (n) {
        if (n >= 0) { setStatus("Found " + n + " fonts on this Mac.", "ok"); load(); }
      });
    } else {
      imp.panel.hidden = !imp.panel.hidden;
    }
  });
  imp.copy.addEventListener("click", function () {
    navigator.clipboard.writeText(INSTALL_CMD).then(function () { imp.copy.textContent = "Copied!"; });
  });
  imp.retry.addEventListener("click", function () {
    imp.note.textContent = "Checking\u2026";
    syncInstalledFonts("list").then(function (n) {
      if (n >= 0) { setStatus("Found " + n + " fonts on this Mac.", "ok"); load(); }
    });
  });
  imp.save.addEventListener("click", async function () {
    const names = Array.from(new Set(imp.text.value.split(/\r?\n/).map(function (l) { return l.trim(); })
      .filter(function (l) { return l && l.length < 120 && !/^[.#]/.test(l); })));
    if (!names.length) { imp.pasteNote.textContent = "Paste the list first (run the command, then paste here)."; return; }
    await saveFontList(names);
    imp.pasteNote.textContent = "Saved " + names.length + " fonts.";
    imp.text.value = ""; imp.panel.hidden = true;
    paintImportToggle();
  });

  // ---- site access in Firefox
  const perm = {
    box: document.getElementById("frx-perm"),
    grant: document.getElementById("frx-perm-grant")
  };
  async function checkPermissions() {
    if (!api.permissions || !api.permissions.contains) return;
    try {
      const has = await api.permissions.contains({ origins: ["<all_urls>"] });
      if (!has) perm.box.hidden = false;
      else perm.box.hidden = true;
    } catch (e) { /* ignore */ }
  }
  perm.grant.addEventListener("click", function () {
    if (!api.permissions || !api.permissions.request) return;
    api.permissions.request({ origins: ["<all_urls>"] }).then(function (granted) {
      if (granted) { perm.box.hidden = true; tabId = null; load(); }
    }).catch(function () { /* ignore */ });
  });

  // ---- boot
  loadImportedFonts().then(function () {
    paintImportToggle();
    return syncInstalledFonts("list");   // refresh the installed-font list in the background
  }).then(function () {
    return load();
  }).then(function () {
    return toContent({ type: "FRX_GET_STYLE" });
  }).then(function (r) {
    if (r && r.ok) {
      currentStyle = r.style || "";
      els.stylePicker.value = currentStyle;
      els.styleStatus.textContent = currentStyle ? "Current style: " + (STYLES[currentStyle] || currentStyle) + "." : "";
    }
  }).then(checkPermissions);
})();
