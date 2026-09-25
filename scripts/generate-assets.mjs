import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const brand = path.join(root, 'assets', 'brand');
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');
const publicDir = path.join(root, 'public');

const MASTER = path.join(brand, 'icon-master.svg');
const GLYPH = path.join(brand, 'icon-glyph.svg');
const log = (m) => console.log(m);

const legacySizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const fgSizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const splashPort = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
const splashLand = { mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1600, 960], xxxhdpi: [1920, 1280] };

const splashFiles = [
  ['drawable/splash.png', 480, 320],
  ...Object.entries(splashPort).map(([d, [w, h]]) => [`drawable-port-${d}/splash.png`, w, h]),
  ...Object.entries(splashLand).map(([d, [w, h]]) => [`drawable-land-${d}/splash.png`, w, h]),
];

async function rasterizeLandmark(svgPath, size, outPath) {
  await sharp(svgPath, { density: 180, failOn: 'none' })
    .resize(size, size, { fit: 'fill' })
    .png()
    .toFile(outPath);
  log(`  solo ${path.basename(outPath)}`);
}

function circleMask(s) {
  const r = s / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`;
}

async function trimmedGlyph() {
  const buf = await sharp(GLYPH, { density: 180, failOn: 'none' }).trim().png().toBuffer();
  const meta = await sharp(buf).metadata();
  return { buf, w: meta.width, h: meta.height };
}

function splashBg(w, h) {
  const min = Math.min(w, h);
  const gx = w / 2;
  const gy = h * 0.42;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="95%">
      <stop offset="0%" stop-color="#11503a"/>
      <stop offset="52%" stop-color="#0a3a2a"/>
      <stop offset="100%" stop-color="#052a1e"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="46%" r="55%">
      <stop offset="0%" stop-color="#ffe9a3" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffe9a3" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <g stroke="#35d9a2" stroke-opacity="0.13" fill="none" stroke-width="${Math.max(2, Math.round(min * 0.012))}">
    <circle cx="${gx}" cy="${gy}" r="${Math.round(min * 0.44)}"/>
    <circle cx="${gx}" cy="${gy}" r="${Math.round(min * 0.58)}"/>
  </g>
  <g stroke="#ffe9a3" stroke-opacity="0.11" fill="none" stroke-width="${Math.max(2, Math.round(min * 0.028))}" stroke-linecap="round">
    <line x1="${gx}" y1="${Math.round(gy - min * 0.4)}" x2="${gx}" y2="${Math.round(gy - min * 0.66)}"/>
    <line x1="${Math.round(gx - min * 0.32)}" y1="${Math.round(gy - min * 0.34)}" x2="${Math.round(gx - min * 0.52)}" y2="${Math.round(gy - min * 0.44)}"/>
    <line x1="${Math.round(gx + min * 0.32)}" y1="${Math.round(gy - min * 0.34)}" x2="${Math.round(gx + min * 0.52)}" y2="${Math.round(gy - min * 0.44)}"/>
  </g>
</svg>`);
}

async function genLegacy() {
  log('== ic_launcher + ic_launcher_round ==');
  for (const [density, size] of Object.entries(legacySizes)) {
    await rasterizeLandmark(MASTER, size, path.join(resDir, `mipmap-${density}`, 'ic_launcher.png'));
    const round = await sharp(MASTER, { density: 180, failOn: 'none' })
      .resize(size, size, { fit: 'fill' })
      .composite([{ input: Buffer.from(circleMask(size)), blend: 'dest-in' }])
      .png()
      .toBuffer();
    await sharp(round).toFile(path.join(resDir, `mipmap-${density}`, 'ic_launcher_round.png'));
  }
}

async function genForeground() {
  log('== adaptive foreground ==');
  const glyph = await trimmedGlyph();
  for (const [density, size] of Object.entries(fgSizes)) {
    const targetH = Math.round(size * 0.60);
    const targetW = Math.round(targetH * (glyph.w / glyph.h));
    const scaled = await sharp(glyph.buf).resize(targetW, targetH).png().toBuffer();
    const canvas = await sharp({
      create: { width: size, height: size, channels: 4, background: '#00000000' },
    })
      .composite([{ input: scaled, left: Math.round((size - targetW) / 2), top: Math.round((size - targetH) / 2) }])
      .png()
      .toBuffer();
    await sharp(canvas).toFile(path.join(resDir, `mipmap-${density}`, 'ic_launcher_foreground.png'));
    log(`  fg@${density} ${size}px`);
  }
}

async function genSplash() {
  log('== splash ==');
  const glyph = await trimmedGlyph();
  for (const [file, w, h] of splashFiles) {
    const base = await sharp(splashBg(w, h)).png().toBuffer();
    const eH = Math.round(Math.min(w, h) * 0.46);
    const eW = Math.round(eH * (glyph.w / glyph.h));
    const scaled = await sharp(glyph.buf).resize(eW, eH).png().toBuffer();
    const outPath = path.join(resDir, file);
    await sharp(base)
      .composite([{ input: scaled, left: Math.round((w - eW) / 2), top: Math.round(h * 0.58 - eH / 2) }])
      .png()
      .toFile(outPath);
    log(`  ${file} (${w}x${h})`);
  }
}

async function genWeb() {
  log('== web icons ==');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(MASTER, path.join(publicDir, 'favicon.svg'));
  fs.copyFileSync(GLYPH, path.join(publicDir, 'icon-glyph.svg'));
  for (const [name, size] of [['favicon.png', 96], ['favicon-192.png', 192], ['favicon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    await sharp(MASTER, { density: 180, failOn: 'none' }).resize(size, size).png().toFile(path.join(publicDir, name));
    log(`  ${name}`);
  }
}

async function main() {
  await genLegacy();
  await genForeground();
  await genSplash();
  await genWeb();
  log('DONE');
}

main().catch((e) => { console.error(e); process.exit(1); });