// Generates PWA placeholder icons (192/512/maskable-512) without third-party deps.
// Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function makePNG(size, drawPixel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const rowBytes = size * 4 + 1;
  const raw = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawPixel(x, y, size);
      const off = y * rowBytes + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// 5x7 bitmap font for C, F, R
const FONT = {
  C: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
  ],
  F: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  R: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
};

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function gradient(x, y, size) {
  // brand-500 (#1ab277) → brand-800 (#0d5a40)
  const t = (x + y) / (2 * size);
  return [lerp(0x1a, 0x0d, t), lerp(0xb2, 0x5a, t), lerp(0x77, 0x40, t)];
}

function drawIcon({ inset = 0 }) {
  return (x, y, size) => {
    // Background gradient — outside the inset is still gradient (looks fine masked too)
    const [bgR, bgG, bgB] = gradient(x, y, size);

    // Central panel with the letters
    const panelMargin = Math.round(size * (0.18 + inset));
    const panelX0 = panelMargin;
    const panelY0 = panelMargin;
    const panelX1 = size - panelMargin;
    const panelY1 = size - panelMargin;
    const inPanel = x >= panelX0 && x < panelX1 && y >= panelY0 && y < panelY1;

    if (!inPanel) return [bgR, bgG, bgB, 255];

    // White rounded panel (rounded by simple Manhattan corner clipping)
    const r = Math.round(size * 0.05);
    const cornerCut =
      (x < panelX0 + r && y < panelY0 + r && x - panelX0 + (y - panelY0) < r) ||
      (x >= panelX1 - r && y < panelY0 + r && panelX1 - 1 - x + (y - panelY0) < r) ||
      (x < panelX0 + r && y >= panelY1 - r && x - panelX0 + (panelY1 - 1 - y) < r) ||
      (x >= panelX1 - r && y >= panelY1 - r && panelX1 - 1 - x + (panelY1 - 1 - y) < r);
    if (cornerCut) return [bgR, bgG, bgB, 255];

    // Letters CFR centered in the panel
    const letters = ['C', 'F', 'R'];
    const cell = Math.floor((panelX1 - panelX0) / 22); // 5 cols × 3 letters + 2 spacers + padding
    const totalLetterWidth = cell * (5 * 3 + 2 * 2); // 19 cells
    const startX = panelX0 + Math.floor(((panelX1 - panelX0) - totalLetterWidth) / 2);
    const startY = panelY0 + Math.floor(((panelY1 - panelY0) - cell * 7) / 2);

    for (let li = 0; li < 3; li++) {
      const letter = FONT[letters[li]];
      const lx = startX + li * (5 + 2) * cell;
      const inLetter = x >= lx && x < lx + 5 * cell && y >= startY && y < startY + 7 * cell;
      if (inLetter) {
        const col = Math.floor((x - lx) / cell);
        const row = Math.floor((y - startY) / cell);
        if (letter[row][col]) {
          // Brand color text
          return [0x0d, 0x71, 0x4e, 255];
        }
      }
    }
    return [255, 255, 255, 255];
  };
}

function main() {
  const tasks = [
    { name: 'icon-192.png', size: 192, opts: { inset: 0 } },
    { name: 'icon-512.png', size: 512, opts: { inset: 0 } },
    { name: 'icon-maskable-512.png', size: 512, opts: { inset: 0.05 } },
  ];
  for (const t of tasks) {
    const buf = makePNG(t.size, drawIcon(t.opts));
    writeFileSync(join(OUT_DIR, t.name), buf);
    console.log(`✓ ${t.name} (${buf.length.toLocaleString()} bytes)`);
  }
}

main();
