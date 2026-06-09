'use strict';
const fs = require('fs');
const path = require('path');

const mazes = require('./master-mazes-72.json');
const dots  = require('./master-dots-72.json');
const nums  = require('./master-numbers-72.json');

const CATS = ['animals','dinosaurs','vehicles','space','superheroes','fantasy','jobs','sports','food','nature','holidays','pets'];
const CAT_ES = {
  animals:'Animales', dinosaurs:'Dinosaurios', vehicles:'Vehículos', space:'Espacio',
  superheroes:'Superhéroes', fantasy:'Fantasía', jobs:'Trabajos', sports:'Deportes',
  food:'Comida', nature:'Naturaleza', holidays:'Días Festivos', pets:'Mascotas'
};
const CAT_COLORS = {
  animals:'#4CAF50', dinosaurs:'#8BC34A', vehicles:'#2196F3', space:'#673AB7',
  superheroes:'#F44336', fantasy:'#E91E63', jobs:'#FF9800', sports:'#00BCD4',
  food:'#FF5722', nature:'#009688', holidays:'#9C27B0', pets:'#795548'
};
const CAT_EMOJI = {
  animals:'🦁', dinosaurs:'🦕', vehicles:'🚗', space:'🚀', superheroes:'🦸',
  fantasy:'🦄', jobs:'👷', sports:'⚽', food:'🍕', nature:'🌈', holidays:'🎄', pets:'🐶'
};
const DIFF_ES = {easy:'Fácil', medium:'Medio', hard:'Difícil'};
const DIFF_COLOR = {easy:'#4CAF50', medium:'#FF9800', hard:'#F44336'};

function buildIndex({ title, titleEs, subtitle, baseUrl, pages, accentColor, icon }) {
  const byCategory = {};
  CATS.forEach(c => { byCategory[c] = pages.filter(p => p.category === c); });

  const catSections = CATS.map(cat => {
    const catPages = byCategory[cat];
    if (!catPages.length) return '';
    const cards = catPages.map(p => `
      <a class="card" href="/${baseUrl}/${p.slug}/">
        <div class="card-diff" style="background:${DIFF_COLOR[p.difficulty]}">${DIFF_ES[p.difficulty]}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-age">Edad ${p.age}</div>
      </a>`).join('');
    return `
    <section class="category-section">
      <h2 class="cat-heading" style="color:${CAT_COLORS[cat]}">
        ${CAT_EMOJI[cat]} ${CAT_ES[cat]}
      </h2>
      <div class="cards-grid">${cards}</div>
    </section>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} para Niños | ChartKids</title>
<meta name="description" content="${subtitle} Actividades imprimibles gratis para niños.">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f5f5f5;color:#333}
header{background:${accentColor};color:white;padding:20px;text-align:center}
header h1{font-size:28px;font-weight:bold;margin-bottom:6px}
header p{opacity:.9;font-size:14px}
nav{background:white;padding:10px 20px;border-bottom:2px solid #eee;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
nav a{text-decoration:none;color:#555;padding:6px 14px;border-radius:20px;font-size:13px;background:#f0f0f0}
nav a:hover{background:#ddd}
.container{max-width:960px;margin:0 auto;padding:16px}
.filter-bar{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0;align-items:center}
.filter-bar label{font-size:13px;font-weight:bold;color:#555}
.filter-btn{padding:6px 14px;border-radius:20px;border:2px solid #ddd;background:white;cursor:pointer;font-size:12px}
.filter-btn.active,.filter-btn:hover{border-color:${accentColor};color:${accentColor}}
.category-section{margin-bottom:28px}
.cat-heading{font-size:18px;font-weight:bold;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #eee}
.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px}
.card{display:block;background:white;border-radius:10px;padding:12px;text-decoration:none;color:#333;box-shadow:0 2px 6px rgba(0,0,0,.08);position:relative;transition:transform .15s,box-shadow .15s;border:2px solid transparent}
.card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.15);border-color:${accentColor}}
.card-diff{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:bold;color:white;margin-bottom:6px}
.card-title{font-size:13px;font-weight:bold;line-height:1.3;margin-bottom:4px}
.card-age{font-size:11px;color:#888}
footer{text-align:center;padding:28px;color:#888;font-size:13px;border-top:1px solid #eee;margin-top:24px}
@media(max-width:500px){.cards-grid{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>
<header>
  <h1>${icon} ${title}</h1>
  <p>${subtitle}</p>
</header>
<nav>
  <a href="/">Inicio</a>
  <a href="/coloring/">Colorear</a>
  <a href="/maze/">Laberintos</a>
  <a href="/dots/">Une los Puntos</a>
  <a href="/numbers/">Por Números</a>
  <a href="/blog/">Blog</a>
</nav>
<div class="container">
  ${catSections}
</div>
<footer>
  <p>© 2025 ChartKids · Actividades educativas imprimibles gratis</p>
  <p style="margin-top:6px"><a href="/" style="color:#888">Inicio</a> · <a href="/blog/" style="color:#888">Blog</a></p>
</footer>
</body>
</html>`;
}

// Maze index
const mazeHtml = buildIndex({
  title: 'Laberintos',
  titleEs: 'Laberintos',
  subtitle: '72 laberintos imprimibles con 3 niveles de dificultad y 12 categorías temáticas.',
  baseUrl: 'maze',
  pages: mazes,
  accentColor: '#2196F3',
  icon: '🌀'
});
fs.mkdirSync('maze', { recursive: true });
fs.writeFileSync(path.join('maze','index.html'), mazeHtml);
console.log('✓ maze/index.html');

// Dots index
const dotsHtml = buildIndex({
  title: 'Une los Puntos',
  titleEs: 'Une los Puntos',
  subtitle: '72 fichas de unir puntos imprimibles para niños. 3 niveles de dificultad.',
  baseUrl: 'dots',
  pages: dots,
  accentColor: '#9C27B0',
  icon: '✨'
});
fs.mkdirSync('dots', { recursive: true });
fs.writeFileSync(path.join('dots','index.html'), dotsHtml);
console.log('✓ dots/index.html');

// Numbers index
const numsHtml = buildIndex({
  title: 'Colorear por Números',
  titleEs: 'Colorear por Números',
  subtitle: '72 fichas de colorear por números para niños. 12 categorías temáticas.',
  baseUrl: 'numbers',
  pages: nums,
  accentColor: '#FF5722',
  icon: '🎨'
});
fs.mkdirSync('numbers', { recursive: true });
fs.writeFileSync(path.join('numbers','index.html'), numsHtml);
console.log('✓ numbers/index.html');

// Update sitemap with index pages
const indexUrls = [
  '  <url><loc>https://chartkids.com/maze/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>',
  '  <url><loc>https://chartkids.com/dots/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>',
  '  <url><loc>https://chartkids.com/numbers/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>',
];
const sm = fs.readFileSync('sitemap.xml','utf8');
if (!sm.includes('/maze/</loc>')) {
  const updated = sm.replace('</urlset>', indexUrls.join('\n') + '\n</urlset>');
  fs.writeFileSync('sitemap.xml', updated);
  console.log('✓ sitemap +3 index URLs');
}

console.log('\nDone!');
