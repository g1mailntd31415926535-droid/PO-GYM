// scripts/generate-pwa-icons.mjs
// Tạo icon PWA (192/512) bằng Node thuần, không cần thư viện ngoài.
// Chạy: node scripts/generate-pwa-icons.mjs
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public');

const SS = 2048; // vẽ ở độ phân giải cao rồi hạ mẫu xuống cho mịn

// ---------------- PNG encoder ----------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter: none
    rgba.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Trung bình hoá vùng (area average) -> viền mịn khi thu nhỏ.
function downscale(src, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor((y * sh) / dh);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * sh) / dh));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor((x * sw) / dw);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * sw) / dw));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * sw + xx) * 4;
          r += src[i]; g += src[i + 1]; b += src[i + 2]; a += src[i + 3];
          n++;
        }
      }
      const o = (y * dw + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

// ---------------- Vẽ icon ----------------
const BLUE = [37, 99, 235]; // tailwind blue-600
const WHITE = [255, 255, 255];

const buf = Buffer.alloc(SS * SS * 4);
const setPx = (x, y, [r, g, b], a = 255) => {
  if (x < 0 || y < 0 || x >= SS || y >= SS) return;
  const i = (y * SS + x) * 4;
  // cộng dồn theo alpha để các lớp chồng lên nhau đúng
  const sa = a / 255;
  const da = buf[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa === 0) return;
  buf[i] = Math.round((r * sa + buf[i] * da * (1 - sa)) / oa);
  buf[i + 1] = Math.round((g * sa + buf[i + 1] * da * (1 - sa)) / oa);
  buf[i + 2] = Math.round((b * sa + buf[i + 2] * da * (1 - sa)) / oa);
  buf[i + 3] = Math.round(oa * 255);
};

// Hình tròn lấp đầy -> icon tròn sẵn, iOS không cần bo góc lại và không cắt nội dung.
const cx = SS / 2, cy = SS / 2, rad = SS / 2;
for (let y = 0; y < SS; y++) {
  for (let x = 0; x < SS; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    if (dx * dx + dy * dy <= rad * rad) setPx(x, y, BLUE);
  }
}

const pct = (v) => (v / 100) * SS;

function roundRect(x0, y0, x1, y1, radius, color) {
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const px = x + 0.5, py = y + 0.5;
      // khoảng cách đến hộp bo góc gần nhất
      const qx = Math.max(x0 + radius - px, 0, px - (x1 - radius));
      const qy = Math.max(y0 + radius - py, 0, py - (y1 - radius));
      const d = Math.hypot(qx, qy) - radius;
      if (d <= -0.5) setPx(x, y, color, 255);
      else if (d <= 0.5) setPx(x, y, color, Math.round((0.5 - d) * 255));
    }
  }
}

// Thanh tạ chạy ngang, 2 bộ đĩa mỗi bên (tỷ lệ % khung).
roundRect(pct(20), pct(46.25), pct(80), pct(53.75), pct(3.75), WHITE);
// Bên trái: đĩa ngoài + đĩa trong
roundRect(pct(17), pct(30), pct(24.5), pct(70), pct(1.6), WHITE);
roundRect(pct(25.5), pct(36.5), pct(32.5), pct(63.5), pct(1.3), WHITE);
// Bên phải (gương lại)
roundRect(pct(75.5), pct(30), pct(83), pct(70), pct(1.6), WHITE);
roundRect(pct(67.5), pct(36.5), pct(74.5), pct(63.5), pct(1.3), WHITE);

const targets = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
];

fs.mkdirSync(outDir, { recursive: true });
for (const t of targets) {
  const scaled = downscale(buf, SS, SS, t.size, t.size);
  fs.writeFileSync(path.join(outDir, t.file), encodePng(t.size, t.size, scaled));
  console.log(`✓ public/${t.file} (${t.size}x${t.size})`);
}
