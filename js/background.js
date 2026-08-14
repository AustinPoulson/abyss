import { BEAT_DIVISIONS } from './config-model.js';

export function startBackground(settings) {
  let index = 0;
  let lastStep = performance.now();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effectsCanvas = document.getElementById('effects-canvas');
  const effectsContext = effectsCanvas ? effectsCanvas.getContext('2d') : null;
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
    const fadeDuration =
      (60000 / settings.tempo) *
      BEAT_DIVISIONS[settings.background.division] *
      (sparkleSettings.fadeIn / 100);
    const drawTime = performance.now();
    sparkles.forEach((sparkle) => {
      effectsContext.save();
      effectsContext.globalAlpha = fadeDuration
        ? Math.min(1, (drawTime - sparkle.born) / fadeDuration)
        : 1;
      effectsContext.translate(sparkle.x, sparkle.y);
      effectsContext.rotate(sparkle.rotation);
      const color = hexToRgb(sparkle.color);
      const diffusion = sparkleSettings.diffusion / 100;
      const intensity = sparkleSettings.intensity / 100;
      const rayWidth = sparkleSettings.rayWidth / 100;
      const ray = effectsContext.createRadialGradient(0, 0, 0, 0, 0, sparkle.size);
      ray.addColorStop(0, `rgba(${color.join(',')},${intensity * (1 - diffusion * 0.3)})`);
      ray.addColorStop(
        0.12 + diffusion * 0.6,
        `rgba(${color.join(',')},${intensity * (0.65 - diffusion * 0.2)})`,
      );
      ray.addColorStop(1, `rgba(${color.join(',')},0)`);
      effectsContext.fillStyle = ray;
      effectsContext.save();
      effectsContext.scale(rayWidth, 1);
      effectsContext.beginPath();
      effectsContext.arc(0, 0, sparkle.size, 0, Math.PI * 2);
      effectsContext.fill();
      effectsContext.restore();
      effectsContext.save();
      effectsContext.rotate(Math.PI / 2);
      effectsContext.scale(rayWidth, 1);
      effectsContext.beginPath();
      effectsContext.arc(0, 0, sparkle.size, 0, Math.PI * 2);
      effectsContext.fill();
      effectsContext.restore();
      effectsContext.restore();
    });
    slimeSheets.forEach((sheet) => {
      const color = hexToRgb(sheet.color);
      effectsContext.fillStyle = `rgb(${color.join(',')})`;
      const points = [];
      for (let x = 0; x < viewportWidth; x += 16) points.push({ x, y: sheet.edge(x) });
      points.push({ x: viewportWidth, y: sheet.edge(viewportWidth) });
      effectsContext.beginPath();
      effectsContext.moveTo(0, 0);
      effectsContext.lineTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        const previous = points[i - 1];
        const point = points[i];
        const midX = (previous.x + point.x) / 2;
        const midY = (previous.y + point.y) / 2;
        effectsContext.quadraticCurveTo(previous.x, previous.y, midX, midY);
      }
      const last = points[points.length - 1];
      effectsContext.quadraticCurveTo(last.x, last.y, last.x, last.y);
      effectsContext.lineTo(viewportWidth, 0);
      effectsContext.closePath();
      effectsContext.fill();
    });
  }
  function hexToRgb(hex) {
    return hex.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16));
  }
  function animateSparkleFade() {
    sparkleFadeFrame = 0;
    drawEffects();
    const sparkleSettings = settings.background.effectSettings.sparkle;
    const fadeDuration =
      (60000 / settings.tempo) *
      BEAT_DIVISIONS[settings.background.division] *
      (sparkleSettings.fadeIn / 100);
    const now = performance.now();
    if (fadeDuration && sparkles.some((sparkle) => now - sparkle.born < fadeDuration))
      sparkleFadeFrame = requestAnimationFrame(animateSparkleFade);
  }
  function spawnSparkle(color) {
    const sparkleSettings = settings.background.effectSettings.sparkle;
    const minSize = Math.min(sparkleSettings.minSize, sparkleSettings.maxSize);
    const maxSize = Math.max(sparkleSettings.minSize, sparkleSettings.maxSize);
    sparkles.push({
      color,
      x: Math.random() * viewportWidth,
      y: Math.random() * viewportHeight,
      size: minSize + Math.random() * (maxSize - minSize),
      rotation: Math.random() * Math.PI * 2,
      born: performance.now(),
    });
    if (sparkleSettings.fadeIn && !sparkleFadeFrame)
      sparkleFadeFrame = requestAnimationFrame(animateSparkleFade);
    else if (!sparkleSettings.fadeIn) drawEffects();
  }
  function spawnSlime(color) {
    const slimeSettings = settings.background.effectSettings.slime;
    const waves = Array.from({ length: slimeSettings.complexity }, () => ({
      x: Math.random() * viewportWidth,
      width: 24 + Math.random() * 90,
      length: 30 + Math.random() * slimeSettings.dripDepth,
    }));
    const speedScale = slimeSettings.speed / 100;
    const sheet = {
      color,
      front: -(slimeSettings.dripDepth + 110),
      speed: (70 + Math.random() * 90) * speedScale,
      phase: Math.random() * 10,
      waves,
      edge(x) {
        let y =
          this.front +
          Math.sin(x / 150 + this.phase) * 22 +
          Math.sin(x / 78 + this.phase * 1.7) * 9;
        this.waves.forEach((wave) => {
          const distance = Math.abs(x - wave.x);
          if (distance < wave.width) y += wave.length * Math.pow(1 - distance / wave.width, 2);
        });
        return y;
      },
    };
    slimeSheets.push(sheet);
  }
  resizeEffects();
  window.addEventListener('resize', resizeEffects);
  if (settings.background.effect === 'solid') {
    document.body.style.backgroundColor = settings.background.colors[0];
    return;
  }
  if (settings.background.effect === 'sparkle' && !reduced) {
    document.body.style.backgroundColor = settings.background.colors[0];
    const scheduleSparkle = () => {
      const colors = settings.background.colors;
      index = (index + 1) % colors.length;
      for (let count = 0; count < settings.background.effectSettings.sparkle.quantity; count += 1)
        spawnSparkle(colors[index]);
      const interval = (60000 / settings.tempo) * BEAT_DIVISIONS[settings.background.division];
      window.setTimeout(scheduleSparkle, Math.max(16, interval));
    };
    const initialInterval = (60000 / settings.tempo) * BEAT_DIVISIONS[settings.background.division];
    window.setTimeout(scheduleSparkle, Math.max(16, initialInterval));
    return;
  }
  if (settings.background.effect === 'slime' && !reduced) {
    document.body.style.backgroundColor = settings.background.colors[0];
    let lastSlime = performance.now();
    let previous = lastSlime;
    function slimeFrame(now) {
      const colors = settings.background.colors;
      const interval = (60000 / settings.tempo) * BEAT_DIVISIONS[settings.background.division];
      const steps = interval ? Math.floor((now - lastSlime) / interval) : 1;
      if (steps > 0) {
        for (let step = 0; step < steps; step += 1) {
          index = (index + 1) % colors.length;
          spawnSlime(colors[index]);
        }
        lastSlime += steps * interval;
      }
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      slimeSheets.forEach((sheet) => {
        sheet.front += sheet.speed * delta;
      });
      for (let i = slimeSheets.length - 1; i >= 0; i -= 1)
        if (slimeSheets[i].front > viewportHeight + 260) slimeSheets.splice(i, 1);
      drawEffects();
      requestAnimationFrame(slimeFrame);
    }
    requestAnimationFrame(slimeFrame);
    return;
  }
  function frame(now) {
    const colors = settings.background.colors;
    const interval = (60000 / settings.tempo) * BEAT_DIVISIONS[settings.background.division];
    let progress = interval ? (now - lastStep) / interval : 1;
    if (!reduced && colors.length > 1 && progress >= 1) {
      const steps = Math.floor(progress);
      for (let step = 0; step < steps; step += 1)
        index =
          settings.background.effect === 'strobe' &&
          Math.random() * 100 < settings.background.effectSettings.strobe.randomness
            ? Math.floor(Math.random() * colors.length)
            : (index + 1) % colors.length;
      lastStep = now;
      progress = 0;
    }
    if (!reduced && colors.length > 1 && settings.background.effect === 'fade') {
      const fadeSpan = settings.background.effectSettings.fade.duration / 100;
      document.body.style.backgroundColor = blend(
        colors[index],
        colors[(index + 1) % colors.length],
        Math.min(1, progress / fadeSpan),
      );
    } else document.body.style.backgroundColor = colors[index % colors.length];
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function blend(from, to, amount) {
  const a = from.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16));
  const b = to.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16));
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * amount)).join(', ')})`;
}
