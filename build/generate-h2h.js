// build/generate-h2h.js — Head-to-Head rivalry pages (B1)
import { htmlHead, navHTML, footerHTML, matchCardHTML, writePage, SITE_URL, BUILD_DATE, formatDate } from './generate.js';
import { websiteSchema, breadcrumbSchema, faqSchema, renderSchemas } from '../src/partials/schema.js';

const RIVALRIES = [
    { home: 'Real Madrid', away: 'Barcelona', league: 'laliga', slug: 'real-madrid-vs-barcelona' },
    { home: 'River Plate', away: 'Boca Juniors', league: 'superliga-argentina', slug: 'river-plate-vs-boca-juniors' },
    { home: 'Manchester United', away: 'Manchester City', league: 'premier-league', slug: 'manchester-united-vs-manchester-city' },
    { home: 'Liverpool', away: 'Everton', league: 'premier-league', slug: 'liverpool-vs-everton' },
    { home: 'AC Milan', away: 'Inter Milan', league: 'serie-a', slug: 'ac-milan-vs-inter-milan' },
    { home: 'Juventus', away: 'Torino', league: 'serie-a', slug: 'juventus-vs-torino' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'bundesliga', slug: 'bayern-munich-vs-borussia-dortmund' },
    { home: 'PSG', away: 'Marseille', league: 'ligue-1', slug: 'psg-vs-marseille' },
    { home: 'Atletico Madrid', away: 'Real Madrid', league: 'laliga', slug: 'atletico-madrid-vs-real-madrid' },
    { home: 'Barcelona', away: 'Atletico Madrid', league: 'laliga', slug: 'barcelona-vs-atletico-madrid' },
    { home: 'Celtic', away: 'Rangers', league: 'premiership', slug: 'celtic-vs-rangers' },
    { home: 'Galatasaray', away: 'Fenerbahce', league: 'super-lig', slug: 'galatasaray-vs-fenerbahce' },
    { home: 'Flamengo', away: 'Fluminense', league: 'brasileirao', slug: 'flamengo-vs-fluminense' },
    { home: 'America', away: 'Chivas', league: 'liga-mx', slug: 'america-vs-chivas' },
    { home: 'Sporting CP', away: 'Benfica', league: 'primeira-liga', slug: 'sporting-cp-vs-benfica' },
    { home: 'Ajax', away: 'PSV', league: 'eredivisie', slug: 'ajax-vs-psv' },
    { home: 'Arsenal', away: 'Tottenham', league: 'premier-league', slug: 'arsenal-vs-tottenham' },
    { home: 'Roma', away: 'Lazio', league: 'serie-a', slug: 'roma-vs-lazio' },
    { home: 'Real Madrid', away: 'Atletico Madrid', league: 'laliga', slug: 'real-madrid-vs-atletico-madrid' },
    { home: 'Nacional', away: 'Penarol', league: 'primera-division', slug: 'nacional-vs-penarol' },
];

function generateRivalryContent(home, away) {
    return `<p>El enfrentamiento entre <strong>${home}</strong> y <strong>${away}</strong> es uno de los clásicos más apasionantes del fútbol mundial. Esta rivalidad ha producido algunos de los momentos más memorables en la historia del deporte, con partidos que han quedado grabados en la memoria colectiva de millones de aficionados alrededor del mundo.</p>
<p>A lo largo de los años, <strong>${home}</strong> y <strong>${away}</strong> se han enfrentado en innumerables ocasiones, tanto en competiciones de liga como en torneos internacionales. Cada encuentro entre estos dos equipos genera una enorme expectación, no solo por la calidad de los jugadores en el campo, sino también por la intensidad y la pasión que caracteriza a sus respectivas aficiones.</p>
<p>El historial de enfrentamientos entre <strong>${home}</strong> y <strong>${away}</strong> está repleto de goles espectaculares, jugadas individuales de genio y momentos de tensión que han definido temporadas enteras. Los aficionados de ambos equipos esperan con ansias cada nuevo capítulo de esta rivalidad, que siempre ofrece un espectáculo imperdible.</p>
<p>En la era moderna del fútbol, la rivalidad entre <strong>${home}</strong> y <strong>${away}</strong> se ha intensificado aún más, con ambos equipos compitiendo por los títulos más prestigiosos. Las inversiones en jugadores de clase mundial, los cambios tácticos innovadores y la presión mediática han elevado la calidad de estos enfrentamientos a niveles sin precedentes.</p>
<p>Para los aficionados que buscan vivir la emoción de <strong>${home} vs ${away}</strong>, Velcuri ofrece la posibilidad de seguir cada partido en vivo y en directo, de forma completamente gratuita y sin necesidad de registro. No te pierdas el próximo capítulo de esta rivalidad histórica.</p>
<p>Sigue el próximo <strong>${home} vs ${away}</strong> en vivo gratis en Velcuri.</p>`;
}

export function generateH2H(data) {
    let count = 0;
    for (const rivalry of RIVALRIES) {
        const upcomingMatch = data.events.find(m =>
            (m.homeTeam?.includes(rivalry.home) && m.awayTeam?.includes(rivalry.away)) ||
            (m.homeTeam?.includes(rivalry.away) && m.awayTeam?.includes(rivalry.home))
        );
        const leagueMatches = data.events.filter(m => m.leagueSlug === rivalry.league).slice(0, 4);

        const faqs = [
            { q: `¿Dónde ver ${rivalry.home} vs ${rivalry.away} en vivo?`, a: `Puedes ver ${rivalry.home} vs ${rivalry.away} en vivo gratis en Velcuri sin registro ni suscripción.` },
            { q: `¿A qué hora juega ${rivalry.home} vs ${rivalry.away}?`, a: upcomingMatch ? `El próximo partido es el ${formatDate(upcomingMatch.startDate)}.` : 'No hay partido programado próximamente. Consulta Velcuri para actualizaciones.' },
            { q: `¿Cuántos partidos han jugado ${rivalry.home} y ${rivalry.away}?`, a: `${rivalry.home} y ${rivalry.away} tienen un historial extenso de enfrentamientos en competiciones nacionales e internacionales.` },
            { q: '¿Se puede ver gratis?', a: 'Sí, en Velcuri puedes ver todos los partidos en vivo de forma gratuita sin necesidad de registrarte.' },
        ];
        const faqHTML = faqs.map(f => `<div class="faq__item"><button class="faq__question" onclick="this.parentElement.classList.toggle('active')">${f.q}</button><div class="faq__answer"><p>${f.a}</p></div></div>`).join('\n');

        const schemas = [
            faqSchema(faqs),
            breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: 'Rivalidades' }, { name: `${rivalry.home} vs ${rivalry.away}` }])
        ];
        const title = `${rivalry.home} vs ${rivalry.away} — Historial, Estadísticas y EN VIVO | Velcuri`;
        const desc = `Ver ${rivalry.home} vs ${rivalry.away} en vivo gratis. Historial completo, estadísticas H2H y próximo partido.`;
        const head = htmlHead({ title, description: desc, keywords: `${rivalry.home}, ${rivalry.away}, historial, en vivo`, canonical: `/rival/${rivalry.slug}/`, schemas });

        const nextMatchHTML = upcomingMatch
            ? `<section id="proximo-partido"><h2>Próximo Partido</h2><a href="/${upcomingMatch.slug}/" class="no-underline">${matchCardHTML(upcomingMatch)}</a></section>`
            : '<section id="proximo-partido"><h2>Próximo Partido</h2><p class="text-muted">No hay partido programado próximamente entre estos equipos.</p></section>';

        const relatedHTML = leagueMatches.length
            ? `<section id="ver-en-vivo"><h2>Ver en Vivo Gratis</h2><div class="grid grid--2">${leagueMatches.map(matchCardHTML).join('')}</div></section>`
            : '';

        const body = `<body>${navHTML()}<main class="container">
<ol class="breadcrumb"><li><a href="/">Inicio</a></li><li>Rivalidades</li><li>${rivalry.home} vs ${rivalry.away}</li></ol>
<h1>${rivalry.home} vs ${rivalry.away}: Historial Completo</h1>
${nextMatchHTML}
<section id="historial"><h2>Historia del Clásico</h2><div class="content-block">${generateRivalryContent(rivalry.home, rivalry.away)}</div></section>
${relatedHTML}
<section class="section faq"><h2 class="section__title">Preguntas Frecuentes</h2>${faqHTML}</section>
</main>${footerHTML()}`;

        writePage(`rival/${rivalry.slug}`, head + body);
        count++;
    }
    console.log(`[build] ✓ ${count} H2H rivalry pages`);
}
