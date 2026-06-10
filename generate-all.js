#!/usr/bin/env node
// generate-all.js — ChartKids master coloring page generator
// Reads master-coloring-pages-300.json and generates HTML + SVG + sitemap
// Usage: node generate-all.js [--dry-run] [--category=animals] [--limit=5] [--id=1]

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const GENERATED_DIR = path.join(BASE_DIR, 'generated');
const METADATA_FILE = path.join(GENERATED_DIR, 'metadata-coloring-all.json');
const OUT_DIR = path.join(BASE_DIR, 'coloring');
const SITEMAP_FILE = path.join(BASE_DIR, 'sitemap.xml');
const PAGES_FILE = path.join(BASE_DIR, 'master-coloring-pages-300.json');
const DELAY_MS = 3000;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CAT_FILTER = (args.find(a => a.startsWith('--category=')) || '').split('=')[1];
const ID_FILTER = parseInt((args.find(a => a.startsWith('--id=')) || '').split('=')[1]) || null;
const LIMIT = parseInt((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 999;
const FORCE = args.includes('--force');

if (DRY_RUN) console.log('[DRY RUN] No files will be written.\n');

if (!process.env.ANTHROPIC_API_KEY && !DRY_RUN) {
  console.error('Error: ANTHROPIC_API_KEY not set.\nRun: $env:ANTHROPIC_API_KEY = "sk-ant-..."');
  process.exit(1);
}

const client = new Anthropic();
const pages = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'));

const CATEGORY_EMOJIS = {
  animals: '🦁', dinosaurs: '🦕', space: '🚀', vehicles: '🚗',
  food: '🍕', fantasy: '🐉', jobs: '👷', sports: '⚽',
  nature: '🌻', holidays: '🎄', superheroes: '🦸', pets: '🐾'
};

const CATEGORY_COLORS = {
  animals: '#22c55e', dinosaurs: '#ef4444', space: '#06b6d4', vehicles: '#f59e0b',
  food: '#f97316', fantasy: '#a78bfa', jobs: '#34d399', sports: '#3b82f6',
  nature: '#84cc16', holidays: '#ec4899', superheroes: '#f43f5e', pets: '#fb923c'
};

const CATEGORY_LABELS = {
  animals: 'Animals', dinosaurs: 'Dinosaurs', space: 'Space', vehicles: 'Vehicles',
  food: 'Food & Fruits', fantasy: 'Princesses & Fantasy', jobs: 'Jobs & Careers', sports: 'Sports',
  nature: 'Nature & Seasons', holidays: 'Holidays', superheroes: 'Superheroes', pets: 'Pets & Insects'
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function loadMetadata() {
  return fs.existsSync(METADATA_FILE) ? JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')) : {};
}
function saveMetadata(meta) {
  ensureDir(GENERATED_DIR);
  fs.writeFileSync(METADATA_FILE, JSON.stringify(meta, null, 2));
}

function buildSEO(page) {
  const { title, category, age, difficulty } = page;
  const catLabel = CATEGORY_LABELS[category] || category;
  return {
    pageTitle: `Free ${title} Coloring Page for Kids — Print Instantly | ChartKids`,
    metaDesc: `Free printable ${title.toLowerCase()} coloring page for kids ages ${age}. ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} level. Download and print instantly, no sign-up needed.`,
    keywords: `${title.toLowerCase()} coloring page, ${title.toLowerCase()} printable, ${catLabel.toLowerCase()} coloring page kids, free coloring page ${title.toLowerCase()}, printable ${title.toLowerCase()} coloring sheet`
  };
}

const BACKGROUND_HINTS = {
  animals:     'Add a simple environment background fitting the animal: savanna with grass tufts and a distant tree for land mammals; ocean floor with seaweed and bubbles for sea creatures; snowy ground with snowflakes for arctic animals; jungle with large leaves for tropical animals. Keep backgrounds as clean outlines only.',
  dinosaurs:   'Add a simple prehistoric background: volcanic mountains in the distance, large fern leaves, a few palm trees, or rocky terrain. Keep it simple but rich enough to color.',
  vehicles:    'Add a simple environment behind the vehicle: road with lane markings and a horizon line for cars/trucks; blue sky with clouds for aircraft; ocean waves for boats and submarines; city buildings in the background for urban vehicles.',
  space:       'Add a space background: small star dots scattered across the canvas, a distant planet or two, and maybe a nebula outline. Keep it simple but filled with coloring areas.',
  superheroes: 'Add a simple city skyline silhouette at the bottom with a few clouds in the sky. Include some action star-burst or motion lines in the background.',
  fantasy:     'Add a fantasy environment: castle walls or towers for royalty, a forest with tall trees for fairies, a starry sky with moon for magical scenes, ocean waves for mermaids. Make it immersive but simple.',
  jobs:        'Add the work environment as background: a hospital room for doctors, a classroom with a chalkboard for teachers, a kitchen for chefs, construction site for builders. Keep props clear and simple.',
  sports:      'Add the sports venue: field lines and goal for soccer, basketball court lines for basketball, pool lane lines for swimmers, a race track for cyclists. Keep it clean and geometric.',
  food:        'Place the food on a simple table or plate. Add a few decorative elements around it: stars, hearts, small sparkles, a fork and knife, or a napkin. Make the whole scene fun and inviting.',
  nature:      'This is a landscape/nature scene — make it full and detailed with plenty of coloring areas: sky with clouds, ground with grass tufts, flowers, trees, birds, and distant mountains or hills.',
  holidays:    'Add festive background elements: Christmas lights and snowflakes for Christmas; orange and bat silhouettes for Halloween; colorful eggs and flowers for Easter; streamers and confetti for birthday/party themes.',
  pets:        'Add a simple home or garden background: a cozy rug or pet bed for indoor pets, a garden with flowers and grass for outdoor scenes, an aquarium with seaweed for fish. Make it warm and inviting.',
};

const ACCURACY_HINTS = {
  animals:     'Draw the animal with species-accurate anatomy: correct body proportions, distinctive markings (mane on lions, spots on giraffes and leopards, stripes on zebras and tigers), correct ear/snout/tail shape for the species. A giraffe must have a very long neck, ossicones, and a spotted coat pattern. A bear must look bear-like with a broad head, small ears, and stocky body. Avoid generic cartoon blobs — the animal must be instantly recognizable.',
  dinosaurs:   'Draw anatomically accurate dinosaurs: T-Rex needs tiny arms, large head with rows of teeth, thick tail for balance; Triceratops needs 3 horns and a large neck frill; Stegosaurus needs alternating back plates and a spiked tail; Pterodactyl needs wings and a long beak crest. Show correct posture — bipedal dinosaurs stand upright. Avoid generic "lizard with legs" — each dinosaur species has a unique, recognizable silhouette.',
  vehicles:    'Draw mechanically accurate vehicles: correct wheel count and placement, realistic proportions, visible engine areas, windows with frames, headlights, and bumpers. Fire truck needs an extending ladder and hose reels. Police car needs roof lights. Ambulance needs cross symbol and rear doors. Airplane needs wings, engines, tail fin, and landing gear. Avoid toy-like blob shapes — each vehicle should look like its real-world counterpart.',
  space:       'Draw accurate space subjects: rockets need engine bell nozzles at bottom, body segments, and fin stabilizers; planets need their iconic features (Saturn MUST have rings, Earth needs continent outlines, Jupiter needs storm bands); astronaut suits need helmet with visor, oxygen pack, and gloves. Stars should be scattered across the background. Avoid generic "flying saucer" defaults — draw the specific space subject accurately.',
  superheroes: 'Draw the superhero in a dynamic full-body action pose: flying with arm forward, leaping, or landing. Include costume details: cape, logo/emblem on chest, mask, boots, gloves. Show speed lines or energy effects around them. The pose should feel powerful and heroic, not stiff. Background city skyline adds depth.',
  fantasy:     'Draw fantasy subjects with authentic detail: castles need stone block texture on towers, crenellated battlements, a drawbridge, and flags on spires; mermaids need a fish tail with visible scale texture and fin, long flowing hair; dragons need wings with membrane detail, scale texture on body, claws, and horns; fairies need delicate wings with vein patterns, a wand with a star. Each fantasy creature must look like its classic depiction.',
  jobs:        'Draw professionals with their full uniform AND tools in use: doctor in white coat actively using a stethoscope with a patient bed visible; chef in tall toque hat holding a spatula over a stove; firefighter in helmet and gear holding a hose; teacher in front of a chalkboard with writing on it; builder with hard hat and tool belt. The person should be doing their job, not just standing still.',
  sports:      'Draw athletes with correct sport-specific body mechanics and equipment: soccer player mid-kick with ball at foot; basketball player jumping toward a hoop; swimmer mid-stroke with lane markers; tennis player swinging racket. Include sport-specific gear: correct uniform, equipment, venue markings. The pose must match the sport action — not just a person holding a ball.',
  food:        'Draw food with realistic visual accuracy and appealing detail: pizza as a round pie with visible crust edge, sauce, melted cheese stretching, and toppings (pepperoni circles, mushroom slices, bell pepper rings); hamburger with visible bun texture, lettuce leaf, tomato slice, patty, and sauce; ice cream with swirled soft-serve or multiple scoops with drips; cake with visible layers and frosting details. Food must be mouth-watering and instantly recognizable.',
  nature:      'Draw a rich, accurate natural scene: trees with correct leaf shape for the species (oak has lobed leaves, pine has needles, palm has fronds), a visible trunk with bark texture, and ground roots. Mountains need a triangular silhouette with a rocky peak. Waterfalls need falling water lines, mist at the base, and surrounding rocks. Flowers need petals, stamens, and leaves. Fill the scene with accurate natural details at every depth: foreground, midground, and sky.',
  holidays:    'Draw holiday-specific imagery with accuracy: Christmas tree must be a conical pine shape with layered branches, ornament circles, garland lines, and a star on top with a wrapped gift at the base; Halloween needs a jack-o-lantern with a triangular nose, jagged mouth, and carved eyes; Easter has a basket with decorated eggs showing geometric patterns. Include the most iconic visual elements of the specific holiday.',
  pets:        'Draw pets with breed-accurate features: golden retriever has fluffy fur and floppy ears; Siamese cat has pointed ears and slim body; goldfish has flowing fins and round body; rabbit has long upright ears, a round fluffy tail, and a cleft nose. Show the pet in a natural pose: a dog sitting up, a cat grooming, a rabbit nibbling a carrot, a fish swimming. Add characteristic markings and textures (fur lines, feather patterns, scale shapes).',
};

function buildPrompt(page) {
  const bgHint = BACKGROUND_HINTS[page.category] || 'Fill the background with decorative elements: stars, flowers, clouds, and geometric shapes distributed across the entire canvas.';
  const accuracyHint = ACCURACY_HINTS[page.category] || 'Draw the subject with accurate, recognizable features — the viewer should be able to identify it immediately from the drawing alone.';
  return `You are a professional children's book illustrator. Create a COMPLETE, FULLY-DETAILED coloring page SVG.

SUBJECT: ${page.title}
CATEGORY: ${page.category}
AGE: ${page.age}

═══ VISUAL ACCURACY (MOST IMPORTANT) ═══
${accuracyHint}
The subject must be IMMEDIATELY RECOGNIZABLE. Draw its most iconic, defining visual features with care and accuracy.

═══ COMPOSITION (FILL THE WHOLE PAGE) ═══
- The ENTIRE 500×650 canvas must be filled — zero large empty white areas
- Main subject: drawn large (at least 60% of canvas height), centered, with interior detail lines
- MANDATORY background scene: ${bgHint}
- Ground line / floor / surface: always include a base that anchors the subject
- Fill corners and edges: small plants, rocks, stars, bubbles, or decorative elements
- Think FULL PAGE illustration — like a page from a professional coloring book

═══ DETAIL LEVEL ═══
- Main subject: detailed enough for a child to spend 10+ minutes coloring (fur texture lines, feather shapes, scale patterns, clothing folds, facial features)
- Background: at least 6 distinct elements (trees, clouds, rocks, waves, stars, etc.)
- Small fill elements: scattered in every empty area — blades of grass, tiny flowers, bubbles, leaf shapes

═══ SVG TECHNICAL RULES ═══
- ViewBox: 0 0 500 650
- Start with: <svg viewBox="0 0 500 650" xmlns="http://www.w3.org/2000/svg">
- First element: <rect width="500" height="650" fill="white"/>
- ALL shape fills: fill="white" (NEVER fill="none" on closed shapes)
- ALL strokes: stroke="#1a1a1a"
- Main outlines: stroke-width="4" or stroke-width="5"
- Interior detail lines: stroke-width="2" or stroke-width="2.5"
- Fine texture details: stroke-width="1.5"
- Eye pupils and tiny solid accents ONLY: fill="#1a1a1a"
- NO colors, NO gradients, NO opacity, NO patterns
- End with: </svg>

Output ONLY the raw SVG — no markdown, no explanation, no code blocks. Start immediately with <svg`;
}

async function generateSVG(page) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: buildPrompt(page) }]
  });
  let text = response.content[0].text.trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  const match = text.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) throw new Error('No valid SVG in response');
  return match[0];
}

function generateHTMLPage(page, svg) {
  const { title, slug, category, age, difficulty } = page;
  const seo = buildSEO(page);
  const catLabel = CATEGORY_LABELS[category] || category;
  const catColor = CATEGORY_COLORS[category] || '#06b6d4';
  const catEmoji = CATEGORY_EMOJIS[category] || '🎨';
  const svgForPage = svg.replace(/\s+width="[^"]*"/, '').replace(/\s+height="[^"]*"/, '');
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

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
  <button class="btn-print" onclick="window.print()">🖨️ Print Now — Free</button>
  <a href="/downloads/coloring/${category}/" class="btn-back">← More ${catLabel}</a>
</div>
<section class="sec">
  <h2>More Free Coloring Pages</h2>
  <div class="rel-grid">
    <a href="/downloads/coloring/animals/" class="rel-card"><div class="rel-em">🦁</div><div class="rel-name">Animals</div></a>
    <a href="/downloads/coloring/dinosaurs/" class="rel-card"><div class="rel-em">🦕</div><div class="rel-name">Dinosaurs</div></a>
    <a href="/downloads/coloring/space/" class="rel-card"><div class="rel-em">🚀</div><div class="rel-name">Space</div></a>
    <a href="/downloads/coloring/vehicles/" class="rel-card"><div class="rel-em">🚗</div><div class="rel-name">Vehicles</div></a>
    <a href="/downloads/coloring/fantasy/" class="rel-card"><div class="rel-em">🐉</div><div class="rel-name">Fantasy</div></a>
    <a href="/downloads/dot-to-dot/" class="rel-card"><div class="rel-em">✏️</div><div class="rel-name">Dot to Dot</div></a>
    <a href="/downloads/mazes/easy/" class="rel-card"><div class="rel-em">🟢</div><div class="rel-name">Mazes</div></a>
    <a href="/imprime-y-juega.html" class="rel-card"><div class="rel-em">🖨️</div><div class="rel-name">All Printables</div></a>
  </div>
</section>
<section class="sec">
  <h2>Frequently Asked Questions</h2>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">Is this coloring page free? <span>+</span></div><div class="faq-a">Yes — completely free, no registration needed. Download and print as many copies as you like for personal or classroom use.</div></div>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">What age is this coloring page for? <span>+</span></div><div class="faq-a">This ${title.toLowerCase()} coloring page is designed for children ages ${age}. The ${difficulty} difficulty level means ${difficulty === 'easy' ? 'large, simple shapes that are easy to color in' : difficulty === 'medium' ? 'moderate detail suitable for kids who have some coloring experience' : 'more detailed lines that challenge older kids'}.</div></div>
  <div class="faq-item"><div class="faq-q" onclick="faq(this)">Can I use this in my classroom? <span>+</span></div><div class="faq-a">Absolutely! All ChartKids coloring pages are free for personal and educational use. Print as many copies as you need for your students.</div></div>
</section>
</main>
<footer><p>© 2025 ChartKids · <a href="/">Home</a> · <a href="/downloads/coloring/">Coloring Pages</a> · <a href="/privacy.html">Privacy</a></p></footer>
<script>
function faq(el){const it=el.parentElement;it.classList.toggle('open');el.querySelector('span').textContent=it.classList.contains('open')?'−':'+';}
window.setLang=()=>location.reload();
</script>
</body>
</html>`;
}

function addUrlsToSitemap(newUrls) {
  let xml = fs.readFileSync(SITEMAP_FILE, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const entries = newUrls.map(url =>
    `\n  <url>\n    <loc>https://www.chartkids.com${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.75</priority>\n  </url>`
  ).join('');
  xml = xml.replace('</urlset>', entries + '\n</urlset>');
  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log(`  ✓ sitemap updated with ${newUrls.length} URL(s)`);
}

async function main() {
  const metadata = loadMetadata();
  const newSitemapUrls = [];
  let count = 0;

  let filtered = pages;
  if (CAT_FILTER) filtered = filtered.filter(p => p.category === CAT_FILTER);
  if (ID_FILTER) filtered = filtered.filter(p => p.id === ID_FILTER);

  console.log(`Processing ${filtered.length} page(s)${CAT_FILTER ? ` in category: ${CAT_FILTER}` : ''}...\n`);

  for (const page of filtered) {
    if (count >= LIMIT) break;
    const key = `coloring/${page.slug}`;
    if (metadata[key] && !FORCE) { console.log(`  skip  [${page.id}] ${key}`); continue; }
    console.log(`\n  gen   [${page.id}] ${key}`);

    if (DRY_RUN) {
      console.log(`  [dry] title: ${page.title}`);
      console.log(`  [dry] SEO:   ${buildSEO(page).pageTitle}`);
      console.log(`  [dry] path:  coloring/${page.slug}/index.html`);
      count++;
      continue;
    }

    try {
      const svg = await generateSVG(page);
      const pageDir = path.join(OUT_DIR, page.slug);
      ensureDir(pageDir);
      fs.writeFileSync(path.join(pageDir, 'index.html'), generateHTMLPage(page, svg));

      ensureDir(path.join(GENERATED_DIR, 'svgs', 'coloring'));
      fs.writeFileSync(path.join(GENERATED_DIR, 'svgs', 'coloring', `${page.slug}.svg`), svg);

      metadata[key] = {
        id: page.id, title: page.title, category: page.category,
        slug: page.slug, generated: new Date().toISOString()
      };
      saveMetadata(metadata);
      newSitemapUrls.push(`/coloring/${page.slug}/`);
      count++;
      if (count < LIMIT) await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  ERROR [${page.id}] ${key}: ${err.message}`);
      count++;
    }
  }

  if (!DRY_RUN && newSitemapUrls.length > 0) addUrlsToSitemap(newSitemapUrls);
  console.log(`\n✓ Done. Generated ${count} page(s).`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
