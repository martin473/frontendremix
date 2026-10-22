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
