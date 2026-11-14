'use strict';
// printables/build-hubs.js — writes the 10 category hub pages (laberintos.html, …)
// and updates the counters on imprime-y-juega.html, all from the manifests in
// data/printables/*.json. Run after any gen-*.js:  node printables/build-hubs.js
// A category without a manifest yet is left untouched.

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const TEXT = {
  laberintos:   { h1_es: 'Laberintos para Imprimir', h1_en: 'Printable Mazes',
    d_es: 'laberintos en 3 niveles, de caminos sencillos para los más pequeños a desafíos para los mayores. Cada uno incluye su solución.',
    d_en: 'mazes in 3 levels, from simple paths for little ones to real challenges for older kids. Each one comes with its answer key.' },
  puntos:       { h1_es: 'Une los Puntos', h1_en: 'Connect the Dots',
    d_es: 'fichas para unir los puntos en orden y descubrir el dibujo escondido. Del 1 al 15 para empezar y hasta el 60 para expertos.',
    d_en: 'worksheets: join the dots in order to reveal a hidden picture. From 1–15 for beginners up to 60 for experts.' },
  colorear:     { h1_es: 'Dibujos para Colorear', h1_en: 'Coloring Pages',
    d_es: 'dibujos con contornos gruesos y zonas grandes, pensados para que los niños coloreen fácil: animales, vehículos, fantasía y más.',
    d_en: 'pictures with thick outlines and big areas, made easy for kids to color: animals, vehicles, fantasy and more.' },
  numeros:      { h1_es: 'Colorear por Números', h1_en: 'Color by Number',
    d_es: 'fichas para colorear siguiendo la clave: cada número va dentro de su zona. Incluye la imagen terminada para comparar.',
    d_en: 'worksheets to color by the key: every number sits inside its area. Includes the finished picture to compare.' },
  busca:        { h1_es: 'Busca y Encuentra', h1_en: 'Seek and Find',
    d_es: 'escenas para encontrar y contar objetos escondidos. Entrenan la atención y la observación. Con hoja de soluciones.',
    d_en: 'scenes to find and count hidden objects. Great for attention and observation. Answer key included.' },
  matematicas:  { h1_es: 'Fichas de Matemáticas', h1_en: 'Math Worksheets',
    d_es: 'fichas de conteo, patrones, sumas, restas, multiplicaciones y fracciones, por niveles. Las de operaciones incluyen hoja de respuestas.',
    d_en: 'worksheets for counting, patterns, addition, subtraction, multiplication and fractions, by level. Operations come with answer keys.' },
  escritura:    { h1_es: 'Fichas de Escritura', h1_en: 'Writing Worksheets',
    d_es: 'fichas de trazos, letras, palabras, frases, trazado de palabras en inglés y sopas de letras para practicar la escritura paso a paso.',
    d_en: 'worksheets for strokes, letters, words, sentences, word tracing and word searches to practice handwriting step by step.' },
  stem:         { h1_es: 'Fichas STEM', h1_en: 'STEM Worksheets',
    d_es: 'experimentos y retos de ciencia, tecnología, ingeniería y matemáticas para hacer en casa, con hoja de registro.',
    d_en: 'science, technology, engineering and math experiments and challenges to do at home, with a record sheet.' },
  certificados: { h1_es: 'Certificados para Niños', h1_en: 'Certificates for Kids',
    d_es: 'certificados para premiar logros, esfuerzo y buen comportamiento. Escribe el nombre y ¡a celebrar!',
    d_en: 'certificates to celebrate achievements, effort and good behavior. Write the name and celebrate!' },
  calendarios:  { h1_es: 'Calendarios Infantiles', h1_en: 'Kids Calendars',
    d_es: 'calendarios y planificadores para organizar rutinas, tareas y actividades de los niños.',
    d_en: 'calendars and planners to organize kids’ routines, chores and activities.' },
};

function hubPage(cat, m) {
  const c = L.CATS[cat], x = TEXT[cat];
  const n = m.total;
  const diffs = new Set(m.items.map(i => i.diff)), ages = new Set(m.items.map(i => i.age));
  const chips = (id, label_es, label_en, vals) => `
  <span class="filter-label" data-es="${label_es}" data-en="${label_en}">${label_es}</span>
  <div class="filter-chips" id="${id}">
    <button class="fchip active" data-val="" data-es="Todos" data-en="All">Todos</button>
    ${vals.map(v => `<button class="fchip" data-val="${v.val}" data-es="${v.es}" data-en="${v.en}">${v.es}</button>`).join('\n    ')}
  </div>`;
  const diffChips = ['facil', 'medio', 'dificil'].filter(d => diffs.has(d)).map(d => ({ val: d, es: L.DIFF[d].es, en: L.DIFF[d].en }));
  const ageChips = ['3-5', '6-8', '9-12'].filter(a => ages.has(a)).map(a => ({ val: a, es: a, en: a }));
  const filters = [diffChips.length > 1 && chips('diffChips', 'Dificultad', 'Difficulty', diffChips),
                   ageChips.length > 1 && chips('ageChips', 'Edad', 'Age', ageChips)].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${x.h1_es} Gratis — ChartKids | ${n} Fichas</title>
<meta name="description" content="${n} ${L.esc(x.d_es)} Gratis y sin registro.">
<link rel="canonical" href="${L.SITE}/${c.page}">
${(() => { const first = m.items.find(i => !i.href); const img = first ? `${L.SITE}/${c.dir}/${first.slug}/og.jpg` : ''; return `<meta property="og:type" content="website">
<meta property="og:url" content="${L.SITE}/${c.page}">
<meta property="og:title" content="${x.h1_es} — ${n} fichas gratis | ChartKids">
<meta property="og:description" content="${n} ${L.esc(x.d_es)}">
${img ? `<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1000">
<meta property="og:image:height" content="525">
` : ''}<meta name="twitter:card" content="summary_large_image">
`; })()}<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3864436143903858" crossorigin="anonymous"></script>
<link rel="stylesheet" href="/css/printables-category.css">
<style>:root{--cat:${c.color}}</style>
<script src="/ck-nav.js" defer></script>
<script src="/ck-explore.js" defer></script>
<script src="/js/printables-category.js" data-cat="${cat}" defer></script>
</head>
<body>
<div id="ck-nav"></div>
<div class="container">
<nav class="crumbs">
  <a href="/index.html" data-es="🏠 Inicio" data-en="🏠 Home">🏠 Inicio</a> ›
  <a href="/imprime-y-juega.html" data-es="Imprime y Juega" data-en="Print &amp; Play">Imprime y Juega</a> ›
  <span data-es="${c.es}" data-en="${c.en}">${c.es}</span>
</nav>
<div class="cat-hero">
  <div class="cat-hero-icon">${c.emoji}</div>
  <span class="cat-badge" data-es="${n} fichas" data-en="${n} worksheets">${n} fichas</span>
  <h1 data-es="${x.h1_es}" data-en="${x.h1_en}">${x.h1_es}</h1>
  <p class="cat-hero-desc" data-es="${n} ${L.esc(x.d_es)}" data-en="${n} ${L.esc(x.d_en)}">${n} ${L.esc(x.d_es)}</p>
</div>
${filters.length ? `<div class="filter-bar">${filters.join('\n  <div class="fdiv"></div>')}
</div>` : ''}
<p class="result-count" id="resultCount"></p>
<div class="items-grid" id="itemsGrid"><p class="no-results" data-es="Cargando fichas…" data-en="Loading worksheets…">Cargando fichas…</p></div>
<a href="/imprime-y-juega.html" class="back-link" data-es="← Todas las categorías" data-en="← All categories">← Todas las categorías</a>
</div>
<footer>
  <p>© ${new Date().getFullYear()} ChartKids · <a href="/imprime-y-juega.html" data-es="Imprime y Juega" data-en="Print &amp; Play">Imprime y Juega</a> · <a href="/blog.html">Blog</a> · <a href="/privacy.html" data-es="Privacidad" data-en="Privacy">Privacidad</a></p>
</footer>
</body>
</html>
`;
}

function updateHub(manifests) {
  const file = path.join(L.ROOT, 'imprime-y-juega.html');
  let html = fs.readFileSync(file, 'utf8');
  for (const [cat, m] of Object.entries(manifests)) {
    const page = L.CATS[cat].page;
    const re = new RegExp(`(href:'${page.replace('.', '\\.')}'[\\s\\S]*?count:)\\d+`);
    if (!re.test(html)) throw new Error(`hub entry for ${page} not found`);
    html = html.replace(re, `$1${m.total}`);
  }
  // Total = all counts listed on the hub (built or not yet built).
  const total = [...html.matchAll(/count:(\d+)/g)].reduce((s, x) => s + Number(x[1]), 0);
  const shown = Math.floor(total / 50) * 50;
  html = html.replace(/\d+\+ Fichas Gratis/, `${shown}+ Fichas Gratis`)
             .replace(/content="\d+\+ fichas educativas/, `content="${shown}+ fichas educativas`)
             .replace(/Más de \d+ fichas educativas/, `Más de ${shown} fichas educativas`)
             .replace(/<div class="stat-num">\d+\+<\/div>/, `<div class="stat-num">${shown}+</div>`);
  fs.writeFileSync(file, html);
  console.log(`✓ imprime-y-juega.html: ${total} fichas en total (se muestra "${shown}+")`);
}

// Older printable collections (their own generators and URLs) shown inside a hub.
// Each item keeps its URL; its inline SVG is saved as sheet.svg for the thumbnail.
const LEGACY = {
  escritura: [
    { dir: 'tracing', group_es: 'Trazado de palabras', group_en: 'Word tracing', diff: () => 'facil' },
    { dir: 'wordsearch', group_es: 'Sopa de letras', group_en: 'Word search' },
  ],
  matematicas: [
    { dir: 'counting', group_es: 'Conteo', group_en: 'Counting' },
    { dir: 'patterns', group_es: 'Patrones', group_en: 'Patterns' },
  ],
};
const LEVEL_OF = slug => /-hard-/.test(slug) ? 'dificil' : /-medium-/.test(slug) ? 'medio' : 'facil';
const AGE_OF = { facil: '3-5', medio: '6-8', dificil: '9-12' };

function legacyItems(cat) {
  const out = [];
  for (const src of LEGACY[cat] || []) {
    const base = path.join(L.ROOT, src.dir);
    for (const slug of fs.readdirSync(base).sort()) {
      const page = path.join(base, slug, 'index.html');
      if (!fs.existsSync(page)) continue;
      const html = fs.readFileSync(page, 'utf8');
      const h1 = html.match(/<h1[^>]*data-es="([^"]*)"[^>]*data-en="([^"]*)"/);
      const svg = html.match(/<svg[\s\S]*?<\/svg>/);
      if (!h1 || !svg) throw new Error(`${src.dir}/${slug}: no title or drawing found`);
      const one = svg[0].includes('xmlns=') ? svg[0] : svg[0].replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      const sheetFile = path.join(base, slug, 'sheet.svg');
      if (!fs.existsSync(sheetFile) || fs.readFileSync(sheetFile, 'utf8') !== one) fs.writeFileSync(sheetFile, one);
      const diff = src.diff ? src.diff(slug) : LEVEL_OF(slug);
      const unq = s => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      out.push({ slug, title_es: unq(h1[1]), title_en: unq(h1[2]), diff, age: AGE_OF[diff],
        href: `/${src.dir}/${slug}/`, group_es: src.group_es, group_en: src.group_en, answer: false });
    }
  }
  return out;
}

// For every built category, replace its sitemap entries (hub page + /<dir>/…) with
// exactly the items in its manifest, so removed or renamed sheets drop out.
function updateSitemap(manifests) {
  const file = path.join(L.ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(file, 'utf8');
  const before = (xml.match(/<url>/g) || []).length;
  for (const [cat, m] of Object.entries(manifests)) {
    const c = L.CATS[cat];
    const owned = new RegExp(`\\s*<url>\\s*<loc>https?://(www\\.)?chartkids\\.com/(${c.dir}/[^<]*|${c.page.replace('.', '\\.')})</loc>[\\s\\S]*?</url>`, 'g');
    xml = xml.replace(owned, '');
    const today = new Date().toISOString().slice(0, 10);
    const entries = [`  <url><loc>${L.SITE}/${c.page}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`]
      .concat(m.items.filter(i => !i.href).map(i => `  <url><loc>${L.SITE}/${c.dir}/${i.slug}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`));
    xml = xml.replace('</urlset>', entries.join('\n') + '\n</urlset>');
  }
  fs.writeFileSync(file, xml);
  console.log(`✓ sitemap.xml: ${before} → ${(xml.match(/<url>/g) || []).length} URLs`);
}

const manifests = {};
for (const cat of Object.keys(L.CATS)) {
  const f = path.join(L.ROOT, 'data', 'printables', `${cat}.json`);
  if (!fs.existsSync(f)) continue;
  const m = JSON.parse(fs.readFileSync(f, 'utf8'));
  // own sheets (from gen-*.js) + older collections shown in this hub; idempotent
  m.items = m.items.filter(i => !i.href).concat(legacyItems(cat));
  m.total = m.items.length;
  fs.writeFileSync(f, JSON.stringify(m));
  manifests[cat] = m;
  fs.writeFileSync(path.join(L.ROOT, L.CATS[cat].page), hubPage(cat, manifests[cat]));
  console.log(`✓ ${L.CATS[cat].page}: ${manifests[cat].total} fichas`);
}
updateHub(manifests);
updateSitemap(manifests);
