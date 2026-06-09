#!/usr/bin/env node
// build-pages.js — reads SVGs from generated/svgs/coloring/ and builds HTML pages
// Usage: node build-pages.js [--category=animals] [--id=1] [--force]

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const PAGES_FILE = path.join(BASE_DIR, 'master-coloring-pages-300.json');
const SVG_DIR = path.join(BASE_DIR, 'generated', 'svgs', 'coloring');
const OUT_DIR = path.join(BASE_DIR, 'coloring');
const METADATA_FILE = path.join(BASE_DIR, 'generated', 'metadata-coloring-all.json');
const SITEMAP_FILE = path.join(BASE_DIR, 'sitemap.xml');

const args = process.argv.slice(2);
const CAT_FILTER = (args.find(a => a.startsWith('--category=')) || '').split('=')[1];
const ID_FILTER = parseInt((args.find(a => a.startsWith('--id=')) || '').split('=')[1]) || null;
const FORCE = args.includes('--force');

const pages = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'));

const CATEGORY_EMOJIS = {
  animals:'🦁', dinosaurs:'🦕', space:'🚀', vehicles:'🚗',
  food:'🍕', fantasy:'🐉', jobs:'👷', sports:'⚽',
  nature:'🌻', holidays:'🎄', superheroes:'🦸', pets:'🐾'
};
const CATEGORY_COLORS = {
  animals:'#22c55e', dinosaurs:'#ef4444', space:'#06b6d4', vehicles:'#f59e0b',
  food:'#f97316', fantasy:'#a78bfa', jobs:'#34d399', sports:'#3b82f6',
  nature:'#84cc16', holidays:'#ec4899', superheroes:'#f43f5e', pets:'#fb923c'
};
const CATEGORY_LABELS = {
  animals:'Animals', dinosaurs:'Dinosaurs', space:'Space', vehicles:'Vehicles',
  food:'Food & Fruits', fantasy:'Princesses & Fantasy', jobs:'Jobs & Careers', sports:'Sports',
  nature:'Nature & Seasons', holidays:'Holidays', superheroes:'Superheroes', pets:'Pets & Insects'
};

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }

function loadMetadata() {
  return fs.existsSync(METADATA_FILE) ? JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')) : {};
}
function saveMetadata(m) {
  ensureDir(path.dirname(METADATA_FILE));
  fs.writeFileSync(METADATA_FILE, JSON.stringify(m, null, 2));
}

function buildSEO(page) {
  const { title, category, age, difficulty } = page;
  const catLabel = CATEGORY_LABELS[category] || category;
  return {
    pageTitle: `Free ${title} Coloring Page for Kids — Print Instantly | ChartKids`,
    metaDesc: `Free printable ${title.toLowerCase()} coloring page for kids ages ${age}. ${difficulty.charAt(0).toUpperCase()+difficulty.slice(1)} level. Download and print instantly, no sign-up needed.`,
    keywords: `${title.toLowerCase()} coloring page, ${title.toLowerCase()} printable, ${catLabel.toLowerCase()} coloring page kids, free coloring page ${title.toLowerCase()}, printable ${title.toLowerCase()} coloring sheet`
  };
}

function generateHTMLPage(page, svg) {
  const { title, slug, category, age, difficulty } = page;
  const seo = buildSEO(page);
  const catLabel = CATEGORY_LABELS[category] || category;
  const catColor = CATEGORY_COLORS[category] || '#06b6d4';
  const catEmoji = CATEGORY_EMOJIS[category] || '🎨';
  const svgForPage = svg.replace(/\s+width="[^"]*"/, '').replace(/\s+height="[^"]*"/, '');
  const diffLabel = difficulty.charAt(0).toUpperCase()+difficulty.slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${seo.pageTitle}</title>
<meta name="description" content="${seo.metaDesc}">
<meta name="keywords" content="${seo.keywords}">
<link rel="canonical" href="https://www.chartkids.com/coloring/${slug}/">
<link rel="alternate" hreflang="es" href="https://www.chartkids.com/colorear.html">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3864436143903858" crossorigin="anonymous"></script>
<script src="/ck-nav.js" defer></script>
<script src="/ck-explore.js" defer></script>
<style>
:root{--bg:#0f0f1a;--surface:#1a1a2e;--border:#2e2e50;--accent:#7c3aed;--text:#f1f5f9;--muted:#94a3b8;--cat:${catColor};}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
.container{max-width:960px;margin:0 auto;padding:0 20px;}
.bc{padding:14px 0 0;font-size:.8rem;font-weight:700;color:#64748b;}.bc a{color:#94a3b8;text-decoration:none;}.bc a:hover{color:var(--cat);}.bc-sep{margin:0 7px;color:#2e2e50;}
.hero{text-align:center;padding:36px 20px 28px;}
.hero h1{font-family:'Fredoka One',cursive;font-size:2.2rem;background:linear-gradient(135deg,var(--cat),#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;}
.hero-desc{color:var(--muted);font-size:.92rem;max-width:520px;margin:0 auto 16px;line-height:1.7;}
.meta-pills{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;}
.pill{padding:4px 14px;border-radius:50px;font-size:.75rem;font-weight:800;border:1px solid var(--border);color:var(--muted);}
.pill-cat{border-color:var(--cat);color:var(--cat);}
.print-area{max-width:520px;margin:0 auto 32px;background:white;border-radius:16px;padding:16px;box-shadow:0 4px 24px rgba(0,0,0,.3);}
.print-area svg{width:100%;height:auto;display:block;}
.print-btns{display:flex;gap:12px;max-width:520px;margin:0 auto 44px;}
.btn-print{flex:1;padding:14px;border:none;border-radius:50px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;font-family:'Nunito',sans-serif;font-size:.95rem;font-weight:800;cursor:pointer;}
.btn-back{flex:1;padding:14px;border:2px solid var(--border);border-radius:50px;background:none;color:var(--muted);font-family:'Nunito',sans-serif;font-size:.95rem;font-weight:800;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;}
.btn-back:hover{border-color:var(--cat);color:var(--cat);}
.sec{margin-bottom:44px;}.sec h2{font-family:'Fredoka One',cursive;font-size:1.35rem;margin-bottom:12px;}
.sec p{color:var(--muted);font-size:.88rem;line-height:1.7;}
.rel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:12px;}
.rel-card{display:block;background:#1a1a2e;border:1px solid var(--border);border-radius:12px;padding:12px;text-decoration:none;color:var(--text);text-align:center;transition:all .18s;}
.rel-card:hover{border-color:var(--cat);transform:translateY(-2px);}
.rel-em{font-size:1.4rem;margin-bottom:4px;}.rel-name{font-size:.76rem;font-weight:800;}
.faq-item{border:1px solid var(--border);border-radius:12px;margin-bottom:8px;}
.faq-q{padding:12px 16px;font-weight:800;font-size:.85rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;}
.faq-q:hover{color:var(--cat);}
.faq-a{padding:0 16px 12px;color:var(--muted);font-size:.82rem;line-height:1.6;display:none;}
.faq-item.open .faq-a{display:block;}
footer{border-top:1px solid var(--border);padding:24px 0;text-align:center;}
footer p{color:var(--muted);font-size:.82rem;}footer a{color:var(--accent);text-decoration:none;}
@media print{#ck-nav,#ck-explore,.hero,.print-btns,.sec,footer,.bc{display:none!important;}body{background:white;}.print-area{max-width:100%;margin:0;padding:0;box-shadow:none;border-radius:0;}@page{size:letter portrait;margin:.35in .4in;}}
</style>
</head>
<body>
<div id="ck-nav"></div>
<main class="container">
<nav class="bc">
  <a href="/">Home</a><span class="bc-sep">›</span>
  <a href="/downloads/coloring/">Coloring</a><span class="bc-sep">›</span>
  <a href="/downloads/coloring/${category}/">${catLabel}</a><span class="bc-sep">›</span>
  <span style="color:var(--cat)">${title}</span>
</nav>
<section class="hero">
  <h1>${catEmoji} ${title} Coloring Page</h1>
  <p class="hero-desc">Free printable ${title.toLowerCase()} coloring page for kids. Print instantly, no sign-up needed.</p>
  <div class="meta-pills">
    <span class="pill pill-cat">${catLabel}</span>
    <span class="pill">Ages ${age}</span>
    <span class="pill">${diffLabel}</span>
    <span class="pill">Free</span>
  </div>
</section>
<div class="print-area">${svgForPage}</div>
<div class="print-btns">
  <button class="btn-print" onclick="printPage()">🖨️ Print Now — Free</button>
  <a href="/downloads/coloring/${category}/" class="btn-back">← More ${catLabel}</a>
</div>
<section class="sec">
  <h2>More Free Coloring Pages</h2>
  <div class="rel-grid">
    <a href="/downloads/coloring/animals/" class="rel-card"><div class="rel-em">🦁</div><div class="rel-name">Animals</div></a>
    <a href="/downloads/coloring/dinosaurs/" class="rel-card"><div class="rel-em">🦕</div><div class="rel-name">Dinosaurs</div></a>
    <a href="/downloads/coloring/vehicles/" class="rel-card"><div class="rel-em">🚗</div><div class="rel-name">Vehicles</div></a>
    <a href="/downloads/coloring/space/" class="rel-card"><div class="rel-em">🚀</div><div class="rel-name">Space</div></a>
    <a href="/downloads/coloring/superheroes/" class="rel-card"><div class="rel-em">🦸</div><div class="rel-name">Superheroes</div></a>
    <a href="/downloads/coloring/fantasy/" class="rel-card"><div class="rel-em">🐉</div><div class="rel-name">Fantasy</div></a>
    <a href="/downloads/coloring/jobs/" class="rel-card"><div class="rel-em">👷</div><div class="rel-name">Jobs</div></a>
    <a href="/downloads/coloring/sports/" class="rel-card"><div class="rel-em">⚽</div><div class="rel-name">Sports</div></a>
    <a href="/downloads/coloring/food/" class="rel-card"><div class="rel-em">🍕</div><div class="rel-name">Food</div></a>
    <a href="/downloads/coloring/nature/" class="rel-card"><div class="rel-em">🌻</div><div class="rel-name">Nature</div></a>
    <a href="/downloads/coloring/holidays/" class="rel-card"><div class="rel-em">🎄</div><div class="rel-name">Holidays</div></a>
    <a href="/downloads/coloring/pets/" class="rel-card"><div class="rel-em">🐾</div><div class="rel-name">Pets</div></a>
  </div>
</section>
<section class="sec">
  <h2>Frequently Asked Questions</h2>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">Is this coloring page free? <span>+</span></div><div class="faq-a">Yes — completely free, no registration needed. Print as many copies as you like for personal or classroom use.</div></div>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">What age is this coloring page for? <span>+</span></div><div class="faq-a">This ${title.toLowerCase()} coloring page is designed for children ages ${age}. The ${difficulty} difficulty level means ${difficulty==='easy'?'large, simple shapes that are easy to color in':difficulty==='medium'?'moderate detail suitable for kids with some coloring experience':'detailed lines that challenge older kids'}.</div></div>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">Can I use this in my classroom? <span>+</span></div><div class="faq-a">Absolutely! All ChartKids coloring pages are free for personal and educational use. Print as many copies as you need.</div></div>
</section>
</main>
<footer><p>© 2025 ChartKids · <a href="/">Home</a> · <a href="/downloads/coloring/">Coloring Pages</a> · <a href="/privacy.html">Privacy</a></p></footer>
<script>
function printPage(){
  const svg=document.querySelector('.print-area').innerHTML;
  const title='${title}';
  const cat='${catLabel}';
  const slug='${slug}';
  const w=window.open('','_blank','width=816,height=1056');
  if(!w){window.print();return;}
  w.document.write(\`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>\${title} | ChartKids</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&family=Fredoka+One&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100vh;overflow:hidden;background:white;font-family:'Nunito',sans-serif;}
.page{display:flex;flex-direction:column;height:100vh;}
.ph{flex:none;display:flex;align-items:center;justify-content:space-between;padding:7px 18px 6px;border-bottom:2.5px solid #1a1a1a;}
.ph-logo{font-family:'Fredoka One',cursive;font-size:1.1rem;color:#7c3aed;}
.ph-logo em{color:#1a1a1a;font-style:normal;}
.ph-title{font-family:'Fredoka One',cursive;font-size:.95rem;color:#1a1a1a;}
.ph-url{font-size:.65rem;font-weight:800;color:#94a3b8;}
.ps{flex:1;overflow:hidden;padding:6px 16px 4px;display:flex;align-items:center;justify-content:center;}
.ps svg{width:100%;height:100%;max-width:100%;max-height:100%;display:block;}
.pf{flex:none;display:flex;justify-content:space-between;padding:5px 18px;border-top:1.5px solid #e2e8f0;font-size:.62rem;color:#94a3b8;}
@page{size:letter portrait;margin:.2in .25in;}
@media print{html,body{height:100vh;overflow:hidden;}}
</style>
</head>
<body>
<div class="page">
  <div class="ph">
    <div class="ph-logo">🎨 Chart<em>Kids</em></div>
    <div class="ph-title">\${title} — Free \${cat} Coloring Page</div>
    <div class="ph-url">chartkids.com</div>
  </div>
  <div class="ps">\${svg}</div>
  <div class="pf">
    <span>Free printable · No sign-up · chartkids.com</span>
    <span>chartkids.com/coloring/\${slug}/</span>
  </div>
</div>
</body>
</html>\`);
  w.document.close();
  setTimeout(()=>w.print(),500);
}
function faq(el){const it=el.parentElement;it.classList.toggle('open');el.querySelector('span').textContent=it.classList.contains('open')?'−':'+';}
window.setLang=()=>location.reload();
</script>
</body>
</html>`;
}

function addToSitemap(newUrls) {
  let xml = fs.readFileSync(SITEMAP_FILE, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const entries = newUrls.map(url =>
    `\n  <url>\n    <loc>https://www.chartkids.com${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.75</priority>\n  </url>`
  ).join('');
  xml = xml.replace('</urlset>', entries + '\n</urlset>');
  fs.writeFileSync(SITEMAP_FILE, xml);
}

function main() {
  const metadata = loadMetadata();
  const newSitemapUrls = [];
  let built = 0, skipped = 0, missing = 0;

  let filtered = pages;
  if (CAT_FILTER) filtered = filtered.filter(p => p.category === CAT_FILTER);
  if (ID_FILTER)  filtered = filtered.filter(p => p.id === ID_FILTER);

  for (const page of filtered) {
    const key = `coloring/${page.slug}`;
    const svgPath = path.join(SVG_DIR, `${page.slug}.svg`);

    if (!fs.existsSync(svgPath)) {
      console.log(`  miss  [${String(page.id).padStart(3)}] ${page.slug}`);
      missing++;
      continue;
    }

    if (metadata[key] && !FORCE) {
      skipped++;
      continue;
    }

    const svg = fs.readFileSync(svgPath, 'utf8');
    const pageDir = path.join(OUT_DIR, page.slug);
    ensureDir(pageDir);
    fs.writeFileSync(path.join(pageDir, 'index.html'), generateHTMLPage(page, svg));

    metadata[key] = { id: page.id, title: page.title, category: page.category, slug: page.slug, generated: new Date().toISOString() };
    newSitemapUrls.push(`/coloring/${page.slug}/`);
    console.log(`  built [${String(page.id).padStart(3)}] ${page.slug}`);
    built++;
  }

  saveMetadata(metadata);
  if (newSitemapUrls.length > 0) {
    addToSitemap(newSitemapUrls);
    console.log(`  ✓ sitemap +${newSitemapUrls.length} URLs`);
  }

  console.log(`\n✓ built:${built}  skipped:${skipped}  missing SVG:${missing}`);
  if (missing > 0) console.log(`  → generate missing SVGs then re-run: node build-pages.js`);
}

main();
