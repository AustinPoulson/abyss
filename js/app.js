(function () {
  "use strict";

  const defaults = { palette: "ice", density: 42, motion: 34, glow: 58 };
  const palettes = {
    ice: ["#071019", "#102d45", "#68a6ce", "#d4e8ee"],
    ember: ["#160b0b", "#46201c", "#bd6549", "#f4c69e"],
    moss: ["#08120e", "#183a2c", "#559b77", "#c4d9ae"],
    violet: ["#100b1a", "#2e2050", "#8b75c8", "#e3d7ff"]
  };
  let settings = Object.assign({}, defaults);

  async function loadSettings() {
    try {
      const response = await fetch("config.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Config unavailable");
      return Object.assign({}, defaults, await response.json());
    } catch (_) {
      try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem("abyss-settings"))); }
      catch (error) { return Object.assign({}, defaults); }
    }
  }
  function saveSettings() { localStorage.setItem("abyss-settings", JSON.stringify(settings)); }
  function hexToRgb(hex) { return hex.match(/[\da-f]{2}/gi).map((v) => parseInt(v, 16)); }
  function mix(a, b, amount) { return a.map((v, i) => Math.round(v + (b[i] - v) * amount)); }

  loadSettings().then((loaded) => {
    settings = loaded;
    const canvas = document.getElementById("artwork");
    if (canvas) initArtwork(canvas);
    if (document.querySelector(".controls-page")) initControls();
  });

  function initArtwork(canvas) {
    const ctx = canvas.getContext("2d");
    let width, height, time = 0;
    const particles = Array.from({ length: 180 }, (_, i) => ({ seed: i * 13.37, depth: (i % 10) / 10 }));
    function resize() { width = canvas.width = window.innerWidth * devicePixelRatio; height = canvas.height = window.innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); width /= devicePixelRatio; height /= devicePixelRatio; }
    function render() {
      const [dark, mid, bright] = palettes[settings.palette].map(hexToRgb);
      const base = ctx.createRadialGradient(width * .5, height * .44, 0, width * .5, height * .5, Math.max(width, height) * .8);
      base.addColorStop(0, `rgb(${mid.join(",")})`); base.addColorStop(1, `rgb(${dark.join(",")})`);
      ctx.fillStyle = base; ctx.fillRect(0, 0, width, height);
      const count = Math.round(30 + settings.density * 2.2);
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < count; i++) {
        const p = particles[i]; const d = p.depth + .1; const angle = p.seed + time * settings.motion / 12000 * (1.2 - d);
        const x = width * (.5 + Math.sin(angle * .65 + p.seed) * (.15 + d * .42));
        const y = height * (.5 + Math.cos(angle * .47 + p.seed * 2) * (.12 + d * .4));
        const radius = (2 + d * 28) * (settings.glow / 60);
        const tint = mix(mid, bright, d); const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 7);
        glow.addColorStop(0, `rgba(${tint.join(",")},${.1 + d * .2})`); glow.addColorStop(1, `rgba(${tint.join(",")},0)`);
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, radius * 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${tint.join(",")},${.15 + d * .6})`; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over"; time += 16; requestAnimationFrame(render);
    }
    window.addEventListener("resize", resize); resize(); render();
  }

  function initControls() {
    ["density", "motion", "glow"].forEach((key) => {
      const input = document.getElementById(key); const output = document.getElementById(`${key}-value`);
      input.value = settings[key]; output.textContent = settings[key];
      input.addEventListener("input", () => { settings[key] = Number(input.value); output.textContent = input.value; saveSettings(); });
    });
    document.querySelectorAll(".swatch").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.palette === settings.palette));
      button.addEventListener("click", () => { settings.palette = button.dataset.palette; document.querySelectorAll(".swatch").forEach((b) => b.setAttribute("aria-pressed", String(b === button))); saveSettings(); });
    });
    document.getElementById("reset").addEventListener("click", () => { settings = Object.assign({}, defaults); location.reload(); });
  }
})();
