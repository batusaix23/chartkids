'use strict';
// printables/gen-escritura.js — 100 handwriting worksheets.
// Run: node printables/gen-escritura.js
//
// Each row sits on 4 guide lines (ascender, dashed midline, baseline, descender).
// Rows: 1 solid model → 2 traceable (light fill + dashed outline) → blank rows to write alone.
// Letters use Andika, a typeface made for early readers (single-storey a and g).

const L = require('./lib');
const { W, BODY_TOP, BODY_BOTTOM, BODY_FONT, EMOJI_FONT, esc } = L;

const HAND = "'Andika','Nunito',Arial,sans-serif";
const ink = '#1e293b';

// Andika metrics (fraction of the font size): cap height, x-height, descender.
const CAP = 0.70, XH = 0.505, DESC = 0.24, ADV = 0.56;   // ADV ≈ average advance per character

// The 4 guide lines for one row; `y` is the baseline.
function guides(y, size) {
  const top = y - size * CAP, mid = y - size * XH, low = y + size * DESC;
  return `<line x1="50" y1="${top}" x2="${W - 50}" y2="${top}" stroke="#94a3b8" stroke-width="1.5"/>` +
    `<line x1="50" y1="${mid}" x2="${W - 50}" y2="${mid}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="8 6"/>` +
    `<line x1="50" y1="${y}" x2="${W - 50}" y2="${y}" stroke="#475569" stroke-width="2.2"/>` +
    `<line x1="50" y1="${low}" x2="${W - 50}" y2="${low}" stroke="#e2e8f0" stroke-width="1.5"/>`;
}
// Largest size ≤ `size` at which `text` fits between the margins.
function fitSize(text, size) {
  const width = W - 140;
  return Math.min(size, Math.floor(width / (text.length * (ADV + 0.08))));
}
function glyphRow(text, y, size, mode) {
  const common = `x="64" y="${y}" font-family="${HAND}" font-size="${size}" letter-spacing="${size * 0.08}"`;
  if (mode === 'model') return `<text ${common} fill="${ink}">${esc(text)}</text>`;
  // traceable: light fill shows the whole shape, dashed outline marks the path
  return `<text ${common} fill="#e0e7ff">${esc(text)}</text>` +
    `<text ${common} fill="none" stroke="#818cf8" stroke-width="1.6" stroke-dasharray="5 4">${esc(text)}</text>`;
}
// Repeat a unit (e.g. "Aa ") until the row is full for the given font size.
function fill(unit, size, width = W - 140) {
  const per = Math.max(1, Math.floor(width / (unit.length * size * (ADV + 0.08))));
  return Array(per).fill(unit).join('').trimEnd();
}

// Rows layout: model + 2 trace + `blank` empty rows.
function writingBody(text, { size = 72, blank = 2, label, picture } = {}) {
  size = fitSize(text, size);
  const rows = 1 + 2 + blank;
  const top = BODY_TOP + (picture || label ? 90 : 40), h = (BODY_BOTTOM - top) / rows;
  let s = '';
  if (picture) s += `<text x="${W / 2}" y="${BODY_TOP + 72}" text-anchor="middle" font-family="${EMOJI_FONT}" font-size="64">${picture}</text>`;
  else if (label) s += `<text x="${W / 2}" y="${BODY_TOP + 58}" text-anchor="middle" font-family="${BODY_FONT}" font-size="22" font-weight="800" fill="#64748b">${esc(label)}</text>`;
  for (let i = 0; i < rows; i++) {
    const y = top + i * h + h * 0.62;
    s += guides(y, size);
    if (i === 0) s += glyphRow(text, y, size, 'model');
    else if (i <= 2) s += glyphRow(text, y, size, 'trace');
  }
  return s;
}

// Pre-writing strokes: dashed paths from a green start dot.
const STROKES = {
  rectas:     { es: 'Líneas rectas', en: 'Straight Lines', d: (x, y, w, h) => `M${x},${y}H${x + w}` },
  verticales: { es: 'Líneas verticales', en: 'Vertical Lines', d: (x, y, w, h) => Array.from({ length: 9 }, (_, i) => `M${x + i * w / 8},${y - h / 2}V${y + h / 2}`).join('') },
  diagonales: { es: 'Líneas diagonales', en: 'Diagonal Lines', d: (x, y, w, h) => Array.from({ length: 8 }, (_, i) => `M${x + i * w / 8},${y + h / 2}L${x + (i + 0.8) * w / 8},${y - h / 2}`).join('') },
  zigzag:     { es: 'Zigzag', en: 'Zigzag', d: (x, y, w, h) => `M${x},${y + h / 2}` + Array.from({ length: 10 }, (_, i) => `L${x + (i + 1) * w / 10},${i % 2 ? y + h / 2 : y - h / 2}`).join('') },
  olas:       { es: 'Olas', en: 'Waves', d: (x, y, w, h) => `M${x},${y}` + Array.from({ length: 6 }, (_, i) => `q${w / 24},${i % 2 ? h : -h} ${w / 12},0 t${w / 12},0`).join('') },
  puentes:    { es: 'Puentes', en: 'Bridges', d: (x, y, w, h) => `M${x},${y + h / 2}` + Array.from({ length: 7 }, () => `a${w / 14},${h} 0 0 1 ${w / 7},0`).join('') },
  bucles:     { es: 'Bucles', en: 'Loops', d: (x, y, w, h) => `M${x},${y + h / 3}` + Array.from({ length: 8 }, () => `c${w / 16},${-h} ${w / 10},${-h} ${w / 16},0 s${w / 40},${h / 3} ${w / 16},0`).join('') },
  circulos:   { es: 'Círculos', en: 'Circles', d: (x, y, w, h) => Array.from({ length: 6 }, (_, i) => { const cx = x + h / 2 + i * w / 6; return `M${cx + h / 2},${y}a${h / 2},${h / 2} 0 1 0 -${h},0a${h / 2},${h / 2} 0 1 0 ${h},0`; }).join('') },
  espirales:  { es: 'Espirales', en: 'Spirals', d: (x, y, w, h) => Array.from({ length: 4 }, (_, i) => { const cx = x + h * 0.6 + i * w / 4; let p = `M${cx},${y}`; for (let t = 0; t <= 4 * Math.PI; t += 0.25) { const r = t / (4 * Math.PI) * h * 0.55; p += `L${(cx + r * Math.cos(t)).toFixed(1)},${(y + r * Math.sin(t)).toFixed(1)}`; } return p; }).join('') },
};
function strokesBody(kind) {
  const rows = 6, top = BODY_TOP + 40, h = (BODY_BOTTOM - top) / rows;
  let s = '';
  for (let i = 0; i < rows; i++) {
    const y = top + i * h + h / 2, x = 90, w = W - 170, hh = h * 0.5;
    const solid = i === 0;
    s += `<circle cx="66" cy="${y}" r="9" fill="#16a34a"/>`;
    s += `<path d="${STROKES[kind].d(x, y, w, hh)}" fill="none" stroke="${solid ? ink : '#818cf8'}" stroke-width="${solid ? 4 : 3}" stroke-linecap="round" stroke-linejoin="round"${solid ? '' : ' stroke-dasharray="7 7"'}/>`;
  }
  return s;
}

// ── content ──
const ABC = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const WORD_PICS = [['sol', '☀️'], ['pan', '🍞'], ['mar', '🌊'], ['oso', '🐻'], ['pez', '🐟'], ['uva', '🍇'], ['luna', '🌙'], ['casa', '🏠'], ['gato', '🐱'], ['mesa', '🪑']];
const SYLLABLES = [['m', 'ma me mi mo mu'], ['p', 'pa pe pi po pu'], ['s', 'sa se si so su'], ['l', 'la le li lo lu'], ['t', 'ta te ti to tu'], ['n', 'na ne ni no nu']];
const THEME_WORDS = [
  ['animales', 'Animales', 'Animals', ['perro', 'gato', 'vaca', 'pato']],
  ['frutas', 'Frutas', 'Fruits', ['manzana', 'pera', 'mango', 'fresa']],
  ['colores', 'Colores', 'Colors', ['rojo', 'azul', 'verde', 'rosa']],
  ['familia', 'La familia', 'Family', ['mamá', 'papá', 'abuela', 'tío']],
  ['dias', 'Días de la semana', 'Days of the Week', ['lunes', 'martes', 'jueves', 'sábado']],
  ['meses', 'Meses del año', 'Months', ['enero', 'marzo', 'julio', 'octubre']],
  ['escuela', 'La escuela', 'School', ['lápiz', 'libro', 'regla', 'goma']],
  ['casa', 'La casa', 'The House', ['cama', 'silla', 'puerta', 'mesa']],
  ['cuerpo', 'El cuerpo', 'The Body', ['mano', 'pie', 'nariz', 'boca']],
  ['ropa', 'La ropa', 'Clothes', ['camisa', 'gorra', 'zapato', 'falda']],
  ['transportes', 'Transportes', 'Transportation', ['carro', 'tren', 'barco', 'avión']],
  ['naturaleza', 'Naturaleza', 'Nature', ['árbol', 'flor', 'río', 'nube']],
  ['comida', 'La comida', 'Food', ['sopa', 'arroz', 'queso', 'leche']],
  ['emociones', 'Emociones', 'Feelings', ['feliz', 'triste', 'calma', 'miedo']],
  ['oficios', 'Oficios', 'Jobs', ['doctor', 'chef', 'piloto', 'bombero']],
  ['clima', 'El clima', 'Weather', ['lluvia', 'viento', 'nieve', 'calor']],
  ['numeros', 'Números en letra', 'Number Words', ['uno', 'dos', 'tres', 'cuatro']],
  ['mar', 'El mar', 'The Sea', ['ola', 'arena', 'pulpo', 'concha']],
];
const SENTENCES = [
  'Mi mamá me ama.', 'El sol brilla.', 'Me gusta leer.', 'El gato duerme.', 'Hoy es un buen día.',
  'Yo como fruta.', 'La luna es blanca.', 'Mi perro corre.', 'Me lavo las manos.', 'El cielo es azul.',
  'Juego con mis amigos.', 'Las flores huelen rico.', 'Ayudo en casa.', 'Me gusta pintar.', 'Gracias por todo.',
];

const ITEMS = [];
// fácil 34
for (const k of Object.keys(STROKES)) ITEMS.push({ slug: `trazos-${k}`, es: `Trazos: ${STROKES[k].es}`, en: `Pre-writing: ${STROKES[k].en}`, diff: 'facil', ins: 'Sigue la línea punteada desde el punto verde', body: () => strokesBody(k) });
for (let n = 0; n <= 9; n++) ITEMS.push({ slug: `numero-${n}`, es: `El número ${n}`, en: `Number ${n}`, diff: 'facil', ins: `Traza el número ${n} y luego escríbelo solo`, body: () => writingBody(fill(`${n} `, 96), { size: 96, blank: 2 }) });
for (const v of 'AEIOU') ITEMS.push({ slug: `vocal-${v.toLowerCase()}`, es: `La vocal ${v}`, en: `Vowel ${v}`, diff: 'facil', ins: `Traza la ${v} mayúscula y la ${v.toLowerCase()} minúscula`, body: () => writingBody(fill(`${v}${v.toLowerCase()} `, 90), { size: 90, blank: 2 }) });
for (const [w, pic] of WORD_PICS) ITEMS.push({ slug: `palabra-${w}`, es: `Escribe: ${w}`, en: `Write: ${w}`, diff: 'facil', ins: `Traza la palabra «${w}»`, body: () => writingBody(fill(`${w}  `, 84), { size: 84, blank: 2, picture: pic }) });
// medio 33
for (const ch of ABC) {
  const lo = ch.toLowerCase(), slug = ch === 'Ñ' ? 'letra-enie' : `letra-${lo}`;
  ITEMS.push({ slug, es: `La letra ${ch}`, en: `Letter ${ch}`, diff: 'medio', ins: `Traza la ${ch} mayúscula y la ${lo} minúscula`, body: () => writingBody(fill(`${ch}${lo} `, 80), { size: 80, blank: 2 }) });
}
for (const [c, row] of SYLLABLES) ITEMS.push({ slug: `silabas-${c}`, es: `Sílabas con ${c.toUpperCase()}`, en: `Syllables with ${c.toUpperCase()}`, diff: 'medio', ins: 'Lee y traza las sílabas', body: () => writingBody(row, { size: 76, blank: 2 }) });
// difícil 33
for (const [id, es, en, words] of THEME_WORDS) ITEMS.push({ slug: `palabras-${id}`, es: `Palabras: ${es}`, en: `Words: ${en}`, diff: 'dificil', ins: 'Traza las palabras y escríbelas abajo', body: () => writingBody(words.join('   '), { size: 58, blank: 3, label: es }) });
SENTENCES.forEach((s, i) => ITEMS.push({ slug: `frase-${i + 1}`, es: `Frase: ${s.replace(/\.$/, '')}`, en: `Sentence ${i + 1}`, diff: 'dificil', ins: 'Traza la frase y escríbela abajo', body: () => writingBody(s, { size: 60, blank: 3 }) }));

const AGE = { facil: '3-5', medio: '6-8', dificil: '9-12' };

function build() {
  if (ITEMS.length !== 100) throw new Error(`expected 100 sheets, got ${ITEMS.length}`);
  return ITEMS.map(t => ({
    slug: t.slug, title_es: t.es, title_en: t.en, diff: t.diff, age: AGE[t.diff],
    fonts: 'Andika:wght@400;700',
    desc_es: `${t.es}: ficha de escritura para imprimir gratis, con renglones guía, para niños de ${AGE[t.diff]} años.`,
    desc_en: `${t.en}: free printable handwriting worksheet with guide lines, for kids aged ${AGE[t.diff]}.`,
    tip_es: 'Toma el lápiz con calma y sigue la línea punteada sin levantarlo. Después intenta escribirlo tú solo en los renglones vacíos.',
    tip_en: 'Hold the pencil gently and follow the dotted line without lifting it. Then try writing it on your own on the empty lines.',
    sheet: L.sheet({ cat: 'escritura', title: t.es, instruction: t.ins, diff: t.diff, body: t.body() }),
  }));
}

if (require.main === module) {
  const items = build();
  const d = {}; items.forEach(i => { d[i.diff] = (d[i.diff] || 0) + 1; });
  console.log('niveles:', d);
  L.writeCategory('escritura', items);
}
module.exports = { build };
