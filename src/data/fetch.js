// src/data/fetch.js — Fetches + normalizes match JSON data
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_SOURCE = process.env.JSON_SOURCE || 'https://raw.githubusercontent.com/albinchristo04/ptv/refs/heads/main/futbollibre.json';

// --- Slug Utility ---
export function slugify(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ñ/g, 'n')
        .replace(/ü/g, 'u')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function generateMatchSlug(homeTeam, awayTeam) {
    const home = slugify(homeTeam);
    const away = slugify(awayTeam);
    return `ver-${home}-vs-${away}-en-vivo`;
}

// --- Description Parser ---
export function parseDiaryDescription(desc) {
    // Clean up: remove leading/trailing whitespace and newlines
    const cleaned = desc.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Pattern: "LEAGUE: HomeTeam vs AwayTeam"
    const colonIdx = cleaned.indexOf(':');
    if (colonIdx === -1) {
        return { league: 'Fútbol', homeTeam: cleaned, awayTeam: '', title: cleaned };
    }

    const league = cleaned.substring(0, colonIdx).trim();
    const rest = cleaned.substring(colonIdx + 1).trim();

    // Try splitting by "vs"
    const vsIdx = rest.toLowerCase().indexOf(' vs ');
    if (vsIdx === -1) {
        return { league, homeTeam: rest, awayTeam: '', title: rest };
    }

    const homeTeam = rest.substring(0, vsIdx).trim();
    const awayTeam = rest.substring(vsIdx + 4).trim();

    return {
        league,
        homeTeam,
        awayTeam,
        title: `${homeTeam} vs ${awayTeam}`
    };
}

// --- Country Code Mapping ---
const COUNTRY_CODE_MAP = {
    'argentina': 'ar',
    'méxico': 'mx',
    'mexico': 'mx',
    'españa': 'es',
    'espana': 'es',
    'colombia': 'co',
    'perú': 'pe',
    'peru': 'pe',
    'turquía': 'tr',
    'turquia': 'tr',
    'italia': 'it',
    'inglaterra': 'gb',
    'francia': 'fr',
    'alemania': 'de',
    'brasil': 'br',
    'uruguay': 'uy',
    'chile': 'cl',
    'portugal': 'pt',
    'paises bajos': 'nl',
    'países bajos': 'nl',
    'afc champions league': 'afc',
    'conmebol': 'conmebol',
    'europa': 'eu',
};

function getCountryCode(countryName) {
    if (!countryName) return 'intl';
    return COUNTRY_CODE_MAP[countryName.toLowerCase()] || 'intl';
}

// --- Fetch with Retry ---
async function fetchWithRetry(url, retries = 3, timeout = 10000) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error(`Fetch attempt ${i + 1} failed: ${err.message}`);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}

// --- Normalize Single Event ---
function normalizeEvent(event) {
    const attrs = event.attributes;
    const parsed = parseDiaryDescription(attrs.diary_description);

    // Build datetime from date + hour
    const dateStr = attrs.date_diary;
    const hourStr = attrs.diary_hour || '00:00:00';
    const startDate = new Date(`${dateStr}T${hourStr}Z`);

    // End date = start + 2 hours
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    // Extract country
    const countryData = attrs.country?.data?.attributes;
    const countryName = countryData?.name || '';
    const countryCode = getCountryCode(countryName);

    // Extract channels/embeds
    const embeds = (attrs.embeds?.data || []).map(embed => ({
        id: embed.id,
        name: (embed.attributes.embed_name || '').trim(),
        iframeUrl: (embed.attributes.decoded_iframe_url || '').trim(),
        embedIframe: embed.attributes.embed_iframe || ''
    }));

    // Generate slug
    const slug = generateMatchSlug(parsed.homeTeam, parsed.awayTeam || 'evento');

    return {
        id: event.id,
        title: parsed.title,
        league: parsed.league,
        leagueSlug: slugify(parsed.league),
        homeTeam: parsed.homeTeam,
        awayTeam: parsed.awayTeam,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        date: dateStr,
        hour: hourStr,
        countryName,
        countryCode,
        slug,
        embeds,
        rawDescription: attrs.diary_description
    };
}

// --- Build Registries ---
function buildRegistries(events) {
    const leagues = {};
    const teams = {};
    const channels = {};
    const countries = {};
    const dates = {};
    const slugRegistry = {};

    for (const event of events) {
        // Collision handling: if slug exists, append date
        if (slugRegistry[event.slug]) {
            const day = event.date.substring(8, 10);
            const month = event.date.substring(5, 7);
            event.slug = `${event.slug}-${day}-${month}`;
        }
        slugRegistry[event.slug] = true;

        // League registry
        if (!leagues[event.leagueSlug]) {
            leagues[event.leagueSlug] = { name: event.league, slug: event.leagueSlug, matchCount: 0, events: [] };
        }
        leagues[event.leagueSlug].events.push(event);
        leagues[event.leagueSlug].matchCount++;

        // Team registries
        if (event.homeTeam) {
            const homeSlug = slugify(event.homeTeam);
            if (!teams[homeSlug]) {
                teams[homeSlug] = { name: event.homeTeam, slug: homeSlug, matches: [] };
            }
            teams[homeSlug].matches.push(event);
        }
        if (event.awayTeam) {
            const awaySlug = slugify(event.awayTeam);
            if (!teams[awaySlug]) {
                teams[awaySlug] = { name: event.awayTeam, slug: awaySlug, matches: [] };
            }
            teams[awaySlug].matches.push(event);
        }

        // Channel registry
        for (const embed of event.embeds) {
            const channelSlug = slugify(embed.name.replace(/\|.*$/, '').replace(/┃.*$/, '').trim());
            if (!channels[channelSlug]) {
                channels[channelSlug] = { name: embed.name.replace(/\|.*$/, '').replace(/┃.*$/, '').trim(), slug: channelSlug, embedUrl: embed.iframeUrl, events: [] };
            }
            channels[channelSlug].events.push(event);
        }

        // Country registry
        if (event.countryCode) {
            if (!countries[event.countryCode]) {
                countries[event.countryCode] = { name: event.countryName, code: event.countryCode, matches: [] };
            }
            countries[event.countryCode].matches.push(event);
        }

        // Date registry
        if (!dates[event.date]) {
            dates[event.date] = { events: [] };
        }
        dates[event.date].events.push(event);
    }

    return { leagues, teams, channels, countries, dates };
}

// --- Main Export ---
export async function fetchAndNormalize(useLocal = false) {
    let rawData;

    if (useLocal) {
        // Use local match.json for development
        const localPath = resolve(__dirname, '../../match.json');
        console.log(`[fetch] Using local fixture: ${localPath}`);
        rawData = JSON.parse(readFileSync(localPath, 'utf-8'));
    } else {
        console.log(`[fetch] Fetching from: ${JSON_SOURCE}`);
        rawData = await fetchWithRetry(JSON_SOURCE);
    }

    const rawEvents = rawData.data || [];
    console.log(`[fetch] Raw events: ${rawEvents.length}`);

    const events = rawEvents.map(normalizeEvent);
    const registries = buildRegistries(events);

    console.log(`[fetch] Normalized: ${events.length} events, ${Object.keys(registries.leagues).length} leagues, ${Object.keys(registries.teams).length} teams, ${Object.keys(registries.channels).length} channels`);

    return {
        events,
        ...registries,
        metadata: rawData.metadata || {}
    };
}

// CLI execution
if (process.argv[1] && process.argv[1].includes('fetch.js')) {
    const useLocal = process.argv.includes('--local');
    fetchAndNormalize(useLocal).then(data => {
        console.log(JSON.stringify(data, null, 2));
    }).catch(err => {
        console.error('Fetch failed:', err);
        process.exit(1);
    });
}
