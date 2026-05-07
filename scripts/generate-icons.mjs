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

// Brand colors — plant theme (warm cream + snail browns)
const COLORS = {
  bg: [0xfd, 0xe6, 0xc4],     // warm sky cream
  bgEdge: [0xe0, 0xa0, 0x6c], // dusk peach
  shell: [0xc8, 0x9a, 0x4a],  // tan shell
  shellDark: [0x5a, 0x3a, 0x1a],
  body: [0xda, 0xb0, 0x89],
  bodyEdge: [0x7a, 0x52, 0x30],
  ink: [0x3a, 0x28, 0x18],
  white: [0xfa, 0xfa, 0xfa],
  leaf: [0x5a, 0x8c, 0x4a],
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

// Render the EyeGuard mark: a snail on a warm cream rounded-square
// background. Matches the in-app <Logo /> + the windowsill mascot so
// brand identity is consistent across OS chrome and the app.
function renderPixels(size) {
  const px = new Uint8ClampedArray(size * size * 4);

  const cornerRadius = size * 0.22;

  // Snail geometry — body is a low slug on the bottom, shell is a circle
  // sitting on top of the body, two eye stalks rise above-right.
  const shellCx = size * 0.55;
  const shellCy = size * 0.45;
  const shellR = size * 0.25;
  const bodyCx = size * 0.5;
  const bodyTop = size * 0.6;
  const bodyBottom = size * 0.78;
  const bodyHalfW = size * 0.36;

  // Eye stalks (line + tip)
  const stalk1 = { x1: size * 0.74, y1: shellCy - shellR * 0.6, x2: size * 0.84, y2: size * 0.16, tipR: size * 0.045 };
  const stalk2 = { x1: size * 0.66, y1: shellCy - shellR * 0.6, x2: size * 0.7, y2: size * 0.12, tipR: size * 0.045 };
  const stalkThickness = Math.max(1.2, size * 0.018);

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

  const distToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };

  // Background: warm cream gradient (lerp top→bottom)
  const lerp = (a, b, t) => a + (b - a) * t;
  const bgAt = (y) => {
    const t = y / size;
    return [
      lerp(COLORS.bg[0], COLORS.bgEdge[0], t),
      lerp(COLORS.bg[1], COLORS.bgEdge[1], t),
      lerp(COLORS.bg[2], COLORS.bgEdge[2], t),
    ];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const sx = x + 0.5;
      const sy = y + 0.5;
      if (!inRoundedSquare(sx, sy)) {
        px[idx] = px[idx + 1] = px[idx + 2] = px[idx + 3] = 0;
        continue;
      }
      let [r, g, b] = bgAt(sy);

      // 1) Stalk tips (eyes)
      const tipDist1 = Math.hypot(sx - stalk1.x2, sy - stalk1.y2);
      const tipDist2 = Math.hypot(sx - stalk2.x2, sy - stalk2.y2);
      if (tipDist1 <= stalk1.tipR || tipDist2 <= stalk2.tipR) {
        [r, g, b] = COLORS.ink;
      } else {
        // 2) Stalk lines
        const onStalk1 = distToSegment(sx, sy, stalk1.x1, stalk1.y1, stalk1.x2, stalk1.y2);
        const onStalk2 = distToSegment(sx, sy, stalk2.x1, stalk2.y1, stalk2.x2, stalk2.y2);
        if (onStalk1 <= stalkThickness * 0.5 || onStalk2 <= stalkThickness * 0.5) {
          [r, g, b] = COLORS.bodyEdge;
        } else {
          // 3) Shell (with spiral interior)
          const shellD = Math.hypot(sx - shellCx, sy - shellCy);
          if (shellD <= shellR) {
            [r, g, b] = COLORS.shell;
            // shell outline
            if (shellD >= shellR - Math.max(1.2, size * 0.022)) {
              [r, g, b] = COLORS.shellDark;
            } else {
              // spiral: nested rings at radii 0.7R, 0.45R, 0.22R
              const rings = [shellR * 0.72, shellR * 0.46, shellR * 0.22];
              for (const ringR of rings) {
                if (Math.abs(shellD - ringR) <= Math.max(1.0, size * 0.014)) {
                  [r, g, b] = COLORS.shellDark;
                  break;
                }
              }
            }
          } else {
            // 4) Body — flattened ellipse along the bottom
            const inBody = (() => {
              const dx = sx - bodyCx;
              const yMid = (bodyTop + bodyBottom) / 2;
              const halfH = (bodyBottom - bodyTop) / 2;
              const dy = sy - yMid;
              return (dx * dx) / (bodyHalfW * bodyHalfW) + (dy * dy) / (halfH * halfH) <= 1;
            })();
            if (inBody) {
              const dx = sx - bodyCx;
              const yMid = (bodyTop + bodyBottom) / 2;
              const halfH = (bodyBottom - bodyTop) / 2;
              const dy = sy - yMid;
              const m = (dx * dx) / (bodyHalfW * bodyHalfW) + (dy * dy) / (halfH * halfH);
              if (m >= 0.88) {
                [r, g, b] = COLORS.bodyEdge;
              } else {
                [r, g, b] = COLORS.body;
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
