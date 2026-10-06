/**
 * Verifies YouTube oEmbed for every youtubeVideoId in exercise-media.ts.
 * Run: node scripts/check-exercise-videos.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/content/exercise-media.ts'), 'utf8');
const re = /^\s+(\w+):\s*\{[\s\S]*?youtubeVideoId:\s*'([^']+)'/gm;
const entries = [...src.matchAll(re)];

let failed = 0;
for (const [, exerciseId, videoId] of entries) {
  const url =
    'https://www.youtube.com/oembed?url=' +
    encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`) +
    '&format=json';
  const res = await fetch(url);
  if (res.ok) {
    const { title } = await res.json();
    console.log(`OK  ${exerciseId.padEnd(18)} ${videoId}  ${title?.slice(0, 55) ?? ''}`);
  } else {
    console.log(`BAD ${exerciseId.padEnd(18)} ${videoId}  HTTP ${res.status}`);
    failed += 1;
  }
}

if (failed) {
  console.error(`\n${failed} broken video ID(s).`);
  process.exit(1);
}
console.log(`\nAll ${entries.length} embed IDs OK.`);
