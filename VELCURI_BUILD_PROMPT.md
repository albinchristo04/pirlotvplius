# VELCURI.IO — Full-Stack Sports Streaming SEO Site
## AI Agent Build Prompt — Complete Specification

---

## 0. MISSION BRIEF

Build **velcuri.io** — a Spanish-language sports streaming directory website that:

1. Fetches live match data from a JSON API endpoint
2. Auto-generates thousands of SEO pages (matches, channels, leagues, teams, countries)
3. Targets Spanish-speaking users from Argentina, Mexico, Peru, Spain, Colombia
4. Dominates Bing search for "tarjeta roja", "rojadirecta", "pirlotv" and all related keywords
5. Deploys on **Cloudflare Pages** via **GitHub** with full CI/CD automation

**Domain:** `https://www.velcuri.io`  
**JSON Source:** `https://raw.githubusercontent.com/albinchristo04/ptv/refs/heads/main/futbollibre.json`  
**Language:** Spanish (es-419 Latin American default, with locale variants)  
**Stack:** Static HTML + Vanilla JS (zero framework dependencies — fastest possible for Cloudflare Pages edge)  
**Deployment:** GitHub → Cloudflare Pages  
**Automation:** GitHub Actions (scheduled + on-push)

---

## 1. REPOSITORY STRUCTURE

```
velcuri.io/
├── .github/
│   └── workflows/
│       ├── build.yml              # Main build + deploy
│       ├── sitemap.yml            # Daily sitemap regeneration
│       └── indexnow.yml           # Bing IndexNow submission
├── src/
│   ├── data/
│   │   └── fetch.js               # Fetches + normalizes JSON
│   ├── templates/
│   │   ├── match.html             # Match page template
│   │   ├── channel.html           # Channel hub template
│   │   ├── league.html            # League hub template
│   │   ├── team.html              # Team page template
│   │   ├── country.html           # Country landing template
│   │   ├── hub.html               # Keyword authority hub template
│   │   ├── blog-post.html         # Blog/news template
│   │   └── home.html              # Homepage template
│   ├── partials/
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── breadcrumb.html
│   │   ├── match-card.html
│   │   ├── faq.html
│   │   └── schema.js              # Schema JSON-LD generator
│   ├── styles/
│   │   ├── main.css               # Critical CSS inlined
│   │   └── components.css
│   ├── scripts/
│   │   ├── player.js              # iframe embed switcher
│   │   ├── countdown.js           # Match countdown timer
│   │   └── sw.js                  # Service worker (PWA)
│   └── static/
│       ├── manifest.json          # PWA manifest
│       ├── robots.txt
│       ├── _headers               # Cloudflare Pages headers
│       ├── _redirects             # Cloudflare Pages redirects
│       └── icons/
├── build/
│   └── generate.js                # Main static site generator
├── dist/                          # Generated output (gitignored)
└── package.json
```

---

## 2. DATA LAYER

### 2.1 JSON Fetching + Normalization

```javascript
// src/data/fetch.js
// Fetches from:
// https://raw.githubusercontent.com/albinchristo04/ptv/refs/heads/main/futbollibre.json

// JSON structure per event:
// event.id
// event.attributes.diary_description  → "Super Lig: Kasımpaşa vs Fatih Karagümrük"
// event.attributes.diary_hour         → "12:00:00"
// event.attributes.date_diary         → "2026-02-16"
// event.attributes.embeds.data[]      → array of stream channels
//   embed.attributes.embed_name       → "ESPN 3 MX"
//   embed.attributes.decoded_iframe_url → "https://tvtvhd.com/canales.php?stream=espn3mx"
// event.attributes.country.data.attributes.name → "Turquía"
```

**Normalization rules:**
- Parse `diary_description` to extract: `league`, `homeTeam`, `awayTeam`
  - Pattern: `"LEAGUE: HomeTeam vs AwayTeam"`
  - Fallback: full string as title if pattern doesn't match
- Combine `date_diary` + `diary_hour` → ISO 8601 datetime
- Generate URL slugs: `slugify(homeTeam + '-vs-' + awayTeam + '-' + date)`
- Map `country.name` → ISO country code for hreflang
- Deduplicate channel names across events to build channel registry

### 2.2 Derived Data Structures

Build these registries from the JSON at build time:

```javascript
// leagues: { "champions-league": { name, slug, matchCount, events[] } }
// teams:   { "real-madrid": { name, slug, matches[] } }
// channels:{ "espn-3-mx": { name, slug, embedUrl, events[] } }
// countries:{ "ar": { name, code, localeTitle, matches[] } }
// dates:   { "2026-02-16": { events[] } }
```

---

## 3. URL ARCHITECTURE

All URLs must be:
- Lowercase
- Hyphenated (no underscores)
- No trailing slashes inconsistency (pick one, enforce with `_redirects`)
- Max 3 levels deep where possible

### 3.1 URL Map

```
/                                          → Homepage (partidos de hoy)
/partidos-de-hoy/                          → Today's matches hub
/partidos-en-vivo/                         → Live matches hub
/futbol-en-vivo/                           → Keyword hub (futbol en vivo)
/rojadirecta/                              → Keyword hub (rojadirecta brand)
/tarjeta-roja/                             → Keyword hub (tarjeta roja brand)
/pirlotv/                                  → Keyword hub (pirlotv brand)
/partidos-gratis/                          → Keyword hub (free streams)

/partido/[date]/[slug]/                    → Individual match page
  e.g. /partido/2026-02-16/real-madrid-vs-barcelona/

/liga/[league-slug]/                       → League hub
  e.g. /liga/champions-league/
       /liga/liga-espanola/
       /liga/serie-a/
       /liga/premier-league/
       /liga/bundesliga/
       /liga/ligue-1/
       /liga/mls/
       /liga/copa-libertadores/
       /liga/superliga-argentina/

/equipo/[team-slug]/                       → Team page
  e.g. /equipo/real-madrid/

/canal/[channel-slug]/                     → Channel hub
  e.g. /canal/espn-en-vivo/
       /canal/movistar-deportes/
       /canal/fox-sports-en-vivo/
       /canal/dazn-en-vivo/
       /canal/disney-plus-en-vivo/
       /canal/tnt-sports-en-vivo/

/es/                                       → Spain locale
/mx/                                       → Mexico locale
/ar/                                       → Argentina locale
/co/                                       → Colombia locale
/pe/                                       → Peru locale

/es/partidos-de-hoy/
/mx/futbol-en-vivo/
/ar/rojadirecta/
  ... (mirror all hub pages per country)

/blog/                                     → Blog index
/blog/[slug]/                              → Blog post

/404                                       → Custom 404 with match links
/sitemap.xml                               → Master sitemap index
/sitemap-matches.xml
/sitemap-channels.xml
/sitemap-leagues.xml
/sitemap-hubs.xml
/sitemap-countries.xml
/sitemap-blog.xml
```

---

## 4. PAGE SPECIFICATIONS

### 4.1 Homepage (`/`)

**Title:** `Fútbol en Vivo Gratis | Partidos de Hoy — Velcuri`  
**Meta description:** `Ver fútbol en vivo gratis hoy. Todos los partidos en directo: Champions League, Liga Española, Serie A y más. Alternativa a Rojadirecta, Tarjeta Roja, Pirlotv.`

**Sections:**
1. Hero — "Fútbol EN VIVO Gratis" + today's match count badge
2. **Partidos en vivo AHORA** — live matches grid (auto-updates via JS fetch)
3. **Próximos Partidos Hoy** — upcoming today sorted by time
4. **Ligas Destacadas** — league hub cards with match count
5. **Canales Populares** — channel cards (ESPN, Movistar, Fox Sports, DAZN, Disney+)
6. **Por País** — country selector cards
7. Static keyword-rich paragraph content (min 300 words, Spanish)
8. FAQ section (6 questions, FAQPage schema)

**Schema on homepage:**
```json
WebSite, ItemList (today's events), FAQPage, BreadcrumbList
```

---

### 4.2 Match Page (`/partido/[date]/[slug]/`)

**Title template:**  
`[HomeTeam] vs [AwayTeam] EN VIVO GRATIS | [League] | [DD/MM/YYYY] — Velcuri`

Example:  
`Real Madrid vs Barcelona EN VIVO GRATIS | Liga Española | 16/02/2026 — Velcuri`

**Meta description template:**  
`Ver [HomeTeam] vs [AwayTeam] en vivo gratis hoy [DD/MM/YYYY]. [League] en directo sin suscripción. Múltiples canales disponibles: [channel1], [channel2].`

**Open Graph:**
```html
<meta property="og:title" content="[HomeTeam] vs [AwayTeam] EN VIVO — [League]">
<meta property="og:description" content="Ver en vivo gratis ahora mismo">
<meta property="og:type" content="video.other">
<meta property="og:image" content="/og/partido-[slug].png">
<meta property="og:url" content="https://www.velcuri.io/partido/[date]/[slug]/">
```

**Page Sections:**
1. Breadcrumb: Inicio > [League] > [Match Title]
2. Match header: team names, league badge, kickoff time (local timezone via JS)
3. **Countdown timer** (if match hasn't started)
4. **Stream player section:**
   - Tab switcher for multiple channels (ESPN, Movistar, etc.)
   - Each tab loads the `decoded_iframe_url` in an `<iframe>`
   - Default loads first available channel
   - "Cambiar canal" CTA if stream fails
5. Match info sidebar: league, date, country, competition round if available
6. **Otros partidos hoy** — 4 related match cards
7. **Más partidos de [League]** — 4 same-league cards
8. Static description paragraph (min 150 words, Spanish, unique per match)
9. FAQ (4 questions: how to watch, what channel, is it free, best quality)

**Schema:**
```json
SportsEvent {
  name: "[HomeTeam] vs [AwayTeam]",
  startDate: "[ISO datetime]",
  location: { "@type": "Place", name: "En Línea" },
  sport: "Football",
  homeTeam: { "@type": "SportsTeam", name: "[HomeTeam]" },
  awayTeam: { "@type": "SportsTeam", name: "[AwayTeam]" },
  organizer: { "@type": "Organization", name: "[League]" },
  url: "https://www.velcuri.io/partido/[date]/[slug]/"
}
BroadcastEvent {
  name: "Transmisión en vivo: [HomeTeam] vs [AwayTeam]",
  broadcastOfEvent: { SportsEvent above },
  broadcastChannel: [{ "@type": "BroadcastChannel", name: "[channel]" }],
  isLiveBroadcast: true,
  publishedOn: { "@type": "BroadcastService", name: "Velcuri" }
}
FAQPage
BreadcrumbList
```

---

### 4.3 League Hub Page (`/liga/[league-slug]/`)

**Title template:**  
`[League Name] EN VIVO GRATIS | Todos los Partidos — Velcuri`

Example: `Champions League EN VIVO GRATIS | Todos los Partidos — Velcuri`

**Sections:**
1. League hero with name + description (200+ words)
2. **Partidos de hoy** in this league
3. **Próximos partidos** — next 7 days
4. **Partidos recientes** — last 7 days
5. Participating teams grid (links to team pages)
6. Broadcast channels for this league
7. FAQ (5 questions about the league + streaming)

**Schema:** `SportsOrganization`, `ItemList`, `FAQPage`, `BreadcrumbList`

**Pre-built league hub pages (create even without current JSON matches):**
```
/liga/champions-league/
/liga/liga-espanola/          ← target "liga española en vivo"
/liga/premier-league/
/liga/serie-a/
/liga/bundesliga/
/liga/ligue-1/
/liga/laliga/
/liga/copa-libertadores/
/liga/copa-america/
/liga/superliga-argentina/
/liga/liga-mx/
/liga/euro/
/liga/copa-del-rey/
/liga/mls/
/liga/super-lig/
/liga/afc-champions-league/
```

---

### 4.4 Channel Hub Page (`/canal/[channel-slug]/`)

**Title template:**  
`Ver [Channel Name] EN VIVO GRATIS | Sin Suscripción — Velcuri`

Example: `Ver ESPN EN VIVO GRATIS | Sin Suscripción — Velcuri`

**Sections:**
1. Channel description (200+ words about the channel, what sports it covers)
2. **Partidos transmitidos hoy** on this channel
3. **Próximas transmisiones** this week on this channel
4. Related channels grid (internal links)
5. FAQ: how to watch channel free, what sports, which countries available

**Schema:** `BroadcastService`, `ItemList`, `FAQPage`, `BreadcrumbList`

**Pre-built channel pages (create statically, populate with JSON data):**
```
/canal/espn-en-vivo/
/canal/espn-2-en-vivo/
/canal/espn-3-en-vivo/
/canal/fox-sports-en-vivo/
/canal/fox-sports-2-en-vivo/
/canal/movistar-deportes/
/canal/dazn-en-vivo/
/canal/disney-plus-en-vivo/
/canal/tnt-sports-en-vivo/
/canal/bein-sports-en-vivo/
/canal/directv-sports/
/canal/claro-sports/
/canal/telefoot/
/canal/sky-sports/
/canal/canal-plus-en-vivo/
/canal/tv-azteca-deportes/
/canal/televisa-deportes/
```

---

### 4.5 Keyword Authority Hub Pages

These are static brand/intent pages targeting competitor brand queries. **High priority.**

#### `/tarjeta-roja/`
**Title:** `Tarjeta Roja — Ver Fútbol EN VIVO GRATIS | Alternativa Oficial — Velcuri`  
**Meta:** `La mejor alternativa a Tarjeta Roja TV. Ver fútbol en vivo gratis sin registrarse. Partidos de hoy, Champions League, Liga Española y más en directo.`  
**Content requirements:**
- 500+ words explaining what the service offers
- Mention: tarjeta roja, tarjeta roja tv, tarjeta roja en vivo, tarjeta roja directa (naturally integrated)
- Today's match grid embedded
- FAQ (8 questions): Is it like Tarjeta Roja? Is it free? What matches? Is it safe? etc.
- Internal links to: `/rojadirecta/`, `/pirlotv/`, `/partidos-de-hoy/`

#### `/rojadirecta/`
**Title:** `Rojadirecta EN VIVO — Ver Partidos Gratis Hoy | Velcuri`  
**Meta:** `Alternativa a Rojadirecta. Ver partidos de fútbol gratis en vivo hoy. Sin registro. Champions, LaLiga, Premier League en directo.`  
**Content requirements:**
- 500+ words
- Mention: rojadirecta, roja directa, rojadirecta tv, rojadirecta en vivo, roja directa en vivo, rojadirecta pirlo tv
- Today's match grid
- FAQ (8 questions)
- Internal links to: `/tarjeta-roja/`, `/pirlotv/`, `/partidos-en-vivo/`

#### `/pirlotv/`
**Title:** `Pirlo TV EN VIVO — Fútbol Gratis Online | Velcuri`  
**Meta:** `Alternativa a Pirlotv y Pirlo TV en vivo. Ver fútbol gratis sin suscripción. Todos los partidos de hoy en directo HD.`  
**Content requirements:**
- 500+ words
- Mention: pirlotv, pirlo tv, pirlo tv en vivo, pirlo.tv en vivo, pirlotvhd, pirlo tv online, pirlo tv hd
- Today's match grid
- FAQ (8 questions)
- Internal links to `/rojadirecta/`, `/tarjeta-roja/`

#### `/partidos-de-hoy/`
**Title:** `Partidos de Hoy EN VIVO GRATIS | [Day DD/MM] — Velcuri`  
**Note:** Title must include today's date — update at build time  
**Content:** Full today's match schedule, sortable by league/time, live status badge

#### `/partidos-en-vivo/`
**Title:** `Partidos EN VIVO Ahora Mismo GRATIS | Fútbol Online — Velcuri`  
**Content:** Live matches only, auto-refresh every 60s via JS fetch

#### `/futbol-en-vivo/`
**Title:** `Fútbol EN VIVO GRATIS | Todos los Partidos Ahora — Velcuri`

#### `/futbol-gratis/`
**Title:** `Ver Fútbol GRATIS Online | Sin Registro Sin Suscripción — Velcuri`

#### `/ver-futbol-online/`
**Title:** `Ver Fútbol Online EN VIVO | HD Gratis Sin Cortes — Velcuri`

#### `/futbol-para-todos/`
**Title:** `Fútbol Para Todos EN VIVO GRATIS | Partidos Hoy — Velcuri`

---

### 4.6 Country Locale Pages

Create the following directory structure. Each country page mirrors the hub pages with localized content.

**Country localization rules:**
- Argentina (`/ar/`): Use "boludo" vocabulary style; mention "AFA", "Superliga Argentina"; timezone ART (UTC-3)
- Mexico (`/mx/`): Mention "Liga MX", "Azteca"; timezone CST/CDT
- Spain (`/es/`): Mention "LaLiga", "Copa del Rey"; timezone CET/CEST; use Spain Spanish
- Colombia (`/co/`): Mention "Liga BetPlay"; timezone COT (UTC-5)
- Peru (`/pe/`): Mention "Liga 1"; timezone PET (UTC-5)

**Pages per country:**
```
/[cc]/                              ← Country homepage
/[cc]/partidos-de-hoy/
/[cc]/futbol-en-vivo/
/[cc]/rojadirecta/
/[cc]/tarjeta-roja/
/[cc]/pirlotv/
/[cc]/liga/champions-league/
/[cc]/liga/liga-espanola/           ← for /es/ and /ar/
/[cc]/liga/liga-mx/                 ← for /mx/
/[cc]/liga/superliga-argentina/     ← for /ar/
```

**Hreflang implementation (CRITICAL — prevents duplicate content penalty):**

Every page that has country variants MUST include in `<head>`:
```html
<link rel="alternate" hreflang="es" href="https://www.velcuri.io/[path]/">
<link rel="alternate" hreflang="es-AR" href="https://www.velcuri.io/ar/[path]/">
<link rel="alternate" hreflang="es-MX" href="https://www.velcuri.io/mx/[path]/">
<link rel="alternate" hreflang="es-ES" href="https://www.velcuri.io/es/[path]/">
<link rel="alternate" hreflang="es-CO" href="https://www.velcuri.io/co/[path]/">
<link rel="alternate" hreflang="es-PE" href="https://www.velcuri.io/pe/[path]/">
<link rel="alternate" hreflang="x-default" href="https://www.velcuri.io/[path]/">
```

**Canonical rules:**
- Country pages: `<link rel="canonical" href="https://www.velcuri.io/[cc]/[path]/">`
- Default pages: `<link rel="canonical" href="https://www.velcuri.io/[path]/">`
- NEVER let www vs non-www or trailing slash vs no trailing slash create duplicate canonicals

---

### 4.7 Team Pages (`/equipo/[team-slug]/`)

**Title:** `[Team Name] EN VIVO | Próximos Partidos y Transmisiones — Velcuri`

**Sections:**
1. Team name + league affiliation
2. Next match for this team (prominent, with watch link)
3. All upcoming matches this team appears in
4. Recent results with replay links (if applicable)
5. Internal links to relevant league hub

**Generate for:** Every team that appears in the JSON data, plus pre-seed with top teams:
```
/equipo/real-madrid/
/equipo/barcelona/
/equipo/atletico-madrid/
/equipo/manchester-city/
/equipo/manchester-united/
/equipo/liverpool/
/equipo/juventus/
/equipo/inter-milan/
/equipo/ac-milan/
/equipo/psg/
/equipo/bayern-munich/
/equipo/borussia-dortmund/
/equipo/river-plate/
/equipo/boca-juniors/
/equipo/america/
/equipo/chivas/
/equipo/flamengo/
/equipo/al-hilal/
```

---

### 4.8 Blog Section (`/blog/`)

**Purpose:** Freshness signal, long-tail keyword coverage, internal link distribution

**Index:** `/blog/` — Latest 20 posts, paginated

**Pre-generate these static blog posts:**

```
/blog/que-es-rojadirecta/
/blog/mejores-paginas-ver-futbol-gratis/
/blog/como-ver-champions-league-gratis/
/blog/como-ver-liga-espanola-gratis/
/blog/tarjeta-roja-vs-rojadirecta/
/blog/pirlotv-alternativas/
/blog/ver-futbol-sin-suscripcion/
/blog/canales-deportivos-gratis/
/blog/futbol-en-vivo-movil/
/blog/como-ver-copa-libertadores-gratis/
```

Each blog post:
- Min 800 words, Spanish
- Article schema
- Internal links to 3+ hub/match pages
- Author: "Equipo Velcuri"
- BreadcrumbList schema

---

## 5. SCHEMA MARKUP SPECIFICATION

### 5.1 Global Schema (every page)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Velcuri",
  "url": "https://www.velcuri.io",
  "description": "Ver fútbol en vivo gratis. Alternativa a Tarjeta Roja, Rojadirecta y Pirlotv.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.velcuri.io/buscar/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### 5.2 Match Page Schema (full stack)

Include ALL of these on every match page:

```json
[
  {
    "@type": "SportsEvent",
    "name": "[HomeTeam] vs [AwayTeam]",
    "startDate": "[ISO 8601 with timezone]",
    "endDate": "[startDate + 2 hours]",
    "sport": "https://en.wikipedia.org/wiki/Association_football",
    "description": "Ver [HomeTeam] vs [AwayTeam] en vivo gratis. [League].",
    "url": "https://www.velcuri.io/partido/[date]/[slug]/",
    "location": {
      "@type": "Place",
      "name": "Transmisión en línea"
    },
    "organizer": {
      "@type": "Organization",
      "name": "[League Name]"
    },
    "competitor": [
      { "@type": "SportsTeam", "name": "[HomeTeam]" },
      { "@type": "SportsTeam", "name": "[AwayTeam]" }
    ],
    "image": "https://www.velcuri.io/og/partido-[slug].png"
  },
  {
    "@type": "BroadcastEvent",
    "name": "En Vivo: [HomeTeam] vs [AwayTeam]",
    "isLiveBroadcast": true,
    "startDate": "[ISO 8601]",
    "broadcastOfEvent": { "same SportsEvent" },
    "broadcastChannel": [
      {
        "@type": "BroadcastChannel",
        "name": "[Channel Name]",
        "broadcastChannelId": "[channel-slug]"
      }
    ]
  },
  {
    "@type": "FAQPage",
    "mainEntity": [ ... ]
  },
  {
    "@type": "BreadcrumbList",
    "itemListElement": [ ... ]
  }
]
```

### 5.3 FAQ Templates

**Match page FAQs (rotate through these, pick 4):**
1. ¿Dónde ver [HomeTeam] vs [AwayTeam] en vivo gratis?
2. ¿A qué hora juega [HomeTeam] vs [AwayTeam]?
3. ¿En qué canal transmiten [HomeTeam] vs [AwayTeam]?
4. ¿Puedo ver el partido gratis sin registrarme?
5. ¿Es legal ver fútbol gratis en Velcuri?
6. ¿Hay retransmisión del partido [HomeTeam] vs [AwayTeam]?

**Hub page FAQs (for /rojadirecta/, /tarjeta-roja/, etc.):**
1. ¿Qué es [keyword] y cómo funciona?
2. ¿Es gratis ver los partidos en Velcuri?
3. ¿Qué partidos puedo ver hoy?
4. ¿Funciona en móvil?
5. ¿Necesito instalar algo?
6. ¿Cuál es la mejor alternativa a [keyword]?
7. ¿Hay publicidad?
8. ¿En qué países funciona?

---

## 6. TECHNICAL SEO FILES

### 6.1 `robots.txt`
```
User-agent: *
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://www.velcuri.io/sitemap.xml

# Block internal/utility paths
Disallow: /admin/
Disallow: /.github/
Disallow: /dist/
```

### 6.2 `sitemap.xml` (Master Index)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://www.velcuri.io/sitemap-hubs.xml</loc></sitemap>
  <sitemap><loc>https://www.velcuri.io/sitemap-matches.xml</loc></sitemap>
  <sitemap><loc>https://www.velcuri.io/sitemap-leagues.xml</loc></sitemap>
  <sitemap><loc>https://www.velcuri.io/sitemap-channels.xml</loc></sitemap>
  <sitemap><loc>https://www.velcuri.io/sitemap-teams.xml</loc></sitemap>
  <sitemap><loc>https://www.velcuri.io/sitemap-countries.xml</loc></sitemap>
  <sitemap><loc>https://www.velcuri.io/sitemap-blog.xml</loc></sitemap>
</sitemapindex>
```

**Sitemap rules:**
- Match pages: `<changefreq>hourly</changefreq>` on match day, `weekly` after
- Hub pages: `<changefreq>daily</changefreq>`
- Blog: `<changefreq>monthly</changefreq>`
- All pages: `<lastmod>` set to ISO date of last build

### 6.3 `_headers` (Cloudflare Pages)
```
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/*.html
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/sitemap*.xml
  Cache-Control: public, max-age=3600
  Content-Type: application/xml; charset=utf-8

/robots.txt
  Cache-Control: public, max-age=86400

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable
```

### 6.4 `_redirects` (Cloudflare Pages)
```
# Enforce www
https://velcuri.io/* https://www.velcuri.io/:splat 301!

# Common misspellings and competitor brand redirects to hub pages
/tarjetaroja/ /tarjeta-roja/ 301
/roja-directa/ /rojadirecta/ 301
/pirlo-tv/ /pirlotv/ 301
/rojadirectatv/ /rojadirecta/ 301
/rojadirécta/ /rojadirecta/ 301

# Legacy URL patterns → new structure
/partido/:slug /partidos-de-hoy/ 302

# 404 fallback
/* /404.html 404
```

---

## 7. PERFORMANCE REQUIREMENTS (Core Web Vitals)

**Bing weights Core Web Vitals differently from Google — prioritizes:**
- LCP (Largest Contentful Paint): **< 1.5s**
- CLS (Cumulative Layout Shift): **< 0.05**
- INP (Interaction to Next Paint): **< 150ms**
- TTFB (Time to First Byte): **< 200ms** (Cloudflare edge)

**Implementation rules:**
1. **NO external fonts** — use system font stack:  
   `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;`
2. **Critical CSS inlined** in `<head>` — max 14KB
3. **All images**: explicit `width` and `height` attributes + `loading="lazy"` except above-fold
4. **No render-blocking JS** — all scripts `defer` or `type="module"`
5. **iframe embeds**: DO NOT load on page load — only load when user clicks "Ver ahora" button  
   Use `<div class="embed-placeholder" data-src="[url]">` → swap on click
   This prevents layout shift AND speeds initial load
6. **Preconnect hints** in `<head>` for known embed domains
7. **No external analytics scripts** — use Cloudflare Web Analytics (1 beacon, no JS overhead)
8. Total page weight: **< 50KB HTML+CSS+JS** (excluding iframes/images)

---

## 8. INTERNAL LINKING ARCHITECTURE

This is critical for PageRank distribution.

### 8.1 Link Flow Rules

```
Homepage
  ├── → /partidos-de-hoy/ (primary CTA)
  ├── → /rojadirecta/ (nav)
  ├── → /tarjeta-roja/ (nav)
  ├── → /pirlotv/ (nav)
  ├── → Every league hub (footer)
  └── → Today's 10 biggest matches (hero)

Every Match Page
  ├── → Its league hub (breadcrumb + sidebar)
  ├── → Its channel pages (embed tab labels)
  ├── → Both team pages (match header)
  ├── → 4 related matches same league
  ├── → /partidos-de-hoy/ (nav)
  └── → Hub page (/rojadirecta/ or /futbol-en-vivo/) (footer)

Every League Hub
  ├── → All current matches in league
  ├── → All channel pages that broadcast it
  └── → Team pages for all teams in league

Every Channel Page
  ├── → All current matches on that channel
  └── → Related channel pages

Keyword Hubs (/rojadirecta/, /tarjeta-roja/, /pirlotv/)
  ├── → Each other (cross-link all 3)
  ├── → /partidos-de-hoy/
  ├── → Top 5 league hubs
  └── → Top 10 today's matches

Country Pages
  ├── → Default (canonical) version of each page
  └── → Country-specific league/team pages
```

### 8.2 Anchor Text Rules
- Never use "click here" or "ver más"
- Use descriptive anchors: "ver Champions League en vivo gratis", "partidos de hoy"
- Match page internal links: use full match name in anchor

---

## 9. GITHUB ACTIONS CI/CD

### 9.1 Main Build Workflow (`.github/workflows/build.yml`)

```yaml
name: Build and Deploy Velcuri

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */2 * * *'    # Rebuild every 2 hours (fresh match data)
    - cron: '0 6 * * *'      # Full rebuild at 6am UTC daily

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          JSON_SOURCE: https://raw.githubusercontent.com/albinchristo04/ptv/refs/heads/main/futbollibre.json
          SITE_URL: https://www.velcuri.io
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: velcuri
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 9.2 Bing IndexNow Submission (`.github/workflows/indexnow.yml`)

```yaml
name: Bing IndexNow Submission

on:
  workflow_run:
    workflows: ["Build and Deploy Velcuri"]
    types: [completed]

jobs:
  indexnow:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - uses: actions/checkout@v4
      - name: Submit new URLs to Bing IndexNow
        run: |
          node scripts/indexnow.js
        env:
          INDEXNOW_KEY: ${{ secrets.INDEXNOW_KEY }}
          SITE_URL: https://www.velcuri.io
```

**`scripts/indexnow.js`** must:
1. Compare current build's URL list vs last submission (stored in `indexnow-last.json`)
2. Submit only NEW or UPDATED URLs to:  
   `https://www.bing.com/indexnow?url=[url]&key=[key]`
3. Batch up to 10,000 URLs per request using POST:
   ```json
   {
     "host": "www.velcuri.io",
     "key": "[INDEXNOW_KEY]",
     "keyLocation": "https://www.velcuri.io/[INDEXNOW_KEY].txt",
     "urlList": ["url1", "url2", ...]
   }
   ```
4. Save updated URL list for next comparison

**IndexNow key file:** Place at `/static/[INDEXNOW_KEY].txt` containing just the key string.

### 9.3 Sitemap Ping (`.github/workflows/sitemap.yml`)

```yaml
name: Ping Search Engines

on:
  workflow_run:
    workflows: ["Build and Deploy Velcuri"]
    types: [completed]

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Bing
        run: |
          curl "https://www.bing.com/ping?sitemap=https://www.velcuri.io/sitemap.xml"
```

---

## 10. META TAG TEMPLATES

Every page must have ALL of these in `<head>`:

```html
<!-- Primary Meta -->
<title>[PAGE TITLE]</title>
<meta name="description" content="[MAX 155 CHARS]">
<meta name="keywords" content="[5-8 KEYWORDS]">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="https://www.velcuri.io/[path]/">

<!-- Hreflang (on all pages with country variants) -->
[hreflang tags as specified in Section 4.6]

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="[TITLE]">
<meta property="og:description" content="[DESCRIPTION]">
<meta property="og:url" content="https://www.velcuri.io/[path]/">
<meta property="og:image" content="https://www.velcuri.io/og/[slug].png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Velcuri">
<meta property="og:locale" content="es_419">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[TITLE]">
<meta name="twitter:description" content="[DESCRIPTION]">
<meta name="twitter:image" content="https://www.velcuri.io/og/[slug].png">

<!-- Mobile / PWA -->
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#1a1a2e">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">

<!-- Preconnect hints for embed sources -->
<link rel="preconnect" href="https://tvtvhd.com">
<link rel="dns-prefetch" href="https://tvtvhd.com">

<!-- Schema JSON-LD -->
<script type="application/ld+json">[JSON SCHEMA]</script>
```

---

## 11. PWA MANIFEST (`/static/manifest.json`)

```json
{
  "name": "Velcuri — Fútbol en Vivo Gratis",
  "short_name": "Velcuri",
  "description": "Ver fútbol en vivo gratis. Todos los partidos del día.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "lang": "es",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    {
      "name": "Partidos de hoy",
      "url": "/partidos-de-hoy/",
      "description": "Ver todos los partidos de hoy"
    },
    {
      "name": "En vivo ahora",
      "url": "/partidos-en-vivo/",
      "description": "Partidos en vivo ahora mismo"
    }
  ]
}
```

---

## 12. DESIGN SYSTEM

### 12.1 Color Palette

```css
:root {
  --color-bg: #0d0d1a;
  --color-surface: #1a1a2e;
  --color-surface-2: #16213e;
  --color-accent: #e63946;        /* Red — matches "Tarjeta Roja" brand color */
  --color-accent-2: #f4a261;
  --color-live: #2dc653;          /* Green for LIVE badge */
  --color-text: #f1f1f1;
  --color-text-muted: #8892a4;
  --color-border: #2a2a4a;
}
```

### 12.2 Typography Scale

```css
h1: 2.25rem / 700 weight
h2: 1.75rem / 600 weight
h3: 1.25rem / 600 weight
body: 1rem / 400 weight / 1.6 line-height
small: 0.875rem
```

### 12.3 Component: Match Card

```html
<article class="match-card" itemscope itemtype="https://schema.org/SportsEvent">
  <div class="match-card__league">[League] · [Country Flag]</div>
  <div class="match-card__teams">
    <span itemprop="homeTeam">[HomeTeam]</span>
    <span class="match-card__vs">VS</span>
    <span itemprop="awayTeam">[AwayTeam]</span>
  </div>
  <div class="match-card__time">
    <span class="live-badge" hidden>● EN VIVO</span>
    <time itemprop="startDate" datetime="[ISO]">[HH:MM]</time>
  </div>
  <div class="match-card__channels">[Channel badges]</div>
  <a href="/partido/[date]/[slug]/" class="match-card__cta" itemprop="url">
    Ver Partido
  </a>
</article>
```

### 12.4 Component: Live Badge
```html
<span class="live-badge" aria-label="Transmisión en vivo">● EN VIVO</span>
```
```css
.live-badge {
  background: var(--color-live);
  color: #000;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 3px;
  animation: pulse 2s infinite;
}
```

---

## 13. NAVIGATION STRUCTURE

### 13.1 Primary Navigation

```
Logo (Velcuri)
├── En Vivo           → /partidos-en-vivo/
├── Hoy               → /partidos-de-hoy/
├── Ligas ▼
│   ├── Champions League
│   ├── LaLiga
│   ├── Premier League
│   ├── Serie A
│   ├── Bundesliga
│   ├── Copa Libertadores
│   └── Ver todas las ligas →
├── Canales ▼
│   ├── ESPN en vivo
│   ├── Fox Sports
│   ├── Movistar Deportes
│   └── Ver todos →
└── País ▼
    ├── 🇦🇷 Argentina
    ├── 🇲🇽 México
    ├── 🇪🇸 España
    ├── 🇨🇴 Colombia
    └── 🇵🇪 Perú
```

### 13.2 Footer Links (SEO critical — links to all hub pages)

```
Fútbol en Vivo
├── Tarjeta Roja
├── Rojadirecta  
├── Pirlotv
├── Fútbol Gratis
└── Ver Fútbol Online

Ligas
├── Champions League
├── Liga Española
├── Premier League
[all leagues]

Canales
├── ESPN en vivo
├── Fox Sports
[all channels]

Países
[all country pages]

Blog
[latest 5 posts]
```

---

## 14. MATCH PLAYER UX

The embed player is the core product. Implement as follows:

```javascript
// Player behavior:
// 1. Page loads → player area shows "poster" with match info + "Ver Partido" button
// 2. User clicks button → iframe loads with decoded_iframe_url
// 3. If multiple channels → show tab switcher above iframe
// 4. "Cambiar canal" button cycles through available streams
// 5. Player persists if user scrolls (sticky on mobile)

// HTML structure:
// <div id="player-container">
//   <div id="player-poster" data-channels='[{"name":"ESPN","url":"..."}]'>
//     <h2>HomeTeam vs AwayTeam</h2>
//     <p>Liga | HH:MM</p>
//     <button id="play-btn">▶ Ver EN VIVO GRATIS</button>
//   </div>
//   <div id="player-tabs" hidden>
//     <!-- Channel tabs injected by JS -->
//   </div>
//   <div id="player-frame" hidden>
//     <iframe id="stream-frame" allowfullscreen></iframe>
//   </div>
// </div>
```

**IMPORTANT:** The `decoded_iframe_url` values from JSON should be loaded as the iframe `src` directly. Some may have base64-encoded parameters — load as-is.

---

## 15. STATIC SITE GENERATOR (`build/generate.js`)

The build script must:

1. **Fetch JSON** from source URL (with 3x retry, 10s timeout)
2. **Parse + normalize** all events into page-generation-ready objects
3. **Build registries** (leagues, teams, channels, countries, dates)
4. **Generate ALL pages** by rendering HTML templates with data
5. **Generate sitemaps** (all 7 sitemap files)
6. **Generate IndexNow URL list** delta file
7. **Write all files** to `/dist/` with correct directory structure
8. **Copy static assets** from `/src/static/` to `/dist/`

**Build output must include:**
- One `.html` file per URL
- All sitemaps
- `robots.txt`
- `_headers`
- `_redirects`
- `manifest.json`
- `[INDEXNOW_KEY].txt`
- All CSS/JS assets (fingerprinted for cache busting)

**Build must complete in < 60 seconds** for GitHub Actions timeout compliance.

---

## 16. CONTENT QUALITY RULES (Bing Ranking Signals)

Bing places higher weight on:

1. **Page freshness** — match pages MUST have `<meta name="date">` and schema `dateModified` set to build time
2. **Click-through signals** — title tags must contain power words: EN VIVO, GRATIS, HOY, DIRECTO
3. **Dwell time** — pages must have enough content below the fold to hold users (match lists, FAQs, blog excerpts)
4. **Backlink-worthy content** — hub pages should contain genuinely useful information (match schedules, channel guides)
5. **Entity associations** — mention named entities (team names, league names, broadcaster names) consistently to build topical authority
6. **E-E-A-T signals:**
   - "Sobre Velcuri" page with clear mission
   - Footer with contact/about links
   - Privacy Policy + Terms of Use pages (required for ad compliance)
   - DMCA/Copyright notice page

---

## 17. ADDITIONAL STATIC PAGES REQUIRED

```
/sobre-velcuri/          → About page (E-E-A-T signal)
/contacto/               → Contact form or email
/politica-de-privacidad/ → Privacy Policy (GDPR/CCPA)
/terminos-de-uso/        → Terms of Use
/aviso-legal/            → Legal notice (DMCA)
/preguntas-frecuentes/   → Master FAQ page
/buscar/                 → Search results page (client-side JSON search)
/404.html                → Custom 404 with match grid
```

---

## 18. OG IMAGE GENERATION

For each match, generate an Open Graph image at build time:

**Spec:**
- Size: 1200×630px
- Background: dark gradient (#0d0d1a → #1a1a2e)
- Center: "HomeTeam VS AwayTeam" in large white text
- Below: League name + date
- Logo: "velcuri.io" watermark bottom right
- Red badge: "EN VIVO" top right

Use `node-canvas` or `sharp` + template SVG to generate programmatically during build.

Output to: `/dist/og/partido-[slug].png`

---

## 19. SEARCH FUNCTIONALITY

Client-side search using pre-built JSON index:

1. Build generates `/dist/search-index.json` with all matches, teams, leagues
2. Search page (`/buscar/`) loads this JSON, filters on keystroke
3. Results display as match cards with links
4. URL: `/buscar/?q=real+madrid` — bookmarkable, crawlable placeholder page

---

## 20. KEYWORD TARGETING SUMMARY

| Page | Primary Keywords | Secondary Keywords |
|------|-----------------|-------------------|
| `/` | fútbol en vivo, partidos hoy | ver fútbol gratis, fútbol online |
| `/tarjeta-roja/` | tarjeta roja, tarjeta roja tv | tarjeta roja en vivo, tarjeta roja futbol |
| `/rojadirecta/` | rojadirecta, roja directa | rojadirecta tv, roja directa en vivo |
| `/pirlotv/` | pirlotv, pirlo tv | pirlo tv en vivo, pirlotvhd |
| `/partidos-de-hoy/` | partidos de hoy, roja directa partidos hoy | partidos en vivo hoy |
| `/partidos-en-vivo/` | partidos en vivo, fútbol en vivo hoy | ver partidos gratis |
| `/liga/champions-league/` | champions league en vivo | champions league gratis |
| `/liga/liga-espanola/` | liga española en vivo | liga española gratis |
| `/canal/espn-en-vivo/` | espn en vivo, ver espn | espn gratis |
| `/ar/rojadirecta/` | rojadirecta argentina | ver fútbol gratis argentina |
| `/mx/pirlotv/` | pirlotv mexico | ver futbol gratis mexico |

---

## 21. DEPLOYMENT ENVIRONMENT VARIABLES

Required secrets in GitHub repository settings:

```
CLOUDFLARE_API_TOKEN      → Cloudflare API token with Pages:Edit permission
CLOUDFLARE_ACCOUNT_ID     → Cloudflare account ID
INDEXNOW_KEY              → 32+ char random string for Bing IndexNow
SITE_URL                  → https://www.velcuri.io
```

Required in `package.json`:
```json
{
  "scripts": {
    "build": "node build/generate.js",
    "dev": "node build/generate.js --watch",
    "fetch": "node src/data/fetch.js"
  }
}
```

---

## 22. LAUNCH CHECKLIST

Before first deploy, verify:

- [ ] `robots.txt` accessible at `/robots.txt`
- [ ] `sitemap.xml` accessible and valid XML
- [ ] IndexNow key file at `https://www.velcuri.io/[KEY].txt`
- [ ] All canonical tags point to correct URLs (no www vs non-www mismatch)
- [ ] All hreflang tags present on pages with country variants
- [ ] Schema validates at https://validator.schema.org for match + hub pages
- [ ] All match pages have unique titles (no duplicate `HomeTeam vs AwayTeam` if same teams play twice)
- [ ] `_redirects` enforces HTTPS + www
- [ ] OG images generated for homepage and all hub pages
- [ ] `manifest.json` valid (test with Lighthouse)
- [ ] No broken internal links
- [ ] Core Web Vitals passing (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- [ ] Bing Webmaster Tools site verified via XML file method
- [ ] Submit sitemap manually to Bing Webmaster Tools on launch day

---

## 23. WHAT NOT TO DO

- ❌ Do NOT use `<iframe>` with `src` set on page load — always lazy-load on user interaction
- ❌ Do NOT use JavaScript frameworks (React, Vue, etc.) — pure HTML/CSS/JS only
- ❌ Do NOT use Google Fonts or any external CSS CDN
- ❌ Do NOT create duplicate pages without proper canonical/hreflang
- ❌ Do NOT use generic meta descriptions — every page must have unique, keyword-rich description
- ❌ Do NOT paginate match archives with `?page=2` — use `/partidos/pagina/2/` style URLs
- ❌ Do NOT use `target="_blank"` on internal links
- ❌ Do NOT leave empty `<h1>` tags or pages without a single `<h1>`
- ❌ Do NOT use inline styles (use CSS classes for performance + caching)

---

*End of specification. Build everything described above. Every section is mandatory.*
