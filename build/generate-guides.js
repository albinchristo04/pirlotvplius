// build/generate-guides.js — "Cómo Ver" static guide pages (B2)
import { htmlHead, navHTML, footerHTML, matchCardHTML, writePage, SITE_URL } from './generate.js';
import { breadcrumbSchema, faqSchema } from '../src/partials/schema.js';

const GUIDES = [
    {
        slug: 'como-ver-champions-league-gratis',
        topic: 'Champions League',
        league: 'champions-league',
        channels: ['espn-en-vivo', 'movistar-deportes'],
        hub: '/tarjeta-roja/',
    },
    {
        slug: 'como-ver-laliga-sin-pagar',
        topic: 'LaLiga',
        league: 'laliga',
        channels: ['dazn-en-vivo', 'movistar-deportes'],
        hub: '/rojadirecta/',
    },
    {
        slug: 'como-ver-premier-league-gratis',
        topic: 'Premier League',
        league: 'premier-league',
        channels: ['espn-en-vivo', 'tnt-sports-en-vivo'],
        hub: '/tarjeta-roja/',
    },
    {
        slug: 'como-ver-copa-libertadores-gratis',
        topic: 'Copa Libertadores',
        league: 'copa-libertadores',
        channels: ['espn-en-vivo', 'fox-sports-en-vivo'],
        hub: '/rojadirecta/',
    },
    {
        slug: 'como-ver-futbol-en-movil',
        topic: 'Fútbol en el Móvil',
        league: null,
        channels: ['espn-en-vivo', 'dazn-en-vivo'],
        hub: '/pirlotv/',
    },
    {
        slug: 'como-ver-futbol-sin-suscripcion',
        topic: 'Fútbol sin Suscripción',
        league: null,
        channels: ['claro-sports', 'directv-sports'],
        hub: '/tarjeta-roja/',
    },
    {
        slug: 'canales-deportivos-gratis-online',
        topic: 'Canales Deportivos Gratis',
        league: null,
        channels: ['espn-en-vivo', 'fox-sports-en-vivo', 'tnt-sports-en-vivo', 'bein-sports-en-vivo'],
        hub: '/rojadirecta/',
    },
    {
        slug: 'mejores-paginas-ver-futbol-gratis',
        topic: 'Páginas para Ver Fútbol',
        league: null,
        channels: ['espn-en-vivo', 'dazn-en-vivo'],
        hub: '/pirlotv/',
    },
];

function generateGuideContent(guide) {
    const topic = guide.topic;
    return `<article>
<h1>Cómo Ver ${topic} Gratis en 2026</h1>

<p class="intro">Para ver ${topic} gratis, entra a Velcuri, selecciona el partido y haz clic en Ver EN VIVO. Sin registro ni suscripción. Velcuri es la plataforma más completa para ver fútbol en directo sin pagar.</p>

<h2>Pasos para Ver ${topic} Gratis</h2>
<ol>
<li><strong>Entra a <a href="/">velcuri.io</a></strong> desde cualquier dispositivo: smartphone, tablet, laptop o smart TV. No necesitas descargar ninguna aplicación.</li>
<li><strong>Busca el partido</strong> que deseas ver. Puedes navegar por la página principal, usar el buscador o explorar por liga, equipo o canal. Todos los partidos están organizados por horario.</li>
<li><strong>Haz clic en <a href="/partidos-de-hoy/">Ver EN VIVO GRATIS</a></strong> y elige tu canal preferido. La transmisión se cargará directamente en tu navegador sin necesidad de plugins ni extensiones.</li>
</ol>

<h2>¿En Qué Canales Transmiten ${topic}?</h2>
<p>Los principales canales que transmiten ${topic} incluyen:</p>
<ul>
${guide.channels.map(ch => `<li><a href="/canal/${ch}/">${ch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(' En Vivo', '')}</a></li>`).join('\n')}
</ul>
<p>En Velcuri reunimos todas las opciones de transmisión disponibles para que no te pierdas ni un solo minuto de acción. Cada partido tiene múltiples canales disponibles, permitiéndote elegir la mejor opción según tu preferencia de idioma y calidad de transmisión.</p>

<h2>¿Funciona en Móvil?</h2>
<p>Sí, Velcuri está completamente optimizado para dispositivos móviles. Nuestra plataforma utiliza un diseño responsive que se adapta automáticamente al tamaño de tu pantalla, ya sea un iPhone, un Android, una tablet o cualquier otro dispositivo. La calidad de la transmisión se ajusta automáticamente a tu velocidad de conexión para garantizar una experiencia fluida sin interrupciones. No necesitas descargar ninguna app: simplemente abre velcuri.io en el navegador de tu móvil y empieza a ver fútbol en vivo gratis.</p>
<p>Recomendamos usar una conexión WiFi o datos móviles 4G/5G para la mejor experiencia. Chrome, Safari y Firefox son los navegadores más compatibles con nuestras transmisiones.</p>

</article>`;
}

export function generateGuides(data) {
    let count = 0;
    for (const guide of GUIDES) {
        const upcomingMatches = guide.league
            ? data.events.filter(m => m.leagueSlug === guide.league).slice(0, 6)
            : data.events.slice(0, 6);

        const matchSection = upcomingMatches.length
            ? `<section class="section"><h2 class="section__title">Próximos Partidos${guide.league ? ' de ' + guide.topic : ''}</h2><div class="grid grid--3">${upcomingMatches.map(matchCardHTML).join('')}</div></section>`
            : '';

        const faqs = [
            { q: `¿Es gratis ver ${guide.topic} en Velcuri?`, a: `Sí, completamente gratis. No se requiere registro, suscripción ni pago de ningún tipo.` },
            { q: `¿Necesito instalar algo para ver ${guide.topic}?`, a: 'No, funciona directamente desde el navegador web en cualquier dispositivo.' },
            { q: `¿En qué países funciona?`, a: 'Velcuri funciona en todos los países hispanohablantes: Argentina, México, España, Colombia, Perú, Chile y más.' },
            { q: `¿La transmisión es en HD?`, a: 'Sí, ofrecemos transmisiones en calidad HD cuando están disponibles. La calidad se ajusta automáticamente a tu conexión.' },
            { q: `¿Es legal ver fútbol gratis en Velcuri?`, a: 'Velcuri es un directorio de enlaces a transmisiones disponibles públicamente en internet. No alojamos contenido.' },
        ];
        const faqHTML = faqs.map(f => `<div class="faq__item"><button class="faq__question" onclick="this.parentElement.classList.toggle('active')">${f.q}</button><div class="faq__answer"><p>${f.a}</p></div></div>`).join('\n');

        const schemas = [
            faqSchema(faqs),
            breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: 'Guías' }, { name: `Cómo Ver ${guide.topic}` }]),
        ];
        const title = `Cómo Ver ${guide.topic} Gratis en 2026 | Guía Completa — Velcuri`;
        const desc = `Para ver ${guide.topic} gratis, entra a Velcuri, selecciona el partido y haz clic en Ver EN VIVO. Sin registro ni suscripción.`;
        const head = htmlHead({ title, description: desc, keywords: `${guide.topic}, gratis, en vivo, cómo ver`, canonical: `/${guide.slug}/`, schemas });

        const body = `<body>${navHTML()}<main class="container">
<ol class="breadcrumb"><li><a href="/">Inicio</a></li><li>Guías</li><li>Cómo Ver ${guide.topic}</li></ol>
${generateGuideContent(guide)}
${matchSection}
<section class="section faq"><h2 class="section__title">Preguntas Frecuentes</h2>${faqHTML}</section>
<section class="cta-center">
<a href="/partidos-de-hoy/" class="btn btn--primary">Ver Partidos de Hoy</a>
${guide.league ? `<a href="/liga/${guide.league}/" class="btn btn--secondary">${guide.topic}</a>` : ''}
<a href="${guide.hub}" class="btn btn--secondary">${guide.hub.replace(/\//g, '').replace(/-/g, ' ')}</a>
</section>
</main>${footerHTML()}`;

        writePage(guide.slug, head + body);
        count++;
    }
    console.log(`[build] ✓ ${count} guide pages`);
}
