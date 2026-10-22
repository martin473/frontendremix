/* Frontend Remix style engine */
(function () {
"use strict";
if (window.__frxStyleEngine) return;
var api = typeof browser !== "undefined" ? browser : chrome;
var currentStyle = "";
var CATALOG={flat:{label:'Flat'},material:{label:'Material'},brutalist:{label:'Brutalist'},'frutiger-aero':{label:'Frutiger Aero'},claymation:{label:'Claymation'}};
var FILES=['fonts.css','borders.css','buttons.css','spacing.css','layout.css'];
var LP='_frx_style_link',IS='frx_style_icons';
var ICONS=['check','arrow','close','settings'];
function valid(s){return typeof s==='string'&&Object.prototype.hasOwnProperty.call(CATALOG,s);}
function assetUrl(s,f){var rel='assets/'+s+'/'+f;try{if(api&&api.runtime&&api.runtime.getURL){return api.runtime.getURL(rel);}}catch(e){}return rel;}
function rmLinks(){var n=document.querySelectorAll('link[id^="'+LP+'"]');for(var i=0;i<n.length;i++){if(n[i].parentNode)n[i].parentNode.removeChild(n[i]);}}
function rmIcons(){var st=document.getElementById(IS);if(st&&st.parentNode)st.parentNode.removeChild(st);var im=document.querySelectorAll('img[data-frx-style-icon]');for(var i=0;i<im.length;i++){if(im[i].parentNode)im[i].parentNode.removeChild(im[i]);}}
function addLink(s,f,i){var l=document.createElement('link');l.rel='stylesheet';l.type='text/css';l.id=LP+i;l.setAttribute('data-frx-style',s);l.href=assetUrl(s,f);(document.head||document.documentElement).appendChild(l);}
function applyIcons(s){var css='';for(var i=0;i<ICONS.length;i++){var n=ICONS[i];css+='img[data-frx-style-icon="'+n+'"]{content:url("'+assetUrl(s,'icons/'+n+'.svg')+'");}
';}var st=document.createElement('style');st.id=IS;st.setAttribute('data-frx-style',s);st.textContent=css;(document.head||document.documentElement).appendChild(st);tagIcons();}
var HEUR=[['check',/check|tick|done|success/i],['close',/close|dismiss|remove|cross|x-mark/i],['settings',/setting|gear|cog|config|prefer/i],['arrow',/arrow|next|prev|chevron|caret|back|forward/i]];
function tagIcons(){var im=document.querySelectorAll('img'),c=0;for(var j=0;j<im.length;j++){if(c++>600)break;var e=im[j];if(!e||e.getAttribute('data-frx-style-icon'))continue;var w=e.naturalWidth||e.width||0,h=e.naturalHeight||e.height||0;if(w&&h&&(w>64||h>64))continue;var hay=(e.getAttribute('alt')||'')+' '+(e.getAttribute('title')||'')+' '+(e.getAttribute('src')||'')+' '+(e.getAttribute('class')||'');for(var k=0;k<HEUR.length;k++){if(HEUR[k][1].test(hay)){e.setAttribute('data-frx-style-icon',HEUR[k][0]);break;}}}}
function applyStyle(s){if(!valid(s)){clearStyle();return {ok:true,style:''};}rmLinks();rmIcons();for(var i=0;i<FILES.length;i++)addLink(s,FILES[i],i);try{applyIcons(s);}catch(e){}currentStyle=s;document.documentElement.setAttribute('data-frx-style',s);return {ok:true,style:s};}
function applyStyle(s){if(!valid(s)){clearStyle();return {ok:true,style:''};}rmLinks();rmIcons();for(var i=0;i<FILES.length;i++)addLink(s,FILES[i],i);try{applyIcons(s);}catch(e){}currentStyle=s;document.documentElement.setAttribute('data-frx-style',s);return {ok:true,style:s};}
window.__frxStyleEngine={CATALOG:CATALOG,FILES:FILES,assetUrl:assetUrl,applyStyle:applyStyle,clearStyle:clearStyle,getCurrentStyle:getCurrentStyle,isValidStyle:valid};
})();
