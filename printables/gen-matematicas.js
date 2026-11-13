'use strict';
// printables/gen-matematicas.js — 100 math worksheets with answer keys.
// Run: node printables/gen-matematicas.js
// Every answer is computed here and re-checked (verify) before a sheet is written.

const L = require('./lib');
const { W, BODY_TOP, BODY_BOTTOM, BODY_FONT, EMOJI_FONT, esc } = L;

const EMOJI = ['🍎', '⭐', '🐟', '🚗', '🌸', '🐞', '🎈', '🍪', '🐥', '⚽', '🦋', '🍓', '🐢', '🌙', '🚀', '🧁'];
const ink = '#1e293b', red = '#dc2626';

function txt(x, y, s, { size = 26, anchor = 'start', color = ink, weight = 800, font = BODY_FONT } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(s)}</text>`;
}
const randInt = (r, a, b) => a + Math.floor(r() * (b - a + 1));

// ── problem makers: each returns {a, b, op, ans} ──
function arith(r, op, { a: [a1, a2], b: [b1, b2] }) {
  let a = randInt(r, a1, a2), b = randInt(r, b1, b2);
  if (op === '-' && b > a) [a, b] = [b, a];
  if (op === '÷') { const q = randInt(r, a1, a2); b = randInt(r, b1, b2); return { a: q * b, b, op, ans: q }; }
  const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
  return { a, b, op, ans };
}
function uniqueProblems(r, n, make) {
  const seen = new Set(), out = [];
  for (let guard = 0; out.length < n && guard < 5000; guard++) {
    const p = make(r);
    const k = JSON.stringify(p);
    if (!seen.has(k)) { seen.add(k); out.push(p); }
  }
  if (out.length < n) throw new Error('not enough unique problems');
  return out;
}

// ── layouts ──
// Horizontal "a + b = ___" in columns.
function horizontalGrid(probs, answer, { cols = 2, size = 30 } = {}) {
  const rows = Math.ceil(probs.length / cols), top = BODY_TOP + 40, h = (BODY_BOTTOM - top - 20) / rows;
  const colW = (W - 80) / cols;
  return probs.map((p, i) => {
    const x = 40 + (i % cols) * colW + 20, y = top + Math.floor(i / cols) * h + h * 0.6;
    const expr = `${p.a} ${p.op} ${p.b} =`, ex = x + 40 + expr.length * size * 0.56 + 10;
    return txt(x, y, `${i + 1}.`, { size: size * 0.6, color: '#94a3b8' }) +
      txt(x + 40, y, expr, { size }) +
      `<line x1="${ex}" y1="${y + 6}" x2="${x + colW - 50}" y2="${y + 6}" stroke="#94a3b8" stroke-width="2"/>` +
      (answer ? txt(ex + 14, y, String(p.ans), { size, color: red }) : '');
  }).join('');
}
// Vertical (column) arithmetic, right-aligned digits.
function verticalGrid(probs, answer, { cols = 4, size = 36 } = {}) {
  const rows = Math.ceil(probs.length / cols), top = BODY_TOP + 50, h = (BODY_BOTTOM - top - 10) / rows;
  const colW = (W - 80) / cols, mono = "'Courier New',monospace";
  return probs.map((p, i) => {
    const cx = 40 + (i % cols) * colW + colW * 0.7, y = top + Math.floor(i / cols) * h + size;
    const digits = Math.max(String(p.a).length, String(p.b).length, String(p.ans).length) + 1;
    const lw = digits * size * 0.62;
    return txt(40 + (i % cols) * colW + 8, y, `${i + 1}.`, { size: size * 0.5, color: '#94a3b8' }) +
      txt(cx, y, String(p.a), { size, anchor: 'end', font: mono, weight: 700 }) +
      txt(cx - lw, y + size * 1.15, p.op, { size, font: mono, weight: 700 }) +
      txt(cx, y + size * 1.15, String(p.b), { size, anchor: 'end', font: mono, weight: 700 }) +
      `<line x1="${cx - lw}" y1="${y + size * 1.45}" x2="${cx + 4}" y2="${y + size * 1.45}" stroke="${ink}" stroke-width="3"/>` +
      (answer ? txt(cx, y + size * 2.5, String(p.ans), { size, anchor: 'end', color: red, font: mono, weight: 700 }) : '');
  }).join('');
}
// Counting rows: emoji groups + answer box.
function countingRows(r, n, max, answer) {
  const rows = [], top = BODY_TOP + 40, h = (BODY_BOTTOM - top - 10) / n, counts = [];
  for (let i = 0; i < n; i++) {
    let c; do { c = randInt(r, 1, max); } while (counts.includes(c) && counts.length < max);
    counts.push(c);
    const e = EMOJI[(i + Math.floor(r() * EMOJI.length)) % EMOJI.length];
    const perRow = 5, es = 46, two = c > perRow, yMid = top + i * h + h / 2;
    let s = `<rect x="40" y="${top + i * h + 6}" width="${W - 80}" height="${h - 12}" rx="14" fill="none" stroke="#e2e8f0" stroke-width="2"/>`;
    for (let k = 0; k < c; k++) {
      const row = two ? Math.floor(k / perRow) : 0;
      const y = two ? yMid - 6 + (row === 0 ? -es * 0.45 : es * 0.62) : yMid + es * 0.36;
      s += `<text x="${80 + (k % perRow) * es * 1.15}" y="${y}" font-family="${EMOJI_FONT}" font-size="${es * 0.85}">${e}</text>`;
    }
    s += `<rect x="${W - 150}" y="${yMid - 34}" width="86" height="68" rx="12" fill="#fff" stroke="${ink}" stroke-width="3"/>`;
    if (answer) s += txt(W - 107, yMid + 15, String(c), { size: 42, anchor: 'middle', color: red });
    rows.push(s);
  }
  return { body: rows.join(''), answers: counts };
}
// Picture addition: 🍎🍎 + 🍎🍎🍎 = ▢
function pictureAdd(r, n, max, answer) {
  const top = BODY_TOP + 40, h = (BODY_BOTTOM - top - 10) / n, out = [], answers = [];
  for (let i = 0; i < n; i++) {
    const a = randInt(r, 1, Math.min(5, max - 1)), b = randInt(r, 1, Math.min(5, max - a));
    answers.push(a + b);
    const e = EMOJI[(i * 3 + Math.floor(r() * 5)) % EMOJI.length], es = 40, y = top + i * h + h * 0.62;
    let x = 60, s = '';
    for (let k = 0; k < a; k++) { s += `<text x="${x}" y="${y}" font-family="${EMOJI_FONT}" font-size="${es}">${e}</text>`; x += es * 1.02; }
    s += txt(x + 6, y, '+', { size: 44 }); x += 52;
    for (let k = 0; k < b; k++) { s += `<text x="${x}" y="${y}" font-family="${EMOJI_FONT}" font-size="${es}">${e}</text>`; x += es * 1.02; }
    s += txt(x + 6, y, '=', { size: 44 }); x += 52;
    s += `<rect x="${x}" y="${y - 48}" width="76" height="62" rx="12" fill="#fff" stroke="${ink}" stroke-width="3"/>`;
    if (answer) s += txt(x + 38, y, String(a + b), { size: 40, anchor: 'middle', color: red });
    out.push(s);
  }
  return { body: out.join(''), answers };
}
// Compare two numbers: write > < or =.
function compareRows(r, n, max, answer) {
  const top = BODY_TOP + 60, h = (BODY_BOTTOM - top - 10) / n, out = [], answers = [];
  for (let i = 0; i < n; i++) {
    const a = randInt(r, 1, max), b = randInt(r, 1, max);
    const sign = a > b ? '>' : a < b ? '<' : '=';
    answers.push(sign);
    const y = top + i * h + h * 0.62;
    out.push(txt(W / 2 - 120, y, String(a), { size: 56, anchor: 'middle' }) +
      `<circle cx="${W / 2}" cy="${y - 19}" r="36" fill="#fff" stroke="${ink}" stroke-width="3"/>` +
      txt(W / 2 + 120, y, String(b), { size: 56, anchor: 'middle' }) +
      (answer ? txt(W / 2, y - 2, sign, { size: 50, anchor: 'middle', color: red }) : ''));
  }
  return { body: txt(W / 2, BODY_TOP + 36, 'Escribe  >   <   o   =  en cada círculo', { size: 22, anchor: 'middle', color: '#64748b' }) + out.join(''), answers };
}
// Number sequences: 2, 4, 6, __, __
function sequenceRows(r, n, { step: [s1, s2], start: [a1, a2], len = 6, blanks = 2 }, answer) {
  const top = BODY_TOP + 40, h = (BODY_BOTTOM - top - 10) / n, out = [], answers = [];
  for (let i = 0; i < n; i++) {
    const step = randInt(r, s1, s2), start = randInt(r, a1, a2);
    const seq = Array.from({ length: len }, (_, k) => start + k * step);
    const hide = new Set();
    while (hide.size < blanks) hide.add(randInt(r, 2, len - 1));
    answers.push(seq.filter((_, k) => hide.has(k)));
    const y = top + i * h + h * 0.6, cw = (W - 120) / len;
    out.push(seq.map((v, k) => {
      const x = 60 + k * cw + cw / 2;
      if (!hide.has(k)) return txt(x, y, String(v), { size: 36, anchor: 'middle' });
      return `<rect x="${x - cw * 0.4}" y="${y - 40}" width="${cw * 0.8}" height="54" rx="10" fill="#fff" stroke="${ink}" stroke-width="3"/>` +
        (answer ? txt(x, y, String(v), { size: 34, anchor: 'middle', color: red }) : '');
    }).join(''));
  }
  return { body: out.join(''), answers };
}
// Fractions: shaded pie or bar → write the fraction.
function fractionRows(r, n, answer) {
  const top = BODY_TOP + 30, cols = 3, rows = Math.ceil(n / cols), h = (BODY_BOTTOM - top) / rows, cw = (W - 80) / cols;
  const out = [], answers = [];
  for (let i = 0; i < n; i++) {
    const d = [2, 3, 4, 5, 6, 8][randInt(r, 0, 5)], k = randInt(r, 1, d - 1);
    answers.push(`${k}/${d}`);
    const cx = 40 + (i % cols) * cw + cw / 2, cy = top + Math.floor(i / cols) * h + h * 0.33, R = Math.min(66, h * 0.26);
    let s = '';
    if (i % 2 === 0) {           // pie
      for (let j = 0; j < d; j++) {
        const a0 = -Math.PI / 2 + j * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
        const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
        s += `<path d="M${cx},${cy}L${x0.toFixed(1)},${y0.toFixed(1)}A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}Z" fill="${j < k ? '#fde68a' : '#fff'}" stroke="${ink}" stroke-width="3"/>`;
      }
    } else {                      // bar
      const bw = R * 2.6, bh = R * 0.9, x0 = cx - bw / 2;
      for (let j = 0; j < d; j++) s += `<rect x="${(x0 + j * bw / d).toFixed(1)}" y="${cy - bh / 2}" width="${(bw / d).toFixed(1)}" height="${bh}" fill="${j < k ? '#bfdbfe' : '#fff'}" stroke="${ink}" stroke-width="3"/>`;
    }
    const fy = cy + R + 24;
    s += `<rect x="${cx - 26}" y="${fy}" width="52" height="40" rx="8" fill="#fff" stroke="${ink}" stroke-width="2.5"/>`;
    s += `<line x1="${cx - 34}" y1="${fy + 48}" x2="${cx + 34}" y2="${fy + 48}" stroke="${ink}" stroke-width="3"/>`;
    s += `<rect x="${cx - 26}" y="${fy + 56}" width="52" height="40" rx="8" fill="#fff" stroke="${ink}" stroke-width="2.5"/>`;
    if (answer) s += txt(cx, fy + 31, String(k), { size: 30, anchor: 'middle', color: red }) + txt(cx, fy + 87, String(d), { size: 30, anchor: 'middle', color: red });
    out.push(s);
  }
  return { body: out.join(''), answers };
}

// ── the 100 sheets ──
const TYPES = [];
const add = (n, def) => { for (let i = 1; i <= n; i++) TYPES.push({ ...def, sheetNo: i, of: n }); };
const arithType = (op, opts, layout = 'h', count = 20) => (r, answer) => {
  const probs = uniqueProblems(r, count, rr => arith(rr, op, opts));
  return { body: layout === 'h' ? horizontalGrid(probs, answer) : verticalGrid(probs, answer), answers: probs.map(p => p.ans), probs };
};
// fácil (34)
add(8, { id: 'contar-hasta-5', es: 'Cuenta hasta 5', en: 'Count to 5', diff: 'facil', ins: 'Cuenta los dibujos y escribe el número', fn: (r, a) => countingRows(r, 5, 5, a) });
add(8, { id: 'contar-hasta-10', es: 'Cuenta hasta 10', en: 'Count to 10', diff: 'facil', ins: 'Cuenta los dibujos y escribe el número', fn: (r, a) => countingRows(r, 5, 10, a) });
add(6, { id: 'mayor-menor', es: 'Mayor, menor o igual', en: 'Greater, Less or Equal', diff: 'facil', ins: '¿Qué número es mayor?', fn: (r, a) => compareRows(r, 6, 10, a) });
add(6, { id: 'sumas-dibujos', es: 'Sumas con dibujos', en: 'Picture Addition', diff: 'facil', ins: 'Cuenta todos los dibujos y escribe el total', fn: (r, a) => pictureAdd(r, 6, 10, a) });
add(6, { id: 'sumas-hasta-10', es: 'Sumas hasta 10', en: 'Addition to 10', diff: 'facil', ins: 'Resuelve las sumas', fn: (r, a) => {
  const probs = uniqueProblems(r, 12, rr => { const x = randInt(rr, 0, 9); const y = randInt(rr, 0, 10 - x); return { a: x, b: y, op: '+', ans: x + y }; });
  return { body: horizontalGrid(probs, a, { size: 36 }), answers: probs.map(p => p.ans), probs }; } });
// medio (33)
add(5, { id: 'sumas-hasta-20', es: 'Sumas hasta 20', en: 'Addition to 20', diff: 'medio', ins: 'Resuelve las sumas', fn: arithType('+', { a: [2, 12], b: [2, 9] }) });
add(5, { id: 'restas-hasta-20', es: 'Restas hasta 20', en: 'Subtraction to 20', diff: 'medio', ins: 'Resuelve las restas', fn: arithType('-', { a: [5, 20], b: [1, 10] }) });
add(5, { id: 'sumas-2-cifras', es: 'Sumas de dos cifras', en: 'Two-Digit Addition', diff: 'medio', ins: 'Suma en columna', fn: arithType('+', { a: [10, 89], b: [10, 89] }, 'v', 16) });
add(5, { id: 'restas-2-cifras', es: 'Restas de dos cifras', en: 'Two-Digit Subtraction', diff: 'medio', ins: 'Resta en columna', fn: arithType('-', { a: [20, 99], b: [10, 89] }, 'v', 16) });
add(8, { id: 'tablas', es: 'Tablas de multiplicar', en: 'Times Tables', diff: 'medio', ins: 'Multiplica', fn: null });
add(5, { id: 'series', es: 'Completa la serie', en: 'Complete the Sequence', diff: 'medio', ins: 'Escribe los números que faltan', fn: (r, a) => sequenceRows(r, 8, { step: [2, 10], start: [0, 30] }, a) });
// difícil (33)
add(7, { id: 'multiplicar-2x1', es: 'Multiplicación', en: 'Multiplication', diff: 'dificil', ins: 'Multiplica en columna', fn: arithType('×', { a: [12, 99], b: [2, 9] }, 'v', 16) });
add(4, { id: 'multiplicar-2x2', es: 'Multiplicación de 2 cifras', en: 'Two-Digit Multiplication', diff: 'dificil', ins: 'Multiplica en columna', fn: arithType('×', { a: [11, 99], b: [11, 49] }, 'v', 12) });
add(7, { id: 'division', es: 'División exacta', en: 'Division', diff: 'dificil', ins: 'Divide', fn: arithType('÷', { a: [2, 12], b: [2, 10] }) });
add(6, { id: 'fracciones', es: 'Fracciones', en: 'Fractions', diff: 'dificil', ins: '¿Qué fracción está coloreada?', fn: (r, a) => fractionRows(r, 9, a) });
add(5, { id: 'sumas-3-cifras', es: 'Sumas de tres cifras', en: 'Three-Digit Addition', diff: 'dificil', ins: 'Suma en columna', fn: arithType('+', { a: [100, 899], b: [100, 899] }, 'v', 12) });
add(4, { id: 'series-dificiles', es: 'Series de números', en: 'Number Patterns', diff: 'dificil', ins: 'Escribe los números que faltan', fn: (r, a) => sequenceRows(r, 8, { step: [3, 25], start: [10, 200], len: 6, blanks: 3 }, a) });

// Times tables: one sheet per table 2…9, each fact in both orders, shuffled.
TYPES.filter(t => t.id === 'tablas').forEach((t, i) => {
  const table = i + 2;
  t.es = `Tabla del ${table}`; t.en = `${table} Times Table`; t.slug = `tabla-del-${table}`;
  t.fn = (r, a) => {
    const probs = L.shuffle(Array.from({ length: 10 }, (_, k) => ({ a: table, b: k + 1, op: '×', ans: table * (k + 1) })), r)
      // reversed order for the second half; 0 × n replaces n × n so no fact repeats
      .concat(L.shuffle(Array.from({ length: 10 }, (_, k) => k + 1 === table ? { a: 0, b: table, op: '×', ans: 0 } : { a: k + 1, b: table, op: '×', ans: table * (k + 1) }), r));
    return { body: horizontalGrid(probs, a), answers: probs.map(p => p.ans), probs };
  };
});

const AGE = { facil: '3-5', medio: '6-8', dificil: '9-12' };

function verify(slug, out) {
  for (const p of out.probs || []) {
    const exp = p.op === '+' ? p.a + p.b : p.op === '-' ? p.a - p.b : p.op === '×' ? p.a * p.b : p.a / p.b;
    if (exp !== p.ans || !Number.isInteger(p.ans) || p.ans < 0) throw new Error(`${slug}: wrong answer ${JSON.stringify(p)}`);
  }
}

function build() {
  if (TYPES.length !== 100) throw new Error(`expected 100 sheets, got ${TYPES.length}`);
  return TYPES.map(t => {
    const slug = t.slug || `${t.id}-${t.sheetNo}`;
    const title_es = t.slug ? t.es : `${t.es} · Hoja ${t.sheetNo}`;
    const title_en = t.slug ? t.en : `${t.en} · Sheet ${t.sheetNo}`;
    const seed = L.seedOf('mate:' + slug);
    const q = t.fn(L.rng(seed), false), a = t.fn(L.rng(seed), true);   // same seed → same problems
    if (JSON.stringify(q.answers) !== JSON.stringify(a.answers)) throw new Error(`${slug}: answer key differs from sheet`);
    verify(slug, a);
    const common = { cat: 'matematicas', title: title_es, diff: t.diff };
    return {
      slug, title_es, title_en, diff: t.diff, age: AGE[t.diff],
      desc_es: `${title_es}: ficha de matemáticas para imprimir gratis, para niños de ${AGE[t.diff]} años. Incluye hoja de respuestas.`,
      desc_en: `${title_en}: free printable math worksheet for kids aged ${AGE[t.diff]}. Answer key included.`,
      tip_es: 'Haz una hoja al día y revísala con la hoja de respuestas. ¡Celebra cada acierto!',
      tip_en: 'Do one sheet a day and check it with the answer key. Celebrate every right answer!',
      sheet: L.sheet({ ...common, instruction: t.ins, body: q.body }),
      answer: L.sheet({ ...common, instruction: 'Respuestas', body: a.body, answer: true }),
    };
  });
}

if (require.main === module) {
  const items = build();
  const d = {}; items.forEach(i => { d[i.diff] = (d[i.diff] || 0) + 1; });
  console.log('niveles:', d);
  L.writeCategory('matematicas', items);
}
module.exports = { build };
