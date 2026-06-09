#!/usr/bin/env node
// generate-mazes.js — ChartKids maze generator — narrative character style
'use strict';
const fs   = require('fs');
const path = require('path');

const BASE_DIR   = __dirname;
const OUT_DIR    = path.join(BASE_DIR, 'maze');
const SVG_DIR    = path.join(BASE_DIR, 'generated', 'svgs', 'maze');
const PAGES_FILE = path.join(BASE_DIR, 'master-mazes-72.json');
const SITEMAP    = path.join(BASE_DIR, 'sitemap.xml');

const args       = process.argv.slice(2);
const FORCE      = args.includes('--force');
const ID_FILTER  = parseInt((args.find(a => a.startsWith('--id='))       || '').split('=')[1]) || null;
const CAT_FILTER =           (args.find(a => a.startsWith('--category=')) || '').split('=')[1];

const GRID = {
  easy:   { cols:8,  rows:10, cell:48, wall:4 },
  medium: { cols:12, rows:14, cell:34, wall:3 },
  hard:   { cols:16, rows:20, cell:25, wall:2 },
};

const CAT_COLORS = {
  animals:'#16a34a', dinosaurs:'#dc2626', space:'#7c3aed', vehicles:'#d97706',
  food:'#ea580c', fantasy:'#db2777', jobs:'#0891b2', sports:'#2563eb',
  nature:'#65a30d', holidays:'#9333ea', superheroes:'#e11d48', pets:'#c2410c',
};
const CAT_LABELS = {
  animals:'Animales', dinosaurs:'Dinosaurios', space:'Espacio', vehicles:'Vehículos',
  food:'Comida', fantasy:'Fantasía', jobs:'Trabajos', sports:'Deportes',
  nature:'Naturaleza', holidays:'Días Festivos', superheroes:'Superhéroes', pets:'Mascotas',
};

// Per-maze narrative: char shown at START cell, dest shown at END cell
const MAZE_STORY = {
  'lion-maze-maze':              {char:'🦁',dest:'🍖',text:'¡Ayuda al León a encontrar su comida!'},
  'elephant-maze-maze':          {char:'🐘',dest:'🍉',text:'¡Guía al Elefante hasta su sandía!'},
  'jungle-maze-maze':            {char:'🐒',dest:'🌴',text:'¡Lleva al Mono a su árbol!'},
  'safari-maze-maze':            {char:'🦒',dest:'💧',text:'¡Guía a la Jirafa al abrevadero!'},
  'ocean-animals-maze-maze':     {char:'🐬',dest:'🐚',text:'¡Lleva al Delfín al arrecife!'},
  'arctic-animals-maze-maze':    {char:'🐧',dest:'🐟',text:'¡Ayuda al Pingüino a pescar!'},
  'baby-dino-maze-maze':         {char:'🦕',dest:'🥚',text:'¡Ayuda al Dino a encontrar su huevo!'},
  'jurassic-maze-maze':          {char:'🦖',dest:'🌿',text:'¡Lleva al T-Rex a su comida!'},
  'volcano-maze-maze':           {char:'🦕',dest:'🌋',text:'¡Escapa antes de que erupcione!'},
  'prehistoric-maze-maze':       {char:'🦖',dest:'🪨',text:'¡Explora el mundo prehistórico!'},
  'dino-egg-hunt-maze-maze':     {char:'🦖',dest:'🥚',text:'¡Encuentra todos los huevos!'},
  't-rex-escape-maze-maze':      {char:'🦖',dest:'🌲',text:'¡Escapa al bosque!'},
  'car-park-maze-maze':          {char:'🚗',dest:'🅿️',text:'¡Lleva el Auto al parking!'},
  'city-traffic-maze-maze':      {char:'🚕',dest:'🏠',text:'¡Navega por el tráfico urbano!'},
  'race-track-maze-maze':        {char:'🏎️',dest:'🏁',text:'¡Llega primero a la meta!'},
  'airport-maze-maze':           {char:'✈️',dest:'🛫',text:'¡El Avión tiene que despegar!'},
  'train-tracks-maze-maze':      {char:'🚂',dest:'🚉',text:'¡Lleva el Tren a la estación!'},
  'space-launch-maze-maze':      {char:'🚀',dest:'🪐',text:'¡Lanza el Cohete al espacio!'},
  'rocket-maze-maze':            {char:'🚀',dest:'⭐',text:'¡Llega a las estrellas!'},
  'planet-hop-maze-maze':        {char:'🧑‍🚀',dest:'🌍',text:'¡Salta de planeta en planeta!'},
  'astronaut-maze-maze':         {char:'👨‍🚀',dest:'🛸',text:'¡Guía al Astronauta a su nave!'},
  'galaxy-maze-maze':            {char:'🚀',dest:'🌌',text:'¡Explora la galaxia!'},
  'star-map-maze-maze':          {char:'🧑‍🚀',dest:'⭐',text:'¡Sigue el mapa de estrellas!'},
  'black-hole-maze-maze':        {char:'🚀',dest:'🕳️',text:'¡Escapa del agujero negro!'},
  'hero-training-maze-maze':     {char:'🦸',dest:'🏆',text:'¡Completa el entrenamiento!'},
  'city-rescue-maze-maze':       {char:'🦸',dest:'👥',text:'¡El Héroe debe rescatar a todos!'},
  'superpower-maze-maze':        {char:'🦸',dest:'✨',text:'¡Usa tus superpoderes!'},
  'villain-maze-maze':           {char:'🦸',dest:'🦹',text:'¡Atrapa al villano!'},
  'hero-hq-maze-maze':           {char:'🦸',dest:'🏢',text:'¡Regresa al cuartel general!'},
  'final-battle-maze-maze':      {char:'🦸',dest:'💥',text:'¡Gana la batalla final!'},
  'castle-maze-maze':            {char:'🦄',dest:'🏰',text:'¡Lleva al Unicornio al castillo!'},
  'dragon-cave-maze-maze':       {char:'🐲',dest:'💎',text:'¡Encuentra el tesoro del dragón!'},
  'enchanted-forest-maze-maze':  {char:'🧝',dest:'🌲',text:'¡Explora el bosque encantado!'},
  'magic-tower-maze-maze':       {char:'🧙',dest:'🗼',text:'¡El Mago llega a la torre!'},
  'unicorn-garden-maze-maze':    {char:'🦄',dest:'🌷',text:'¡Llega al jardín mágico!'},
  'wizard-maze-maze':            {char:'🧙',dest:'✨',text:'¡Sigue el camino del mago!'},
  'fire-station-maze-maze':      {char:'🚒',dest:'🔥',text:'¡Apaga el incendio a tiempo!'},
  'hospital-maze-maze':          {char:'🚑',dest:'🏥',text:'¡La ambulancia llega al hospital!'},
  'city-jobs-maze-maze':         {char:'👷',dest:'🏙️',text:'¡El trabajador cruza la ciudad!'},
  'construction-maze-maze':      {char:'👷',dest:'🏗️',text:'¡Construye el edificio!'},
  'farm-maze-maze':              {char:'🚜',dest:'🌾',text:'¡El tractor llega al campo!'},
  'big-city-maze-maze':          {char:'👮',dest:'🏙️',text:'¡El policía protege la ciudad!'},
  'soccer-field-maze-maze':      {char:'⚽',dest:'🥅',text:'¡Mete el gol!'},
  'sports-arena-maze-maze':      {char:'🏃',dest:'🏆',text:'¡Gana el campeonato!'},
  'olympic-maze-maze':           {char:'🏊',dest:'🥇',text:'¡Gana la medalla de oro!'},
  'stadium-maze-maze':           {char:'🏈',dest:'🏟️',text:'¡Llega al estadio!'},
  'gym-maze-maze':               {char:'🏋️',dest:'🥇',text:'¡Entrena para ganar!'},
  'championship-maze-maze':      {char:'⚽',dest:'🏆',text:'¡Gana el campeonato!'},
  'pizza-delivery-maze-maze':    {char:'🍕',dest:'🏠',text:'¡Entrega la pizza caliente!'},
  'fruit-garden-maze-maze':      {char:'🍇',dest:'🧺',text:'¡Recoge todas las frutas!'},
  'kitchen-maze-maze':           {char:'👨‍🍳',dest:'🍽️',text:'¡El chef llega a la cocina!'},
  'restaurant-maze-maze':        {char:'🍽️',dest:'😋',text:'¡Lleva la comida al cliente!'},
  'bakery-maze-maze':            {char:'🥐',dest:'🏪',text:'¡Lleva el pan a la panadería!'},
  'food-market-maze-maze':       {char:'🛒',dest:'🏪',text:'¡Encuentra todos los ingredientes!'},
  'garden-maze-maze':            {char:'🐝',dest:'🌸',text:'¡La Abeja busca su flor!'},
  'forest-path-maze-maze':       {char:'🦌',dest:'🌲',text:'¡Guía al Venado por el bosque!'},
  'mountain-trail-maze-maze':    {char:'🥾',dest:'⛰️',text:'¡Sube a la cima de la montaña!'},
  'jungle-path-maze-maze':       {char:'🦜',dest:'🌴',text:'¡El Loro vuela por la jungla!'},
  'river-maze-maze':             {char:'🚣',dest:'🌊',text:'¡Navega por el río!'},
  'volcano-path-maze-maze':      {char:'🦎',dest:'🌋',text:'¡El lagarto escapa del volcán!'},
  'christmas-tree-maze-maze':    {char:'🎅',dest:'🎄',text:'¡Papá Noel llega al árbol!'},
  'halloween-maze-maze':         {char:'👻',dest:'🎃',text:'¡El fantasma encuentra la calabaza!'},
  'easter-egg-hunt-maze-maze':   {char:'🐰',dest:'🥚',text:'¡El Conejo encuentra los huevos!'},
  'holiday-party-maze-maze':     {char:'🎉',dest:'🎊',text:'¡Llega a la fiesta!'},
  'winter-maze-maze':            {char:'⛄',dest:'❄️',text:'¡El muñeco de nieve disfruta el invierno!'},
  'festival-maze-maze':          {char:'🎭',dest:'🎆',text:'¡Llega al festival!'},
  'puppy-maze-maze':             {char:'🐕',dest:'🏠',text:'¡Lleva al Cachorro a casa!'},
  'kitten-maze-maze':            {char:'🐈',dest:'🛋️',text:'¡La Gatita quiere descansar!'},
  'pet-park-maze-maze':          {char:'🐩',dest:'🌳',text:'¡El Perrito quiere jugar en el parque!'},
  'bug-garden-maze-maze':        {char:'🦋',dest:'🌸',text:'¡La Mariposa busca su flor!'},
  'pet-show-maze-maze':          {char:'🐾',dest:'🏆',text:'¡La mascota llega al concurso!'},
  'butterfly-maze-maze':         {char:'🦋',dest:'🌺',text:'¡La Mariposa encuentra la flor!'},
};

// ── Maze generator ────────────────────────────────────────────────────────────
function generateMaze(cols, rows, seed) {
  const N=1, S=2, E=4, W=8;
  const OPP = {[N]:S,[S]:N,[E]:W,[W]:E};
  const DX  = {[N]:0,[S]:0,[E]:1,[W]:-1};
  const DY  = {[N]:-1,[S]:1,[E]:0,[W]:0};
  const cells   = Array.from({length:rows}, () => new Uint8Array(cols).fill(15));
  const visited = Array.from({length:rows}, () => new Uint8Array(cols));
  let rng = (Math.abs(seed) * 1664525 + 1013904223) >>> 0;
  const rand    = n => { rng=(rng*1664525+1013904223)>>>0; return rng%n; };
  const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; };
  const stack = [[0,0]];
  visited[0][0] = 1;
  while (stack.length) {
    const [x,y] = stack[stack.length-1];
    const dirs = shuffle([N,S,E,W]);
    let moved = false;
    for (const dir of dirs) {
      const nx=x+DX[dir], ny=y+DY[dir];
      if (nx>=0&&nx<cols&&ny>=0&&ny<rows&&!visited[ny][nx]) {
        cells[y][x]   &= ~dir;
        cells[ny][nx] &= ~OPP[dir];
        visited[ny][nx] = 1;
        stack.push([nx,ny]); moved=true; break;
      }
    }
    if (!moved) stack.pop();
  }
  return { cells, N, S, E, W };
}

// ── SVG renderer ──────────────────────────────────────────────────────────────
function makeMazeSVG(page) {
  const g = GRID[page.difficulty] || GRID.easy;
  const { cells, S, E } = generateMaze(g.cols, g.rows, page.id * 31 + 17);

  const color = CAT_COLORS[page.category] || '#7c3aed';
  const label = CAT_LABELS[page.category] || page.category;
  const story = MAZE_STORY[page.slug] || {char:'⭐',dest:'🏆',text:'¡Encuentra el camino!'};

  const HDR = 82;
  const mW = g.cols * g.cell, mH = g.rows * g.cell;
  // Center maze horizontally; leave ~20px top padding after header, 60px footer
  const mX = Math.round((500 - mW) / 2);
  const mY = HDR + Math.max(15, Math.round((650 - HDR - 60 - mH) / 2));

  // Wall paths
  const parts = [];
  parts.push(`M${mX},${mY}h${mW}v${mH}h${-mW}Z`); // outer border
  for (let r=0; r<g.rows; r++) {
    for (let c=0; c<g.cols; c++) {
      const cell = cells[r][c];
      const x = mX + c*g.cell, y = mY + r*g.cell;
      if ((cell & S) && r < g.rows-1) parts.push(`M${x},${y+g.cell}h${g.cell}`);
      if ((cell & E) && c < g.cols-1) parts.push(`M${x+g.cell},${y}v${g.cell}`);
    }
  }

  const entY = mY;
  const exY  = mY + g.rows * g.cell;
  // Start cell center (top-left cell)
  const sCx  = mX + g.cell * 0.5;
  const sCy  = mY + g.cell * 0.5;
  // End cell center (bottom-right cell)
  const eCx  = mX + (g.cols - 0.5) * g.cell;
  const eCy  = mY + (g.rows - 0.5) * g.cell;

  // Emoji font size inside cells
  const emSz = Math.max(12, Math.min(g.cell - 6, 28));
  // Label font size
  const fs2  = Math.min(9, g.cell * 0.19 + 5).toFixed(1);

  const diffStars = {easy:'★☆☆',medium:'★★☆',hard:'★★★'}[page.difficulty]||'★☆☆';

  return `<svg viewBox="0 0 500 650" xmlns="http://www.w3.org/2000/svg">
<defs>
  <filter id="sh" x="-5%" y="-5%" width="110%" height="110%">
    <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#00000022"/>
  </filter>
</defs>
<!-- Background -->
<rect width="500" height="650" fill="#f9fafb"/>
<rect width="500" height="650" fill="white" opacity=".7"/>

<!-- Header gradient band -->
<rect width="500" height="${HDR}" fill="${color}" rx="0"/>
<rect width="500" height="${HDR}" fill="url(#hg)" opacity=".25"/>

<!-- Header: character emoji LEFT -->
<rect x="5" y="8" width="68" height="66" rx="12" fill="rgba(255,255,255,0.18)"/>
<text x="39" y="56" font-size="36" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${story.char}</text>

<!-- Header: info CENTER -->
<text x="250" y="24" font-family="Nunito,sans-serif" font-size="9" fill="white" font-weight="800" opacity=".85" text-anchor="middle">${label.toUpperCase()} · LABERINTO · ${diffStars}</text>
<text x="250" y="46" font-family="'Fredoka One',Nunito,sans-serif" font-size="20" fill="white" font-weight="900" text-anchor="middle">${page.title}</text>
<text x="250" y="68" font-family="Nunito,sans-serif" font-size="10" fill="white" opacity=".9" text-anchor="middle" font-style="italic">${story.text}</text>

<!-- Header: destination emoji RIGHT -->
<rect x="427" y="8" width="68" height="66" rx="12" fill="rgba(255,255,255,0.18)"/>
<text x="461" y="56" font-size="36" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${story.dest}</text>

<!-- Arrow in header -->
<text x="250" y="56" font-size="18" text-anchor="middle" fill="white" opacity=".35" font-family="sans-serif">→</text>

<!-- Maze grid shadow -->
<rect x="${mX-2}" y="${mY-2}" width="${mW+4}" height="${mH+4}" rx="4" fill="#00000015" filter="url(#sh)"/>
<!-- Maze background -->
<rect x="${mX}" y="${mY}" width="${mW}" height="${mH}" fill="white"/>

<!-- Walls -->
<path d="${parts.join(' ')}" fill="none" stroke="#1e293b" stroke-width="${g.wall}" stroke-linecap="square" stroke-linejoin="miter"/>

<!-- Open entrance (top of column 0) -->
<line x1="${mX}" y1="${entY}" x2="${mX+g.cell}" y2="${entY}" stroke="white" stroke-width="${g.wall+2}"/>
<!-- Open exit (bottom of last column) -->
<line x1="${mX+(g.cols-1)*g.cell}" y1="${exY}" x2="${mX+g.cols*g.cell}" y2="${exY}" stroke="white" stroke-width="${g.wall+2}"/>

<!-- START badge -->
<rect x="${mX-1}" y="${mY - 23}" width="${g.cell+2}" height="21" rx="5" fill="${color}"/>
<text x="${sCx}" y="${mY-9}" font-family="Nunito,sans-serif" font-size="${fs2}" font-weight="900" fill="white" text-anchor="middle">INICIO</text>
<!-- START cell emoji -->
<text x="${sCx}" y="${sCy + emSz*0.38}" font-size="${emSz}" text-anchor="middle" opacity=".9" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${story.char}</text>

<!-- FINISH badge -->
<rect x="${mX+(g.cols-1)*g.cell-1}" y="${exY+2}" width="${g.cell+2}" height="21" rx="5" fill="#0f172a"/>
<text x="${eCx}" y="${exY+16}" font-family="Nunito,sans-serif" font-size="${fs2}" font-weight="900" fill="white" text-anchor="middle">META</text>
<!-- END cell emoji -->
<text x="${eCx}" y="${eCy + emSz*0.38}" font-size="${emSz}" text-anchor="middle" opacity=".9" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${story.dest}</text>

<!-- Footer -->
<text x="250" y="638" font-family="Nunito,sans-serif" font-size="8" fill="#94a3b8" text-anchor="middle">Imprimible gratuito · chartkids.com/maze/${page.slug}/ · Edad ${page.age}</text>
</svg>`;
}

// ── HTML page ─────────────────────────────────────────────────────────────────
function makeHTML(page, svg) {
  const color = CAT_COLORS[page.category] || '#7c3aed';
  const label = CAT_LABELS[page.category] || page.category;
  const story = MAZE_STORY[page.slug] || {char:'⭐',dest:'🏆',text:'¡Encuentra el camino!'};
  const diffLabel = {easy:'Fácil 😊',medium:'Medio 🤔',hard:'Difícil 🧠'}[page.difficulty]||page.difficulty;
  const diffStars = {easy:'★☆☆',medium:'★★☆',hard:'★★★'}[page.difficulty]||'★☆☆';
  const minSvg = svg.replace(/\n/g,' ').replace(/\s{2,}/g,' ');
  const {title,slug,age,difficulty,category} = page;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Laberinto Imprimible Gratis | ChartKids</title>
<meta name="description" content="${story.text} Laberinto imprimible gratis nivel ${difficulty} para niños de ${age} años.">
<link rel="canonical" href="https://chartkids.com/maze/${slug}/">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>
.story-banner{background:${color}18;border:2px solid ${color}40;border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;margin-bottom:14px;font-size:.9rem;color:#1e293b}
.story-banner .emojis{font-size:1.6rem;white-space:nowrap}
.tip-box{background:#f8fafc;border-left:3px solid ${color};padding:8px 14px;border-radius:0 8px 8px 0;font-size:.8rem;color:#475569;margin:10px 0}
</style>
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav">
    <a href="/downloads/coloring/">Colorear</a>
    <a href="/maze/" class="active">Laberintos</a>
    <a href="/dots/">Une los Puntos</a>
    <a href="/numbers/">Por Números</a>
    <a href="/blog/">Blog</a>
  </nav>
</div></header>
<main class="container page-layout">
  <div class="page-main">
    <div class="activity-badge">${story.char} ${label} <span style="background:${color}">LABERINTO</span></div>
    <h1>${title}</h1>
    <div class="story-banner">
      <span class="emojis">${story.char} → ${story.dest}</span>
      <span>${story.text}</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <span class="pill" style="background:${color}20;color:${color}"><span style="color:${color}">${diffStars}</span> ${diffLabel}</span>
      <span class="pill">Edad ${age}</span>
      <span class="pill">${label}</span>
    </div>
    <div class="tip-box">💡 <strong>Consejo:</strong> ¡Usa un lápiz para poder borrar si te equivocas!</div>
    <div class="print-area" style="max-width:520px;margin:0 auto">${minSvg}</div>
    <div class="page-actions">
      <button onclick="printPage()" class="btn-print">🖨️ Imprimir Laberinto</button>
      <a href="/maze/" class="btn-secondary">Ver más Laberintos</a>
    </div>
  </div>
  <aside class="page-sidebar">
    <h3>Más Laberintos</h3>
    <div class="sidebar-promo">
      <a href="/maze/" class="promo-link">🌀 Todos los Laberintos</a>
      <a href="/dots/" class="promo-link">✨ Une los Puntos</a>
      <a href="/numbers/" class="promo-link">🎨 Colorear por Números</a>
      <a href="/downloads/coloring/" class="promo-link">🖍️ Páginas para Colorear</a>
      <a href="/tracing/" class="promo-link">✏️ Trazado de Letras</a>
      <a href="/wordsearch/" class="promo-link">🔤 Sopa de Letras</a>
    </div>
  </aside>
</main>
<footer class="site-footer"><div class="container footer-inner">
  <p>© 2025 ChartKids · Actividades educativas imprimibles gratis</p>
</div></footer>
<script>
function printPage(){
  var svg=document.querySelector('.print-area').innerHTML;
  var w=window.open('','_blank','width=816,height=1056');
  if(!w){window.print();return;}
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}<\\/title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&family=Fredoka+One&display=swap" rel="stylesheet">'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:white}'
    +'svg{width:90vmin;height:auto}@page{size:letter portrait;margin:.3in}<\\/style><\\/head><body>'+svg+'<\\/body><\\/html>');
  w.document.close(); setTimeout(function(){w.print();},400);
}
</script>
</body>
</html>`;
}

function addToSitemap(urls) {
  if (!fs.existsSync(SITEMAP)) return;
  let xml = fs.readFileSync(SITEMAP,'utf8');
  const existing = new Set((xml.match(/<loc>[^<]+<\/loc>/g)||[]).map(x=>x));
  const entries = urls
    .filter(u => !existing.has(`<loc>https://chartkids.com${u}</loc>`))
    .map(u => `  <url><loc>https://chartkids.com${u}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
    .join('\n');
  if (entries) { xml = xml.replace('</urlset>',entries+'\n</urlset>'); fs.writeFileSync(SITEMAP,xml); }
}

function main() {
  const pages = JSON.parse(fs.readFileSync(PAGES_FILE,'utf8'));
  fs.mkdirSync(SVG_DIR,{recursive:true});
  let filtered = pages;
  if (ID_FILTER)  filtered = filtered.filter(p=>p.id===ID_FILTER);
  if (CAT_FILTER) filtered = filtered.filter(p=>p.category===CAT_FILTER);
  let built=0, skipped=0, sitemapUrls=[];
  for (const page of filtered) {
    const pageDir  = path.join(OUT_DIR,page.slug);
    const htmlPath = path.join(pageDir,'index.html');
    const svgPath  = path.join(SVG_DIR,`${page.slug}.svg`);
    if (!FORCE && fs.existsSync(htmlPath)) { process.stdout.write(`  skip  [${page.id}]\n`); skipped++; continue; }
    process.stdout.write(`  build [${page.id}] ${page.title}\n`);
    const svg  = makeMazeSVG(page);
    const html = makeHTML(page, svg);
    fs.mkdirSync(pageDir,{recursive:true});
    fs.writeFileSync(htmlPath,html);
    fs.writeFileSync(svgPath,svg);
    sitemapUrls.push(`/maze/${page.slug}/`);
    built++;
  }
  if (sitemapUrls.length) addToSitemap(sitemapUrls);
  console.log(`\n✓ Built: ${built}  Skipped: ${skipped}`);
}
main();
