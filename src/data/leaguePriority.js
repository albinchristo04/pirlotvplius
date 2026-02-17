// src/data/leaguePriority.js — Match scoring + popularity-weighted selection
const LEAGUE_WEIGHTS = {
    'champions-league': 100,
    'europa-league': 85,
    'conference-league': 70,
    'laliga': 95,
    'premier-league': 95,
    'serie-a': 88,
    'bundesliga': 85,
    'ligue-1': 80,
    'copa-libertadores': 82,
    'copa-del-rey': 72,
    'fa-cup': 68,
    'liga-mx': 75,
    'superliga-argentina': 70,
    'mls': 60,
    'super-lig': 55,
    'afc-champions': 58,
    'championship': 50,
    'eredivisie': 52,
    'primeira-liga': 54,
    'laliga-smartbank': 45,
    'primera-division': 48,
    'generic-football': 30,
};

// Top teams for boost scoring
const BIG_TEAMS = new Set([
    'real madrid', 'barcelona', 'atletico madrid', 'atletico de madrid',
    'manchester city', 'manchester united', 'liverpool', 'arsenal', 'chelsea', 'tottenham',
    'juventus', 'inter', 'inter milan', 'ac milan', 'napoli', 'roma',
    'psg', 'paris saint-germain',
    'bayern munich', 'bayern münchen', 'borussia dortmund',
    'river plate', 'boca juniors',
    'america', 'chivas', 'cruz azul',
    'flamengo', 'palmeiras', 'corinthians',
    'al hilal', 'al ahly',
    'benfica', 'porto', 'sporting',
    'ajax', 'feyenoord', 'psv',
    'galatasaray', 'fenerbahce', 'besiktas',
]);

function isBigTeam(teamName) {
    return BIG_TEAMS.has((teamName || '').toLowerCase().trim());
}

function isMatchLive(match) {
    const now = new Date();
    const start = new Date(match.startDate);
    const end = new Date(match.endDate);
    return now >= start && now <= end;
}

function isMatchStartingSoon(match, minutesWindow = 120) {
    const now = new Date();
    const start = new Date(match.startDate);
    const diff = (start - now) / 60000; // difference in minutes
    return diff > 0 && diff <= minutesWindow;
}

export function getMatchScore(match) {
    const leagueWeight = LEAGUE_WEIGHTS[match.leagueSlug] || 30;
    const liveBoost = isMatchLive(match) ? 40 : 0;
    const soonBoost = isMatchStartingSoon(match, 120) ? 20 : 0;
    const teamBoost = (isBigTeam(match.homeTeam) || isBigTeam(match.awayTeam)) ? 15 : 0;

    return leagueWeight + liveBoost + soonBoost + teamBoost;
}

// Get matches within a time window (hours from now)
function getMatchesInWindow(allMatches, hoursBack = 0, hoursForward = 48) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + hoursForward * 60 * 60 * 1000);

    return allMatches.filter(m => {
        const start = new Date(m.startDate);
        return start >= windowStart && start <= windowEnd;
    });
}

export function getTopMatchesForHub(allMatches, count = 10) {
    const windowed = getMatchesInWindow(allMatches, 0, 48);
    return windowed
        .sort((a, b) => getMatchScore(b) - getMatchScore(a))
        .slice(0, count);
}

// For build-time: use all available matches since we can't check "live" at build time
export function getTopMatchesForBuild(allMatches, count = 10) {
    return [...allMatches]
        .sort((a, b) => {
            const weightA = LEAGUE_WEIGHTS[a.leagueSlug] || 30;
            const weightB = LEAGUE_WEIGHTS[b.leagueSlug] || 30;
            const teamBoostA = (isBigTeam(a.homeTeam) || isBigTeam(a.awayTeam)) ? 15 : 0;
            const teamBoostB = (isBigTeam(b.homeTeam) || isBigTeam(b.awayTeam)) ? 15 : 0;
            return (weightB + teamBoostB) - (weightA + teamBoostA);
        })
        .slice(0, count);
}

export { LEAGUE_WEIGHTS, BIG_TEAMS };
