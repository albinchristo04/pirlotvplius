// scripts/indexnow.js — Compare URLs and submit new/changed to IndexNow
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const LAST_FILE = resolve(ROOT, 'indexnow-last.json');
const SITE_URL = process.env.SITE_URL || 'https://www.velcuri.io';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

if (!INDEXNOW_KEY) {
    console.log('[indexnow] No INDEXNOW_KEY set, skipping.');
    process.exit(0);
}

// Collect all HTML pages from dist
function collectURLs(dir, base = '') {
    const urls = [];
    if (!existsSync(dir)) return urls;
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
            urls.push(...collectURLs(fullPath, `${base}/${entry}`));
        } else if (entry === 'index.html') {
            urls.push(`${SITE_URL}${base}/`);
        }
    }
    return urls;
}

// Load previous URL list
function loadPrevious() {
    if (!existsSync(LAST_FILE)) return new Set();
    try {
        return new Set(JSON.parse(readFileSync(LAST_FILE, 'utf-8')));
    } catch { return new Set(); }
}

// Submit to IndexNow
async function submitToIndexNow(urls) {
    if (urls.length === 0) {
        console.log('[indexnow] No new URLs to submit.');
        return;
    }

    // Batch in groups of 10000
    for (let i = 0; i < urls.length; i += 10000) {
        const batch = urls.slice(i, i + 10000);
        const body = {
            host: 'www.velcuri.io',
            key: INDEXNOW_KEY,
            keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
            urlList: batch
        };

        try {
            const res = await fetch('https://api.indexnow.org/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            console.log(`[indexnow] Submitted ${batch.length} URLs, status: ${res.status}`);
        } catch (err) {
            console.error(`[indexnow] Submit failed: ${err.message}`);
        }
    }
}

async function main() {
    const currentURLs = collectURLs(DIST);
    const previousURLs = loadPrevious();
    const newURLs = currentURLs.filter(u => !previousURLs.has(u));

    console.log(`[indexnow] Current: ${currentURLs.length}, Previous: ${previousURLs.size}, New: ${newURLs.length}`);

    await submitToIndexNow(newURLs);

    // Save current state
    writeFileSync(LAST_FILE, JSON.stringify(currentURLs, null, 2));
    console.log('[indexnow] State saved.');
}

main().catch(err => {
    console.error('[indexnow] Error:', err);
    process.exit(1);
});
