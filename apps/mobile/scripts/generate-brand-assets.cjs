/* eslint-env node */
/**
 * Draws the Happy Women launcher/splash artwork into `assets/`.
 *
 * The mark is an elegant, flowing tulip/lotus line-art logo — matching the
 * brand theme with Coral Pink and Soft Lavender Purple curves, topped with a
 * delicate seed sparkle.
 *
 * Run with `node scripts/generate-brand-assets.cjs` after changing the mark.
 */
const fs = require('node:fs');
const path = require('node:path');

const { PNG } = require('pngjs');

/** Brand ground and accents, matching `PALETTES.happy.dark` in src/lib/theme. */
const CHARCOAL = { r: 0x12, g: 0x12, b: 0x12 };
const CORAL = { r: 0xff, g: 0x75, b: 0x75 }; // #FF7575
const LAVENDER = { r: 0xb9, g: 0xa6, b: 0xff }; // #B9A6FF

/** Samples per axis inside each pixel; 4 gives clean anti-aliased edges. */
const SUPERSAMPLE = 4;

function bezierPoints(p0, p1, p2, p3, steps = 16) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * p0[0] +
      3 * mt * mt * t * p1[0] +
      3 * mt * t * t * p2[0] +
      t * t * t * p3[0];
    const y =
      mt * mt * mt * p0[1] +
      3 * mt * mt * t * p1[1] +
      3 * mt * t * t * p2[1] +
      t * t * t * p3[1];
    pts.push([x, y]);
  }
  return pts;
}

function distToSegmentSq(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return (px - projX) ** 2 + (py - projY) ** 2;
}

function distToPolylineSq(px, py, points) {
  let minDist = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    const d = distToSegmentSq(
      px,
      py,
      points[i][0] / 64,
      points[i][1] / 64,
      points[i + 1][0] / 64,
      points[i + 1][1] / 64
    );
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Convert SVG bezier paths into discretized polylines
const PINK_STROKES = [
  // Top pointed arch
  ...bezierPoints([26, 28], [28, 19], [32, 12], [32, 12]),
  ...bezierPoints([32, 12], [32, 12], [36, 19], [38, 28]),
  // Sparkle rays
  ...bezierPoints([32, 23], [32, 22], [32, 21], [32, 20.5], 4),
  ...bezierPoints([29.5, 24], [28.5, 23], [28, 22.5], [27.5, 22], 4),
  ...bezierPoints([34.5, 24], [35.5, 23], [36, 22.5], [36.5, 22], 4),
  // Left stem leaf
  ...bezierPoints([15, 41], [18, 42], [22, 47], [28, 54]),
  // Left main petal
  ...bezierPoints([29, 51], [21, 43], [18, 28], [23, 21]),
  ...bezierPoints([23, 21], [27, 17], [33, 22], [34, 32]),
  // Inner loop accent
  ...bezierPoints([32, 52], [37, 54], [42, 53], [45, 49]),
];

const PURPLE_STROKES = [
  // Right main petal & bottom sweeping loop
  ...bezierPoints([32, 30], [35, 22], [42, 21], [46, 25]),
  ...bezierPoints([46, 25], [48, 30], [42, 39], [33, 46]),
  ...bezierPoints([33, 46], [27, 51], [25, 57], [29, 60]),
  ...bezierPoints([29, 60], [35, 62], [43, 60], [48, 54]),
  ...bezierPoints([48, 54], [53, 48], [55, 42], [54, 38]),
];

const STROKE_RADIUS_SQ = (1.4 / 64) ** 2;
const SEED_DOT_RADIUS_SQ = (1.2 / 64) ** 2;
const SEED_CENTER = [32 / 64, 26 / 64];

function glyphSampleAt(ux, uy) {
  // Check seed dot
  const dSeedSq = (ux - SEED_CENTER[0]) ** 2 + (uy - SEED_CENTER[1]) ** 2;
  if (dSeedSq <= SEED_DOT_RADIUS_SQ) {
    return CORAL;
  }

  // Check pink stroke elements
  const dPinkSq = distToPolylineSq(ux, uy, PINK_STROKES);
  if (dPinkSq <= STROKE_RADIUS_SQ) {
    return CORAL;
  }

  // Check purple stroke elements
  const dPurpleSq = distToPolylineSq(ux, uy, PURPLE_STROKES);
  if (dPurpleSq <= STROKE_RADIUS_SQ) {
    return LAVENDER;
  }

  return null;
}

function glyphCoverage(px, py, size, scale) {
  const offset = (1 - scale) / 2;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalAlpha = 0;

  for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
    for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
      const canvasX = (px + (sx + 0.5) / SUPERSAMPLE) / size;
      const canvasY = (py + (sy + 0.5) / SUPERSAMPLE) / size;
      const ux = (canvasX - offset) / scale;
      const uy = (canvasY - offset) / scale;

      if (ux >= 0 && ux <= 1 && uy >= 0 && uy <= 1) {
        const color = glyphSampleAt(ux, uy);
        if (color) {
          totalR += color.r;
          totalG += color.g;
          totalB += color.b;
          totalAlpha += 1;
        }
      }
    }
  }

  const numSamples = SUPERSAMPLE * SUPERSAMPLE;
  return {
    r: totalR / numSamples,
    g: totalG / numSamples,
    b: totalB / numSamples,
    alpha: totalAlpha / numSamples,
  };
}

function renderMark({ size, scale, background }) {
  const png = new PNG({ width: size, height: size });

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const sample = glyphCoverage(px, py, size, scale);
      const index = (py * size + px) << 2;

      if (background) {
        png.data[index] = Math.round(
          background.r * (1 - sample.alpha) + sample.r
        );
        png.data[index + 1] = Math.round(
          background.g * (1 - sample.alpha) + sample.g
        );
        png.data[index + 2] = Math.round(
          background.b * (1 - sample.alpha) + sample.b
        );
        png.data[index + 3] = 255;
      } else {
        const normAlpha = sample.alpha > 0 ? sample.alpha : 1;
        png.data[index] = Math.round(sample.r / normAlpha);
        png.data[index + 1] = Math.round(sample.g / normAlpha);
        png.data[index + 2] = Math.round(sample.b / normAlpha);
        png.data[index + 3] = Math.round(sample.alpha * 255);
      }
    }
  }
  return png;
}

const assetsDir = path.join(__dirname, '..', 'assets');

const ASSETS = [
  {
    file: 'icon.png',
    size: 1024,
    scale: 0.7,
    background: CHARCOAL,
  },
  {
    file: 'adaptive-icon.png',
    size: 1024,
    scale: 0.48,
    background: null,
  },
  {
    file: 'splash-icon.png',
    size: 512,
    scale: 0.85,
    background: null,
  },
  {
    file: 'favicon.png',
    size: 64,
    scale: 0.8,
    background: CHARCOAL,
  },
];

for (const asset of ASSETS) {
  const png = renderMark(asset);
  const target = path.join(assetsDir, asset.file);
  fs.writeFileSync(target, PNG.sync.write(png));
  console.log(`wrote ${asset.file} (${asset.size}px)`);
}
