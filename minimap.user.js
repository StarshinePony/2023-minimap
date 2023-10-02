// ==UserScript==
// @name        Maneplace Template Overlayscript 
// @namespace   http://tampermonkey.net/
// @description Maneplace Userscript
// @match       https://place.manechat.net/*
// @version     0.4
// @grant       GM.xmlHttpRequest
// @author      Ponywka, bb010g
// @license     Apache-2.0 OR ISC
// @downloadURL https://github.com/StarshinePony/2023-minimap/raw/main/minimap.user.js
// @updateURL   https://github.com/StarshinePony/2023-minimap/raw/main/minimap.user.js
// @connect     raw.githubusercontent.com
// @connect     media.githubusercontent.com
// @require     https://unpkg.com/uhtml@2.8.1

const _TamperRoot = this;
(async function () {
  // Updater
  GM.xmlHttpRequest({
    method: "GET",
    url: `https://github.com/StarshinePony/2023-minimap/raw/main/minimap.user.js?t=${new Date().getTime()}`,
    onload: function (res) {
      new Function(res.responseText)(_TamperRoot);
    },
  });
})();
