'use strict';
// printables/build-kits.js — Premium printable kits as multi-page PDFs.
// Each kit = cover page + its sheets (US Letter, one per page) + answer keys at the end.
// PDFs are written to printables/cache/kits/ (git-ignored, NOT published on the site);
// they are uploaded to Workers KV and served only to verified subscribers by /api/kit.
// Run: node printables/build-kits.js            → build PDFs + data/kits.json
//      node printables/build-kits.js --upload   → also upload them to KV (remote)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const L = require('./lib');

const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.join(__dirname, 'cache', 'kits');

const manifest = cat => JSON.parse(fs.readFileSync(path.join(L.ROOT, 'data', 'printables', `${cat}.json`), 'utf8'));
const own = cat => manifest(cat).items.filter(i => !i.href).map(i => ({ ...i, cat }));
const pick = (cat, fn) => own(cat).filter(fn);
const bySlug = (cat, slugs) => slugs.map(s => { const i = own(cat).find(x => x.slug === s); if (!i) throw new Error(`${cat}/${s} not found`); return i; });

// [id, title_es, title_en, emoji, color, description_es, items]
const KITS = [
  ['kit-laberintos', 'Kit de Laberintos', 'Maze Kit', '🌀', '#7c3aed', '30 laberintos de los tres niveles, del más fácil al más difícil, con soluciones.',
    () => { const m = own('laberintos'); return ['facil', 'medio', 'dificil'].flatMap(d => m.filter(i => i.diff === d).slice(0, 10)); }],
  ['kit-primeros-numeros', 'Kit Primeros Números', 'First Numbers Kit', '🔢', '#ca8a04', 'Contar, comparar y sumar con dibujos: 24 fichas para preescolar con respuestas.',
    () => pick('matematicas', i => i.diff === 'facil').slice(0, 24)],
  ['kit-tablas-de-multiplicar', 'Kit Tablas de Multiplicar', 'Times Tables Kit', '✖️', '#ca8a04', 'Las tablas del 2 al 9 más multiplicación en columna y división: 16 fichas con respuestas.',
    () => [...pick('matematicas', i => i.slug.startsWith('tabla-del-')), ...pick('matematicas', i => /^(multiplicar-2x1|division)-[1-4]$/.test(i.slug))]],
  ['kit-abecedario', 'Kit del Abecedario', 'Alphabet Kit', '🔤', '#6366f1', 'Las 27 letras del abecedario, de la A a la Z con la Ñ, en mayúscula y minúscula.',
    () => pick('escritura', i => i.slug.startsWith('letra-'))],
  ['kit-preescritura', 'Kit de Preescritura', 'Pre-writing Kit', '✏️', '#6366f1', 'Trazos, números del 0 al 9 y vocales: 24 fichas para preparar la mano antes de escribir.',
    () => pick('escritura', i => /^(trazos-|numero-|vocal-)/.test(i.slug))],
  ['kit-busca-y-encuentra', 'Kit Busca y Encuentra', 'Seek and Find Kit', '🔍', '#16a34a', '20 escenas para buscar y contar, de cuatro temas distintos, con soluciones.',
    () => ['oceano', 'granja', 'espacio', 'selva'].flatMap(s => pick('busca', i => i.slug.startsWith(`busca-${s}-`)))],
  ['kit-stem', 'Kit de Experimentos STEM', 'STEM Experiments Kit', '🔬', '#10b981', '15 experimentos para hacer en casa, con hoja de predicción y la explicación científica.',
    () => { const s = own('stem'); return [...s.filter(i => i.diff === 'facil').slice(0, 5), ...s.filter(i => i.diff === 'medio').slice(0, 5), ...s.filter(i => i.diff === 'dificil').slice(0, 5)]; }],
  ['kit-certificados', 'Kit de Certificados', 'Certificates Kit', '🏆', '#f59e0b', 'Los 50 certificados para premiar logros, valores y momentos especiales.',
    () => own('certificados')],
  ['kit-calendario-2027', 'Kit Calendario 2027', '2027 Calendar Kit', '📅', '#8b5cf6', 'Los 12 meses de 2027, el calendario anual y las rutinas de mañana, noche y tareas.',
    () => [...pick('calendarios', i => /-2027$/.test(i.slug) && i.slug !== 'calendario-anual-2027'), ...bySlug('calendarios', ['calendario-anual-2027', 'rutina-manana', 'rutina-noche', 'tareas-de-casa', 'tabla-de-estrellas'])]],
  ['kit-navidad', 'Kit de Navidad', 'Christmas Kit', '🎄', '#dc2626', 'Calendario de diciembre, cuenta regresiva, laberintos, búsquedas y certificado navideños.',
    () => [...bySlug('calendarios', ['calendario-diciembre-2026', 'cuenta-regresiva-navidad', 'cuenta-regresiva-reyes']),
           ...bySlug('laberintos', ['christmas-tree-maze-maze', 'winter-maze-maze', 'holiday-party-maze-maze']),
           ...pick('busca', i => i.slug.startsWith('busca-navidad-')),
           ...bySlug('certificados', ['estrella-semana', 'gratitud'])]],
];

const read = (cat, slug, file) => fs.readFileSync(path.join(L.ROOT, L.CATS[cat].dir, slug, file), 'utf8');

function kitHtml([id, es, , emoji, color, desc], items) {
  const withAnswers = items.filter(i => i.answer);
  const page = svg => `<section class="page">${svg.replace(/ width="816" height="1056"/, '')}</section>`;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${L.esc(es)} — ChartKids</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One&family=Andika:wght@400;700&display=swap" rel="stylesheet">
<style>
@page{size:letter;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Nunito',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:8.5in;height:11in;page-break-after:always;overflow:hidden}
.page svg{width:8.5in;height:11in;display:block}
.cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1in;background:${color}12;border:18px solid ${color}}
.cover .e{font-size:120px}.cover h1{font-family:'Fredoka One',cursive;font-size:56px;color:${color};margin:18px 0 12px}
.cover p{font-size:22px;color:#334155;max-width:6in;line-height:1.5}.cover .n{margin-top:26px;font-weight:900;font-size:20px;color:#1e293b}
.cover .b{margin-top:auto;font-family:'Fredoka One',cursive;font-size:30px;color:#7c3aed}.cover .b span{color:#f59e0b}
.cover .l{font-size:14px;color:#64748b;margin-top:8px}
.divider{display:flex;align-items:center;justify-content:center;font-family:'Fredoka One',cursive;font-size:52px;color:${color}}
</style></head><body>
<section class="page cover"><div class="e">${emoji}</div><h1>${L.esc(es)}</h1><p>${L.esc(desc)}</p>
<div class="n">${items.length} fichas${withAnswers.length ? ` + ${withAnswers.length} soluciones` : ''}</div>
<div class="b">Chart<span>Kids</span> 👑 Premium</div><div class="l">Para uso personal, en casa o en el salón de clases · chartkids.com</div></section>
${items.map(i => page(read(i.cat, i.slug, 'sheet.svg'))).join('\n')}
${withAnswers.length ? `<section class="page divider">✅ Soluciones</section>\n${withAnswers.map(i => page(read(i.cat, i.slug, 'answer.svg'))).join('\n')}` : ''}
</body></html>`;
}

function build() {
  fs.mkdirSync(OUT, { recursive: true });
  const meta = [];
  for (const kit of KITS) {
    const [id, es, en, emoji, color, desc, select] = kit;
    const items = select();
    if (items.length < 10) throw new Error(`${id}: only ${items.length} sheets`);
    const html = path.join(OUT, `${id}.html`), pdf = path.join(OUT, `${id}.pdf`);
    fs.writeFileSync(html, kitHtml(kit, items));
    if (fs.existsSync(pdf)) fs.rmSync(pdf);
    execFileSync(EDGE, ['--headless', '--disable-gpu', '--no-first-run', `--user-data-dir=${path.join(OUT, 'edge-profile')}`,
      '--no-pdf-header-footer', '--virtual-time-budget=8000', `--print-to-pdf=${pdf}`, 'file:///' + html.replace(/\\/g, '/')],
      { stdio: 'ignore', timeout: 180000 });
    if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 10000) throw new Error(`${id}: PDF not produced`);
    const pages = 1 + items.length + (items.some(i => i.answer) ? 1 + items.filter(i => i.answer).length : 0);
    const bytes = fs.statSync(pdf).size;
    meta.push({ id, title_es: es, title_en: en, emoji, color, desc_es: desc, sheets: items.length, pages, bytes,
      preview: items.slice(0, 4).map(i => `/${L.CATS[i.cat].dir}/${i.slug}/sheet.svg`) });
    console.log(`✓ ${id}: ${items.length} fichas, ${pages} páginas, ${(bytes / 1024).toFixed(0)} KB`);
  }
  fs.writeFileSync(path.join(L.ROOT, 'data', 'kits.json'), JSON.stringify(meta, null, 1));
  fs.rmSync(path.join(OUT, 'edge-profile'), { recursive: true, force: true });
  return meta;
}

function upload(meta) {
  for (const k of meta) {
    const pdf = path.join(OUT, `${k.id}.pdf`);
    if (k.bytes > 24 * 1024 * 1024) throw new Error(`${k.id}: too big for KV (${k.bytes})`);
    execFileSync(process.execPath, [require.resolve('wrangler/bin/wrangler.js'), 'kv', 'key', 'put', `kit:${k.id}`,
      '--path', pdf, '--binding', 'DATA', '--remote'], { cwd: L.ROOT, stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`↑ KV kit:${k.id}`);
  }
}

const meta = build();
if (process.argv.includes('--upload')) upload(meta);
