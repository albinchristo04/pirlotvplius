# VELCURI BUILD GAP AUDIT
## Spec vs Delivered — Post-Build Review

---

## 🔴 CRITICAL GAPS (will directly hurt rankings or break functionality)

### GAP 1 — IndexNow GitHub Action MISSING
**Status:** `indexnow.js` script exists ✅ but `indexnow.yml` workflow NOT listed
**Impact:** Bing will not receive real-time URL submissions on deploy. 
New match pages won't be indexed for hours/days instead of minutes.
**Fix:** Create `.github/workflows/indexnow.yml`:
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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node scripts/indexnow.js
        env:
          INDEXNOW_KEY: ${{ secrets.INDEXNOW_KEY }}
          SITE_URL: https://www.velcuri.io
```

---

### GAP 2 — Cron Schedule NOT CONFIRMED in build-deploy.yml
**Status:** `build-deploy.yml` listed but no confirmation cron triggers were added
**Impact:** Match pages only rebuild on `git push`. 
Today's match data goes stale. Bing sees outdated `<lastmod>` in sitemap.
**Fix:** Verify `build-deploy.yml` contains:
```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */2 * * *'   # every 2 hours — fresh match data
    - cron: '0 6 * * *'     # full daily rebuild at 6am UTC
```
If not present, add immediately. This is the core of a live sports site.

---

### GAP 3 — Slug Pattern UNCONFIRMED
**Status:** Addendum Patch 2 specified `/ver-[home]-vs-[away]-en-vivo/` 
but walkthrough doesn't confirm this override was applied.
**Impact:** If original `/partido/[date]/[slug]/` pattern was kept, 
every match URL is missing "ver" and "en-vivo" keyword signals in the path.
**Fix:** Check any generated match page URL. It must look like:
```
✅  /ver-kasimpasa-vs-fatih-karagumruk-en-vivo/
❌  /partido/2026-02-16/kasimpasa-vs-fatih-karagumruk/
```
If wrong, patch `fetch.js` slug generator and rebuild.

---

### GAP 4 — Single sitemap.xml vs Required 7-File Split
**Status:** Only `sitemap.xml` mentioned. 
Spec required a sitemap INDEX pointing to 7 sub-sitemaps.
**Impact:** When you scale to 1000+ match pages, a single sitemap hits 
Bing's 50,000 URL limit and crawl budget is distributed poorly.
More importantly: split sitemaps let you set different `<changefreq>` 
and `<priority>` per content type.
**Fix:** `generate-sitemap.js` must output:
```
dist/sitemap.xml           ← master index only
dist/sitemap-matches.xml   ← changefreq: hourly on match day
dist/sitemap-channels.xml  ← changefreq: daily
dist/sitemap-leagues.xml   ← changefreq: daily
dist/sitemap-hubs.xml      ← changefreq: daily, priority: 0.9
dist/sitemap-countries.xml ← changefreq: weekly
dist/sitemap-blog.xml      ← changefreq: monthly
dist/sitemap-teams.xml     ← changefreq: weekly
```

---

## 🟡 SIGNIFICANT GAPS (hurt SEO or UX, fix before launch)

### GAP 5 — Hub Page Count (9) vs Specification
**Status:** 9 hub pages generated. Spec required these keyword hubs:
```
Required                    Likely generated?
/tarjeta-roja/              ✅ probably yes
/rojadirecta/               ✅ probably yes  
/pirlotv/                   ✅ probably yes
/partidos-de-hoy/           ✅ probably yes
/partidos-en-vivo/          ✅ probably yes
/futbol-en-vivo/            ✅ probably yes
/futbol-gratis/             ❓ unknown
/ver-futbol-online/         ❓ unknown
/futbol-para-todos/         ❓ unknown — specific keyword target
```
If 3 hubs are missing, that's 3 keyword clusters with no authority page.
**Fix:** Confirm all 9 hub slugs. Add the missing ones as static pages.

---

### GAP 6 — /buscar/ Search Page MISSING from output
**Status:** Not mentioned anywhere in the walkthrough.
**Impact:** No internal search = no SearchAction schema on WebSite = 
missing sitelinks search box potential in Bing SERPs.
Also: search page is a legitimate landing page for 
"buscar partidos de futbol en vivo" type queries.
**Fix:** Generate `/buscar/index.html` — static shell + 
client-side search using `/search-index.json` 
(search-index.json IS confirmed generated ✅).

---

### GAP 7 — OG Images Only Generated for Matches + Home + Hubs (23 total)
**Status:** League pages, channel pages, team pages, country pages 
have NO OG images.
**Impact:** When these pages are shared on WhatsApp/Twitter 
(common in LATAM football communities), they show blank preview.
CTR from social = indirect Bing ranking signal.
**Fix:** Extend `generate-og.js` to generate for:
- All league hub pages (simpler template: league name + logo area)
- All channel pages
- All country pages
Estimated additional: ~40 images, fast since they're template-based.

---

### GAP 8 — Service Worker Caching Strategy UNVERIFIED
**Status:** `sw.js` listed in scaffold but no verification it was implemented correctly.
**Impact:** If SW caches match pages aggressively, users see stale 
match times/channels. If it doesn't cache at all, repeat visitors 
get no offline/fast-load benefit.
**Fix:** Verify `sw.js` implements this strategy:
```javascript
// Cache strategy by URL pattern:
// /ver-*-en-vivo/    → Network-first (match pages change frequently)
// /*.css, /*.js      → Cache-first with versioning
// /liga/*, /canal/*  → Stale-while-revalidate (24h)
// /blog/*            → Cache-first (rarely changes)
// /og/*.png          → Cache-first
```

---

### GAP 9 — Schema Not Validated
**Status:** Schema generated but not tested.
**Impact:** Invalid schema = no rich results in Bing. 
One bad JSON-LD character breaks the entire schema block silently.
**Fix — add to build pipeline:**
```javascript
// In build-main.js, after generation:
// 1. Pick 3 random match pages from dist/
// 2. Extract <script type="application/ld+json"> blocks
// 3. JSON.parse() each — if it throws, fail the build
// 4. Log schema types found per page to build output

// Quick validation in build-main.js:
const pages = ['dist/index.html', 'dist/tarjeta-roja/index.html', 
                'dist/ver-kasimpasa-vs-fatih-karagumruk-en-vivo/index.html'];
pages.forEach(p => {
  const html = fs.readFileSync(p, 'utf8');
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  match?.forEach(block => {
    const json = block.replace(/<\/?script[^>]*>/g, '');
    JSON.parse(json); // throws if invalid
  });
});
console.log('✅ Schema JSON-LD valid on sampled pages');
```

---

## 🟢 MINOR GAPS (quality improvements, do after launch)

### GAP 10 — Countdown Timer Verification
`countdown.js` listed but not in verification checklist.
A match page for a future match should show a countdown.
A match page for a past/live match should show "EN VIVO" badge.
**Fix:** Manually open a future match page and confirm countdown renders.

### GAP 11 — Country Pages Depth
"50+ league/channel/team/country pages" is vague.
Spec required these exact country sub-pages per locale (5 countries × 7 pages = 35):
```
/[cc]/
/[cc]/partidos-de-hoy/
/[cc]/futbol-en-vivo/
/[cc]/rojadirecta/
/[cc]/tarjeta-roja/
/[cc]/pirlotv/
/[cc]/liga/champions-league/
```
Verify all 35 exist in `dist/`.

### GAP 12 — Popularity-Weighted Match Links on Hub Pages
Addendum Patch 3 specified `getMatchScore()` algorithm with league weights.
With only 13 matches in current JSON, this barely matters now — 
but verify the logic is wired up so it works correctly when 
the JSON grows to 50-100 events daily.

### GAP 13 — Privacy Policy / Terms / Legal Pages
"Static pages 7" count — confirm these are included:
```
/sobre-velcuri/
/contacto/
/politica-de-privacidad/
/terminos-de-uso/
/aviso-legal/
/preguntas-frecuentes/
/404.html
```
Without `/politica-de-privacidad/` and `/terminos-de-uso/`, 
Bing Webmaster Tools flags the site as low-trust.

### GAP 14 — Bing Webmaster Tools Verification File
Not mentioned anywhere. 
Bing requires either a meta tag OR an XML file at root for verification.
Add `BingSiteAuth.xml` to `/static/` (get the key from Bing Webmaster Tools after launch).
Without this, IndexNow submissions are lower priority and 
you lose access to Bing's crawl stats dashboard.

---

## ✅ CONFIRMED WORKING (no action needed)

- OG images generated (23 PNGs) ✅
- PWA icons (4 PNGs) ✅  
- Hreflang tags (es-AR, es-MX, es-ES, es-CO, es-PE, x-default) ✅
- Apple-touch-icon in `<head>` ✅
- Zero inline `style=` on homepage ✅
- sitemap.xml generated ✅
- search-index.json generated ✅
- Lazy iframe (click-to-watch) — per original spec ✅
- League blocks (15 files) — per Patch 1 ✅
- leaguePriority.js — per Patch 3 ✅
- Blog (10 posts + index) ✅
- Build time ~6.77s ✅ (well within 60s GitHub Actions limit)

---

## PRIORITY ACTION ORDER

| Priority | Gap | Fix Time |
|----------|-----|----------|
| 🔴 1 | Add indexnow.yml GitHub Action | 10 min |
| 🔴 2 | Verify + add cron to build-deploy.yml | 5 min |
| 🔴 3 | Confirm slug pattern is /ver-X-vs-Y-en-vivo/ | 5 min |
| 🔴 4 | Split sitemap.xml into 7 sub-sitemaps | 30 min |
| 🟡 5 | Add /buscar/ search page | 20 min |
| 🟡 6 | Verify all 9 hub pages exist | 10 min |
| 🟡 7 | Add schema validation to build pipeline | 20 min |
| 🟡 8 | Extend OG images to leagues/channels | 30 min |
| 🟢 9 | Verify SW caching strategy | 15 min |
| 🟢 10 | Add Bing Webmaster Tools auth file | 5 min |
| 🟢 11 | Verify all 35 country sub-pages | 10 min |

**Estimated total fix time: ~3 hours before the site is fully spec-compliant.**
