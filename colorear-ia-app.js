// ChartKids — Coloring page app logic
// Image generation: Pollinations.ai (free, no token)

let lang = 'es';
let currentSVG = '';
let currentImageUrl = '';
let currentDesc = '';
let selectedSceneKey = '';
let genMode = 'ai'; // 'ai' | 'library'

const POLLINATIONS = 'https://image.pollinations.ai/prompt';

const TXT = {
  es: {
    heroTitle:'Dibujos para Colorear con IA',
    heroDesc:'Describe cualquier escena y nuestra IA genera el dibujo en segundos, listo para imprimir y colorear.',
    descLabel:'¿Qué quieres colorear hoy?',
    placeholder:'Ej: un dragón con castillo y paisaje de montañas...',
    ideasLabel:'Ideas populares',
    ideas:['🐉 Dragón con castillo','🧜 Sirena bajo el mar','🚀 Astronauta en el espacio','🦕 Dinosaurios en el bosque','🦄 Unicornio con arcoíris','🏴‍☠️ Barco pirata','👸 Princesa en el jardín','🐄 Animales de la granja','🦸 Superhéroe en la ciudad','🐠 Vida bajo el océano','🎪 Circo con elefante','🐱 Gatito en el jardín'],
    btnGenerate:'✨ Generar Dibujo',
    loadingAI:'Generando tu dibujo con IA… (10-25 seg)',
    loadingFallback:'Buscando el mejor dibujo...',
    resultTitle:'¡Dibujo listo para colorear!',
    resultAI:'🤖 Generado con IA',
    resultLib:'🎨 Biblioteca',
    printText:'Imprimir',
    dlText:'Descargar',
    otherText:'Nuevo dibujo',
    backBtn:'← Descargables',
    galleryLabel:'Biblioteca de dibujos',
    printSub:'Colorea con crayones o marcadores · chartkids.com',
    aiError:'La IA tardó demasiado. Mostrando dibujo de la biblioteca.',
    aiResting:'✨ Nuestra IA de dibujos está descansando por hoy. Te mostramos uno de la galería que se parece a lo que pediste.',
    notForKids:'🙈 Ese dibujo no es para niños. ¡Prueba con animales, dinosaurios, el espacio, princesas o superhéroes!',
  },
  en: {
    heroTitle:'AI Coloring Pages',
    heroDesc:'Describe any scene and our AI generates the drawing in seconds, ready to print and color.',
    descLabel:"What do you want to color today?",
    placeholder:'E.g.: a dragon with a castle and mountain landscape...',
    ideasLabel:'Popular ideas',
    ideas:['🐉 Dragon with castle','🧜 Mermaid underwater','🚀 Astronaut in space','🦕 Dinosaurs in the forest','🦄 Unicorn with rainbow','🏴‍☠️ Pirate ship','👸 Princess in the garden','🐄 Farm animals','🦸 Superhero in the city','🐠 Ocean life','🎪 Circus with animals','🐱 Kitten in the garden'],
    btnGenerate:'✨ Generate Drawing',
    loadingAI:'Generating your drawing with AI… (10-25 sec)',
    loadingFallback:'Finding the best drawing...',
    resultTitle:'Drawing ready to color!',
    resultAI:'🤖 AI Generated',
    resultLib:'🎨 Library',
    printText:'Print',
    dlText:'Download',
    otherText:'New drawing',
    backBtn:'← Printables',
    galleryLabel:'Drawing library',
    printSub:'Color with crayons or markers · chartkids.com',
    aiError:'AI took too long. Showing library drawing.',
    aiResting:'✨ Our drawing AI is resting for today. Here is a similar one from our gallery.',
    notForKids:"🙈 That drawing isn't for kids. Try animals, dinosaurs, space, princesses or superheroes!",
  }
};

// The Worker checks the request (word list + AI judge), rewrites it as a kid-friendly
// scene and draws it with FLUX. Pollinations is only a fallback, fed the checked subject.
const API_URL = 'https://chartkids.com/api/coloring-image';

// Style is fixed here; the Worker only supplies the (kid-safe, English) subject.
// Everything pushes toward a page a child can color: thick closed outlines, big
// areas, nothing pre-shaded.
function buildPrompt(subject) {
  return encodeURIComponent(
    `simple coloring book page for young children, ${subject}, ` +
    `cute friendly cartoon style, thick clean bold black outlines, large simple closed shapes, ` +
    `few details, big areas to color, pure white background, black and white line art only, ` +
    `no shading, no gray, no hatching, no texture, no filled black areas, no text, no letters, ` +
    `full figure centered with margin`
  );
}

// Ask the Worker to judge the request, rewrite it and (usually) draw it.
// Resolves {safe:true, subject, image?} | {safe:false}; rejects on network/server error.
async function getSafeSubject(desc) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 40000);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desc, lang }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error('coloring-prompt ' + res.status);
    const data = await res.json();
    if (data.safe === true && typeof data.subject === 'string' && data.subject) return data;
    return { safe: false };
  } finally {
    clearTimeout(timer);
  }
}

function loadImage(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { img.src = ''; reject(new Error('timeout')); }, timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('load error')); };
    img.src = url;
  });
}

// Force the image to pure black lines on white: removes the gray shading and
// soft fills image models add, so the printed page has clean areas to color.
// Returns a PNG data URL, or null if the browser blocks reading the pixels.
function toCleanLineArt(img) {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      // 170 keeps thin/soft outlines (110 erased them in tests) while dropping light gray shading.
      const v = lum < 170 ? 0 : 255;
      px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
    }
    ctx.putImageData(d, 0, 0);
    return c.toDataURL('image/png');
  } catch (e) {
    console.warn('Line-art cleanup skipped:', e.message);
    return null;
  }
}

async function generateWithPollinations(subject) {
  const seed = Math.floor(Math.random() * 99999);
  const url = `${POLLINATIONS}/${buildPrompt(subject)}?width=1024&height=1332&nologo=true&model=flux&safe=true&enhance=false&seed=${seed}`;
  const img = await loadImage(url, 45000);
  return toCleanLineArt(img) || url;
}

function showSafeMsg(text) {
  const el = document.getElementById('safeMsg');
  el.textContent = text;
  el.style.display = text ? 'block' : 'none';
}

function showLibraryFallback(desc) {
  const key = pickScene(desc);
  selectedSceneKey = key;
  currentSVG = SCENES[key].svg;
  showSVGResult(key, false);
}

// ─── Main generate flow ─────────────────────────────────────
async function generate() {
  const desc = document.getElementById('descInput').value.trim();
  if (!desc) { document.getElementById('descInput').focus(); return; }
  const t = TXT[lang];
  showSafeMsg('');

  // Layer 1: instant word check in the browser (same list the Worker uses).
  if (window.KidSafe && KidSafe.findBlocked(desc)) {
    showSafeMsg(t.notForKids);
    return;
  }

  currentDesc = desc;
  currentImageUrl = '';
  currentSVG = '';
  document.getElementById('btnGenerate').disabled = true;
  document.getElementById('resultCard').style.display = 'none';
  document.getElementById('loading').style.display = 'block';

  const loadEl = document.getElementById('loadingText');
  loadEl.textContent = t.loadingAI;
  let elapsed = 0;
  const ticker = setInterval(() => {
    elapsed += 5;
    if (elapsed < 40) loadEl.textContent = t.loadingAI.replace('10-25', `~${Math.max(5, 25 - elapsed)}`);
  }, 5000);

  try {
    // Layer 2: the Worker's AI judges the request and rewrites it.
    let check = null;
    try { check = await getSafeSubject(desc); } catch (e) { console.warn('coloring-image failed:', e.message); }

    if (check && check.safe === false) {
      showSafeMsg(t.notForKids);
    } else if (!check) {
      // Could not verify the request → never send raw text to the image model.
      loadEl.textContent = t.loadingFallback;
      showLibraryFallback(desc);
      showSafeMsg(t.aiResting);
    } else {
      try {
        let src;
        if (check.image) {
          const img = await loadImage(check.image, 10000);
          src = toCleanLineArt(img) || check.image;
        } else {
          src = await generateWithPollinations(check.subject);
        }
        currentImageUrl = src;
        showImageResult(src, true);
      } catch (e) {
        loadEl.textContent = t.loadingFallback;
        await new Promise(r => setTimeout(r, 600));
        showSafeMsg(t.aiError);
        showLibraryFallback(desc);
      }
    }
  } finally {
    clearInterval(ticker);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('btnGenerate').disabled = false;
  }
}

function showImageResult(url, isAI) {
  const t = TXT[lang];
  document.getElementById('resultTitle').textContent = t.resultTitle;
  document.getElementById('resultMatch').textContent = isAI ? t.resultAI : t.resultLib;
  document.getElementById('svgStage').innerHTML =
    `<img src="${url}" style="width:100%;height:auto;display:block;border-radius:8px;" alt="Coloring page">`;
  document.getElementById('resultCard').style.display = 'block';
  document.querySelectorAll('.gallery-card').forEach(c => c.classList.remove('selected'));
  setTimeout(() => document.getElementById('resultCard').scrollIntoView({ behavior:'smooth', block:'nearest' }), 80);
}

function showSVGResult(key, fromGallery) {
  const scene = SCENES[key];
  if (!scene) return;
  const t = TXT[lang];
  const label = lang === 'es' ? scene.label_es : scene.label_en;
  document.getElementById('resultTitle').textContent = '🎨 ' + label;
  document.getElementById('resultMatch').textContent = t.resultLib;
  document.getElementById('svgStage').innerHTML = scene.svg;
  document.getElementById('resultCard').style.display = 'block';
  document.querySelectorAll('.gallery-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.key === key);
  });
  if (!fromGallery)
    setTimeout(() => document.getElementById('resultCard').scrollIntoView({ behavior:'smooth', block:'nearest' }), 80);
}

// ─── Keyword matching for SVG fallback ──────────────────────
function scoreScene(sceneKey, words) {
  const scene = SCENES[sceneKey];
  if (!scene) return 0;
  let score = 0;
  words.forEach(w => {
    scene.keys.forEach(k => {
      if (k === w) score += 3;
      else if (k.includes(w) || w.includes(k)) score += 1;
    });
  });
  return score;
}

function pickScene(desc) {
  const words = desc.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(w => w.length > 2);
  let best = 'castle_dragon', bestScore = 0;
  Object.keys(SCENES).forEach(key => {
    const s = scoreScene(key, words);
    if (s > bestScore) { bestScore = s; best = key; }
  });
  return best;
}

// ─── UI helpers ─────────────────────────────────────────────
function newSearch() {
  document.getElementById('resultCard').style.display = 'none';
  document.getElementById('descInput').value = '';
  showSafeMsg('');
  currentImageUrl = '';
  currentSVG = '';
  document.getElementById('descInput').focus();
  document.querySelectorAll('.gallery-card').forEach(c => c.classList.remove('selected'));
}

function useIdea(btn) {
  const txt = btn.textContent.replace(/^[\p{Emoji}‍️\s]+/u, '').trim();
  document.getElementById('descInput').value = txt;
  document.getElementById('descInput').focus();
}

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function printDrawing() {
  const t = TXT[lang];
  const title = escHtml(currentDesc || (lang === 'es' ? 'Dibujo para colorear' : 'Coloring page'));

  if (currentImageUrl) {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${title} — ChartKids</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  @page{size:letter portrait;margin:0.3in 0.4in;}
  body{font-family:Arial,sans-serif;background:white;min-height:100vh;display:flex;flex-direction:column;}
  .hdr{text-align:center;padding-bottom:9px;border-bottom:2px dashed #ddd;margin-bottom:12px;flex-shrink:0;}
  .hdr h1{font-size:1.3rem;color:#7c3aed;font-weight:900;}
  .hdr p{font-size:.7rem;color:#aaa;margin-top:2px;}
  .drawing{flex:1;display:flex;align-items:center;justify-content:center;}
  .drawing img{width:100%;height:auto;max-height:88vh;object-fit:contain;display:block;}
  .ftr{text-align:center;padding-top:7px;border-top:2px dashed #ddd;margin-top:8px;font-size:.62rem;color:#ccc;flex-shrink:0;}
</style></head><body>
<div class="hdr"><h1>${title}</h1><p>${t.printSub}</p></div>
<div class="drawing"><img src="${currentImageUrl}" alt="Coloring page"></div>
<div class="ftr">chartkids.com · IA generativa</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);

  } else if (currentSVG) {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${title} — ChartKids</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  @page{size:letter portrait;margin:0.35in 0.45in;}
  body{font-family:Arial,sans-serif;background:white;height:100vh;display:flex;flex-direction:column;}
  .hdr{text-align:center;padding-bottom:10px;border-bottom:2px dashed #ddd;margin-bottom:14px;flex-shrink:0;}
  .hdr h1{font-size:1.35rem;color:#7c3aed;font-weight:900;}
  .hdr p{font-size:.72rem;color:#aaa;margin-top:2px;}
  .drawing{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;}
  .drawing svg{width:auto;height:auto;max-width:100%;max-height:100%;display:block;}
  .ftr{text-align:center;padding-top:8px;border-top:2px dashed #ddd;margin-top:10px;font-size:.65rem;color:#ccc;flex-shrink:0;}
</style></head><body>
<div class="hdr"><h1>${title}</h1><p>${t.printSub}</p></div>
<div class="drawing">${currentSVG}</div>
<div class="ftr">chartkids.com</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

function downloadDrawing() {
  if (currentImageUrl) {
    const a = document.createElement('a');
    a.href = currentImageUrl;
    a.download = `chartkids-colorear-${Date.now()}.${currentImageUrl.startsWith('data:') ? 'png' : 'jpg'}`;
    a.target = '_blank';
    a.click();
  } else if (currentSVG) {
    const blob = new Blob([currentSVG], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chartkids-colorear-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

// ─── Gallery ────────────────────────────────────────────────
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = Object.entries(SCENES).map(([key, scene]) => {
    const label = lang === 'es' ? scene.label_es : scene.label_en;
    return `<div class="gallery-card" data-key="${key}" onclick="selectFromGallery('${key}')">
      <div class="gallery-thumb">${scene.svg}</div>
      <div class="gallery-label">${label}</div>
    </div>`;
  }).join('');
  document.getElementById('gallerySection').style.display = 'block';
}

function selectFromGallery(key) {
  currentDesc = lang === 'es' ? SCENES[key].label_es : SCENES[key].label_en;
  document.getElementById('descInput').value = currentDesc;
  selectedSceneKey = key;
  currentImageUrl = '';
  currentSVG = SCENES[key].svg;
  showSVGResult(key, true);
  document.getElementById('resultCard').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ─── Translations ────────────────────────────────────────────
// Also called by the shared nav (ck-nav.js → cknSetLang), which owns the ES/EN buttons.
function setLang(l) {
  lang = l === 'en' ? 'en' : 'es';
  document.getElementById('btnES')?.classList.toggle('active', lang === 'es');
  document.getElementById('btnEN')?.classList.toggle('active', lang === 'en');
  applyTranslations();
  renderGallery();
}

function applyTranslations() {
  const t = TXT[lang];
  const map = {
    heroTitle:'heroTitle', heroDesc:'heroDesc', descLabel:'descLabel',
    ideasLabel:'ideasLabel', loadingText:'loadingAI',
    printText:'printText', dlText:'dlText', otherText:'otherText',
    backBtn:'backBtn', galleryLabel:'galleryLabel'
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && t[key]) el.textContent = t[key];
  });
  document.getElementById('btnGenerateText').textContent = t.btnGenerate;
  document.getElementById('descInput').placeholder = t.placeholder;
  const chips = document.querySelectorAll('#ideasGrid .idea-chip');
  t.ideas.forEach((txt, i) => { if (chips[i]) chips[i].textContent = txt; });
}

// ─── Init ────────────────────────────────────────────────────
(function(){
  const p = new URLSearchParams(location.search);
  const urlLang = p.get('lang');
  let saved = null;
  try { saved = localStorage.getItem('ck_lang'); } catch (e) {}   // set by the shared nav
  if (urlLang === 'en' || urlLang === 'es') lang = urlLang;
  else if (saved === 'en' || saved === 'es') lang = saved;
  else lang = 'es';   // same default as the shared nav, so its ES/EN highlight matches the page
  setLang(lang);
})();
