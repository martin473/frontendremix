/* Frontend Remix style engine */
(function () {
"use strict";
if (window.__frxStyleEngine) return;
var api = typeof browser !== "undefined" ? browser : chrome;
var currentStyle = "";
var CATALOG={flat:{label:'Flat'},material:{label:'Material'},brutalist:{label:'Brutalist'},'frutiger-aero':{label:'Frutiger Aero'},claymation:{label:'Claymation'}};
var FILES=['fonts.css','borders.css','buttons.css','spacing.css','layout.css'];
var