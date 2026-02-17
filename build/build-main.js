// build/build-main.js — Build orchestrator entry point
import { fetchAndNormalize } from '../src/data/fetch.js';
import { generateHomepage, generateMatchPages, DIST, SRC, ROOT, ensureDir, writeFile } from './generate.js';
import { generateHubPages, generateLeaguePages, generateChannelPages, generateTeamPages, generateCountryPages, generateStaticPages } from './generate-pages.js';
import { generateBlogPages } from './generate-blog.js';
import { generateSitemap, generateSearchIndex } from './generate-sitemap.js';
import { generateOGImages } from './generate-og.js';
import { generateIcons } from './generate-icons.js';
import { generateFeed } from './generate-feed.js';
import { generateH2H } from './generate-h2h.js';
import { generateGuides } from './generate-guides.js';
import { generatePreviews } from './generate-previews.js';
import { copyFileSync, existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

function copyDirRecursive(src, dest) {
    ensureDir(dest);
    if (!existsSync(src)) return;
    for (const entry of readdirSync(src)) {
        const srcPath = join(src, entry);
        const destPath = join(dest, entry);
        if (statSync(srcPath).isDirectory()) copyDirRecursive(srcPath, destPath);
        else copyFileSync(srcPath, destPath);
    }
}

function collectHTMLFiles(dir, files = []) {
    if (!existsSync(dir)) return files;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) collectHTMLFiles(full, files);
        else if (entry.endsWith('.html')) files.push(full);
    }
    return files;
}

async function main() {
    const start = Date.now();
    const useLocal = process.argv.includes('--local');
    console.log('[build] Starting Velcuri build...');
    console.log(`[build] Mode: ${useLocal ? 'LOCAL' : 'PRODUCTION'}`);

    // 1. Fetch + normalize data
    const data = await fetchAndNormalize(useLocal);

    // 2. Copy static assets
    ensureDir(DIST);
    copyDirRecursive(join(SRC, 'static'), DIST);
    ensureDir(join(DIST, 'styles'));
    ensureDir(join(DIST, 'scripts'));
    copyDirRecursive(join(SRC, 'styles'), join(DIST, 'styles'));
    copyDirRecursive(join(SRC, 'scripts'), join(DIST, 'scripts'));
    console.log('[build] ✓ Static assets copied');

    // 3. Generate all pages
    generateHomepage(data);
    generateMatchPages(data);
    generateHubPages(data);
    generateLeaguePages(data);
    generateChannelPages(data);
    generateTeamPages(data);
    generateCountryPages(data);
    generateStaticPages();
    generateBlogPages();
    generateH2H(data);
    generateGuides(data);
    generatePreviews(data);

    // 4. Generate sitemaps, search index + RSS feed
    generateSitemap(data);
    generateSearchIndex(data);
    generateFeed(data);

    // 5. Generate OG images + PWA icons
    await generateOGImages(data);
    await generateIcons();

    // 6. Write IndexNow key file
    const indexNowKey = process.env.INDEXNOW_KEY || '';
    if (indexNowKey) {
        writeFile(`${indexNowKey}.txt`, indexNowKey);
        console.log('[build] ✓ IndexNow key file');
    }

    // 7. Write Bing Webmaster Tools verification
    writeFile('BingSiteAuth.xml', '<?xml version="1.0"?>\n<users>\n\t<user>F01125A32DD0550253E1CD24EAA0B21D</user>\n</users>');
    console.log('[build] ✓ BingSiteAuth.xml');

    // 8. Validate JSON-LD schemas on ALL generated pages
    const allPages = collectHTMLFiles(DIST);
    let schemaErrors = 0;
    let schemaCount = 0;
    for (const filePath of allPages) {
        const relPath = filePath.replace(DIST, '').replace(/\\/g, '/');
        const html = readFileSync(filePath, 'utf-8');
        const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
        if (!blocks) continue;
        for (const block of blocks) {
            const json = block.replace(/<\/?script[^>]*>/g, '');
            try {
                const parsed = JSON.parse(json);
                const types = Array.isArray(parsed) ? parsed.map(p => p['@type']) : [parsed['@type']];
                schemaCount++;
                // Required field checks
                if (!Array.isArray(parsed)) {
                    if (parsed['@type'] === 'SportsEvent' && !parsed.startDate) {
                        console.error(`[schema] ❌ Missing startDate in SportsEvent: ${relPath}`);
                        schemaErrors++;
                    }
                    if (parsed['@type'] === 'FAQPage' && !parsed.mainEntity?.length) {
                        console.error(`[schema] ❌ Empty FAQPage: ${relPath}`);
                        schemaErrors++;
                    }
                    if (parsed['@type'] === 'BreadcrumbList' && !parsed.itemListElement?.length) {
                        console.error(`[schema] ❌ Empty BreadcrumbList: ${relPath}`);
                        schemaErrors++;
                    }
                }
            } catch (err) {
                console.error(`[schema] ❌ Invalid JSON-LD in ${relPath}: ${err.message}`);
                schemaErrors++;
            }
        }
    }
    if (schemaErrors > 0) {
        console.error(`[build] ❌ ${schemaErrors} schema validation errors!`);
        process.exit(1);
    }
    console.log(`[build] ✓ Schema validation passed (${schemaCount} schemas across ${allPages.length} pages)`);

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`\n[build] ✅ Build complete in ${elapsed}s`);
}

main().catch(err => {
    console.error('[build] ❌ Build failed:', err);
    process.exit(1);
});
