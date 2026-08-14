import { BACKGROUND_EFFECT_CONTROL_SPECS, BEAT_DIVISIONS, cloneSettings, COLOR_PRESETS, DEFAULTS, normalizeSettings } from "./config-model.js";
import { initControls as initSharedControls } from "./controls-ui.js";

(function () {
  "use strict";

  const defaults = DEFAULTS;
  const beats = BEAT_DIVISIONS;
  const presets = COLOR_PRESETS;
  let settings = cloneSettings(defaults);
  async function loadSettings() {
    try { const response = await fetch("config.json", { cache: "no-store" }); if (!response.ok) throw new Error(); return normalizeSettings(await response.json()); }
    catch (_) { try { return normalizeSettings(JSON.parse(localStorage.getItem("abyss-settings"))); } catch (error) { return cloneSettings(defaults); } }
  }
  function saveSettings() { localStorage.setItem("abyss-settings", JSON.stringify(settings)); }

  loadSettings().then((loaded) => {
    settings = loaded;
    if (document.body.classList.contains("art-page")) { startStrobe(); startFractalLayer(); }
    if (document.querySelector(".controls-page")) {
      initSharedControls({ settings, onChange: saveSettings });
      document.getElementById("reset")?.addEventListener("click", () => { settings = cloneSettings(defaults); saveSettings(); location.reload(); });
    }
  });

  function startStrobe() {
    let index = 0; let lastStep = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectsCanvas = document.getElementById("effects-canvas");
    const effectsContext = effectsCanvas ? effectsCanvas.getContext("2d") : null;
    const sparkles = [];
    const slimeSheets = [];
    let sparkleFadeFrame = 0;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    function resizeEffects() {
      if (!effectsCanvas || !effectsContext) return;
      const ratio = window.devicePixelRatio || 1;
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      effectsCanvas.width = viewportWidth * ratio;
      effectsCanvas.height = viewportHeight * ratio;
      effectsContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawEffects();
    }
    function drawEffects() {
      if (!effectsContext) return;
      effectsContext.clearRect(0, 0, viewportWidth, viewportHeight);
      const sparkleSettings = settings.background.effectSettings.sparkle;
      const fadeDuration = (60000 / settings.tempo) * beats[settings.background.division] * (sparkleSettings.fadeIn / 100);
      const drawTime = performance.now();
      sparkles.forEach((sparkle) => {
        effectsContext.save();
        effectsContext.globalAlpha = fadeDuration ? Math.min(1, (drawTime - sparkle.born) / fadeDuration) : 1;
        effectsContext.translate(sparkle.x, sparkle.y);
        effectsContext.rotate(sparkle.rotation);
        const color = hexToRgb(sparkle.color);
        const diffusion = sparkleSettings.diffusion / 100;
        const intensity = sparkleSettings.intensity / 100;
        const rayWidth = sparkleSettings.rayWidth / 100;
        const ray = effectsContext.createRadialGradient(0, 0, 0, 0, 0, sparkle.size);
        ray.addColorStop(0, `rgba(${color.join(",")},${intensity * (1 - diffusion * .3)})`);
        ray.addColorStop(.12 + diffusion * .6, `rgba(${color.join(",")},${intensity * (.65 - diffusion * .2)})`);
        ray.addColorStop(1, `rgba(${color.join(",")},0)`);
        effectsContext.fillStyle = ray;
        effectsContext.save();
        effectsContext.scale(rayWidth, 1);
        effectsContext.beginPath(); effectsContext.arc(0, 0, sparkle.size, 0, Math.PI * 2); effectsContext.fill();
        effectsContext.restore();
        effectsContext.save();
        effectsContext.rotate(Math.PI / 2); effectsContext.scale(rayWidth, 1);
        effectsContext.beginPath(); effectsContext.arc(0, 0, sparkle.size, 0, Math.PI * 2); effectsContext.fill();
        effectsContext.restore();
        effectsContext.restore();
      });
      slimeSheets.forEach((sheet) => {
        const color = hexToRgb(sheet.color); effectsContext.fillStyle = `rgb(${color.join(",")})`;
        const points = []; for (let x = 0; x < viewportWidth; x += 16) points.push({ x, y: sheet.edge(x) }); points.push({ x: viewportWidth, y: sheet.edge(viewportWidth) });
        effectsContext.beginPath(); effectsContext.moveTo(0, 0); effectsContext.lineTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) { const previous = points[i - 1]; const point = points[i]; const midX = (previous.x + point.x) / 2; const midY = (previous.y + point.y) / 2; effectsContext.quadraticCurveTo(previous.x, previous.y, midX, midY); }
        const last = points[points.length - 1]; effectsContext.quadraticCurveTo(last.x, last.y, last.x, last.y); effectsContext.lineTo(viewportWidth, 0); effectsContext.closePath(); effectsContext.fill();
      });
    }
    function hexToRgb(hex) { return hex.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16)); }
    function animateSparkleFade() {
      sparkleFadeFrame = 0;
      drawEffects();
      const sparkleSettings = settings.background.effectSettings.sparkle;
      const fadeDuration = (60000 / settings.tempo) * beats[settings.background.division] * (sparkleSettings.fadeIn / 100);
      const now = performance.now();
      if (fadeDuration && sparkles.some((sparkle) => now - sparkle.born < fadeDuration)) sparkleFadeFrame = requestAnimationFrame(animateSparkleFade);
    }
    function spawnSparkle(color) {
      const sparkleSettings = settings.background.effectSettings.sparkle; const minSize = Math.min(sparkleSettings.minSize, sparkleSettings.maxSize); const maxSize = Math.max(sparkleSettings.minSize, sparkleSettings.maxSize);
      sparkles.push({ color, x: Math.random() * viewportWidth, y: Math.random() * viewportHeight, size: minSize + Math.random() * (maxSize - minSize), rotation: Math.random() * Math.PI * 2, born: performance.now() });
      if (sparkleSettings.fadeIn && !sparkleFadeFrame) sparkleFadeFrame = requestAnimationFrame(animateSparkleFade); else if (!sparkleSettings.fadeIn) drawEffects();
    }
    function spawnSlime(color) {
      const slimeSettings = settings.background.effectSettings.slime; const waves = Array.from({ length: slimeSettings.complexity }, () => ({ x: Math.random() * viewportWidth, width: 24 + Math.random() * 90, length: 30 + Math.random() * slimeSettings.dripDepth }));
      const speedScale = slimeSettings.speed / 100; const sheet = { color, front: -(slimeSettings.dripDepth + 110), speed: (70 + Math.random() * 90) * speedScale, phase: Math.random() * 10, waves, edge(x) { let y = this.front + Math.sin(x / 150 + this.phase) * 22 + Math.sin(x / 78 + this.phase * 1.7) * 9; this.waves.forEach((wave) => { const distance = Math.abs(x - wave.x); if (distance < wave.width) y += wave.length * Math.pow(1 - distance / wave.width, 2); }); return y; } };
      slimeSheets.push(sheet);
    }
    resizeEffects();
    window.addEventListener("resize", resizeEffects);
    if (settings.background.effect === "solid") { document.body.style.backgroundColor = settings.background.colors[0]; return; }
    if (settings.background.effect === "sparkle" && !reduced) {
      document.body.style.backgroundColor = settings.background.colors[0];
      const scheduleSparkle = () => {
        const colors = settings.background.colors;
        index = (index + 1) % colors.length;
        for (let count = 0; count < settings.background.effectSettings.sparkle.quantity; count += 1) spawnSparkle(colors[index]);
        const interval = (60000 / settings.tempo) * beats[settings.background.division];
        window.setTimeout(scheduleSparkle, Math.max(16, interval));
      };
      const initialInterval = (60000 / settings.tempo) * beats[settings.background.division];
      window.setTimeout(scheduleSparkle, Math.max(16, initialInterval));
      return;
    }
    if (settings.background.effect === "slime" && !reduced) {
      document.body.style.backgroundColor = settings.background.colors[0];
      let lastSlime = performance.now(); let previous = lastSlime;
      function slimeFrame(now) {
        const colors = settings.background.colors; const interval = (60000 / settings.tempo) * beats[settings.background.division]; const steps = interval ? Math.floor((now - lastSlime) / interval) : 1;
        if (steps > 0) { for (let step = 0; step < steps; step += 1) { index = (index + 1) % colors.length; spawnSlime(colors[index]); } lastSlime += steps * interval; }
        const delta = Math.min(.05, (now - previous) / 1000); previous = now;
        slimeSheets.forEach((sheet) => { sheet.front += sheet.speed * delta; });
        for (let i = slimeSheets.length - 1; i >= 0; i -= 1) if (slimeSheets[i].front > viewportHeight + 260) slimeSheets.splice(i, 1);
        drawEffects(); requestAnimationFrame(slimeFrame);
      }
      requestAnimationFrame(slimeFrame);
      return;
    }
    function frame(now) {
      const colors = settings.background.colors;
      const interval = (60000 / settings.tempo) * beats[settings.background.division];
      let progress = interval ? (now - lastStep) / interval : 1;
      if (!reduced && colors.length > 1 && progress >= 1) { const steps = Math.floor(progress); for (let step = 0; step < steps; step += 1) index = settings.background.effect === "strobe" && Math.random() * 100 < settings.background.effectSettings.strobe.randomness ? Math.floor(Math.random() * colors.length) : (index + 1) % colors.length; lastStep = now; progress = 0; }
      if (!reduced && colors.length > 1 && settings.background.effect === "fade") { const fadeSpan = settings.background.effectSettings.fade.duration / 100; document.body.style.backgroundColor = blend(colors[index], colors[(index + 1) % colors.length], Math.min(1, progress / fadeSpan)); }
      else document.body.style.backgroundColor = colors[index % colors.length];
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function startFractalLayer() {
    const canvas = document.getElementById("fractal-canvas");
    if (!canvas || !window.AbyssFractal) return;
    window.AbyssFractal.start(canvas, Object.assign({}, settings.fractal, { colors: settings.background.colors, tempo: settings.tempo }));
  }

  function blend(from, to, amount) {
    const a = from.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16));
    const b = to.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16));
    return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * amount)).join(", ")})`;
  }

  function initControls() {
    const colorList = document.getElementById("color-list");
    const presetList = document.getElementById("preset-list") || document.createElement("div");
    if (!presetList.id) { presetList.id = "preset-list"; presetList.className = "preset-list"; colorList?.parentNode.insertBefore(presetList, colorList); }
    const tempo = document.getElementById("tempo");
    const tempoValue = document.getElementById("tempo-value");
    const divisions = document.querySelectorAll("[data-division]");
    const effects = document.querySelectorAll("[data-effect]");
    const divisionGrid = document.querySelector(".division-grid"); const divisionHint = divisionGrid?.nextElementSibling;
    const effectSettingsHost = document.createElement("div"); effectSettingsHost.className = "effect-settings"; divisionHint?.after(effectSettingsHost);
    const effectControlSpecs = BACKGROUND_EFFECT_CONTROL_SPECS;
    function renderEffectSettings() {
      const effect = settings.background.effect; const isSolid = effect === "solid";
      if (divisionGrid) divisionGrid.hidden = isSolid; if (divisionHint) divisionHint.hidden = isSolid;
      effectSettingsHost.innerHTML = isSolid ? '<p class="hint">Solid uses the first background color and does not run on division.</p>' : `<div class="control-label">${effect.charAt(0).toUpperCase() + effect.slice(1)} controls</div>`;
      (effectControlSpecs[effect] || []).forEach(([key, label, min, max, suffix]) => { const row = document.createElement("div"); row.className = "control-row effect-control"; const value = settings.background.effectSettings[effect][key]; row.innerHTML = `<label class="control-label" for="effect-${effect}-${key}">${label}</label><input id="effect-${effect}-${key}" type="range" min="${min}" max="${max}" value="${value}"><output class="control-value">${value}${suffix}</output>`; const input = row.querySelector("input"); const output = row.querySelector("output"); input.addEventListener("input", () => { settings.background.effectSettings[effect][key] = Number(input.value); if (effect === "sparkle" && key === "minSize" && settings.background.effectSettings.sparkle.maxSize < Number(input.value)) settings.background.effectSettings.sparkle.maxSize = Number(input.value); if (effect === "sparkle" && key === "maxSize" && settings.background.effectSettings.sparkle.minSize > Number(input.value)) settings.background.effectSettings.sparkle.minSize = Number(input.value); output.textContent = `${input.value}${suffix}`; saveSettings(); }); effectSettingsHost.append(row); });
    }
    function syncFractalControls() {
      document.querySelectorAll("[data-fractal-choice]").forEach((button) => { const key = button.dataset.fractalChoice; const current = key === "enabled" ? String(settings.fractal[key]) : settings.fractal[key]; button.setAttribute("aria-pressed", String(button.dataset.value === current)); });
      document.querySelectorAll("[data-fractal-division]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.fractalDivision === settings.fractal.division)));
      document.querySelectorAll("[data-fractal-range]").forEach((input) => { input.value = settings.fractal[input.dataset.fractalRange]; input.nextElementSibling.textContent = `${input.value}${input.dataset.suffix || ""}`; });
    }
    const colorPreview = document.querySelector(".color-picker-preview");
    const renderColorPreview = () => {
      if (!colorPreview) return;
      colorPreview.innerHTML = "";
      colorPreview.setAttribute("aria-label", `Current background colors: ${settings.background.colors.join(", ")}`);
      settings.background.colors.forEach((color) => { const dot = document.createElement("span"); dot.className = "color-picker-dot"; dot.style.backgroundColor = color; dot.setAttribute("aria-hidden", "true"); colorPreview.append(dot); });
    };
    const renderColors = () => {
      if (!colorList) return;
      colorList.innerHTML = "";
      settings.background.colors.forEach((color, index) => {
        const row = document.createElement("div"); row.className = "color-row";
        row.innerHTML = `<input type="color" value="${color}" aria-label="Background color ${index + 1}"><output>${color.toUpperCase()}</output><div class="color-order"><button type="button" class="move-color" data-direction="up" aria-label="Move background color ${index + 1} up" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" class="move-color" data-direction="down" aria-label="Move background color ${index + 1} down" ${index === settings.background.colors.length - 1 ? "disabled" : ""}>↓</button></div><button type="button" class="remove-color" aria-label="Remove background color ${index + 1}">×</button>`;
        row.querySelector("input").addEventListener("input", (event) => { settings.background.colors[index] = event.target.value; row.querySelector("output").textContent = event.target.value.toUpperCase(); renderColorPreview(); saveSettings(); });
        row.querySelector(".remove-color").addEventListener("click", () => { if (settings.background.colors.length === 1) return; settings.background.colors.splice(index, 1); renderColors(); saveSettings(); });
        row.querySelectorAll(".move-color").forEach((button) => button.addEventListener("click", () => { const nextIndex = button.dataset.direction === "up" ? index - 1 : index + 1; if (nextIndex < 0 || nextIndex >= settings.background.colors.length) return; [settings.background.colors[index], settings.background.colors[nextIndex]] = [settings.background.colors[nextIndex], settings.background.colors[index]]; renderColors(); saveSettings(); }));
        colorList.append(row);
      });
      renderColorPreview();
    };
    presets.forEach(([name, colors], index) => { const button = document.createElement("button"); button.type = "button"; button.className = "preset-button"; button.dataset.preset = index; button.style.background = `linear-gradient(135deg, ${colors.join(", ")})`; button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><b>${name}</b>`; button.addEventListener("click", () => { settings.background.colors = [...colors]; renderColors(); saveSettings(); }); presetList.append(button); });
    renderColors();
    document.getElementById("add-color")?.addEventListener("click", () => { settings.background.colors.push("#07090c"); renderColors(); saveSettings(); });
    if (tempo && tempoValue) { tempo.value = settings.tempo; tempoValue.textContent = `${tempo.value} BPM`; tempo.addEventListener("input", () => { settings.tempo = Number(tempo.value); tempoValue.textContent = `${tempo.value} BPM`; saveSettings(); }); }
    divisions.forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.division === settings.background.division)); button.addEventListener("click", () => { settings.background.division = button.dataset.division; divisions.forEach((item) => item.setAttribute("aria-pressed", String(item === button))); saveSettings(); }); });
    effects.forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.effect === settings.background.effect)); button.addEventListener("click", () => { settings.background.effect = button.dataset.effect; effects.forEach((item) => item.setAttribute("aria-pressed", String(item === button))); renderEffectSettings(); saveSettings(); }); });
    document.querySelectorAll("[data-fractal-choice]").forEach((button) => button.addEventListener("click", () => { const key = button.dataset.fractalChoice; settings.fractal[key] = key === "enabled" ? button.dataset.value === "true" : button.dataset.value; syncFractalControls(); saveSettings(); }));
    document.querySelectorAll("[data-fractal-division]").forEach((button) => button.addEventListener("click", () => { settings.fractal.division = button.dataset.fractalDivision; syncFractalControls(); saveSettings(); }));
    document.querySelectorAll("[data-fractal-range]").forEach((input) => input.addEventListener("input", () => { settings.fractal[input.dataset.fractalRange] = Number(input.value); input.nextElementSibling.textContent = `${input.value}${input.dataset.suffix || ""}`; saveSettings(); }));
    renderEffectSettings();
    syncFractalControls();
    document.getElementById("reset")?.addEventListener("click", () => { settings = cloneSettings(defaults); saveSettings(); location.reload(); });
  }
})();
