'use strict';
// generate-tracing.js — Word tracing worksheets (12 categories × 6 words = 72 pages)
const fs   = require('fs');
const path = require('path');

const CAT_COLORS = {
  animals:'#16a34a',dinosaurs:'#dc2626',vehicles:'#2563eb',space:'#7c3aed',
  superheroes:'#e11d48',fantasy:'#db2777',jobs:'#0891b2',sports:'#0284c7',
  food:'#ea580c',nature:'#65a30d',holidays:'#9333ea',pets:'#c2410c',
};
const CAT_ES = {
  animals:'Animales',dinosaurs:'Dinosaurios',vehicles:'Vehículos',space:'Espacio',
  superheroes:'Superhéroes',fantasy:'Fantasía',jobs:'Trabajos',sports:'Deportes',
  food:'Comida',nature:'Naturaleza',holidays:'Días Festivos',pets:'Mascotas',
};

// 6 words + 1 emoji hex per category
const WORDS = {
  animals:    [{w:'LION',   e:'🦁'},{w:'BEAR',  e:'🐻'},{w:'FISH',  e:'🐟'},{w:'BIRD',  e:'🐦'},{w:'FROG',  e:'🐸'},{w:'WOLF',  e:'🐺'}],
  dinosaurs:  [{w:'DINO',   e:'🦕'},{w:'TREX',  e:'🦖'},{w:'CLAW',  e:'🦷'},{w:'EGGS',  e:'🥚'},{w:'BONE',  e:'🦴'},{w:'ROAR',  e:'😤'}],
  vehicles:   [{w:'CAR',    e:'🚗'},{w:'BUS',   e:'🚌'},{w:'BOAT',  e:'⛵'},{w:'BIKE',  e:'🚲'},{w:'JEEP',  e:'🚙'},{w:'TRAM',  e:'🚋'}],
  space:      [{w:'MOON',   e:'🌙'},{w:'STAR',  e:'⭐'},{w:'SUN',   e:'☀️'},{w:'MARS',  e:'🪐'},{w:'NOVA',  e:'💫'},{w:'COMET', e:'☄️'}],
  superheroes:[{w:'HERO',   e:'🦸'},{w:'CAPE',  e:'🧥'},{w:'MASK',  e:'🎭'},{w:'FIST',  e:'✊'},{w:'BOLT',  e:'⚡'},{w:'SAVE',  e:'🛡️'}],
  fantasy:    [{w:'MAGIC',  e:'✨'},{w:'WAND',  e:'🪄'},{w:'DRAGON',e:'🐲'},{w:'FAIRY',  e:'🧚'},{w:'CROWN', e:'👑'},{w:'SPELL', e:'🔮'}],
  jobs:       [{w:'CHEF',   e:'👨‍🍳'},{w:'NURSE', e:'👩‍⚕️'},{w:'PILOT', e:'👨‍✈️'},{w:'GUARD', e:'💂'},{w:'BAKER', e:'🥐'},{w:'COACH', e:'📋'}],
  sports:     [{w:'GOAL',   e:'⚽'},{w:'SWIM',  e:'🏊'},{w:'JUMP',  e:'🏃'},{w:'KICK',  e:'🦵'},{w:'RACE',  e:'🏁'},{w:'PLAY',  e:'🏅'}],
  food:       [{w:'CAKE',   e:'🎂'},{w:'MILK',  e:'🥛'},{w:'RICE',  e:'🍚'},{w:'CORN',  e:'🌽'},{w:'SOUP',  e:'🍲'},{w:'TACO',  e:'🌮'}],
  nature:     [{w:'RAIN',   e:'🌧️'},{w:'LEAF',  e:'🍃'},{w:'ROSE',  e:'🌹'},{w:'TREE',  e:'🌲'},{w:'LAKE',  e:'🏞️'},{w:'WIND',  e:'💨'}],
  holidays:   [{w:'GIFT',   e:'🎁'},{w:'SNOW',  e:'❄️'},{w:'BELL',  e:'🔔'},{w:'STAR',  e:'⭐'},{w:'JACK',  e:'🎃'},{w:'EGGS',  e:'🥚'}],
  pets:       [{w:'DOG',    e:'🐶'},{w:'CAT',   e:'🐱'},{w:'BUNNY', e:'🐰'},{w:'FISH',  e:'🐠'},{w:'BIRD',  e:'🐦'},{w:'FROG',  e:'🐸'}],
};

function buildTracingSVG(word, emoji, catColor) {
  const W=500, H=650;
  // Baselines for each practice row. Font-size 56 → cap height ≈ 56×0.72 = 40px.
  // Cap guide: y-42  |  Baseline guide: y  |  Descender guide: y+16
  const LINE_Y = [245, 348, 451, 554];
  const FS = 56;
  const CAP  = 42; // pixels above baseline where cap-height guide sits
  const DESC = 16; // pixels below baseline for descender guide

  let guides='';
  LINE_Y.forEach(y=>{
    guides+=`<line x1="36" y1="${y-CAP}"  x2="464" y2="${y-CAP}"  stroke="#d1d5db" stroke-width="1"   stroke-dasharray="4 4"/>`;
    guides+=`<line x1="36" y1="${y}"      x2="464" y2="${y}"      stroke="#b0b8c8" stroke-width="1.5"/>`;
    guides+=`<line x1="36" y1="${y+DESC}" x2="464" y2="${y+DESC}" stroke="#d1d5db" stroke-width="1"   stroke-dasharray="4 4"/>`;
  });

  // Row 1 — light fill shows full letter shape; dashed stroke marks the tracing path
  const r1y = LINE_Y[0];
  const traceDashed=`
  <text x="250" y="${r1y}" text-anchor="middle" font-family="'Fredoka One',Arial,sans-serif" font-size="${FS}" font-weight="900"
    fill="#dbeafe">${word}</text>
  <text x="250" y="${r1y}" text-anchor="middle" font-family="'Fredoka One',Arial,sans-serif" font-size="${FS}" font-weight="900"
    fill="none" stroke="#818cf8" stroke-width="2" stroke-dasharray="5 4">${word}</text>`;

  // Row 2 — very faint hint so child relies on memory
  const r2y = LINE_Y[1];
  const traceLight=`
  <text x="250" y="${r2y}" text-anchor="middle" font-family="'Fredoka One',Arial,sans-serif" font-size="${FS}" font-weight="900"
    fill="#f1f5f9">${word}</text>
  <text x="250" y="${r2y}" text-anchor="middle" font-family="'Fredoka One',Arial,sans-serif" font-size="${FS}" font-weight="900"
    fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 5">${word}</text>`;

  // Rows 3 & 4 are blank (guide lines only — already drawn above)

  const arrows=`
    <text x="20" y="${r1y-CAP/2}" font-size="16" text-anchor="middle" font-family="sans-serif" fill="${catColor}">✏️</text>
    <text x="20" y="${r2y-CAP/2}" font-size="16" text-anchor="middle" font-family="sans-serif" fill="${catColor}" opacity=".45">✏️</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<defs><style>text{font-family:'Fredoka One',Nunito,Arial,sans-serif}</style></defs>
<rect width="${W}" height="${H}" fill="#fafafa"/>
<rect width="${W}" height="${H}" fill="white" opacity=".8"/>
<rect width="${W}" height="90" fill="${catColor}"/>
<text x="250" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="800" opacity=".85">TRAZADO DE PALABRAS · WRITING PRACTICE</text>
<text x="250" y="58" text-anchor="middle" font-size="36" fill="white" font-weight="900">${emoji} ${word}</text>
<text x="250" y="78" text-anchor="middle" font-size="10" fill="white" opacity=".85">Traza las letras · chartkids.com</text>

<!-- Reference word (colored outline, sits between header and row 1) -->
<text x="250" y="148" text-anchor="middle" font-size="58" font-weight="900"
  fill="${catColor}" opacity=".18" font-family="'Fredoka One',sans-serif">${word}</text>
<text x="250" y="148" text-anchor="middle" font-size="58" font-weight="900"
  fill="none" stroke="${catColor}" stroke-width="1.5" font-family="'Fredoka One',sans-serif">${word}</text>
<text x="250" y="163" text-anchor="middle" font-size="8" fill="#9ca3af">MODELO</text>

<!-- Guide lines (cap / baseline / descender for each row) -->
${guides}

<!-- Tracing text — sits exactly on each baseline -->
${traceDashed}
${traceLight}

<!-- Pencil cues -->
${arrows}

<!-- Row labels — just above each cap-height guide -->
<text x="40" y="${LINE_Y[0]-CAP-6}" font-size="9" fill="#9ca3af" font-weight="700" letter-spacing="1">1 · TRAZA</text>
<text x="40" y="${LINE_Y[1]-CAP-6}" font-size="9" fill="#9ca3af" font-weight="700" letter-spacing="1">2 · TRAZA</text>
<text x="40" y="${LINE_Y[2]-CAP-6}" font-size="9" fill="#9ca3af" font-weight="700" letter-spacing="1">3 · ESCRIBE SOLO/A</text>
<text x="40" y="${LINE_Y[3]-CAP-6}" font-size="9" fill="#9ca3af" font-weight="700" letter-spacing="1">4 · ESCRIBE SOLO/A</text>

<text x="250" y="642" text-anchor="middle" font-size="8" fill="#94a3b8">Imprimible gratuito · chartkids.com/tracing/</text>
</svg>`;
}

function buildHTML(word, emoji, catColor, catEs, slug) {
  const svg = buildTracingSVG(word, emoji, catColor);
  const minSvg = svg.replace(/\n/g,' ').replace(/\s{2,}/g,' ');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trazar "${word}" — Ficha de Escritura | ChartKids</title>
<meta name="description" content="Practica escribir la palabra ${word} con guías de trazado. Imprimible gratis para niños.">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>@media print{header,.page-actions,.page-sidebar,footer{display:none!important}}</style>
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav">
    <a href="/tracing/" class="active">Trazado</a>
    <a href="/maze/">Laberintos</a>
    <a href="/wordsearch/">Sopa de Letras</a>
  </nav>
</div></header>
<main class="container page-layout">
  <div class="page-main">
    <h1>${emoji} Trazar: ${word}</h1>
    <div style="margin-bottom:12px">
      <span class="pill" style="background:${catColor}20;color:${catColor}">${catEs}</span>
      <span class="pill">Escritura</span>
    </div>
    <div class="print-area" style="max-width:540px;margin:0 auto">${minSvg}</div>
    <div class="page-actions">
      <button onclick="window.print()" class="btn-print">🖨️ Imprimir</button>
      <a href="/tracing/" class="btn-secondary">Ver más fichas</a>
    </div>
  </div>
  <aside class="page-sidebar">
    <div class="sidebar-promo">
      <a href="/tracing/" class="promo-link">✏️ Todas las Fichas de Trazado</a>
      <a href="/wordsearch/" class="promo-link">🔤 Sopa de Letras</a>
      <a href="/counting/" class="promo-link">🔢 Contar</a>
      <a href="/patterns/" class="promo-link">🔷 Patrones</a>
      <a href="/maze/" class="promo-link">🌀 Laberintos</a>
    </div>
  </aside>
</main>
<footer class="site-footer"><div class="container footer-inner">
  <p>© 2025 ChartKids</p>
</div></footer>
</body>
</html>`;
}

// Build all 72 tracing pages
const pages = [];
let id = 1;
for (const [cat, words] of Object.entries(WORDS)) {
  for (const {w, e} of words) {
    pages.push({id:id++, category:cat, word:w, emoji:e,
      slug:`trace-${w.toLowerCase()}-${cat}-tracing`});
  }
}

const FORCE = process.argv.includes('--force');
let built=0, skipped=0;
const sitemapLines=[];

for (const p of pages) {
  const dir = path.join('tracing', p.slug);
  const htmlPath = path.join(dir, 'index.html');
  if (fs.existsSync(htmlPath) && !FORCE) { skipped++; continue; }
  const color = CAT_COLORS[p.category]||'#7c3aed';
  const catEs = CAT_ES[p.category]||p.category;
  const html = buildHTML(p.word, p.emoji, color, catEs, p.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(htmlPath, html);
  console.log(`  build [${p.id}] ${p.word} (${p.category})`);
  built++;
  sitemapLines.push(`  <url><loc>https://chartkids.com/tracing/${p.slug}/</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
}

// Build tracing index
const catSections = Object.entries(WORDS).map(([cat,words])=>{
  const color=CAT_COLORS[cat];
  const catEs=CAT_ES[cat];
  const cards=words.map(({w,e})=>{
    const slug=`trace-${w.toLowerCase()}-${cat}-tracing`;
    return `<a href="/tracing/${slug}/" class="card">
      <div style="font-size:2rem;text-align:center;padding:6px">${e}</div>
      <div class="card-title">${w}</div>
    </a>`;
  }).join('');
  return `<section class="category-section">
    <h2 class="cat-heading" style="color:${color}">${catEs}</h2>
    <div class="cards-grid">${cards}</div>
  </section>`;
}).join('');

const indexHtml=`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fichas de Trazado para Niños | ChartKids</title>
<meta name="description" content="72 fichas de trazado de palabras. Practica escritura con guías dashed. Imprimibles gratis.">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav"><a href="/tracing/" class="active">Trazado</a><a href="/maze/">Laberintos</a><a href="/blog/">Blog</a></nav>
</div></header>
<section style="background:#0891b2;color:white;padding:24px;text-align:center">
  <h1 style="font-size:2rem;margin-bottom:6px">✏️ Fichas de Trazado</h1>
  <p>72 fichas para practicar escritura en inglés. Traza las letras y escribe solo.</p>
</section>
<div class="container" style="padding:20px 16px">${catSections}</div>
<footer class="site-footer"><div class="container footer-inner"><p>© 2025 ChartKids</p></div></footer>
</body>
</html>`;
fs.mkdirSync('tracing',{recursive:true});
fs.writeFileSync(path.join('tracing','index.html'), indexHtml);

// Update sitemap (skip when --force, entries already exist)
if (sitemapLines.length>0 && !FORCE) {
  const sm=fs.readFileSync('sitemap.xml','utf8');
  const updated=sm.replace('</urlset>',
    '  <url><loc>https://chartkids.com/tracing/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
    +sitemapLines.join('\n')+'\n</urlset>');
  fs.writeFileSync('sitemap.xml',updated);
  console.log(`✓ sitemap +${sitemapLines.length+1} URLs`);
}
console.log(`\n✓ Built: ${built}  Skipped: ${skipped}`);
