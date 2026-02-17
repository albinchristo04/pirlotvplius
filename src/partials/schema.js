// src/partials/schema.js — JSON-LD Schema generator for all page types

export function websiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Velcuri',
        'url': 'https://www.velcuri.io',
        'description': 'Ver fútbol en vivo gratis. Alternativa a Tarjeta Roja, Rojadirecta y Pirlotv.',
        'potentialAction': {
            '@type': 'SearchAction',
            'target': 'https://www.velcuri.io/buscar/?q={search_term_string}',
            'query-input': 'required name=search_term_string'
        }
    };
}

export function breadcrumbSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': items.map((item, i) => ({
            '@type': 'ListItem',
            'position': i + 1,
            'name': item.name,
            'item': item.url ? `https://www.velcuri.io${item.url}` : undefined
        }))
    };
}

export function sportsEventSchema(match) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        'name': `${match.homeTeam} vs ${match.awayTeam}`,
        'startDate': match.startDate,
        'endDate': match.endDate,
        'sport': 'https://en.wikipedia.org/wiki/Association_football',
        'description': `Ver ${match.homeTeam} vs ${match.awayTeam} en vivo gratis. ${match.league}.`,
        'url': `https://www.velcuri.io/${match.slug}/`,
        'location': {
            '@type': 'Place',
            'name': 'Transmisión en línea'
        },
        'organizer': {
            '@type': 'Organization',
            'name': match.league
        },
        'competitor': [
            { '@type': 'SportsTeam', 'name': match.homeTeam },
            { '@type': 'SportsTeam', 'name': match.awayTeam }
        ],
        'image': `https://www.velcuri.io/og/${match.slug}.png`
    };
}

export function broadcastEventSchema(match) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BroadcastEvent',
        'name': `En Vivo: ${match.homeTeam} vs ${match.awayTeam}`,
        'isLiveBroadcast': true,
        'startDate': match.startDate,
        'broadcastOfEvent': {
            '@type': 'SportsEvent',
            'name': `${match.homeTeam} vs ${match.awayTeam}`
        },
        'publishedOn': {
            '@type': 'BroadcastService',
            'name': 'Velcuri'
        },
        'broadcastChannel': match.embeds.map(ch => ({
            '@type': 'BroadcastChannel',
            'name': ch.name,
        }))
    };
}

export function faqSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': items.map(item => ({
            '@type': 'Question',
            'name': item.q,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': item.a
            }
        }))
    };
}

export function itemListSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListElement': items.map((item, i) => ({
            '@type': 'ListItem',
            'position': i + 1,
            'name': item.name,
            'url': item.url ? `https://www.velcuri.io${item.url}` : undefined
        }))
    };
}

export function articleSchema(post) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.title,
        'description': post.description,
        'author': {
            '@type': 'Organization',
            'name': 'Equipo Velcuri'
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'Velcuri',
            'url': 'https://www.velcuri.io'
        },
        'datePublished': post.date,
        'dateModified': post.date,
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `https://www.velcuri.io/blog/${post.slug}/`
        }
    };
}

// Render schema array as script tag HTML
export function renderSchemas(schemas) {
    return schemas.map(s =>
        `<script type="application/ld+json">${JSON.stringify(s)}</script>`
    ).join('\n');
}
