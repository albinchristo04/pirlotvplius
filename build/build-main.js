// build/build-main.js — Build orchestrator entry point
import { fetchAndNormalize } from '../src/data/fetch.js';
import { generateHomepage, generateMatchPages, DIST, SRC, ROOT, ensureDir, writeFile } from './generate.js';
import { generateHubPages, generateLeaguePages, generateChannelPages, generateTeamPages, generateCountryPages, generateStaticPages } from './generate-pages.js';
import { generateBlogPages } from './generate-blog.js';
import { generateSitemap, generateSearchIndex } from './generate-sitemap.js';
import { generateOGImages } from './generate-og.js';
import { generateIcons } from './generate-icons.js';
import { copyFileSync, existsSync, readdirSync, statSync } from 'fs';
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

    // 4. Generate sitemap and search index
    generateSitemap(data);
    generateSearchIndex(data);

    // 5. Generate OG images + PWA icons
    await generateOGImages(data);
    await generateIcons();

    // 6. Write IndexNow key file
    const indexNowKey = process.env.INDEXNOW_KEY || '';
    if (indexNowKey) {
        writeFile(`${indexNowKey}.txt`, indexNowKey);
        console.log('[build] ✓ IndexNow key file');
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`\n[build] ✅ Build complete in ${elapsed}s`);
}

main().catch(err => {
    console.error('[build] ❌ Build failed:', err);
    process.exit(1);
});
