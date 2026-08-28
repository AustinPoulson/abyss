(function (global) {
  'use strict';

  const TAU = Math.PI * 2;
  const DIVISIONS = {
    '1/1': 4,
    '1/2': 2,
    '1/4': 1,
    '1/8': 0.5,
    '1/16': 0.25,
    '1/4T': 2 / 3,
    '1/8T': 1 / 3,
    '1/16T': 1 / 6,
  };
  const BLENDS = {
    normal: 'source-over',
    screen: 'screen',
    lighter: 'lighter',
    multiply: 'multiply',
    difference: 'difference',
  };
  const STYLES = new Set(['ink', 'shards', 'spray', 'liquid']);
  const DEFAULT_COLORS = ['#ff0054', '#00f5d4', '#7a00ff', '#ffbe0b'];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function amount(value, fallback) {
    if (value === undefined || value === null) return fallback;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return clamp(Math.abs(numeric) <= 1 ? numeric : numeric / 100, 0, 1);
  }

  function position(value, fallback) {
    if (value === undefined || value === null) return fallback;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return clamp(Math.abs(numeric) <= 1 ? numeric : numeric / 100, 0, 1);
  }

  function normalize(config) {
    const source = config || {};
    return {
      enabled: source.enabled !== false,
      style: STYLES.has(source.style) ? source.style : 'ink',
      symmetry: Math.round(clamp(source.symmetry || 8, 2, 24)),
      recursion: Math.round(clamp(source.recursion || 0, 0, 6)),
      rotation: source.rotation === undefined ? 'clockwise' : source.rotation,
      pulse: source.pulse === undefined ? 0.12 : source.pulse,
      distortion: amount(source.distortion, 0.35),
      centerX: position(source.centerX, 0.5),
      centerY: position(source.centerY, 0.5),
      opacity: amount(source.opacity, 0.82),
      blend: BLENDS[source.blend] ? source.blend : 'normal',
      trail: amount(source.trail, 0.25),
      crossfade: clamp(source.crossfade === undefined ? 35 : source.crossfade, 0, 100),
      division: DIVISIONS[source.division] ? source.division : '1/4',
      colorMode: source.colorMode || 'cycle',
      colors:
        Array.isArray(source.colors) && source.colors.length
          ? source.colors.slice()
          : DEFAULT_COLORS.slice(),
      tempo: clamp(source.tempo || 120, 20, 400),
    };
  }

  function mulberry32(seed) {
    return function () {
      let value = (seed += 0x6d2b79f5);
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function colorAt(settings, index, step) {
    const colors = settings.colors;
    if (settings.colorMode === 'single' || settings.colorMode === 'fixed') return colors[0];
    if (settings.colorMode === 'random') return colors[(index * 7 + step * 13) % colors.length];
    return colors[(index + step) % colors.length];
  }

  function traceWedge(context, radius, halfAngle, padding = 0) {
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(
      Math.cos(-halfAngle - padding) * radius,
      Math.sin(-halfAngle - padding) * radius,
    );
    context.arc(0, 0, radius, -halfAngle - padding, halfAngle + padding);
    context.closePath();
  }

  function drawInk(context, radius, halfAngle, settings, random, step) {
    const count = 5 + Math.round(settings.distortion * 7);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (let i = 0; i < count; i += 1) {
      const start = radius * (0.04 + random() * 0.18);
      const end = radius * (0.42 + random() * 0.62);
      const bend = (random() - 0.5) * halfAngle * settings.distortion;
      context.strokeStyle = colorAt(settings, i, step);
      context.globalAlpha = 0.45 + random() * 0.55;
      context.lineWidth = radius * (0.018 + random() * 0.09);
      context.beginPath();
      context.moveTo(start, (random() - 0.5) * start * halfAngle);
      context.bezierCurveTo(
        end * 0.28,
        Math.sin(bend * 3) * radius * 0.18,
        end * 0.68,
        (random() - 0.5) * radius * halfAngle * 0.8,
        end,
        Math.tan((random() - 0.5) * halfAngle * 1.7) * end,
      );
      context.stroke();
    }
  }

  function drawShards(context, radius, halfAngle, settings, random, step) {
    const count = 14 + Math.round(settings.distortion * 18);
    for (let i = 0; i < count; i += 1) {
      const distance = radius * (0.08 + random() * 0.86);
      const angle = (random() - 0.5) * halfAngle * 1.8;
      const size = radius * (0.025 + random() * 0.14);
      const skew = 0.25 + random() * (0.8 + settings.distortion);
      context.save();
      context.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
      context.rotate(angle + (random() - 0.5) * 1.6);
      context.fillStyle = colorAt(settings, i, step);
      context.globalAlpha = 0.5 + random() * 0.5;
      context.beginPath();
      context.moveTo(size, 0);
      context.lineTo(-size * skew, size * (0.25 + random()));
      context.lineTo(-size * (0.2 + random()), -size * (0.25 + random()));
      context.closePath();
      context.fill();
      context.restore();
    }
  }

  function drawSpray(context, radius, halfAngle, settings, random, step) {
    const count = 50 + Math.round(settings.distortion * 80);
    for (let i = 0; i < count; i += 1) {
      const distance = radius * Math.pow(random(), 0.65);
      const angle = (random() - 0.5) * halfAngle * 1.9;
      const size = radius * (0.003 + Math.pow(random(), 3) * 0.055);
      context.fillStyle = colorAt(settings, i, step);
      context.globalAlpha = 0.18 + random() * 0.72;
      context.beginPath();
      context.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, size, 0, TAU);
      context.fill();
    }
  }

  function drawLiquid(context, radius, halfAngle, settings, random, step) {
    const count = 4 + Math.round(settings.distortion * 5);
    for (let i = 0; i < count; i += 1) {
      const distance = radius * (0.08 + random() * 0.72);
      const angle = (random() - 0.5) * halfAngle * 1.5;
      const length = radius * (0.16 + random() * 0.42);
      const width = radius * (0.035 + random() * 0.11);
      context.save();
      context.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
      context.rotate(angle + (random() - 0.5) * settings.distortion);
      context.fillStyle = colorAt(settings, i, step);
      context.globalAlpha = 0.5 + random() * 0.5;
      context.beginPath();
      context.moveTo(-length * 0.5, 0);
      context.bezierCurveTo(-length * 0.2, -width * 1.5, length * 0.1, -width, length * 0.5, 0);
      context.bezierCurveTo(
        length * 0.15,
        width * (0.8 + random()),
        -length * 0.18,
        width * (0.7 + random()),
        -length * 0.5,
        0,
      );
      context.fill();
      context.restore();
    }
  }

  function rotationAt(rotation, seconds, beatPhase) {
    if (typeof rotation === 'number') return (seconds * rotation * Math.PI) / 180;
    if (rotation === true || rotation === 'clockwise' || rotation === 'cw') return seconds * 0.18;
    if (rotation === 'counterclockwise' || rotation === 'anticlockwise' || rotation === 'ccw')
      return seconds * -0.18;
    if (rotation === 'alternate' || rotation === 'alternating')
      return Math.sin(seconds * 0.55) * 0.8;
    if (typeof rotation === 'string' && Number.isFinite(Number(rotation)))
      return (seconds * Number(rotation) * Math.PI) / 180;
    return beatPhase * 0;
  }

  function pulseAt(pulse, phase) {
    if (pulse === false || pulse === 'off' || pulse === 'none') return 1;
    const strength = typeof pulse === 'number' ? amount(pulse, 0.12) : 0.12;
    const wave = (1 - Math.cos(phase * TAU)) * 0.5;
    if (pulse === 'out') return 1 - wave * strength;
    return 1 + wave * strength;
  }

  function start(canvas, config) {
    if (!canvas || typeof canvas.getContext !== 'function')
      throw new TypeError('AbyssFractal.start requires a canvas element.');

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('AbyssFractal could not create a 2D canvas context.');

    const settings = normalize(config);
    canvas.style.mixBlendMode = settings.blend === 'lighter' ? 'screen' : settings.blend;
    const sourceCanvas = document.createElement('canvas');
    const sourceContext = sourceCanvas.getContext('2d', { alpha: true });
    const previousSourceCanvas = document.createElement('canvas');
    const previousSourceContext = previousSourceCanvas.getContext('2d', { alpha: true });
    const reducedQuery =
      typeof global.matchMedia === 'function'
        ? global.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let reducedMotion = Boolean(reducedQuery && reducedQuery.matches);
    let frameId = 0;
    let stopped = false;
    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let sourceRadius = 1;
    let sourceScale = 1;
    let lastSourceStep = -1;
    let hasCurrentSource = false;
    let hasPreviousSource = false;
    let resizeObserver = null;

    function resize() {
      if (stopped) return;
      if (frameId) global.cancelAnimationFrame(frameId);
      frameId = 0;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width || canvas.clientWidth || global.innerWidth || 1);
      height = Math.max(1, rect.height || canvas.clientHeight || global.innerHeight || 1);
      pixelRatio = Math.min(2, Math.max(1, global.devicePixelRatio || 1));
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const centerX = width * settings.centerX;
      const centerY = height * settings.centerY;
      sourceRadius =
        Math.hypot(Math.max(centerX, width - centerX), Math.max(centerY, height - centerY)) * 1.12;
      const logicalDiameter = sourceRadius * 2;
      const sourcePixels = Math.max(
        256,
        Math.min(1400, Math.ceil(logicalDiameter * Math.min(pixelRatio, 1.5))),
      );
      sourceCanvas.width = sourcePixels;
      sourceCanvas.height = sourcePixels;
      previousSourceCanvas.width = sourcePixels;
      previousSourceCanvas.height = sourcePixels;
      sourceScale = sourcePixels / logicalDiameter;
      lastSourceStep = -1;
      hasCurrentSource = false;
      hasPreviousSource = false;
      context.clearRect(0, 0, width, height);
      draw(performance.now(), true);
    }

    function renderSource(step) {
      if (!sourceContext) return;
      if (hasCurrentSource && previousSourceContext) {
        previousSourceContext.setTransform(1, 0, 0, 1, 0, 0);
        previousSourceContext.clearRect(
          0,
          0,
          previousSourceCanvas.width,
          previousSourceCanvas.height,
        );
        previousSourceContext.drawImage(sourceCanvas, 0, 0);
        hasPreviousSource = true;
      }
      const halfAngle = Math.PI / settings.symmetry;
      const center = sourceCanvas.width / 2;
      const random = mulberry32(((step + 1) * 2654435761) >>> 0);
      sourceContext.setTransform(1, 0, 0, 1, 0, 0);
      sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      sourceContext.save();
      sourceContext.translate(center, center);
      sourceContext.scale(sourceScale, sourceScale);
      traceWedge(sourceContext, sourceRadius * 1.01, halfAngle, 0.01);
      sourceContext.clip();
      const painter = { ink: drawInk, shards: drawShards, spray: drawSpray, liquid: drawLiquid }[
        settings.style
      ];
      painter(sourceContext, sourceRadius, halfAngle, settings, random, step);
      sourceContext.restore();
      hasCurrentSource = true;
      lastSourceStep = step;
    }

    function decay() {
      context.save();
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (settings.trail <= 0.001 || reducedMotion) {
        context.clearRect(0, 0, width, height);
      } else {
        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = `rgba(0,0,0,${Math.max(0.025, 1 - settings.trail)})`;
        context.fillRect(0, 0, width, height);
      }
      context.restore();
    }

    function draw(now, force) {
      if (stopped || !settings.enabled) {
        context.clearRect(0, 0, width, height);
        return;
      }

      const interval = (60000 / settings.tempo) * DIVISIONS[settings.division];
      const step = reducedMotion ? 0 : Math.floor(now / Math.max(80, interval));
      const phase = reducedMotion ? 0 : (now % interval) / interval;
      if (force || step !== lastSourceStep) renderSource(step);
      decay();

      const centerX = width * settings.centerX;
      const centerY = height * settings.centerY;
      const seconds = now / 1000;
      const rotation = reducedMotion ? 0 : rotationAt(settings.rotation, seconds, phase);
      const pulse = reducedMotion ? 1 : pulseAt(settings.pulse, phase);
      const wedgeAngle = TAU / settings.symmetry;
      const sourceCenter = sourceCanvas.width / 2;
      const crossfadeSpan = settings.crossfade / 100;
      const crossfadeProgress =
        reducedMotion || !hasPreviousSource || crossfadeSpan === 0
          ? 1
          : Math.min(1, phase / crossfadeSpan);

      context.save();
      context.translate(centerX, centerY);
      context.rotate(rotation);
      context.scale(pulse, pulse);
      context.globalAlpha = settings.opacity;
      context.globalCompositeOperation = BLENDS[settings.blend];

      for (let segment = 0; segment < settings.symmetry; segment += 1) {
        context.save();
        context.rotate(segment * wedgeAngle);
        traceWedge(context, sourceRadius * 1.04, wedgeAngle / 2 + 0.002);
        context.clip();
        if (segment % 2) context.scale(1, -1);

        for (let copy = 0; copy <= settings.recursion; copy += 1) {
          const scale = Math.pow(0.58, copy);
          const copyAlpha = settings.opacity * Math.pow(0.72, copy);
          context.save();
          context.scale(scale, scale);
          if (crossfadeProgress < 1) {
            context.globalAlpha = copyAlpha * (1 - crossfadeProgress);
            context.drawImage(
              previousSourceCanvas,
              -sourceCenter / sourceScale,
              -sourceCenter / sourceScale,
              previousSourceCanvas.width / sourceScale,
              previousSourceCanvas.height / sourceScale,
            );
          }
          context.globalAlpha = copyAlpha * crossfadeProgress;
          context.drawImage(
            sourceCanvas,
            -sourceCenter / sourceScale,
            -sourceCenter / sourceScale,
            sourceCanvas.width / sourceScale,
            sourceCanvas.height / sourceScale,
          );
          context.restore();
        }
        context.restore();
      }
      context.restore();

      if (!reducedMotion) frameId = global.requestAnimationFrame(draw);
    }

    function onMotionChange(event) {
      reducedMotion = event.matches;
      if (frameId) global.cancelAnimationFrame(frameId);
      frameId = 0;
      context.clearRect(0, 0, width, height);
      draw(performance.now(), true);
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      if (frameId) global.cancelAnimationFrame(frameId);
      if (resizeObserver) resizeObserver.disconnect();
      global.removeEventListener('resize', resize);
      if (reducedQuery) {
        if (typeof reducedQuery.removeEventListener === 'function')
          reducedQuery.removeEventListener('change', onMotionChange);
        else if (typeof reducedQuery.removeListener === 'function')
          reducedQuery.removeListener(onMotionChange);
      }
      context.clearRect(0, 0, width, height);
    }

    if (typeof global.ResizeObserver === 'function') {
      resizeObserver = new global.ResizeObserver(resize);
      resizeObserver.observe(canvas);
    } else {
      global.addEventListener('resize', resize, { passive: true });
    }
    if (reducedQuery) {
      if (typeof reducedQuery.addEventListener === 'function')
        reducedQuery.addEventListener('change', onMotionChange);
      else if (typeof reducedQuery.addListener === 'function')
        reducedQuery.addListener(onMotionChange);
    }

    resize();
    return { stop, resize };
  }

  global.AbyssFractal = Object.freeze({ start });
})(window);
