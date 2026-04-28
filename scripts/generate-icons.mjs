// Minimal icon generator. Produces solid-color PNGs (and a multi-size ICO)
// for Tauri. Replace with real branded artwork later.
//
// Usage: node scripts/generate-icons.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../src-tauri/icons");
mkdirSync(outDir, { recursive: true });

// Brand colors
const COLORS = {
  bg: [0x09, 0x09, 0x0b],
  green: [0x34, 0xd3, 0x99],
  purple: [0x63, 0x66, 0xf1],
  amber: [0xf5, 0x9e, 0x0b],
  pink: [0xec, 0x48, 0x99],
  white: [0xfa, 0xfa, 0xfa],
};

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

// Render the EyeGuard mark: dark rounded-square ground, white almond eye
// outline, emerald iris, white pupil highlight, three short lashes.
// Matches the in-app SVG <Logo /> so brand and OS icon agree.
function renderPixels(size) {
  const px = new Uint8ClampedArray(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const cornerRadius = size * 0.22;

  // Eye geometry — almond width spans most of the square, iris ~28% of size.
  const eyeHalfW = size * 0.42;
  const eyeHalfH = size * 0.18;
  const irisR = size * 0.16;
  const irisCx = cx + size * 0.04; // gaze slightly right
  const irisCy = cy - size * 0.02; // ...and a hair upward
  const pupilR = size * 0.045;
  const pupilCx = irisCx + size * 0.05;
  const pupilCy = irisCy - size * 0.05;
  const outlineThickness = Math.max(1.4, size * 0.024);

  const inRoundedSquare = (x, y) => {
    if (x >= cornerRadius && x <= size - cornerRadius) return y >= 0 && y <= size;
    if (y >= cornerRadius && y <= size - cornerRadius) return x >= 0 && x <= size;
    const corners = [
      [cornerRadius, cornerRadius],
      [size - cornerRadius, cornerRadius],
      [cornerRadius, size - cornerRadius],
      [size - cornerRadius, size - cornerRadius],
    ];
    for (const [ccx, ccy] of corners) {
      const dx = x - ccx;
      const dy = y - ccy;
      if (Math.hypot(dx, dy) <= cornerRadius) return true;
    }
    return false;
  };

  // Almond outline implicit fn: |dx|/eyeHalfW)^2 * 0.65 + (dy/eyeHalfH)^2 ≈ 1
  // I use a stretched ellipse — close enough to the SVG path for this raster.
  const eyeMetric = (dx, dy) => Math.pow(dx / eyeHalfW, 2) + Math.pow(dy / eyeHalfH, 2);

  // Lash strokes: three short lines above the eye.
  const lashes = [
    { x1: cx - size * 0.14, y1: cy - size * 0.32, x2: cx - size * 0.18, y2: cy - size * 0.42 },
    { x1: cx, y1: cy - size * 0.34, x2: cx, y2: cy - size * 0.46 },
    { x1: cx + size * 0.14, y1: cy - size * 0.32, x2: cx + size * 0.18, y2: cy - size * 0.42 },
  ];
  const lashThickness = Math.max(1.2, size * 0.02);

  const distToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const sx = x + 0.5;
      const sy = y + 0.5;
      const inside = inRoundedSquare(sx, sy);
      if (!inside) {
        px[idx] = 0;
        px[idx + 1] = 0;
        px[idx + 2] = 0;
        px[idx + 3] = 0;
        continue;
      }
      // background
      let r = COLORS.bg[0];
      let g = COLORS.bg[1];
      let b = COLORS.bg[2];

      // Pupil first (topmost layer)
      const pupilDist = Math.hypot(sx - pupilCx, sy - pupilCy);
      if (pupilDist <= pupilR) {
        r = COLORS.white[0];
        g = COLORS.white[1];
        b = COLORS.white[2];
      } else {
        // Iris
        const irisDist = Math.hypot(sx - irisCx, sy - irisCy);
        if (irisDist <= irisR) {
          r = COLORS.green[0];
          g = COLORS.green[1];
          b = COLORS.green[2];
        } else {
          // Eye almond outline (white stroke)
          const m = eyeMetric(sx - cx, sy - cy);
          // outline if metric is near 1 within a band proportional to thickness
          const band = (outlineThickness / Math.min(eyeHalfW, eyeHalfH)) * 0.5;
          if (Math.abs(m - 1) < band) {
            r = COLORS.white[0];
            g = COLORS.white[1];
            b = COLORS.white[2];
          } else {
            // Lashes
            for (const lash of lashes) {
              const d = distToSegment(sx, sy, lash.x1, lash.y1, lash.x2, lash.y2);
              if (d <= lashThickness * 0.5) {
                r = COLORS.white[0];
                g = COLORS.white[1];
                b = COLORS.white[2];
                break;
              }
            }
          }
        }
      }

      px[idx] = r;
      px[idx + 1] = g;
      px[idx + 2] = b;
      px[idx + 3] = 0xff;
    }
  }
  return px;
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

  // raw scanlines: 0 filter byte + RGBA per row
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
  const target = resolve(outDir, filename);
  writeFileSync(target, buf);
  console.log(`wrote ${filename} (${size}x${size})`);
  return buf;
}

// ICO container holding multiple PNG entries
function makeIco(sizes, filename) {
  const images = sizes.map((s) => ({ size: s, data: encodePng(s, renderPixels(s)) }));
  const headerSize = 6 + 16 * images.length;
  let offset = headerSize;
  const dir = Buffer.alloc(headerSize);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // type ICO
  dir.writeUInt16LE(images.length, 4);
  images.forEach((img, i) => {
    const base = 6 + i * 16;
    dir[base] = img.size === 256 ? 0 : img.size;
    dir[base + 1] = img.size === 256 ? 0 : img.size;
    dir[base + 2] = 0;
    dir[base + 3] = 0;
    dir.writeUInt16LE(1, base + 4); // planes
    dir.writeUInt16LE(32, base + 6); // bpp
    dir.writeUInt32LE(img.data.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += img.data.length;
  });
  const buf = Buffer.concat([dir, ...images.map((i) => i.data)]);
  writeFileSync(resolve(outDir, filename), buf);
  console.log(`wrote ${filename} (${sizes.join(",")})`);
}

// Tauri's expected default set
makePng(32, "32x32.png");
makePng(128, "128x128.png");
makePng(256, "128x128@2x.png");
makePng(512, "icon.png");
makeIco([16, 32, 48, 64, 128, 256], "icon.ico");
