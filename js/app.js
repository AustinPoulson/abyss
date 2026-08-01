(function () {
  "use strict";

  const defaults = { version: 1, background: { colors: ["#07090c"], division: "1/4", effect: "strobe" }, tempo: 120, palette: "ice", density: 42, motion: 34, glow: 58 };
  const beats = { "1/1": 4, "1/2": 2, "1/4": 1, "1/8": .5, "1/16": .25, "1/4T": 2 / 3, "1/8T": 1 / 3, "1/16T": 1 / 6 };
  const presets = [
    ["Blacklight", ["#090014", "#2d006b", "#8a00ff", "#ff00c8", "#00e5ff"]], ["Laser Red", ["#050505", "#3b0008", "#b00020", "#ff1744", "#ff6d00"]], ["UV Pulse", ["#10002b", "#3c096c", "#7b2cbf", "#c77dff", "#f72585"]], ["Acid Rave", ["#061400", "#2bff00", "#b6ff00", "#eeff00", "#00ff85"]], ["Blue Laser", ["#000814", "#001d3d", "#003566", "#00b4d8", "#90e0ef"]],
    ["Hot Magenta", ["#180014", "#70005f", "#d100a8", "#ff00cc", "#ff5ec4"]], ["Cyberpunk", ["#08000f", "#ff0054", "#ff5400", "#00f5d4", "#00bbf9", "#9b5de5"]], ["Festival Sunrise", ["#210124", "#750d37", "#f0386b", "#ffba08", "#fbff12"]], ["Laser Grid", ["#000000", "#ff003c", "#00ff9d", "#00d9ff", "#7a00ff"]], ["Rave Whiteout", ["#111111", "#eeeeee", "#ff2d55", "#00e5ff", "#d4ff00"]],
    ["Rainbow Mainstage", ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#8b00ff", "#ff00ff"]], ["Tropical House", ["#001219", "#00b4d8", "#2ec4b6", "#80ed99", "#f9c74f", "#f94144"]], ["Bass Canyon", ["#03071e", "#370617", "#6a040f", "#d00000", "#ffba08", "#48cae4"]], ["Future Bass", ["#03045e", "#0077b6", "#00b4d8", "#90e0ef", "#ff70a6", "#ff99c8"]], ["Acid Sunset", ["#16003b", "#4c0070", "#ff0080", "#ff8c00", "#ffe600", "#39ff14"]],
    ["Strobe Candy", ["#12002f", "#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"]], ["Deep Club", ["#000000", "#0b132b", "#1c2541", "#3a506b", "#5bc0be", "#00f5d4"]], ["Neon Jungle", ["#071a0d", "#0aff00", "#7fff00", "#00ffcc", "#ffea00", "#ff00aa"]], ["Plasma Drop", ["#10002b", "#240046", "#5a189a", "#ff006e", "#ff8500", "#ffea00"]], ["Afterglow", ["#050505", "#4a044e", "#be123c", "#fb7185", "#fbbf24", "#67e8f9"]]
  ];
  let settings = clone(defaults);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalize(loaded) {
    const next = Object.assign({}, defaults, loaded);
    if (typeof next.background === "string") next.background = { colors: [next.background], division: "1/4", effect: "strobe" };
    next.background = Object.assign({}, defaults.background, next.background);
    next.background.colors = Array.isArray(next.background.colors) && next.background.colors.length ? next.background.colors : [defaults.background.colors[0]];
    return next;
  }
  async function loadSettings() {
    try { const response = await fetch("config.json", { cache: "no-store" }); if (!response.ok) throw new Error(); return normalize(await response.json()); }
    catch (_) { try { return normalize(JSON.parse(localStorage.getItem("abyss-settings"))); } catch (error) { return clone(defaults); } }
  }
  function saveSettings() { localStorage.setItem("abyss-settings", JSON.stringify(settings)); }

  loadSettings().then((loaded) => {
    settings = loaded;
    if (document.body.classList.contains("art-page")) startStrobe();
    if (document.querySelector(".controls-page")) initControls();
  });

  function startStrobe() {
    let index = 0; let lastStep = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectsCanvas = document.getElementById("effects-canvas");
    const effectsContext = effectsCanvas ? effectsCanvas.getContext("2d") : null;
    const sparkles = [];
    const slimeSheets = [];
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
      sparkles.forEach((sparkle) => {
        effectsContext.save();
        effectsContext.translate(sparkle.x, sparkle.y);
        effectsContext.rotate(sparkle.rotation);
        const color = hexToRgb(sparkle.color);
        const ray = effectsContext.createRadialGradient(0, 0, 0, 0, 0, sparkle.size);
        ray.addColorStop(0, `rgba(${color.join(",")},.78)`);
        ray.addColorStop(.26, `rgba(${color.join(",")},.45)`);
        ray.addColorStop(1, `rgba(${color.join(",")},0)`);
        effectsContext.fillStyle = ray;
        effectsContext.save();
        effectsContext.scale(.2, 1);
        effectsContext.beginPath(); effectsContext.arc(0, 0, sparkle.size, 0, Math.PI * 2); effectsContext.fill();
        effectsContext.restore();
        effectsContext.save();
        effectsContext.rotate(Math.PI / 2); effectsContext.scale(.2, 1);
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
    function spawnSparkle(color) {
      sparkles.push({ color, x: Math.random() * viewportWidth, y: Math.random() * viewportHeight, size: 48 + Math.random() * 208, rotation: Math.random() * Math.PI * 2 });
      drawEffects();
    }
    function spawnSlime(color) {
      const waves = Array.from({ length: 5 + Math.floor(Math.random() * 5) }, () => ({ x: Math.random() * viewportWidth, width: 24 + Math.random() * 90, length: 30 + Math.random() * 130 }));
      const sheet = { color, front: -240, speed: 70 + Math.random() * 90, phase: Math.random() * 10, waves, edge(x) { let y = this.front + Math.sin(x / 150 + this.phase) * 22 + Math.sin(x / 78 + this.phase * 1.7) * 9; this.waves.forEach((wave) => { const distance = Math.abs(x - wave.x); if (distance < wave.width) y += wave.length * Math.pow(1 - distance / wave.width, 2); }); return y; } };
      slimeSheets.push(sheet);
    }
    resizeEffects();
    window.addEventListener("resize", resizeEffects);
    if (settings.background.effect === "sparkle" && !reduced) {
      document.body.style.backgroundColor = settings.background.colors[0];
      const scheduleSparkle = () => {
        const colors = settings.background.colors;
        index = (index + 1) % colors.length;
        spawnSparkle(colors[index]);
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
      if (!reduced && colors.length > 1 && progress >= 1) { index = (index + Math.floor(progress)) % colors.length; lastStep = now; progress = 0; }
      if (!reduced && colors.length > 1 && settings.background.effect === "fade") document.body.style.backgroundColor = blend(colors[index], colors[(index + 1) % colors.length], Math.min(1, progress));
      else document.body.style.backgroundColor = colors[index % colors.length];
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
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
    let effects = document.querySelectorAll("[data-effect]");
    if (effects.length && !document.querySelector("[data-effect='slime']")) { const button = document.createElement("button"); button.type = "button"; button.className = "division-button"; button.dataset.effect = "slime"; button.textContent = "Slime"; effects[0].parentNode.append(button); effects = document.querySelectorAll("[data-effect]"); }
    const renderColors = () => {
      if (!colorList) return;
      colorList.innerHTML = "";
      settings.background.colors.forEach((color, index) => {
        const row = document.createElement("div"); row.className = "color-row";
        row.innerHTML = `<input type="color" value="${color}" aria-label="Background color ${index + 1}"><output>${color.toUpperCase()}</output><div class="color-order"><button type="button" class="move-color" data-direction="up" aria-label="Move background color ${index + 1} up" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" class="move-color" data-direction="down" aria-label="Move background color ${index + 1} down" ${index === settings.background.colors.length - 1 ? "disabled" : ""}>↓</button></div><button type="button" class="remove-color" aria-label="Remove background color ${index + 1}">×</button>`;
        row.querySelector("input").addEventListener("input", (event) => { settings.background.colors[index] = event.target.value; row.querySelector("output").textContent = event.target.value.toUpperCase(); saveSettings(); });
        row.querySelector(".remove-color").addEventListener("click", () => { if (settings.background.colors.length === 1) return; settings.background.colors.splice(index, 1); renderColors(); saveSettings(); });
        row.querySelectorAll(".move-color").forEach((button) => button.addEventListener("click", () => { const nextIndex = button.dataset.direction === "up" ? index - 1 : index + 1; if (nextIndex < 0 || nextIndex >= settings.background.colors.length) return; [settings.background.colors[index], settings.background.colors[nextIndex]] = [settings.background.colors[nextIndex], settings.background.colors[index]]; renderColors(); saveSettings(); }));
        colorList.append(row);
      });
    };
    presets.forEach(([name, colors], index) => { const button = document.createElement("button"); button.type = "button"; button.className = "preset-button"; button.dataset.preset = index; button.style.background = `linear-gradient(135deg, ${colors.join(", ")})`; button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><b>${name}</b>`; button.addEventListener("click", () => { settings.background.colors = [...colors]; renderColors(); saveSettings(); }); presetList.append(button); });
    renderColors();
    document.getElementById("add-color")?.addEventListener("click", () => { settings.background.colors.push("#07090c"); renderColors(); saveSettings(); });
    if (tempo && tempoValue) { tempo.value = settings.tempo; tempoValue.textContent = `${tempo.value} BPM`; tempo.addEventListener("input", () => { settings.tempo = Number(tempo.value); tempoValue.textContent = `${tempo.value} BPM`; saveSettings(); }); }
    divisions.forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.division === settings.background.division)); button.addEventListener("click", () => { settings.background.division = button.dataset.division; divisions.forEach((item) => item.setAttribute("aria-pressed", String(item === button))); saveSettings(); }); });
    effects.forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.effect === settings.background.effect)); button.addEventListener("click", () => { settings.background.effect = button.dataset.effect; effects.forEach((item) => item.setAttribute("aria-pressed", String(item === button))); saveSettings(); }); });
    document.getElementById("reset")?.addEventListener("click", () => { settings = clone(defaults); saveSettings(); location.reload(); });
  }
})();
