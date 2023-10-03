// ==UserScript==
// @name        Maneplace Template Minimap Script with Auto Updater
// @namespace   http://tampermonkey.net/
// @description MLP Minimap r/Place
// @match       https://place.manechat.net/*
// @version     0.4
// @grant       GM.xmlHttpRequest
// @author      Ponywka, bb010g
// @license     Apache-2.0 OR ISC
// @downloadURL https://raw.githubusercontent.com/raw/StarshinePony/2023-minimap/main/minimap.impl.user.js
// @updateURL   https://raw.githubusercontent.com/raw/StarshinePony/2023-minimap/main/minimap.impl.user.js
// @connect     raw.githubusercontent.com
// @connect     *
// @connect     media.githubusercontent.com
// @require     https://unpkg.com/uhtml@2.8.1
// ==/UserScript==
// SPDX-FileCopyrightText: 2022 Ponywka
// SPDX-License-Identifier: Apache-2.0 OR ISC
const mlp_GM = "GM" in this ? this.GM : arguments[0].GM;
const mlp_uhtml = "uhtml" in this ? this.uhtml : arguments[0].uhtml;
const _TamperRoot = this;
(async function () {
    // Updater
    GM.xmlHttpRequest({
        method: "GET",
        url: `https://raw.githubusercontent.com/StarshinePony/2023-minimap/main/minimap.impl.user.js?t=${new Date().getTime()}`,
        onload: function (res) {
            new Function(res.responseText)(_TamperRoot);
        },
    });
})();
