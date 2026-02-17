// build/generate-og.js — OG image generation using sharp
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');
const OG_DIR = join(DIST, 'og');

function ensureDir(dir) { mkdirSync(dir, { recursive: true }); }

// Escape XML/SVG special characters
function esc(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Truncate text to max length
function truncate(str, max) {
    if (!str || str.length <= max) return str || '';
    return str.substring(0, max - 1) + '…';
}

function createMatchSVG(homeTeam, awayTeam, league, date) {
    const home = esc(truncate(homeTeam, 22));
    const away = esc(truncate(awayTeam, 22));
    const leagueName = esc(truncate(league, 40));
    const dateStr = esc(date || '');

    return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d1a;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e63946;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#f4a261;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
  <!-- EN VIVO badge -->
  <rect x="980" y="30" width="180" height="40" rx="20" fill="#e63946"/>
  <text x="1070" y="57" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">● EN VIVO</text>
  <!-- Teams -->
  <text x="600" y="240" font-family="Arial,Helvetica,sans-serif" font-size="52" font-weight="700" fill="#f1f1f1" text-anchor="middle">${home}</text>
  <text x="600" y="310" font-family="Arial,Helvetica,sans-serif" font-size="36" font-weight="700" fill="#e63946" text-anchor="middle">VS</text>
  <text x="600" y="380" font-family="Arial,Helvetica,sans-serif" font-size="52" font-weight="700" fill="#f1f1f1" text-anchor="middle">${away}</text>
  <!-- League + Date -->
  <text x="600" y="440" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#8892a4" text-anchor="middle">${leagueName} · ${dateStr}</text>
  <!-- Decorative line -->
  <rect x="450" y="460" width="300" height="2" rx="1" fill="#2a2a4a"/>
  <!-- Watermark -->
  <text x="600" y="560" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" fill="#8892a4" text-anchor="middle" opacity="0.6">velcuri.io</text>
  <!-- Subtle glow -->
  <circle cx="200" cy="300" r="250" fill="#e63946" opacity="0.03"/>
  <circle cx="1000" cy="400" r="200" fill="#f4a261" opacity="0.03"/>
</svg>`;
}

function createHubSVG(title, subtitle) {
    const t = esc(truncate(title, 35));
    const s = esc(truncate(subtitle || 'Fútbol en Vivo Gratis', 50));

    return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d1a;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e63946;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#f4a261;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
  <text x="600" y="280" font-family="Arial,Helvetica,sans-serif" font-size="58" font-weight="700" fill="#f1f1f1" text-anchor="middle">${t}</text>
  <text x="600" y="340" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="#8892a4" text-anchor="middle">${s}</text>
  <rect x="450" y="380" width="300" height="2" rx="1" fill="#2a2a4a"/>
  <text x="600" y="540" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" fill="#8892a4" text-anchor="middle" opacity="0.6">velcuri.io</text>
  <circle cx="200" cy="300" r="250" fill="#e63946" opacity="0.03"/>
</svg>`;
}

async function svgToPng(svg, outputPath) {
    await sharp(Buffer.from(svg))
        .resize(1200, 630)
        .png({ quality: 85, compressionLevel: 9 })
        .toFile(outputPath);
}

export async function generateOGImages(data) {
    ensureDir(OG_DIR);
    let count = 0;

    // Homepage OG
    await svgToPng(
        createHubSVG('Velcuri', 'Fútbol en Vivo Gratis — Partidos de Hoy'),
        join(OG_DIR, 'home.png')
    );
    count++;

    // Hub page OGs
    const hubs = [
        { slug: 'tarjeta-roja', title: 'Tarjeta Roja', sub: 'Ver Fútbol EN VIVO GRATIS' },
        { slug: 'rojadirecta', title: 'Rojadirecta', sub: 'Alternativa — Fútbol Gratis' },
        { slug: 'pirlotv', title: 'Pirlotv', sub: 'Fútbol en Vivo Gratis Online' },
        { slug: 'partidos-de-hoy', title: 'Partidos de Hoy', sub: 'Todos los Partidos EN VIVO' },
        { slug: 'partidos-en-vivo', title: 'Partidos en Vivo', sub: 'Ahora Mismo GRATIS' },
        { slug: 'futbol-en-vivo', title: 'Fútbol en Vivo', sub: 'Ver Partidos Gratis Hoy' },
        { slug: 'futbol-gratis', title: 'Fútbol Gratis', sub: 'Sin Registro Sin Suscripción' },
        { slug: 'ver-futbol-online', title: 'Ver Fútbol Online', sub: 'HD Gratis Sin Cortes' },
        { slug: 'futbol-para-todos', title: 'Fútbol Para Todos', sub: 'EN VIVO Gratis' },
    ];
    for (const hub of hubs) {
        await svgToPng(
            createHubSVG(hub.title, hub.sub),
            join(OG_DIR, `${hub.slug}.png`)
        );
        count++;
    }

    // Match page OGs
    for (const match of data.events) {
        const dateStr = match.date || '';
        await svgToPng(
            createMatchSVG(match.homeTeam, match.awayTeam, match.league, dateStr),
            join(OG_DIR, `${match.slug}.png`)
        );
        count++;
    }

    console.log(`[build] ✓ ${count} OG images generated`);
}
