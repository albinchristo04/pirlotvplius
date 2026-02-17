// build/generate-sitemap.js — Sitemap XML + search index + hreflang generators
import { writeFile, SITE_URL, BUILD_DATE, DIST } from './generate.js';
import { BLOG_POSTS } from './generate-blog.js';
import { COUNTRIES, HUB_PAGES } from './generate-pages.js';

export function generateSitemap(data) {
    const urls = [];

    // Core pages
    urls.push({ loc: '/', priority: '1.0', changefreq: 'hourly' });
    urls.push({ loc: '/partidos-de-hoy/', priority: '0.9', changefreq: 'hourly' });
    urls.push({ loc: '/partidos-en-vivo/', priority: '0.9', changefreq: 'hourly' });

    // Hub pages
    for (const hub of HUB_PAGES) {
        urls.push({ loc: `/${hub.slug}/`, priority: '0.8', changefreq: 'daily' });
    }

    // Match pages
    for (const match of data.events) {
        urls.push({ loc: `/${match.slug}/`, priority: '0.7', changefreq: 'hourly' });
    }

    // League pages
    for (const slug of Object.keys(data.leagues)) {
        urls.push({ loc: `/liga/${slug}/`, priority: '0.7', changefreq: 'daily' });
    }

    // Channel pages
    for (const slug of Object.keys(data.channels)) {
        urls.push({ loc: `/canal/${slug}/`, priority: '0.6', changefreq: 'weekly' });
    }

    // Team pages
    for (const slug of Object.keys(data.teams)) {
        urls.push({ loc: `/equipo/${slug}/`, priority: '0.5', changefreq: 'weekly' });
    }

    // Country pages
    for (const c of COUNTRIES) {
        urls.push({ loc: `/${c.code}/`, priority: '0.7', changefreq: 'daily' });
    }

    // Blog posts
    for (const post of BLOG_POSTS) {
        urls.push({ loc: `/blog/${post.slug}/`, priority: '0.6', changefreq: 'monthly' });
    }
    urls.push({ loc: '/blog/', priority: '0.5', changefreq: 'weekly' });

    // Static pages
    for (const slug of ['sobre-velcuri', 'contacto', 'politica-de-privacidad', 'terminos-de-uso', 'aviso-legal']) {
        urls.push({ loc: `/${slug}/`, priority: '0.3', changefreq: 'monthly' });
    }

    const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${BUILD_DATE.substring(0, 10)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    writeFile('sitemap.xml', sitemapXML);
    console.log(`[build] ✓ sitemap.xml (${urls.length} URLs)`);
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
