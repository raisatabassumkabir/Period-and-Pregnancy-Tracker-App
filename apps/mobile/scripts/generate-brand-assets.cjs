/* eslint-env node */
/**
 * Draws the Happy Women launcher/splash artwork into `assets/`.
 *
 * The mark is a five-petal lotus — the same glyph the app renders as SVG in
 * `src/components/ui/brand.tsx`. Keep the two in sync: this file owns the
 * raster (launcher, splash, favicon), that one owns the in-app vector.
 *
 * Run with `node scripts/generate-brand-assets.cjs` after changing the mark.
 * Shapes are evaluated analytically and supersampled, so output is resolution
 * independent — no design tool or native image library needed.
 */
const fs = require('node:fs');
const path = require('node:path');

const { PNG } = require('pngjs');

/** Brand ground and accent, matching `PALETTES.happy.dark` in src/lib/theme. */
const CHARCOAL = { r: 0x12, g: 0x12, b: 0x12 };
const CORAL = { r: 0xff, g: 0x75, b: 0x75 };

/** Samples per axis inside each pixel; 4 gives clean edges at every size. */
const SUPERSAMPLE = 4;

/**
 * Geometry in a unit square (0..1, y down), mirroring the 64-unit SVG viewBox
 * (divide the SVG numbers by 64). The glyph is drawn into a `scale`-sized box
 * centred in the canvas so the adaptive icon can shrink it into Android's
 * safe zone without redrawing.
 */
const PETAL_BASE = { x: 0.5, y: 50 / 64 };
const PETAL_LENGTH = 37 / 64;
/** Widest half-width of a petal, and where along its length that falls. */
const PETAL_HALF_WIDTH = 8 / 64;
const PETAL_BULGE_AT = 0.46;
const INNER_PETAL_ANGLE_DEG = 27;
const OUTER_PETAL_ANGLE_DEG = 54;
const OUTER_PETAL_OPACITY = 0.72;
const BASE_LEAF = { halfWidth: 17 / 64, top: 51 / 64, bottom: 58 / 64 };

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Petal half-width at a fraction `t` (0 = base, 1 = tip) of its length: a
 * skewed sine so the petal is fuller near the base and comes to a point.
 */
function petalHalfWidthAt(t) {
  const shaped =
    t < PETAL_BULGE_AT
      ? Math.sin((Math.PI / 2) * (t / PETAL_BULGE_AT))
      : Math.cos((Math.PI / 2) * ((t - PETAL_BULGE_AT) / (1 - PETAL_BULGE_AT)));
  return PETAL_HALF_WIDTH * Math.pow(shaped, 0.85);
}

/** True when (ux, uy) lies inside the petal rotated `angleDeg` off vertical. */
function insidePetal(ux, uy, angleDeg) {
  const angle = toRadians(angleDeg);
  const dx = ux - PETAL_BASE.x;
  const dy = PETAL_BASE.y - uy; // up is positive
  // Rotate into the petal's own frame (v along its axis, u across it).
  const v = dy * Math.cos(angle) + dx * Math.sin(angle);
  const u = dx * Math.cos(angle) - dy * Math.sin(angle);
  if (v < 0 || v > PETAL_LENGTH) return false;
  return Math.abs(u) <= petalHalfWidthAt(v / PETAL_LENGTH);
}

/** The shallow leaf under the flower: a lens between two arcs. */
function insideBaseLeaf(ux, uy) {
  const dx = Math.abs(ux - PETAL_BASE.x) / BASE_LEAF.halfWidth;
  if (dx > 1) return false;
  const curve = 1 - dx * dx;
  const upper = BASE_LEAF.top + (BASE_LEAF.bottom - BASE_LEAF.top) * 0.25 * curve;
  const lower = BASE_LEAF.top + (BASE_LEAF.bottom - BASE_LEAF.top) * curve;
  return uy >= upper && uy <= lower;
}

/** Opacity of the glyph at a unit-square point: 1 for inner petals, less for outer. */
function glyphOpacityAt(ux, uy) {
  if (
    insidePetal(ux, uy, 0) ||
    insidePetal(ux, uy, INNER_PETAL_ANGLE_DEG) ||
    insidePetal(ux, uy, -INNER_PETAL_ANGLE_DEG)
  ) {
    return 1;
  }
  if (
    insidePetal(ux, uy, OUTER_PETAL_ANGLE_DEG) ||
    insidePetal(ux, uy, -OUTER_PETAL_ANGLE_DEG) ||
    insideBaseLeaf(ux, uy)
  ) {
    return OUTER_PETAL_OPACITY;
  }
  return 0;
}

/** Mean glyph opacity over one pixel — supersampling smooths the curved edges. */
function glyphCoverage(px, py, size, scale) {
  const offset = (1 - scale) / 2;
  let total = 0;

  for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
    for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
      const canvasX = (px + (sx + 0.5) / SUPERSAMPLE) / size;
      const canvasY = (py + (sy + 0.5) / SUPERSAMPLE) / size;
      const ux = (canvasX - offset) / scale;
      const uy = (canvasY - offset) / scale;
      if (ux >= 0 && ux <= 1 && uy >= 0 && uy <= 1) {
        total += glyphOpacityAt(ux, uy);
      }
    }
  }
  return total / (SUPERSAMPLE * SUPERSAMPLE);
}

/**
 * @param {{size: number, scale: number, background: object|null, foreground: object}} options
 */
function renderMark({ size, scale, background, foreground }) {
  const png = new PNG({ width: size, height: size });

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const coverage = glyphCoverage(px, py, size, scale);
      const index = (py * size + px) << 2;

      if (background) {
        // Composite the glyph onto an opaque ground.
        png.data[index] =
          background.r + (foreground.r - background.r) * coverage;
        png.data[index + 1] =
          background.g + (foreground.g - background.g) * coverage;
        png.data[index + 2] =
          background.b + (foreground.b - background.b) * coverage;
        png.data[index + 3] = 255;
      } else {
        // Straight alpha — Android tints the ground via `backgroundColor`.
        png.data[index] = foreground.r;
        png.data[index + 1] = foreground.g;
        png.data[index + 2] = foreground.b;
        png.data[index + 3] = Math.round(coverage * 255);
      }
    }
  }
  return png;
}

const assetsDir = path.join(__dirname, '..', 'assets');

const ASSETS = [
  // Store/launcher icon: full-bleed charcoal, coral mark.
  {
    file: 'icon.png',
    size: 1024,
    scale: 0.7,
    background: CHARCOAL,
    foreground: CORAL,
  },
  // Adaptive foreground: transparent, and smaller because Android crops to a
  // circle/squircle — the mark must survive the mask.
  {
    file: 'adaptive-icon.png',
    size: 1024,
    scale: 0.48,
    background: null,
    foreground: CORAL,
  },
  // Splash: transparent so the configured backgroundColor shows through.
  {
    file: 'splash-icon.png',
    size: 512,
    scale: 0.85,
    background: null,
    foreground: CORAL,
  },
  {
    file: 'favicon.png',
    size: 64,
    scale: 0.8,
    background: CHARCOAL,
    foreground: CORAL,
  },
];

for (const asset of ASSETS) {
  const png = renderMark(asset);
  const target = path.join(assetsDir, asset.file);
  fs.writeFileSync(target, PNG.sync.write(png));
  console.log(`wrote ${asset.file} (${asset.size}px)`);
}
