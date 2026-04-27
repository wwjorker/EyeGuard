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

// Render an icon: dark rounded-square background + 4 colored arcs + white center dot
function renderPixels(size) {
  const px = new Uint8ClampedArray(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const cornerRadius = size * 0.22;
  const outerR = size * 0.36;
  const innerR = size * 0.28;
  const dotR = Math.max(2, size * 0.06);

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

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const inside = inRoundedSquare(x + 0.5, y + 0.5);
      if (!inside) {
        px[idx] = 0;
        px[idx + 1] = 0;
        px[idx + 2] = 0;
        px[idx + 3] = 0;
        continue;
      }
      // base bg
      let r = COLORS.bg[0],
        g = COLORS.bg[1],
        b = COLORS.bg[2];

      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < dotR) {
        r = COLORS.white[0];
        g = COLORS.white[1];
        b = COLORS.white[2];
      } else if (dist >= innerR && dist <= outerR) {
        // pick color by quadrant (top, right, bottom, left)
        const ang = Math.atan2(dy, dx); // -PI..PI
        let color;
        if (ang >= -Math.PI * 0.75 && ang < -Math.PI * 0.25) color = COLORS.green; // top
        else if (ang >= -Math.PI * 0.25 && ang < Math.PI * 0.25) color = COLORS.purple; // right
        else if (ang >= Math.PI * 0.25 && ang < Math.PI * 0.75) color = COLORS.amber; // bottom
        else color = COLORS.pink; // left
        r = color[0];
        g = color[1];
        b = color[2];
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
