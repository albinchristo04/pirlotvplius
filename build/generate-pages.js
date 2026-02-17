// build/generate-pages.js — Hub, League, Channel, Team, Blog, Country, Static page generators
import { htmlHead, navHTML, footerHTML, matchCardHTML, writePage, writeFile, ensureDir, formatDate, DIST, SRC, ROOT, SITE_URL, BUILD_DATE } from './generate.js';
import { getLeagueDisplayName, getLeagueBlock } from '../src/data/leagueBlocks.js';
import { getTopMatchesForBuild } from '../src/data/leaguePriority.js';
import { websiteSchema, breadcrumbSchema, faqSchema, itemListSchema, renderSchemas } from '../src/partials/schema.js';
import { slugify } from '../src/data/fetch.js';

// --- Hub Pages ---
const HUB_PAGES = [
    { slug: 'tarjeta-roja', title: 'Tarjeta Roja — Ver Fútbol EN VIVO GRATIS | Alternativa Oficial — Velcuri', desc: 'La mejor alternativa a Tarjeta Roja TV. Ver fútbol en vivo gratis sin registrarse. Partidos de hoy, Champions League, Liga Española y más.', keyword: 'Tarjeta Roja', links: ['/rojadirecta/', '/pirlotv/', '/partidos-de-hoy/'] },
    { slug: 'rojadirecta', title: 'Rojadirecta EN VIVO — Ver Partidos Gratis Hoy | Velcuri', desc: 'Alternativa a Rojadirecta. Ver partidos de fútbol gratis en vivo hoy. Sin registro. Champions, LaLiga, Premier League en directo.', keyword: 'Rojadirecta', links: ['/tarjeta-roja/', '/pirlotv/', '/partidos-en-vivo/'] },
    { slug: 'pirlotv', title: 'Pirlo TV EN VIVO — Fútbol Gratis Online | Velcuri', desc: 'Alternativa a Pirlotv y Pirlo TV en vivo. Ver fútbol gratis sin suscripción. Todos los partidos de hoy en directo HD.', keyword: 'Pirlotv', links: ['/rojadirecta/', '/tarjeta-roja/'] },
    { slug: 'partidos-de-hoy', title: `Partidos de Hoy EN VIVO GRATIS | ${formatDate(BUILD_DATE)} — Velcuri`, desc: 'Todos los partidos de fútbol de hoy en vivo y gratis. Horarios, canales y enlaces directos a las transmisiones.', keyword: 'Partidos de Hoy', links: ['/partidos-en-vivo/', '/futbol-en-vivo/'] },
    { slug: 'partidos-en-vivo', title: 'Partidos EN VIVO Ahora Mismo GRATIS | Fútbol Online — Velcuri', desc: 'Partidos de fútbol en vivo ahora mismo. Transmisiones en directo gratis sin registro.', keyword: 'Partidos en Vivo', links: ['/partidos-de-hoy/', '/futbol-en-vivo/'] },
    { slug: 'futbol-en-vivo', title: 'Fútbol EN VIVO GRATIS | Todos los Partidos Ahora — Velcuri', desc: 'Ver fútbol en vivo gratis. Todos los partidos de hoy en directo sin suscripción.', keyword: 'Fútbol en Vivo', links: ['/partidos-de-hoy/', '/rojadirecta/'] },
    { slug: 'futbol-gratis', title: 'Ver Fútbol GRATIS Online | Sin Registro Sin Suscripción — Velcuri', desc: 'Ver fútbol gratis online sin registro ni suscripción. Partidos en vivo de todas las ligas.', keyword: 'Fútbol Gratis', links: ['/futbol-en-vivo/', '/partidos-de-hoy/'] },
    { slug: 'ver-futbol-online', title: 'Ver Fútbol Online EN VIVO | HD Gratis Sin Cortes — Velcuri', desc: 'Ver fútbol online en vivo en HD gratis. Sin cortes, sin registro, sin suscripción.', keyword: 'Ver Fútbol Online', links: ['/futbol-en-vivo/', '/pirlotv/'] },
    { slug: 'futbol-para-todos', title: 'Fútbol Para Todos EN VIVO GRATIS | Partidos Hoy — Velcuri', desc: 'Fútbol para todos en vivo y gratis. Todos los partidos de hoy en directo.', keyword: 'Fútbol Para Todos', links: ['/partidos-de-hoy/', '/rojadirecta/'] },
];

function generateHubContent(hub) {
    const kw = hub.keyword;
    return `<p>Bienvenido a la sección de <strong>${kw}</strong> en Velcuri, tu plataforma de referencia para ver fútbol en vivo gratis en español. Si estás buscando una alternativa confiable y moderna a ${kw}, has llegado al lugar indicado. En Velcuri reunimos las mejores transmisiones en directo de partidos de fútbol de todas las ligas del mundo, incluyendo la Champions League, LaLiga, Premier League, Serie A, Bundesliga, Copa Libertadores, Liga MX y muchas más competiciones.</p>
<p>A diferencia de otras plataformas, <strong>${kw}</strong> en Velcuri ofrece una experiencia de usuario superior: sin pop-ups intrusivos, sin necesidad de registro, sin suscripciones de pago y con una interfaz diseñada para que encuentres el partido que buscas en segundos. Nuestra tecnología permite cargar las transmisiones en directo de forma rápida y eficiente en cualquier dispositivo, ya sea tu smartphone, tablet, laptop o smart TV.</p>
<p>Cada día actualizamos la programación con todos los partidos disponibles, organizados por liga, horario y canales de transmisión. Ya no necesitas buscar en múltiples sitios web para encontrar dónde ver tu equipo favorito: en Velcuri lo tienes todo centralizado en un solo lugar, con múltiples opciones de canales para cada partido y calidad de transmisión HD cuando está disponible.</p>
<p>Nuestro compromiso es ofrecer la mejor experiencia posible para los amantes del fútbol en español. Tanto si sigues <strong>${kw}</strong> desde Argentina, México, España, Colombia, Perú o cualquier otro país hispanohablante, en Velcuri encontrarás contenido adaptado a tu zona horaria y preferencias. El fútbol en vivo gratis nunca ha sido tan accesible como ahora.</p>
<p>Explora los partidos de hoy, descubre las próximas transmisiones de las mejores ligas del mundo y disfruta del fútbol como debe ser: libre, gratuito y al alcance de todos. Velcuri es tu alternativa definitiva a <strong>${kw}</strong>, con una plataforma más rápida, segura y organizada que cualquier otra opción disponible en internet.</p>`;
}

export function generateHubPages(data) {
    const topMatches = getTopMatchesForBuild(data.events, 10);
    const matchCards = topMatches.map(m => `<a href="/${m.slug}/" class="no-underline">${matchCardHTML(m)}</a>`).join('\n');

    for (const hub of HUB_PAGES) {
        const hubFaqs = [
            { q: `¿Qué es ${hub.keyword} y cómo funciona?`, a: `${hub.keyword} en Velcuri es una plataforma gratuita para ver partidos de fútbol en vivo. Solo necesitas seleccionar un partido y elegir un canal.` },
            { q: '¿Es gratis ver los partidos en Velcuri?', a: 'Sí, completamente gratis. No se requiere registro ni suscripción.' },
            { q: '¿Qué partidos puedo ver hoy?', a: `Puedes ver ${data.events.length} partidos hoy, incluyendo ligas como Champions League, LaLiga, Premier League y más.` },
            { q: '¿Funciona en móvil?', a: 'Sí, Velcuri está optimizado para smartphones, tablets y computadoras.' },
            { q: '¿Necesito instalar algo?', a: 'No, funciona directamente desde el navegador web.' },
            { q: `¿Cuál es la mejor alternativa a ${hub.keyword}?`, a: `Velcuri es la mejor alternativa a ${hub.keyword}. Ofrecemos más partidos, mejor calidad y una interfaz más moderna.` },
            { q: '¿Hay publicidad?', a: 'Nuestro sitio tiene publicidad mínima que no interfiere con la experiencia de visualización.' },
            { q: '¿En qué países funciona?', a: 'Velcuri funciona en todos los países hispanohablantes: Argentina, México, España, Colombia, Perú, Chile y más.' },
        ];
        const faqHTML = hubFaqs.map(f => `<div class="faq__item"><button class="faq__question" onclick="this.parentElement.classList.toggle('active')">${f.q}</button><div class="faq__answer"><p>${f.a}</p></div></div>`).join('\n');
        const schemas = [websiteSchema(), faqSchema(hubFaqs), breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: hub.keyword }])];
        const linksHTML = hub.links.map(l => `<a href="${l}" class="btn btn--secondary">${l.replace(/\//g, '').replace(/-/g, ' ')}</a>`).join(' ');

        const head = htmlHead({ title: hub.title, description: hub.desc, keywords: `${hub.keyword}, fútbol en vivo, gratis, partidos hoy`, canonical: `/${hub.slug}/`, schemas });
        const body = `<body>${navHTML()}<main class="container">
<ol class="breadcrumb"><li><a href="/">Inicio</a></li><li>${hub.keyword}</li></ol>
<h1>${hub.keyword} — Ver Fútbol EN VIVO GRATIS</h1>
<section class="content-block">${generateHubContent(hub)}</section>
<section class="hub-top-matches"><h2>Los 10 Partidos Más Importantes Hoy</h2>
<p>Haz clic en cualquier partido para ver la transmisión en vivo gratis:</p>
<div class="grid grid--3">${matchCards}</div></section>
<section class="cta-center" style="display:flex;gap:1rem;flex-wrap:wrap">${linksHTML}</section>
<section class="section faq"><h2 class="section__title">Preguntas Frecuentes</h2>${faqHTML}</section>
</main>${footerHTML()}`;
        writePage(hub.slug, head + body);
    }
    console.log(`[build] ✓ ${HUB_PAGES.length} hub pages`);
}

// --- League Pages ---
const PRE_BUILT_LEAGUES = ['champions-league', 'laliga', 'premier-league', 'serie-a', 'bundesliga', 'ligue-1', 'copa-libertadores', 'copa-america', 'superliga-argentina', 'liga-mx', 'euro', 'copa-del-rey', 'mls', 'super-lig', 'afc-champions-league'];

export function generateLeaguePages(data) {
    const allLeagueSlugs = new Set([...Object.keys(data.leagues), ...PRE_BUILT_LEAGUES]);
    let count = 0;
    for (const slug of allLeagueSlugs) {
        const league = data.leagues[slug] || { name: getLeagueDisplayName(slug), slug, matchCount: 0, events: [] };
        const leagueBlock = getLeagueBlock(slug);
        const matchCards = league.events.map(matchCardHTML).join('\n');
        const schemas = [breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: 'Ligas', url: '/' }, { name: league.name }])];
        const title = `${league.name} EN VIVO GRATIS | Todos los Partidos — Velcuri`;
        const desc = `Ver ${league.name} en vivo gratis. Todos los partidos en directo sin suscripción. Horarios, canales y transmisiones.`;
        const head = htmlHead({ title, description: desc, keywords: `${league.name}, en vivo, gratis, partidos`, canonical: `/liga/${slug}/`, schemas });
        const body = `<body>${navHTML()}<main class="container">
<ol class="breadcrumb"><li><a href="/">Inicio</a></li><li><a href="/">Ligas</a></li><li>${league.name}</li></ol>
<h1>${league.name} <span class="text-accent">EN VIVO GRATIS</span></h1>
<section class="content-block">${leagueBlock}</section>
${league.events.length ? `<section class="section"><h2 class="section__title">Partidos de ${league.name}</h2><div class="grid grid--3">${matchCards}</div></section>` : '<p class="text-muted" style="margin:2rem 0">No hay partidos programados actualmente para esta liga.</p>'}
</main>${footerHTML()}`;
        writePage(`liga/${slug}`, head + body);
        count++;
    }
    console.log(`[build] ✓ ${count} league pages`);
}

// --- Channel Pages ---
const PRE_BUILT_CHANNELS = [
    { slug: 'espn-en-vivo', name: 'ESPN' }, { slug: 'espn-2-en-vivo', name: 'ESPN 2' }, { slug: 'espn-3-en-vivo', name: 'ESPN 3' },
    { slug: 'fox-sports-en-vivo', name: 'Fox Sports' }, { slug: 'fox-sports-2-en-vivo', name: 'Fox Sports 2' },
    { slug: 'movistar-deportes', name: 'Movistar Deportes' }, { slug: 'dazn-en-vivo', name: 'DAZN' },
    { slug: 'disney-plus-en-vivo', name: 'Disney+' }, { slug: 'tnt-sports-en-vivo', name: 'TNT Sports' },
    { slug: 'bein-sports-en-vivo', name: 'beIN Sports' }, { slug: 'directv-sports', name: 'DirecTV Sports' },
    { slug: 'claro-sports', name: 'Claro Sports' }, { slug: 'sky-sports', name: 'Sky Sports' },
    { slug: 'canal-plus-en-vivo', name: 'Canal+' }, { slug: 'tv-azteca-deportes', name: 'TV Azteca Deportes' },
    { slug: 'televisa-deportes', name: 'Televisa Deportes' },
];

export function generateChannelPages(data) {
    const allChannels = new Map();
    for (const ch of PRE_BUILT_CHANNELS) allChannels.set(ch.slug, { ...ch, events: [] });
    for (const [slug, ch] of Object.entries(data.channels)) {
        if (allChannels.has(slug)) { allChannels.get(slug).events = ch.events; }
        else { allChannels.set(slug, ch); }
    }

    let count = 0;
    for (const [slug, channel] of allChannels) {
        const matchCards = channel.events.map(matchCardHTML).join('\n');
        const title = `Ver ${channel.name} EN VIVO GRATIS | Sin Suscripción — Velcuri`;
        const desc = `Ver ${channel.name} en vivo gratis sin suscripción. Todos los partidos transmitidos por ${channel.name} en directo.`;
        const schemas = [breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: 'Canales' }, { name: channel.name }])];
        const head = htmlHead({ title, description: desc, keywords: `${channel.name}, en vivo, gratis, ver`, canonical: `/canal/${slug}/`, schemas });
        const body = `<body>${navHTML()}<main class="container">
<ol class="breadcrumb"><li><a href="/">Inicio</a></li><li>Canales</li><li>${channel.name}</li></ol>
<h1>Ver ${channel.name} <span class="text-accent">EN VIVO GRATIS</span></h1>
<section class="content-block"><p><strong>${channel.name}</strong> es uno de los canales deportivos más populares para ver fútbol en vivo. En Velcuri puedes acceder a la transmisión en directo de ${channel.name} de forma completamente gratuita, sin necesidad de suscripción ni registro. Este canal ofrece cobertura de las principales ligas y competiciones del mundo, incluyendo partidos de Champions League, ligas nacionales y torneos internacionales.</p>
<p>La programación de <strong>${channel.name}</strong> incluye partidos en vivo, análisis pre y post partido, entrevistas exclusivas y contenido especial. En Velcuri actualizamos diariamente la programación para que siempre sepas qué partidos se transmiten por este canal y a qué hora comienzan.</p>
<p>Para ver <strong>${channel.name} en vivo y gratis</strong>, simplemente selecciona el partido que deseas ver y elige ${channel.name} como tu canal preferido. La transmisión se cargará directamente en tu navegador, sin necesidad de descargar aplicaciones ni plugins adicionales.</p></section>
${channel.events.length ? `<section class="section"><h2 class="section__title">Partidos en ${channel.name}</h2><div class="grid grid--3">${matchCards}</div></section>` : '<p class="text-muted" style="margin:2rem 0">No hay partidos programados actualmente en este canal.</p>'}
</main>${footerHTML()}`;
        writePage(`canal/${slug}`, head + body);
        count++;
    }
    console.log(`[build] ✓ ${count} channel pages`);
}

// --- Team Pages ---
const PRE_SEEDED_TEAMS = ['real-madrid', 'barcelona', 'atletico-madrid', 'manchester-city', 'manchester-united', 'liverpool', 'juventus', 'inter-milan', 'ac-milan', 'psg', 'bayern-munich', 'borussia-dortmund', 'river-plate', 'boca-juniors', 'america', 'chivas', 'flamengo', 'al-hilal'];

export function generateTeamPages(data) {
    const allTeams = new Map();
    for (const t of PRE_SEEDED_TEAMS) allTeams.set(t, { name: t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), slug: t, matches: [] });
    for (const [slug, team] of Object.entries(data.teams)) {
        if (allTeams.has(slug)) { allTeams.get(slug).matches = team.matches; allTeams.get(slug).name = team.name; }
        else { allTeams.set(slug, team); }
    }

    let count = 0;
    for (const [slug, team] of allTeams) {
        const matchCards = team.matches.map(matchCardHTML).join('\n');
        const title = `${team.name} EN VIVO | Próximos Partidos y Transmisiones — Velcuri`;
        const desc = `Ver ${team.name} en vivo gratis. Próximos partidos, horarios y canales de transmisión.`;
        const schemas = [breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: 'Equipos' }, { name: team.name }])];
        const head = htmlHead({ title, description: desc, keywords: `${team.name}, en vivo, partidos, transmisión`, canonical: `/equipo/${slug}/`, schemas });
        const body = `<body>${navHTML()}<main class="container">
<ol class="breadcrumb"><li><a href="/">Inicio</a></li><li>Equipos</li><li>${team.name}</li></ol>
<h1>${team.name} <span class="text-accent">EN VIVO</span></h1>
${team.matches.length ? `<section class="section"><h2 class="section__title">Próximos Partidos</h2><div class="grid grid--3">${matchCards}</div></section>` : '<p class="text-muted" style="margin:2rem 0">No hay partidos programados actualmente para este equipo.</p>'}
</main>${footerHTML()}`;
        writePage(`equipo/${slug}`, head + body);
        count++;
    }
    console.log(`[build] ✓ ${count} team pages`);
}

// --- Static Pages ---
export function generateStaticPages() {
    const pages = [
        { slug: 'sobre-velcuri', title: 'Sobre Velcuri — Fútbol en Vivo Gratis', desc: 'Conoce Velcuri, tu plataforma de fútbol en vivo gratis.', content: '<h1>Sobre Velcuri</h1><div class="content-block"><p><strong>Velcuri</strong> es una plataforma web dedicada a facilitar el acceso gratuito a transmisiones en vivo de partidos de fútbol de todas las ligas del mundo. Nuestro objetivo es ser la referencia número uno en habla hispana para los amantes del deporte rey.</p><p>En Velcuri creemos que el fútbol es para todos. Por eso, nuestra plataforma es completamente gratuita, sin registro obligatorio ni suscripciones de pago. Reunimos enlaces a las mejores transmisiones en directo organizadas por liga, equipo, canal y horario, para que encuentres el partido que buscas en cuestión de segundos.</p><p>Nuestro equipo trabaja diariamente para mantener actualizada la programación de partidos, verificar la calidad de las transmisiones y mejorar continuamente la experiencia de usuario. Velcuri está optimizado para funcionar perfectamente en cualquier dispositivo: smartphones, tablets, laptops y smart TVs.</p><p><strong>Equipo Velcuri</strong></p></div>' },
        { slug: 'contacto', title: 'Contacto — Velcuri', desc: 'Contacta con el equipo de Velcuri.', content: '<h1>Contacto</h1><div class="content-block"><p>Si tienes preguntas, sugerencias o necesitas reportar algún problema, puedes contactarnos a través de:</p><p><strong>Email:</strong> contacto@velcuri.io</p><p>Intentaremos responder a tu mensaje dentro de las próximas 48 horas hábiles.</p></div>' },
        { slug: 'politica-de-privacidad', title: 'Política de Privacidad — Velcuri', desc: 'Política de privacidad de Velcuri.io', content: '<h1>Política de Privacidad</h1><div class="content-block"><p>Última actualización: Febrero 2026</p><p>En Velcuri.io respetamos tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información.</p><p><strong>Información que recopilamos:</strong> Velcuri no requiere registro de usuario. Recopilamos información anónima de uso a través de Cloudflare Web Analytics, que no utiliza cookies ni rastrea usuarios individuales.</p><p><strong>Cookies:</strong> Nuestro sitio puede utilizar cookies técnicas necesarias para el funcionamiento del servicio. No utilizamos cookies de seguimiento ni de publicidad de terceros.</p><p><strong>Enlaces a terceros:</strong> Velcuri contiene enlaces a transmisiones alojadas en servidores de terceros. No somos responsables de las prácticas de privacidad de dichos sitios.</p><p><strong>Cambios:</strong> Nos reservamos el derecho de actualizar esta política en cualquier momento.</p></div>' },
        { slug: 'terminos-de-uso', title: 'Términos de Uso — Velcuri', desc: 'Términos y condiciones de uso de Velcuri.io', content: '<h1>Términos de Uso</h1><div class="content-block"><p>Al acceder y utilizar Velcuri.io, aceptas los siguientes términos y condiciones.</p><p><strong>Naturaleza del servicio:</strong> Velcuri es un directorio de enlaces a transmisiones en vivo de eventos deportivos. No alojamos, producimos ni controlamos el contenido audiovisual al que enlazamos.</p><p><strong>Uso permitido:</strong> Puedes utilizar Velcuri para acceder a las transmisiones enlazadas con fines de entretenimiento personal. Queda prohibida la reproducción, distribución o explotación comercial del contenido.</p><p><strong>Responsabilidad:</strong> Velcuri no se hace responsable del contenido, calidad o disponibilidad de las transmisiones de terceros. Los enlaces se proporcionan tal cual, sin garantía alguna.</p><p><strong>Modificaciones:</strong> Nos reservamos el derecho de modificar estos términos en cualquier momento.</p></div>' },
        { slug: 'aviso-legal', title: 'Aviso Legal — Velcuri', desc: 'Aviso legal y DMCA de Velcuri.io', content: '<h1>Aviso Legal (DMCA)</h1><div class="content-block"><p>Velcuri.io respeta los derechos de propiedad intelectual de terceros.</p><p><strong>No alojamiento:</strong> Velcuri no aloja, almacena ni transmite contenido audiovisual. Nuestro sitio funciona como un directorio de enlaces a transmisiones disponibles públicamente en internet.</p><p><strong>Solicitudes de eliminación:</strong> Si eres titular de derechos de autor y crees que algún enlace en nuestro sitio infringe tus derechos, puedes solicitar su eliminación enviando un correo a: dmca@velcuri.io</p><p>Tu solicitud debe incluir: identificación del contenido protegido, URL específica en Velcuri, tus datos de contacto y una declaración de buena fe.</p></div>' },
        { slug: 'preguntas-frecuentes', title: 'Preguntas Frecuentes — Velcuri', desc: 'Preguntas frecuentes sobre Velcuri.io', content: '<h1>Preguntas Frecuentes</h1><div class="content-block"><p>Encuentra respuestas a las preguntas más comunes sobre Velcuri.</p></div>' },
    ];

    for (const page of pages) {
        const schemas = [breadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: page.title.split('—')[0].trim() }])];
        const head = htmlHead({ title: page.title, description: page.desc, keywords: '', canonical: `/${page.slug}/`, schemas });
        const body = `<body>${navHTML()}<main class="container">${page.content}</main>${footerHTML()}`;
        writePage(page.slug, head + body);
    }

    // 404 page
    const head404 = htmlHead({ title: 'Página no encontrada — Velcuri', description: 'La página que buscas no existe.', keywords: '', canonical: '/404', schemas: [] });
    const body404 = `<body>${navHTML()}<main class="container"><div class="hero"><h1>404 — Página No Encontrada</h1><p>Lo sentimos, la página que buscas no existe o ha sido movida.</p><a href="/" class="btn btn--primary" style="margin-top:1rem">Ir a los partidos de hoy</a></div></main>${footerHTML()}`;
    writeFile('404.html', head404 + body404);

    // Search page
    const headSearch = htmlHead({ title: 'Buscar Partidos — Velcuri', description: 'Buscar partidos, ligas, equipos y canales en Velcuri.', keywords: 'buscar, partidos, fútbol', canonical: '/buscar/', schemas: [] });
    const bodySearch = `<body>${navHTML()}<main class="container">
<h1>Buscar Partidos</h1>
<div class="search-box"><input type="search" class="search-input" id="search-input" placeholder="Buscar equipo, liga o canal..." autofocus></div>
<div id="search-results" class="grid grid--3"></div>
<script defer>
(function(){var input=document.getElementById('search-input'),results=document.getElementById('search-results');
fetch('/search-index.json').then(function(r){return r.json()}).then(function(data){
input.addEventListener('input',function(){var q=input.value.toLowerCase().trim();
if(q.length<2){results.innerHTML='';return;}
var matches=data.filter(function(m){return m.t.toLowerCase().includes(q)||m.l.toLowerCase().includes(q)});
results.innerHTML=matches.slice(0,12).map(function(m){return '<a href="'+m.u+'" class="card hub-card" style="text-decoration:none"><span class="hub-card__title">'+m.t+'</span><span class="hub-card__count">'+m.l+'</span></a>'}).join('');
});}).catch(function(){});})();
</script></main>${footerHTML()}`;
    writePage('buscar', headSearch + bodySearch);

    console.log('[build] ✓ Static pages (about, contact, privacy, terms, legal, FAQ, 404, search)');
}

// --- Country Pages ---
const COUNTRIES = [
    { code: 'ar', name: 'Argentina', flag: '🇦🇷', hreflang: 'es-AR', leagues: ['superliga-argentina', 'champions-league', 'copa-libertadores'] },
    { code: 'mx', name: 'México', flag: '🇲🇽', hreflang: 'es-MX', leagues: ['liga-mx', 'champions-league'] },
    { code: 'es', name: 'España', flag: '🇪🇸', hreflang: 'es-ES', leagues: ['laliga', 'champions-league', 'copa-del-rey'] },
    { code: 'co', name: 'Colombia', flag: '🇨🇴', hreflang: 'es-CO', leagues: ['champions-league', 'copa-libertadores'] },
    { code: 'pe', name: 'Perú', flag: '🇵🇪', hreflang: 'es-PE', leagues: ['champions-league', 'copa-libertadores'] },
];

export function generateCountryPages(data) {
    const topMatches = getTopMatchesForBuild(data.events, 10);
    for (const country of COUNTRIES) {
        const matchCards = topMatches.map(matchCardHTML).join('\n');
        const title = `Fútbol en Vivo Gratis ${country.name} | Partidos de Hoy — Velcuri`;
        const desc = `Ver fútbol en vivo gratis desde ${country.name}. Todos los partidos de hoy en directo.`;
        const head = htmlHead({ title, description: desc, keywords: `fútbol en vivo ${country.name}, partidos gratis`, canonical: `/${country.code}/`, schemas: [websiteSchema()] });
        const body = `<body>${navHTML()}<main class="container">
<h1>${country.flag} Fútbol en Vivo — ${country.name}</h1>
<section class="section"><h2 class="section__title">Partidos Destacados</h2><div class="grid grid--3">${matchCards}</div></section>
</main>${footerHTML()}`;
        writePage(country.code, head + body);

        // Country sub-pages (hubs)
        for (const hub of ['partidos-de-hoy', 'futbol-en-vivo', 'rojadirecta', 'tarjeta-roja', 'pirlotv']) {
            const subHead = htmlHead({ title: `${hub.replace(/-/g, ' ')} ${country.name} — Velcuri`, description: `Ver ${hub.replace(/-/g, ' ')} desde ${country.name}.`, keywords: '', canonical: `/${country.code}/${hub}/`, schemas: [] });
            const subBody = `<body>${navHTML()}<main class="container">
<h1>${country.flag} ${hub.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${country.name}</h1>
<div class="grid grid--3">${matchCards}</div></main>${footerHTML()}`;
            writePage(`${country.code}/${hub}`, subHead + subBody);
        }

        // Country league sub-pages (e.g., /ar/liga/champions-league/)
        for (const leagueSlug of country.leagues) {
            const leagueName = leagueSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const leagueMatches = data.events.filter(m => m.leagueSlug === leagueSlug);
            const leagueCards = leagueMatches.length ? leagueMatches.map(matchCardHTML).join('\n') : matchCards;
            const leagueHead = htmlHead({ title: `${leagueName} EN VIVO ${country.name} — Velcuri`, description: `Ver ${leagueName} en vivo gratis desde ${country.name}.`, keywords: `${leagueName}, ${country.name}, en vivo`, canonical: `/${country.code}/liga/${leagueSlug}/`, schemas: [] });
            const leagueBody = `<body>${navHTML()}<main class="container">
<h1>${country.flag} ${leagueName} — ${country.name}</h1>
<div class="grid grid--3">${leagueCards}</div></main>${footerHTML()}`;
            writePage(`${country.code}/liga/${leagueSlug}`, leagueHead + leagueBody);
        }
    }
    console.log(`[build] ✓ ${COUNTRIES.length} country pages + sub-pages`);
}

export { COUNTRIES, HUB_PAGES };
