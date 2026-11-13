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
  if (!todo.length) return new Map(jobs.map(j => [j.key, cachePath(j.key)]));
  console.log(`FLUX: ${todo.length} imágenes nuevas (${jobs.length - todo.length} en caché)`);

  // Free-plan policy: batch jobs share the site's daily neuron budget. Reserve this
  // run's cost in the production counter first, so the site stops earlier instead of
  // the account going over the free allocation.
  // Generates as many as fit today (they stay cached) and then stops with a clear
  // message; the next run after 00:00 UTC continues where this one left off.
  const allowed = reserveBudget(todo.length);
  const queue = todo.slice(0, allowed);
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
  if (allowed < todo.length) {
    const e = new Error(`Presupuesto diario de IA para lotes: hoy se generaron ${allowed} de ${todo.length} imágenes. ` +
      `Vuelve a ejecutar después de las 00:00 UTC para continuar (lo generado queda en caché).`);
    e.budget = true;
    throw e;
  }
  return new Map(jobs.map(j => [j.key, cachePath(j.key)]));
}

// ── shared daily budget (same KV keys as guardAI in worker.js) ──
const { execFileSync } = require('child_process');
const IMAGE_COST = 120;            // neurons charged per FLUX image (estimate, on the high side)
const SITE_BUDGET = 9000;          // AI_DAILY_NEURON_BUDGET in worker.js
const BATCH_SHARE = 4000;          // at most this much per day for batch jobs; the rest is for the site

function kv(args) {
  return execFileSync(process.execPath, [require.resolve('wrangler/bin/wrangler.js'), 'kv', 'key', ...args, '--binding', 'DATA', '--remote'],
    { cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function kvNumber(key) {
  try { return Number(kv(['get', key])) || 0; } catch { return 0; }   // missing key → 0
}

// Reserves budget for up to `wanted` images; returns how many fit today.
function reserveBudget(wanted) {
  if (process.env.FLUX_SKIP_BUDGET === '1') return wanted;          // only for a paid-usage decision
  const day = new Date().toISOString().slice(0, 10);
  const siteKey = `ai:neurons:${day}`, batchKey = `ai:batch:${day}`;
  const spent = kvNumber(siteKey), batchSpent = kvNumber(batchKey);
  const fit = Math.max(0, Math.min(
    Math.floor((BATCH_SHARE - batchSpent) / IMAGE_COST),
    Math.floor((SITE_BUDGET - spent) / IMAGE_COST)));
  const n = Math.min(fit, wanted);
  console.log(`Presupuesto IA hoy: sitio ${spent}/${SITE_BUDGET}, lotes ${batchSpent}/${BATCH_SHARE} → caben ${fit} imágenes`);
  if (n > 0) {
    const ttl = String(2 * 86400);
    kv(['put', siteKey, String(spent + n * IMAGE_COST), '--ttl', ttl]);
    kv(['put', batchKey, String(batchSpent + n * IMAGE_COST), '--ttl', ttl]);
  }
  return n;
}

module.exports = { ensureImages, cachePath, CACHE };
