'use strict';
// printables/flux-batch.js — generate (and cache) FLUX images for printables.
// Needs the helper running:  npx wrangler dev printables/flux-worker.js --port 8788
// Images are cached in printables/cache/flux/<key>.jpg (git-ignored) and never
// regenerated unless the file is deleted, so re-running a generator costs nothing.

const fs = require('fs');
const path = require('path');

const CACHE = path.join(__dirname, 'cache', 'flux');
const ENDPOINT = process.env.FLUX_URL || 'http://127.0.0.1:8788/';

function cachePath(key) { return path.join(CACHE, key.replace(/[^a-z0-9_-]/gi, '_') + '.jpg'); }

async function generateOne(job, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: job.prompt, steps: job.steps || 8 }),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) throw new Error('image too small');
      return buf;
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise(r => setTimeout(r, 1500 * i));
    }
  }
}

// jobs: [{key, prompt, steps?}] → Map(key → file path). Missing ones are generated.
async function ensureImages(jobs, { concurrency = 3 } = {}) {
  fs.mkdirSync(CACHE, { recursive: true });
  const todo = jobs.filter(j => !fs.existsSync(cachePath(j.key)));
  let done = 0, failed = [];
  if (todo.length) console.log(`FLUX: ${todo.length} imágenes nuevas (${jobs.length - todo.length} en caché)`);
  const queue = todo.slice();
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        fs.writeFileSync(cachePath(job.key), await generateOne(job));
        done++;
        if (done % 10 === 0) console.log(`  … ${done}/${todo.length}`);
      } catch (err) {
        failed.push(`${job.key}: ${err.message}`);
      }
    }
  }));
  if (failed.length) throw new Error(`FLUX falló en ${failed.length}:\n` + failed.join('\n'));
  return new Map(jobs.map(j => [j.key, cachePath(j.key)]));
}

module.exports = { ensureImages, cachePath, CACHE };
