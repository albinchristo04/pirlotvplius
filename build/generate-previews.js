// build/generate-previews.js — Match preview pages 24h before kickoff (B3)
import { htmlHead, navHTML, footerHTML, matchCardHTML, writePage, formatDate, formatTime, SITE_URL, BUILD_DATE } from './generate.js';
import { getLeagueBlock, getLeagueDisplayName } from '../src/data/leagueBlocks.js';
import { breadcrumbSchema, faqSchema, sportsEventSchema } from '../src/partials/schema.js';

const TIMEZONE_OFFSETS = [
    { country: 'Argentina', code: 'AR', offset: -3 },
    { country: 'México', code: 'MX', offset: -6 },
    { country: 'España', code: 'ES', offset: 1 },
    { country: 'Colombia', code: 'CO', offset: -5 },
    { country: 'Perú', code: 'PE', offset: -5 },
];

function formatTimeForTZ(utcHour, offsetHours) {
    if (!utcHour) return '--:--';
    const [h, m] = utcHour.split(':').map(Number);
    let newH = (h + offsetHours + 24) % 24;
    return `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
}

export function generatePreviews(data) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const tomorrowMatches = data.events.filter(m => {
        if (!m.startDate) return false;
        const matchDate = new Date(m.startDate).toISOString().split('T')[0];
        return matchDate === tomorrowStr;
    });

    let count = 0;
    for (const match of tomorrowMatches) {
        const channels = match.embeds ? match.embeds.map(e => ({ name: e.name.replace(/\|.*$/, '').trim(), slug: e.name.replace(/\|.*$/, '').trim().toLowerCase().replace(/\s+/g, '-') })) : [];
        const leagueBlock = getLeagueBlock(match.leagueSlug);
        const leagueName = getLeagueDisplayName(match.leagueSlug);

        const timezoneTable = TIMEZONE_OFFSETS.map(tz =>
            `<tr><td>${tz.country}</td><td>${formatTimeForTZ(match.hour, tz.offset)}</td></tr>`
        ).join('\n');

        const faqs = [
            { q: `¿A qué hora juega ${match.homeTeam} vs ${match.awayTeam}?`, a: `El partido comienza el ${formatDate(match.startDate)} a las ${formatTime(match.hour)} UTC.` },
            { q: `¿Dónde ver ${match.homeTeam} vs ${match.awayTeam} en vivo?`, a: `Puedes ver el partido en vivo gratis en Velcuri, sin registro.` },
            { q: `¿En qué canal transmiten el partido?`, a: `Canales disponibles: ${channels.map(c => c.name).join(', ') || 'Consulta Velcuri para opciones'}.` },
            { q: '¿Necesito pagar?', a: 'No, Velcuri es completamente gratis. Sin suscripción ni registro.' },
        ];
        const faqHTML = faqs.map(f => `<div class="faq__item"><button class="faq__question" onclick="this.parentElement.classList.toggle('active')">${f.q}</button><div class="faq__answer"><p>${f.a}</p></div></div>`).join('\n');

        const schemas = [sportsEventSchema(match), faqSchema(faqs), breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: 'Previa' }, { name: `${match.homeTeam} vs ${match.awayTeam}` }])];

        const title = `Previa: ${match.homeTeam} vs ${match.awayTeam} — ${match.league} ${formatDate(match.startDate)} | Velcuri`;
        const desc = `Previa ${match.homeTeam} vs ${match.awayTeam}. Horarios por país, canales y enlace para ver en vivo gratis el ${formatDate(match.startDate)}.`;

        const head = htmlHead({ title, description: desc, keywords: `${match.homeTeam}, ${match.awayTeam}, previa, ${match.league}`, canonical: `/previa/${match.slug}/`, schemas });

        const body = `<body>${navHTML()}<main class="container">
<ol class="breadcrumb"><li><a href="/">Inicio</a></li><li>Previa</li><li>${match.homeTeam} vs ${match.awayTeam}</li></ol>
<h1>Previa: ${match.homeTeam} vs ${match.awayTeam} — ${match.league} ${formatDate(match.startDate)}</h1>

<div id="preview-banner" data-kickoff="${match.startDate}" style="display:none" class="hero">
<p>🔴 El partido ha comenzado. <a href="/${match.slug}/" class="btn btn--primary">Ver transmisión en vivo →</a></p>
</div>

<section>
<h2>¿A qué hora juega ${match.homeTeam} vs ${match.awayTeam}?</h2>
<table class="match-times-table">
<thead><tr><th>País</th><th>Hora Local</th></tr></thead>
<tbody>
${timezoneTable}
</tbody>
</table>
</section>

<section>
<h2>¿En qué canal ver ${match.homeTeam} vs ${match.awayTeam}?</h2>
${channels.length ? `<ul>${channels.map(c => `<li><a href="/canal/${c.slug}/">${c.name}</a></li>`).join('\n')}</ul>` : '<p>Consulta Velcuri para opciones de transmisión disponibles.</p>'}
</section>

<section>
<h2>Forma Reciente</h2>
<p>Ambos equipos llegan en buena forma a este encuentro. El ${match.homeTeam} buscará imponerse como local, mientras que el ${match.awayTeam} intentará sorprender como visitante. La ${leagueName} nos regala otro partido imperdible que promete mucha emoción e intensidad.</p>
</section>

<section class="cta-center">
<h2>Ver el Partido en Vivo</h2>
<a href="/${match.slug}/" class="btn btn--primary btn--large">▶ Ver ${match.homeTeam} vs ${match.awayTeam} EN VIVO GRATIS</a>
</section>

<section class="content-block"><h2>Sobre la ${leagueName}</h2>${leagueBlock}</section>

<section class="section faq"><h2 class="section__title">Preguntas Frecuentes</h2>${faqHTML}</section>
</main>
<script>
(function(){
  var b=document.getElementById('preview-banner'),k=b?.dataset.kickoff;
  if(!k)return;
  var s=new Date(k),e=new Date(s.getTime()+9e6);
  function check(){var n=new Date();if(n>=s&&n<=e)b.style.display='block';if(n>e)location.href='/${match.slug}/';}
  check();setInterval(check,60000);
})();
</script>
${footerHTML()}`;

        writePage(`previa/${match.slug}`, head + body);
        count++;
    }
    console.log(`[build] ✓ ${count} preview pages (tomorrow: ${tomorrowStr})`);
}
