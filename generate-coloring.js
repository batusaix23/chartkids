#!/usr/bin/env node
// generate-coloring.js — ChartKids automated coloring page generator
// Usage: node generate-coloring.js [--dry-run] [--category=animals] [--limit=5]

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_DIR = __dirname;
const GENERATED_DIR = path.join(BASE_DIR, 'generated');
const METADATA_FILE = path.join(GENERATED_DIR, 'metadata.json');
const COLORING_OUT = path.join(BASE_DIR, 'downloads', 'coloring');
const SITEMAP_FILE = path.join(BASE_DIR, 'sitemap.xml');
const DELAY_MS = 3000; // pause between API calls

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CATEGORY_FILTER = (args.find(a => a.startsWith('--category=')) || '').split('=')[1];
const LIMIT = parseInt((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 999;

if (DRY_RUN) console.log('[DRY RUN] No files will be written, no API calls made.\n');

// ── Anthropic client ──────────────────────────────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY not set.\nRun: $env:ANTHROPIC_API_KEY = "sk-ant-..."');
  process.exit(1);
}
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ── Load topics ───────────────────────────────────────────────────────────────
const topics = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'topics.json'), 'utf8'));

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadMetadata() {
  if (fs.existsSync(METADATA_FILE)) {
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  }
  return {};
}

function saveMetadata(meta) {
  ensureDir(GENERATED_DIR);
  fs.writeFileSync(METADATA_FILE, JSON.stringify(meta, null, 2));
}

// ── SVG prompt ────────────────────────────────────────────────────────────────
function buildPrompt(topic, age = '5-8') {
  return `Create a professional children's coloring page.
Theme: ${topic}
Requirements:
- Pure black and white line art
- No grayscale
- No shadows
- Thick clean outlines
- Large coloring spaces
- Suitable for children ages ${age}
- Centered composition
- White background
- Printable on US Letter paper
- Educational and friendly style
- No text
- No watermark
- High resolution SVG style
The illustration should be fun, cute and easy to color.

Technical SVG requirements:
- ViewBox: 0 0 500 650
- Start: <svg viewBox="0 0 500 650" xmlns="http://www.w3.org/2000/svg">
- First element: <rect width="500" height="650" fill="white"/>
- All fills: fill="white" except eye pupils fill="#1a1a1a"
- All strokes: stroke="#1a1a1a", main outlines stroke-width 4-5, details 2.5-3
- No gradients, no opacity, no shadows

Output ONLY raw SVG code starting with <svg — no markdown, no explanation.`;
}

// ── API call ──────────────────────────────────────────────────────────────────
async function generateSVG(topic) {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8096,
    messages: [{ role: 'user', content: buildPrompt(topic) }]
  });

  let text = response.content[0].text.trim();

  // Strip markdown fences if model wrapped it
  text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

  // Extract just the SVG tag
  const match = text.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) throw new Error('Response did not contain valid SVG');
  return match[0];
}

// ── HTML page generator ───────────────────────────────────────────────────────
function generateHTMLPage(topic, slug, category, svg) {
  const title = `Free ${topic} Coloring Page for Kids — Print Instantly | ChartKids`;
  const desc = `Free printable ${topic} coloring page for kids. Print at home instantly. No sign-up needed. High quality line art designed for children ages 4-8.`;
  const canonicalPath = `/downloads/coloring/${category}/${slug}/`;
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const catPath = `/downloads/coloring/${category}/`;

  // Inline SVG with dimensions stripped (for responsive rendering)
  const svgForPage = svg
    .replace(/\s+width="[^"]*"/, '')
    .replace(/\s+height="[^"]*"/, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://www.chartkids.com${canonicalPath}">
<link rel="alternate" hreflang="es" href="https://www.chartkids.com/colorear.html">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3864436143903858" crossorigin="anonymous"></script>
<script src="/ck-nav.js" defer></script>
<script src="/ck-explore.js" defer></script>
<style>
:root{--bg:#0f0f1a;--surface:#1a1a2e;--border:#2e2e50;--accent:#7c3aed;--text:#f1f5f9;--muted:#94a3b8;--cat:#ec4899;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
.container{max-width:960px;margin:0 auto;padding:0 20px;}
.bc{padding:14px 0 0;font-size:.8rem;font-weight:700;color:#64748b;}
.bc a{color:#94a3b8;text-decoration:none;}.bc a:hover{color:var(--cat);}.bc-sep{margin:0 7px;color:#2e2e50;}
.hero{text-align:center;padding:36px 20px 28px;}
.hero h1{font-family:'Fredoka One',cursive;font-size:2.2rem;background:linear-gradient(135deg,#ec4899,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;}
.hero-desc{color:var(--muted);font-size:.92rem;max-width:520px;margin:0 auto 24px;line-height:1.7;}
.print-area{max-width:520px;margin:0 auto 32px;background:white;border-radius:16px;padding:16px;box-shadow:0 4px 24px rgba(0,0,0,.3);}
.print-area svg{width:100%;height:auto;display:block;}
.print-btns{display:flex;gap:12px;max-width:520px;margin:0 auto 44px;}
.btn-print{flex:1;padding:14px;border:none;border-radius:50px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;font-family:'Nunito',sans-serif;font-size:.95rem;font-weight:800;cursor:pointer;transition:opacity .18s;}
.btn-print:hover{opacity:.85;}
.btn-back{flex:1;padding:14px;border:2px solid var(--border);border-radius:50px;background:none;color:var(--muted);font-family:'Nunito',sans-serif;font-size:.95rem;font-weight:800;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;transition:all .18s;}
.btn-back:hover{border-color:var(--cat);color:var(--cat);}
.sec{margin-bottom:44px;}.sec h2{font-family:'Fredoka One',cursive;font-size:1.35rem;margin-bottom:12px;}
.sec p{color:var(--muted);font-size:.88rem;line-height:1.7;margin-bottom:10px;}
.steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:14px;}
.step{background:#1a1a2e;border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;}
.step-n{font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--cat);margin-bottom:6px;}
.step h3{font-size:.84rem;font-weight:800;margin-bottom:4px;}.step p{font-size:.76rem;color:var(--muted);margin:0;}
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
@media print{
  #ck-nav,#ck-explore,.hero,.print-btns,.sec,footer{display:none!important;}
  body{background:white;margin:0;padding:0;}
  .container{max-width:100%;padding:0;}
  .print-area{max-width:100%;margin:0;padding:0;box-shadow:none;border-radius:0;}
  .print-area svg{width:100%;height:auto;}
  @page{size:letter portrait;margin:.35in .4in;}
}
@media(max-width:600px){.hero h1{font-size:1.7rem;}.print-btns{flex-direction:column;}}
</style>
</head>
<body>
<div id="ck-nav"></div>
<main class="container">
<nav class="bc">
  <a href="/">Home</a><span class="bc-sep">›</span>
  <a href="/imprime-y-juega.html">Print &amp; Play</a><span class="bc-sep">›</span>
  <a href="/downloads/coloring/">Coloring Pages</a><span class="bc-sep">›</span>
  <a href="${catPath}">${catLabel}</a><span class="bc-sep">›</span>
  <span style="color:var(--cat)">${topic}</span>
</nav>
<section class="hero">
  <h1>Free ${topic} Coloring Page for Kids</h1>
  <p class="hero-desc">Print this free ${topic.toLowerCase()} coloring page instantly — no account, no sign-up, no cost. Perfect for kids aged 4–8.</p>
</section>
<div class="print-area" id="svgWrap">
${svgForPage}
</div>
<div class="print-btns">
  <button class="btn-print" onclick="window.print()">🖨️ Print Now — Free</button>
  <a href="${catPath}" class="btn-back">← More ${catLabel}</a>
</div>
<section class="sec">
  <h2>How to Print This Coloring Page</h2>
  <div class="steps">
    <div class="step"><div class="step-n">1</div><h3>Click Print</h3><p>Hit the green Print button above.</p></div>
    <div class="step"><div class="step-n">2</div><h3>Choose Printer</h3><p>Select your printer and confirm letter size.</p></div>
    <div class="step"><div class="step-n">3</div><h3>Start Coloring!</h3><p>Grab your crayons and fill in the ${topic.toLowerCase()}.</p></div>
  </div>
</section>
<section class="sec">
  <h2>More Free Coloring Pages</h2>
  <div class="rel-grid">
    <a href="/downloads/coloring/animals/" class="rel-card"><div class="rel-em">🦁</div><div class="rel-name">Animals</div></a>
    <a href="/downloads/coloring/dinosaurs/" class="rel-card"><div class="rel-em">🦕</div><div class="rel-name">Dinosaurs</div></a>
    <a href="/downloads/coloring/space/" class="rel-card"><div class="rel-em">🚀</div><div class="rel-name">Space</div></a>
    <a href="/downloads/coloring/vehicles/" class="rel-card"><div class="rel-em">🚗</div><div class="rel-name">Vehicles</div></a>
    <a href="/downloads/coloring/pirates/" class="rel-card"><div class="rel-em">🏴‍☠️</div><div class="rel-name">Pirates</div></a>
    <a href="/downloads/coloring/princesses/" class="rel-card"><div class="rel-em">👸</div><div class="rel-name">Princesses</div></a>
    <a href="/colorear.html" class="rel-card"><div class="rel-em">🎨</div><div class="rel-name">All Coloring</div></a>
  </div>
</section>
<section class="sec">
  <h2>Frequently Asked Questions</h2>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">Is this ${topic.toLowerCase()} coloring page free? <span>+</span></div><div class="faq-a">Yes — completely free, no registration or payment needed. Print as many copies as you like for home or classroom use.</div></div>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">What age is this coloring page for? <span>+</span></div><div class="faq-a">This coloring page is designed for children aged 4–8. The thick outlines and large areas are easy to color with crayons, markers or colored pencils.</div></div>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">Can I use this in my classroom? <span>+</span></div><div class="faq-a">Yes! All ChartKids coloring pages are free for home and classroom use. Print as many class copies as you need.</div></div>
</section>
</main>
<footer><p>© 2025 ChartKids · <a href="/">Home</a> · <a href="/downloads/coloring/">Coloring Pages</a> · <a href="${catPath}">${catLabel}</a> · <a href="/privacy.html">Privacy</a></p></footer>
<script>
function faq(el){const it=el.parentElement;it.classList.toggle('open');el.querySelector('span').textContent=it.classList.contains('open')?'−':'+';}
window.setLang=()=>location.reload();
</script>
</body>
</html>`;
}

// ── Sitemap updater ───────────────────────────────────────────────────────────
function addUrlsToSitemap(newUrls) {
  let xml = fs.readFileSync(SITEMAP_FILE, 'utf8');
  const today = new Date().toISOString().split('T')[0];

  const entries = newUrls.map(url => `
  <url>
    <loc>https://www.chartkids.com${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`).join('');

  xml = xml.replace('</urlset>', entries + '\n</urlset>');
  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log(`  ✓ sitemap.xml updated with ${newUrls.length} new URL(s)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const metadata = loadMetadata();
  const newSitemapUrls = [];
  let count = 0;

  for (const [category, topicList] of Object.entries(topics)) {
    if (CATEGORY_FILTER && category !== CATEGORY_FILTER) continue;

    for (const topic of topicList) {
      if (count >= LIMIT) break;

      const slug = slugify(topic);
      const key = `${category}/${slug}`;
      const pageDir = path.join(COLORING_OUT, category, slug);
      const pageFile = path.join(pageDir, 'index.html');
      const svgFile = path.join(GENERATED_DIR, 'svgs', category, `${slug}.svg`);
      const url = `/downloads/coloring/${category}/${slug}/`;

      // Skip if already generated
      if (metadata[key]) {
        console.log(`  skip  ${key} (already generated)`);
        continue;
      }

      console.log(`\n  gen   ${key}`);

      if (DRY_RUN) {
        console.log(`  [dry] would call API and write:\n        ${pageFile}`);
        count++;
        continue;
      }

      try {
        // 1. Generate SVG via Claude API
        console.log(`        calling claude...`);
        const svg = await generateSVG(topic);
        console.log(`        svg ${svg.length} chars`);

        // 2. Save raw SVG
        ensureDir(path.dirname(svgFile));
        fs.writeFileSync(svgFile, svg);

        // 3. Write HTML page
        ensureDir(pageDir);
        const html = generateHTMLPage(topic, slug, category, svg);
        fs.writeFileSync(pageFile, html);
        console.log(`        wrote ${pageFile}`);

        // 4. Track in metadata
        metadata[key] = {
          topic,
          category,
          slug,
          url,
          generated: new Date().toISOString(),
          svgChars: svg.length
        };
        saveMetadata(metadata);

        newSitemapUrls.push(url);
        count++;

        // Rate limit
        if (count < LIMIT) await sleep(DELAY_MS);

      } catch (err) {
        console.error(`  ERROR ${key}: ${err.message}`);
        count++; // count errors toward limit so --limit always stops
      }
    }

    if (count >= LIMIT) break;
  }

  // Update sitemap with new pages
  if (!DRY_RUN && newSitemapUrls.length > 0) {
    addUrlsToSitemap(newSitemapUrls);
  }

  console.log(`\n✓ Done. Generated ${count} page(s).`);
  if (newSitemapUrls.length > 0) {
    console.log(`  New URLs:\n${newSitemapUrls.map(u => '  ' + u).join('\n')}`);
    console.log(`\n  Push to production:\n  git add -A && git commit -m "Add generated coloring pages" && git push origin main`);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
