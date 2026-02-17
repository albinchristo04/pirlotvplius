// build/generate-icons.js — PWA icon generation using sharp
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');
const ICONS_DIR = join(DIST, 'icons');

function ensureDir(dir) { mkdirSync(dir, { recursive: true }); }

function createIconSVG(size, maskable = false) {
    const padding = maskable ? Math.round(size * 0.1) : 0;
    const bgSize = size;
    const letterSize = Math.round(size * (maskable ? 0.45 : 0.55));
    const cx = size / 2;
    const cy = size / 2;

    return `<svg width="${bgSize}" height="${bgSize}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d1a;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="${bgSize}" height="${bgSize}" ${maskable ? '' : 'rx="' + Math.round(size * 0.15) + '"'} fill="url(#bg)"/>
  <text x="${cx}" y="${cy + letterSize * 0.35}" font-family="Arial,Helvetica,sans-serif" font-size="${letterSize}" font-weight="700" fill="#e63946" text-anchor="middle">V</text>
</svg>`;
}

export async function generateIcons() {
    ensureDir(ICONS_DIR);

    // icon-192.png
    await sharp(Buffer.from(createIconSVG(192)))
        .resize(192, 192)
        .png({ compressionLevel: 9 })
        .toFile(join(ICONS_DIR, 'icon-192.png'));

    // icon-512.png
    await sharp(Buffer.from(createIconSVG(512)))
        .resize(512, 512)
        .png({ compressionLevel: 9 })
        .toFile(join(ICONS_DIR, 'icon-512.png'));

    // icon-512-maskable.png (with safe zone padding)
    await sharp(Buffer.from(createIconSVG(512, true)))
        .resize(512, 512)
        .png({ compressionLevel: 9 })
        .toFile(join(ICONS_DIR, 'icon-512-maskable.png'));

    // apple-touch-icon.png (180x180)
    await sharp(Buffer.from(createIconSVG(180)))
        .resize(180, 180)
        .png({ compressionLevel: 9 })
        .toFile(join(ICONS_DIR, 'apple-touch-icon.png'));

    console.log('[build] ✓ 4 PWA icons generated');
}
