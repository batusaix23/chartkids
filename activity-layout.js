'use strict';
// activity-layout.js — shared dark-theme header/footer + bilingual helpers
// used by generate-tracing.js, generate-wordsearch.js and generate-patterns.js.

const FONTS_LINK = '<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">';
const LANG_SCRIPT = '<script src="/js/lang.js" defer></script>';

const CAT_EN = {
  animals:'Animals',dinosaurs:'Dinosaurs',vehicles:'Vehicles',space:'Space',
  superheroes:'Superheroes',fantasy:'Fantasy',jobs:'Jobs',sports:'Sports',
  food:'Food',nature:'Nature',holidays:'Holidays',pets:'Pets',
};

const NAV_LINKS = [
  { href:'/tracing/',    es:'Trazado',     en:'Tracing',     type:'tracing' },
  { href:'/wordsearch/', es:'Sopa',        en:'Word Search', type:'wordsearch' },
  { href:'/patterns/',   es:'Patrones',    en:'Patterns',    type:'patterns' },
  { href:'/maze/',       es:'Laberintos',  en:'Mazes',       type:'maze' },
  { href:'/crear/',      es:'✨ Crear',    en:'✨ Create',   type:'crear' },
];

function escAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escText(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Element whose text lang.js swaps between Spanish and English.
function bi(tag, es, en, attrs = '') {
  return `<${tag}${attrs ? ' ' + attrs : ''} data-es="${escAttr(es)}" data-en="${escAttr(en)}">${escText(es)}</${tag}>`;
}

function catEn(cat) {
  if (!CAT_EN[cat]) throw new Error(`activity-layout: no English name for category "${cat}"`);
  return CAT_EN[cat];
}

function siteHeader(activeType) {
  const links = NAV_LINKS.map(l =>
    bi('a', l.es, l.en, `href="${l.href}"${l.type === activeType ? ' class="active"' : ''}`)
  ).join('');
  return `<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">Chart<span>Kids</span> ✨</a>
  <div class="header-right">
    <nav class="main-nav">${links}</nav>
    <div class="lang-toggle">
      <button class="lang-btn active" id="btnES" onclick="setLang('es')">🇲🇽 ES</button>
      <button class="lang-btn" id="btnEN" onclick="setLang('en')">🇺🇸 EN</button>
    </div>
  </div>
</div></header>`;
}

function siteFooter() {
  return `<footer class="site-footer"><div class="container footer-inner">
  <span>© ${new Date().getFullYear()} ChartKids</span>
  ${bi('a', 'Privacidad', 'Privacy', 'href="/privacy.html"')}
  ${bi('a', 'Blog', 'Blog', 'href="/blog/"')}
</div></footer>`;
}

function activityHero(h1, desc) {
  return `<div class="activity-hero">${bi('h1', h1.es, h1.en)}${bi('p', desc.es, desc.en)}</div>`;
}

function printButton() {
  return `<button onclick="window.print()" class="btn-print">${bi('span', '🖨️ Imprimir', '🖨️ Print')}</button>`;
}

// Share-card tags for a printable page; og.jpg is rendered by printables/build-og.js.
function ogMeta(pathname, title) {
  const url = 'https://www.chartkids.com' + pathname;
  return `<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escAttr(title)} — ChartKids">
<meta property="og:image" content="${url}og.jpg">
<meta property="og:image:width" content="1000">
<meta property="og:image:height" content="525">
<meta name="twitter:card" content="summary_large_image">`;
}

module.exports = {
  ogMeta,
  FONTS_LINK, LANG_SCRIPT, escAttr, escText, bi, catEn,
  siteHeader, siteFooter, activityHero, printButton,
};
