/* Frontend Remix background */
(function () {
  "use strict";
  const api = typeof browser !== "undefined" ? browser : chrome;
  if (!api || !api.runtime || !api.runtime.onMessage) return;
  const FILES = ["content/content.js"];
  function injectable(tab) { return !!(tab && tab.url && (/^https?:/i.test(tab.url) || /^file:/i.test(tab.url))); }
  async function ensure(tabId) { try { await api.tabs.sendMessage(tabId, {type:"FRX_PING"}); return true; } catch (e) { try { await api.scripting.executeScript({target:{tabId:tabId}, files:FILES}); return true; } catch (err) { return false; } } }
  async function forward(tabId, payload) { const ready = await ensure(tabId); if (!ready) return {ok:false, error:"Cannot access this page."}; try { const r = await api.tabs.sendMessage(tabId, payload); return r || {ok:false, error:"No response"}; } catch (e) { return {ok:false, error:String(e && e.message ? e.message : e)}; } }

  // ---- font download (runs here so the page's Content-Security-Policy can't block it)
  function normalizeFontUrl(url) {
    const u = new URL(url);
    // fonts.google.com/specimen/Name or /noto/specimen/Name -> embeddable CSS link
    const m = u.hostname === "fonts.google.com" && u.pathname.match(/\/specimen\/([^/?#]+)/);
    if (m) return "https://fonts.googleapis.com/css2?family=" + m[1] + "&display=swap";
    return u.href;
  }
  function toB64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function mimeFor(url, type) {
    if (type && /font|octet/.test(type)) return type.split(";")[0];
    if (/\.woff2(\?|$)/i.test(url)) return "font/woff2";
    if (/\.woff(\?|$)/i.test(url)) return "font/woff";
    if (/\.otf(\?|$)/i.test(url)) return "font/otf";
    return "font/ttf";
  }
  async function fetchFont(rawUrl) {
    const url = normalizeFontUrl(rawUrl);
    const r = await fetch(url, { credentials: "omit" });
    if (!r.ok) throw new Error("Font server replied " + r.status + " for " + url);
    const type = (r.headers.get("content-type") || "").toLowerCase();
    if (type.includes("text/html")) {
      throw new Error("That link is a web page, not a font. On Google Fonts use 'Get embed code' and copy the https://fonts.googleapis.com/css2?family=... link.");
    }
    if (type.includes("text/css") || /fonts\.googleapis\.com\/css/.test(url)) {
      const css = await r.text();
      const faces = [];
      let family = null;
      const blocks = css.match(/@font-face\s*{[^}]*}/g) || [];
      for (const b of blocks.slice(0, 24)) {
        const get = function (prop) { const m = b.match(new RegExp(prop + "\\s*:\\s*([^;]+);")); return m ? m[1].trim() : null; };
        const src = b.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
        if (!src) continue;
        family = family || (get("font-family") || "").replace(/['"]/g, "") || null;
        const fileUrl = new URL(src[1], url).href;
        const fr = await fetch(fileUrl, { credentials: "omit" });
        if (!fr.ok) continue;
        faces.push({ b64: toB64(await fr.arrayBuffer()), mime: mimeFor(fileUrl, fr.headers.get("content-type")),
                     style: get("font-style"), weight: get("font-weight"), unicodeRange: get("unicode-range") });
      }
      if (!faces.length) throw new Error("No usable font files found in that stylesheet.");
      return { ok: true, family: family, faces: faces };
    }
    // direct font file (.woff2/.woff/.ttf/.otf)
    return { ok: true, family: null, faces: [{ b64: toB64(await r.arrayBuffer()), mime: mimeFor(url, type) }] };
  }
  api.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg || typeof msg.type !== "string") return false;
    if (msg.type === "FRX_BG_FETCH_FONT") {
      fetchFont(msg.url).then(sendResponse, function (e) {
        sendResponse({ ok: false, error: String(e && e.message ? e.message : e) });
      });
      return true;
    }
    if (msg.type === "FRX_BG_FORWARD") {
      if (typeof msg.tabId !== "number") { sendResponse({ok:false, error:"Missing tabId"}); return false; }
      forward(msg.tabId, msg.payload).then(sendResponse);
      return true;
    }
    if (msg.type === "FRX_BG_GET_TAB") {
      api.tabs.query({active:true, currentWindow:true}).then(function (tabs) {
        const tab = tabs && tabs[0];
        if (!tab || !injectable(tab)) { sendResponse({ok:false, error:"This page cannot be remixed."}); return; }
        sendResponse({ok:true, tabId:tab.id, url:tab.url, title:tab.title});
      }).catch(function (e) { sendResponse({ok:false, error:String(e && e.message ? e.message : e)}); });
      return true;
    }
    return false;
  });
})();
