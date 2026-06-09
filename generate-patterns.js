'use strict';
// generate-patterns.js — Pattern completion worksheets
const fs   = require('fs');
const path = require('path');

const CAT_COLORS={animals:'#16a34a',dinosaurs:'#dc2626',vehicles:'#2563eb',space:'#7c3aed',
  superheroes:'#e11d48',fantasy:'#db2777',jobs:'#0891b2',sports:'#0284c7',
  food:'#ea580c',nature:'#65a30d',holidays:'#9333ea',pets:'#c2410c'};
const CAT_ES={animals:'Animales',dinosaurs:'Dinosaurios',vehicles:'Vehículos',space:'Espacio',
  superheroes:'Superhéroes',fantasy:'Fantasía',jobs:'Trabajos',sports:'Deportes',
  food:'Comida',nature:'Naturaleza',holidays:'Días Festivos',pets:'Mascotas'};

const CAT_EMOJIS={
  animals:   ['🦁','🐘','🦒','🐒','🐧','🦜','🦊','🐺','🐋','🦅'],
  dinosaurs: ['🦕','🦖','🥚','🦴','🌋','🌿','🪨','⭐','🐾','🌴'],
  vehicles:  ['🚗','🚌','✈️','🚀','🚂','⛵','🚲','🚁','🛸','🚒'],
  space:     ['⭐','🌙','🪐','☄️','🚀','👨‍🚀','🌍','💫','🌌','🔭'],
  superheroes:['🦸','⚡','🛡️','✨','💥','🏆','💪','🎭','🧤','🦹'],
  fantasy:   ['🦄','🐲','✨','👑','🧚','🔮','🏰','🧙','💎','🗡️'],
  jobs:      ['👷','👨‍🍳','👩‍⚕️','👨‍✈️','👮','🚒','📚','💊','🏗️','🍽️'],
  sports:    ['⚽','🏀','🏈','⚾','🏐','🎾','🥇','🏆','🏁','🤸'],
  food:      ['🍕','🍎','🧁','🍦','🌮','🍜','🥐','🍰','🍇','🥕'],
  nature:    ['🌸','🌲','🌈','🦋','🌻','🍃','🌊','⛰️','🍄','🌙'],
  holidays:  ['🎄','🎃','🥚','🎁','⛄','🎉','🔔','🎆','🦃','💝'],
  pets:      ['🐶','🐱','🐰','🐠','🐦','🐹','🦎','🐢','🦜','🐾'],
};

// Pattern types by difficulty
const PATTERNS_EASY  =['AB','AB','AAB','ABB','AABB'];
const PATTERNS_MEDIUM=['ABC','ABBC','ABAC','AABC','ABCC'];
const PATTERNS_HARD  =['ABCD','ABCB','AABC','ABBC','ABCD'];

const LEVELS=[
  {id:1,name:'easy',   label:'Fácil',   patterns:PATTERNS_EASY,   blanks:2},
  {id:2,name:'easy',   label:'Fácil',   patterns:PATTERNS_EASY,   blanks:2},
  {id:3,name:'medium', label:'Medio',   patterns:PATTERNS_MEDIUM, blanks:3},
  {id:4,name:'medium', label:'Medio',   patterns:PATTERNS_MEDIUM, blanks:3},
  {id:5,name:'hard',   label:'Difícil', patterns:PATTERNS_HARD,   blanks:4},
  {id:6,name:'hard',   label:'Difícil', patterns:PATTERNS_HARD,   blanks:4},
];

function seededRng(seed){let s=seed|0;return()=>{s=(s*1664525+1013904223)>>>0;return s/0xFFFFFFFF};}

function buildRow(emojis, pattern, blanks, catColor, rng){
  // Assign emojis to pattern letters
  const letters=[...new Set(pattern.split(''))];
  const emojiMap={};
  const used=new Set();
  for(const l of letters){
    let e;
    do{e=emojis[Math.floor(rng()*emojis.length)];}while(used.has(e));
    emojiMap[l]=e; used.add(e);
  }
  // Build sequence: repeat pattern enough times to get 8-10 elements
  const times=Math.ceil((8+blanks)/pattern.length);
  const full=[];
  for(let t=0;t<times;t++) for(const l of pattern) full.push({l,e:emojiMap[l]});
  const seq=full.slice(0,8+blanks);
  // Determine which positions are blanks (last `blanks` shown positions)
  const blankPositions=new Set();
  for(let i=seq.length-blanks;i<seq.length;i++) blankPositions.add(i);
  return {seq, blankPositions, emojiMap};
}

function buildSVG(cat,level,rows,catColor){
  const W=500,H=650;
  const nRows=rows.length;
  const rowH=Math.floor((H-130)/nRows);
  const cellW=44;

  let rowsSvg='';
  rows.forEach((row,ri)=>{
    const y=110+ri*rowH;
    const startX=30;
    let cells='';
    row.seq.forEach((item,ci)=>{
      const x=startX+ci*cellW;
      const cy=y+rowH/2;
      if(row.blankPositions.has(ci)){
        // Blank box
        cells+=`<rect x="${x}" y="${cy-22}" width="${cellW-4}" height="42" rx="8" fill="white" stroke="${catColor}" stroke-width="2" stroke-dasharray="5 3"/>`;
        cells+=`<text x="${x+cellW/2-2}" y="${cy+6}" text-anchor="middle" font-size="10" fill="${catColor}30" font-family="Nunito,sans-serif">?</text>`;
      } else {
        cells+=`<text x="${x+cellW/2-2}" y="${cy+12}" font-size="28" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${item.e}</text>`;
      }
    });
    rowsSvg+=`
      <rect x="8" y="${y+6}" width="484" height="${rowH-12}" rx="10" fill="${ri%2===0?'#f8fafc':'white'}" stroke="#e2e8f0" stroke-width="1"/>
      <text x="16" y="${y+rowH/2+5}" font-size="18" font-weight="900" fill="${catColor}" font-family="Nunito,sans-serif">${ri+1}.</text>
      ${cells}`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<defs><style>text{font-family:Nunito,Arial,sans-serif}</style></defs>
<rect width="${W}" height="${H}" fill="#f9fafb"/>
<rect width="${W}" height="${H}" fill="white" opacity=".8"/>
<rect width="${W}" height="100" fill="${catColor}"/>
<text x="250" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="800" opacity=".85">PATRONES · ${CAT_ES[cat]?.toUpperCase()||cat.toUpperCase()}</text>
<text x="250" y="58" text-anchor="middle" font-size="22" fill="white" font-weight="900">Continúa el patrón</text>
<text x="250" y="80" text-anchor="middle" font-size="10" fill="white" opacity=".85">Nivel ${level.label} · Dibuja lo que falta · chartkids.com</text>
${rowsSvg}
<text x="250" y="${H-8}" text-anchor="middle" font-size="8" fill="#94a3b8">Imprimible gratuito · chartkids.com/patterns/</text>
</svg>`;
}

let built=0,skipped=0;
const sitemapLines=[];

for(const [cat,emojis] of Object.entries(CAT_EMOJIS)){
  const catColor=CAT_COLORS[cat]||'#7c3aed';
  for(const level of LEVELS){
    const slug=`patterns-${cat}-${level.name}-${level.id}`;
    const dir=path.join('patterns',slug);
    const htmlPath=path.join(dir,'index.html');
    if(fs.existsSync(htmlPath)){skipped++;continue;}

    const rng=seededRng(cat.length*77+level.id*23+11);
    const nRows=5;
    const rows=[];
    for(let ri=0;ri<nRows;ri++){
      const pat=level.patterns[Math.floor(rng()*level.patterns.length)];
      rows.push(buildRow(emojis,pat,level.blanks,catColor,rng));
    }

    const svg=buildSVG(cat,level,rows,catColor);
    const minSvg=svg.replace(/\n/g,' ').replace(/\s{2,}/g,' ');
    const catEs=CAT_ES[cat]||cat;
    const html=`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Patrones ${catEs} ${level.label} | ChartKids</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>@media print{header,.page-actions,.page-sidebar,footer{display:none!important}}</style>
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav"><a href="/patterns/" class="active">Patrones</a><a href="/maze/">Laberintos</a></nav>
</div></header>
<main class="container page-layout">
  <div class="page-main">
    <h1>🔷 Patrones: ${catEs}</h1>
    <div style="margin:8px 0"><span class="pill" style="background:${catColor}20;color:${catColor}">${level.label}</span></div>
    <div class="print-area" style="max-width:540px;margin:0 auto">${minSvg}</div>
    <div class="page-actions">
      <button onclick="window.print()" class="btn-print">🖨️ Imprimir</button>
      <a href="/patterns/" class="btn-secondary">Más fichas</a>
    </div>
  </div>
  <aside class="page-sidebar">
    <div class="sidebar-promo">
      <a href="/tracing/" class="promo-link">✏️ Trazado</a>
      <a href="/wordsearch/" class="promo-link">🔤 Sopa de Letras</a>
      <a href="/counting/" class="promo-link">🔢 Conteo</a>
      <a href="/maze/" class="promo-link">🌀 Laberintos</a>
    </div>
  </aside>
</main>
<footer class="site-footer"><div class="container footer-inner"><p>© 2025 ChartKids</p></div></footer>
</body>
</html>`;
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(htmlPath,html);
    console.log(`  build ${slug}`);
    built++;
    sitemapLines.push(`  <url><loc>https://chartkids.com/patterns/${slug}/</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
  }
}

// Index
const catCards=Object.entries(CAT_EMOJIS).map(([cat])=>{
  const color=CAT_COLORS[cat];
  return `<a class="card" href="/patterns/patterns-${cat}-easy-1/" style="border-top:4px solid ${color}">
    <div class="card-title">${CAT_ES[cat]||cat}</div><div class="card-age">6 niveles</div></a>`;
}).join('');

fs.mkdirSync('patterns',{recursive:true});
fs.writeFileSync(path.join('patterns','index.html'),`<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fichas de Patrones para Niños | ChartKids</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head><body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav"><a href="/patterns/" class="active">Patrones</a></nav>
</div></header>
<section style="background:#db2777;color:white;padding:24px;text-align:center">
  <h1 style="font-size:2rem;margin-bottom:6px">🔷 Fichas de Patrones</h1>
  <p>72 fichas. Continúa el patrón con emojis temáticos. ABAB, AABB, ABC y más.</p>
</section>
<div class="container" style="padding:20px 16px">
  <div class="cards-grid">${catCards}</div>
</div>
<footer class="site-footer"><div class="container footer-inner"><p>© 2025 ChartKids</p></div></footer>
</body></html>`);

if(sitemapLines.length>0){
  const sm=fs.readFileSync('sitemap.xml','utf8');
  const updated=sm.replace('</urlset>',
    '  <url><loc>https://chartkids.com/patterns/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
    +sitemapLines.join('\n')+'\n</urlset>');
  fs.writeFileSync('sitemap.xml',updated);
  console.log(`✓ sitemap +${sitemapLines.length+1}`);
}
console.log(`\n✓ Built: ${built}  Skipped: ${skipped}`);
