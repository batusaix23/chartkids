'use strict';
// printables/lib.js — shared building blocks for the "Imprime y Juega" generators.
//
// Every category generator (printables/gen-*.js) produces items shaped like:
//   { slug, title_es, title_en, diff: 'facil'|'medio'|'dificil', age: '3-5'|'6-8'|'9-12',
//     sheet: <svg string>, answer?: <svg string>, tip_es?, tip_en? }
// and calls writeCategory(), which writes:
//   <dir>/<slug>/index.html   — the item page (print, solution, prev/next, related)
//   <dir>/<slug>/sheet.svg    — the printable sheet (also used as thumbnail)
//   <dir>/<slug>/answer.svg   — the solution sheet, when there is one
//   data/printables/<cat>.json — the manifest read by js/printables-category.js
//
// Sheets use a US-Letter viewBox (816×1056 = 8.5×11in at 96dpi) so they print 1:1.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.chartkids.com';
const W = 816, H = 1056;

const DIFF = {
  facil:   { es: 'Fácil',   en: 'Easy',   level: 1 },
  medio:   { es: 'Medio',   en: 'Medium', level: 2 },
  dificil: { es: 'Difícil', en: 'Hard',   level: 3 },
  todos:   { es: 'Para todos', en: 'All ages', level: 0 },   // certificates, calendars: no level
};

// Category registry: folder, hub page and look. The hub page (e.g. laberintos.html)
// renders the manifest with js/printables-category.js.
const CATS = {
  laberintos:   { dir: 'maze',      page: 'laberintos.html',        color: '#7c3aed', emoji: '🌀', es: 'Laberintos',          en: 'Mazes' },
  puntos:       { dir: 'dots',      page: 'une-los-puntos.html',    color: '#0891b2', emoji: '🔗', es: 'Une los Puntos',      en: 'Connect the Dots' },
  colorear:     { dir: 'coloring',  page: 'colorear.html',          color: '#ec4899', emoji: '🎨', es: 'Colorear',            en: 'Coloring Pages' },
  numeros:      { dir: 'numbers',   page: 'colorear-numeros.html',  color: '#ea580c', emoji: '🔢', es: 'Colorear por Números', en: 'Color by Number' },
  busca:        { dir: 'busca',     page: 'busca-encuentra.html',   color: '#16a34a', emoji: '🔍', es: 'Busca y Encuentra',   en: 'Seek and Find' },
  matematicas:  { dir: 'mate',      page: 'matematicas.html',       color: '#ca8a04', emoji: '➕', es: 'Matemáticas',         en: 'Math' },
  escritura:    { dir: 'escritura', page: 'escritura.html',         color: '#6366f1', emoji: '✏️', es: 'Escritura',           en: 'Writing' },
  stem:         { dir: 'stem',      page: 'stem.html',              color: '#10b981', emoji: '🔬', es: 'STEM',                en: 'STEM' },
  certificados: { dir: 'certificados', page: 'certificados.html',   color: '#f59e0b', emoji: '🏆', es: 'Certificados',        en: 'Certificates' },
  calendarios:  { dir: 'calendarios',  page: 'calendarios.html',    color: '#8b5cf6', emoji: '📅', es: 'Calendarios',         en: 'Calendars' },
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Deterministic PRNG (mulberry32) so re-running a generator gives identical sheets.
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedOf(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}
function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FONT = "'Fredoka One','Nunito',Arial,sans-serif";
const BODY_FONT = "'Nunito',Arial,sans-serif";
const EMOJI_FONT = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";

// Standard sheet: header band (title, instruction, name/date line), body area
// from y=BODY_TOP to y=BODY_BOTTOM, footer. `body` is SVG markup placed as-is.
const BODY_TOP = 196, BODY_BOTTOM = 1000;
function sheet({ cat, title, instruction, diff, body, answer = false }) {
  const c = CATS[cat];
  const d = DIFF[diff];
  const tag = answer ? (typeof answer === 'string' ? answer : 'SOLUCIÓN')
    : `${c.es.toUpperCase()}${d && d.level ? ` · NIVEL ${d.level} DE 3 · ${d.es.toUpperCase()}` : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#fff"/>
<rect x="24" y="24" width="${W - 48}" height="112" rx="18" fill="${c.color}"/>
<text x="${W / 2}" y="56" text-anchor="middle" font-family="${BODY_FONT}" font-size="14" font-weight="800" fill="#fff" opacity=".9" letter-spacing="1.5">${esc(tag)}</text>
<text x="${W / 2}" y="94" text-anchor="middle" font-family="${FONT}" font-size="34" fill="#fff">${esc(title)}</text>
<text x="${W / 2}" y="122" text-anchor="middle" font-family="${BODY_FONT}" font-size="16" font-weight="700" fill="#fff" opacity=".95">${esc(instruction)}</text>
<text x="40" y="176" font-family="${BODY_FONT}" font-size="16" font-weight="700" fill="#334155">Nombre: ______________________________</text>
<text x="${W - 40}" y="176" text-anchor="end" font-family="${BODY_FONT}" font-size="16" font-weight="700" fill="#334155">Fecha: ______________</text>
${body}
<text x="${W / 2}" y="${H - 28}" text-anchor="middle" font-family="${BODY_FONT}" font-size="13" fill="#94a3b8">Imprimible gratis · chartkids.com</text>
</svg>`;
}

function itemUrl(cat, slug) { return `/${CATS[cat].dir}/${slug}/`; }

// The page for one printable. Light "paper" look inside the site's dark chrome.
function itemPage(cat, item, i, items) {
  const c = CATS[cat];
  const d = DIFF[item.diff];
  const prev = items[(i - 1 + items.length) % items.length];
  const next = items[(i + 1) % items.length];
  const rand = rng(seedOf(item.slug));
  const related = shuffle(items.filter(x => x.slug !== item.slug), rand).slice(0, 4);
  const url = SITE + itemUrl(cat, item.slug);
  const descEs = item.desc_es || `${item.title_es}: ficha imprimible gratis de ${c.es.toLowerCase()} para niños de ${item.age} años, nivel ${d.es.toLowerCase()}.`;
  const descEn = item.desc_en || `${item.title_en}: free printable ${c.en.toLowerCase()} worksheet for kids aged ${item.age}, ${d.en.toLowerCase()} level.`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(item.title_es)} — ${esc(c.es)} para imprimir gratis | ChartKids</title>
<meta name="description" content="${esc(descEs)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(item.title_es)} — ChartKids">
<meta property="og:description" content="${esc(descEs)}">
<meta property="og:image" content="${SITE}${itemUrl(cat, item.slug)}sheet.svg">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One${item.fonts ? '&family=' + item.fonts : ''}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/printable-item.css">
<style>:root{--cat:${c.color}}</style>
<script src="/ck-nav.js" defer></script>
<script src="/js/printable-item.js" defer></script>
</head>
<body>
<div id="ck-nav"></div>
<main class="pi-wrap">
  <nav class="pi-crumbs">
    <a href="/imprime-y-juega.html" data-es="Imprime y Juega" data-en="Print &amp; Play">Imprime y Juega</a> ›
    <a href="/${c.page}" data-es="${esc(c.es)}" data-en="${esc(c.en)}">${esc(c.es)}</a> ›
    <span data-es="${esc(item.title_es)}" data-en="${esc(item.title_en)}">${esc(item.title_es)}</span>
  </nav>
  <header class="pi-head">
    <h1 data-es="${esc(item.title_es)}" data-en="${esc(item.title_en)}">${esc(item.title_es)}</h1>
    <div class="pi-tags">
      <span class="pi-tag" data-es="${d.es}" data-en="${d.en}">${d.es}</span>
      <span class="pi-tag" data-es="${item.age} años" data-en="Ages ${item.age}">${item.age} años</span>
    </div>
    <p class="pi-desc" data-es="${esc(descEs)}" data-en="${esc(descEn)}">${esc(descEs)}</p>
  </header>
  <div class="pi-actions">
    <button class="pi-btn pi-print" onclick="piPrint()" data-es="🖨️ Imprimir" data-en="🖨️ Print">🖨️ Imprimir</button>
    ${item.answer ? `<button class="pi-btn pi-sol" id="piSolBtn" onclick="piToggleAnswer()" data-es="👀 Ver solución" data-en="👀 Show answer">👀 Ver solución</button>` : ''}
  </div>
  ${item.personalize ? `<label class="pi-name"><span data-es="✏️ Escribe el nombre:" data-en="✏️ Type the name:">✏️ Escribe el nombre:</span> <input id="piName" maxlength="32" autocomplete="off" placeholder="Sofía"></label>` : ''}
  <div class="pi-sheet" id="piSheet">${item.sheet}</div>
  ${item.answer ? `<div class="pi-sheet" id="piAnswer" hidden>${item.answer}</div>` : ''}
  ${item.tip_es ? `<p class="pi-tip" data-es="💡 ${esc(item.tip_es)}" data-en="💡 ${esc(item.tip_en || item.tip_es)}">💡 ${esc(item.tip_es)}</p>` : ''}
  <div class="pi-nav">
    <a class="pi-btn pi-ghost" href="${itemUrl(cat, prev.slug)}" data-es="← Anterior" data-en="← Previous">← Anterior</a>
    <a class="pi-btn pi-ghost" href="/${c.page}" data-es="Todas las fichas" data-en="All worksheets">Todas las fichas</a>
    <a class="pi-btn pi-ghost" href="${itemUrl(cat, next.slug)}" data-es="Siguiente →" data-en="Next →">Siguiente →</a>
  </div>
  <section class="pi-related">
    <h2 data-es="Más fichas de ${esc(c.es.toLowerCase())}" data-en="More ${esc(c.en.toLowerCase())}">Más fichas de ${esc(c.es.toLowerCase())}</h2>
    <div class="pi-rel-grid">${related.map(r => `
      <a class="pi-rel" href="${itemUrl(cat, r.slug)}"><img src="${itemUrl(cat, r.slug)}sheet.svg" alt="${esc(r.title_es)}" loading="lazy" width="816" height="1056"><span data-es="${esc(r.title_es)}" data-en="${esc(r.title_en)}">${esc(r.title_es)}</span></a>`).join('')}
    </div>
  </section>
</main>
</body>
</html>`;
}

// Write every item page + sheet files + the manifest. Removes item folders in the
// category dir that are no longer produced, so stale pages don't linger.
function writeCategory(cat, items, { keepDirs = [] } = {}) {
  const c = CATS[cat];
  const base = path.join(ROOT, c.dir);
  const slugs = new Set(items.map(i => i.slug));
  if (slugs.size !== items.length) throw new Error(`${cat}: duplicate slugs`);
  for (const it of items) {
    for (const k of ['slug', 'title_es', 'title_en', 'diff', 'age', 'sheet']) {
      if (!it[k]) throw new Error(`${cat}/${it.slug}: missing ${k}`);
    }
    if (!DIFF[it.diff]) throw new Error(`${cat}/${it.slug}: bad diff ${it.diff}`);
  }

  fs.mkdirSync(base, { recursive: true });
  let removed = 0;
  for (const e of fs.readdirSync(base, { withFileTypes: true })) {
    if (e.isDirectory() && !slugs.has(e.name) && !keepDirs.includes(e.name)) {
      fs.rmSync(path.join(base, e.name), { recursive: true, force: true });
      removed++;
    }
  }

  items.forEach((it, i) => {
    const dir = path.join(base, it.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), itemPage(cat, it, i, items));
    fs.writeFileSync(path.join(dir, 'sheet.svg'), it.sheet);
    const ans = path.join(dir, 'answer.svg');
    if (it.answer) fs.writeFileSync(ans, it.answer);
    else if (fs.existsSync(ans)) fs.rmSync(ans);
  });

  // The old per-category index pages are replaced by the hub page (c.page).
  const oldIndex = path.join(base, 'index.html');
  fs.writeFileSync(oldIndex, `<!DOCTYPE html><meta charset="utf-8"><title>${esc(c.es)} | ChartKids</title><link rel="canonical" href="${SITE}/${c.page}"><meta http-equiv="refresh" content="0;url=/${c.page}"><a href="/${c.page}">${esc(c.es)}</a>`);

  const manifest = {
    cat, dir: c.dir, total: items.length,
    items: items.map(it => ({ slug: it.slug, title_es: it.title_es, title_en: it.title_en, diff: it.diff, age: it.age, answer: !!it.answer })),
  };
  fs.mkdirSync(path.join(ROOT, 'data', 'printables'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data', 'printables', `${cat}.json`), JSON.stringify(manifest));
  console.log(`✓ ${cat}: ${items.length} fichas en /${c.dir}/ (${removed} carpetas viejas eliminadas)`);
  return manifest;
}

module.exports = {
  ROOT, SITE, W, H, BODY_TOP, BODY_BOTTOM, DIFF, CATS, FONT, BODY_FONT, EMOJI_FONT,
  esc, rng, seedOf, shuffle, sheet, itemUrl, writeCategory,
};
