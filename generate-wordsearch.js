'use strict';
// generate-wordsearch.js — 72 word search puzzles (12 categories × 6 difficulty levels)
const fs   = require('fs');
const path = require('path');

const CAT_COLORS={animals:'#16a34a',dinosaurs:'#dc2626',vehicles:'#2563eb',space:'#7c3aed',
  superheroes:'#e11d48',fantasy:'#db2777',jobs:'#0891b2',sports:'#0284c7',
  food:'#ea580c',nature:'#65a30d',holidays:'#9333ea',pets:'#c2410c'};
const CAT_ES={animals:'Animales',dinosaurs:'Dinosaurios',vehicles:'Vehículos',space:'Espacio',
  superheroes:'Superhéroes',fantasy:'Fantasía',jobs:'Trabajos',sports:'Deportes',
  food:'Comida',nature:'Naturaleza',holidays:'Días Festivos',pets:'Mascotas'};

const WORD_BANK={
  animals:   ['LION','BEAR','WOLF','FISH','FROG','DUCK','DEER','OWL','ELK','CRAB','SEAL','HAWK','SNAKE','TIGER','EAGLE','SHARK','HORSE','ZEBRA','PANDA','KOALA','WHALE','PARROT','RABBIT'],
  dinosaurs: ['REX','CLAW','BONE','FERN','NEST','EGGS','HORN','TAIL','ROAR','HERD','CREST','SPINE','RAPTOR','FOSSIL','SCALES','METEOR','JUNGLE','SWAMP','TREX','STEGO','PTERO','BRACHIO','VOLCANO'],
  vehicles:  ['CAR','BUS','VAN','JET','SHIP','BIKE','TRAM','TAXI','JEEP','PLANE','TRUCK','TRAIN','YACHT','ROCKET','BLIMP','CANOE','FERRY','CABLE','SCOOT','GLIDER','SUBMARINE'],
  space:     ['SUN','MOON','STAR','MARS','COMET','ORBIT','ALIEN','NOVA','PROBE','CRATER','SATURN','NEBULA','GALAXY','METEOR','ECLIPSE','LAUNCH','SIGNAL','TELESCOPE'],
  superheroes:['HERO','CAPE','MASK','FIST','BOLT','SAVE','JUMP','FAST','SMART','BRAVE','POWER','SHIELD','FLIGHT','ARMOR','LASER','STEALTH'],
  fantasy:   ['ELF','IMP','ORC','MAGE','WAND','SPELL','CROWN','FAIRY','MAGIC','GNOME','DWARF','DRAGON','CASTLE','KNIGHT','POTION','SCROLL','UNICORN','WIZARD'],
  jobs:      ['CHEF','NURSE','PILOT','COACH','BAKER','GUARD','JUDGE','CLERK','MINER','RANGER','DRIVER','FARMER','DOCTOR','POLICE','ARTIST','TEACHER','ENGINEER'],
  sports:    ['RUN','SWIM','KICK','JUMP','RACE','GOAL','PLAY','DIVE','SURF','SKATE','SCORE','MATCH','COURT','TRACK','SPRINT','HURDLE','TROPHY','STADIUM'],
  food:      ['PIE','CAKE','MILK','RICE','CORN','SOUP','TACO','SODA','BEEF','FISH','FRUIT','BREAD','PIZZA','SALAD','SUGAR','HONEY','CHEESE','NOODLE','COOKIE'],
  nature:    ['RAIN','LEAF','ROSE','TREE','LAKE','WIND','SEED','MIST','SOIL','CLOUD','STORM','RIVER','OCEAN','FLOWER','FOREST','MEADOW','CANYON','SPRING'],
  holidays:  ['GIFT','SNOW','BELL','JACK','EGGS','STAR','CAKE','FLAG','CANDY','CAROL','HOLLY','BUNNY','TURKEY','LANTERN','COSTUME','FIREWORK','SNOWMAN','REINDEER'],
  pets:      ['DOG','CAT','BIRD','FISH','FROG','HAMSTER','RABBIT','LIZARD','TURTLE','PARROT','KITTEN','PUPPY','GERBIL','FERRET'],
};

// Difficulty → grid size, word count, directions
const DIFF=[
  {id:1,name:'easy',   label:'Fácil',   size:10,wc:6, dirs:['H','V']},
  {id:2,name:'easy',   label:'Fácil',   size:10,wc:7, dirs:['H','V']},
  {id:3,name:'medium', label:'Medio',   size:12,wc:9, dirs:['H','V','D']},
  {id:4,name:'medium', label:'Medio',   size:12,wc:10,dirs:['H','V','D']},
  {id:5,name:'hard',   label:'Difícil', size:15,wc:12,dirs:['H','V','D','R']},
  {id:6,name:'hard',   label:'Difícil', size:15,wc:12,dirs:['H','V','D','R']},
];

function seededRng(seed){let s=seed|0;return()=>{s=(s*1664525+1013904223)>>>0;return s/0xFFFFFFFF};}

function placeWords(size,words,dirs,rng){
  const grid=Array.from({length:size},()=>Array(size).fill(''));
  const placed=[];
  const DX={H:1,V:0,D:1,R:-1};
  const DY={H:0,V:1,D:1,R:1};

  for(const word of words){
    let ok=false;
    for(let attempt=0;attempt<200&&!ok;attempt++){
      const dir=dirs[Math.floor(rng()*dirs.length)];
      const dx=DX[dir],dy=DY[dir];
      const len=word.length;
      const maxR=size-(len*Math.abs(dy));
      const maxC=dir==='R'?size-1:size-(len*Math.abs(dx));
      const r=Math.floor(rng()*Math.max(1,maxR));
      const c=dir==='R'?Math.floor(rng()*(size-(len-1))):Math.floor(rng()*Math.max(1,maxC));
      // Check fits
      let fits=true;
      for(let i=0;i<len;i++){
        const nr=r+i*dy,nc=c+i*dx;
        if(nr<0||nr>=size||nc<0||nc>=size){fits=false;break;}
        if(grid[nr][nc]&&grid[nr][nc]!==word[i]){fits=false;break;}
      }
      if(fits){
        for(let i=0;i<len;i++) grid[r+i*dy][c+i*dx]=word[i];
        placed.push({word,r,c,dir});
        ok=true;
      }
    }
  }
  // Fill blanks with random letters
  const ALPHA='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for(let r=0;r<size;r++) for(let c=0;c<size;c++)
    if(!grid[r][c]) grid[r][c]=ALPHA[Math.floor(rng()*26)];
  return {grid,placed};
}

function buildSVG(cat,level,words,grid,placed,catColor){
  const size=grid.length;
  const W=500,H=650;
  const cellW=Math.min(26,Math.floor(380/size));
  const cellH=cellW;
  const mX=Math.round((W-size*cellW)/2);
  const mY=115;
  const diffLabel=level.label;

  // Grid cells
  let cells='';
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      const x=mX+c*cellW, y=mY+r*cellH;
      cells+=`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="white" stroke="#e2e8f0" stroke-width=".5"/>`;
      cells+=`<text x="${x+cellW/2}" y="${y+cellH*0.72}" text-anchor="middle" font-size="${cellW*0.6}" font-weight="700" fill="#1e293b" font-family="Nunito,Arial,sans-serif">${grid[r][c]}</text>`;
    }
  }

  // Word list at bottom
  const wordY=mY+size*cellH+18;
  const cols=Math.ceil(words.length/2);
  const colW=Math.floor(480/cols);
  let wordList='';
  words.forEach((w,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    wordList+=`<text x="${16+col*colW}" y="${wordY+row*18}" font-size="11" font-weight="700" fill="#475569" font-family="Nunito,Arial,sans-serif">• ${w}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<defs><style>text{font-family:Nunito,Arial,sans-serif}</style></defs>
<rect width="${W}" height="${H}" fill="#f8fafc"/>
<rect width="${W}" height="${H}" fill="white" opacity=".8"/>
<rect width="${W}" height="100" fill="${catColor}"/>
<text x="250" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="800" opacity=".85">SOPA DE LETRAS · ${CAT_ES[cat]?.toUpperCase()||cat.toUpperCase()}</text>
<text x="250" y="58" text-anchor="middle" font-size="22" fill="white" font-weight="900">Busca las ${words.length} palabras</text>
<text x="250" y="80" text-anchor="middle" font-size="10" fill="white" opacity=".85">Nivel ${diffLabel} · Tamaño ${size}×${size} · chartkids.com</text>

<rect x="${mX-2}" y="${mY-2}" width="${size*cellW+4}" height="${size*cellH+4}" rx="4" fill="#e2e8f0"/>
${cells}

${wordList}
<text x="250" y="${H-8}" text-anchor="middle" font-size="8" fill="#94a3b8">Imprimible gratuito · chartkids.com/wordsearch/</text>
</svg>`;
}

function buildPage(cat,level,words,grid,placed,catColor){
  const catEs=CAT_ES[cat]||cat;
  const svg=buildSVG(cat,level,words,grid,placed,catColor);
  const minSvg=svg.replace(/\n/g,' ').replace(/\s{2,}/g,' ');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sopa de Letras ${catEs} — ${level.label} | ChartKids</title>
<meta name="description" content="Sopa de letras de ${catEs} nivel ${level.label}. ${words.length} palabras para encontrar.">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>@media print{header,.page-actions,.page-sidebar,footer{display:none!important}}</style>
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav"><a href="/wordsearch/" class="active">Sopa de Letras</a><a href="/maze/">Laberintos</a></nav>
</div></header>
<main class="container page-layout">
  <div class="page-main">
    <h1>🔤 Sopa de Letras: ${catEs}</h1>
    <div style="margin-bottom:12px"><span class="pill" style="background:${catColor}20;color:${catColor}">${level.label}</span><span class="pill">${words.length} palabras</span></div>
    <div class="print-area" style="max-width:540px;margin:0 auto">${minSvg}</div>
    <div class="page-actions">
      <button onclick="window.print()" class="btn-print">🖨️ Imprimir</button>
      <a href="/wordsearch/" class="btn-secondary">Más sopas</a>
    </div>
  </div>
  <aside class="page-sidebar">
    <div class="sidebar-promo">
      <a href="/tracing/" class="promo-link">✏️ Trazado</a>
      <a href="/counting/" class="promo-link">🔢 Contar</a>
      <a href="/patterns/" class="promo-link">🔷 Patrones</a>
      <a href="/maze/" class="promo-link">🌀 Laberintos</a>
    </div>
  </aside>
</main>
<footer class="site-footer"><div class="container footer-inner"><p>© 2025 ChartKids</p></div></footer>
</body>
</html>`;
}

let built=0,skipped=0;
const sitemapLines=[];
const catCards=[];

for(const [cat,bank] of Object.entries(WORD_BANK)){
  const catColor=CAT_COLORS[cat]||'#7c3aed';
  const catEs=CAT_ES[cat]||cat;
  for(const level of DIFF){
    const slug=`wordsearch-${cat}-${level.name}-${level.id}`;
    const dir=path.join('wordsearch',slug);
    const htmlPath=path.join(dir,'index.html');
    if(fs.existsSync(htmlPath)){skipped++;continue;}
    const rng=seededRng(cat.length*100+level.id*17+31);
    // Pick words
    const shuffled=[...bank].sort(()=>rng()-0.5);
    const words=shuffled.slice(0,level.wc).map(w=>w.toUpperCase());
    // Only use words that fit in grid
    const fitWords=words.filter(w=>w.length<=level.size);
    const {grid,placed}=placeWords(level.size,fitWords,level.dirs,rng);
    const html=buildPage(cat,level,fitWords,grid,placed,catColor);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(htmlPath,html);
    console.log(`  build ${slug}`);
    built++;
    sitemapLines.push(`  <url><loc>https://chartkids.com/wordsearch/${slug}/</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
    if(level.id===1) catCards.push(`<a class="card" href="/wordsearch/${slug}/" style="border-top:4px solid ${catColor}">
      <div class="card-title">${catEs}</div><div class="card-age">6 niveles</div></a>`);
  }
}

// Build index
const indexHtml=`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sopa de Letras para Niños | ChartKids</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav"><a href="/wordsearch/" class="active">Sopa de Letras</a><a href="/maze/">Laberintos</a></nav>
</div></header>
<section style="background:#0284c7;color:white;padding:24px;text-align:center">
  <h1 style="font-size:2rem;margin-bottom:6px">🔤 Sopa de Letras</h1>
  <p>72 sopas de letras en 12 categorías. Niveles Fácil, Medio y Difícil.</p>
</section>
<div class="container" style="padding:20px 16px">
  <div class="cards-grid">${catCards.join('')}</div>
</div>
<footer class="site-footer"><div class="container footer-inner"><p>© 2025 ChartKids</p></div></footer>
</body>
</html>`;
fs.mkdirSync('wordsearch',{recursive:true});
fs.writeFileSync(path.join('wordsearch','index.html'),indexHtml);

if(sitemapLines.length>0){
  const sm=fs.readFileSync('sitemap.xml','utf8');
  const updated=sm.replace('</urlset>',
    '  <url><loc>https://chartkids.com/wordsearch/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
    +sitemapLines.join('\n')+'\n</urlset>');
  fs.writeFileSync('sitemap.xml',updated);
  console.log(`✓ sitemap +${sitemapLines.length+1}`);
}
console.log(`\n✓ Built: ${built}  Skipped: ${skipped}`);
