'use strict';
// printables/gen-mente.js — printable versions of the brain games (juegos.html), each
// sheet with an answer key. No AI: everything is generated here, deterministically
// (fixed seed per sheet), so re-running changes nothing.
//   • sudoku      90 sheets: 4×4 (2 per sheet) · 6×6 (2 per sheet) · 9×9; unique solution
//   • secuencias  60 sheets: 6 "¿Qué sigue?" rows (shapes → numbers)
//   • intruso     60 sheets: 6 rows, cross out the one that doesn't belong
// Run: node printables/gen-mente.js [--write]   then build-hubs.js and build-og.js

const L = require('./lib');
const { W, BODY_TOP, BODY_FONT, FONT, EMOJI_FONT, esc } = L;

// ── seeded random ──
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const tools = r => {
  const rnd = n => Math.floor(r() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return { rnd, shuffle, pickN: (a, n) => shuffle(a).slice(0, n) };
};
const LEVELS = ['facil', 'medio', 'dificil'];
const AGE = { facil: '4-6', medio: '6-8', dificil: '8-12' };
const pad = n => String(n).padStart(2, '0');

// ═══ SUDOKU ═══
const SUDOKU = { facil: { n: 4, br: 2, bc: 2, per: 2, holes: 9 }, medio: { n: 6, br: 2, bc: 3, per: 2, holes: 20 }, dificil: { n: 9, br: 3, bc: 3, per: 1, holes: 46 } };
function fullGrid({ n, br, bc }, T) {
  const base = (r, c) => (bc * (r % br) + Math.floor(r / br) + c) % n;
  const rows = T.shuffle([...Array(n / br).keys()]).flatMap(b => T.shuffle([...Array(br).keys()]).map(r => b * br + r));
  const cols = T.shuffle([...Array(n / bc).keys()]).flatMap(s => T.shuffle([...Array(bc).keys()]).map(c => s * bc + c));
  const sym = T.shuffle([...Array(n).keys()]);
  return rows.flatMap(r => cols.map(c => sym[base(r, c)]));
}
// Number of solutions, stopping at 2 (we only need "exactly one").
function countSolutions(g, cfg) {
  const { n, br, bc } = cfg;
  const i = g.indexOf(-1);
  if (i < 0) return 1;
  const r = Math.floor(i / n), c = i % n, r0 = r - r % br, c0 = c - c % bc;
  let count = 0;
  for (let v = 0; v < n && count < 2; v++) {
    let ok = true;
    for (let k = 0; k < n && ok; k++) {
      if (g[r * n + k] === v || g[k * n + c] === v) ok = false;
      if (g[(r0 + Math.floor(k / bc)) * n + c0 + k % bc] === v) ok = false;
    }
    if (!ok) continue;
    g[i] = v; count += countSolutions(g, cfg); g[i] = -1;
  }
  return count;
}
function makeSudoku(cfg, T) {
  const sol = fullGrid(cfg, T), puzzle = sol.slice();
  let holes = 0;
  for (const i of T.shuffle([...Array(cfg.n * cfg.n).keys()])) {
    if (holes >= cfg.holes) break;
    const keep = puzzle[i]; puzzle[i] = -1;
    if (countSolutions(puzzle.slice(), cfg) === 1) holes++; else puzzle[i] = keep;
  }
  return { sol, puzzle };
}
function sudokuSvg(cfg, s, x, y, size, answer) {
  const { n, br, bc } = cfg, cell = size / n;
  let out = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff" stroke="#4c1d95" stroke-width="4" rx="6"/>`;
  for (let k = 1; k < n; k++) {
    const thickV = k % bc === 0, thickH = k % br === 0;
    out += `<line x1="${x + k * cell}" y1="${y}" x2="${x + k * cell}" y2="${y + size}" stroke="${thickV ? '#4c1d95' : '#a5b4fc'}" stroke-width="${thickV ? 3.5 : 1.5}"/>`;
    out += `<line x1="${x}" y1="${y + k * cell}" x2="${x + size}" y2="${y + k * cell}" stroke="${thickH ? '#4c1d95' : '#a5b4fc'}" stroke-width="${thickH ? 3.5 : 1.5}"/>`;
  }
  for (let i = 0; i < n * n; i++) {
    const given = s.puzzle[i] >= 0, v = given ? s.puzzle[i] : (answer ? s.sol[i] : -1);
    if (v < 0) continue;
    const cx = x + (i % n + 0.5) * cell, cy = y + (Math.floor(i / n) + 0.5) * cell;
    out += `<text x="${cx.toFixed(1)}" y="${(cy + cell * 0.2).toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-size="${(cell * 0.55).toFixed(1)}" fill="${given ? '#1e1b4b' : '#db2777'}">${v + 1}</text>`;
  }
  return out;
}
function sudokus() {
  const items = [];
  for (const lv of LEVELS) for (let k = 1; k <= 30; k++) {
    const cfg = SUDOKU[lv], T = tools(rng(1000 + LEVELS.indexOf(lv) * 100 + k));
    const ps = Array.from({ length: cfg.per }, () => makeSudoku(cfg, T));
    const draw = answer => {
      if (cfg.per === 1) return sudokuSvg(cfg, ps[0], (W - 620) / 2, BODY_TOP + 70, 620, answer);
      const size = cfg.n === 4 ? 340 : 360, gap = (1000 - BODY_TOP - 2 * size) / 3;
      return ps.map((p, j) => sudokuSvg(cfg, p, (W - size) / 2, BODY_TOP + gap * (j + 1) + size * j, size, answer)).join('');
    };
    const nm = { facil: '4×4', medio: '6×6', dificil: '9×9' }[lv];
    const title = `Sudoku ${nm} #${k}`;
    items.push({
      slug: `sudoku-${lv}-${pad(k)}`, title_es: title, title_en: title, diff: lv, age: AGE[lv],
      desc_es: `${title} para imprimir gratis, nivel ${L.DIFF[lv].es.toLowerCase()}, con solución. Ideal para niños de ${AGE[lv]} años.`,
      desc_en: `Free printable ${title}, ${L.DIFF[lv].en.toLowerCase()} level, with answer key. For kids aged ${AGE[lv]}.`,
      tip_es: 'Empieza por la fila o columna que tenga más números. ¡Pregúntate qué número falta!',
      tip_en: 'Start with the row or column that has the most numbers. Ask yourself which number is missing!',
      sheet: L.sheet({ cat: 'sudoku', title, diff: lv, instruction: `Escribe los números del 1 al ${cfg.n}: sin repetir en fila, columna ni cuadro`, body: draw(false) }),
      answer: L.sheet({ cat: 'sudoku', title, diff: lv, instruction: 'Solución', body: draw(true), answer: true }),
    });
  }
  return items;
}

// ═══ ¿QUÉ SIGUE? ═══
const SHAPES = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '❤️', '🔺', '🟦', '🌙', '🍎'];
function seqQuestion(lv, T) {
  const pattern = kinds => {
    const kind = kinds[T.rnd(kinds.length)], e = T.pickN(SHAPES, 4);
    const unit = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1], ABCD: [0, 1, 2, 3], ABAC: [0, 1, 0, 2] }[kind].map(i => e[i]);
    const seq = Array.from({ length: 7 }, (_, i) => unit[i % unit.length]);
    return { seq: seq.slice(0, 6), ans: seq[6], emoji: true };
  };
  const nums = (s, a) => ({ seq: s.map(String), ans: String(a), emoji: false });
  if (lv === 'facil') return pattern(['AB', 'AAB', 'ABB', 'ABC']);
  if (lv === 'medio') {
    if (T.rnd(2)) return pattern(['AABB', 'ABCD', 'ABAC']);
    const a = 1 + T.rnd(5), d = 1 + T.rnd(3), s = Array.from({ length: 6 }, (_, i) => a + d * i);
    return nums(s.slice(0, 5), s[5]);
  }
  const type = T.rnd(4);
  if (type === 0) { const a = 1 + T.rnd(10), d = 3 + T.rnd(4), s = Array.from({ length: 6 }, (_, i) => a + d * i); return nums(s.slice(0, 5), s[5]); }
  if (type === 1) { const a = 1 + T.rnd(3), s = Array.from({ length: 6 }, (_, i) => a * 2 ** i); return nums(s.slice(0, 5), s[5]); }
  if (type === 2) { const s = [1 + T.rnd(5)]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + i); return nums(s.slice(0, 5), s[5]); }
  const k = 1 + T.rnd(4), s = [];
  for (let i = 1; i <= 3; i++) { s.push(i * k); s.push(i * k * 10); }
  return nums(s.slice(0, 5), s[5]);
}
function seqSvg(qs, answer) {
  const rowH = 118, top = BODY_TOP + 30;
  return qs.map((q, r) => {
    const y = top + r * rowH, n = q.seq.length + 1, box = 82, gap = 14, x0 = (W - n * box - (n - 1) * gap) / 2;
    let out = `<text x="40" y="${y + 52}" font-family="${FONT}" font-size="26" fill="#7c3aed">${r + 1}.</text>`;
    [...q.seq, answer ? q.ans : ''].forEach((v, i) => {
      const x = x0 + i * (box + gap), last = i === n - 1;
      out += `<rect x="${x}" y="${y}" width="${box}" height="${box}" rx="14" fill="${last ? '#fff7ed' : '#f5f3ff'}" stroke="${last ? '#f59e0b' : '#c4b5fd'}" stroke-width="${last ? 3 : 2}"${last && !answer ? ' stroke-dasharray="8 6"' : ''}/>`;
      if (v) out += `<text x="${x + box / 2}" y="${y + box / 2 + (q.emoji ? 16 : 13)}" text-anchor="middle" font-family="${q.emoji ? EMOJI_FONT : FONT}" font-size="${q.emoji ? 44 : (v.length > 2 ? 28 : 36)}" fill="${last ? '#db2777' : '#1e1b4b'}">${esc(v)}</text>`;
      else if (last) out += `<text x="${x + box / 2}" y="${y + box / 2 + 14}" text-anchor="middle" font-family="${FONT}" font-size="40" fill="#f59e0b">?</text>`;
    });
    return out;
  }).join('');
}
function secuencias() {
  const items = [];
  for (const lv of LEVELS) for (let k = 1; k <= 20; k++) {
    const T = tools(rng(5000 + LEVELS.indexOf(lv) * 100 + k));
    const qs = Array.from({ length: 6 }, () => seqQuestion(lv, T));
    const title_es = `¿Qué sigue? #${k}`, title_en = `What comes next? #${k}`;
    items.push({
      slug: `que-sigue-${lv}-${pad(k)}`, title_es, title_en, diff: lv, age: AGE[lv],
      desc_es: `Ficha de patrones y secuencias "¿Qué sigue?" para imprimir gratis, nivel ${L.DIFF[lv].es.toLowerCase()}, con solución. Para niños de ${AGE[lv]} años.`,
      desc_en: `Free printable "What comes next?" patterns and sequences sheet, ${L.DIFF[lv].en.toLowerCase()} level, with answer key. For kids aged ${AGE[lv]}.`,
      tip_es: 'Di la secuencia en voz alta: "rojo, azul, rojo, azul…". ¡Así el patrón se escucha!',
      tip_en: 'Say the sequence out loud: "red, blue, red, blue…". You can hear the pattern!',
      sheet: L.sheet({ cat: 'secuencias', title: title_es, diff: lv, instruction: lv === 'facil' ? 'Descubre el patrón y dibuja lo que sigue' : 'Descubre el patrón y escribe o dibuja lo que sigue', body: seqSvg(qs, false) }),
      answer: L.sheet({ cat: 'secuencias', title: title_es, diff: lv, instruction: 'Solución', body: seqSvg(qs, true), answer: true }),
    });
  }
  return items;
}

// ═══ ENCUENTRA EL INTRUSO ═══
const GROUPS = {
  frutas: ['una fruta', ['🍎', '🍌', '🍇', '🍓', '🍉', '🍍', '🍒', '🍑', '🍋']],
  verduras: ['una verdura', ['🥕', '🥦', '🌽', '🥒', '🍆', '🥔', '🧅']],
  animales: ['un animal', ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁']],
  vehiculos: ['un vehículo', ['🚗', '🚌', '🚒', '🚀', '✈️', '🚲', '🚂', '🚁', '⛵']],
  ropa: ['ropa', ['👕', '👖', '👗', '🧦', '🧢', '👟', '🧤', '🧣']],
  pelotas: ['una pelota', ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐']],
  musica: ['un instrumento', ['🎸', '🎹', '🥁', '🎺', '🎻', '🎷']],
  vuelan: ['un animal que vuela', ['🦅', '🐦', '🦋', '🐝', '🦉', '🦆']],
  mar: ['un animal del mar', ['🐟', '🐬', '🐳', '🐙', '🦀', '🦈']],
  granja: ['un animal de granja', ['🐮', '🐷', '🐔', '🐑', '🐴', '🐐']],
};
const EASY = ['frutas', 'animales', 'vehiculos', 'ropa', 'musica', 'pelotas'];
const HARD = [['frutas', 'verduras'], ['verduras', 'frutas'], ['mar', 'granja'], ['granja', 'mar'], ['vuelan', 'mar'], ['vuelan', 'granja']];
function intrusoRow(lv, T) {
  if (lv === 'dificil' && T.rnd(10) < 3) {
    const even = T.rnd(2) === 0, all = [...Array(30).keys()].map(x => x + 1);
    const base = T.pickN(all.filter(x => (x % 2 === 0) === even), 4), out = T.pickN(all.filter(x => (x % 2 === 0) !== even), 1)[0];
    const items = T.shuffle([...base, out].map(String));
    return { items, odd: items.indexOf(String(out)), why: `${out} no es ${even ? 'par' : 'impar'}`, emoji: false };
  }
  const [g, o] = lv === 'dificil' ? HARD[T.rnd(HARD.length)] : (() => { const g = EASY[T.rnd(EASY.length)]; return [g, T.pickN(EASY.filter(x => x !== g), 1)[0]]; })();
  const cand = GROUPS[o][1].filter(x => !GROUPS[g][1].includes(x)), odd = cand[T.rnd(cand.length)];
  const items = T.shuffle([...T.pickN(GROUPS[g][1], lv === 'facil' ? 3 : 4), odd]);
  return { items, odd: items.indexOf(odd), why: `${odd} no es ${GROUPS[g][0]}`, emoji: true };
}
function intrusoSvg(rows, answer) {
  const rowH = 122, top = BODY_TOP + 26;
  return rows.map((q, r) => {
    const y = top + r * rowH, n = q.items.length, box = 96, gap = 22, x0 = (W - n * box - (n - 1) * gap) / 2;
    let out = `<text x="40" y="${y + 58}" font-family="${FONT}" font-size="26" fill="#16a34a">${r + 1}.</text>`;
    q.items.forEach((v, i) => {
      const x = x0 + i * (box + gap), hit = answer && i === q.odd;
      out += `<rect x="${x}" y="${y}" width="${box}" height="${box}" rx="18" fill="#f0fdf4" stroke="${hit ? '#dc2626' : '#bbf7d0'}" stroke-width="${hit ? 5 : 2}"/>`;
      out += `<text x="${x + box / 2}" y="${y + box / 2 + (q.emoji ? 19 : 14)}" text-anchor="middle" font-family="${q.emoji ? EMOJI_FONT : FONT}" font-size="${q.emoji ? 54 : 40}" fill="#1e1b4b">${esc(v)}</text>`;
      if (hit) out += `<line x1="${x + 10}" y1="${y + 10}" x2="${x + box - 10}" y2="${y + box - 10}" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/><line x1="${x + box - 10}" y1="${y + 10}" x2="${x + 10}" y2="${y + box - 10}" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>`;
    });
    if (answer) out += `<text x="${W / 2}" y="${y + box + 18}" text-anchor="middle" font-family="${BODY_FONT}" font-size="15" font-weight="800" fill="#b91c1c">${esc(q.why)}</text>`;
    return out;
  }).join('');
}
function intrusos() {
  const items = [];
  for (const lv of LEVELS) for (let k = 1; k <= 20; k++) {
    const T = tools(rng(9000 + LEVELS.indexOf(lv) * 100 + k));
    const rows = Array.from({ length: 6 }, () => intrusoRow(lv, T));
    const title_es = `Encuentra el intruso #${k}`, title_en = `Odd one out #${k}`;
    items.push({
      slug: `intruso-${lv}-${pad(k)}`, title_es, title_en, diff: lv, age: AGE[lv],
      desc_es: `Ficha "Encuentra el intruso" para imprimir gratis: en cada fila, tacha el que no pertenece al grupo. Nivel ${L.DIFF[lv].es.toLowerCase()}, con solución.`,
      desc_en: `Free printable "Odd one out" sheet: in each row, cross out the one that doesn't belong. ${L.DIFF[lv].en} level, with answer key.`,
      tip_es: 'Pregúntale a tu peque por qué eligió ese: explicarlo ayuda a pensar.',
      tip_en: 'Ask your kid why they picked that one: explaining it helps them think.',
      sheet: L.sheet({ cat: 'intruso', title: title_es, diff: lv, instruction: 'En cada fila, tacha el que no pertenece al grupo', body: intrusoSvg(rows, false) }),
      answer: L.sheet({ cat: 'intruso', title: title_es, diff: lv, instruction: 'Solución', body: intrusoSvg(rows, true), answer: true }),
    });
  }
  return items;
}

const build = () => ({ sudoku: sudokus(), secuencias: secuencias(), intruso: intrusos() });
module.exports = { build, _t: { countSolutions, makeSudoku, SUDOKU, tools, rng } };
if (require.main === module) {
  const all = build();
  for (const [cat, items] of Object.entries(all)) {
    console.log(`${cat}: ${items.length} fichas`);
    if (process.argv.includes('--write')) L.writeCategory(cat, items);
  }
}
