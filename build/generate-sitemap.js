// build/generate-sitemap.js — 10-file sitemap split + news sitemap + search index
import { writeFile, SITE_URL, BUILD_DATE, DIST } from './generate.js';
import { BLOG_POSTS } from './generate-blog.js';
import { COUNTRIES, HUB_PAGES } from './generate-pages.js';

function sitemapHeader() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;
}

function urlEntry(loc, priority, changefreq, lastmod) {
    return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${lastmod || BUILD_DATE.substring(0, 10)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function writeSitemap(filename, entries) {
    const xml = `${sitemapHeader()}\n${entries.join('\n')}\n</urlset>`;
    writeFile(filename, xml);
    return entries.length;
}

export function generateSitemap(data) {
    const counts = {};

    // 1. sitemap-hubs.xml — homepage + hub pages + static pages
    const hubEntries = [
        urlEntry('/', '1.0', 'hourly'),
        urlEntry('/partidos-de-hoy/', '0.9', 'hourly'),
        urlEntry('/partidos-en-vivo/', '0.9', 'hourly'),
    ];
    for (const hub of HUB_PAGES) {
        hubEntries.push(urlEntry(`/${hub.slug}/`, '0.8', 'daily'));
    }
    for (const slug of ['sobre-velcuri', 'contacto', 'politica-de-privacidad', 'terminos-de-uso', 'aviso-legal', 'preguntas-frecuentes', 'buscar']) {
        hubEntries.push(urlEntry(`/${slug}/`, '0.3', 'monthly', '2026-01-01'));
    }
    counts['sitemap-hubs.xml'] = writeSitemap('sitemap-hubs.xml', hubEntries);

    // 2. sitemap-matches.xml — all match pages
    const matchEntries = data.events.map(m => {
        const matchDate = new Date(m.startDate);
        const now = new Date();
        const lastmod = matchDate < now ? matchDate.toISOString().split('T')[0] : now.toISOString();
        return urlEntry(`/${m.slug}/`, '0.7', 'hourly', lastmod);
    });
    counts['sitemap-matches.xml'] = writeSitemap('sitemap-matches.xml', matchEntries);

    // 3. sitemap-leagues.xml
    const leagueEntries = Object.keys(data.leagues).map(slug =>
        urlEntry(`/liga/${slug}/`, '0.7', 'daily')
    );
    counts['sitemap-leagues.xml'] = writeSitemap('sitemap-leagues.xml', leagueEntries);

    // 4. sitemap-channels.xml
    const channelEntries = Object.keys(data.channels).map(slug =>
        urlEntry(`/canal/${slug}/`, '0.6', 'daily')
    );
    counts['sitemap-channels.xml'] = writeSitemap('sitemap-channels.xml', channelEntries);

    // 5. sitemap-teams.xml
    const teamEntries = Object.keys(data.teams).map(slug =>
        urlEntry(`/equipo/${slug}/`, '0.5', 'weekly')
    );
    counts['sitemap-teams.xml'] = writeSitemap('sitemap-teams.xml', teamEntries);

    // 6. sitemap-countries.xml — country pages + hub sub-pages + league sub-pages
    const countryEntries = [];
    for (const c of COUNTRIES) {
        countryEntries.push(urlEntry(`/${c.code}/`, '0.7', 'daily'));
        for (const sub of ['partidos-de-hoy', 'futbol-en-vivo', 'rojadirecta', 'tarjeta-roja', 'pirlotv']) {
            countryEntries.push(urlEntry(`/${c.code}/${sub}/`, '0.6', 'daily'));
        }
        for (const league of c.leagues) {
            countryEntries.push(urlEntry(`/${c.code}/liga/${league}/`, '0.6', 'daily'));
        }
    }
    counts['sitemap-countries.xml'] = writeSitemap('sitemap-countries.xml', countryEntries);

    // 7. sitemap-blog.xml
    const blogEntries = [urlEntry('/blog/', '0.5', 'weekly')];
    for (const post of BLOG_POSTS) {
        blogEntries.push(urlEntry(`/blog/${post.slug}/`, '0.6', 'monthly', post.date || '2026-01-01'));
    }
    counts['sitemap-blog.xml'] = writeSitemap('sitemap-blog.xml', blogEntries);

    // 8. sitemap-h2h.xml — rivalry pages
    const h2hSlugs = ['real-madrid-vs-barcelona', 'river-plate-vs-boca-juniors', 'manchester-united-vs-manchester-city', 'liverpool-vs-everton', 'ac-milan-vs-inter-milan', 'juventus-vs-torino', 'bayern-munich-vs-borussia-dortmund', 'psg-vs-marseille', 'atletico-madrid-vs-real-madrid', 'barcelona-vs-atletico-madrid', 'celtic-vs-rangers', 'galatasaray-vs-fenerbahce', 'flamengo-vs-fluminense', 'america-vs-chivas', 'sporting-cp-vs-benfica', 'ajax-vs-psv', 'arsenal-vs-tottenham', 'roma-vs-lazio', 'real-madrid-vs-atletico-madrid', 'nacional-vs-penarol'];
    const h2hEntries = h2hSlugs.map(s => urlEntry(`/rival/${s}/`, '0.6', 'weekly'));
    counts['sitemap-h2h.xml'] = writeSitemap('sitemap-h2h.xml', h2hEntries);

    // 9. sitemap-guides.xml — "Cómo Ver" guide pages
    const guideSlugs = ['como-ver-champions-league-gratis', 'como-ver-laliga-sin-pagar', 'como-ver-premier-league-gratis', 'como-ver-copa-libertadores-gratis', 'como-ver-futbol-en-movil', 'como-ver-futbol-sin-suscripcion', 'canales-deportivos-gratis-online', 'mejores-paginas-ver-futbol-gratis'];
    const guideEntries = guideSlugs.map(s => urlEntry(`/${s}/`, '0.7', 'monthly'));
    counts['sitemap-guides.xml'] = writeSitemap('sitemap-guides.xml', guideEntries);

    // 10. sitemap-news.xml — news sitemap for recent matches + blog (< 48h)
    const now = new Date();
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const recentMatches = data.events.filter(m => {
        const d = new Date(m.startDate);
        return d >= cutoff48h && d <= new Date(now.getTime() + 48 * 60 * 60 * 1000);
    });
    const newsEntries = recentMatches.map(m => `  <url>
    <loc>${SITE_URL}/${m.slug}/</loc>
    <news:news>
      <news:publication>
        <news:name>Velcuri</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${new Date(m.startDate).toISOString()}</news:publication_date>
      <news:title>Ver ${m.homeTeam} vs ${m.awayTeam} EN VIVO GRATIS — ${m.league}</news:title>
    </news:news>
  </url>`);

    const newsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsEntries.join('\n')}
</urlset>`;
    writeFile('sitemap-news.xml', newsXml);
    counts['sitemap-news.xml'] = newsEntries.length;

    // Master sitemap index
    const subSitemaps = [
        'sitemap-hubs.xml', 'sitemap-matches.xml', 'sitemap-leagues.xml',
        'sitemap-channels.xml', 'sitemap-teams.xml', 'sitemap-countries.xml',
        'sitemap-blog.xml', 'sitemap-h2h.xml', 'sitemap-guides.xml', 'sitemap-news.xml'
    ];
    const indexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${subSitemaps.map(s => `  <sitemap>
    <loc>${SITE_URL}/${s}</loc>
    <lastmod>${BUILD_DATE.substring(0, 10)}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
    writeFile('sitemap.xml', indexXML);

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`[build] ✓ sitemap.xml index + 10 sub-sitemaps (${total} URLs)`);
}

export function generateSearchIndex(data) {
    const index = data.events.map(m => ({
        t: m.title,
        l: m.league,
        u: `/${m.slug}/`,
        d: m.date
    }));
    writeFile('search-index.json', JSON.stringify(index));
    console.log(`[build] ✓ search-index.json (${index.length} entries)`);
}
