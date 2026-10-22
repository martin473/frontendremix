/* Frontend Remix background */
(function () {
  "use strict";
  const api = typeof browser !== "undefined" ? browser : chrome;
  if (!api || !api.runtime || !api.runtime.onMessage) return;
  const FILES = ["content/content.js"];
  function injectable(tab) { return !!(tab && tab.url && (/^https?:/i.test(tab.url) || /^file:/i.test(tab.url))); }
  async function ensure(tabId) { try { await api.tabs.sendMessage(tabId, {type:"FRX_PING"}); return true; } catch (e) { try { await api.scripting.executeScript({target:{tabId:tabId}, files:FILES}); return true; } catch (err) { return false; } } }
  async function forward(tabId, payload) { const ready = await ensure(tabId); if (!ready) return {ok:false, error:"Cannot access this page."}; try { const r = await api.tabs.sendMessage(tabId, payload); return r || {ok:false, error:"No response"}; } catch (e) { return {ok:false, error:String(e && e.message ? e.message : e)}; } }
