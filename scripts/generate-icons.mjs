// Icon generator. Produces PNGs, an ICO, and the source SVG for Tauri.
// Source of truth lives here — both the SVG and the rasters are computed
// from the same spiral parameters.
//
// Design: a single warm-cream logarithmic spiral on a deep sage squircle.
// Reads as a "wind down / take a beat" mark — no literal eye, no mascot.
//
// Usage: node scripts/generate-icons.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../src-tauri/icons");
mkdirSync(outDir, { recursive: true });

// ----- Brand palette -----
const COLORS = {
  bgTop: [0x3f, 0x6e, 0x55], // sage green, slightly lighter at top
  bgBot: [0x29, 0x4c, 0x39], // deeper at bottom
  spiral: [0xf5, 0xe2, 0xbf], // warm cream
  shadow: [0x10, 0x1d, 0x16], // tinted shadow under spiral
};

// ----- Geometry -----
// Spiral parameters at viewBox=256; everything else scales linearly.
const SPIRAL = {
  // Logarithmic spiral r(θ) = a·e^(b·θ).
  // 2.5 turns with gentle growth so every turn is visible at icon scale.
  a256: 9.5,
  b: 0.115,
  thetaMax: 5 * Math.PI,
  // Stroke width as fraction of icon size
  strokeFrac: 0.048, // ~12.3px at 256
  // Corner radius of the squircle as fraction of icon size (modern, less Apple-y)
  cornerFrac: 0.17,
  samples: 110, // polyline density
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Sample N points along the log spiral, centered at (cx, cy), scaled to size. */
function spiralPoints(size) {
  const cx = size / 2;
  const cy = size / 2;
  const a = SPIRAL.a256 * (size / 256);
  // Outer end points UP-RIGHT for an "opening upward" feel.
  const phi = -Math.PI / 2 - Math.PI / 6;
  const raw = [];
  for (let i = 0; i <= SPIRAL.samples; i++) {
    const t = (SPIRAL.thetaMax * i) / SPIRAL.samples;
    const r = a * Math.exp(SPIRAL.b * t);
    raw.push({
      x: cx + r * Math.cos(t + phi),
      y: cy + r * Math.sin(t + phi),
    });
  }
  // Recentre on the polyline's bounding box midpoint so the visual mass
  // sits dead centre regardless of which way the outer turn opens.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of raw) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const dx = cx - (minX + maxX) / 2;
  const dy = cy - (minY + maxY) / 2;
  return raw.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function distToPolyline(px, py, pts) {
  let min = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSegment(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    if (d < min) min = d;
  }
  return min;
}

function inSquircle(x, y, size, cornerR) {
  if (x < 0 || y < 0 || x > size || y > size) return false;
  if (x >= cornerR && x <= size - cornerR) return true;
  if (y >= cornerR && y <= size - cornerR) return true;
  const corners = [
    [cornerR, cornerR],
    [size - cornerR, cornerR],
    [cornerR, size - cornerR],
    [size - cornerR, size - cornerR],
  ];
  for (const [ccx, ccy] of corners) {
    if (Math.hypot(x - ccx, y - ccy) <= cornerR) return true;
  }
  return false;
}

// ----- PNG renderer -----
function renderPixels(size) {
  const px = new Uint8ClampedArray(size * size * 4);
  const cornerR = size * SPIRAL.cornerFrac;
  const pts = spiralPoints(size);

  // Stroke half-width with a minimum so 16px and 32px icons stay legible
  const strokeHalf = Math.max(0.9, (size * SPIRAL.strokeFrac) / 2);
  const aaSpan = 1.0;

  // Top-left soft highlight
  const glowCx = size * 0.22;
  const glowCy = size * 0.22;
  const glowMax = size * 0.7;

  // Inner end of the spiral gets a small filled dot to anchor it visually
  const innerDotPos = pts[0];
  const innerDotR = strokeHalf * 1.55;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const sx = x + 0.5;
      const sy = y + 0.5;

      if (!inSquircle(sx, sy, size, cornerR)) {
        px[idx] = px[idx + 1] = px[idx + 2] = px[idx + 3] = 0;
        continue;
      }

      // 1) Background: vertical sage gradient
      const ty = sy / size;
      let r = lerp(COLORS.bgTop[0], COLORS.bgBot[0], ty);
      let g = lerp(COLORS.bgTop[1], COLORS.bgBot[1], ty);
      let b = lerp(COLORS.bgTop[2], COLORS.bgBot[2], ty);

      // 2) Soft top-left highlight, gives the squircle a subtle "lit" feel
      const dGlow = Math.hypot(sx - glowCx, sy - glowCy);
      const glow = Math.max(0, 1 - dGlow / glowMax);
      const glowAmt = Math.pow(glow, 2.5) * 0.18;
      r = lerp(r, 255, glowAmt);
      g = lerp(g, 255, glowAmt);
      b = lerp(b, 255, glowAmt);

      // 3) Drop shadow under spiral (offset down-right, soft falloff)
      const dShadow = distToPolyline(sx - size * 0.008, sy - size * 0.014, pts);
      if (dShadow < strokeHalf + size * 0.022) {
        const t = clamp(
          1 - (dShadow - strokeHalf) / (size * 0.022),
          0,
          1,
        );
        const sa = Math.pow(t, 1.5) * 0.32;
        r = lerp(r, COLORS.shadow[0], sa);
        g = lerp(g, COLORS.shadow[1], sa);
        b = lerp(b, COLORS.shadow[2], sa);
      }
      // shadow under inner dot too
      const innerDShadow = Math.hypot(
        sx - innerDotPos.x - size * 0.008,
        sy - innerDotPos.y - size * 0.014,
      );
      if (innerDShadow < innerDotR + size * 0.022) {
        const t = clamp(
          1 - (innerDShadow - innerDotR) / (size * 0.022),
          0,
          1,
        );
        const sa = Math.pow(t, 1.5) * 0.32;
        r = lerp(r, COLORS.shadow[0], sa);
        g = lerp(g, COLORS.shadow[1], sa);
        b = lerp(b, COLORS.shadow[2], sa);
      }

      // 4) Spiral stroke (cream, anti-aliased)
      const d = distToPolyline(sx, sy, pts);
      if (d < strokeHalf + aaSpan) {
        const alpha = clamp((strokeHalf + aaSpan - d) / aaSpan, 0, 1);
        r = lerp(r, COLORS.spiral[0], alpha);
        g = lerp(g, COLORS.spiral[1], alpha);
        b = lerp(b, COLORS.spiral[2], alpha);
      }

      // 5) Inner anchor dot (cream filled circle at spiral start)
      const innerD = Math.hypot(sx - innerDotPos.x, sy - innerDotPos.y);
      if (innerD < innerDotR + aaSpan) {
        const alpha = clamp((innerDotR + aaSpan - innerD) / aaSpan, 0, 1);
        r = lerp(r, COLORS.spiral[0], alpha);
        g = lerp(g, COLORS.spiral[1], alpha);
        b = lerp(b, COLORS.spiral[2], alpha);
      }

      px[idx] = r;
      px[idx + 1] = g;
      px[idx + 2] = b;
      px[idx + 3] = 0xff;
    }
  }
  return px;
}

// ----- PNG encoder -----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = chunk("IHDR", ihdr);

  const rowSize = size * 4;
  const raw = Buffer.alloc((rowSize + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (rowSize + 1)] = 0;
    Buffer.from(pixels.buffer, y * rowSize, rowSize).copy(raw, y * (rowSize + 1) + 1);
  }
  const idat = chunk("IDAT", deflateSync(raw, { level: 9 }));
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idat, iend]);
}

function makePng(size, filename) {
  const px = renderPixels(size);
  const buf = encodePng(size, px);
  writeFileSync(resolve(outDir, filename), buf);
  console.log(`wrote ${filename} (${size}x${size})`);
  return buf;
}

function makeIco(sizes, filename) {
  const images = sizes.map((s) => ({ size: s, data: encodePng(s, renderPixels(s)) }));
  const headerSize = 6 + 16 * images.length;
  let offset = headerSize;
  const dir = Buffer.alloc(headerSize);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(images.length, 4);
  images.forEach((img, i) => {
    const base = 6 + i * 16;
    dir[base] = img.size === 256 ? 0 : img.size;
    dir[base + 1] = img.size === 256 ? 0 : img.size;
    dir[base + 2] = 0;
    dir[base + 3] = 0;
    dir.writeUInt16LE(1, base + 4);
    dir.writeUInt16LE(32, base + 6);
    dir.writeUInt32LE(img.data.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += img.data.length;
  });
  const buf = Buffer.concat([dir, ...images.map((i) => i.data)]);
  writeFileSync(resolve(outDir, filename), buf);
  console.log(`wrote ${filename} (${sizes.join(",")})`);
}

// ----- SVG writer -----
function spiralPathString(pts) {
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  return d;
}

function makeSvg(filename) {
  const size = 256;
  const pts = spiralPoints(size);
  const cornerR = size * SPIRAL.cornerFrac;
  const strokeWidth = size * SPIRAL.strokeFrac;
  const innerDotR = (strokeWidth / 2) * 1.55;
  const inner = pts[0];
  const path = spiralPathString(pts);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3f6e55"/>
      <stop offset="100%" stop-color="#294c39"/>
    </linearGradient>
    <radialGradient id="gloss" cx="22%" cy="22%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.6"/>
      <feOffset dx="2" dy="3.5"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.32"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${cornerR}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${cornerR}" fill="url(#gloss)"/>
  <g filter="url(#softShadow)">
    <path
      d="${path}"
      fill="none"
      stroke="#f5e2bf"
      stroke-width="${strokeWidth.toFixed(2)}"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="${inner.x.toFixed(2)}" cy="${inner.y.toFixed(2)}" r="${innerDotR.toFixed(2)}" fill="#f5e2bf"/>
  </g>
</svg>
`;
  writeFileSync(resolve(outDir, filename), svg);
  console.log(`wrote ${filename}`);
}

// ----- Output -----
makeSvg("icon.svg");
makePng(32, "32x32.png");
makePng(128, "128x128.png");
makePng(256, "128x128@2x.png");
makePng(512, "icon.png");
makeIco([16, 32, 48, 64, 128, 256], "icon.ico");
