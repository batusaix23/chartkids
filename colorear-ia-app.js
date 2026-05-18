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
  }
};

// Translation map: common Spanish drawing terms → English for AI prompt
const ES_TO_EN = {
  'dragón':'dragon','dragon':'dragon','castillo':'castle','montañas':'mountains',
  'paisaje':'landscape','fuego':'fire','caballero':'knight',
  'sirena':'mermaid','mar':'ocean','océano':'ocean','coral':'coral','pez':'fish','peces':'fish',
  'ballena':'whale','delfín':'dolphin','tiburón':'shark','pulpo':'octopus',
  'espacio':'space','cohete':'rocket','astronauta':'astronaut','planeta':'planet','luna':'moon','estrella':'star',
  'dinosaurio':'dinosaur','dinosaurios':'dinosaurs','bosque':'forest','selva':'jungle','árbol':'tree',
  'unicornio':'unicorn','arcoíris':'rainbow','magia':'magic','caballo':'horse',
  'pirata':'pirate','barco':'ship','tesoro':'treasure','isla':'island','vela':'sail',
  'granja':'farm','vaca':'cow','cerdo':'pig','gallina':'chicken','oveja':'sheep','tractor':'tractor',
  'princesa':'princess','flor':'flower','flores':'flowers','jardín':'garden','mariposa':'butterfly','corona':'crown',
  'superhéroe':'superhero','héroe':'hero','ciudad':'city','edificios':'buildings','capa':'cape',
  'circo':'circus','elefante':'elephant','payaso':'clown','carpa':'tent','acróbata':'acrobat',
  'gato':'cat','gatito':'kitten','perro':'dog','pájaro':'bird','conejo':'rabbit',
  'bajo':'under','el':'the','un':'a','una':'a','con':'with','en':'in','de':'of','y':'and',
  'feliz':'happy','grande':'big','pequeño':'small','volando':'flying','saltando':'jumping',
  'nube':'cloud','nubes':'clouds','sol':'sun','luna':'moon','arco iris':'rainbow',
  'robot':'robot','nave espacial':'spaceship','castillo medieval':'medieval castle',
};

function translateForPrompt(desc) {
  let result = desc.toLowerCase();
  Object.entries(ES_TO_EN).forEach(([es, en]) => {
    result = result.replace(new RegExp(es, 'gi'), en);
  });
  return result;
}

function buildPrompt(desc) {
  const translated = translateForPrompt(desc);
  return encodeURIComponent(
    `children coloring book page, thick bold black outlines, pure white background, ` +
    `black and white only no colors, clean line art, printable coloring page, ` +
    `professional children illustration, simple clear outlines, ` +
    `${translated}, ` +
    `coloring page style, black outline drawing, white fill`
  );
}

function generateWithPollinations(desc) {
  return new Promise((resolve, reject) => {
    const seed = Math.floor(Math.random() * 99999);
    const prompt = buildPrompt(desc);
    const url = `${POLLINATIONS}/${prompt}?width=1500&height=1950&nologo=true&model=flux&seed=${seed}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      img.src = ''; // cancel
      reject(new Error('timeout'));
    }, 40000);

    img.onload = () => {
      clearTimeout(timer);
      resolve(url);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('load error'));
    };
    img.src = url;
  });
}

// ─── Main generate flow ─────────────────────────────────────
async function generate() {
  const desc = document.getElementById('descInput').value.trim();
  if (!desc) { document.getElementById('descInput').focus(); return; }

  currentDesc = desc;
  currentImageUrl = '';
  currentSVG = '';
  document.getElementById('btnGenerate').disabled = true;
  document.getElementById('resultCard').style.display = 'none';
  document.getElementById('loading').style.display = 'block';

  const t = TXT[lang];
  const loadEl = document.getElementById('loadingText');

  // Show countdown hint
  loadEl.textContent = t.loadingAI;
  let elapsed = 0;
  const ticker = setInterval(() => {
    elapsed += 5;
    if (elapsed < 40) loadEl.textContent = t.loadingAI.replace('10-25', `~${Math.max(5, 25 - elapsed)}`);
  }, 5000);

  try {
    const url = await generateWithPollinations(desc);
    clearInterval(ticker);
    currentImageUrl = url;
    showImageResult(url, true);
  } catch (e) {
    clearInterval(ticker);
    loadEl.textContent = t.loadingFallback;
    await new Promise(r => setTimeout(r, 600));
    const key = pickScene(desc);
    selectedSceneKey = key;
    currentSVG = SCENES[key].svg;
    showSVGResult(key, false);
  }

  document.getElementById('loading').style.display = 'none';
  document.getElementById('btnGenerate').disabled = false;
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

function printDrawing() {
  const t = TXT[lang];
  const title = currentDesc || (lang === 'es' ? 'Dibujo para colorear' : 'Coloring page');

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
    a.download = `chartkids-colorear-${Date.now()}.jpg`;
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
function setLang(l) {
  lang = l;
  document.getElementById('btnES').classList.toggle('active', l === 'es');
  document.getElementById('btnEN').classList.toggle('active', l === 'en');
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
  if (urlLang === 'en') { lang = 'en'; }
  else if (!urlLang && (navigator.language||'').toLowerCase().startsWith('en')) { lang = 'en'; }
  setLang(lang);
})();
