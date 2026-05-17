// ChartKids — Coloring page app logic

let lang = 'es';
let currentSVG = '';
let currentDesc = '';
let selectedSceneKey = '';

const TXT = {
  es: {
    heroTitle:'Dibujos para Colorear',
    heroDesc:'Describe lo que quieres colorear y nuestra IA elige el mejor dibujo de página completa para imprimir.',
    descLabel:'¿Qué quieres colorear hoy?',
    placeholder:'Ej: un dragón con castillo y montañas...',
    ideasLabel:'Ideas populares',
    ideas:['🐉 Dragón con castillo','🧜 Sirena bajo el mar','🚀 Astronauta en el espacio','🦕 Dinosaurios en el bosque','🦄 Unicornio con arcoíris','🏴‍☠️ Barco pirata','👸 Princesa en el jardín','🐄 Animales de la granja','🦸 Superhéroe en la ciudad','🐠 Vida bajo el océano','🎪 Circo con elefante','🐱 Gatito en el jardín'],
    btnGenerate:'🎨 Encontrar mi dibujo',
    loadingText:'Buscando el mejor dibujo para ti...',
    resultTitle:'¡Dibujo listo para colorear!',
    resultMatch:'🎨 Seleccionado por IA',
    printText:'Imprimir',
    dlText:'Descargar SVG',
    otherText:'Otro dibujo',
    backBtn:'← Descargables',
    galleryLabel:'O elige directamente de la galería',
    printSub:'Colorea con crayones o marcadores · chartkids.com',
  },
  en: {
    heroTitle:'Coloring Pages',
    heroDesc:'Describe what you want to color and our AI picks the best full-page drawing to print.',
    descLabel:"What do you want to color today?",
    placeholder:'E.g.: a dragon with a castle and mountains...',
    ideasLabel:'Popular ideas',
    ideas:['🐉 Dragon with castle','🧜 Mermaid underwater','🚀 Astronaut in space','🦕 Dinosaurs in the forest','🦄 Unicorn with rainbow','🏴‍☠️ Pirate ship','👸 Princess in the garden','🐄 Farm animals','🦸 Superhero in the city','🐠 Ocean life','🎪 Circus with animals','🐱 Kitten in the garden'],
    btnGenerate:'🎨 Find my drawing',
    loadingText:'Finding the best drawing for you...',
    resultTitle:'Drawing ready to color!',
    resultMatch:'🎨 AI selected',
    printText:'Print',
    dlText:'Download SVG',
    otherText:'New search',
    backBtn:'← Printables',
    galleryLabel:'Or choose directly from the gallery',
    printSub:'Color with crayons or markers · chartkids.com',
  }
};

function setLang(l) {
  lang = l;
  document.getElementById('btnES').classList.toggle('active', l === 'es');
  document.getElementById('btnEN').classList.toggle('active', l === 'en');
  applyTranslations();
  renderGallery();
}

function applyTranslations() {
  const t = TXT[lang];
  const ids = ['heroTitle','heroDesc','descLabel','loadingText','resultTitle','resultMatch','printText','dlText','otherText','backBtn','galleryLabel'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && t[id]) el.textContent = t[id];
  });
  document.getElementById('btnGenerateText').textContent = t.btnGenerate;
  document.getElementById('descInput').placeholder = t.placeholder;
  document.getElementById('ideasLabel').textContent = t.ideasLabel;
  const chips = document.querySelectorAll('#ideasGrid .idea-chip');
  t.ideas.forEach((txt, i) => { if (chips[i]) chips[i].textContent = txt; });
}

function useIdea(btn) {
  const txt = btn.textContent.replace(/^[\p{Emoji}‍️\s]+/u, '').trim();
  document.getElementById('descInput').value = txt;
  document.getElementById('descInput').focus();
}

// Score a scene against a description
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
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  let best = 'castle_dragon', bestScore = 0;
  Object.keys(SCENES).forEach(key => {
    const s = scoreScene(key, words);
    if (s > bestScore) { bestScore = s; best = key; }
  });
  return best;
}

function generate() {
  const desc = document.getElementById('descInput').value.trim();
  if (!desc) { document.getElementById('descInput').focus(); return; }

  currentDesc = desc;
  document.getElementById('btnGenerate').disabled = true;
  document.getElementById('loading').style.display = 'block';
  document.getElementById('resultCard').style.display = 'none';

  // Small delay so the loading animation shows
  setTimeout(() => {
    const key = pickScene(desc);
    selectedSceneKey = key;
    showResult(key);
    document.getElementById('btnGenerate').disabled = false;
    document.getElementById('loading').style.display = 'none';
  }, 800);
}

function showResult(key) {
  const scene = SCENES[key];
  if (!scene) return;
  currentSVG = scene.svg;
  const label = lang === 'es' ? scene.label_es : scene.label_en;
  document.getElementById('resultTitle').textContent = (lang === 'es' ? '🎨 ' : '🎨 ') + label;
  document.getElementById('svgStage').innerHTML = scene.svg;
  document.getElementById('resultCard').style.display = 'block';
  // Highlight matching card in gallery
  document.querySelectorAll('.gallery-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.key === key);
  });
  setTimeout(() => document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
}

function newSearch() {
  document.getElementById('resultCard').style.display = 'none';
  document.getElementById('descInput').value = '';
  document.getElementById('descInput').focus();
  document.querySelectorAll('.gallery-card').forEach(c => c.classList.remove('selected'));
}

function printDrawing() {
  if (!currentSVG) return;
  const t = TXT[lang];
  const title = currentDesc || (lang === 'es' ? 'Dibujo para colorear' : 'Coloring page');
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

function downloadSVG() {
  if (!currentSVG) return;
  const blob = new Blob([currentSVG], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `chartkids-colorear-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = Object.entries(SCENES).map(([key, scene]) => {
    const label = lang === 'es' ? scene.label_es : scene.label_en;
    const isSelected = key === selectedSceneKey;
    return `<div class="gallery-card${isSelected ? ' selected' : ''}" data-key="${key}" onclick="selectFromGallery('${key}')">
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
  showResult(key);
}

// Init
(function(){
  const p = new URLSearchParams(location.search);
  const urlLang = p.get('lang');
  if (urlLang === 'en') { lang = 'en'; }
  else if (!urlLang && (navigator.language || '').toLowerCase().startsWith('en')) { lang = 'en'; }
  setLang(lang);
  renderGallery();
})();
