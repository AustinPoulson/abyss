import { BACKGROUND_EFFECT_CONTROL_SPECS, COLOR_PRESETS } from "./config-model.js";

export function initControls({ settings, onChange = () => {} }) {
  const colors = document.getElementById("color-list");
  const tempo = document.getElementById("tempo");
  const tempoValue = document.getElementById("tempo-value");
  const backgroundDivisions = document.querySelectorAll("[data-division]");
  const effects = document.querySelectorAll("[data-effect]");
  const divisionGrid = document.querySelector("#background-section .division-grid");
  const divisionHint = divisionGrid?.nextElementSibling;
  const preview = document.querySelector(".color-picker-preview");
  const effectSettings = document.createElement("div");
  effectSettings.className = "effect-settings";
  divisionHint?.after(effectSettings);

  const presets = document.getElementById("preset-list") || document.createElement("div");
  if (!presets.id) {
    presets.id = "preset-list";
    presets.className = "preset-list";
    colors?.parentNode.insertBefore(presets, colors);
  }

  function renderPreview() {
    if (!preview) return;
    preview.innerHTML = "";
    preview.setAttribute("aria-label", `Current background colors: ${settings.background.colors.join(", ")}`);
    settings.background.colors.forEach((color) => {
      const dot = document.createElement("span");
      dot.className = "color-picker-dot";
      dot.style.backgroundColor = color;
      dot.setAttribute("aria-hidden", "true");
      preview.append(dot);
    });
  }

  function renderColors() {
    if (!colors) return;
    colors.innerHTML = "";
    settings.background.colors.forEach((color, index) => {
      const row = document.createElement("div");
      row.className = "color-row";
      row.innerHTML = `<input type="color" value="${color}" aria-label="Background color ${index + 1}"><output>${color.toUpperCase()}</output><div class="color-order"><button type="button" class="move-color" data-direction="up" aria-label="Move background color ${index + 1} up" ${index === 0 ? "disabled" : ""}>&uarr;</button><button type="button" class="move-color" data-direction="down" aria-label="Move background color ${index + 1} down" ${index === settings.background.colors.length - 1 ? "disabled" : ""}>&darr;</button></div><button type="button" class="remove-color" aria-label="Remove background color ${index + 1}">&times;</button>`;
      row.querySelector("input").addEventListener("input", (event) => {
        settings.background.colors[index] = event.target.value;
        row.querySelector("output").textContent = event.target.value.toUpperCase();
        renderPreview();
        onChange(settings);
      });
      row.querySelector(".remove-color").addEventListener("click", () => {
        if (settings.background.colors.length === 1) return;
        settings.background.colors.splice(index, 1);
        renderColors();
        onChange(settings);
      });
      row.querySelectorAll(".move-color").forEach((button) => button.addEventListener("click", () => {
        const next = button.dataset.direction === "up" ? index - 1 : index + 1;
        if (next < 0 || next >= settings.background.colors.length) return;
        [settings.background.colors[index], settings.background.colors[next]] = [settings.background.colors[next], settings.background.colors[index]];
        renderColors();
        onChange(settings);
      }));
      colors.append(row);
    });
    renderPreview();
  }

  function renderEffectSettings() {
    const effect = settings.background.effect;
    const isSolid = effect === "solid";
    if (divisionGrid) divisionGrid.hidden = isSolid;
    if (divisionHint) divisionHint.hidden = isSolid;
    effectSettings.innerHTML = isSolid ? '<p class="hint">Solid uses the first background color and does not run on division.</p>' : `<div class="control-label">${effect[0].toUpperCase() + effect.slice(1)} controls</div>`;
    (BACKGROUND_EFFECT_CONTROL_SPECS[effect] || []).forEach(([key, label, min, max, suffix]) => {
      const row = document.createElement("div");
      row.className = "control-row effect-control";
      const value = settings.background.effectSettings[effect][key];
      row.innerHTML = `<label class="control-label" for="effect-${effect}-${key}">${label}</label><input id="effect-${effect}-${key}" type="range" min="${min}" max="${max}" value="${value}"><output class="control-value">${value}${suffix}</output>`;
      const input = row.querySelector("input");
      input.addEventListener("input", () => {
        const next = Number(input.value);
        settings.background.effectSettings[effect][key] = next;
        if (effect === "sparkle" && key === "minSize") settings.background.effectSettings.sparkle.maxSize = Math.max(settings.background.effectSettings.sparkle.maxSize, next);
        if (effect === "sparkle" && key === "maxSize") settings.background.effectSettings.sparkle.minSize = Math.min(settings.background.effectSettings.sparkle.minSize, next);
        row.querySelector("output").textContent = `${next}${suffix}`;
        onChange(settings);
      });
      effectSettings.append(row);
    });
  }

  function syncFractal() {
    document.querySelectorAll("[data-fractal-choice]").forEach((button) => {
      const key = button.dataset.fractalChoice;
      const current = key === "enabled" ? String(settings.fractal[key]) : settings.fractal[key];
      button.setAttribute("aria-pressed", String(button.dataset.value === current));
    });
    document.querySelectorAll("[data-fractal-division]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.fractalDivision === settings.fractal.division)));
    document.querySelectorAll("[data-fractal-range]").forEach((input) => {
      input.value = settings.fractal[input.dataset.fractalRange];
      input.nextElementSibling.textContent = `${input.value}${input.dataset.suffix || ""}`;
    });
  }

  function syncControls() {
    renderColors();
    if (tempo && tempoValue) {
      tempo.value = settings.tempo;
      tempoValue.textContent = `${settings.tempo} BPM`;
    }
    backgroundDivisions.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.division === settings.background.division)));
    effects.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.effect === settings.background.effect)));
    renderEffectSettings();
    syncFractal();
  }

  COLOR_PRESETS.forEach(([name, palette], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-button";
    button.dataset.preset = index;
    button.style.background = `linear-gradient(135deg, ${palette.join(", ")})`;
    button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><b>${name}</b>`;
    button.addEventListener("click", () => { settings.background.colors = [...palette]; renderColors(); onChange(settings); });
    presets.append(button);
  });

  document.getElementById("add-color")?.addEventListener("click", () => { settings.background.colors.push("#07090c"); renderColors(); onChange(settings); });
  tempo?.addEventListener("input", () => { settings.tempo = Number(tempo.value); tempoValue.textContent = `${tempo.value} BPM`; onChange(settings); });
  backgroundDivisions.forEach((button) => button.addEventListener("click", () => { settings.background.division = button.dataset.division; syncControls(); onChange(settings); }));
  effects.forEach((button) => button.addEventListener("click", () => { settings.background.effect = button.dataset.effect; syncControls(); onChange(settings); }));
  document.querySelectorAll("[data-fractal-choice]").forEach((button) => button.addEventListener("click", () => { const key = button.dataset.fractalChoice; settings.fractal[key] = key === "enabled" ? button.dataset.value === "true" : button.dataset.value; syncFractal(); onChange(settings); }));
  document.querySelectorAll("[data-fractal-division]").forEach((button) => button.addEventListener("click", () => { settings.fractal.division = button.dataset.fractalDivision; syncFractal(); onChange(settings); }));
  document.querySelectorAll("[data-fractal-range]").forEach((input) => input.addEventListener("input", () => { settings.fractal[input.dataset.fractalRange] = Number(input.value); input.nextElementSibling.textContent = `${input.value}${input.dataset.suffix || ""}`; onChange(settings); }));

  syncControls();
  return { syncControls };
}
