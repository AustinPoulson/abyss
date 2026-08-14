export const BEAT_DIVISIONS = Object.freeze({
  '1/1': 4,
  '1/2': 2,
  '1/4': 1,
  '1/8': 0.5,
  '1/16': 0.25,
  '1/4T': 2 / 3,
  '1/8T': 1 / 3,
  '1/16T': 1 / 6,
});

export const COLOR_PRESETS = Object.freeze([
  ['Blacklight', ['#090014', '#2d006b', '#8a00ff', '#ff00c8', '#00e5ff']],
  ['Laser Red', ['#050505', '#3b0008', '#b00020', '#ff1744', '#ff6d00']],
  ['UV Pulse', ['#10002b', '#3c096c', '#7b2cbf', '#c77dff', '#f72585']],
  ['Acid Rave', ['#061400', '#2bff00', '#b6ff00', '#eeff00', '#00ff85']],
  ['Blue Laser', ['#000814', '#001d3d', '#003566', '#00b4d8', '#90e0ef']],
  ['Hot Magenta', ['#180014', '#70005f', '#d100a8', '#ff00cc', '#ff5ec4']],
  ['Cyberpunk', ['#08000f', '#ff0054', '#ff5400', '#00f5d4', '#00bbf9', '#9b5de5']],
  ['Festival Sunrise', ['#210124', '#750d37', '#f0386b', '#ffba08', '#fbff12']],
  ['Laser Grid', ['#000000', '#ff003c', '#00ff9d', '#00d9ff', '#7a00ff']],
  ['Rave Whiteout', ['#111111', '#eeeeee', '#ff2d55', '#00e5ff', '#d4ff00']],
  [
    'Rainbow Mainstage',
    ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8b00ff', '#ff00ff'],
  ],
  ['Tropical House', ['#001219', '#00b4d8', '#2ec4b6', '#80ed99', '#f9c74f', '#f94144']],
  ['Bass Canyon', ['#03071e', '#370617', '#6a040f', '#d00000', '#ffba08', '#48cae4']],
  ['Future Bass', ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#ff70a6', '#ff99c8']],
  ['Acid Sunset', ['#16003b', '#4c0070', '#ff0080', '#ff8c00', '#ffe600', '#39ff14']],
  ['Strobe Candy', ['#12002f', '#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff']],
  ['Deep Club', ['#000000', '#0b132b', '#1c2541', '#3a506b', '#5bc0be', '#00f5d4']],
  ['Neon Jungle', ['#071a0d', '#0aff00', '#7fff00', '#00ffcc', '#ffea00', '#ff00aa']],
  ['Plasma Drop', ['#10002b', '#240046', '#5a189a', '#ff006e', '#ff8500', '#ffea00']],
  ['Afterglow', ['#050505', '#4a044e', '#be123c', '#fb7185', '#fbbf24', '#67e8f9']],
]);

export const BACKGROUND_EFFECT_CONTROL_SPECS = Object.freeze({
  strobe: [['randomness', 'Random order', 0, 100, '%']],
  fade: [['duration', 'Fade span', 10, 100, '%']],
  sparkle: [
    ['minSize', 'Minimum size', 24, 240, 'px'],
    ['maxSize', 'Maximum size', 80, 1200, 'px'],
    ['quantity', 'Stars per beat', 1, 8, ''],
    ['diffusion', 'Diffusion', 0, 100, '%'],
    ['intensity', 'Intensity', 10, 100, '%'],
    ['rayWidth', 'Ray width', 8, 45, '%'],
    ['fadeIn', 'Fade in', 0, 100, '%'],
  ],
  slime: [
    ['speed', 'Pour speed', 40, 200, '%'],
    ['dripDepth', 'Drip depth', 40, 240, 'px'],
    ['complexity', 'Shape complexity', 3, 12, ''],
  ],
});

export const FRACTAL_RANGE_SPECS = Object.freeze([
  ['symmetry', 3, 16, ''],
  ['recursion', 1, 5, ''],
  ['rotation', -100, 100, ' deg/s'],
  ['pulse', 0, 100, '%'],
  ['distortion', 0, 100, '%'],
  ['centerX', 0, 100, '%'],
  ['centerY', 0, 100, '%'],
  ['opacity', 0, 100, '%'],
  ['trail', 0, 95, '%'],
  ['crossfade', 0, 100, '%'],
]);

export const CONFIG_SCHEMA = Object.freeze({
  tempo: [40, 240],
  legacyRanges: Object.freeze({ density: [0, 100], motion: [0, 100], glow: [0, 100] }),
  palettes: Object.freeze(['ice', 'ember', 'moss', 'violet']),
  backgroundEffects: Object.freeze(['solid', ...Object.keys(BACKGROUND_EFFECT_CONTROL_SPECS)]),
  fractal: Object.freeze({
    styles: Object.freeze(['ink', 'shards', 'spray', 'liquid']),
    blends: Object.freeze(['normal', 'screen', 'lighter', 'multiply', 'difference']),
    colorModes: Object.freeze(['palette', 'single']),
  }),
});

export const DEFAULTS = Object.freeze({
  version: 1,
  background: {
    colors: ['#07090c'],
    division: '1/4',
    effect: 'solid',
    effectSettings: {
      strobe: { randomness: 0 },
      fade: { duration: 100 },
      sparkle: {
        minSize: 48,
        maxSize: 600,
        quantity: 1,
        diffusion: 60,
        intensity: 78,
        rayWidth: 20,
        fadeIn: 35,
      },
      slime: { speed: 100, dripDepth: 130, complexity: 7 },
    },
  },
  fractal: {
    enabled: true,
    style: 'ink',
    symmetry: 8,
    recursion: 3,
    rotation: 18,
    pulse: 38,
    distortion: 55,
    centerX: 50,
    centerY: 50,
    opacity: 72,
    blend: 'screen',
    trail: 18,
    crossfade: 35,
    division: '1/4',
    colorMode: 'palette',
  },
  tempo: 120,
  palette: 'ice',
  density: 42,
  motion: 34,
  glow: 58,
});

export function cloneSettings(settings = DEFAULTS) {
  return JSON.parse(JSON.stringify(settings));
}

export function normalizeSettings(loaded) {
  const next = Object.assign({}, cloneSettings(DEFAULTS), loaded);
  if (typeof next.background === 'string')
    next.background = { colors: [next.background], division: '1/4', effect: 'strobe' };
  next.background = Object.assign({}, cloneSettings(DEFAULTS.background), next.background);
  next.background.effectSettings = Object.assign(
    {},
    cloneSettings(DEFAULTS.background.effectSettings),
    next.background.effectSettings,
  );
  Object.keys(DEFAULTS.background.effectSettings).forEach((effect) => {
    next.background.effectSettings[effect] = Object.assign(
      {},
      DEFAULTS.background.effectSettings[effect],
      next.background.effectSettings[effect],
    );
  });
  next.background.colors =
    Array.isArray(next.background.colors) && next.background.colors.length
      ? next.background.colors
      : [DEFAULTS.background.colors[0]];
  next.fractal = Object.assign({}, DEFAULTS.fractal, next.fractal);
  return next;
}

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function matchesRangeSpecs(values, specs) {
  return specs.every((spec) => {
    const [key, labelOrMin, minOrMax, maxOrSuffix] = spec;
    const [min, max] =
      typeof labelOrMin === 'string' ? [minOrMax, maxOrSuffix] : [labelOrMin, minOrMax];
    return isIntegerInRange(values?.[key], min, max);
  });
}

export function validateConfig(config) {
  const background = config?.background;
  const effects = background?.effectSettings;
  const fractal = config?.fractal;
  const validBackground =
    background &&
    Array.isArray(background.colors) &&
    background.colors.length > 0 &&
    background.colors.every((color) => /^#[\da-f]{6}$/i.test(color)) &&
    Object.hasOwn(BEAT_DIVISIONS, background.division) &&
    CONFIG_SCHEMA.backgroundEffects.includes(background.effect) &&
    Object.entries(BACKGROUND_EFFECT_CONTROL_SPECS).every(([effect, specs]) =>
      matchesRangeSpecs(effects?.[effect], specs),
    ) &&
    effects.sparkle.maxSize >= effects.sparkle.minSize;
  const validFractal =
    fractal === undefined ||
    (typeof fractal.enabled === 'boolean' &&
      CONFIG_SCHEMA.fractal.styles.includes(fractal.style) &&
      matchesRangeSpecs(fractal, FRACTAL_RANGE_SPECS) &&
      CONFIG_SCHEMA.fractal.blends.includes(fractal.blend) &&
      Object.hasOwn(BEAT_DIVISIONS, fractal.division) &&
      CONFIG_SCHEMA.fractal.colorModes.includes(fractal.colorMode));
  return (
    config &&
    config.version === DEFAULTS.version &&
    validBackground &&
    validFractal &&
    isIntegerInRange(config.tempo, ...CONFIG_SCHEMA.tempo) &&
    CONFIG_SCHEMA.palettes.includes(config.palette) &&
    Object.entries(CONFIG_SCHEMA.legacyRanges).every(([key, range]) =>
      isIntegerInRange(config[key], ...range),
    )
  );
}
