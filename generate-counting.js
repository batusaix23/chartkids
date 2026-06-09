'use strict';
// generate-counting.js — Counting worksheets using emoji objects
const fs   = require('fs');
const path = require('path');

const CAT_COLORS={animals:'#16a34a',dinosaurs:'#dc2626',vehicles:'#2563eb',space:'#7c3aed',
  superheroes:'#e11d48',fantasy:'#db2777',jobs:'#0891b2',sports:'#0284c7',
  food:'#ea580c',nature:'#65a30d',holidays:'#9333ea',pets:'#c2410c'};
const CAT_ES={animals:'Animales',dinosaurs:'Dinosaurios',vehicles:'Vehículos',space:'Espacio',
  superheroes:'Superhéroes',fantasy:'Fantasía',jobs:'Trabajos',sports:'Deportes',
  food:'Comida',nature:'Naturaleza',holidays:'Días Festivos',pets:'Mascotas'};

const ITEMS={
  animals:   ['🦁','🐘','🐒','🦒','🐧','🦜','🦊','🐺','🐋','🦅'],
  dinosaurs: ['🦕','🦖','🥚','🦴','🌋','🌿','🪨','⭐','🐾','🌴'],
  vehicles:  ['🚗','🚌','✈️','🚀','🚂','⛵','🚲','🚁','🛸','🚒'],
  space:     ['⭐','🌙','🪐','☄️','🚀','👨‍🚀','🌍','🔭','💫','🌌'],
  superheroes:['🦸','⚡','🛡️','✨','💥','🦹','🏆','💪','🎭','🧤'],
  fantasy:   ['🦄','🐲','✨','👑','🧚','🔮','🏰','🧙','💎','🗡️'],
  jobs:      ['👷','👨‍🍳','👩‍⚕️','👨‍✈️','👮','🚒','🏗️','🍽️','💊','📚'],
  sports:    ['⚽','🏀','🏈','⚾','🏐','🎾','🏑','🏓','🥇','🏆'],
  food:      ['🍕','🍎','🧁','🍦','🌮','🍜','🥐','🍰','🍇','🥕'],
  nature:    ['🌸','🌲','🌈','🦋','🌻','🍃','🌊','⛰️','🍄','🌙'],
  holidays:  ['🎄','🎃','🥚','🎁','⛄','🎉','🔔','🎆','🦃','💝'],
  pets:      ['🐶','🐱','🐰','🐠','🐦','🐹','🦎','🐢','🦜','🐾'],
};

// 6 levels per category: easy counts (1-5), medium (1-8), hard (1-10 + addition)
const LEVELS=[
  {id:1,name:'easy',   label:'Fácil',   maxN:5, type:'count'},
  {id:2,name:'easy',   label:'Fácil',   maxN:5, type:'count'},
  {id:3,name:'medium', label:'Medio',   maxN:8, type:'count'},
  {id:4,name:'medium', label:'Medio',   maxN:8, type:'count'},
  {id:5,name:'hard',   label:'Difícil', maxN:10,type:'add'},
  {id:6,name:'hard',   label:'Difícil', maxN:10,type:'add'},
];

function seededRng(seed){let s=seed|0;return()=>{s=(s*1664525+1013904223)>>>0;return s/0xFFFFFFFF};}

function buildSVG(cat,level,questions,catColor){
  const W=500,H=650;
  const nQ=questions.length;
  const qH=Math.floor((H-140)/nQ);

  let rows='';
  questions.forEach((q,i)=>{
    const y=110+i*qH;
    const emojis=q.items.map((e,j)=>{
      const ex=55+j*36, ey=y+qH/2;
      return `<text x="${ex}" y="${ey+14}" font-size="28" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${e}</text>`;
    }).join('');

    // Answer box
    const boxX=420, boxY=y+qH/2-20;
    let answerArea='';
    if(q.type==='count'){
      answerArea=`<rect x="${boxX}" y="${boxY}" width="48" height="38" rx="6" fill="white" stroke="${catColor}" stroke-width="2"/>
        <text x="${boxX+24}" y="${boxY+26}" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="Nunito,sans-serif">¿Cuántos?</text>`;
    } else {
      // Addition: group1 + group2 = ?
      const mid=Math.floor(q.items.length/2);
      const grp1=q.items.slice(0,mid).map((e,j)=>`<text x="${55+j*36}" y="${y+qH/2+14}" font-size="28" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${e}</text>`).join('');
      const grp2=q.items.slice(mid).map((e,j)=>`<text x="${55+(mid+j+1)*36}" y="${y+qH/2+14}" font-size="28" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${e}</text>`).join('');
      const plusX=55+mid*36;
      return `
        ${grp1}
        <text x="${plusX}" y="${y+qH/2+18}" font-size="22" font-weight="900" text-anchor="middle" fill="${catColor}" font-family="Nunito,sans-serif">+</text>
        ${grp2}
        <text x="${boxX-8}" y="${y+qH/2+18}" font-size="18" font-weight="900" text-anchor="end" fill="${catColor}" font-family="Nunito,sans-serif">=</text>
        <rect x="${boxX}" y="${boxY}" width="48" height="38" rx="6" fill="white" stroke="${catColor}" stroke-width="2"/>`;
    }

    rows+=`
      <rect x="10" y="${y+4}" width="480" height="${qH-8}" rx="8" fill="${i%2===0?'#f8fafc':'white'}" stroke="#e2e8f0" stroke-width="1"/>
      <text x="16" y="${y+qH/2+6}" font-size="18" font-weight="900" fill="${catColor}" font-family="Nunito,sans-serif">${i+1}.</text>
      ${emojis}
      ${answerArea}`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<defs><style>text{font-family:Nunito,Arial,sans-serif}</style></defs>
<rect width="${W}" height="${H}" fill="#f9fafb"/>
<rect width="${W}" height="${H}" fill="white" opacity=".8"/>
<rect width="${W}" height="100" fill="${catColor}"/>
<text x="250" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="800" opacity=".85">CONTEO · ${CAT_ES[cat]?.toUpperCase()||cat.toUpperCase()}</text>
<text x="250" y="58" text-anchor="middle" font-size="22" fill="white" font-weight="900">¿Cuántos hay?</text>
<text x="250" y="80" text-anchor="middle" font-size="10" fill="white" opacity=".85">Nivel ${level.label} · chartkids.com</text>
${rows}
<text x="250" y="${H-8}" text-anchor="middle" font-size="8" fill="#94a3b8">Imprimible gratuito · chartkids.com/counting/</text>
</svg>`;
}

let built=0,skipped=0;
const sitemapLines=[];

for(const [cat,itemArr] of Object.entries(ITEMS)){
  const catColor=CAT_COLORS[cat]||'#7c3aed';
  const catEs=CAT_ES[cat]||cat;
  for(const level of LEVELS){
    const slug=`counting-${cat}-${level.name}-${level.id}`;
    const dir=path.join('counting',slug);
    const htmlPath=path.join(dir,'index.html');
    if(fs.existsSync(htmlPath)){skipped++;continue;}

    const rng=seededRng(cat.length*50+level.id*13+7);
    const nQ=5;
    const questions=[];
    for(let qi=0;qi<nQ;qi++){
      const count=1+Math.floor(rng()*level.maxN);
      const emoji=itemArr[Math.floor(rng()*itemArr.length)];
      const type=level.type==='add'&&qi>2?'add':'count';
      questions.push({type,items:Array(count).fill(emoji)});
    }

    const svg=buildSVG(cat,level,questions,catColor);
    const minSvg=svg.replace(/\n/g,' ').replace(/\s{2,}/g,' ');
    const html=`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Conteo ${catEs} ${level.label} | ChartKids</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>@media print{header,.page-actions,.page-sidebar,footer{display:none!important}}</style>
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav"><a href="/counting/" class="active">Conteo</a><a href="/maze/">Laberintos</a></nav>
</div></header>
<main class="container page-layout">
  <div class="page-main">
    <h1>🔢 Conteo: ${catEs}</h1>
    <div style="margin:8px 0"><span class="pill" style="background:${catColor}20;color:${catColor}">${level.label}</span></div>
    <div class="print-area" style="max-width:540px;margin:0 auto">${minSvg}</div>
    <div class="page-actions">
      <button onclick="window.print()" class="btn-print">🖨️ Imprimir</button>
      <a href="/counting/" class="btn-secondary">Más fichas</a>
    </div>
  </div>
  <aside class="page-sidebar">
    <div class="sidebar-promo">
      <a href="/tracing/" class="promo-link">✏️ Trazado</a>
      <a href="/wordsearch/" class="promo-link">🔤 Sopa de Letras</a>
      <a href="/patterns/" class="promo-link">🔷 Patrones</a>
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
    sitemapLines.push(`  <url><loc>https://chartkids.com/counting/${slug}/</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
  }
}

// Index
const catSections=Object.entries(ITEMS).map(([cat])=>{
  const color=CAT_COLORS[cat];
  return `<a class="card" href="/counting/counting-${cat}-easy-1/" style="border-top:4px solid ${color}">
    <div class="card-title">${CAT_ES[cat]||cat}</div><div class="card-age">6 niveles</div></a>`;
}).join('');

fs.mkdirSync('counting',{recursive:true});
fs.writeFileSync(path.join('counting','index.html'),`<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fichas de Conteo | ChartKids</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head><body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav"><a href="/counting/" class="active">Conteo</a></nav>
</div></header>
<section style="background:#0891b2;color:white;padding:24px;text-align:center">
  <h1 style="font-size:2rem;margin-bottom:6px">🔢 Fichas de Conteo</h1>
  <p>72 fichas de contar objetos. ¿Cuántos hay? Para Pre-K a Primaria.</p>
</section>
<div class="container" style="padding:20px 16px">
  <div class="cards-grid">${catSections}</div>
</div>
<footer class="site-footer"><div class="container footer-inner"><p>© 2025 ChartKids</p></div></footer>
</body></html>`);

if(sitemapLines.length>0){
  const sm=fs.readFileSync('sitemap.xml','utf8');
  const updated=sm.replace('</urlset>',
    '  <url><loc>https://chartkids.com/counting/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
    +sitemapLines.join('\n')+'\n</urlset>');
  fs.writeFileSync('sitemap.xml',updated);
  console.log(`✓ sitemap +${sitemapLines.length+1}`);
}
console.log(`\n✓ Built: ${built}  Skipped: ${skipped}`);
