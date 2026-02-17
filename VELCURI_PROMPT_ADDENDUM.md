# VELCURI BUILD PROMPT — ADDENDUM (Patch v2)

Append these sections to the main prompt. They override or extend the relevant
sections in the original specification.

---

## PATCH 1 — League Text Block Library (Thin Content Prevention)

### Replaces: Section 4.2 "Static description paragraph" on match pages

Every match page MUST contain a minimum 300-word content block below the
player. Do NOT write unique prose per match at build time (too slow, too
inconsistent). Instead, maintain a **league text block library** — a
pre-written static block per league, injected based on keyword detection in
`diary_description`.

### Detection Logic

```javascript
// src/data/leagueBlocks.js

function detectLeague(diary_description) {
  const d = diary_description.toLowerCase();

  if (d.includes('champions league'))         return 'champions-league';
  if (d.includes('premier league'))           return 'premier-league';
  if (d.includes('laliga') || d.includes('liga española') || d.includes('la liga')) return 'laliga';
  if (d.includes('serie a'))                  return 'serie-a';
  if (d.includes('bundesliga'))               return 'bundesliga';
  if (d.includes('ligue 1'))                  return 'ligue-1';
  if (d.includes('mls'))                      return 'mls';
  if (d.includes('copa libertadores'))        return 'copa-libertadores';
  if (d.includes('superliga') || d.includes('super liga argentina')) return 'superliga-argentina';
  if (d.includes('liga mx'))                  return 'liga-mx';
  if (d.includes('super lig'))               return 'super-lig';       // Turkish league
  if (d.includes('afc champions'))            return 'afc-champions';
  if (d.includes('eredivisie'))               return 'eredivisie';
  if (d.includes('primeira liga'))            return 'primeira-liga';
  if (d.includes('süper lig') || d.includes('super lig')) return 'super-lig';

  return 'generic-football';  // fallback
}
```

### League Block Content Requirements

Each block must be:
- **Minimum 300 words** in Spanish
- Factually accurate (league history, format, prestige, key clubs)
- Contain the league name naturally 4–6 times
- End with a sentence connecting the current match to the league context
- Contain at least one mention of "en vivo", "gratis", "transmisión"

### Required Pre-written Blocks

Write one block for each of these leagues. Store in
`src/data/league-blocks/[slug].html` as raw HTML paragraphs (no wrapper div):

```
champions-league.html
premier-league.html
laliga.html
serie-a.html
bundesliga.html
ligue-1.html
mls.html
copa-libertadores.html
superliga-argentina.html
liga-mx.html
super-lig.html          ← Turkish Süper Lig
afc-champions.html
eredivisie.html
primeira-liga.html
generic-football.html   ← fallback for unrecognized leagues
```

### Example: `super-lig.html` (minimum quality bar)

```html
<p>La <strong>Süper Lig</strong> es la máxima competición de fútbol profesional
en Turquía, organizada por la Federación de Fútbol de Turquía (TFF) desde 1959.
Con más de seis décadas de historia, la liga turca se ha consolidado como una
de las más competitivas y apasionantes del continente asiático-europeo,
atrayendo tanto a talentosos jugadores locales como a estrellas internacionales
que buscan demostrar su nivel en uno de los campeonatos más exigentes del
mundo.</p>

<p>La liga cuenta con 19 equipos que se enfrentan en un formato de todos contra
todos a doble vuelta, disputando un total de 36 jornadas durante la temporada.
Los tres equipos con menos puntos al final del campeonato descienden a la
<strong>TFF 1. Lig</strong>, la segunda división turca. El campeón obtiene plaza
directa en la fase de grupos de la UEFA Champions League, mientras que los
clasificados en segunda y tercera posición acceden a la UEFA Europa League y la
UEFA Conference League respectivamente.</p>

<p>Entre los clubes más exitosos e históricos de la <strong>Süper Lig</strong>
destacan <strong>Galatasaray</strong>, el equipo con más títulos ligueros y
conocido internacionalmente por haber ganado la UEFA Cup y la Supercopa de
Europa en el año 2000; <strong>Fenerbahçe</strong>, el eterno rival y uno de
los clubes con mayor número de seguidores de toda Turquía; y
<strong>Beşiktaş</strong>, el equipo del barrio europeo de Estambul con una
apasionada afición conocida como "las Águilas Negras". Otros clubes relevantes
incluyen Trabzonspor, histórico campeón de la era amateur, y Başakşehir, el
equipo moderno que sorprendió a Europa en la Champions League 2020-21.</p>

<p>Los derbis de Estambul entre Galatasaray, Fenerbahçe y Beşiktaş son
considerados algunos de los encuentros más intensos y seguidos del fútbol
mundial, con estadios que alcanzan capacidades de 50.000 a 70.000 espectadores
y una atmósfera electrizante que pocos campeonatos en Europa pueden igualar.
La <strong>Süper Lig</strong> ha dado jugadores de nivel mundial como Hakan
Çalhanoğlu, Arda Turan, Rüştü Reçber y más recientemente Kerem Aktürkoğlu, que
demuestran la calidad formativa del fútbol turco.</p>

<p>En Velcuri puedes seguir todos los partidos de la <strong>Süper Lig en vivo
y gratis</strong>, sin necesidad de suscripción ni registro. El encuentro de
hoy forma parte de una temporada cargada de emoción, donde cada partido puede
cambiar la clasificación y acercar a un equipo al título o alejarle de los
puestos europeos. No te pierdas ningún minuto de la <strong>transmisión en
directo</strong>.</p>
```

### Injection in Template

```html
<!-- In match.html template, below the player section -->
<section class="match-context" aria-label="Sobre esta competición">
  <h2>Sobre la {{ leagueName }}</h2>
  {{ leagueBlock }}  <!-- injected pre-written HTML block -->
</section>
```

---

## PATCH 2 — SEO-Optimized Slug Structure

### Overrides: Section 3 (URL Architecture) — Match page URLs

**OLD pattern (from original spec):**
```
/partido/2026-02-16/real-madrid-vs-barcelona/
```

**NEW pattern (keyword-optimized):**
```
/ver-real-madrid-vs-barcelona-en-vivo/
/ver-kasimpasa-vs-fatih-karagumruk-en-vivo/
/ver-al-hilal-vs-al-wahda-en-vivo/
```

### Slug Generation Rules

```javascript
// src/data/fetch.js — slug generation

function generateMatchSlug(homeTeam, awayTeam) {
  const home = slugify(homeTeam);  // lowercase, hyphenated, ASCII
  const away = slugify(awayTeam);
  return `ver-${home}-vs-${away}-en-vivo`;
}

// slugify rules:
// 1. Lowercase
// 2. Replace spaces with hyphens
// 3. Remove accents: á→a, é→e, í→i, ó→o, ú→u, ñ→n, ü→u
// 4. Remove non-alphanumeric except hyphens
// 5. Collapse multiple hyphens → single hyphen
// 6. Trim leading/trailing hyphens

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
```

### Collision Handling

If two matches have identical home+away teams on different dates
(e.g., a two-legged tie), append the date:

```
/ver-real-madrid-vs-barcelona-en-vivo/           ← first match
/ver-real-madrid-vs-barcelona-en-vivo-19-02/     ← second match (DD-MM appended)
```

Store a slug registry during build to detect and resolve collisions.

### `_redirects` addition (handle old-style IDs if any were indexed)

```
/evento/:id  /  302
/event/:id   /  302
```

---

## PATCH 3 — Popularity-Weighted Match Selection on Hub Pages

### Extends: Section 8.1 (Internal Link Juice) — Hub Page Match Selection

The original spec says hubs link to "Top 10 today's matches." This patch
defines the **exact ranking algorithm** for selecting which matches appear on
hub pages, to ensure link equity flows to pages with the most SEO and user value.

### League Priority Weights

```javascript
// src/data/leaguePriority.js

const LEAGUE_WEIGHTS = {
  'champions-league':       100,
  'europa-league':           85,
  'conference-league':       70,
  'laliga':                  95,
  'premier-league':          95,
  'serie-a':                 88,
  'bundesliga':              85,
  'ligue-1':                 80,
  'copa-libertadores':       82,
  'copa-del-rey':            72,
  'fa-cup':                  68,
  'liga-mx':                 75,
  'superliga-argentina':     70,
  'mls':                     60,
  'super-lig':               55,
  'afc-champions':           58,
  'generic-football':        30,
};

function getMatchScore(match) {
  const leagueWeight = LEAGUE_WEIGHTS[match.leagueSlug] || 30;

  // Boost if match is currently live
  const liveBoost = isMatchLive(match) ? 40 : 0;

  // Boost if match is starting within 2 hours
  const soonBoost = isMatchStartingSoon(match, 120) ? 20 : 0;

  // Boost for well-known teams (pre-seed list)
  const teamBoost = isBigTeam(match.homeTeam) || isBigTeam(match.awayTeam) ? 15 : 0;

  return leagueWeight + liveBoost + soonBoost + teamBoost;
}

// Selection for hub pages: sort all today's + upcoming 48h matches by score,
// take top 10
function getTopMatchesForHub(allMatches) {
  const window = getMatchesInWindow(allMatches, 0, 48); // next 48 hours
  return window
    .sort((a, b) => getMatchScore(b) - getMatchScore(a))
    .slice(0, 10);
}
```

### Hub Page Match Block Requirements

On `/tarjeta-roja/`, `/rojadirecta/`, `/pirlotv/`, and `/partidos-de-hoy/`:

```html
<section class="hub-top-matches">
  <h2>Los 10 Partidos Más Importantes Hoy</h2>
  <p>Haz clic en cualquier partido para ver la transmisión en vivo gratis:</p>
  <!-- 10 match cards, ordered by getMatchScore(), rendered at build time -->
  <!-- Each card links to /ver-[slug]-en-vivo/ -->
  <!-- Card anchor text = full match name, e.g. "Ver Real Madrid vs Barcelona EN VIVO" -->
</section>
```

**Anchor text rule for these 10 links:**
```
"Ver [HomeTeam] vs [AwayTeam] en vivo" — never truncate, never generic
```

This ensures maximum keyword-relevant anchor text flows to match pages from
your highest-authority hub pages.

---

## PATCH 4 — No further changes needed

Point 2 (lazy iframe / click-to-watch) is fully and correctly specified in the
original prompt at Section 7 (Performance) and Section 14 (Player UX). No
changes required.

---

*End of Addendum. Merge all 3 patches into the main VELCURI_BUILD_PROMPT.md
before passing to the build agent.*
