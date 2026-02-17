// build/generate-sitemap.js — 7-file sitemap split + search index
import { writeFile, SITE_URL, BUILD_DATE, DIST } from './generate.js';
import { BLOG_POSTS } from './generate-blog.js';
import { COUNTRIES, HUB_PAGES } from './generate-pages.js';

function sitemapHeader() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;
}

function urlEntry(loc, priority, changefreq) {
    return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${BUILD_DATE.substring(0, 10)}</lastmod>
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
    // Static pages
    for (const slug of ['sobre-velcuri', 'contacto', 'politica-de-privacidad', 'terminos-de-uso', 'aviso-legal', 'preguntas-frecuentes', 'buscar']) {
        hubEntries.push(urlEntry(`/${slug}/`, '0.3', 'monthly'));
    }
    counts['sitemap-hubs.xml'] = writeSitemap('sitemap-hubs.xml', hubEntries);

    // 2. sitemap-matches.xml — all match pages
    const matchEntries = data.events.map(m =>
        urlEntry(`/${m.slug}/`, '0.7', 'hourly')
    );
    counts['sitemap-matches.xml'] = writeSitemap('sitemap-matches.xml', matchEntries);

    // 3. sitemap-leagues.xml — all league pages
    const leagueEntries = Object.keys(data.leagues).map(slug =>
        urlEntry(`/liga/${slug}/`, '0.7', 'daily')
    );
    counts['sitemap-leagues.xml'] = writeSitemap('sitemap-leagues.xml', leagueEntries);

    // 4. sitemap-channels.xml — all channel pages
    const channelEntries = Object.keys(data.channels).map(slug =>
        urlEntry(`/canal/${slug}/`, '0.6', 'daily')
    );
    counts['sitemap-channels.xml'] = writeSitemap('sitemap-channels.xml', channelEntries);

    // 5. sitemap-teams.xml — all team pages
    const teamEntries = Object.keys(data.teams).map(slug =>
        urlEntry(`/equipo/${slug}/`, '0.5', 'weekly')
    );
    counts['sitemap-teams.xml'] = writeSitemap('sitemap-teams.xml', teamEntries);

    // 6. sitemap-countries.xml — all country locale pages + sub-pages
    const countryEntries = [];
    for (const c of COUNTRIES) {
        countryEntries.push(urlEntry(`/${c.code}/`, '0.7', 'daily'));
        for (const sub of ['partidos-de-hoy', 'futbol-en-vivo', 'rojadirecta', 'tarjeta-roja', 'pirlotv']) {
            countryEntries.push(urlEntry(`/${c.code}/${sub}/`, '0.6', 'daily'));
        }
    }
    counts['sitemap-countries.xml'] = writeSitemap('sitemap-countries.xml', countryEntries);

    // 7. sitemap-blog.xml — all blog posts + index
    const blogEntries = [urlEntry('/blog/', '0.5', 'weekly')];
    for (const post of BLOG_POSTS) {
        blogEntries.push(urlEntry(`/blog/${post.slug}/`, '0.6', 'monthly'));
    }
    counts['sitemap-blog.xml'] = writeSitemap('sitemap-blog.xml', blogEntries);

    // Master sitemap index
    const subSitemaps = [
        'sitemap-hubs.xml', 'sitemap-matches.xml', 'sitemap-leagues.xml',
        'sitemap-channels.xml', 'sitemap-teams.xml', 'sitemap-countries.xml', 'sitemap-blog.xml'
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
    console.log(`[build] ✓ sitemap.xml index + 7 sub-sitemaps (${total} URLs)`);
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
