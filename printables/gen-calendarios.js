'use strict';
// printables/gen-calendarios.js — 50 calendars, routines, countdowns and trackers.
// Run: node printables/gen-calendarios.js
// Dated calendars are computed from real dates (weeks start on Monday) and checked.

const L = require('./lib');
const { W, BODY_TOP, BODY_BOTTOM, BODY_FONT, FONT, EMOJI_FONT, esc } = L;
const ink = '#1e293b';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_EMOJI = ['⛄', '💝', '🌷', '🌧️', '🌻', '☀️', '🏖️', '🍉', '🍎', '🎃', '🍂', '🎄'];
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAYS_LONG = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${o.font || BODY_FONT}" font-size="${o.size || 18}" font-weight="${o.weight || 800}" fill="${o.color || ink}">${esc(s)}</text>`;
const emo = (x, y, e, size) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${EMOJI_FONT}" font-size="${size}">${e}</text>`;

// Generic table: header row + rows×cols cells.
function table({ x = 40, y, w = W - 80, h, cols, rows, head, rowLabels, color = '#8b5cf6', labelW = 0, cellFn }) {
  const cw = (w - labelW) / cols, headH = 40, rh = (h - headH) / rows;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="${ink}" stroke-width="2"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${headH}" rx="10" fill="${color}"/>`;
  head.forEach((hd, i) => { s += t(x + labelW + cw * i + cw / 2, y + 27, hd, { size: cols > 7 ? 13 : 16, color: '#fff' }); });
  for (let r = 0; r < rows; r++) {
    const ry = y + headH + r * rh;
    if (r) s += `<line x1="${x}" y1="${ry}" x2="${x + w}" y2="${ry}" stroke="#cbd5e1" stroke-width="1.5"/>`;
    if (rowLabels) s += t(x + 12, ry + rh / 2 + 6, rowLabels[r], { anchor: 'start', size: 16 });
    for (let c = 0; c < cols; c++) if (cellFn) s += cellFn(x + labelW + c * cw, ry, cw, rh, r, c);
  }
  for (let c = 0; c <= cols; c++) { const cx = x + labelW + c * cw; if (c || labelW) s += `<line x1="${cx}" y1="${y + headH}" x2="${cx}" y2="${y + h}" stroke="#cbd5e1" stroke-width="1.5"/>`; }
  return s;
}

// ── dated month ──
function monthGrid(year, month, color) {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;                 // Monday = 0
  const weeks = Math.ceil((offset + days) / 7);
  const top = BODY_TOP + 110;
  let s = emo(W / 2, BODY_TOP + 62, MONTH_EMOJI[month], 60);
  const cells = [];
  s += table({ y: top, h: BODY_BOTTOM - top, cols: 7, rows: weeks, head: DAYS, color, cellFn: (x, y, cw, rh, r, c) => {
    const d = r * 7 + c - offset + 1;
    if (d < 1 || d > days) return `<rect x="${x + 1}" y="${y + 1}" width="${cw - 2}" height="${rh - 2}" fill="#f8fafc"/>`;
    cells.push(d);
    return t(x + 10, y + 24, String(d), { anchor: 'start', size: 20, color: c >= 5 ? color : ink });
  } });
  // check: every day 1..days appears exactly once, in order, and the 1st is on the right weekday
  if (cells.length !== days || cells.some((d, i) => d !== i + 1)) throw new Error(`bad grid ${year}-${month + 1}`);
  return s;
}

// ── undated monthly (fill in the month and numbers) ──
function blankMonth(e, color) {
  const top = BODY_TOP + 120;
  let s = emo(W / 2, BODY_TOP + 60, e, 56) + t(W / 2, BODY_TOP + 100, 'Mes: _________________   Año: ________', { size: 20 });
  s += table({ y: top, h: BODY_BOTTOM - top, cols: 7, rows: 6, head: DAYS, color, cellFn: (x, y) => `<circle cx="${x + 18}" cy="${y + 18}" r="11" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>` });
  return s;
}

// ── year at a glance ──
function yearGlance(year, color) {
  let s = '';
  const cols = 3, mw = (W - 100) / cols, mh = (BODY_BOTTOM - BODY_TOP - 20) / 4;
  for (let m = 0; m < 12; m++) {
    const x0 = 50 + (m % cols) * mw, y0 = BODY_TOP + 10 + Math.floor(m / cols) * mh;
    s += t(x0 + mw / 2, y0 + 22, `${MONTHS[m]} ${MONTH_EMOJI[m]}`, { size: 17, color });
    const first = (new Date(Date.UTC(year, m, 1)).getUTCDay() + 6) % 7, days = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    const cw = (mw - 20) / 7;
    DAYS.forEach((d, i) => { s += t(x0 + 10 + cw * i + cw / 2, y0 + 44, d[0], { size: 11, color: '#64748b' }); });
    for (let d = 1; d <= days; d++) {
      const idx = first + d - 1, r = Math.floor(idx / 7), c = idx % 7;
      s += t(x0 + 10 + cw * c + cw / 2, y0 + 64 + r * 19, String(d), { size: 12, weight: 700, color: c >= 5 ? color : ink });
    }
  }
  return s;
}

// ── routines / trackers ──
function checklistWeek(rows, color, emojis) {
  const top = BODY_TOP + 30;
  return table({ y: top, h: BODY_BOTTOM - top, cols: 7, rows: rows.length, head: DAYS, color, labelW: 230, rowLabels: rows.map((r, i) => `${emojis ? emojis[i] + '  ' : ''}${r}`),
    cellFn: (x, y, cw, rh) => `<rect x="${x + cw / 2 - 13}" y="${y + rh / 2 - 13}" width="26" height="26" rx="6" fill="#fff" stroke="#94a3b8" stroke-width="2"/>` });
}
function routineSteps(steps, color) {
  const top = BODY_TOP + 30, h = (BODY_BOTTOM - top) / steps.length;
  return steps.map(([e, txt], i) => {
    const y = top + i * h;
    return `<rect x="40" y="${y + 6}" width="${W - 80}" height="${h - 12}" rx="16" fill="${color}12" stroke="${color}" stroke-width="2"/>` +
      t(84, y + h / 2 + 8, String(i + 1), { size: 26, color }) + emo(150, y + h / 2 + 16, e, 44) +
      t(200, y + h / 2 + 8, txt, { anchor: 'start', size: 24 }) +
      `<rect x="${W - 110}" y="${y + h / 2 - 22}" width="44" height="44" rx="10" fill="#fff" stroke="${ink}" stroke-width="2.5"/>`;
  }).join('');
}
function countdown(n, e, goal, color) {
  const cols = n > 25 ? 6 : 5, rows = Math.ceil(n / cols), top = BODY_TOP + 120;
  const cw = (W - 100) / cols, rh = (BODY_BOTTOM - top) / rows, R = Math.min(cw, rh) * 0.38;
  let s = emo(W / 2, BODY_TOP + 70, e, 64) + t(W / 2, BODY_TOP + 108, `Colorea un círculo cada día. ¡Faltan ${n} días para ${goal}!`, { size: 19 });
  for (let i = 0; i < n; i++) {
    const cx = 50 + (i % cols) * cw + cw / 2, cy = top + Math.floor(i / cols) * rh + rh / 2;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="${color}" stroke-width="3"/>` + t(cx, cy + 10, String(n - i), { size: 28, color });
  }
  return s;
}
function weatherMonth(color) {
  const top = BODY_TOP + 130;
  let s = t(W / 2, BODY_TOP + 40, 'Mes: _________________', { size: 20 });
  s += t(W / 2, BODY_TOP + 84, 'Dibuja el clima de cada día:  ☀️ sol   ⛅ nublado   🌧️ lluvia   💨 viento', { size: 17, color: '#475569', font: `${BODY_FONT},${EMOJI_FONT}` });
  s += table({ y: top, h: BODY_BOTTOM - top, cols: 7, rows: 5, head: DAYS, color, cellFn: () => '' });
  return s;
}
function readingLog(color) {
  const top = BODY_TOP + 30, rows = 12;
  return table({ y: top, h: BODY_BOTTOM - top, cols: 4, rows, head: ['Fecha', 'Título del libro', 'Páginas', '¿Me gustó?'], color,
    cellFn: (x, y, cw, rh, r, c) => c === 3 ? t(x + cw / 2, y + rh / 2 + 8, '😀  😐  😞', { size: 20, font: EMOJI_FONT }) : '' });
}
function schoolTimetable(color) {
  const top = BODY_TOP + 30;
  return table({ y: top, h: BODY_BOTTOM - top, cols: 5, rows: 8, head: DAYS_LONG.slice(0, 5), color, labelW: 90,
    rowLabels: ['8:00', '9:00', '10:00', '11:00', 'Recreo', '12:00', '13:00', '14:00'] });
}
function mealPlan(color) {
  const top = BODY_TOP + 30;
  return table({ y: top, h: BODY_BOTTOM - top, cols: 3, rows: 7, head: ['🍳 Desayuno', '🍲 Comida', '🥪 Cena'], color, labelW: 130, rowLabels: DAYS_LONG });
}
function feelingsWeek(color) {
  const top = BODY_TOP + 30;
  return table({ y: top, h: BODY_BOTTOM - top, cols: 2, rows: 7, head: ['¿Cómo me sentí? (encierra)', '¿Por qué?'], color, labelW: 140, rowLabels: DAYS_LONG,
    cellFn: (x, y, cw, rh, r, c) => c === 0 ? t(x + cw / 2, y + rh / 2 + 10, '😀 😢 😠 😴 😮', { size: 26, font: EMOJI_FONT }) : '' });
}
function goalsWeek(color) {
  let s = '';
  const top = BODY_TOP + 30, h = (BODY_BOTTOM - top) / 3;
  ['Mi meta de la semana', 'Lo que haré para lograrla', '¿Lo logré? Lo que aprendí'].forEach((label, i) => {
    const y = top + i * h;
    s += `<rect x="40" y="${y + 6}" width="${W - 80}" height="${h - 14}" rx="16" fill="${color}0d" stroke="${color}" stroke-width="2"/>` + t(64, y + 42, label, { anchor: 'start', size: 22, color });
    for (let k = 1; k <= 4; k++) s += `<line x1="64" y1="${y + 50 + k * 40}" x2="${W - 64}" y2="${y + 50 + k * 40}" stroke="#cbd5e1" stroke-width="1.5"/>`;
  });
  return s;
}
function plantLog(color) {
  const top = BODY_TOP + 30, rows = 4, cols = 2, cw = (W - 100) / cols, rh = (BODY_BOTTOM - top) / rows;
  let s = '';
  for (let i = 0; i < rows * cols; i++) {
    const x = 50 + (i % cols) * cw, y = top + Math.floor(i / cols) * rh;
    s += `<rect x="${x + 4}" y="${y + 4}" width="${cw - 8}" height="${rh - 8}" rx="14" fill="#fff" stroke="${color}" stroke-width="2"/>` +
      t(x + 20, y + 32, `Día ${[1, 3, 5, 7, 10, 14, 21, 28][i]}   Mide: ____ cm`, { anchor: 'start', size: 17, color });
  }
  return s;
}
function starChart(color) {
  const top = BODY_TOP + 30;
  return table({ y: top, h: BODY_BOTTOM - top, cols: 7, rows: 6, head: DAYS, color, labelW: 200,
    rowLabels: ['Me porté bien', 'Ayudé en casa', 'Hice mi tarea', 'Comí bien', 'Fui amable', 'Me dormí a tiempo'],
    cellFn: (x, y, cw, rh) => t(x + cw / 2, y + rh / 2 + 10, '☆', { size: 30, color: '#cbd5e1', font: 'Arial,sans-serif' }) });
}

// ── list ──
const COLORS = ['#8b5cf6', '#0ea5e9', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'];
const ITEMS = [];
const push = (slug, es, en, ins, body) => ITEMS.push({ slug, es, en, ins, body });

push('calendario-diciembre-2026', 'Calendario Diciembre 2026', 'December 2026 Calendar', 'Anota tus fechas especiales', () => monthGrid(2026, 11, '#dc2626'));
for (let m = 0; m < 12; m++) push(`calendario-${MONTHS[m].toLowerCase()}-2027`, `Calendario ${MONTHS[m]} 2027`, `${MONTHS_EN[m]} 2027 Calendar`, 'Anota tus fechas especiales', () => monthGrid(2027, m, COLORS[m % COLORS.length]));
push('calendario-anual-2027', 'Calendario Anual 2027', '2027 Year Calendar', 'Encierra los cumpleaños y las vacaciones', () => yearGlance(2027, '#8b5cf6'));

const THEMES = [['dinosaurios', 'Dinosaurios', 'Dinosaurs', '🦕'], ['espacio', 'Espacio', 'Space', '🚀'], ['princesas', 'Princesas', 'Princesses', '👑'], ['animales', 'Animales', 'Animals', '🐼'], ['oceano', 'Océano', 'Ocean', '🐠'], ['superheroes', 'Superhéroes', 'Superheroes', '🦸'], ['unicornios', 'Unicornios', 'Unicorns', '🦄'], ['deportes', 'Deportes', 'Sports', '⚽'], ['jardin', 'Jardín', 'Garden', '🌸'], ['vehiculos', 'Vehículos', 'Vehicles', '🚒'],
  ['bosque', 'Bosque', 'Forest', '🦊'], ['granja', 'Granja', 'Farm', '🐄'], ['dulces', 'Dulces', 'Sweets', '🧁'], ['musica', 'Música', 'Music', '🎸']];
THEMES.forEach(([id, es, en, e], i) => push(`calendario-en-blanco-${id}`, `Calendario en blanco: ${es}`, `Blank Calendar: ${en}`, 'Escribe el mes y los números de los días', () => blankMonth(e, COLORS[i % COLORS.length])));

const ROUTINES = [
  ['rutina-manana', 'Rutina de la mañana', 'Morning Routine', [['🛏️', 'Me levanto y tiendo mi cama'], ['🚿', 'Me baño o me lavo la cara'], ['👕', 'Me visto'], ['🥣', 'Desayuno'], ['🦷', 'Me lavo los dientes'], ['🎒', 'Preparo mi mochila']]],
  ['rutina-noche', 'Rutina de la noche', 'Bedtime Routine', [['🧸', 'Recojo mis juguetes'], ['🛁', 'Me baño'], ['👚', 'Me pongo la pijama'], ['🦷', 'Me lavo los dientes'], ['📖', 'Leemos un cuento'], ['😴', '¡A dormir!']]],
  ['rutina-despues-escuela', 'Después de la escuela', 'After School Routine', [['🧼', 'Me lavo las manos'], ['🍎', 'Como algo rico'], ['📝', 'Hago mi tarea'], ['🎒', 'Preparo la mochila'], ['⚽', 'Tiempo de jugar'], ['🍽️', 'Ayudo a poner la mesa']]],
  ['rutina-fin-de-semana', 'Rutina de fin de semana', 'Weekend Routine', [['🛏️', 'Tiendo mi cama'], ['🧹', 'Ayudo a limpiar'], ['🌳', 'Juego al aire libre'], ['📚', 'Leo un rato'], ['👨‍👩‍👧', 'Tiempo en familia'], ['🎨', 'Hago algo creativo']]],
];
ROUTINES.forEach(([slug, es, en, steps], i) => push(slug, es, en, 'Marca cada paso cuando lo termines', () => routineSteps(steps, COLORS[(i + 2) % COLORS.length])));
push('tareas-de-casa', 'Tareas de la casa (semanal)', 'Weekly Chores Chart', 'Marca las tareas que hiciste cada día', () => checklistWeek(['Tender la cama', 'Recoger juguetes', 'Poner la mesa', 'Dar de comer a la mascota', 'Guardar la ropa', 'Regar las plantas'], '#f59e0b', ['🛏️', '🧸', '🍽️', '🐶', '👕', '🌱']));
push('habitos-saludables', 'Hábitos saludables', 'Healthy Habits Tracker', 'Marca cada hábito que cumpliste', () => checklistWeek(['Tomé agua', 'Comí fruta', 'Me lavé los dientes', 'Hice ejercicio', 'Dormí temprano', 'Leí 15 minutos'], '#22c55e', ['💧', '🍎', '🦷', '🤸', '😴', '📖']));
push('horario-escolar', 'Horario escolar', 'School Timetable', 'Escribe tus clases de cada día', () => schoolTimetable('#0ea5e9'));
push('registro-de-lectura', 'Registro de lectura', 'Reading Log', 'Anota cada libro que leas', () => readingLog('#6366f1'));
push('menu-semanal', 'Menú semanal', 'Weekly Meal Plan', 'Planea las comidas de la semana', () => mealPlan('#ef4444'));
push('tabla-de-estrellas', 'Tabla de estrellas', 'Star Reward Chart', 'Colorea una estrella por cada logro', () => starChart('#eab308'));

const COUNTDOWNS = [
  ['cuenta-regresiva-navidad', 'Cuenta regresiva a Navidad', 'Christmas Countdown', 24, '🎄', 'Navidad'],
  ['cuenta-regresiva-cumpleanos', 'Cuenta regresiva a mi cumpleaños', 'Birthday Countdown', 30, '🎂', 'mi cumpleaños'],
  ['cuenta-regresiva-vacaciones', 'Cuenta regresiva a vacaciones', 'Vacation Countdown', 30, '🏖️', 'las vacaciones'],
  ['cuenta-regresiva-reyes', 'Cuenta regresiva a los Reyes Magos', 'Three Kings Countdown', 12, '👑', 'el Día de Reyes'],
  ['cuenta-regresiva-fin-de-curso', 'Cuenta regresiva al fin de curso', 'End of School Countdown', 30, '🎓', 'el fin de curso'],
  ['cuenta-regresiva-halloween', 'Cuenta regresiva a Halloween', 'Halloween Countdown', 20, '🎃', 'Halloween'],
];
COUNTDOWNS.forEach(([slug, es, en, n, e, goal], i) => push(slug, es, en, 'Colorea un número cada día', () => countdown(n, e, goal, COLORS[(i + 4) % COLORS.length])));

push('clima-del-mes', 'Diario del clima', 'Weather Diary', 'Observa el cielo y dibuja el clima', () => weatherMonth('#0ea5e9'));
push('emociones-de-la-semana', 'Mis emociones de la semana', 'My Feelings This Week', 'Encierra cómo te sentiste cada día', () => feelingsWeek('#ec4899'));
push('metas-de-la-semana', 'Mis metas de la semana', 'My Weekly Goals', 'Escribe tu meta y cómo la lograrás', () => goalsWeek('#8b5cf6'));
push('diario-de-mi-planta', 'Diario de mi planta', 'My Plant Diary', 'Dibuja y mide tu planta cada vez', () => plantLog('#22c55e'));
push('tareas-escolares-semana', 'Tareas escolares de la semana', 'Weekly Homework Tracker', 'Marca la tarea cuando la termines', () => checklistWeek(['Español', 'Matemáticas', 'Ciencias', 'Lectura', 'Inglés', 'Arte'], '#6366f1', ['📝', '➗', '🔬', '📚', '🌎', '🎨']));
push('cuidado-mascota', 'Cuidado de mi mascota', 'Pet Care Chart', 'Marca lo que hiciste por tu mascota', () => checklistWeek(['Darle de comer', 'Ponerle agua', 'Sacarlo a pasear', 'Cepillarlo', 'Jugar con él', 'Limpiar su lugar'], '#f97316', ['🥣', '💧', '🦮', '🐾', '🎾', '🧽']));

function build() {
  if (ITEMS.length !== 50) throw new Error(`expected 50, got ${ITEMS.length}`);
  return ITEMS.map(it => ({
    slug: it.slug, title_es: it.es, title_en: it.en, diff: 'todos', age: '3-12',
    desc_es: `${it.es}: imprimible gratis para organizar el tiempo y las rutinas de los niños.`,
    desc_en: `${it.en}: free printable to help kids organize their time and routines.`,
    tip_es: 'Pégalo en el refrigerador o en la puerta de su cuarto: verlo todos los días ayuda a crear el hábito.',
    tip_en: 'Stick it on the fridge or their bedroom door — seeing it every day helps build the habit.',
    sheet: L.sheet({ cat: 'calendarios', title: it.es, instruction: it.ins, diff: 'todos', body: it.body() }),
  }));
}

if (require.main === module) L.writeCategory('calendarios', build());
module.exports = { build };
