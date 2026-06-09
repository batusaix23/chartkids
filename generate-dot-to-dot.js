#!/usr/bin/env node
// generate-dot-to-dot.js — ChartKids automated dot-to-dot generator
// Usage: node generate-dot-to-dot.js [--dry-run] [--limit=5]

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const GENERATED_DIR = path.join(BASE_DIR, 'generated');
const METADATA_FILE = path.join(GENERATED_DIR, 'metadata-dotdot.json');
const OUT_DIR = path.join(BASE_DIR, 'downloads', 'dot-to-dot');
const SITEMAP_FILE = path.join(BASE_DIR, 'sitemap.xml');
const DELAY_MS = 3000;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = parseInt((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 999;

if (DRY_RUN) console.log('[DRY RUN] No files will be written.\n');

if (!process.env.ANTHROPIC_API_KEY && !DRY_RUN) {
  console.error('Error: ANTHROPIC_API_KEY not set.\nRun: $env:ANTHROPIC_API_KEY = "sk-ant-..."');
  process.exit(1);
}

const client = new Anthropic();
const topics = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'topics.json'), 'utf8'));

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function loadMetadata() {
  return fs.existsSync(METADATA_FILE) ? JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')) : {};
}
function saveMetadata(meta) {
  ensureDir(GENERATED_DIR);
  fs.writeFileSync(METADATA_FILE, JSON.stringify(meta, null, 2));
}

function buildPrompt(topic, dots = 30) {
  return `Create a connect-the-dots printable activity.
Theme: ${topic}
Requirements:
- ${dots} numbered dots
- Easy difficulty
- Black and white
- Educational style
- Printable
- Large numbers
- Child-friendly

Technical SVG requirements:
- ViewBox: 0 0 500 650
- Start: <svg viewBox="0 0 500 650" xmlns="http://www.w3.org/2000/svg">
- First element: <rect width="500" height="650" fill="white"/>
- Dots: small filled circles fill="#1a1a1a" r="5", surrounded by larger circle fill="white" stroke="#1a1a1a" stroke-width="2" r="12"
- Numbers: use <text> elements, font-size="14", font-weight="bold", fill="#1a1a1a" near each dot
- Dots must be positioned to form the outline of the ${topic} when connected in order
- Do NOT draw the connecting lines — the child draws them
- Add a small decorative border or corner elements

Output ONLY raw SVG code starting with <svg — no markdown, no explanation.`;
}

async function generateSVG(topic) {
  const dots = topic.toLowerCase().includes('simple') ? 20 : 30;
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8096,
    messages: [{ role: 'user', content: buildPrompt(topic, dots) }]
  });
  let text = response.content[0].text.trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  const match = text.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) throw new Error('No valid SVG in response');
  return match[0];
}

function generateHTMLPage(topic, slug, svg) {
  const title = `Free ${topic} Connect the Dots — Print Instantly | ChartKids`;
  const desc = `Free printable ${topic.toLowerCase()} dot-to-dot worksheet for kids. Connect 30 numbered dots to reveal the picture. No sign-up. Print instantly.`;
  const svgForPage = svg.replace(/\s+width="[^"]*"/, '').replace(/\s+height="[^"]*"/, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://www.chartkids.com/downloads/dot-to-dot/${slug}/">
<link rel="alternate" hreflang="es" href="https://www.chartkids.com/une-los-puntos.html">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3864436143903858" crossorigin="anonymous"></script>
<script src="/ck-nav.js" defer></script>
<script src="/ck-explore.js" defer></script>
<style>
:root{--bg:#0f0f1a;--surface:#1a1a2e;--border:#2e2e50;--accent:#7c3aed;--text:#f1f5f9;--muted:#94a3b8;--cat:#06b6d4;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
.container{max-width:960px;margin:0 auto;padding:0 20px;}
.bc{padding:14px 0 0;font-size:.8rem;font-weight:700;color:#64748b;}.bc a{color:#94a3b8;text-decoration:none;}.bc a:hover{color:var(--cat);}.bc-sep{margin:0 7px;color:#2e2e50;}
.hero{text-align:center;padding:36px 20px 28px;}
.hero h1{font-family:'Fredoka One',cursive;font-size:2.2rem;background:linear-gradient(135deg,#06b6d4,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;}
.hero-desc{color:var(--muted);font-size:.92rem;max-width:520px;margin:0 auto 24px;line-height:1.7;}
.print-area{max-width:520px;margin:0 auto 32px;background:white;border-radius:16px;padding:16px;box-shadow:0 4px 24px rgba(0,0,0,.3);}
.print-area svg{width:100%;height:auto;display:block;}
.print-btns{display:flex;gap:12px;max-width:520px;margin:0 auto 44px;}
.btn-print{flex:1;padding:14px;border:none;border-radius:50px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;font-family:'Nunito',sans-serif;font-size:.95rem;font-weight:800;cursor:pointer;}
.btn-back{flex:1;padding:14px;border:2px solid var(--border);border-radius:50px;background:none;color:var(--muted);font-family:'Nunito',sans-serif;font-size:.95rem;font-weight:800;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;}
.btn-back:hover{border-color:var(--cat);color:var(--cat);}
.sec{margin-bottom:44px;}.sec h2{font-family:'Fredoka One',cursive;font-size:1.35rem;margin-bottom:12px;}
.rel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:12px;}
.rel-card{display:block;background:#1a1a2e;border:1px solid var(--border);border-radius:12px;padding:12px;text-decoration:none;color:var(--text);text-align:center;transition:all .18s;}
.rel-card:hover{border-color:var(--cat);transform:translateY(-2px);}
.rel-em{font-size:1.4rem;margin-bottom:4px;}.rel-name{font-size:.76rem;font-weight:800;}
footer{border-top:1px solid var(--border);padding:24px 0;text-align:center;}
footer p{color:var(--muted);font-size:.82rem;}footer a{color:var(--accent);text-decoration:none;}
@media print{#ck-nav,#ck-explore,.hero,.print-btns,.sec,footer{display:none!important;}body{background:white;}.print-area{max-width:100%;margin:0;padding:0;box-shadow:none;border-radius:0;}@page{size:letter portrait;margin:.35in .4in;}}
</style>
</head>
<body>
<div id="ck-nav"></div>
<main class="container">
<nav class="bc">
  <a href="/">Home</a><span class="bc-sep">›</span>
  <a href="/downloads/dot-to-dot/">Dot to Dot</a><span class="bc-sep">›</span>
  <span style="color:var(--cat)">${topic}</span>
</nav>
<section class="hero">
  <h1>Connect the Dots — ${topic}</h1>
  <p class="hero-desc">Connect the numbered dots in order to reveal the hidden ${topic.toLowerCase()} picture. Print free, no sign-up needed.</p>
</section>
<div class="print-area">${svgForPage}</div>
<div class="print-btns">
  <button class="btn-print" onclick="window.print()">🖨️ Print Now — Free</button>
  <a href="/downloads/dot-to-dot/" class="btn-back">← More Dot to Dot</a>
</div>
<section class="sec">
  <h2>More Free Printables</h2>
  <div class="rel-grid">
    <a href="/downloads/dot-to-dot/" class="rel-card"><div class="rel-em">✏️</div><div class="rel-name">Dot to Dot</div></a>
    <a href="/downloads/coloring/animals/" class="rel-card"><div class="rel-em">🦁</div><div class="rel-name">Coloring</div></a>
    <a href="/downloads/mazes/easy/" class="rel-card"><div class="rel-em">🟢</div><div class="rel-name">Easy Mazes</div></a>
    <a href="/downloads/color-by-number/" class="rel-card"><div class="rel-em">🎨</div><div class="rel-name">Color by Number</div></a>
    <a href="/imprime-y-juega.html" class="rel-card"><div class="rel-em">🖨️</div><div class="rel-name">All Printables</div></a>
  </div>
</section>
</main>
<footer><p>© 2025 ChartKids · <a href="/">Home</a> · <a href="/downloads/dot-to-dot/">Dot to Dot</a> · <a href="/privacy.html">Privacy</a></p></footer>
<script>window.setLang=()=>location.reload();</script>
</body>
</html>`;
}

function addUrlsToSitemap(newUrls) {
  let xml = fs.readFileSync(SITEMAP_FILE, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const entries = newUrls.map(url => `\n  <url>\n    <loc>https://www.chartkids.com${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.75</priority>\n  </url>`).join('');
  xml = xml.replace('</urlset>', entries + '\n</urlset>');
  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log(`  ✓ sitemap updated with ${newUrls.length} URL(s)`);
}

async function main() {
  const metadata = loadMetadata();
  const newSitemapUrls = [];
  let count = 0;

  const dotTopics = topics['dot-to-dot'] || [];

  for (const topic of dotTopics) {
    if (count >= LIMIT) break;
    const slug = slugify(topic);
    const key = `dot-to-dot/${slug}`;
    if (metadata[key]) { console.log(`  skip  ${key}`); continue; }
    console.log(`\n  gen   ${key}`);
    if (DRY_RUN) { console.log(`  [dry] would write: downloads/dot-to-dot/${slug}/index.html`); count++; continue; }
    try {
      const svg = await generateSVG(topic);
      const pageDir = path.join(OUT_DIR, slug);
      ensureDir(pageDir);
      fs.writeFileSync(path.join(pageDir, 'index.html'), generateHTMLPage(topic, slug, svg));
      ensureDir(path.join(GENERATED_DIR, 'svgs', 'dot-to-dot'));
      fs.writeFileSync(path.join(GENERATED_DIR, 'svgs', 'dot-to-dot', `${slug}.svg`), svg);
      metadata[key] = { topic, slug, generated: new Date().toISOString() };
      saveMetadata(metadata);
      newSitemapUrls.push(`/downloads/dot-to-dot/${slug}/`);
      count++;
      if (count < LIMIT) await sleep(DELAY_MS);
    } catch (err) { console.error(`  ERROR ${key}: ${err.message}`); count++; }
  }

  if (!DRY_RUN && newSitemapUrls.length > 0) addUrlsToSitemap(newSitemapUrls);
  console.log(`\n✓ Done. Generated ${count} page(s).`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
