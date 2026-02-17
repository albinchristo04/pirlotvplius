// src/data/leagueBlocks.js — League detection + text block loader
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOCKS_DIR = resolve(__dirname, 'league-blocks');

// League detection from diary_description
export function detectLeague(diaryDescription) {
    const d = diaryDescription.toLowerCase().replace(/\n/g, ' ');

    if (d.includes('champions league') && !d.includes('afc')) return 'champions-league';
    if (d.includes('europa league')) return 'europa-league';
    if (d.includes('conference league')) return 'conference-league';
    if (d.includes('premier league')) return 'premier-league';
    if (d.includes('laliga') || d.includes('liga española') || d.includes('la liga')) return 'laliga';
    if (d.includes('serie a')) return 'serie-a';
    if (d.includes('bundesliga')) return 'bundesliga';
    if (d.includes('ligue 1')) return 'ligue-1';
    if (d.includes('mls')) return 'mls';
    if (d.includes('copa libertadores')) return 'copa-libertadores';
    if (d.includes('superliga') || d.includes('super liga argentina') || d.includes('liga profesional')) return 'superliga-argentina';
    if (d.includes('liga mx')) return 'liga-mx';
    if (d.includes('süper lig') || d.includes('super lig')) return 'super-lig';
    if (d.includes('afc champions')) return 'afc-champions';
    if (d.includes('eredivisie') || d.includes('eerste divisie')) return 'eredivisie';
    if (d.includes('primeira liga')) return 'primeira-liga';
    if (d.includes('fa cup')) return 'fa-cup';
    if (d.includes('copa del rey')) return 'copa-del-rey';
    if (d.includes('championship')) return 'championship';
    if (d.includes('laliga smartbank')) return 'laliga-smartbank';
    if (d.includes('primera división')) return 'primera-division';

    return 'generic-football';
}

// Load pre-written HTML block for a league
export function getLeagueBlock(leagueSlug) {
    // Try exact match first
    let blockPath = resolve(BLOCKS_DIR, `${leagueSlug}.html`);
    if (existsSync(blockPath)) {
        return readFileSync(blockPath, 'utf-8');
    }

    // Fallback to generic
    blockPath = resolve(BLOCKS_DIR, 'generic-football.html');
    if (existsSync(blockPath)) {
        return readFileSync(blockPath, 'utf-8');
    }

    return '<p>Disfruta de este partido en vivo y gratis en Velcuri. Transmisión en directo sin necesidad de registro ni suscripción.</p>';
}

// Get league display name from slug
export function getLeagueDisplayName(slug) {
    const names = {
        'champions-league': 'UEFA Champions League',
        'europa-league': 'UEFA Europa League',
        'conference-league': 'UEFA Conference League',
        'premier-league': 'Premier League',
        'laliga': 'LaLiga',
        'serie-a': 'Serie A',
        'bundesliga': 'Bundesliga',
        'ligue-1': 'Ligue 1',
        'mls': 'Major League Soccer (MLS)',
        'copa-libertadores': 'Copa Libertadores',
        'superliga-argentina': 'Superliga Argentina',
        'liga-mx': 'Liga MX',
        'super-lig': 'Süper Lig',
        'afc-champions': 'AFC Champions League',
        'eredivisie': 'Eredivisie',
        'primeira-liga': 'Primeira Liga',
        'fa-cup': 'FA Cup',
        'copa-del-rey': 'Copa del Rey',
        'championship': 'Championship',
        'laliga-smartbank': 'LaLiga SmartBank',
        'primera-division': 'Primera División',
        'generic-football': 'Fútbol'
    };
    return names[slug] || slug;
}
