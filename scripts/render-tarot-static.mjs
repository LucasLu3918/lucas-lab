// Writes the tarot island's first markup to .vue-ssr/tarot-static.html. scripts/site/pages.cjs puts it into /tarot/, where
// the placeholder is replaced by the artwork base URL. Run after `vite build --config vite.tarot-ssr.config.mts`.
process.env.NODE_ENV = 'production';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = path.join(root, '.vue-ssr', 'tarot-ssr.mjs');
if (!fs.existsSync(bundle)) throw new Error('Tarot SSR bundle is missing; run vite build --config vite.tarot-ssr.config.mts first.');
const { renderTarotStatic } = await import(pathToFileURL(bundle).href);
const html = await renderTarotStatic('__ART_BASE__');
if (!html.includes('class="tarot-app"')) throw new Error('Tarot prerender did not produce the tarot app root.');
fs.writeFileSync(path.join(root, '.vue-ssr', 'tarot-static.html'), html);
console.log(`Tarot static markup: ${html.length} characters`);
