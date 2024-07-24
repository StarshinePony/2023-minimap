// ==UserScript==
// @name        Mane Place Minimap
// @namespace   http://tampermonkey.net/
// @description BONEYS
// @match       https://pixels.mares.place/*
// @version     0.3
// @grant       GM.xmlHttpRequest
// @author      Starshine
// @license     Apache-2.0 OR ISC
// @downloadURL https://github.com/StarshinePony/2023-minimap/raw/main/minimap.impl.user.js
// @updateURL   https://github.com/StarshinePony/2023-minimap/raw/main/minimap.impl.user.js
// @connect     raw.githubusercontent.com
// @connect     media.githubusercontent.com
// @connect     media.discordapp.net
// @connect     *
// @require     https://unpkg.com/uhtml@2.8.1
// ==/UserScript==
// SPDX-FileCopyrightText: 2022 bb010g, Ember Hearth, LydianLights, octylFractal, Ponywka
// SPDX-License-Identifier: Apache-2.0 OR ISC

// To format: `npx prettier --print-width 100 -w minimap.impl.user.js`

const mlp_GM = "GM" in this ? this.GM : arguments[0].GM;
const mlp_uhtml = "uhtml" in this ? this.uhtml : arguments[0].uhtml;

const { html, render } = mlp_uhtml;

(async function () {
  //document.querySelector("faceplate-toast")
  //document.createElement('mona-lisa-app').isFullScreen.globalState.state = true;
  const embed = await new Promise((resolve) => {
    let interval = setInterval(() => {
      try {
        const embed = document.getElementById("main");
        console.log("Found embed. Good!");
        resolve(embed);
        clearInterval(interval);
      } catch (e) {
        console.error("Found embed. Trying again...");
      }
    }, 1);
  });
  const picker = await new Promise((resolve) => {
    let interval = setInterval(() => {
      try {
        const embed = document.getElementById("picker");
        console.log("Found picker. Good!");
        resolve(embed);
        clearInterval(interval);
      } catch (e) {
        console.error("Found picker. Trying again...");
      }
    }, 1);
  });

  const rPlaceCanvas = await new Promise((resolve) => {
    let interval = setInterval(() => {
      try {
        const rPlaceCanvas = document.getElementById("canvas");
        console.log("Found canvas. Good!");
        resolve(rPlaceCanvas);
        clearInterval(interval);
      } catch (e) {
        console.error("Failed to attach to canvas. Trying again...");
      }
    }, 1);
  });

  const selector = await new Promise((resolve) => {
    let interval = setInterval(() => {
      try {
        const selector = document.getElementById("selector");
        console.log("Found selector! Good!");
        resolve(selector);
        clearInterval(interval);
      } catch (e) {
        console.error("Failed to attach to selector. Trying again...");
      }
    }, 1);
  });

  //bed.style.transform = "matrix(1, 0, 0, 1, " + (rPlaceCanvas.width) + ", " + (rPlaceCanvas.height / 4) + ")";

  const rPlacePixelSize = 10;
  const rPlaceTemplatesGithubLfs = true;
  const rPlaceTemplateBaseUrl = rPlaceTemplatesGithubLfs
    ? "https://media.githubusercontent.com/media/StarshinePony/2023-minimap/main"
    : "https://raw.githubusercontent.com/StarshinePony/2023-minimap/main";
  const getRPlaceTemplateUrl = function (templateName, type) {
    return `${rPlaceTemplateBaseUrl}/${templateName}/${type}.png`;
  };
  const rPlaceTemplateNames = [];
  const rPlaceTemplates = new Map();

  let rPlaceTemplateName;
  let rPlaceTemplate;
  let rPlaceMask = undefined;
  const setRPlaceTemplate = function (templateName) {
    const template = rPlaceTemplates.get(templateName);
    if (template === undefined) {
      console.log("Invalid /r/place template name:", templateName);
      return;
    }
    rPlaceTemplateName = templateName;
    rPlaceTemplate = template;
  };
  const addRPlaceTemplate = function (templateName, options) {
    rPlaceTemplates.set(templateName, {
      canvasUrl: getRPlaceTemplateUrl(templateName, "canvas"),
      botUrl: options.bot ? getRPlaceTemplateUrl(templateName, "bot") : true,
      maskUrl: options.mask ? getRPlaceTemplateUrl(templateName, "mask") : true,
    });
    rPlaceTemplateNames.push(templateName);
  };
  addRPlaceTemplate("mareplace", { bot: false, mask: false });
  addRPlaceTemplate("mareplace-background", { bot: true, mask: false, })

  const templateStoragePrefix = "template_";
  const addCustomTemplate = (name, url, urlBot, urlMask, options) => {
    rPlaceTemplates.set(name, {
      canvasUrl: url,
      botUrl: options.bot ? (urlBot ? urlBot : url) : undefined,
      maskUrl: options.mask ? (urlMask ? urlMask : undefined) : undefined,
    });
    rPlaceTemplateNames.push(name);
  };
  const addTemplateToStorage = (name, url, botUrl, maskUrl, options) => {
    localStorage.setItem(
      templateStoragePrefix + name,
      JSON.stringify({
        url: url,
        botUrl: botUrl,
        maskUrl: maskUrl,
        options: options,
      })
    );
  };
  const removeCustomTemplate = (name) => {
    rPlaceTemplates.delete(name);

    const index = rPlaceTemplateNames.indexOf(name);
    if (index > -1) {
      rPlaceTemplateNames.splice(index, 1);
    }

    const previousTemplate = rPlaceTemplateNames[rPlaceTemplateNames.length - 1];
    setRPlaceTemplate(previousTemplate);
    settings.getSetting("templateName").setTemplate(previousTemplate);
    return index;
  };
  const removeTemplateFromStorage = (name) => {
    console.log(name);
    localStorage.removeItem(templateStoragePrefix + name);
  };
  const addTemplatesFromStorage = function () {
    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i);
      if (key.startsWith(templateStoragePrefix)) {
        const template = JSON.parse(localStorage.getItem(key));
        if (!template.url) {
          localStorage.removeItem(key);
          continue;
        }
        const name = key.replace(templateStoragePrefix, "");
        addCustomTemplate(
          name,
          template.url,
          template.botUrl ? template.botUrl : undefined,
          template.maskUrl ? template.maskUrl : undefined,
          template.options
        );
        lastAddedTemplate = name;
      }
    }
  };

  //addRPlaceTemplate("mareplace", { bot: true, mask: true });
  addTemplatesFromStorage();
  setRPlaceTemplate(rPlaceTemplateNames[0]);

  class Resizer {
    constructor(elResizer, elBlock, callback = () => { }) {
      var startX, startY, startWidth, startHeight;

      function doDrag(e) {
        elBlock.style.width = startWidth - e.clientX + startX + "px";
        elBlock.style.height = startHeight + e.clientY - startY + "px";
        callback();
      }

      function stopDrag(e) {
        document.documentElement.removeEventListener("mousemove", doDrag, false);
        document.documentElement.removeEventListener("mouseup", stopDrag, false);
      }

      function initDrag(e) {
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(elBlock).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(elBlock).height, 10);
        document.documentElement.addEventListener("mousemove", doDrag, false);
        document.documentElement.addEventListener("mouseup", stopDrag, false);
      }

      elResizer.addEventListener("mousedown", initDrag, false);
    }
  }

  class Emitter {
    constructor() {
      var delegate = document.createDocumentFragment();
      ["addEventListener", "dispatchEvent", "removeEventListener"].forEach(
        (f) => (this[f] = (...xs) => delegate[f](...xs))
      );
    }
  }

  const posEqualsPos = function (pos0, pos1) {
    if (pos0.x !== pos1.x) {
      return false;
    }
    if (pos0.y !== pos1.y) {
      return false;
    }
    if (pos0.scale !== pos1.scale) {
      return false;
    }
    return true;
  };

  class PosParser extends Emitter {
    parseCoordinateBlock() {
      var selector = document.getElementById("selector");

      // Get the transform property value
      var transformStyle = window.getComputedStyle(selector).getPropertyValue("transform");

      // Parse the transform matrix to extract the X and Y coordinates
      var transformValues = transformStyle.match(/matrix\(([^)]+)\)/)[1].split(',');
      // Get the element with id "main"
      var main = document.getElementById("main");

      // Get the transform property value
      var transformScale = window.getComputedStyle(main).getPropertyValue("transform");

      // Parse the transform matrix to extract the scale value
      var tras = transformScale.match(/matrix\(([^)]+)\)/)[1].split(',');

      // Extract the scale value (the 4th number in the matrix)
      var scale = parseFloat(transformScale[3]);
      const parsedData = transformValues
      const scaleData = tras
      if (parsedData) {
        return {
          x: parseInt(parsedData[4]),
          y: parseInt(parsedData[5]),
          scale: parseFloat(scaleData[3] / 9),
        };
      }
      return {
        x: 0,
        y: 0,
        scale: 0,
      };
    }

    constructor(coordinateBlock) {
      super();
      var _root = this;
      this.coordinateBlock = coordinateBlock;
      this.pos = {
        x: 0,
        y: 0,
        scale: 0,
      };

      requestAnimationFrame(function measure(time) {
        const coordinatesData = _root.parseCoordinateBlock();
        if (!posEqualsPos(_root.pos, coordinatesData)) {
          _root.pos = coordinatesData;
          _root.dispatchEvent(new Event("posChanged"));
        }
        requestAnimationFrame(measure);
      });
    }
  }

  const coordinateBlock = await new Promise((resolve) => {
    let interval = setInterval(() => {
      try {
        var selector = document.getElementById("selector");

        // Get the transform property value
        var transformStyle = window.getComputedStyle(selector).getPropertyValue("transform");

        // Parse the transform matrix to extract the X and Y coordinates
        var transformValues = transformStyle.match(/matrix\(([^)]+)\)/)[1].split(',');

        // Extract the X and Y coordinates
        var translateX = parseFloat(transformValues[4]);
        var translateY = parseFloat(transformValues[5]);
        const coordinateBlock = transformStyle;

        // Get the element with id "selector"
        resolve(coordinateBlock);
        clearInterval(interval);
        console.log("Found Coordinate Block YAY!");
      } catch (e) {

        console.error("Failed to attach to coordinate block. Trying again...");
        console.log("X Coordinate: " + translateX);
        console.log("Y Coordinate: " + translateY);
      }
    }, 1000);
  });

  const posParser = new PosParser(coordinateBlock);
  const docBody = document.querySelector("body");
  const htmlBlock = `<style>
  mlpminimap {
    display: block;
    color: white;
    width: 400px;
    height: 300px;
    position: absolute;
    top: 0%;
    right: 0%;
    background-color: rgba(0,0,0,.75);
    border: 1px solid black;
    overflow: hidden;
  }

  mlpminimap .map {
    position: absolute;
    margin: 0;
    max-width: unset;
    display: block;
    image-rendering: pixelated;
    pointer-events: none;
  }

  mlpminimap .crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    border: 2px solid red;
    transform: translateX(-50%) translateY(-50%);
  }

  mlpminimap #resizer {
    position: absolute;
    bottom: 0%;
    left: 0%;
    width: 0px;
    height: 0px;
    border-bottom: 10px solid red;
    border-left: 10px solid red;
    border-top: 10px solid transparent;
    border-right: 10px solid transparent;
  }

  mlpminimap .settings {
    position: absolute;
    background-color: rgba(0,0,0,.75);
  }

  mlpminimap .settings > div{
    display: none;
  }

  mlpminimap .settings > .alwaysshow{
    display: block;
  }

  mlpminimap:hover .settings > div{
    display: block;
  }

  mlpminimap .settings .clickable {
    cursor: pointer;
    user-select: none;
  }

  mlpminimap #noSleep {
	display: none;
  }
</style>
<mlpminimap>
  <img class="map">
  <div class="crosshair"></div>
  <div class="settings"></div>
  <div id="resizer"></div>
  <audio id="noSleep" src="https://hot-potato.reddit.com/media/interactions/select-color.mp3" playsinline></audio>
</mlpminimap>`;

  class CheckboxSetting {
    constructor(name, enabled = false, callback = function (setting) { }) {
      this.name = name;
      this.enabled = enabled;
      this.callback = callback;
    }
    // onchange(e) {
    //   this.enabled = e.target.checked;
    //   this.callback();
    // }
    onclick() {
      this.enabled = !this.enabled;
      this.callback(this);
    }
    htmlFor(ref, id) {
      // NOTE(Dusk): It looks like Reddit hijacks all native checkboxes.
      // const onchange = () => this.onchange();
      // return html.for(ref, id)`<label data-id=${id}>
      //   ${this.name}: <input type="checkbox" .checked=${this.enabled} onchange=${onchange} />
      // </label>`;
      const onclick = () => this.onclick();
      const classes = ["clickable"];
      this.enabled ? classes.push("alwaysshow") : null;
      return html.for(ref, id)`<div data-id=${id} class=${classes.join(" ")} onclick=${onclick}>
        ${this.name}: <span>${this.enabled ? "Enabled" : "Disabled"}</span>
      </div>`;
    }
  }

  class CycleSetting {
    constructor(
      name,
      values = ["Unset"],
      valueIx = 0,
      callback = function (setting) { },
      alwaysShow = false
    ) {
      this.name = name;
      this.values = values;
      this.valueIx = valueIx;
      this.callback = callback;
      this.alwaysShow = alwaysShow;
    }
    get value() {
      return this.values[this.valueIx];
    }
    setTemplate(name) {
      if (name) {
        this.valueIx = this.values.indexOf(name);
      } else {
        this.valueIx = this.values[this.values.length - 1];
      }
      this.callback(this);
    }
    onclick() {
      this.valueIx = (this.valueIx + 1) % this.values.length;
      this.callback(this);
    }
    htmlFor(ref, id) {
      const onclick = () => this.onclick();
      const classes = ["clickable"];
      this.alwaysShow ? classes.push("alwaysshow") : null;
      return html.for(ref, id)`<div data-id=${id} class=${classes.join(" ")} onclick=${onclick}>
        ${this.name}: <span>${this.value}</span>
      </div>`;
    }
  }

  class ButtonSetting {
    constructor(name, callback = function (setting) { }, alwaysShow = false) {
      this.name = name;
      this.callback = callback;
      this.alwaysShow = alwaysShow;
    }
    onclick() {
      this.callback(this);
    }
    htmlFor(ref, id) {
      const onclick = () => this.onclick();
      const classes = ["clickable"];
      this.alwaysShow ? classes.push("alwaysshow") : null;
      return html.for(ref, id)`<div data-id=${id} class=${classes.join(" ")} onclick=${onclick}>
        ${this.name}
      </div>`;
    }
  }

  class DisplaySetting {
    constructor(name, content, alwaysShow = false) {
      this.name = name;
      this.content = content;
      this.alwaysShow = alwaysShow;
    }
    htmlFor(ref, id) {
      const classes = [];
      this.alwaysShow ? classes.push("alwaysshow") : null;
      return html.for(ref, id)`<div data-id=${id} class=${classes.join(" ")}>${this.name}: ${this.content
        }</div>`;
    }
  }

  class Settings {
    settings = [];
    settingNames = new Map();
    settingsByName = new Map();

    constructor(settingsBlock, mlpMinimapBlock) {
      const _root = this;

      requestAnimationFrame(function measure(time) {
        render(settingsBlock, _root.htmlFor(mlpMinimapBlock, "settings"));
        requestAnimationFrame(measure);
      });
    }

    htmlFor(ref, id) {
      return html.for(ref, id)`${this.settings.map((setting) =>
        setting.htmlFor(this, this.settingNames.get(setting))
      )}`;
    }

    addSetting(name, setting) {
      this.settings.push(setting);
      this.settingNames.set(setting, name);
      this.settingsByName.set(name, setting);
    }

    getSetting(name) {
      return this.settingsByName.get(name);
    }
  }

  const htmlObject = document.createElement("div");
  htmlObject.innerHTML = htmlBlock;
  docBody.appendChild(htmlObject);
  const mlpMinimapBlock = htmlObject.querySelector("mlpminimap");

  const imageBlock = mlpMinimapBlock.querySelector(".map");
  const crosshairBlock = mlpMinimapBlock.querySelector(".crosshair");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = rPlaceCanvas.width;
  maskCanvas.height = rPlaceCanvas.height;
  const maskCtx = maskCanvas.getContext("2d");

  imageBlock.onload = function () {
    canvas.width = this.naturalWidth;
    canvas.height = this.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this, 0, 0);
  };

  let updateTemplate = function () { };

  const settingsBlock = mlpMinimapBlock.querySelector(".settings");
  const settings = new Settings(settingsBlock, mlpMinimapBlock);
  settings.addSetting(
    "templateName",
    new CycleSetting(
      "Template",
      rPlaceTemplateNames,
      0,
      function (templateNameSetting) {
        setRPlaceTemplate(templateNameSetting.value);
        updateTemplate();
      },
      true
    )
  );

  const noSleepAudio = mlpMinimapBlock.querySelector("#noSleep");
  noSleepAudio.volume = 0.1;

  setInterval(() => {
    if (settings.getSetting("botstability").enabled) {
      noSleepAudio.play();
    }
  }, 30000);
  // With help from Daaniea
  settings.addSetting(
    "addTemplate",
    new ButtonSetting("Add template", () => {
      const name = prompt(
        "Enter the template name: Make sure it doesn't match one of the existing templates!"
      );
      if (!name) {
        return;
      }
      if (rPlaceTemplateNames.includes(name)) {
        alert("Template name must not be the same as an existing template.");
        return;
      }
      const url = prompt("Enter the template url. Discord Media links also work.");
      if (!name) return;
      const botUrl = prompt("Optionally, enter the bot url. Discord Media links also work.");
      const maskUrl = prompt("Optionally, enter the mask url. Discord Media links also work.");
      const options = { bot: true, mask: true };
      addCustomTemplate(name, url, botUrl, maskUrl, options);
      addTemplateToStorage(name, url, botUrl, maskUrl, options);
      settings.getSetting("templateName").setTemplate(name);
      setRPlaceTemplate(name);
      updateTemplate();
    })
  );
  settings.addSetting(
    "deleteTemplate",
    new ButtonSetting("Delete current template", () => {
      if (rPlaceTemplateName === "mlp" || rPlaceTemplateName === "mlp-hearts") {
        alert("Can't delete the default template!");
        return;
      }

      const deletedTemplate = rPlaceTemplateName;
      let deletedIndex = removeCustomTemplate(deletedTemplate);
      removeTemplateFromStorage(deletedTemplate);

      if (deletedIndex < 0) {
        console.error("Something just went horribly wrong");
        return;
      }
    })
  );
  settings.addSetting(
    "autoRefresh",
    new CheckboxSetting("Auto Refresh", true, function (autoReloader) {
      console.log("Auto Refresh is enabled!")

    })
  );
  settings.addSetting(
    "autoColor",
    new CheckboxSetting("Auto color picker", true, function (autoColorPicker) {
      settings.getSetting("bot").enabled = false;
      updateTemplate();
    })
  );
  settings.addSetting(
    "autoHexPicker",
    new CheckboxSetting("Auto hex picker", false, function (autoHexPicker) {
      settings.getSetting("bot").enabled = false;
      settings.getSetting("autoColor").enabled = false;
      updateTemplate();
    })
  );
  settings.addSetting(
    "bot",
    new CheckboxSetting("Bot", false, function (botSetting) {
      settings.getSetting("autoColor").enabled = false;
      settings.getSetting("bot").enabled = false;
      settings.getSetting("autoHexPicker").enabled = false;
      updateTemplate();
    })
  );
  settings.addSetting(
    "botstability",
    new CheckboxSetting("Bot stability (🔇 Need to mute tab)", false)
  );
  settings.addSetting(
    "pixelDisplayProgress",
    new DisplaySetting("Current progress", "Unknown", true)
  );

  let botLock = false;

  // Fetch template, returns a Promise<Uint8Array>, on error returns the response object
  function fetchTemplate(url) {
    return new Promise((resolve, reject) => {
      mlp_GM.xmlHttpRequest({
        method: "GET",
        responseType: "arraybuffer",
        url: `${url}?t=${new Date().getTime()}`,
        onload: function (res) {
          resolve(new Uint8Array(res.response));
        },
        onerror: function (res) {
          reject(res);
        },
      });
    });
  }

  function getPngDataUrlForBytes(bytes) {
    return "data:image/png;base64," + btoa(String.fromCharCode.apply(null, bytes));
  }
  function autoReload() {
    setTimeout(() => {
      if (settings.getSetting("autoRefresh").enabled) {
        location.reload();
        console.log("Refreshed!");
      }
    }, 1 * 60 * 1000); // 2 minutes in milliseconds
  }
  autoReload();

  updateTemplate = function () {
    botLock = true;
    const rPlaceTemplateUrl =
      rPlaceTemplate.botUrl !== undefined && settings.getSetting("bot").enabled
        ? rPlaceTemplate.botUrl
        : rPlaceTemplate.canvasUrl;
    fetchTemplate(rPlaceTemplateUrl)
      .then((array) => {
        recalculateImagePos();
        imageBlock.src = getPngDataUrlForBytes(array);
        botLock = false;
      })
      .catch((err) => {
        console.error("Error updating template", err);
      });
    // Also update mask if needed
    if (typeof rPlaceTemplate.maskUrl !== "undefined") {
      fetchTemplate(rPlaceTemplate.maskUrl)
        .then((array) => {
          const img = new Image();
          img.src = getPngDataUrlForBytes(array);
          img.onload = () => {
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            maskCtx.drawImage(img, 0, 0);
            loadMask();
          };
        })
        .catch((err) => {
          console.error("Error updating mask", err);
        });
    } else {
      // Free memory if we don't need it.
      rPlaceMask = undefined;
    }
  };
  setInterval(updateTemplate, 1 * 60 * 1000);
  updateTemplate();

  function loadMask() {
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;

    rPlaceMask = new Array(maskCanvas.width * maskCanvas.height);
    for (let i = 0; i < rPlaceMask.length; i++) {
      // Grayscale, pick green channel!
      rPlaceMask[i] = maskData[i * 4 + 1];
    }
  }

  const NEXT_ART_MIN_DIST = 100; // art within this range is considered the same
  let currentLocationIndex = null;
  function findNextArt() {
    const templateData = ctx.getImageData(0, 0, rPlaceCanvas.width, rPlaceCanvas.height).data;

    const locations = [];
    for (let i = 0; i < templateData.length; i += 4) {
      if (templateData[i + 3] === 0) continue;
      const x = (i / 4) % rPlaceCanvas.width;
      const y = Math.floor(i / 4 / rPlaceCanvas.width);

      const isNearOtherArt = !!locations.find(
        (loc) => Math.abs(x - loc.x) < NEXT_ART_MIN_DIST && Math.abs(y - loc.y) < NEXT_ART_MIN_DIST
      );
      if (isNearOtherArt) continue;

      locations.push({ x, y });
    }

    const sortedLocations = locations.sort((a, b) => {
      if (a.x < b.x) return -1;
      if (a.x > b.x) return 1;
      if (a.y < b.y) return -1;
      if (a.y > b.y) return 1;
      return 0;
    });

    if (sortedLocations.length > 0) {
      if (currentLocationIndex === null) {
        currentLocationIndex = 0;
      } else {
        currentLocationIndex++;
        if (currentLocationIndex >= sortedLocations.length) {
          currentLocationIndex = 0;
        }
      }
      const nextLocation = sortedLocations[currentLocationIndex];
      console.log(`Moving to art at: [x: ${nextLocation.x}, y: ${nextLocation.y}]`);
      embed.camera.applyPosition(nextLocation);
    }
  }

  /**
   * Pick a pixel from a list of buckets
   *
   * The `position` argument is the position in the virtual pool to be selected.  See the
   * docs for `selectRandomPixelWeighted` for information on what this is hand how it
   * works
   *
   * @param {Map<number, [number, number][]>} buckets
   * @param {number} position
   * @return {[number, number]}
   */
  function pickFromBuckets(buckets, position) {
    // All of the buckets, sorted in order from highest priority to lowest priority
    const orderedBuckets = [...buckets.entries()] // Convert map to array of tuples
      .sort(([ka], [kb]) => kb - ka); // Order by key (priority) DESC

    console.log("Buckets:", orderedBuckets);

    // Select the position'th element from the buckets
    for (const [, bucket] of orderedBuckets) {
      if (bucket.length <= position) position -= bucket.length;
      else return bucket[position];
    }

    // If for some reason this breaks, just return a random pixel from the largest bucket
    const value = Array.from(buckets.keys()).reduce((a, b) => Math.max(a, b), 0);
    const bucket = buckets.get(value);
    return bucket[Math.floor(Math.random() * bucket.length)];
  }

  const FOCUS_AREA_SIZE = 1;
  /**
   * Select a random pixel weighted by the mask.
   *
   * The selection algorithm works as follows:
   * - Pixels are grouped into buckets based on the mask
   * - A virtual pool of {FOCUS_AREA_SIZE} of the highest priority pixels is defined.
   *   - If the highest priority bucket contains fewer than FOCUS_AREA_SIZE pixels, the
   *     next highest bucket is pulled from, and so on until the $FOCUS_AREA_SIZE pixel
   *     threshold is met.
   * - A pixel is picked from this virtual pool without any weighting
   *
   * This algorithm avoids the collision dangers of only using one bucket, while requiring
   * no delays, and ensures that the size of the selection pool is always constant.
   *
   * Another way of looking at this:
   * - If >= 75 pixels are missing from the crystal, 100% of the bots will be working there
   * - If 50 pixels are missing from the crystal, 67% of the bots will be working there
   * - If 25 pixels are missing from the crystal, 33% of the bots will be working there
   *
   * @param {[number, number][]} diff
   * @return {[number, number]}
   */
  function selectRandomPixelWeighted(diff) {
    // Build the buckets
    const buckets = new Map();
    var totalAvailablePixels = 0;
    for (let i = 0; i < diff.length; i++) {
      const coords = diff[i];
      const [x, y] = coords;
      const maskValue = rPlaceMask[x + y * rPlaceCanvas.width];
      if (maskValue === 0) {
        continue;
      }
      totalAvailablePixels++;
      const bucket = buckets.get(maskValue);
      if (bucket === undefined) {
        buckets.set(maskValue, [coords]);
      } else {
        bucket.push(coords);
      }
    }

    // Select from buckets
    // Position represents the index in the virtual pool that we are selecting
    const position = Math.floor(Math.random() * Math.min(FOCUS_AREA_SIZE, totalAvailablePixels));
    const pixel = pickFromBuckets(buckets, position);
    return pixel;
  }

  /**
   * Select a random pixel.
   *
   * @param {[number, number][]} diff
   * @return {{x: number, y: number}}
   */
  function selectRandomPixel(diff) {
    var pixel;
    if (rPlaceTemplate.maskUrl === undefined || rPlaceMask === undefined) {
      pixel = diff[Math.floor(Math.random() * diff.length)];
    } else {
      pixel = selectRandomPixelWeighted(diff);
    }
    const [x, y] = pixel;
    return { x, y };
  }

  const resizerBlock = mlpMinimapBlock.querySelector("#resizer");
  const resizerAction = new Resizer(resizerBlock, mlpMinimapBlock, recalculateImagePos);

  function getMinimapSize() {
    return {
      width: mlpMinimapBlock.clientWidth,
      height: mlpMinimapBlock.clientHeight,
    };
  }

  const colorElements = document.querySelectorAll("#colors .color");
  const palette = [];

  for (const colorElement of colorElements) {
    const dataColor = colorElement.getAttribute("data-color");
    console.log(dataColor)
    const style = colorElement.style.backgroundColor;

    // Extract RGB values from the style property
    const matches = style.match(/rgb\((\d+), (\d+), (\d+)\)/);

    if (matches) {
      const red = matches[1];
      const green = matches[2];
      const blue = matches[3];
      palette.push({
        dataColor: parseInt(dataColor),
        rgb: `rgb(${red}, ${green}, ${blue})`,
      });
    }
  }

  console.log(palette);

  function getColorElementById(colorId) {
    return document.querySelector(`#colors .color[data-color="${colorId}"]`);
  }

  // Usage example:
  // Pass the color ID you want to fetch the element for
  let colorIdToFetch = 0; // Replace with the desired color ID
  function autoColorPick(imageData) {
    if (imageData.data[3] !== 255) return;

    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];

    const colorElements = document.querySelectorAll("#colors .color");

    let diff = [];
    for (const colorElement of colorElements) {
      const [, rValue, gValue, bValue] = colorElement.style.backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/);

      const colorDiff = Math.abs(r - parseInt(rValue)) + Math.abs(g - parseInt(gValue)) + Math.abs(b - parseInt(bValue));
      diff.push(colorDiff);
    }

    let correctColorID = 0;
    for (let i = 0; i < diff.length; i++) {
      if (diff[correctColorID] > diff[i]) correctColorID = i;
    }

    // Reset the class for all color elements to "color"
    colorElements.forEach((colorElement) => {
      colorElement.classList.remove("picked");
    });

    // Set the class of the selected color element to "color picked"
    colorElements[correctColorID].classList.add("picked");

    // Do something with the selectedColor, for example, log it
    const selectedColor = colorElements[correctColorID].getAttribute("data-color");
    const element = getColorElementById(selectedColor)
    pickColor(element)
  }
  function rgbToHex(r, g, b) {
    // Ensure that the values are within the valid range
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // Convert each component to a two-digit hex code
    const hexR = r.toString(16).padStart(2, '0');
    const hexG = g.toString(16).padStart(2, '0');
    const hexB = b.toString(16).padStart(2, '0');

    // Concatenate the hex codes
    return `#${hexR}${hexG}${hexB}`;
  }
  function createColorElement(imageData) {
    if (imageData.data[3] !== 255) return;

    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];
    let color = rgbToHex(r, g, b)


    const hexColorContainer = document.getElementById("hexColor")


    let hexWithoutHash = color.startsWith("#") ? color.slice(1) : color;
    let rgbInt = parseInt(hexWithoutHash, 16);
    hexColorContainer.innerHTML = "";
    const colorButton = document.createElement("div");
    colorButton.className = "color";
    colorButton.dataset.color = rgbInt;
    colorButton.style.backgroundColor = rgbIntToHex(rgbInt);
    colorButton.onpointerup = () => pickColor(colorButton);
    hexColorContainer.appendChild(colorButton)
  }
  function autoHexPick() {


    const hexColorContainer = document.getElementById("hexColor")
    const colorElement = hexColorContainer.querySelector(".color")

    // Do something with the selectedColor, for example, log it
    //const selectedColor = colorElements.getAttribute("data-color");
    //const element = getColorElementById(selectedColor)
    pickColor(colorElement)
  }
  function botPick(imageData) {
    if (imageData.data[3] !== 255) return;

    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];

    const colorElements = document.querySelectorAll("#colors .color");

    let diff = [];
    for (const colorElement of colorElements) {
      const [, rValue, gValue, bValue] = colorElement.style.backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/);

      const colorDiff = Math.abs(r - parseInt(rValue)) + Math.abs(g - parseInt(gValue)) + Math.abs(b - parseInt(bValue));
      diff.push(colorDiff);
    }

    let correctColorID = 0;
    for (let i = 0; i < diff.length; i++) {
      if (diff[correctColorID] > diff[i]) correctColorID = i;
    }

    // Reset the class for all color elements to "color"
    colorElements.forEach((colorElement) => {
      colorElement.classList.remove("picked");
    });

    // Set the class of the selected color element to "color picked"
    colorElements[correctColorID].classList.add("picked");

    // Do something with the selectedColor, for example, log it
    const selectedColor = colorElements[correctColorID].getAttribute("data-color");
    const element = getColorElementById(selectedColor)
    return element.dataset.color
  }

  function intToHex(int1) {
    return ("0" + int1.toString(16)).slice(-2);
  }

  function recalculateImagePos() {
    const coordinatesData = posParser.pos;
    const minimapData = getMinimapSize();
    imageBlock.style.width = `${imageBlock.naturalWidth * rPlacePixelSize * coordinatesData.scale
      }px`;
    imageBlock.style.height = `${imageBlock.naturalHeight * rPlacePixelSize * coordinatesData.scale
      }px`;
    imageBlock.style["margin-left"] = `${-1 *
      ((coordinatesData.x * rPlacePixelSize + rPlacePixelSize / 2) * coordinatesData.scale -
        minimapData.width / 2)
      }px`;
    imageBlock.style["margin-top"] = `${-1 *
      ((coordinatesData.y * rPlacePixelSize + rPlacePixelSize / 2) * coordinatesData.scale -
        minimapData.height / 2)
      }px`;
    crosshairBlock.style.width = `${rPlacePixelSize * coordinatesData.scale}px`;
    crosshairBlock.style.height = `${rPlacePixelSize * coordinatesData.scale}px`;
  }

  posParser.addEventListener("posChanged", () => {
    recalculateImagePos();
    if (settings.getSetting("autoColor").enabled) {
      try {
        const imageData = ctx.getImageData(posParser.pos.x, posParser.pos.y, 1, 1);
        autoColorPick(imageData);
      } catch (e) {
        console.error(e);
      }
    }
    if (settings.getSetting("autoHexPicker").enabled) {
      try {
        const imageData = ctx.getImageData(posParser.pos.x, posParser.pos.y, 1, 1);
        createColorElement(imageData);
        autoHexPick();
      } catch (e) {
        console.error(e);
      }
    }
  });
  const botCanvas = document.createElement("canvas");
  botCanvas.width = rPlaceCanvas.width;
  botCanvas.height = rPlaceCanvas.height;
  const botCtx = botCanvas.getContext("2d");

  function getDiff(botCanvasWidth, botCanvasHeight, botCtx, ctx) {
    const currentData = botCtx.getImageData(0, 0, botCanvasWidth, botCanvasHeight).data;
    const templateData = ctx.getImageData(0, 0, botCanvasWidth, botCanvasHeight).data;

    const diff = [];
    var nCisPixels = 0; // count of non-transparent pixels

    for (let i = 0; i < templateData.length / 4; i++) {
      if (currentData[i * 4 + 3] === 0) continue;
      nCisPixels++;
      if (
        templateData[i * 4 + 0] !== currentData[i * 4 + 0] ||
        templateData[i * 4 + 1] !== currentData[i * 4 + 1] ||
        templateData[i * 4 + 2] !== currentData[i * 4 + 2]
      ) {
        const x = i % botCanvasWidth;
        const y = (i - x) / botCanvasWidth;
        diff.push([x, y]);
      }
    }

    return [diff, nCisPixels];
  }

  function waitMs(ms) {
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve();
      }, ms)
    );
  }

  function log() {
    console.log(`[${new Date().toISOString()}]`, ...arguments);
  }

  function logError() {
    console.error(`[${new Date().toISOString()}]`, ...arguments);
  }

  const botTimeout = 5000;
  const botAfterPlaceTimeout = 3000;
  (async () => {
    while (true) {
      // Update the minimap image (necessary for checking the diff)
      botCtx.clearRect(0, 0, botCanvas.width, botCanvas.height);
      botCtx.drawImage(canvas, 0, 0);
      botCtx.globalCompositeOperation = "source-in";
      botCtx.drawImage(rPlaceCanvas, 0, 0);
      botCtx.globalCompositeOperation = "source-over";

      // Compute the diff
      const diffAndCisPixels = getDiff(botCanvas.width, botCanvas.height, botCtx, ctx);
      const diff = diffAndCisPixels[0];
      const nCisPixels = diffAndCisPixels[1];

      // Update the display with current stats
      const nMissingPixels = nCisPixels - diff.length;
      const percentage = ((100 * nMissingPixels) / nCisPixels).toPrecision(3);
      settings.getSetting("pixelDisplayProgress").content = html`<span style="font-weight: bold;"
        >${percentage}% (${nMissingPixels}/${nCisPixels})</span
      >`;

      if (settings.getSetting("bot").enabled && !botLock) {
        if (rPlaceTemplate.botUrl === undefined) {
          return;
        }
        embed.wakeUp();

        if (settings.getSetting("botstability").enabled) {
          // Move camera to center
          embed.camera.applyPosition({
            x: Math.floor(rPlaceCanvas.width / 2),
            y: Math.floor(rPlaceCanvas.height / 2),
            zoom: 0,
          });
        }

        const timeOutPillBlock = embed.shadowRoot
          .querySelector("mona-lisa-status-pill")
          .shadowRoot.querySelector("div");
        log(
          `Status: ${percentage}% (${nMissingPixels}/${nCisPixels}) [${timeOutPillBlock.innerText}]`
        );

        if (!embed.nextTileAvailableIn && diff.length > 0) {
          const randPixel = selectRandomPixel(diff);
          const imageDataRight = ctx.getImageData(randPixel.x, randPixel.y, 1, 1);
          autoColorPick(imageDataRight);
          embed.camera.applyPosition(randPixel);
          embed.showColorPicker = true;
          const selectedColor = embed.selectedColor;
          embed
            .onConfirmPixel()
            .then(() => {
              log(`Placed [x: ${randPixel.x}, y: ${randPixel.y}, color: ${selectedColor}]`);
            })
            .catch(() => {
              logError(`FAILED! [x: ${randPixel.x}, y: ${randPixel.y}, color: ${selectedColor}]`);
            });
          await waitMs(botAfterPlaceTimeout);
        }
      }

      await waitMs(botTimeout);
    }
  })().then((r) => { });
})();

// vim:et:sw=2
