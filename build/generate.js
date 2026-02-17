// build/generate.js — Main Static Site Generator for Velcuri.io
import { fetchAndNormalize, slugify } from '../src/data/fetch.js';
import { detectLeague, getLeagueBlock, getLeagueDisplayName } from '../src/data/leagueBlocks.js';
import { getTopMatchesForBuild } from '../src/data/leaguePriority.js';
import { websiteSchema, breadcrumbSchema, sportsEventSchema, broadcastEventSchema, faqSchema, itemListSchema, articleSchema, renderSchemas } from '../src/partials/schema.js';
import { mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const SRC = resolve(ROOT, 'src');
const SITE_URL = process.env.SITE_URL || 'https://www.velcuri.io';
const BUILD_DATE = new Date().toISOString();
const useLocal = process.argv.includes('--local');

// --- Helpers ---
function ensureDir(dir) { mkdirSync(dir, { recursive: true }); }

function writePage(urlPath, html) {
    const dir = join(DIST, urlPath);
    ensureDir(dir);
    writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

function writeFile(filePath, content) {
    ensureDir(dirname(join(DIST, filePath)));
    writeFileSync(join(DIST, filePath), content, 'utf-8');
}

function readSrc(relPath) {
    const p = resolve(SRC, relPath);
    return existsSync(p) ? readFileSync(p, 'utf-8') : '';
}

function copyDirRecursive(src, dest) {
    ensureDir(dest);
    if (!existsSync(src)) return;
    for (const entry of readdirSync(src)) {
        const srcPath = join(src, entry);
        const destPath = join(dest, entry);
        if (statSync(srcPath).isDirectory()) { copyDirRecursive(srcPath, destPath); }
        else { copyFileSync(srcPath, destPath); }
    }
}

function formatDate(isoStr) {
    const d = new Date(isoStr);
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function formatTime(hourStr) {
    return hourStr ? hourStr.substring(0, 5) : '00:00';
}

// --- Emoji CTR for title tags (A4) ---
function getMatchTitleEmoji(matchDatetime) {
    const now = new Date();
    const start = new Date(matchDatetime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    if (now >= start && now <= end) return '🔴';
    if (now < start) return '▶';
    return '📺';
}

// --- CSS Loading ---
const mainCSS = readSrc('styles/main.css');
const componentsCSS = readSrc('styles/components.css');
const criticalCSS = `<style>${mainCSS}\n${componentsCSS}</style>`;

// --- HTML Builders ---
function htmlHead(opts) {
    const { title, description, keywords, canonical, ogImage, schemas, hreflangTags } = opts;
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="keywords" content="${keywords || ''}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#1a1a2e">
<meta name="date" content="${BUILD_DATE}">
<link rel="canonical" href="${SITE_URL}${canonical}">
${hreflangTags || ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${SITE_URL}${canonical}">
<meta property="og:image" content="${SITE_URL}${ogImage || '/og/home.png'}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Velcuri">
<meta property="og:locale" content="es_419">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${SITE_URL}${ogImage || '/og/home.png'}">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://tvtvhd.com">
<link rel="dns-prefetch" href="https://tvtvhd.com">
${criticalCSS}
${schemas ? renderSchemas(schemas) : ''}
<link rel="alternate" type="application/rss+xml" title="Velcuri — Fútbol en Vivo" href="${SITE_URL}/feed.xml">
<!-- Microsoft Clarity -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "vipqlnktf1");
</script>
</head>`;
}

function navHTML() {
    return `<nav class="nav"><div class="nav__inner">
<a href="/" class="nav__logo">Vel<span>curi</span></a>
<button class="nav__hamburger" aria-label="Menú" onclick="document.querySelector('.nav__links').classList.toggle('open')">☰</button>
<ul class="nav__links">
<li><a href="/partidos-en-vivo/" class="nav__link">En Vivo</a></li>
<li><a href="/partidos-de-hoy/" class="nav__link">Hoy</a></li>
<li class="nav__dropdown"><span class="nav__link nav__dropdown-toggle">Ligas</span>
<div class="nav__dropdown-menu">
<a href="/liga/champions-league/">Champions League</a>
<a href="/liga/laliga/">LaLiga</a>
<a href="/liga/premier-league/">Premier League</a>
<a href="/liga/serie-a/">Serie A</a>
<a href="/liga/bundesliga/">Bundesliga</a>
<a href="/liga/copa-libertadores/">Copa Libertadores</a>
</div></li>
<li class="nav__dropdown"><span class="nav__link nav__dropdown-toggle">Canales</span>
<div class="nav__dropdown-menu">
<a href="/canal/espn-en-vivo/">ESPN en vivo</a>
<a href="/canal/fox-sports-en-vivo/">Fox Sports</a>
<a href="/canal/movistar-deportes/">Movistar Deportes</a>
</div></li>
<li class="nav__dropdown"><span class="nav__link nav__dropdown-toggle">País</span>
<div class="nav__dropdown-menu">
<a href="/ar/">🇦🇷 Argentina</a>
<a href="/mx/">🇲🇽 México</a>
<a href="/es/">🇪🇸 España</a>
<a href="/co/">🇨🇴 Colombia</a>
<a href="/pe/">🇵🇪 Perú</a>
</div></li>
</ul></div></nav>`;
}

function footerHTML() {
    return `<footer class="footer"><div class="container"><div class="footer__grid">
<div class="footer__section"><h4>Fútbol en Vivo</h4><ul>
<li><a href="/tarjeta-roja/">Tarjeta Roja</a></li>
<li><a href="/rojadirecta/">Rojadirecta</a></li>
<li><a href="/pirlotv/">Pirlotv</a></li>
<li><a href="/futbol-en-vivo/">Fútbol en Vivo</a></li>
<li><a href="/ver-futbol-online/">Ver Fútbol Online</a></li>
</ul></div>
<div class="footer__section"><h4>Ligas</h4><ul>
<li><a href="/liga/champions-league/">Champions League</a></li>
<li><a href="/liga/laliga/">Liga Española</a></li>
<li><a href="/liga/premier-league/">Premier League</a></li>
<li><a href="/liga/serie-a/">Serie A</a></li>
<li><a href="/liga/bundesliga/">Bundesliga</a></li>
<li><a href="/liga/copa-libertadores/">Copa Libertadores</a></li>
<li><a href="/liga/liga-mx/">Liga MX</a></li>
</ul></div>
<div class="footer__section"><h4>Canales</h4><ul>
<li><a href="/canal/espn-en-vivo/">ESPN en vivo</a></li>
<li><a href="/canal/fox-sports-en-vivo/">Fox Sports</a></li>
<li><a href="/canal/disney-plus-en-vivo/">Disney+</a></li>
<li><a href="/canal/tnt-sports-en-vivo/">TNT Sports</a></li>
</ul></div>
<div class="footer__section"><h4>Información</h4><ul>
<li><a href="/sobre-velcuri/">Sobre Velcuri</a></li>
<li><a href="/contacto/">Contacto</a></li>
<li><a href="/politica-de-privacidad/">Privacidad</a></li>
<li><a href="/terminos-de-uso/">Términos</a></li>
<li><a href="/aviso-legal/">Aviso Legal</a></li>
<li><a href="/blog/">Blog</a></li>
</ul></div>
</div><div class="footer__bottom">
<p>© ${new Date().getFullYear()} Velcuri.io — Ver fútbol en vivo gratis. No alojamos ningún contenido audiovisual.</p>
</div></div></footer>
<script src="/scripts/player.js" defer></script>
<script src="/scripts/countdown.js" defer></script>
</body></html>`;
}

function matchCardHTML(match) {
    const channelBadges = match.embeds.slice(0, 3).map(e =>
        `<span class="match-card__channel-badge">${e.name.replace(/\|.*$/, '').replace(/┃.*$/, '').trim()}</span>`
    ).join('');
    return `<article class="match-card">
<div class="match-card__league">${match.league} · ${match.countryName}</div>
<div class="match-card__teams"><span>${match.homeTeam}</span><span class="match-card__vs">VS</span><span>${match.awayTeam || 'TBD'}</span></div>
<div class="match-card__time"><time datetime="${match.startDate}">${formatTime(match.hour)}</time></div>
<div class="match-card__channels">${channelBadges}</div>
<a href="/${match.slug}/" class="match-card__cta">Ver ${match.homeTeam} vs ${match.awayTeam} en vivo</a>
</article>`;
}

// --- Page Generators ---
function generateHomepage(data) {
    const topMatches = getTopMatchesForBuild(data.events, 10);
    const matchCards = topMatches.map(matchCardHTML).join('\n');
    const leagueCards = Object.values(data.leagues).slice(0, 8).map(l =>
        `<a href="/liga/${l.slug}/" class="card hub-card"><span class="hub-card__title">${l.name}</span><span class="hub-card__count">${l.matchCount} partidos</span></a>`
    ).join('\n');

    const faqItems = [
        { q: '¿Qué es Velcuri?', a: 'Velcuri es una plataforma gratuita para ver partidos de fútbol en vivo. Ofrecemos enlaces a transmisiones en directo de todas las ligas del mundo.' },
        { q: '¿Es gratis ver los partidos?', a: 'Sí, todos los partidos disponibles en Velcuri son completamente gratis. No necesitas registrarte ni pagar suscripción alguna.' },
        { q: '¿Qué ligas puedo ver en Velcuri?', a: 'Puedes ver Champions League, LaLiga, Premier League, Serie A, Bundesliga, Copa Libertadores, Liga MX y muchas más.' },
        { q: '¿Funciona en dispositivos móviles?', a: 'Sí, Velcuri está optimizado para funcionar perfectamente en smartphones, tablets y computadoras.' },
        { q: '¿Necesito instalar alguna aplicación?', a: 'No, Velcuri funciona directamente desde tu navegador web. No necesitas descargar ni instalar nada.' },
        { q: '¿Cuál es la diferencia entre Velcuri y Rojadirecta?', a: 'Velcuri es una alternativa moderna a Rojadirecta, Tarjeta Roja y Pirlotv, con una interfaz más rápida y mejor organización de los partidos.' },
    ];
    const faqHTML = faqItems.map(f => `<div class="faq__item"><button class="faq__question" onclick="this.parentElement.classList.toggle('active')">${f.q}</button><div class="faq__answer"><p>${f.a}</p></div></div>`).join('\n');

    const schemas = [websiteSchema(), itemListSchema(topMatches.map(m => ({ name: m.title, url: `/${m.slug}/` }))), faqSchema(faqItems)];
    const body = `<body>${navHTML()}<main class="container">
<div class="hero"><div class="hero__badge">${data.events.length} partidos disponibles</div>
<h1>Fútbol <span class="text-accent">EN VIVO</span> Gratis</h1>
<p>Ver partidos de fútbol en vivo gratis hoy. Champions League, LaLiga, Premier League y más. Alternativa a Rojadirecta, Tarjeta Roja, Pirlotv.</p></div>
<section class="section"><h2 class="section__title">⚽ Partidos <span>Destacados</span></h2>
<div class="grid grid--3">${matchCards}</div></section>
<section class="section"><h2 class="section__title">🏆 Ligas <span>Destacadas</span></h2>
<div class="grid grid--4">${leagueCards}</div></section>
<section class="section"><h2 class="section__title">🌎 Por <span>País</span></h2>
<div class="grid grid--4">
<a href="/ar/" class="card country-card"><span class="country-card__flag">🇦🇷</span><span class="country-card__name">Argentina</span></a>
<a href="/mx/" class="card country-card"><span class="country-card__flag">🇲🇽</span><span class="country-card__name">México</span></a>
<a href="/es/" class="card country-card"><span class="country-card__flag">🇪🇸</span><span class="country-card__name">España</span></a>
<a href="/co/" class="card country-card"><span class="country-card__flag">🇨🇴</span><span class="country-card__name">Colombia</span></a>
<a href="/pe/" class="card country-card"><span class="country-card__flag">🇵🇪</span><span class="country-card__name">Perú</span></a>
</div></section>
<section class="content-block">
<h2>Ver Fútbol en Vivo Gratis en Velcuri</h2>
<p>Bienvenido a <strong>Velcuri</strong>, tu destino definitivo para ver fútbol en vivo gratis desde cualquier dispositivo. Nuestra plataforma reúne las mejores transmisiones en directo de partidos de todas las ligas y competiciones del mundo, incluyendo la <strong>Champions League</strong>, <strong>LaLiga</strong>, <strong>Premier League</strong>, <strong>Serie A</strong>, <strong>Bundesliga</strong>, <strong>Copa Libertadores</strong>, <strong>Liga MX</strong> y muchas más.</p>
<p>En Velcuri no necesitas registrarte, pagar suscripciones ni instalar aplicaciones. Simplemente elige el partido que quieres ver, selecciona uno de los canales disponibles y disfruta de la transmisión en directo. Somos la mejor alternativa a <strong>Rojadirecta</strong>, <strong>Tarjeta Roja</strong> y <strong>Pirlotv</strong>, ofreciendo una experiencia más rápida, moderna y organizada para los amantes del fútbol en español.</p>
<p>Cada día actualizamos nuestro catálogo de partidos para que siempre tengas acceso a los encuentros más importantes del momento. Desde los clásicos europeos hasta los derbis sudamericanos, en Velcuri encontrarás todos los partidos que buscas con múltiples opciones de canales y calidad HD.</p>
<p>Nuestra plataforma está optimizada para ofrecer la mejor experiencia de usuario posible, con tiempos de carga ultrarrápidos, un diseño intuitivo y compatibilidad total con smartphones, tablets y computadoras. No importa dónde estés ni qué dispositivo uses: con Velcuri, el fútbol en vivo está siempre al alcance de tu mano.</p>
</section>
<section class="section faq"><h2 class="section__title">❓ Preguntas <span>Frecuentes</span></h2>${faqHTML}</section>
</main>${footerHTML()}`;

    const head = htmlHead({ title: 'Fútbol en Vivo Gratis | Partidos de Hoy — Velcuri', description: 'Ver fútbol en vivo gratis hoy. Todos los partidos en directo: Champions League, Liga Española, Serie A y más. Alternativa a Rojadirecta, Tarjeta Roja, Pirlotv.', keywords: 'fútbol en vivo, partidos hoy, ver fútbol gratis, fútbol online, rojadirecta, tarjeta roja, pirlotv', canonical: '/', schemas, hreflangTags: generateHreflangTags('/') });
    writePage('', head + body);
    console.log('[build] ✓ Homepage');
}

function generateMatchPage(match, data) {
    const leagueSlug = detectLeague(match.rawDescription);
    const leagueBlock = getLeagueBlock(leagueSlug);
    const leagueName = getLeagueDisplayName(leagueSlug);
    const channels = match.embeds.map(e => ({ name: e.name.replace(/\|.*$/, '').replace(/┃.*$/, '').trim(), url: e.iframeUrl }));
    const channelsJSON = JSON.stringify(channels).replace(/"/g, '&quot;');

    const relatedSameLeague = data.events.filter(e => e.leagueSlug === match.leagueSlug && e.id !== match.id).slice(0, 4);
    const relatedToday = data.events.filter(e => e.date === match.date && e.id !== match.id).slice(0, 4);

    const matchFaqs = [
        { q: `¿Dónde ver ${match.homeTeam} vs ${match.awayTeam} en vivo gratis?`, a: `Puedes ver ${match.homeTeam} vs ${match.awayTeam} en vivo y gratis en Velcuri. Haz clic en "Ver EN VIVO GRATIS" para acceder a la transmisión en directo.` },
        { q: `¿A qué hora juega ${match.homeTeam} vs ${match.awayTeam}?`, a: `El partido ${match.homeTeam} vs ${match.awayTeam} se juega el ${formatDate(match.startDate)} a las ${formatTime(match.hour)} (hora UTC).` },
        { q: `¿En qué canal transmiten ${match.homeTeam} vs ${match.awayTeam}?`, a: `El partido está disponible en: ${channels.map(c => c.name).join(', ')}. Todos los canales están disponibles gratis en Velcuri.` },
        { q: '¿Puedo ver el partido gratis sin registrarme?', a: 'Sí, en Velcuri puedes ver todos los partidos gratis y sin necesidad de registrarte ni crear una cuenta.' },
    ];
    const faqHTML = matchFaqs.map(f => `<div class="faq__item"><button class="faq__question" onclick="this.parentElement.classList.toggle('active')">${f.q}</button><div class="faq__answer"><p>${f.a}</p></div></div>`).join('\n');

    const schemas = [sportsEventSchema(match), broadcastEventSchema(match), faqSchema(matchFaqs), breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: match.league, url: `/liga/${match.leagueSlug}/` }, { name: match.title }])];
    const emoji = getMatchTitleEmoji(match.startDate);
    const title = `${emoji} ${match.homeTeam} vs ${match.awayTeam} EN VIVO GRATIS | ${match.league} — Velcuri`;
    const desc = `Ver ${match.homeTeam} vs ${match.awayTeam} gratis hoy ${formatDate(match.startDate)}. Canales: ${channels.slice(0, 3).map(c => c.name).join(', ')}. Transmisión HD en directo sin registro — ${match.league}.`;
    const ogTitle = `${match.homeTeam} vs ${match.awayTeam} EN VIVO GRATIS | ${match.league} — Velcuri`;

    // C6: rel=next/prev for same-team matches
    const siblings = data.events.filter(m => m.homeTeam === match.homeTeam && m.awayTeam === match.awayTeam).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const idx = siblings.findIndex(m => m.slug === match.slug);
    const prevMatch = siblings[idx - 1] || null;
    const nextMatch = siblings[idx + 1] || null;
    const paginationLinks = [prevMatch ? `<link rel="prev" href="${SITE_URL}/${prevMatch.slug}/">` : '', nextMatch ? `<link rel="next" href="${SITE_URL}/${nextMatch.slug}/">` : ''].filter(Boolean).join('\n');

    const head = htmlHead({ title, description: desc, keywords: `${match.homeTeam}, ${match.awayTeam}, ${match.league}, en vivo, gratis`, canonical: `/${match.slug}/`, ogImage: `/og/${match.slug}.png`, schemas, hreflangTags: paginationLinks });

    const body = `<body>${navHTML()}<main class="container">
<ol class="breadcrumb"><li><a href="/">Inicio</a></li><li><a href="/liga/${match.leagueSlug}/">${match.league}</a></li><li>${match.title}</li></ol>
<div class="match-layout"><div>
<h1>${match.homeTeam} vs ${match.awayTeam} <span class="text-accent">EN VIVO</span></h1>
<p class="match-meta">${match.league} · ${formatDate(match.startDate)} · ${formatTime(match.hour)} UTC</p>
<div id="countdown" class="countdown" data-start="${match.startDate}">
<div class="countdown__unit"><span class="countdown__value" id="cd-days">00</span><span class="countdown__label">Días</span></div>
<div class="countdown__unit"><span class="countdown__value" id="cd-hours">00</span><span class="countdown__label">Horas</span></div>
<div class="countdown__unit"><span class="countdown__value" id="cd-mins">00</span><span class="countdown__label">Min</span></div>
<div class="countdown__unit"><span class="countdown__value" id="cd-secs">00</span><span class="countdown__label">Seg</span></div>
</div>
<div class="player-container">
<div id="player-poster" class="player-poster" data-channels="${channelsJSON}">
<h2>${match.homeTeam} vs ${match.awayTeam}</h2>
<p>${match.league} | ${formatTime(match.hour)} UTC</p>
<button id="play-btn" class="btn btn--primary btn--large">▶ Ver EN VIVO GRATIS</button>
</div>
<div id="player-tabs" class="player-tabs" style="display:none"></div>
<div id="player-frame" class="player-frame" style="display:none"></div>
</div>
<noscript>
<div class="content-block"><p>Canales disponibles para este partido:</p><ul>
${channels.map(c => `<li>${c.name}</li>`).join('\n')}
</ul></div>
</noscript>
<noscript>
<p class="match-meta">El partido comienza el <strong>${formatDate(match.startDate)} a las ${formatTime(match.hour)} UTC</strong>.</p>
</noscript>
<section class="content-block match-context"><h2>Sobre la ${leagueName}</h2>${leagueBlock}</section>
${relatedToday.length ? `<section class="section"><h2 class="section__title">Otros partidos hoy</h2><div class="grid grid--2">${relatedToday.map(matchCardHTML).join('')}</div></section>` : ''}
${relatedSameLeague.length ? `<section class="section"><h2 class="section__title">Más partidos de ${match.league}</h2><div class="grid grid--2">${relatedSameLeague.map(matchCardHTML).join('')}</div></section>` : ''}
<section class="section faq"><h2 class="section__title">Preguntas Frecuentes</h2>${faqHTML}</section>
</div>
<aside><div class="match-info"><h3 class="info-title">Info del Partido</h3>
<div class="match-info__row"><span class="match-info__label">Liga</span><span class="match-info__value">${match.league}</span></div>
<div class="match-info__row"><span class="match-info__label">Fecha</span><span class="match-info__value">${formatDate(match.startDate)}</span></div>
<div class="match-info__row"><span class="match-info__label">Hora</span><span class="match-info__value">${formatTime(match.hour)} UTC</span></div>
<div class="match-info__row"><span class="match-info__label">País</span><span class="match-info__value">${match.countryName}</span></div>
<div class="match-info__row"><span class="match-info__label">Canales</span><span class="match-info__value">${channels.length}</span></div>
</div></aside></div></main>${footerHTML()}`;

    writePage(match.slug, head + body);
}

function generateMatchPages(data) {
    for (const match of data.events) {
        generateMatchPage(match, data);
    }
    console.log(`[build] ✓ ${data.events.length} match pages`);
}

// Hreflang helper for pages with country variants
const HREFLANG_COUNTRIES = [
    { code: 'ar', lang: 'es-AR' },
    { code: 'mx', lang: 'es-MX' },
    { code: 'es', lang: 'es-ES' },
    { code: 'co', lang: 'es-CO' },
    { code: 'pe', lang: 'es-PE' },
];

function generateHreflangTags(canonical) {
    const tags = HREFLANG_COUNTRIES.map(c =>
        `<link rel="alternate" hreflang="${c.lang}" href="${SITE_URL}/${c.code}${canonical}">`
    ).join('\n');
    return `${tags}\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}${canonical}">`;
}

// Continue in generate-pages.js
export { htmlHead, navHTML, footerHTML, matchCardHTML, writePage, writeFile, ensureDir, formatDate, formatTime, DIST, SRC, ROOT, SITE_URL, BUILD_DATE, criticalCSS, generateHreflangTags, generateHomepage, generateMatchPages };
