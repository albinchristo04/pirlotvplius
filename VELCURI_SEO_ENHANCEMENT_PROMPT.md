# VELCURI.IO — SEO Enhancement Prompt v3
## Sections: Bing Signals + Evergreen Content + Technical SEO Gaps

---

## CONTEXT

This is an existing static site built with a custom Node.js SSG.
Deployment: Cloudflare Pages via GitHub.
Build command: `node build/generate.js` → outputs to `dist/`
Existing structure confirmed working:
- `src/data/fetch.js` — JSON fetcher + normalizer
- `src/data/leagueBlocks.js` — league detection
- `src/data/league-blocks/*.html` — 15 pre-written league blocks
- `build/generate.js` — homepage + match pages
- `build/generate-pages.js` — hubs + leagues + channels + countries
- `build/generate-blog.js` — blog posts
- `build/generate-sitemap.js` — sitemap.xml + search-index.json
- `build/build-main.js` — orchestrator

Do NOT rewrite existing files unless explicitly told to below.
Add new files. Extend existing files only where marked.

---

---

# SECTION A — BING-SPECIFIC SIGNALS

---

## A1 — Microsoft Clarity

### Task
Add Microsoft Clarity tracking snippet to every generated HTML page.

### Where to add
In `build/generate.js` and `build/generate-pages.js` and `build/generate-blog.js` — 
wherever the `</head>` closing tag is written, inject the Clarity snippet BEFORE it.

### Snippet to inject
```html
<!-- Microsoft Clarity -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "vipqlnktf1");
</script>
```



### Rules
- Inject on ALL pages: homepage, match pages, hub pages, blog, static pages
- Place immediately before `</head>` — after all other meta/schema tags

---


---

## A2 — Meta Description Rewrite for Copilot Optimization

### Task
Rewrite the meta description template for match pages and hub pages so the 
first sentence is a direct answer, not marketing copy.
Bing Copilot pulls the first complete sentence of a meta description.

### Match page meta description template (REPLACE existing)
```
Ver [HomeTeam] vs [AwayTeam] gratis hoy [DD/MM/YYYY]. 
Canales disponibles: [channel1], [channel2]. 
Transmisión HD en directo sin registro — [League].
```

### Hub page meta descriptions (REPLACE existing)

For `/tarjeta-roja/`:
```
Para ver fútbol gratis en lugar de Tarjeta Roja, entra a Velcuri y elige 
tu partido. Todos los partidos de hoy en directo, sin registro, sin suscripción.
```

For `/rojadirecta/`:
```
Alternativa a Rojadirecta para ver fútbol en vivo gratis hoy. 
Champions League, LaLiga, Premier League en directo sin pagar.
```

For `/pirlotv/`:
```
Ver fútbol como en Pirlotv pero sin cortes. Todos los partidos en vivo gratis, 
múltiples canales, sin instalar nada.
```

For `/partidos-de-hoy/`:
```
Partidos de fútbol de hoy [DD/MM/YYYY] en vivo gratis. 
[N] encuentros disponibles ahora mismo en directo.
```

### Rules
- Max 155 characters per description
- `[DD/MM/YYYY]` and `[N]` must be populated at build time with real values
- First sentence must be a complete standalone answer (Copilot extracts this)

---

## A3 — RSS Feed for Bing Crawler Priority + Microsoft Start

### Task
Generate `/dist/feed.xml` — an RSS 2.0 feed combining:
1. All blog posts (from `generate-blog.js` data)
2. The 10 most important upcoming matches (using `leaguePriority.js` scores)

### New file to create
`build/generate-feed.js`

### RSS feed specification
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" 
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Velcuri — Fútbol en Vivo Gratis</title>
    <link>https://www.velcuri.io</link>
    <description>Partidos de fútbol en vivo gratis. Champions, LaLiga, Premier League y más.</description>
    <language>es-419</language>
    <lastBuildDate>[RFC 822 DATE]</lastBuildDate>
    <atom:link href="https://www.velcuri.io/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://www.velcuri.io/icons/icon-192.png</url>
      <title>Velcuri</title>
      <link>https://www.velcuri.io</link>
    </image>

    <!-- Blog posts first (higher authority) -->
    <item>
      <title>[Blog Post Title]</title>
      <link>https://www.velcuri.io/blog/[slug]/</link>
      <guid isPermaLink="true">https://www.velcuri.io/blog/[slug]/</guid>
      <pubDate>[RFC 822 DATE]</pubDate>
      <description>[First 150 chars of post content]</description>
      <category>Blog</category>
    </item>

    <!-- Top 10 upcoming matches by league priority score -->
    <item>
      <title>Ver [HomeTeam] vs [AwayTeam] EN VIVO GRATIS — [League]</title>
      <link>https://www.velcuri.io/ver-[slug]-en-vivo/</link>
      <guid isPermaLink="true">https://www.velcuri.io/ver-[slug]-en-vivo/</guid>
      <pubDate>[match date in RFC 822]</pubDate>
      <description>
        Ver [HomeTeam] vs [AwayTeam] gratis el [DD/MM/YYYY] a las [HH:MM]. 
        Canales: [channel list]. Transmisión en directo sin registro.
      </description>
      <category>Partido en Vivo</category>
    </item>

  </channel>
</rss>
```

### Add to head of every page
```html
<link rel="alternate" type="application/rss+xml" 
      title="Velcuri — Fútbol en Vivo" 
      href="https://www.velcuri.io/feed.xml">
```

### Wire into build-main.js
Add `await generateFeed(normalizedData, blogPosts)` call after 
`generate-sitemap.js` call.

---

## A4 — Emoji CTR Optimization in Title Tags

### Task
Add emoji prefixes to title tags for match pages and hub pages.
Bing renders emojis in search results — these improve click-through rate.

### Match page title template (REPLACE existing)
Logic: if match is currently live → use 🔴, if upcoming → use ▶

```javascript
function getMatchTitleEmoji(matchDatetime) {
  const now = new Date();
  const start = new Date(matchDatetime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 hours
  
  if (now >= start && now <= end) return '🔴';  // live
  if (now < start) return '▶';                   // upcoming
  return '📺';                                    // ended/replay
}

// Title: `${emoji} [HomeTeam] vs [AwayTeam] EN VIVO GRATIS | [League] — Velcuri`
```

### Hub page titles (REPLACE existing)
```
/tarjeta-roja/    → 🔴 Tarjeta Roja — Ver Fútbol EN VIVO GRATIS | Velcuri
/rojadirecta/     → ▶ Rojadirecta EN VIVO — Partidos Gratis Hoy | Velcuri
/pirlotv/         → 📺 Pirlo TV EN VIVO — Fútbol Gratis Online | Velcuri
/partidos-de-hoy/ → 🗓️ Partidos de Hoy [DD/MM] EN VIVO Gratis | Velcuri
/partidos-en-vivo/→ 🔴 Partidos EN VIVO Ahora Mismo GRATIS | Velcuri
```

### Rules
- Emoji goes at the VERY START of `<title>` tag
- Max title length remains 60 characters (count emoji as 2 chars)
- og:title does NOT include emoji (some platforms render badly)

---

---

# SECTION B — EVERGREEN CONTENT PAGES

---

## B1 — Head-to-Head History Pages

### Task
Generate static H2H pages for the top 20 football rivalries.
These rank year-round for "[team] vs [team]" queries, not just on match day.

### New file to create
`build/generate-h2h.js`

### URL structure
```
/rival/real-madrid-vs-barcelona/
/rival/river-plate-vs-boca-juniors/
/rival/manchester-united-vs-manchester-city/
[etc.]
```

### Hard-coded rivalry list (build from this — no API needed)
```javascript
const RIVALRIES = [
  { home: 'Real Madrid',          away: 'Barcelona',             league: 'laliga',           slug: 'real-madrid-vs-barcelona' },
  { home: 'River Plate',          away: 'Boca Juniors',          league: 'superliga-argentina', slug: 'river-plate-vs-boca-juniors' },
  { home: 'Manchester United',    away: 'Manchester City',       league: 'premier-league',   slug: 'manchester-united-vs-manchester-city' },
  { home: 'Liverpool',            away: 'Everton',               league: 'premier-league',   slug: 'liverpool-vs-everton' },
  { home: 'AC Milan',             away: 'Inter Milan',           league: 'serie-a',          slug: 'ac-milan-vs-inter-milan' },
  { home: 'Juventus',             away: 'Torino',                league: 'serie-a',          slug: 'juventus-vs-torino' },
  { home: 'Bayern Munich',        away: 'Borussia Dortmund',     league: 'bundesliga',       slug: 'bayern-munich-vs-borussia-dortmund' },
  { home: 'PSG',                  away: 'Marseille',             league: 'ligue-1',          slug: 'psg-vs-marseille' },
  { home: 'Atletico Madrid',      away: 'Real Madrid',           league: 'laliga',           slug: 'atletico-madrid-vs-real-madrid' },
  { home: 'Barcelona',            away: 'Atletico Madrid',       league: 'laliga',           slug: 'barcelona-vs-atletico-madrid' },
  { home: 'Celtic',               away: 'Rangers',               league: 'premiership',      slug: 'celtic-vs-rangers' },
  { home: 'Galatasaray',          away: 'Fenerbahce',            league: 'super-lig',        slug: 'galatasaray-vs-fenerbahce' },
  { home: 'Flamengo',             away: 'Fluminense',            league: 'brasileirao',      slug: 'flamengo-vs-fluminense' },
  { home: 'America',              away: 'Chivas',                league: 'liga-mx',          slug: 'america-vs-chivas' },
  { home: 'Sporting CP',          away: 'Benfica',               league: 'primeira-liga',    slug: 'sporting-cp-vs-benfica' },
  { home: 'Ajax',                 away: 'PSV',                   league: 'eredivisie',       slug: 'ajax-vs-psv' },
  { home: 'Arsenal',              away: 'Tottenham',             league: 'premier-league',   slug: 'arsenal-vs-tottenham' },
  { home: 'Roma',                 away: 'Lazio',                 league: 'serie-a',          slug: 'roma-vs-lazio' },
  { home: 'Real Madrid',          away: 'Atletico Madrid',       league: 'laliga',           slug: 'real-madrid-vs-atletico-madrid' },
  { home: 'Nacional',             away: 'Penarol',               league: 'primera-division', slug: 'nacional-vs-penarol' },
];
```

### Page content requirements per H2H page

```html
<!-- Title: [HomeTeam] vs [AwayTeam] — Historial, Estadísticas y EN VIVO | Velcuri -->
<!-- Meta: Ver [H] vs [A] en vivo gratis. Historial completo, estadísticas H2H y próximo partido. -->

<h1>[HomeTeam] vs [AwayTeam]: Historial Completo</h1>

<!-- Section 1: Next match (if exists in current JSON data — link to match page) -->
<section id="proximo-partido">
  <h2>Próximo Partido</h2>
  <!-- If a match between these teams exists in JSON → show match card with watch link -->
  <!-- If no upcoming match → show "No hay partido programado próximamente" -->
</section>

<!-- Section 2: Static H2H summary block (300+ words, pre-written per rivalry) -->
<section id="historial">
  <h2>Historia del Clásico</h2>
  [RIVALRY_DESCRIPTION_BLOCK]  <!-- see B1a below -->
</section>

<!-- Section 3: Related matches currently available -->
<section id="ver-en-vivo">
  <h2>Ver en Vivo Gratis</h2>
  <!-- Top 4 matches from same league currently in JSON -->
</section>

<!-- Section 4: FAQ -->
<!-- Schema: FAQPage + SportsEvent (if next match exists) + BreadcrumbList -->
```

### B1a — Pre-written rivalry description blocks

Create `src/data/rivalry-blocks/[slug].html` for each rivalry.
Minimum 300 words each. Must include:
- History of the rivalry
- Notable matches/moments
- Current competitive context
- Natural inclusion of both team names 4+ times
- Final sentence: "Sigue el próximo [H] vs [A] en vivo gratis en Velcuri"

---

[SPACE — ADD ANY RIVALRY DATA OR CONTEXT HERE]

---

## B2 — "Cómo Ver" Static Guide Pages

### Task
Generate 8 static informational guide pages.
These target high-volume informational queries and funnel into match pages.
NO iframes on these pages — pure text + internal links only.

### New file to create
`build/generate-guides.js`

### Pages to generate

```
/como-ver-champions-league-gratis/
/como-ver-laliga-sin-pagar/
/como-ver-premier-league-gratis/
/como-ver-copa-libertadores-gratis/
/como-ver-futbol-en-movil/
/como-ver-futbol-sin-suscripcion/
/canales-deportivos-gratis-online/
/mejores-paginas-ver-futbol-gratis/
```

### Content template per guide page

```html
<!-- Title: Cómo Ver [Topic] Gratis en 2026 | Guía Completa — Velcuri -->
<!-- Meta (Copilot-optimized): Para ver [topic] gratis, entra a Velcuri, 
     selecciona el partido y haz clic en Ver EN VIVO. Sin registro ni suscripción. -->

<article>
  <h1>Cómo Ver [Topic] Gratis en 2026</h1>
  
  <p class="intro"><!-- 2-sentence direct answer for Copilot --></p>

  <h2>Pasos para Ver [Topic] Gratis</h2>
  <!-- Numbered steps: 1. Entra a velcuri.io 2. Busca el partido 3. Clic en Ver EN VIVO -->
  <!-- Step 3 must link to /partidos-de-hoy/ -->

  <h2>¿En Qué Canales Transmiten [Topic]?</h2>
  <!-- List relevant channels with links to /canal/[slug]/ pages -->

  <h2>¿Funciona en Móvil?</h2>
  <!-- 150 words about mobile compatibility -->

  <h2>Próximos Partidos de [Topic]</h2>
  <!-- Dynamic: pull from JSON any upcoming matches for this league -->
  <!-- Link each to its match page -->

  <h2>Preguntas Frecuentes</h2>
  <!-- 5 FAQ items, FAQPage schema -->

</article>

<!-- Schema: Article + FAQPage + BreadcrumbList -->
<!-- Internal links required on every guide: -->
<!--   → /partidos-de-hoy/  -->
<!--   → Relevant /liga/[slug]/  -->
<!--   → 2 relevant /canal/[slug]/  -->
<!--   → /rojadirecta/ or /tarjeta-roja/ (one hub link) -->
```

### Content for each guide — write inline in generate-guides.js as template strings
Minimum 600 words per page. Spanish only. 
The "Cómo Ver Champions League Gratis" page should mention:
UEFA Champions League format, broadcast rights in Spain/Argentina/Mexico,
why free streaming matters, how Velcuri works, legal disclaimer.

---

[SPACE — ADD SPECIFIC CONTENT NOTES OR LEAGUE INFO HERE]

---

## B3 — Match Preview Pages (Auto-generated 24h Before Kickoff)

### Task
For every match in the JSON that has `date_diary` = tomorrow's date,
auto-generate a preview page at build time.

### URL structure
```
/previa/ver-[home]-vs-[away]-en-vivo/
```
Example: `/previa/ver-real-madrid-vs-barcelona-en-vivo/`

### Behavior
- Preview page generates 24h before match
- At match kickoff time (via JS on the client), show a banner:
  ```
  "El partido ha comenzado. Ver transmisión en vivo →"
  → links to /ver-[home]-vs-[away]-en-vivo/
  ```
- After match ends (+2.5h from kickoff), JS redirects the page to the main match page

### Content requirements
```html
<h1>Previa: [HomeTeam] vs [AwayTeam] — [League] [DD/MM/YYYY]</h1>

<!-- Static content block: -->
<h2>¿A qué hora juega [HomeTeam] vs [AwayTeam]?</h2>
<!-- Table: kickoff times by country timezone -->
<!-- AR: [time] | MX: [time] | ES: [time] | CO: [time] | PE: [time] -->

<h2>¿En qué canal ver [HomeTeam] vs [AwayTeam]?</h2>
<!-- List channels from embeds.data with links to /canal/[slug]/ -->

<h2>Forma Reciente</h2>
<!-- Static placeholder: "Ambos equipos llegan en buena forma a este encuentro." -->
<!-- (No live data needed — this is intentionally generic) -->

<h2>Ver el Partido en Vivo</h2>
<!-- CTA button → links to /ver-[slug]-en-vivo/ -->

<!-- League description block (reuse from leagueBlocks.js) -->

<!-- 4 FAQs -->
<!-- Schema: SportsEvent + FAQPage + BreadcrumbList -->
```

### Wire into build-main.js
```javascript
// In build-main.js, add:
const { generatePreviews } = require('./generate-previews');
await generatePreviews(normalizedData);
// generates for matches where date_diary === tomorrow's ISO date
```

---

[SPACE — ADD TIMEZONE OFFSET DATA OR COUNTRY MAPPING HERE]

---

---

# SECTION C — TECHNICAL SEO GAPS

---

## C1 — News Sitemap

### Task
Create `dist/sitemap-news.xml` for blog posts and match previews 
published within the last 48 hours.
This gets content crawled by Bing within minutes of publication.

### Add to `build/generate-sitemap.js`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  
  <!-- Include: blog posts published < 48h ago -->
  <!-- Include: match preview pages for matches in next 48h -->
  <!-- Include: match pages for matches that started < 24h ago -->
  
  <url>
    <loc>https://www.velcuri.io/blog/[slug]/</loc>
    <news:news>
      <news:publication>
        <news:name>Velcuri</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>[ISO 8601 datetime of build]</news:publication_date>
      <news:title>[Blog Post Title]</news:title>
    </news:news>
  </url>

  <!-- Same structure for preview pages and fresh match pages -->

</urlset>
```

### Add to sitemap index in `dist/sitemap.xml`
```xml
<sitemap>
  <loc>https://www.velcuri.io/sitemap-news.xml</loc>
  <lastmod>[ISO build date]</lastmod>
</sitemap>
```

### Rules
- Only include items published/updated in last 48 hours
- News sitemap max: 1000 items — never exceed
- `<news:publication_date>` must be within 48 hours or Bing ignores it
- Regenerate on every build (the cron every 2h makes this fresh)

---

## C2 — `rel="next"` / `rel="prev"` Pagination

### Task
Add canonical pagination signals to any paginated archive pages.
Bing still respects these (unlike Google which deprecated them).

### Pages that need pagination
1. Blog index `/blog/` — if more than 10 posts exist, paginate at 10/page
2. League hub pages `/liga/[slug]/` — if more than 20 matches, paginate
3. Match archive (future feature — build the support now)

### URL structure for paginated pages
```
/blog/                    ← page 1 (no ?page= or /page/1/)
/blog/pagina/2/           ← page 2
/blog/pagina/3/           ← page 3
```

### Head tags required on each paginated page
```html
<!-- On page 1 (/blog/) -->
<link rel="next" href="https://www.velcuri.io/blog/pagina/2/">

<!-- On page 2 (/blog/pagina/2/) -->
<link rel="prev" href="https://www.velcuri.io/blog/">
<link rel="next" href="https://www.velcuri.io/blog/pagina/3/">

<!-- On last page -->
<link rel="prev" href="https://www.velcuri.io/blog/pagina/[N-1]/">
<!-- no rel="next" -->
```

### Rules
- Page 1 canonical: `https://www.velcuri.io/blog/` (no `/pagina/1/`)
- Each page has its own unique title: "Blog — Página 2 | Velcuri"
- Each page has unique meta description mentioning page number

---

## C3 — Noscript Fallbacks for Bot-Visible Content

### Task
Bing bot does not execute JavaScript on first crawl pass.
Any content rendered by JS (countdown, live score badge, channel list) 
is invisible to Bingbot during indexing.
Add `<noscript>` fallbacks for all bot-critical content.

### Locations requiring noscript fallbacks

**1. Match page — player section**
```html
<div id="player-container">
  <div id="player-poster" data-channels='[JSON]'>
    <button id="play-btn">▶ Ver EN VIVO GRATIS</button>
  </div>
</div>

<!-- ADD THIS: -->
<noscript>
  <div class="noscript-channels">
    <p>Canales disponibles para este partido:</p>
    <ul>
      <!-- Render channel names as plain text links — populated at build time -->
      <li><a href="[decoded_iframe_url]" rel="nofollow" target="_blank">[channel_name]</a></li>
    </ul>
  </div>
</noscript>
```

**2. Match page — countdown timer**
```html
<div id="countdown" data-kickoff="[ISO datetime]"></div>

<!-- ADD THIS: -->
<noscript>
  <p class="kickoff-static">
    El partido comienza el <strong>[DD de MONTH de YYYY] a las [HH:MM]</strong> 
    (hora de Madrid).
  </p>
</noscript>
```

**3. Match page — live badge**
```html
<span class="live-badge" id="live-badge" hidden>● EN VIVO</span>

<!-- ADD THIS: (shown by bot if match time is current at build time) -->
<noscript>
  <!-- Only render if build time is within match window -->
  [IF match is live at build time: <span class="live-badge">● EN VIVO</span>]
</noscript>
```

**4. Homepage — live match count**
```html
<span id="live-count"></span> partidos en vivo ahora

<!-- ADD THIS: -->
<noscript>
  <span>[N]</span> partidos en vivo ahora
  <!-- N populated at build time from JSON data -->
</noscript>
```

### Implementation location
All noscript additions go in `build/generate.js` template strings.
The values (`[N]`, `[channel list]`, `[kickoff static]`) must be 
populated at build time from normalized JSON data, not from JS.

---

## C4 — Bing Webmaster Tools Verification File

### Task
Create the Bing site verification XML file and place it at the root.

### New file: `src/static/BingSiteAuth.xml`
```xml
<?xml version="1.0"?>
<users>
  <user>BING_VERIFICATION_CODE</user>
</users>
```

### Rules
- Replace `BING_VERIFICATION_CODE` with the actual code from 
  Bing Webmaster Tools → Settings → Users → Add Site
- This file must be accessible at `https://www.velcuri.io/BingSiteAuth.xml`
- Store actual code as `BING_VERIFICATION_CODE` in GitHub Secrets
- In build: `fs.writeFileSync('dist/BingSiteAuth.xml', content)` 
  where content reads from `process.env.BING_VERIFICATION_CODE`

---

[PASTE YOUR BING VERIFICATION CODE HERE BEFORE GIVING TO AGENT]

---

## C5 — Schema Validation in Build Pipeline

### Task
Add automatic schema validation as a build step.
If any page has invalid JSON-LD, the build must FAIL with a clear error.
Never deploy broken schema.

### Add to `build/build-main.js` — after all generation steps, before deploy

```javascript
// build/validate-schema.js — create this new file

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');  // already in package.json

async function validateSchema() {
  const pages = await glob('dist/**/*.html');
  
  // Sample: validate ALL pages (not just 3)
  let errorCount = 0;
  const errors = [];

  for (const pagePath of pages) {
    const html = fs.readFileSync(pagePath, 'utf8');
    const schemaBlocks = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    ) || [];

    for (const block of schemaBlocks) {
      const json = block
        .replace('<script type="application/ld+json">', '')
        .replace('</script>', '')
        .trim();
      
      try {
        const parsed = JSON.parse(json);
        
        // Required field checks
        if (Array.isArray(parsed)) {
          parsed.forEach(item => checkRequiredFields(item, pagePath, errors));
        } else {
          checkRequiredFields(parsed, pagePath, errors);
        }
      } catch (e) {
        errors.push(`INVALID JSON in ${pagePath}: ${e.message}`);
        errorCount++;
      }
    }
  }

  function checkRequiredFields(schema, pagePath, errors) {
    if (schema['@type'] === 'SportsEvent') {
      if (!schema.startDate) errors.push(`Missing startDate in SportsEvent: ${pagePath}`);
      if (!schema.name) errors.push(`Missing name in SportsEvent: ${pagePath}`);
    }
    if (schema['@type'] === 'FAQPage') {
      if (!schema.mainEntity?.length) errors.push(`Empty FAQPage: ${pagePath}`);
    }
    if (schema['@type'] === 'BreadcrumbList') {
      if (!schema.itemListElement?.length) errors.push(`Empty BreadcrumbList: ${pagePath}`);
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ SCHEMA VALIDATION FAILED:');
    errors.forEach(e => console.error(' →', e));
    process.exit(1);  // fails the build + GitHub Action
  }

  console.log(`✅ Schema valid on ${pages.length} pages`);
}

module.exports = { validateSchema };
```

### Wire into build-main.js
```javascript
const { validateSchema } = require('./validate-schema');

// Add as LAST step before deploy:
await validateSchema();
```

---

## C6 — `rel="next"` / `rel="prev"` for Match Pages by Date

### Task
Match pages for the same teams should link to each other chronologically.
This tells Bing these are part of a series, not isolated pages.

### Logic in `build/generate.js`

```javascript
// When generating a match page for HomeTeam vs AwayTeam:
// Find all other matches with same home+away teams, sorted by date
// If a previous match exists → add rel="prev" pointing to it
// If a next match exists → add rel="next" pointing to it

function getMatchSiblings(currentMatch, allMatches) {
  const siblings = allMatches
    .filter(m => 
      m.homeTeam === currentMatch.homeTeam && 
      m.awayTeam === currentMatch.awayTeam
    )
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  
  const idx = siblings.findIndex(m => m.slug === currentMatch.slug);
  
  return {
    prev: siblings[idx - 1] || null,
    next: siblings[idx + 1] || null,
  };
}

// In head template:
// if (prev) → <link rel="prev" href="https://www.velcuri.io/ver-[prev.slug]-en-vivo/">
// if (next) → <link rel="next" href="https://www.velcuri.io/ver-[next.slug]-en-vivo/">
```

---

## C7 — Add Sitemap Lastmod Timestamps (Currently Missing)

### Task
Every URL in every sitemap must have an accurate `<lastmod>` value.
Bing uses this to prioritize recrawling. Missing lastmod = lower crawl priority.

### Rules per sitemap type

```javascript
// In generate-sitemap.js:

function getLastmod(page) {
  switch(page.type) {
    case 'match':
      // Match pages: use match date as lastmod if match is past, 
      // use build time if match is today/future
      const matchDate = new Date(page.datetime);
      const now = new Date();
      return matchDate < now 
        ? matchDate.toISOString().split('T')[0]
        : now.toISOString();
    
    case 'hub':
      // Hub pages always updated at build time (match list changes)
      return new Date().toISOString();
    
    case 'league':
      return new Date().toISOString();
    
    case 'blog':
      // Blog posts: use their original publish date (don't change on rebuild)
      return page.publishDate;
    
    case 'h2h':
      // H2H pages: update if there's a new upcoming match for this rivalry
      return page.hasUpcomingMatch 
        ? new Date().toISOString()
        : page.lastMatchDate;
    
    case 'static':
      // Static pages (about, privacy, etc.): hardcode a date, change manually
      return '2026-01-01';
  }
}
```

---

## WIRING — build-main.js FINAL SEQUENCE

After all patches, `build-main.js` must run in this exact order:

```javascript
async function buildAll() {
  console.log('🏗️  Velcuri build starting...');
  
  const data = await fetchAndNormalize();          // fetch.js
  
  await generateHomepage(data);                    // generate.js
  await generateMatchPages(data);                  // generate.js
  await generateHubPages(data);                    // generate-pages.js
  await generateLeaguePages(data);                 // generate-pages.js
  await generateChannelPages(data);                // generate-pages.js
  await generateTeamPages(data);                   // generate-pages.js
  await generateCountryPages(data);                // generate-pages.js
  await generateStaticPages();                     // generate-pages.js
  await generateBlog();                            // generate-blog.js
  await generateH2H(data);                         // generate-h2h.js     [NEW]
  await generateGuides(data);                      // generate-guides.js  [NEW]
  await generatePreviews(data);                    // generate-previews.js [NEW]
  await generateOGImages(data);                    // generate-og.js
  await generateIcons();                           // generate-icons.js
  await generateSitemaps(data);                    // generate-sitemap.js [EXTENDED]
  await generateFeed(data);                        // generate-feed.js    [NEW]
  await generateSearchIndex(data);                 // generate-sitemap.js
  await validateSchema();                          // validate-schema.js  [NEW]
  
  console.log('✅ Build complete');
}
```

---

## ENVIRONMENT VARIABLES REQUIRED

Add these to GitHub repository secrets + `build-deploy.yml` env block:

```
CLARITY_PROJECT_ID        → From clarity.microsoft.com after creating project
BING_VERIFICATION_CODE    → From Bing Webmaster Tools → Settings
INDEXNOW_KEY              → Already set in previous build
CLOUDFLARE_API_TOKEN      → Already set
CLOUDFLARE_ACCOUNT_ID     → Already set
```

---

## ACCEPTANCE CRITERIA

Build is complete when:

- [ ] `dist/feed.xml` exists and is valid RSS 2.0
- [ ] `dist/sitemap-news.xml` exists with items < 48h old
- [ ] `dist/BingSiteAuth.xml` exists with verification code
- [ ] Every match page `<title>` starts with 🔴 or ▶ emoji
- [ ] Every match page has `<noscript>` fallback with channel list
- [ ] `/buscar/` page exists (from previous gap audit)
- [ ] At least 8 pages exist under `/rival/`
- [ ] At least 8 pages exist under `/como-ver-*/`
- [ ] Preview pages generated for any matches with tomorrow's date
- [ ] Schema validation step runs and passes at end of build
- [ ] `<link rel="alternate" type="application/rss+xml">` present in every page head
- [ ] All sitemap URLs have `<lastmod>` values
- [ ] Build completes without errors
- [ ] Total build time remains under 90 seconds
```
