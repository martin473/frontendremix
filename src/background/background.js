/* Frontend Remix background */
(function () {
  "use strict";
  const api = typeof browser !== "undefined" ? browser : chrome;
  if (!api || !api.runtime || !api.runtime.onMessage) return;
  const FILES = ["content/content.js"];
  function injectable(tab) { return !!(tab && tab.url && (/^https?:/i.test(tab.url) || /^file:/i.test(tab.url))); }
  async function ensure(tabId) { try { await api.tabs.sendMessage(tabId, {type:"FRX_PING"}); return true; } catch (e) { try { await api.scripting.executeScript({target:{tabId:tabId}, files:FILES}); return true; } catch (err) { return false; } } }
  async function forward(tabId, payload) { const ready = await ensure(tabId); if (!ready) return {ok:false, error:"Cannot access this page."}; try { const r = await api.tabs.sendMessage(tabId, payload); return r || {ok:false, error:"No response"}; } catch (e) { return {ok:false, error:String(e && e.message ? e.message : e)}; } }
  api.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg || typeof msg.type !== "string") return false;
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
