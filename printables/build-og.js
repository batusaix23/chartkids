'use strict';
// printables/build-og.js — renders the share image (og.jpg, 1000×525) of every
// printable with headless Edge, using printables/og.html as the layout.
// Needs the site served locally:  any static server on http://127.0.0.1:8090
// Run: node printables/build-og.js [--force]
// Incremental: an og.jpg newer than its sheet.svg is kept.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const sharp = require('sharp');
const L = require('./lib');

const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.env.SITE_URL || 'http://127.0.0.1:8090';
const FORCE = process.argv.includes('--force');
const CONCURRENCY = 4;

function shoot(url, out, profile) {
  return new Promise((resolve, reject) => {
    execFile(EDGE, ['--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profile}`,
      '--window-size=1000,525', '--virtual-time-budget=4000', `--screenshot=${out}`, url],
      { timeout: 60000 }, err => (err && !fs.existsSync(out) ? reject(err) : resolve()));
  });
}

async function main() {
  const jobs = [];
  for (const cat of Object.keys(L.CATS)) {
    const f = path.join(L.ROOT, 'data', 'printables', `${cat}.json`);
    if (!fs.existsSync(f)) continue;
    const c = L.CATS[cat];
    const m = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const it of m.items) {
      const rel = it.href || `/${c.dir}/${it.slug}/`;
      const dir = path.join(L.ROOT, rel);
      const svg = path.join(dir, 'sheet.svg'), og = path.join(dir, 'og.jpg');
      if (!fs.existsSync(svg)) continue;
      if (!FORCE && fs.existsSync(og) && fs.statSync(og).mtimeMs > fs.statSync(svg).mtimeMs) continue;
      const q = new URLSearchParams({ sheet: rel + 'sheet.svg', title: it.title_es, cat: it.group_es || c.es, color: c.color, emoji: c.emoji });
      jobs.push({ url: `${BASE}/printables/og.html?${q}`, og, name: rel });
    }
  }
  console.log(`og.jpg: ${jobs.length} por generar`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
  let done = 0; const failed = [];
  const queue = jobs.slice();
  await Promise.all(Array.from({ length: CONCURRENCY }, async (_, w) => {
    const profile = path.join(tmp, `profile-${w}`);
    while (queue.length) {
      const j = queue.shift();
      const png = path.join(tmp, `w${w}.png`);
      try {
        if (fs.existsSync(png)) fs.rmSync(png);
        await shoot(j.url, png, profile);
        await sharp(png).resize(1000, 525).jpeg({ quality: 78, mozjpeg: true }).toFile(j.og);
        if (++done % 50 === 0) console.log(`  … ${done}/${jobs.length}`);
      } catch (e) { failed.push(`${j.name}: ${e.message}`); }
    }
  }));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`✓ og.jpg: ${done} generadas${failed.length ? `, ${failed.length} fallaron:\n  ` + failed.join('\n  ') : ''}`);
  if (failed.length) process.exitCode = 1;
}

main();
