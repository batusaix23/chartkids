'use strict';
// printables/upgrade-legacy.js — puts the older printable collections (tracing,
// wordsearch, counting, patterns; built by generate-*.js in the repo root) on the same
// item page as the new categories (printables/lib.js itemPage): shared nav, print,
// prev/next, related sheets, share image, structured data. URLs stay the same.
// Each generate-*.js calls upgrade('<dir>') at the end, so re-running a generator never
// brings the old page format back. Idempotent.
// Run by hand: node printables/upgrade-legacy.js [tracing|wordsearch|counting|patterns]

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const BY_DIR = { tracing: 'trazado', wordsearch: 'sopas', counting: 'conteo', patterns: 'patrones' };
const LEVEL_OF = slug => /-hard-/.test(slug) ? 'dificil' : /-medium-/.test(slug) ? 'medio' : 'facil';
const AGE = { facil: '3-5', medio: '6-8', dificil: '9-12' };
const unq = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function upgrade(dir) {
  const cat = BY_DIR[dir];
  if (!cat) throw new Error(`unknown legacy dir ${dir}`);
  const base = path.join(L.ROOT, dir);
  const items = [];
  for (const slug of fs.readdirSync(base).sort()) {
    const page = path.join(base, slug, 'index.html');
    if (!fs.existsSync(page)) continue;
    const html = fs.readFileSync(page, 'utf8');
    const h1 = html.match(/<h1[^>]*data-es="([^"]*)"[^>]*data-en="([^"]*)"/);
    const svg = html.match(/<svg[\s\S]*?<\/svg>/);
    if (!h1 || !svg) throw new Error(`${dir}/${slug}: title or drawing not found`);
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    const diff = dir === 'tracing' ? 'facil' : LEVEL_OF(slug);
    const sheet = svg[0].includes('xmlns=') ? svg[0] : svg[0].replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    items.push({
      slug, title_es: unq(h1[1]), title_en: unq(h1[2]), diff, age: AGE[diff], sheet,
      desc_es: desc ? unq(desc) : undefined,
      tip_es: 'Imprime la ficha en tamaño carta. Si te equivocas, ¡usa una goma y vuelve a intentar!',
      tip_en: 'Print on letter-size paper. Made a mistake? Erase it and try again!',
    });
  }
  const write = (file, content) => { if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) fs.writeFileSync(file, content); };
  items.forEach((it, i) => {
    write(path.join(base, it.slug, 'index.html'), L.itemPage(cat, it, i, items));
    write(path.join(base, it.slug, 'sheet.svg'), it.sheet);
  });
  const c = L.CATS[cat];
  write(path.join(base, 'index.html'), `<!DOCTYPE html><meta charset="utf-8"><title>${L.esc(c.es)} | ChartKids</title><link rel="canonical" href="${L.SITE}/${c.page}"><meta http-equiv="refresh" content="0;url=/${c.page}"><a href="/${c.page}">${L.esc(c.es)}</a>`);
  console.log(`✓ ${dir}: ${items.length} fichas en el formato nuevo`);
  return items.length;
}

module.exports = { upgrade };
if (require.main === module) {
  const dirs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(BY_DIR);
  dirs.forEach(upgrade);
}
