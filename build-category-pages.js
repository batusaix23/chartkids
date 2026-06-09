#!/usr/bin/env node
// build-category-pages.js — generates /downloads/coloring/{category}/index.html for all 12 categories

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const PAGES_FILE = path.join(BASE_DIR, 'master-coloring-pages-300.json');
const SVG_DIR = path.join(BASE_DIR, 'generated', 'svgs', 'coloring');
const METADATA_FILE = path.join(BASE_DIR, 'generated', 'metadata-coloring-all.json');
const OUT_BASE = path.join(BASE_DIR, 'downloads', 'coloring');

const pages = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'));
const metadata = fs.existsSync(METADATA_FILE) ? JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')) : {};

const CATS = {
  animals:     { label:'Animals',              emoji:'🦁', color:'#22c55e', desc:'Lions, elephants, giraffes, sharks and more amazing animals to color.' },
  dinosaurs:   { label:'Dinosaurs',            emoji:'🦕', color:'#ef4444', desc:'T-Rex, Triceratops, Stegosaurus and dino adventures — all free to print.' },
  vehicles:    { label:'Vehicles',             emoji:'🚗', color:'#f59e0b', desc:'Cars, trucks, planes, trains, boats and more to color.' },
  space:       { label:'Space',                emoji:'🚀', color:'#06b6d4', desc:'Astronauts, rockets, planets, aliens and space exploration.' },
  superheroes: { label:'Superheroes',          emoji:'🦸', color:'#f43f5e', desc:'Flying heroes, super powers and epic action scenes for kids.' },
  fantasy:     { label:'Princesses & Fantasy', emoji:'🐉', color:'#a78bfa', desc:'Princesses, dragons, unicorns, fairies and enchanted castles.' },
  jobs:        { label:'Jobs & Careers',       emoji:'👷', color:'#34d399', desc:'Firefighters, doctors, teachers, chefs and more fun careers.' },
  sports:      { label:'Sports',               emoji:'⚽', color:'#3b82f6', desc:'Soccer, basketball, swimming, skateboarding and more sports action.' },
  food:        { label:'Food & Fruits',        emoji:'🍕', color:'#f97316', desc:'Yummy pizza, fruits, cakes, tacos and tasty food with cute faces.' },
  nature:      { label:'Nature & Seasons',     emoji:'🌻', color:'#84cc16', desc:'Trees, flowers, mountains, seasons, rainbows and landscapes.' },
  holidays:    { label:'Holidays',             emoji:'🎄', color:'#ec4899', desc:'Christmas, Halloween, Easter, birthdays and special celebrations.' },
  pets:        { label:'Pets & Insects',       emoji:'🐾', color:'#fb923c', desc:'Dogs, cats, bunnies, hamsters, butterflies and beloved pets.' },
};

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }

function minSvg(svg) {
  return svg.replace(/<!--[\s\S]*?-->/g, '').replace(/\n\s*/g, ' ').trim();
}

function generateCategoryPage(cat, catPages) {
  const { label, emoji, color, desc } = CATS[cat];
  const generated = catPages.filter(p => metadata[`coloring/${p.slug}`]);
  const total = generated.length;

  const cards = catPages.map(page => {
    const isReady = !!metadata[`coloring/${page.slug}`];
    const svgPath = path.join(SVG_DIR, `${page.slug}.svg`);
    let thumb;
    if (isReady && fs.existsSync(svgPath)) {
      thumb = minSvg(fs.readFileSync(svgPath, 'utf8'));
    } else {
      thumb = `<div style="font-size:3rem;display:flex;align-items:center;justify-content:height:100%;width:100%;justify-content:center;align-items:center">${emoji}</div>`;
    }
    const diffLabel = page.difficulty.charAt(0).toUpperCase() + page.difficulty.slice(1);
    if (isReady) {
      return `<a href="/coloring/${page.slug}/" class="g-card">
  <div class="g-thumb">${thumb}</div>
  <div class="g-info">
    <div class="g-name">${page.title}</div>
    <div class="g-meta"><span class="g-pill">${diffLabel}</span><span class="g-pill">Ages ${page.age}</span></div>
    <div class="g-btn">🖨️ Print Free</div>
  </div>
</a>`;
    } else {
      return `<div class="g-card g-soon">
  <div class="g-thumb"><div class="g-em">${emoji}</div></div>
  <div class="g-info">
    <div class="g-name">${page.title}</div>
    <div class="g-meta"><span class="g-pill">${diffLabel}</span></div>
    <div class="g-btn-soon">⏳ Coming Soon</div>
  </div>
</div>`;
    }
  }).join('\n');

  const relCats = Object.entries(CATS).filter(([k]) => k !== cat)
    .map(([k, v]) => `<a href="/downloads/coloring/${k}/" class="rel-card"><div class="rel-em">${v.emoji}</div><div class="rel-name">${v.label}</div></a>`)
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Free ${label} Coloring Pages for Kids — Print Instantly | ChartKids</title>
<meta name="description" content="Free printable ${label.toLowerCase()} coloring pages for kids. ${desc} No sign-up needed. Print instantly.">
<link rel="canonical" href="https://www.chartkids.com/downloads/coloring/${cat}/">
<link rel="alternate" hreflang="es" href="https://www.chartkids.com/colorear.html">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3864436143903858" crossorigin="anonymous"></script>
<script src="/ck-nav.js" defer></script>
<script src="/ck-explore.js" defer></script>
<style>
:root{--bg:#0f0f1a;--surface:#1a1a2e;--border:#2e2e50;--accent:#7c3aed;--text:#f1f5f9;--muted:#94a3b8;--cat:${color};}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
.container{max-width:960px;margin:0 auto;padding:0 20px;}
.bc{padding:14px 0 0;font-size:.8rem;font-weight:700;color:#64748b;}.bc a{color:#94a3b8;text-decoration:none;}.bc a:hover{color:var(--cat);}.bc-sep{margin:0 7px;color:#2e2e50;}
.hero{text-align:center;padding:44px 20px 36px;}
.hero-pills{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-bottom:18px;}
.hero-pill{background:color-mix(in srgb,var(--cat) 18%,transparent);color:var(--cat);border:1px solid color-mix(in srgb,var(--cat) 35%,transparent);border-radius:50px;padding:4px 14px;font-size:.76rem;font-weight:800;}
.hero h1{font-family:'Fredoka One',cursive;font-size:2.4rem;background:linear-gradient(135deg,var(--cat),#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2;margin-bottom:14px;}
.hero-desc{color:var(--muted);font-size:.95rem;max-width:560px;margin:0 auto 28px;line-height:1.7;}
.hero-stats{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;}
.stat-n{font-family:'Fredoka One',cursive;font-size:2rem;color:var(--cat);}
.stat-l{font-size:.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;}
.sec-h2{font-family:'Fredoka One',cursive;font-size:1.5rem;margin:40px 0 18px;}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:52px;}
.g-card{display:block;background:var(--surface);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;text-decoration:none;color:var(--text);transition:transform .18s,border-color .18s;}
.g-card:hover{transform:translateY(-3px);border-color:var(--cat);}
.g-soon{opacity:.55;cursor:default;}
.g-thumb{background:#fff;height:165px;display:flex;align-items:center;justify-content:center;padding:6px;overflow:hidden;}
.g-thumb svg{width:100%;height:100%;display:block;}
.g-em{font-size:3.2rem;}
.g-info{padding:10px 12px 13px;}
.g-name{font-family:'Fredoka One',cursive;font-size:.87rem;margin-bottom:6px;line-height:1.3;}
.g-meta{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;}
.g-pill{font-size:.67rem;font-weight:800;color:var(--muted);background:var(--border);border-radius:50px;padding:2px 8px;}
.g-btn{display:block;padding:7px;border-radius:50px;background:linear-gradient(135deg,var(--cat),#7c3aed);color:white;font-size:.77rem;font-weight:800;text-align:center;}
.g-btn-soon{display:block;padding:7px;border-radius:50px;background:var(--border);color:var(--muted);font-size:.77rem;font-weight:800;text-align:center;}
.sec{margin-bottom:48px;}.sec h2{font-family:'Fredoka One',cursive;font-size:1.4rem;margin-bottom:14px;}
.sec p{color:var(--muted);font-size:.9rem;line-height:1.7;margin-bottom:12px;}
.steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-top:16px;}
.step{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;text-align:center;}
.step-n{font-family:'Fredoka One',cursive;font-size:1.9rem;color:var(--cat);margin-bottom:8px;}
.step h3{font-size:.88rem;font-weight:800;margin-bottom:6px;}.step p{font-size:.79rem;color:var(--muted);margin:0;}
.rel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-top:14px;}
.rel-card{display:block;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;text-decoration:none;color:var(--text);text-align:center;transition:all .18s;}
.rel-card:hover{border-color:var(--cat);transform:translateY(-2px);}
.rel-em{font-size:1.4rem;margin-bottom:4px;}.rel-name{font-size:.7rem;font-weight:800;}
.faq-item{border:1px solid var(--border);border-radius:12px;margin-bottom:10px;}
.faq-q{padding:13px 18px;font-weight:800;font-size:.88rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;}
.faq-q:hover{color:var(--cat);}
.faq-a{padding:0 18px 13px;color:var(--muted);font-size:.84rem;line-height:1.6;display:none;}
.faq-item.open .faq-a{display:block;}
footer{border-top:1px solid var(--border);padding:28px 0;text-align:center;}
footer p{color:var(--muted);font-size:.84rem;}footer a{color:var(--accent);text-decoration:none;}
@media(max-width:640px){.hero h1{font-size:1.9rem;}.gallery-grid{grid-template-columns:repeat(2,1fr);gap:10px;}}
</style>
</head>
<body>
<div id="ck-nav"></div>
<main class="container">
<nav class="bc">
  <a href="/">Home</a><span class="bc-sep">›</span>
  <a href="/downloads/coloring/">Coloring Pages</a><span class="bc-sep">›</span>
  <span style="color:var(--cat)">${label}</span>
</nav>
<section class="hero">
  <div class="hero-pills">
    <span class="hero-pill">🎨 Free Printables</span>
    <span class="hero-pill">✅ No Sign-up</span>
    <span class="hero-pill">🖨️ Print Ready</span>
  </div>
  <h1>${emoji} Free ${label} Coloring Pages</h1>
  <p class="hero-desc">${desc} All pages are letter/A4 size — print instantly, always free.</p>
  <div class="hero-stats">
    <div><div class="stat-n">${total}</div><div class="stat-l">Coloring Pages</div></div>
    <div><div class="stat-n">Free</div><div class="stat-l">Always</div></div>
    <div><div class="stat-n">All</div><div class="stat-l">Ages</div></div>
  </div>
</section>
<h2 class="sec-h2">${emoji} ${label} Coloring Pages — Print Free</h2>
<div class="gallery-grid">
${cards}
</div>
<section class="sec">
  <h2>How to Print</h2>
  <p>Three easy steps to get your free coloring page.</p>
  <div class="steps">
    <div class="step"><div class="step-n">1</div><h3>Pick a Page</h3><p>Browse the gallery and click the coloring page you want.</p></div>
    <div class="step"><div class="step-n">2</div><h3>Click Print Free</h3><p>Hit the print button — no login, no payment, no watermark.</p></div>
    <div class="step"><div class="step-n">3</div><h3>Color &amp; Enjoy!</h3><p>Use crayons, colored pencils or markers to bring it to life.</p></div>
  </div>
</section>
<section class="sec">
  <h2>More Free Coloring Pages</h2>
  <div class="rel-grid">
    ${relCats}
    <a href="/downloads/coloring/" class="rel-card"><div class="rel-em">🎨</div><div class="rel-name">All Coloring</div></a>
  </div>
</section>
<section class="sec">
  <h2>Frequently Asked Questions</h2>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">Are these coloring pages really free? <span>+</span></div><div class="faq-a">Yes — 100% free, always. No registration, no payment, no watermarks. Print as many copies as you need.</div></div>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">What ages are these for? <span>+</span></div><div class="faq-a">Our ${label.toLowerCase()} collection includes easy pages for ages 3–6, medium pages for ages 4–7, and detailed designs for ages 5–9.</div></div>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">Can I use these in a classroom? <span>+</span></div><div class="faq-a">Absolutely. All ChartKids coloring pages are free for personal and educational use. Print as many copies as you need for your students.</div></div>
</section>
</main>
<div id="ck-explore"></div>
<footer><p>© 2025 ChartKids · <a href="/">Home</a> · <a href="/downloads/coloring/">Coloring Pages</a> · <a href="/privacy.html">Privacy</a></p></footer>
<script>
function faq(el){const it=el.parentElement;it.classList.toggle('open');el.querySelector('span').textContent=it.classList.contains('open')?'−':'+';}
window.setLang=()=>location.reload();
</script>
</body>
</html>`;
}

// Group by category and build all pages
const byCategory = {};
for (const page of pages) {
  if (!byCategory[page.category]) byCategory[page.category] = [];
  byCategory[page.category].push(page);
}

let built = 0;
for (const [cat, catPages] of Object.entries(byCategory)) {
  const outDir = path.join(OUT_BASE, cat);
  ensureDir(outDir);
  const html = generateCategoryPage(cat, catPages);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  const ready = catPages.filter(p => metadata[`coloring/${p.slug}`]).length;
  console.log(`  built  /downloads/coloring/${cat}/ — ${ready}/${catPages.length} pages ready`);
  built++;
}
console.log(`\n✓ Built ${built} category pages`);
