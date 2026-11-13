'use strict';
// printables/gen-busca.js — 100 seek-and-count sheets with answer keys.
// Run: node printables/gen-busca.js
// Objects are placed by code (no overlaps), so the count of every target is known
// exactly; the answer key circles each target and writes the totals.

const L = require('./lib');
const { W, BODY_TOP, BODY_BOTTOM, BODY_FONT, EMOJI_FONT, esc } = L;
const ink = '#1e293b';

// [id, es, en, frame color, emojis (first ones are good targets)]
const SCENES = [
  ['oceano', 'El Océano', 'The Ocean', '#0ea5e9', ['🐠', '🐙', '🦀', '🐢', '🐬', '🐳', '🦈', '🐡', '🐚', '⭐', '🦑', '🐟']],
  ['granja', 'La Granja', 'The Farm', '#65a30d', ['🐄', '🐷', '🐔', '🐑', '🐴', '🦆', '🐐', '🌽', '🥕', '🚜', '🐣', '🌻']],
  ['espacio', 'El Espacio', 'Outer Space', '#6366f1', ['🚀', '🪐', '⭐', '🌙', '👽', '🛸', '☄️', '🌍', '🛰️', '👨‍🚀', '🌟', '🔭']],
  ['selva', 'La Selva', 'The Jungle', '#16a34a', ['🐒', '🦜', '🐍', '🐯', '🦎', '🐸', '🍌', '🌴', '🦋', '🐘', '🦍', '🌺']],
  ['cocina', 'La Cocina', 'The Kitchen', '#f97316', ['🍎', '🥚', '🧀', '🍞', '🥛', '🍳', '🥄', '🍌', '🥕', '🍪', '🧁', '🍇']],
  ['dinosaurios', 'Mundo Dino', 'Dino World', '#84cc16', ['🦕', '🦖', '🥚', '🌋', '🌿', '🦴', '🌴', '🍃', '🐊', '🦎', '🌲', '☁️']],
  ['juguetes', 'Los Juguetes', 'Toys', '#ec4899', ['🧸', '⚽', '🪀', '🚂', '🎈', '🪁', '🎲', '🧩', '🚗', '🤖', '🎨', '🛴']],
  ['frutas', 'Las Frutas', 'Fruits', '#ef4444', ['🍓', '🍌', '🍉', '🍇', '🍍', '🍒', '🍊', '🍐', '🥝', '🍋', '🥭', '🍑']],
  ['bichos', 'El Jardín de Bichos', 'Bug Garden', '#22c55e', ['🐞', '🐝', '🦋', '🐛', '🐜', '🕷️', '🐌', '🌸', '🌼', '🍃', '🍄', '🌷']],
  ['navidad', 'La Navidad', 'Christmas', '#dc2626', ['🎄', '🎁', '⛄', '🔔', '🦌', '⭐', '🧦', '🎅', '❄️', '🍪', '🕯️', '🎀']],
  ['halloween', 'Halloween', 'Halloween', '#f59e0b', ['🎃', '👻', '🦇', '🕸️', '🍬', '🍭', '🌙', '🧙', '🕷️', '⭐', '🍫', '🧹']],
  ['playa', 'La Playa', 'The Beach', '#06b6d4', ['🏖️', '🐚', '⛱️', '🦀', '🌊', '☀️', '🕶️', '🍦', '⛵', '🐠', '🏄', '🐬']],
  ['ciudad', 'La Ciudad', 'The City', '#64748b', ['🚗', '🚌', '🚕', '🚦', '🏠', '🚲', '🚒', '🚓', '🏢', '🌳', '🚑', '🛵']],
  ['musica', 'La Música', 'Music', '#a855f7', ['🎸', '🥁', '🎺', '🎹', '🎻', '🎵', '🎤', '🎷', '🎶', '🪕', '📯', '🔔']],
  ['deportes', 'Los Deportes', 'Sports', '#2563eb', ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🥅', '🏆', '🥇', '🛹', '🎳']],
  ['clima', 'El Clima', 'Weather', '#0284c7', ['☀️', '🌧️', '⛅', '❄️', '🌈', '⚡', '☂️', '🌪️', '💧', '☁️', '🌙', '⭐']],
  ['escuela', 'La Escuela', 'School', '#7c3aed', ['✏️', '📚', '🎒', '📏', '✂️', '🖍️', '📐', '📓', '🖊️', '📎', '🧮', '🔬']],
  ['mascotas', 'Las Mascotas', 'Pets', '#f472b6', ['🐶', '🐱', '🐰', '🐹', '🐦', '🐟', '🐢', '🦴', '🧶', '🐾', '🥕', '🎾']],
  ['bosque', 'El Bosque', 'The Forest', '#15803d', ['🦊', '🦉', '🐿️', '🦔', '🐻', '🍄', '🌲', '🍂', '🌰', '🦌', '🐺', '🍁']],
  ['fiesta', 'La Fiesta', 'The Party', '#e11d48', ['🎈', '🎂', '🎁', '🎉', '🍰', '🎊', '🥳', '🍕', '🧃', '🍭', '🎀', '🍬']],
];

const LEVELS = [
  { diff: 'facil', age: '3-5', objects: 26, targets: 3, size: [60, 72], rot: 0 },
  { diff: 'facil', age: '3-5', objects: 32, targets: 4, size: [54, 66], rot: 10 },
  { diff: 'medio', age: '6-8', objects: 48, targets: 4, size: [46, 58], rot: 25 },
  { diff: 'medio', age: '6-8', objects: 62, targets: 5, size: [40, 52], rot: 35 },
  { diff: 'dificil', age: '9-12', objects: 90, targets: 6, size: [32, 46], rot: 60 },
];

// Scene area (leaves room for the "find these" panel at the bottom).
const AREA = { x: 46, y: BODY_TOP + 14, w: W - 92, h: BODY_BOTTOM - BODY_TOP - 190 };

function place(r, lv, emojis) {
  const targets = emojis.slice(0, lv.targets);
  // Each target appears 1–9 times with all counts different; the rest are distractors.
  const counts = new Map();
  const pool = L.shuffle([2, 3, 4, 5, 6, 7, 8, 9].filter(n => n <= Math.floor(lv.objects / (lv.targets + 2))), r);
  targets.forEach((e, i) => counts.set(e, pool[i % pool.length] - (i >= pool.length ? 1 : 0)));
  const list = [];
  for (const [e, n] of counts) for (let k = 0; k < n; k++) list.push(e);
  const distract = emojis.slice(lv.targets);
  while (list.length < lv.objects) list.push(distract[Math.floor(r() * distract.length)]);
  const items = [];
  for (const e of L.shuffle(list, r)) {
    let ok = null;
    for (let tries = 0; tries < 800 && !ok; tries++) {
      const s = lv.size[0] + r() * (lv.size[1] - lv.size[0]);
      const x = AREA.x + s * 0.55 + r() * (AREA.w - s * 1.1), y = AREA.y + s * 0.55 + r() * (AREA.h - s * 1.1);
      if (items.every(o => Math.hypot(o.x - x, o.y - y) > (o.s + s) * 0.5 + 4)) ok = { e, x, y, s, rot: (r() * 2 - 1) * lv.rot };
    }
    if (!ok) return null;                 // too crowded → caller retries with another seed
    items.push(ok);
  }
  return { items, counts };
}

function body(scene, lv, layout, answer) {
  const [, , , color] = scene;
  let s = `<rect x="${AREA.x - 6}" y="${AREA.y - 6}" width="${AREA.w + 12}" height="${AREA.h + 12}" rx="18" fill="${color}0f" stroke="${color}" stroke-width="3"/>`;
  for (const o of layout.items) {
    const hit = answer && layout.counts.has(o.e);
    if (hit) s += `<circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="${(o.s * 0.62).toFixed(1)}" fill="none" stroke="#dc2626" stroke-width="4"/>`;
    s += `<text x="${o.x.toFixed(1)}" y="${(o.y + o.s * 0.35).toFixed(1)}" text-anchor="middle" font-family="${EMOJI_FONT}" font-size="${o.s.toFixed(0)}"${o.rot ? ` transform="rotate(${o.rot.toFixed(0)} ${o.x.toFixed(1)} ${o.y.toFixed(1)})"` : ''}${answer && !hit ? ' opacity=".28"' : ''}>${o.e}</text>`;
  }
  // "Find and count" panel
  const py = AREA.y + AREA.h + 26, n = layout.counts.size, cw = (W - 80) / n;
  s += `<text x="${W / 2}" y="${py + 10}" text-anchor="middle" font-family="${BODY_FONT}" font-size="20" font-weight="900" fill="${color}">ENCUENTRA Y CUENTA</text>`;
  // emoji + answer box share each slot; both shrink when there are more targets
  const es = Math.min(54, cw * 0.36), bw = Math.min(64, cw * 0.4);
  [...layout.counts].forEach(([e, c], i) => {
    const cx = 40 + i * cw + cw / 2;
    s += `<text x="${cx - es * 0.62}" y="${py + 92}" text-anchor="middle" font-family="${EMOJI_FONT}" font-size="${es.toFixed(0)}">${e}</text>`;
    s += `<rect x="${cx + 4}" y="${py + 42}" width="${bw.toFixed(0)}" height="62" rx="12" fill="#fff" stroke="${ink}" stroke-width="3"/>`;
    if (answer) s += `<text x="${(cx + 4 + bw / 2).toFixed(0)}" y="${py + 88}" text-anchor="middle" font-family="${BODY_FONT}" font-size="36" font-weight="900" fill="#dc2626">${c}</text>`;
  });
  return s;
}

function build() {
  const items = [];
  for (const scene of SCENES) {
    LEVELS.forEach((lv, li) => {
      const slug = `busca-${scene[0]}-${li + 1}`;
      let layout = null;
      for (let attempt = 0; !layout && attempt < 30; attempt++) layout = place(L.rng(L.seedOf(`busca:${slug}:${attempt}`)), lv, scene[4]);
      if (!layout) throw new Error(`${slug}: could not place objects`);
      // verify the counts against the placed objects
      for (const [e, c] of layout.counts) {
        const real = layout.items.filter(o => o.e === e).length;
        if (real !== c || c < 1 || c > 9) throw new Error(`${slug}: count mismatch for ${e}`);
      }
      const title_es = `Busca y Encuentra: ${scene[1]} ${li + 1}`, title_en = `Seek and Find: ${scene[2]} ${li + 1}`;
      const common = { cat: 'busca', title: title_es, diff: lv.diff };
      items.push({
        slug, title_es, title_en, diff: lv.diff, age: lv.age,
        desc_es: `${title_es}: encuentra y cuenta los dibujos escondidos. Ficha gratis para imprimir, para niños de ${lv.age} años, con solución.`,
        desc_en: `${title_en}: find and count the hidden pictures. Free printable for kids aged ${lv.age}, answer key included.`,
        tip_es: 'Tacha cada dibujo con un lápiz cuando lo encuentres, así no lo cuentas dos veces.',
        tip_en: 'Cross off each picture with a pencil when you find it, so you never count it twice.',
        sheet: L.sheet({ ...common, instruction: '¿Cuántos hay? Búscalos en el dibujo', body: body(scene, lv, layout, false) }),
        answer: L.sheet({ ...common, instruction: 'Respuestas', body: body(scene, lv, layout, true), answer: true }),
      });
    });
  }
  return items;
}

if (require.main === module) {
  const items = build();
  const d = {}; items.forEach(i => { d[i.diff] = (d[i.diff] || 0) + 1; });
  console.log(items.length, d);
  L.writeCategory('busca', items);
}
module.exports = { build };
