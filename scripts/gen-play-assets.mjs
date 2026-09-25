import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/home/wafaa-mohamed-ra/Downloads/مولد-خطب-الجمعة-الذكي';
const OUT = join(ROOT, 'release', 'play-listing');
const master = readFileSync(join(ROOT, 'assets', 'brand', 'icon-master.svg'));

// ---- 1) App icon 512x512 (full-bleed master) ----
const iconFull = await sharp(master, { density: 72 }).resize(1024, 1024).png().toBuffer();
await sharp(iconFull).resize(512, 512).png().toFile(join(OUT, 'icon-512x512.png'));
console.log('icon-512x512.png done');

// ---- 2) Feature graphic 1024x500 ----
const W = 1024, H = 500;
// background: brand gradient + soft rays
const bg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1024 500">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="90%">
      <stop offset="0%" stop-color="#11503a"/>
      <stop offset="55%" stop-color="#0a3a2a"/>
      <stop offset="100%" stop-color="#052a1e"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe9a3"/>
      <stop offset="100%" stop-color="#e0a83f"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g opacity="0.20" stroke="#ffe9a3" stroke-width="6" stroke-linecap="round">
    <line x1="824" y1="120" x2="824" y2="70"/>
    <line x1="904" y1="140" x2="955" y2="100"/>
    <line x1="744" y1="140" x2="693" y2="100"/>
    <line x1="924" y1="220" x2="985" y2="205"/>
    <line x1="724" y1="220" x2="663" y2="205"/>
  </g>
  <!-- subtle mihrab left motif -->
  <path d="M-60 500 V320 C-60 190 10 110 130 110 C250 110 320 190 320 320 V500 Z"
        fill="none" stroke="#2fd49a" stroke-width="18" opacity="0.18"/>
</svg>`;
const bgBuf = await sharp(Buffer.from(bg)).png().toBuffer();

const iconGraphic = await sharp(iconFull).resize(300, 300).png().toBuffer();
// text layer (shaped by librsvg+pango)
const title = 'مِنْبَر الخَطِيب';
const tagline = 'مولِّد خطب الجمعة الذكيّ بالذكاء الاصطناعي';
const textSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="sh" x="-20%" y="-30%" width="140%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <g font-family="Noto Kufi Arabic" text-anchor="middle" filter="url(#sh)">
    <text x="742" y="232" font-size="86" font-weight="800" fill="#ffffff">${title}</text>
    <text x="742" y="318" font-size="40" font-weight="400" fill="#ffe9a3">${tagline}</text>
  </g>
  <g>
    <rect x="606" y="356" width="272" height="3" rx="1.5" fill="#2fd49a" opacity="0.8"/>
  </g>
</svg>`;
const textBuf = await sharp(Buffer.from(textSvg)).png().toBuffer();

await sharp(bgBuf)
  .composite([
    { input: iconGraphic, left: 138, top: 100 },
    { input: textBuf, left: 0, top: 0 },
  ])
  .png()
  .toFile(join(OUT, 'feature-graphic-1024x500.png'));
console.log('feature-graphic-1024x500.png done');
