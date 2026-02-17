// build/generate-feed.js — RSS 2.0 feed for Bing + Microsoft Start
import { writeFile, SITE_URL, BUILD_DATE } from './generate.js';
import { getTopMatchesForBuild } from '../src/data/leaguePriority.js';

const BLOG_POSTS = [
    { slug: 'como-ver-futbol-gratis-2026', title: 'Cómo ver fútbol gratis online en 2026 — Guía completa', desc: 'Descubre las mejores opciones para ver fútbol en vivo gratis en 2026 sin pagar suscripciones.' },
    { slug: 'mejores-ligas-futbol-mundo', title: 'Las 10 mejores ligas de fútbol del mundo — Ranking 2026', desc: 'Ranking actualizado de las mejores ligas del mundo: LaLiga, Premier League, Serie A y más.' },
    { slug: 'historia-champions-league', title: 'Historia de la Champions League: Todo lo que debes saber', desc: 'Recorre la historia de la UEFA Champions League desde sus inicios hasta la actualidad.' },
    { slug: 'como-funciona-var-futbol', title: 'Cómo funciona el VAR en el fútbol — Explicación completa', desc: 'Explicación detallada del sistema VAR: reglas, cuándo se usa y cómo afecta al fútbol moderno.' },
    { slug: 'mejores-goleadores-historia-futbol', title: 'Los 10 mejores goleadores de la historia del fútbol', desc: 'De Pelé a Messi y Ronaldo: los máximos goleadores que marcaron la historia del fútbol.' },
];

function toRFC822(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toUTCString();
}

function escapeXML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generateFeed(data) {
    const topMatches = getTopMatchesForBuild(data.events, 10);

    const blogItems = BLOG_POSTS.map(post => `    <item>
      <title>${escapeXML(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}/</guid>
      <pubDate>${toRFC822(BUILD_DATE)}</pubDate>
      <description>${escapeXML(post.desc)}</description>
      <category>Blog</category>
    </item>`).join('\n');

    const matchItems = topMatches.map(m => {
        const channels = m.embeds ? m.embeds.map(e => e.name.replace(/\|.*$/, '').trim()).slice(0, 3).join(', ') : 'Velcuri';
        return `    <item>
      <title>Ver ${escapeXML(m.homeTeam)} vs ${escapeXML(m.awayTeam)} EN VIVO GRATIS — ${escapeXML(m.league)}</title>
      <link>${SITE_URL}/${m.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/${m.slug}/</guid>
      <pubDate>${toRFC822(m.startDate)}</pubDate>
      <description>Ver ${escapeXML(m.homeTeam)} vs ${escapeXML(m.awayTeam)} gratis. Canales: ${escapeXML(channels)}. Transmisión en directo sin registro.</description>
      <category>Partido en Vivo</category>
    </item>`;
    }).join('\n');

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Velcuri — Fútbol en Vivo Gratis</title>
    <link>${SITE_URL}</link>
    <description>Partidos de fútbol en vivo gratis. Champions, LaLiga, Premier League y más.</description>
    <language>es-419</language>
    <lastBuildDate>${toRFC822(BUILD_DATE)}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icons/icon-192.png</url>
      <title>Velcuri</title>
      <link>${SITE_URL}</link>
    </image>

${blogItems}

${matchItems}

  </channel>
</rss>`;

    writeFile('feed.xml', feed);
    console.log('[build] ✓ RSS feed (feed.xml)');
}
