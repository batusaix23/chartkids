'use strict';
// generate-numbers-v2.js — Color by Numbers using real OpenMoji color SVGs
// Downloads color SVGs, replaces fills with white + numbered labels
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const pages = require('./master-numbers-72.json');

const CACHE_DIR = path.join(__dirname, 'generated', 'svgs', 'openmoji-color');
fs.mkdirSync(CACHE_DIR, {recursive:true});

// Emoji hex codes for each numbers page slug
const EMOJI_MAP = {
  'lion-by-numbers-numbers':             '1F981',
  'elephant-by-numbers-numbers':         '1F418',
  'parrot-by-numbers-numbers':           '1F99C',
  'zebra-by-numbers-numbers':            '1F993',
  'underwater-scene-by-numbers-numbers': '1F41F',
  'safari-by-numbers-numbers':           '1F98D',
  'baby-t-rex-by-numbers-numbers':       '1F996',
  'dino-friends-by-numbers-numbers':     '1F995',
  'stegosaurus-by-numbers-numbers':      '1F995',
  'dino-volcano-by-numbers-numbers':     '1F30B',
  'dino-battle-by-numbers-numbers':      '1F996',
  'jurassic-scene-by-numbers-numbers':   '1F995',
  'race-car-by-numbers-numbers':         '1F3CE',
  'fire-truck-by-numbers-numbers':       '1F692',
  'airplane-by-numbers-numbers':         '2708',
  'city-traffic-by-numbers-numbers':     '1F697',
  'train-by-numbers-numbers':            '1F682',
  'space-rocket-by-numbers-numbers':     '1F680',
  'planet-earth-by-numbers-numbers':     '1F30D',
  'rocket-by-numbers-numbers':           '1F680',
  'astronaut-by-numbers-numbers':        '1F9D1',
  'saturn-by-numbers-numbers':           '1FA90',
  'space-scene-by-numbers-numbers':      '2728',
  'galaxy-by-numbers-numbers':           '1F30C',
  'hero-by-numbers-numbers':             '1F9B8',
  'superhero-city-by-numbers-numbers':   '1F3D9',
  'hero-team-by-numbers-numbers':        '1F9B8',
  'robot-hero-by-numbers-numbers':       '1F916',
  'action-scene-by-numbers-numbers':     '1F9B8',
  'hero-battle-by-numbers-numbers':      '1F916',
  'unicorn-by-numbers-numbers':          '1F984',
  'princess-by-numbers-numbers':         '1F478',
  'dragon-by-numbers-numbers':           '1F432',
  'fairy-by-numbers-numbers':            '1F9DA',
  'castle-by-numbers-numbers':           '1F3F0',
  'magic-kingdom-by-numbers-numbers':    '1F9DA',
  'firefighter-by-numbers-numbers':      '1F9D1',
  'doctor-by-numbers-numbers':           '1F9D1',
  'chef-by-numbers-numbers':             '1F9D1',
  'farmer-by-numbers-numbers':           '1F9D1',
  'scientist-by-numbers-numbers':        '1F9D1',
  'busy-city-by-numbers-numbers':        '1F3D9',
  'soccer-by-numbers-numbers':           '26BD',
  'swimmer-by-numbers-numbers':          '1F3CA',
  'cyclist-by-numbers-numbers':          '1F6B4',
  'gymnast-by-numbers-numbers':          '1F938',
  'sports-scene-by-numbers-numbers':     '1F3C6',
  'olympic-games-by-numbers-numbers':    '1F947',
  'fruit-bowl-by-numbers-numbers':       '1F34E',
  'pizza-by-numbers-numbers':            '1F355',
  'cupcake-by-numbers-numbers':          '1F9C1',
  'kitchen-by-numbers-numbers':          '1F373',
  'smoothie-by-numbers-numbers':         '1F964',
  'feast-by-numbers-numbers':            '1F37D',
  'rainbow-by-numbers-numbers':          '1F308',
  'garden-by-numbers-numbers':           '1F33A',
  'seasons-by-numbers-numbers':          '1F341',
  'forest-by-numbers-numbers':           '1F332',
  'mountains-by-numbers-numbers':        '1F3D4',
  'wild-nature-by-numbers-numbers':      '1F33F',
  'christmas-by-numbers-numbers':        '1F384',
  'halloween-by-numbers-numbers':        '1F383',
  'easter-by-numbers-numbers':           '1F430',
  'birthday-by-numbers-numbers':         '1F382',
  'new-year-by-numbers-numbers':         '1F386',
  'holiday-parade-by-numbers-numbers':   '1F389',
  'puppy-by-numbers-numbers':            '1F415',
  'kitten-by-numbers-numbers':           '1F408',
  'bunny-by-numbers-numbers':            '1F407',
  'bird-by-numbers-numbers':             '1F426',
  'butterfly-by-numbers-numbers':        '1F98B',
  'pet-parade-by-numbers-numbers':       '1F43E',
};

// 14-color simplified palette
const PAL = [
  null,
  {h:'#FF3333',n:'Rojo'},        // 1
  {h:'#FF8800',n:'Naranja'},     // 2
  {h:'#FFD700',n:'Amarillo'},    // 3
  {h:'#77CC33',n:'Verde Lima'},  // 4
  {h:'#228833',n:'Verde'},       // 5
  {h:'#66CCFF',n:'Azul Claro'},  // 6
  {h:'#2244CC',n:'Azul'},        // 7
  {h:'#9922CC',n:'Morado'},      // 8
  {h:'#FF77BB',n:'Rosa'},        // 9
  {h:'#7B4F2E',n:'Café'},        // 10
  {h:'#F5F5F5',n:'Blanco'},      // 11
  {h:'#AAAAAA',n:'Gris'},        // 12
  {h:'#FFCC88',n:'Durazno'},     // 13
  {h:'#AADDFF',n:'Celeste'},     // 14
];

const CAT_COLORS = {
  animals:'#16a34a',dinosaurs:'#dc2626',vehicles:'#2563eb',space:'#7c3aed',
  superheroes:'#e11d48',fantasy:'#db2777',jobs:'#0891b2',sports:'#0284c7',
  food:'#ea580c',nature:'#65a30d',holidays:'#9333ea',pets:'#c2410c',
};

function hexToRgb(h) {
  const c = h.replace('#','');
  return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];
}
function colorDist(a,b) {
  const ra=hexToRgb(a),rb=hexToRgb(b);
  return Math.sqrt((ra[0]-rb[0])**2+(ra[1]-rb[1])**2+(ra[2]-rb[2])**2);
}
function nearestPal(hex) {
  if (!hex || hex==='none' || hex.startsWith('url')) return 0;
  // normalize to 6-char hex
  let h = hex.trim().toLowerCase();
  if (h.startsWith('#')) {
    if (h.length===4) h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
  } else if (/^[0-9a-f]{3,6}$/.test(h)) {
    h = '#'+(h.length===3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h);
  } else {
    // named color — use rough heuristic
    const named = {
      black:'#111111',white:'#ffffff',red:'#ff0000',blue:'#0000ff',green:'#00aa00',
      yellow:'#ffff00',orange:'#ff8800',purple:'#880088',pink:'#ffaacc',brown:'#885522',
      gray:'#888888',grey:'#888888',none:null
    };
    h = named[h] || '#888888';
  }
  let minD=Infinity, best=12;
  for (let i=1;i<PAL.length;i++) {
    const d=colorDist(h,PAL[i].h);
    if (d<minD){minD=d;best=i;}
  }
  return best;
}

function fetchSvg(hexCode) {
  const cacheFile = path.join(CACHE_DIR, `${hexCode}.svg`);
  if (fs.existsSync(cacheFile)) return Promise.resolve(fs.readFileSync(cacheFile,'utf8'));
  const url = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${hexCode}.svg`;
  return new Promise((resolve,reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      if (res.statusCode===301||res.statusCode===302) {
        return fetchSvgFromUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data='';
      res.on('data',d=>data+=d);
      res.on('end',()=>{
        if (res.statusCode===200 && data.includes('<svg')) {
          fs.writeFileSync(cacheFile,data);
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      res.on('error',reject);
    }).on('error',reject);
  });
}

function parseSvgRegions(svgText) {
  // Extract elements with fill colors and approximate centers
  const regions = [];
  const seenFills = new Set();

  // Match all SVG shape elements
  const elRe = /<(path|circle|ellipse|rect|polygon|polyline)([^>]*?)(?:\/>|>(?:<\/\1>)?)/g;
  let m;
  while ((m = elRe.exec(svgText)) !== null) {
    const tag   = m[1];
    const attrs = m[2];

    // Get fill
    let fill = null;
    const fillM = attrs.match(/\bfill="([^"]+)"/);
    if (fillM) fill = fillM[1];
    if (!fill || fill==='none' || fill.startsWith('url(')) continue;
    if (fill==='#000000'||fill==='#000'||fill==='black') continue; // skip pure black outlines

    // Approx center
    let cx=36, cy=36;
    if (tag==='circle') {
      const cxM=attrs.match(/\bcx="([^"]+)"/), cyM=attrs.match(/\bcy="([^"]+)"/);
      if(cxM)cx=parseFloat(cxM[1]); if(cyM)cy=parseFloat(cyM[1]);
    } else if (tag==='rect') {
      const xM=attrs.match(/\bx="([^"]+)"/),yM=attrs.match(/\by="([^"]+)"/),
            wM=attrs.match(/\bwidth="([^"]+)"/),hM=attrs.match(/\bheight="([^"]+)"/);
      const x=xM?parseFloat(xM[1]):0, y=yM?parseFloat(yM[1]):0;
      const w=wM?parseFloat(wM[1]):72, h=hM?parseFloat(hM[1]):72;
      cx=x+w/2; cy=y+h/2;
    } else if (tag==='ellipse') {
      const cxM=attrs.match(/\bcx="([^"]+)"/),cyM=attrs.match(/\bcy="([^"]+)"/);
      if(cxM)cx=parseFloat(cxM[1]); if(cyM)cy=parseFloat(cyM[1]);
    } else {
      // path / polygon: extract all numbers, average visible coordinate pairs
      const dAttr = attrs.match(/\bd="([^"]+)"/)||attrs.match(/\bpoints="([^"]+)"/);
      if (dAttr) {
        const nums = dAttr[1].match(/-?[\d.]+(?:e[-+]?\d+)?/gi)||[];
        const xs=[],ys=[];
        for(let i=0;i<nums.length-1;i+=2){
          const x=parseFloat(nums[i]),y=parseFloat(nums[i+1]);
          if(!isNaN(x)&&!isNaN(y)&&x>=0&&x<=72&&y>=0&&y<=72){xs.push(x);ys.push(y);}
        }
        if(xs.length){cx=xs.reduce((a,b)=>a+b,0)/xs.length; cy=ys.reduce((a,b)=>a+b,0)/ys.length;}
      }
    }

    const palNum = nearestPal(fill);
    if (!palNum) continue;

    // Group: one label per palette color number
    if (!seenFills.has(palNum)) {
      seenFills.add(palNum);
      regions.push({palNum, fill, cx, cy, elStr: `<${tag}${attrs}/>`});
    } else {
      // Already have this color — still record position but no extra label
      regions.push({palNum, fill, cx, cy, elStr: `<${tag}${attrs}/>`, noLabel:true});
    }
  }
  return regions;
}

function transformSvgToWorksheet(svgText, regions, scale, tx, ty) {
  // Build modified SVG: white fills, dark outlines, all elements
  const elRe = /<(path|circle|ellipse|rect|polygon|polyline)([^>]*?)(?:\/>|>(?:<\/\1>)?)/g;
  let result = '';
  let m;
  while ((m = elRe.exec(svgText)) !== null) {
    const tag = m[1];
    let attrs = m[2];
    // Replace fill with white
    if (/\bfill="/.test(attrs)) {
      attrs = attrs.replace(/\bfill="[^"]*"/, 'fill="white"');
    } else {
      attrs += ' fill="white"';
    }
    // Ensure dark stroke for outlines
    if (!/\bstroke="/.test(attrs)||/\bstroke="none"/.test(attrs)) {
      attrs = attrs.replace(/\bstroke="[^"]*"/, '');
      attrs += ` stroke="#333" stroke-width="0.4"`;
    } else {
      // normalize existing stroke width (divide by 1 — keep original, it'll scale)
    }
    result += `<${tag}${attrs}/>`;
  }
  return result;
}

function buildLegend(usedNums) {
  const nums=[...new Set(usedNums)].filter(n=>n>0).sort((a,b)=>a-b);
  const cols=Math.min(nums.length,5), cw=Math.floor(490/cols), ch=32;
  const sy=510;
  let svg='';
  nums.forEach((n,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const x=5+col*cw, y=sy+row*ch;
    const c=PAL[n];
    svg+=`<rect x="${x}" y="${y}" width="24" height="24" rx="4" fill="${c.h}" stroke="#333" stroke-width="1.5"/>`;
    svg+=`<text x="${x+12}" y="${y+15.5}" text-anchor="middle" font-size="10" font-weight="bold" fill="${n===11?'#999':'#222'}">${n}</text>`;
    svg+=`<text x="${x+30}" y="${y+16}" font-size="11" fill="#333" font-family="Nunito,Arial,sans-serif">${c.n}</text>`;
  });
  return {svg, rows:Math.ceil(nums.length/cols)};
}

async function buildPage(page) {
  const hex = EMOJI_MAP[page.slug];
  if (!hex) return null;
  const catColor = CAT_COLORS[page.category]||'#7c3aed';
  const diffLabel = {easy:'Fácil',medium:'Medio',hard:'Difícil'}[page.difficulty]||page.difficulty;

  let svgText;
  try { svgText = await fetchSvg(hex); } catch(e) {
    console.warn(`  WARN fetch failed ${page.slug} (${hex}): ${e.message}`);
    return null;
  }

  const regions = parseSvgRegions(svgText);
  const usedNums = [...new Set(regions.map(r=>r.palNum))];

  // Scale OpenMoji from 72x72 to fit 430x410 drawing area
  const SCALE = 5.5;
  const TX = Math.round((500 - 72*SCALE)/2);
  const TY = 95;

  const { svg: legendSvg, rows: legendRows } = buildLegend(usedNums);
  const totalH = 510 + legendRows*32 + 16;

  // Modified paths (white fills + outlines)
  const pathsSvg = transformSvgToWorksheet(svgText, regions, SCALE, TX, TY);

  // Number labels (in worksheet coordinate space = original coords * SCALE + T)
  const labelsSet = new Set();
  let labelsSvg = '';
  for (const r of regions) {
    if (r.noLabel) continue;
    const key = `${r.palNum}`;
    if (labelsSet.has(key)) continue;
    labelsSet.add(key);
    const lx = Math.round(TX + r.cx * SCALE);
    const ly = Math.round(TY + r.cy * SCALE);
    const c = PAL[r.palNum];
    labelsSvg += `<circle cx="${lx}" cy="${ly}" r="11" fill="${c.h}" stroke="#333" stroke-width="1.5"/>`;
    labelsSvg += `<text x="${lx}" y="${ly+4.5}" text-anchor="middle" font-size="11" font-weight="bold" fill="${r.palNum===11?'#999':'#111'}" font-family="Nunito,Arial,sans-serif">${r.palNum}</text>`;
  }

  const svgOut = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 ${totalH}">
<defs><style>text{font-family:Nunito,Arial,sans-serif}</style></defs>
<rect width="500" height="${totalH}" fill="#f9fafb"/>
<rect width="500" height="${totalH}" fill="white" opacity=".8"/>
<!-- Header -->
<rect width="500" height="90" fill="${catColor}"/>
<text x="250" y="32" text-anchor="middle" font-size="9" fill="white" font-weight="800" opacity=".85">${page.category.toUpperCase()} · COLOREAR POR NÚMEROS</text>
<text x="250" y="58" text-anchor="middle" font-size="22" fill="white" font-weight="900">${page.title}</text>
<text x="250" y="78" text-anchor="middle" font-size="10" fill="white" opacity=".85">Nivel ${diffLabel} · Edad ${page.age} · chartkids.com</text>
<!-- Drawing: scaled OpenMoji with white fills -->
<g transform="translate(${TX},${TY}) scale(${SCALE})">
  ${pathsSvg}
</g>
<!-- Color number labels (worksheet space) -->
${labelsSvg}
<!-- Legend background -->
<rect x="3" y="505" width="494" height="${legendRows*32+12}" rx="8" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1.5"/>
<text x="14" y="501" font-size="10" font-weight="800" fill="#64748b">CLAVE DE COLORES:</text>
${legendSvg}
</svg>`;

  const htmlOut = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.title} | Colorear por Números ChartKids</title>
<meta name="description" content="Colorea ${page.title} por números. Nivel ${diffLabel} para ${page.age} años. Imprimible gratis.">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>
.instruction-box{background:#fffbeb;border:2px solid #fde68a;border-radius:10px;padding:10px 14px;font-size:.85rem;color:#92400e;margin:12px 0}
</style>
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav">
    <a href="/numbers/" class="active">Por Números</a>
    <a href="/maze/">Laberintos</a>
    <a href="/dots/">Une Puntos</a>
    <a href="/blog/">Blog</a>
  </nav>
</div></header>
<main class="container page-layout">
  <div class="page-main">
    <h1>${page.title}</h1>
    <div class="instruction-box">
      🎨 <strong>Instrucciones:</strong> Mira la clave de colores al pie. Colorea cada región con el color que corresponde a su número.
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <span class="pill" style="background:${catColor}20;color:${catColor}">${diffLabel}</span>
      <span class="pill">Edad ${page.age}</span>
      <span class="pill">${page.category}</span>
    </div>
    <div class="print-area" style="max-width:540px;margin:0 auto">${svgOut.replace(/\n/g,' ').replace(/\s{2,}/g,' ')}</div>
    <div class="page-actions">
      <button onclick="window.print()" class="btn-print">🖨️ Imprimir</button>
      <a href="/numbers/" class="btn-secondary">Ver más actividades</a>
    </div>
  </div>
  <aside class="page-sidebar">
    <div class="sidebar-promo">
      <a href="/maze/" class="promo-link">🌀 Laberintos</a>
      <a href="/dots/" class="promo-link">✨ Une los Puntos</a>
      <a href="/tracing/" class="promo-link">✏️ Trazado</a>
      <a href="/wordsearch/" class="promo-link">🔤 Sopa de Letras</a>
      <a href="/counting/" class="promo-link">🔢 Contar</a>
    </div>
  </aside>
</main>
<footer class="site-footer"><div class="container footer-inner">
  <p>© 2025 ChartKids · chartkids.com</p>
</div></footer>
<style>@media print{header,.page-actions,.page-sidebar,footer{display:none!important}.print-area{max-width:100%!important}}</style>
</body>
</html>`;

  return { svgOut, htmlOut };
}

async function main() {
  const args = process.argv.slice(2);
  const FORCE = args.includes('--force');
  let built=0, skipped=0;

  for (const page of pages) {
    const dir = path.join('numbers', page.slug);
    const htmlPath = path.join(dir, 'index.html');
    if (!FORCE && fs.existsSync(htmlPath)) { skipped++; continue; }

    process.stdout.write(`  build [${page.id}] ${page.title}... `);
    try {
      const result = await buildPage(page);
      if (!result) { console.log('skip (no emoji)'); skipped++; continue; }
      fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(htmlPath, result.htmlOut);
      const svgDir = path.join('generated','svgs','numbers');
      fs.mkdirSync(svgDir,{recursive:true});
      fs.writeFileSync(path.join(svgDir,`${page.slug}.svg`), result.svgOut);
      console.log('✓');
      built++;
    } catch(e) {
      console.log(`ERROR: ${e.message}`);
      skipped++;
    }
  }
  console.log(`\n✓ Built: ${built}  Skipped: ${skipped}`);
}
main();
