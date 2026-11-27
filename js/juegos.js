// js/juegos.js — "Juegos Mentales" (juegos.html): Memorama, ¿Qué sigue?, Sudoku infantil
// and Simón dice, each with 3 levels, Spanish/English. Finishing a game gives 1-3 stars;
// every 10 games with stars give a new sticker for the album (js/cofre.js list,
// js/album.js). No AI, no network.
// Storage (localStorage): ck_juegos = { played, stars, sinceSticker, best: { "<game>-<level>": stars } }
//                         ck_stickers = [{ id, date }] (shared with the chest and the album)
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickN = (a, n) => shuffle(a).slice(0, n);
  // Same rule as the shared bar (ck-nav.js): the saved choice, otherwise Spanish.
  let lang = (() => { try { return localStorage.getItem('ck_lang') || 'es'; } catch (e) { return 'es'; } })();
  if (lang !== 'en') lang = 'es';

  const T = {
    es: {
      levels: { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' },
      games: {
        memo: ['🃏', 'Memorama', 'Encuentra las parejas'], sigue: ['🔁', '¿Qué sigue?', 'Descubre el patrón'],
        sudoku: ['🧩', 'Sudoku infantil', 'Sin repetir en fila, columna ni cuadro'], simon: ['🎵', 'Simón dice', 'Repite la secuencia'],
        falta: ['👀', '¿Qué falta?', 'Memoriza y descubre cuál desapareció'], calculo: ['⚡', 'Cálculo rápido', 'Resuelve todo lo que puedas en 60 segundos'],
        palabra: ['🎈', 'Palabra escondida', 'Adivina la palabra letra por letra'], intruso: ['🔍', 'Encuentra al intruso', '¿Cuál no pertenece al grupo?'],
        colores: ['🎨', 'Une los colores', 'Une cada par sin cruzar líneas y llena todo'], formas: ['🔷', 'Arma la figura', 'Acomoda las piezas para llenar la figura'],
      },
      linkHelp: 'Arrastra desde un punto hasta el otro del mismo color. Las líneas no se cruzan y hay que llenar todo el tablero.',
      fillAll: '¡Casi! Ahora llena las casillas vacías.', linkDone: s => `¡Tablero completo en ${s} segundos!`,
      shapeHelp: 'Toca una pieza, gírala con ⟳ y toca la figura para colocarla. Toca una pieza puesta para quitarla.',
      rotate: '⟳ Girar', shapeDone: s => `¡Figura completa en ${s} segundos!`,
      memorize: n => `👀 ¡Memoriza! ${n}…`, whichMissing: '¿Cuál falta?', faltaDone: (c, n) => `Encontraste ${c} de ${n}.`,
      timeLeft: s => `⏱️ ${s} s`, correct: n => `✅ ${n}`, calcDone: n => `Resolviste ${n} operaciones en 60 segundos.`,
      hint: 'Pista', wordN: (i, n) => `Palabra ${i} de ${n}`, wordWas: w => `Era: ${w}`, palabraDone: (c, n) => `Adivinaste ${c} de ${n} palabras.`,
      whichOut: '¿Cuál no pertenece?', isNot: (x, c) => `${x} no es ${c}.`, intrusoDone: (c, n) => `Encontraste ${c} de ${n} intrusos.`,
      moves: n => `${n} intentos`, q: (i, n) => `Pregunta ${i} de ${n}`, whatNext: '¿Qué sigue?',
      sudokuHelp: 'Toca una casilla vacía y luego elige qué va. Cada fila, columna y cuadro lleva cada símbolo una sola vez.',
      erase: 'Borrar', simonWatch: '👀 Mira…', simonYou: '👆 ¡Tu turno!', simonLen: n => `Secuencia: ${n}`, start: '▶️ Empezar',
      again: '🔄 Jugar otra vez', other: '🧠 Otro juego', great: ['¡Bien hecho!', '¡Muy bien!', '¡Increíble!'], tryAgain: '¡Casi! Inténtalo otra vez.',
      memoDone: (m, s) => `Lo lograste en ${m} intentos y ${s} segundos.`, sigueDone: (c, n) => `Acertaste ${c} de ${n}.`,
      sudokuDone: e => e ? `Completado con ${e} ${e === 1 ? 'error' : 'errores'}.` : '¡Completado sin errores!', simonDone: n => `Recordaste una secuencia de ${n}.`,
      stats: (s, p, n) => `⭐ ${s} estrellas · 🎮 ${p} juegos · 🏷️ sticker nuevo en ${n}`, newSticker: '¡Sticker nuevo para tu álbum!', album: '🏷️ Ver mi álbum',
    },
    en: {
      levels: { facil: 'Easy', medio: 'Medium', dificil: 'Hard' },
      games: {
        memo: ['🃏', 'Memory', 'Find the pairs'], sigue: ['🔁', 'What comes next?', 'Spot the pattern'],
        sudoku: ['🧩', 'Kids Sudoku', 'No repeats in a row, column or box'], simon: ['🎵', 'Simon says', 'Repeat the sequence'],
        falta: ['👀', "What's missing?", 'Memorize and find what disappeared'], calculo: ['⚡', 'Quick math', 'Solve as many as you can in 60 seconds'],
        palabra: ['🎈', 'Hidden word', 'Guess the word letter by letter'], intruso: ['🔍', 'Odd one out', "Which one doesn't belong?"],
        colores: ['🎨', 'Link the colors', 'Join each pair without crossing and fill it all'], formas: ['🔷', 'Build the shape', 'Fit the pieces to fill the shape'],
      },
      linkHelp: 'Drag from a dot to the other dot of the same color. Lines can’t cross and the whole board must be filled.',
      fillAll: 'Almost! Now fill the empty squares.', linkDone: s => `Board complete in ${s} seconds!`,
      shapeHelp: 'Tap a piece, turn it with ⟳ and tap the shape to place it. Tap a placed piece to take it back.',
      rotate: '⟳ Turn', shapeDone: s => `Shape complete in ${s} seconds!`,
      memorize: n => `👀 Memorize! ${n}…`, whichMissing: "Which one is missing?", faltaDone: (c, n) => `You found ${c} of ${n}.`,
      timeLeft: s => `⏱️ ${s} s`, correct: n => `✅ ${n}`, calcDone: n => `You solved ${n} in 60 seconds.`,
      hint: 'Hint', wordN: (i, n) => `Word ${i} of ${n}`, wordWas: w => `It was: ${w}`, palabraDone: (c, n) => `You guessed ${c} of ${n} words.`,
      whichOut: "Which one doesn't belong?", isNot: (x, c) => `${x} is not ${c}.`, intrusoDone: (c, n) => `You found ${c} of ${n} odd ones.`,
      moves: n => `${n} tries`, q: (i, n) => `Question ${i} of ${n}`, whatNext: 'What comes next?',
      sudokuHelp: 'Tap an empty square, then pick what goes there. Each row, column and box has every symbol once.',
      erase: 'Erase', simonWatch: '👀 Watch…', simonYou: '👆 Your turn!', simonLen: n => `Sequence: ${n}`, start: '▶️ Start',
      again: '🔄 Play again', other: '🧠 Another game', great: ['Well done!', 'Great job!', 'Amazing!'], tryAgain: 'Almost! Try again.',
      memoDone: (m, s) => `You did it in ${m} tries and ${s} seconds.`, sigueDone: (c, n) => `You got ${c} of ${n} right.`,
      sudokuDone: e => e ? `Finished with ${e} ${e === 1 ? 'mistake' : 'mistakes'}.` : 'Finished with no mistakes!', simonDone: n => `You remembered a sequence of ${n}.`,
      stats: (s, p, n) => `⭐ ${s} stars · 🎮 ${p} games · 🏷️ new sticker in ${n}`, newSticker: 'New sticker for your album!', album: '🏷️ See my album',
    },
  };
  const t = () => T[lang];

  // ── sound (respects the site-wide sound switch) ──
  let actx = null;
  function beep(freq, dur, type) {
    try {
      if (localStorage.getItem('ck_sound') === 'off') return;
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, actx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dur || 0.25));
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + (dur || 0.25) + 0.05);
    } catch (e) {}
  }
  const good = () => { beep(660, 0.12); setTimeout(() => beep(880, 0.18), 110); };
  const bad = () => beep(200, 0.25, 'sawtooth');

  const state = { game: null, level: 'facil' };
  let stopCurrent = () => {};

  // ── menu ──
  function stats() {
    const s = get('ck_juegos', { played: 0, stars: 0, sinceSticker: 0, best: {} });
    $('jgStats').textContent = t().stats(s.stars || 0, s.played || 0, 10 - (s.sinceSticker || 0));
  }
  function menu() {
    stopCurrent(); stopCurrent = () => {};
    state.game = null;
    const g = t().games, best = get('ck_juegos', { best: {} }).best || {};
    $('jgArea').innerHTML = `<div class="jg-cards">${Object.keys(g).map(k => {
      const b = ['facil', 'medio', 'dificil'].map(l => best[`${k}-${l}`] || 0);
      return `<button type="button" class="jg-card" data-game="${k}"><span class="jg-ic">${g[k][0]}</span><b>${g[k][1]}</b><small>${g[k][2]}</small>
        <span class="jg-best">${b.map((n, i) => `<i title="${t().levels[['facil', 'medio', 'dificil'][i]]}">${'★'.repeat(n)}${'☆'.repeat(3 - n)}</i>`).join('')}</span></button>`;
    }).join('')}</div>`;
    stats();
  }
  function head(gameKey, extra) {
    const g = t().games[gameKey];
    return `<div class="jg-head"><button type="button" class="jg-back" data-act="menu" aria-label="←">←</button><b>${g[0]} ${g[1]}</b>
      <div class="jg-levels">${['facil', 'medio', 'dificil'].map(l => `<button type="button" class="jg-lv${state.level === l ? ' on' : ''}" data-level="${l}">${t().levels[l]}</button>`).join('')}</div></div>
      <div class="jg-info" id="jgInfo">${extra || ''}</div>`;
  }
  function start(game, level) {
    stopCurrent(); stopCurrent = () => {};
    state.game = game; if (level) state.level = level;
    GAMES[game](state.level);
  }

  // ── result + rewards ──
  function finish(game, stars, msg) {
    stopCurrent(); stopCurrent = () => {};
    const s = get('ck_juegos', { played: 0, stars: 0, sinceSticker: 0, best: {} });
    s.best = s.best || {};
    let sticker = null;
    if (stars > 0) {
      s.played = (s.played || 0) + 1; s.stars = (s.stars || 0) + stars; s.sinceSticker = (s.sinceSticker || 0) + 1;
      const k = `${game}-${state.level}`; s.best[k] = Math.max(s.best[k] || 0, stars);
      if (s.sinceSticker >= 10 && window.ckCofre) {
        s.sinceSticker = 0;
        const have = new Set(get('ck_stickers', []).map(x => x.id));
        const fresh = ckCofre.STICKERS.filter(x => !have.has(x[0]));
        const pool = fresh.length ? fresh : ckCofre.STICKERS;
        sticker = pool[rnd(pool.length)];
        set('ck_stickers', [...get('ck_stickers', []), { id: sticker[0], date: new Date().toISOString().slice(0, 10) }]);
      }
    }
    set('ck_juegos', s);
    const area = $('jgArea');
    area.querySelector('.jg-result')?.remove();
    const div = document.createElement('div');
    div.className = 'jg-result';
    div.innerHTML = `<div class="jg-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')}</div>
      <b>${stars ? t().great[stars - 1] : t().tryAgain}</b><p>${esc(msg)}</p>
      ${sticker ? `<div class="jg-sticker"><span>${sticker[1]}</span><div><b>${t().newSticker}</b><small>${esc(lang === 'es' ? sticker[2] : sticker[3])}</small></div>
        ${window.ckAlbum ? `<button type="button" class="jg-btn jg-sec" data-act="album">${t().album}</button>` : ''}</div>` : ''}
      <div class="jg-btns"><button type="button" class="jg-btn" data-act="again">${t().again}</button><button type="button" class="jg-btn jg-sec" data-act="menu">${t().other}</button></div>`;
    area.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (stars === 3 && window.ckFx) ckFx.rain(80);
    if (stars) { beep(523, 0.15); setTimeout(() => beep(659, 0.15), 140); setTimeout(() => beep(784, 0.3), 280); }
    stats();
  }

  // ── 1. Memorama ──
  const SETS = [['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'],
    ['🍎', '🍌', '🍇', '🍓', '🍉', '🍍', '🥝', '🍒', '🍑', '🍋', '🥕', '🌽'],
    ['🚗', '🚌', '🚒', '🚀', '✈️', '🚲', '🚂', '🚁', '⛵', '🛵', '🚜', '🚓']];
  function memo(level) {
    const pairs = { facil: 3, medio: 6, dificil: 10 }[level], cols = { facil: 3, medio: 4, dificil: 5 }[level];
    const deck = shuffle(pickN(SETS[rnd(SETS.length)], pairs).flatMap(e => [e, e]));
    let first = null, lock = false, moves = 0, found = 0;
    const t0 = Date.now();
    $('jgArea').innerHTML = head('memo', t().moves(0)) +
      `<div class="jg-memo" style="grid-template-columns:repeat(${cols},1fr)">${deck.map((e, i) => `<button type="button" class="jg-mc" data-i="${i}"><span>${e}</span></button>`).join('')}</div>`;
    const cards = [...$('jgArea').querySelectorAll('.jg-mc')];
    cards.forEach(c => c.addEventListener('click', () => {
      if (lock || c.classList.contains('open')) return;
      c.classList.add('open'); beep(500, 0.06);
      if (!first) { first = c; return; }
      moves++; $('jgInfo').textContent = t().moves(moves);
      if (deck[first.dataset.i] === deck[c.dataset.i]) {
        first.classList.add('done'); c.classList.add('done'); first = null; found++; good();
        if (found === pairs) {
          const secs = Math.round((Date.now() - t0) / 1000), r = moves / pairs;
          finish('memo', r <= 1.5 ? 3 : r <= 2.2 ? 2 : 1, t().memoDone(moves, secs));
        }
      } else {
        lock = true; const a = first; first = null;
        setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); lock = false; }, 800);
      }
    }));
  }

  // ── 2. ¿Qué sigue? ──
  const SHAPES = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '❤️', '🔺', '🟦'];
  function makeQuestion(level) {
    const opts = (ans, pool) => shuffle([ans, ...shuffle([...new Set(pool.filter(x => x !== ans))])].slice(0, level === 'facil' ? 3 : 4));
    const emojiPattern = kinds => {
      const kind = kinds[rnd(kinds.length)], e = pickN(SHAPES, 4);
      const unit = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1], ABCD: [0, 1, 2, 3], ABAC: [0, 1, 0, 2] }[kind].map(i => e[i]);
      const len = Math.max(6, unit.length * 2), seq = Array.from({ length: len + 1 }, (_, i) => unit[i % unit.length]);
      const ans = seq.pop();
      return { seq, ans, options: opts(ans, e) };
    };
    const numbers = (seq, ans) => {
      const last = seq[seq.length - 1];
      const pool = [ans + 1, ans - 1, ans + 2, ans - 2, last, ans + (ans - last)].filter(x => x > 0 && x !== ans);
      return { seq: seq.map(String), ans: String(ans), options: opts(String(ans), pool.map(String)) };
    };
    if (level === 'facil') return emojiPattern(['AB', 'AAB', 'ABB', 'ABC']);
    if (level === 'medio') {
      if (Math.random() < 0.5) return emojiPattern(['AABB', 'ABCD', 'ABAC']);
      const a = 1 + rnd(5), d = 1 + rnd(3), s = Array.from({ length: 5 }, (_, i) => a + d * i);
      return numbers(s.slice(0, 4), s[4]);
    }
    const type = rnd(4);
    if (type === 0) { const a = 1 + rnd(10), d = 3 + rnd(4), s = Array.from({ length: 6 }, (_, i) => a + d * i); return numbers(s.slice(0, 5), s[5]); }
    if (type === 1) { const a = 1 + rnd(3), s = Array.from({ length: 6 }, (_, i) => a * 2 ** i); return numbers(s.slice(0, 5), s[5]); }
    if (type === 2) { const s = [1 + rnd(5)]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + i); return numbers(s.slice(0, 5), s[5]); }
    const k = 1 + rnd(4), s = [];
    for (let i = 1; i <= 3; i++) { s.push(i * k); s.push(i * k * 10); }
    return numbers(s.slice(0, 5), s[5]);
  }
  function sigue(level) {
    const N = 5;
    let i = 0, right = 0;
    $('jgArea').innerHTML = head('sigue', t().q(1, N)) + '<div id="jgSigue"></div>';
    const ask = () => {
      const q = makeQuestion(level), box = $('jgSigue');
      if (!box) return;
      $('jgInfo').textContent = t().q(i + 1, N);
      box.innerHTML = `<div class="jg-seq">${q.seq.map(x => `<span>${esc(x)}</span>`).join('')}<span class="jg-q">?</span></div>
        <div class="jg-ask">${t().whatNext}</div><div class="jg-opts">${q.options.map(o => `<button type="button" class="jg-opt">${esc(o)}</button>`).join('')}</div>`;
      let locked = false;
      box.querySelectorAll('.jg-opt').forEach(b => b.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        const ok = b.textContent === q.ans;
        b.classList.add(ok ? 'ok' : 'no');
        if (!ok) box.querySelectorAll('.jg-opt').forEach(x => { if (x.textContent === q.ans) x.classList.add('ok'); });
        box.querySelector('.jg-q').textContent = q.ans;
        if (ok) { right++; good(); } else bad();
        const tm = setTimeout(() => {
          if (++i < N) ask();
          else finish('sigue', right === N ? 3 : right >= 4 ? 2 : right >= 2 ? 1 : 0, t().sigueDone(right, N));
        }, ok ? 700 : 1300);
        stopCurrent = () => clearTimeout(tm);
      }));
    };
    ask();
  }

  // ── 3. Sudoku infantil ──
  const SUDOKU = {
    facil: { n: 4, br: 2, bc: 2, givens: 9, sym: ['🍎', '🍌', '🍇', '🍓'] },
    medio: { n: 6, br: 2, bc: 3, givens: 20, sym: ['1', '2', '3', '4', '5', '6'] },
    dificil: { n: 9, br: 3, bc: 3, givens: 40, sym: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  };
  // A valid full grid: the classic shifted pattern, then shuffles that keep it valid
  // (rows inside a band, bands, columns inside a stack, stacks, symbols).
  function fullGrid({ n, br, bc }) {
    const base = (r, c) => (bc * (r % br) + Math.floor(r / br) + c) % n;
    const rows = shuffle([...Array(n / br).keys()]).flatMap(b => shuffle([...Array(br).keys()]).map(r => b * br + r));
    const cols = shuffle([...Array(n / bc).keys()]).flatMap(s => shuffle([...Array(bc).keys()]).map(c => s * bc + c));
    const sym = shuffle([...Array(n).keys()]);
    return rows.map(r => cols.map(c => sym[base(r, c)]));
  }
  function sudoku(level) {
    const cfg = SUDOKU[level], { n, br, bc } = cfg;
    const grid = fullGrid(cfg);
    const given = new Set(pickN([...Array(n * n).keys()], cfg.givens));
    const val = Array.from({ length: n * n }, (_, i) => given.has(i) ? grid[Math.floor(i / n)][i % n] : null);
    let sel = null, errors = 0;
    $('jgArea').innerHTML = head('sudoku', t().sudokuHelp) +
      `<div class="jg-sud jg-sud${n}" style="grid-template-columns:repeat(${n},1fr)">${val.map((v, i) => {
        const r = Math.floor(i / n), c = i % n;
        const cls = ['jg-cell', given.has(i) ? 'given' : '', c % bc === bc - 1 && c < n - 1 ? 'br' : '', r % br === br - 1 && r < n - 1 ? 'bb' : ''].join(' ');
        return `<button type="button" class="${cls}" data-i="${i}">${v == null ? '' : cfg.sym[v]}</button>`;
      }).join('')}</div>
      <div class="jg-pal">${cfg.sym.map((s, k) => `<button type="button" class="jg-sym" data-k="${k}">${s}</button>`).join('')}<button type="button" class="jg-sym jg-erase" data-k="x">${t().erase}</button></div>`;
    const cells = [...$('jgArea').querySelectorAll('.jg-cell')];
    // A placement is wrong if the same symbol is already in its row, column or box.
    const conflict = (i, k) => {
      const r = Math.floor(i / n), c = i % n, r0 = r - r % br, c0 = c - c % bc;
      for (let j = 0; j < n * n; j++) {
        if (j === i || val[j] !== k) continue;
        const rr = Math.floor(j / n), cc = j % n;
        if (rr === r || cc === c || (rr >= r0 && rr < r0 + br && cc >= c0 && cc < c0 + bc)) return true;
      }
      return false;
    };
    cells.forEach(cell => cell.addEventListener('click', () => {
      const i = +cell.dataset.i;
      if (given.has(i)) return;
      cells.forEach(x => x.classList.remove('sel')); cell.classList.add('sel'); sel = i;
    }));
    $('jgArea').querySelectorAll('.jg-sym').forEach(b => b.addEventListener('click', () => {
      if (sel == null) return;
      const cell = cells[sel];
      if (b.dataset.k === 'x') { val[sel] = null; cell.textContent = ''; return; }
      const k = +b.dataset.k;
      if (conflict(sel, k)) { errors++; bad(); cell.classList.add('shake'); setTimeout(() => cell.classList.remove('shake'), 400); return; }
      val[sel] = k; cell.textContent = cfg.sym[k]; beep(600, 0.07);
      if (val.every(v => v != null)) finish('sudoku', errors === 0 ? 3 : errors <= 2 ? 2 : 1, t().sudokuDone(errors));
    }));
  }

  // ── 4. Simón dice ──
  const PADS = [['#ef4444', 262], ['#3b82f6', 330], ['#22c55e', 392], ['#eab308', 523], ['#a855f7', 587], ['#f97316', 659]];
  function simon(level) {
    const cfg = { facil: { pads: 4, speed: 650, goals: [3, 6, 9] }, medio: { pads: 4, speed: 480, goals: [4, 7, 10] }, dificil: { pads: 6, speed: 380, goals: [5, 8, 12] } }[level];
    const seq = [], timers = [];
    let pos = 0, listening = false, alive = true;
    stopCurrent = () => { alive = false; timers.forEach(clearTimeout); };
    $('jgArea').innerHTML = head('simon', t().simonLen(0)) +
      `<div class="jg-simon jg-simon${cfg.pads}">${PADS.slice(0, cfg.pads).map(([col], i) => `<button type="button" class="jg-pad" data-i="${i}" style="--c:${col}" aria-label="${i + 1}"></button>`).join('')}</div>
      <div class="jg-ask" id="jgSimonMsg"><button type="button" class="jg-btn" id="jgSimonGo">${t().start}</button></div>`;
    const pads = [...$('jgArea').querySelectorAll('.jg-pad')];
    const flash = (i, ms) => { pads[i].classList.add('lit'); beep(PADS[i][1], ms / 1000); timers.push(setTimeout(() => pads[i].classList.remove('lit'), ms * 0.8)); };
    const playSeq = () => {
      listening = false; $('jgSimonMsg').textContent = t().simonWatch; $('jgInfo').textContent = t().simonLen(seq.length);
      seq.forEach((p, k) => timers.push(setTimeout(() => alive && flash(p, cfg.speed * 0.8), 600 + k * cfg.speed)));
      timers.push(setTimeout(() => { if (!alive) return; listening = true; pos = 0; $('jgSimonMsg').textContent = t().simonYou; }, 600 + seq.length * cfg.speed));
    };
    const next = () => { seq.push(rnd(cfg.pads)); playSeq(); };
    $('jgSimonGo').addEventListener('click', next);
    pads.forEach(p => p.addEventListener('click', () => {
      if (!listening) return;
      const i = +p.dataset.i;
      flash(i, 250);
      if (i !== seq[pos]) {
        listening = false; bad();
        const done = seq.length - 1, stars = done >= cfg.goals[2] ? 3 : done >= cfg.goals[1] ? 2 : done >= cfg.goals[0] ? 1 : 0;
        timers.push(setTimeout(() => finish('simon', stars, t().simonDone(done)), 500));
        return;
      }
      if (++pos === seq.length) {
        listening = false;
        if (seq.length >= 20) { finish('simon', 3, t().simonDone(seq.length)); return; }
        timers.push(setTimeout(() => alive && next(), 700));
      }
    }));
  }

  // ── shared picture groups (¿Qué falta? and Encuentra al intruso) ──
  const GROUPS = {
    frutas:    { es: 'una fruta', en: 'a fruit', items: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍍', '🍒', '🍑', '🍋', '🥝'] },
    verduras:  { es: 'una verdura', en: 'a vegetable', items: ['🥕', '🥦', '🌽', '🥒', '🍆', '🥔', '🧅', '🌶️'] },
    animales:  { es: 'un animal', en: 'an animal', items: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'] },
    vehiculos: { es: 'un vehículo', en: 'a vehicle', items: ['🚗', '🚌', '🚒', '🚀', '✈️', '🚲', '🚂', '🚁', '⛵', '🚜'] },
    ropa:      { es: 'ropa', en: 'clothing', items: ['👕', '👖', '👗', '🧦', '🧢', '👟', '🧤', '🧣', '👒'] },
    deportes:  { es: 'una pelota de deporte', en: 'a sports ball', items: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐'] },
    musica:    { es: 'un instrumento', en: 'an instrument', items: ['🎸', '🎹', '🥁', '🎺', '🎻', '🎷'] },
    clima:     { es: 'el clima', en: 'weather', items: ['☀️', '🌧️', '⛄', '🌈', '⚡', '❄️', '🌪️'] },
    vuelan:    { es: 'un animal que vuela', en: 'an animal that flies', items: ['🦅', '🐦', '🦋', '🐝', '🦉', '🦆', '🦜'] },
    mar:       { es: 'un animal del mar', en: 'a sea animal', items: ['🐟', '🐬', '🐳', '🐙', '🦀', '🦈', '🐠'] },
    granja:    { es: 'un animal de granja', en: 'a farm animal', items: ['🐮', '🐷', '🐔', '🐑', '🐴', '🐐'] },
  };

  // ── 5. ¿Qué falta? ──
  function falta(level) {
    const cfg = { facil: { n: 3, ms: 3000 }, medio: { n: 5, ms: 3000 }, dificil: { n: 7, ms: 2500 } }[level];
    const pool = [...new Set(Object.values(GROUPS).flatMap(g => g.items))];
    const N = 5, timers = [];
    let i = 0, right = 0, alive = true;
    stopCurrent = () => { alive = false; timers.forEach(clearTimeout); };
    $('jgArea').innerHTML = head('falta', t().q(1, N)) + '<div id="jgFalta"></div>';
    const round = () => {
      const shown = pickN(pool, cfg.n), missing = shown[rnd(shown.length)];
      const box = $('jgFalta');
      $('jgInfo').textContent = t().q(i + 1, N);
      let left = Math.ceil(cfg.ms / 1000);
      box.innerHTML = `<div class="jg-ask" id="jgFaltaMsg">${t().memorize(left)}</div><div class="jg-objs">${shown.map(e => `<span>${e}</span>`).join('')}</div>`;
      const tick = () => {
        if (!alive) return;
        left--;
        if (left > 0) { $('jgFaltaMsg').textContent = t().memorize(left); timers.push(setTimeout(tick, 1000)); return; }
        // Hide, then show the same objects minus one, in a new order.
        const rest = shuffle(shown.filter(e => e !== missing));
        const options = shuffle([missing, ...pickN(pool.filter(e => !shown.includes(e)), level === 'facil' ? 2 : 3)]);
        box.innerHTML = `<div class="jg-objs jg-objs-after">${rest.map(e => `<span>${e}</span>`).join('')}<span class="jg-gap">?</span></div>
          <div class="jg-ask">${t().whichMissing}</div><div class="jg-opts">${options.map(o => `<button type="button" class="jg-opt">${o}</button>`).join('')}</div>`;
        let locked = false;
        box.querySelectorAll('.jg-opt').forEach(b => b.addEventListener('click', () => {
          if (locked) return;
          locked = true;
          const ok = b.textContent === missing;
          b.classList.add(ok ? 'ok' : 'no');
          if (!ok) box.querySelectorAll('.jg-opt').forEach(x => { if (x.textContent === missing) x.classList.add('ok'); });
          box.querySelector('.jg-gap').textContent = missing;
          if (ok) { right++; good(); } else bad();
          timers.push(setTimeout(() => {
            if (!alive) return;
            if (++i < N) round();
            else finish('falta', right === N ? 3 : right >= 4 ? 2 : right >= 2 ? 1 : 0, t().faltaDone(right, N));
          }, ok ? 800 : 1400));
        }));
      };
      timers.push(setTimeout(tick, 1000));
    };
    round();
  }

  // ── 6. Cálculo rápido ──
  function makeSum(level) {
    let a, b, op, ans;
    if (level === 'facil') { a = rnd(6); b = rnd(11 - a); op = '+'; ans = a + b; }
    else if (level === 'medio') {
      if (Math.random() < 0.5) { a = rnd(11); b = rnd(21 - a); op = '+'; ans = a + b; }
      else { a = 5 + rnd(16); b = rnd(a + 1); op = '−'; ans = a - b; }
    } else {
      const k = rnd(3);
      if (k === 0) { a = 2 + rnd(9); b = 2 + rnd(9); op = '×'; ans = a * b; }
      else if (k === 1) { a = 10 + rnd(60); b = 5 + rnd(30); op = '+'; ans = a + b; }
      else { a = 30 + rnd(70); b = 5 + rnd(a - 10); op = '−'; ans = a - b; }
    }
    const near = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, op === '×' ? ans + a : ans + 3].filter(x => x >= 0 && x !== ans);
    return { text: `${a} ${op} ${b}`, ans, options: shuffle([ans, ...shuffle([...new Set(near)]).slice(0, 3)]) };
  }
  function calculo(level) {
    const goals = { facil: [8, 12, 16], medio: [8, 12, 16], dificil: [6, 10, 14] }[level];
    let left = 60, right = 0, q = null, iv = null;
    stopCurrent = () => clearInterval(iv);
    $('jgArea').innerHTML = head('calculo', '') +
      `<div class="jg-ask" id="jgCalcMsg"><button type="button" class="jg-btn" id="jgCalcGo">${t().start}</button></div><div id="jgCalc"></div>`;
    const info = () => { $('jgInfo').textContent = `${t().timeLeft(left)} · ${t().correct(right)}`; };
    const ask = () => {
      q = makeSum(level);
      $('jgCalc').innerHTML = `<div class="jg-sum">${q.text} = ?</div><div class="jg-opts">${q.options.map(o => `<button type="button" class="jg-opt">${o}</button>`).join('')}</div>`;
      $('jgCalc').querySelectorAll('.jg-opt').forEach(b => b.addEventListener('click', () => {
        if (+b.textContent === q.ans) { right++; good(); info(); ask(); }
        else { bad(); b.classList.add('no'); b.disabled = true; }
      }));
    };
    $('jgCalcGo').addEventListener('click', () => {
      $('jgCalcMsg').textContent = '';
      info(); ask();
      iv = setInterval(() => {
        left--; info();
        if (left <= 0) {
          clearInterval(iv);
          finish('calculo', right >= goals[2] ? 3 : right >= goals[1] ? 2 : right >= goals[0] ? 1 : 0, t().calcDone(right));
        }
      }, 1000);
    });
    info();
  }

  // ── 7. Palabra escondida (friendly hangman: a balloon pops per mistake) ──
  const WORDS = {
    es: {
      facil: [['SOL', '☀️'], ['GATO', '🐱'], ['PATO', '🦆'], ['LUNA', '🌙'], ['OSO', '🐻'], ['CASA', '🏠'], ['PAN', '🍞'], ['PEZ', '🐟'], ['UVA', '🍇'], ['TREN', '🚂'], ['NUBE', '☁️'], ['FLOR', '🌸'], ['MANO', '✋'], ['VACA', '🐮']],
      medio: [['PERRO', '🐶'], ['FRESA', '🍓'], ['CONEJO', '🐰'], ['BARCO', '⛵'], ['CAMISA', '👕'], ['LIBRO', '📚'], ['PLAYA', '🏖️'], ['PELOTA', '⚽'], ['ZAPATO', '👟'], ['CEREZA', '🍒'], ['RATON', '🐭'], ['PASTEL', '🎂']],
      dificil: [['ESTRELLA', '⭐'], ['MARIPOSA', '🦋'], ['ELEFANTE', '🐘'], ['DINOSAURIO', '🦖'], ['CABALLO', '🐴'], ['TORTUGA', '🐢'], ['CHOCOLATE', '🍫'], ['MANZANA', '🍎'], ['ARCOIRIS', '🌈'], ['HELICOPTERO', '🚁'], ['GUITARRA', '🎸']],
    },
    en: {
      facil: [['SUN', '☀️'], ['CAT', '🐱'], ['DOG', '🐶'], ['FISH', '🐟'], ['MOON', '🌙'], ['BEAR', '🐻'], ['CAKE', '🎂'], ['TREE', '🌳'], ['STAR', '⭐'], ['BOOK', '📚'], ['DUCK', '🦆'], ['BUS', '🚌']],
      medio: [['APPLE', '🍎'], ['HORSE', '🐴'], ['TRAIN', '🚂'], ['HOUSE', '🏠'], ['CLOUD', '☁️'], ['PIZZA', '🍕'], ['ROBOT', '🤖'], ['TIGER', '🐯'], ['BREAD', '🍞'], ['FLOWER', '🌸'], ['RABBIT', '🐰']],
      dificil: [['ELEPHANT', '🐘'], ['BUTTERFLY', '🦋'], ['DINOSAUR', '🦖'], ['RAINBOW', '🌈'], ['CHOCOLATE', '🍫'], ['PENGUIN', '🐧'], ['GIRAFFE', '🦒'], ['TURTLE', '🐢'], ['SNOWMAN', '⛄'], ['PINEAPPLE', '🍍'], ['GUITAR', '🎸']],
    },
  };
  function palabra(level) {
    const N = 3, LIVES = 6, timers = [];
    const words = pickN(WORDS[lang][level], N);
    let i = 0, solved = 0;
    stopCurrent = () => timers.forEach(clearTimeout);
    $('jgArea').innerHTML = head('palabra', t().wordN(1, N)) + '<div id="jgPal"></div>';
    const keys = (lang === 'es' ? 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').split('');
    const play = () => {
      const [word, emoji] = words[i];
      const found = new Set();
      let lives = LIVES, over = false;
      $('jgInfo').textContent = t().wordN(i + 1, N);
      const draw = () => {
        $('jgPal').innerHTML = `<div class="jg-hint">${emoji} <small>${t().hint}</small></div>
          <div class="jg-balloons">${Array.from({ length: LIVES }, (_, k) => `<span class="${k < lives ? '' : 'pop'}">${k < lives ? '🎈' : '💥'}</span>`).join('')}</div>
          <div class="jg-word">${word.split('').map(ch => `<span>${found.has(ch) || over ? ch : ''}</span>`).join('')}</div>
          <div class="jg-keys">${keys.map(k => `<button type="button" class="jg-key${found.has(k) ? ' ok' : ''}${$('jgPal').dataset['x' + k] ? ' no' : ''}" data-k="${k}"${found.has(k) || $('jgPal').dataset['x' + k] || over ? ' disabled' : ''}>${k}</button>`).join('')}</div>`;
      };
      Object.keys($('jgPal').dataset).forEach(k => delete $('jgPal').dataset[k]);
      draw();
      $('jgPal').onclick = e => {
        const b = e.target.closest('.jg-key');
        if (!b || over || b.disabled) return;
        const k = b.dataset.k;
        if (word.includes(k)) { found.add(k); good(); }
        else { $('jgPal').dataset['x' + k] = '1'; lives--; bad(); }
        const won = word.split('').every(ch => found.has(ch));
        if (won || lives <= 0) {
          over = true;
          if (won) solved++;
          draw();
          if (!won) $('jgPal').insertAdjacentHTML('beforeend', `<div class="jg-ask">${t().wordWas(word)}</div>`);
          timers.push(setTimeout(() => {
            if (++i < N) play();
            else finish('palabra', solved, t().palabraDone(solved, N));
          }, won ? 1000 : 1800));
        } else draw();
      };
    };
    play();
  }

  // ── 8. Encuentra al intruso ──
  function intruso(level) {
    const N = 6, timers = [];
    let i = 0, right = 0;
    stopCurrent = () => timers.forEach(clearTimeout);
    // Easy: very different groups. Hard: close ones (fruit vs vegetable, sea vs farm…) and even/odd numbers.
    const EASY = ['frutas', 'animales', 'vehiculos', 'ropa', 'musica', 'deportes'];
    const HARD_PAIRS = [['frutas', 'verduras'], ['verduras', 'frutas'], ['mar', 'granja'], ['granja', 'mar'], ['vuelan', 'mar'], ['vuelan', 'granja'], ['clima', 'frutas']];
    $('jgArea').innerHTML = head('intruso', t().q(1, N)) + '<div id="jgInt"></div>';
    const round = () => {
      let items, odd, why;
      if (level === 'dificil' && Math.random() < 0.3) {
        const even = Math.random() < 0.5;
        const base = shuffle([...Array(20).keys()].map(x => x + 1).filter(x => (x % 2 === 0) === even)).slice(0, 4);
        const out = shuffle([...Array(20).keys()].map(x => x + 1).filter(x => (x % 2 === 0) !== even))[0];
        items = shuffle([...base.map(String), String(out)]); odd = String(out);
        why = t().isNot(odd, lang === 'es' ? (even ? 'par' : 'impar') : (even ? 'even' : 'odd'));
      } else {
        const [g, o] = level === 'dificil' ? HARD_PAIRS[rnd(HARD_PAIRS.length)] : (() => { const g = EASY[rnd(EASY.length)]; return [g, shuffle(EASY.filter(x => x !== g))[0]]; })();
        const n = level === 'facil' ? 3 : 4;
        const cand = GROUPS[o].items.filter(x => !GROUPS[g].items.includes(x));
        odd = cand[rnd(cand.length)];
        items = shuffle([...pickN(GROUPS[g].items, n), odd]);
        why = t().isNot(odd, GROUPS[g][lang]);
      }
      const box = $('jgInt');
      $('jgInfo').textContent = t().q(i + 1, N);
      box.innerHTML = `<div class="jg-ask">${t().whichOut}</div><div class="jg-opts jg-big">${items.map(o => `<button type="button" class="jg-opt">${o}</button>`).join('')}</div><div class="jg-why" id="jgWhy"></div>`;
      let locked = false;
      box.querySelectorAll('.jg-opt').forEach(b => b.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        const ok = b.textContent === odd;
        b.classList.add(ok ? 'ok' : 'no');
        if (!ok) box.querySelectorAll('.jg-opt').forEach(x => { if (x.textContent === odd) x.classList.add('ok'); });
        $('jgWhy').textContent = why;
        if (ok) { right++; good(); } else bad();
        timers.push(setTimeout(() => {
          if (++i < N) round();
          else finish('intruso', right === N ? 3 : right >= 4 ? 2 : right >= 2 ? 1 : 0, t().intrusoDone(right, N));
        }, ok ? 1100 : 1800));
      }));
    };
    round();
  }

  // Stars by time for the two board puzzles below.
  const timeStars = (secs, [a, b]) => secs <= a ? 3 : secs <= b ? 2 : 1;
  const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#ec4899', '#06b6d4'];

  // ── 9. Une los colores (a number-link puzzle) ──
  // A random path that visits every cell once ("backbite" moves on a snake path), cut
  // into one segment per color: its two ends become the dots, so a full solution exists.
  function linkPuzzle(n, k) {
    const nb = i => { const r = Math.floor(i / n), c = i % n, o = []; if (r) o.push(i - n); if (r < n - 1) o.push(i + n); if (c) o.push(i - 1); if (c < n - 1) o.push(i + 1); return o; };
    for (let tries = 0; tries < 200; tries++) {
      let p = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) p.push(r * n + (r % 2 ? n - 1 - c : c));
      for (let s = 0; s < n * n * 40; s++) {
        if (Math.random() < 0.5) p.reverse();
        const end = p[p.length - 1], cand = nb(end).filter(x => x !== p[p.length - 2]);
        const j = p.indexOf(cand[rnd(cand.length)]);
        p = p.slice(0, j + 1).concat(p.slice(j + 1).reverse());
      }
      const sizes = Array(k).fill(3);
      for (let left = n * n - 3 * k; left > 0; left--) sizes[rnd(k)]++;
      const segs = []; let at = 0;
      for (const s of sizes) { segs.push(p.slice(at, at + s)); at += s; }
      const adj = (a, b) => nb(a).includes(b);
      if (segs.every(s => !adj(s[0], s[s.length - 1]))) return segs;   // no trivial neighbours
    }
    return null;
  }
  function colores(level) {
    const cfg = { facil: { n: 5, k: 4, t: [60, 150] }, medio: { n: 6, k: 5, t: [90, 210] }, dificil: { n: 7, k: 7, t: [150, 300] } }[level];
    const { n, k } = cfg, segs = linkPuzzle(n, k);
    const dots = {}; segs.forEach((s, c) => { dots[s[0]] = c; dots[s[s.length - 1]] = c; });
    const owner = Array(n * n).fill(-1), paths = Array.from({ length: k }, () => []);
    let active = -1;
    const t0 = Date.now();
    $('jgArea').innerHTML = head('colores', t().linkHelp) +
      `<div class="jg-link" id="jgLink" style="--n:${n}">${Array.from({ length: n * n }, (_, i) => `<div class="jg-lc" data-i="${i}">${dots[i] != null ? `<span class="jg-dot" style="background:${COLORS[dots[i]]}"></span>` : ''}</div>`).join('')}
      <svg class="jg-lines" viewBox="0 0 ${n} ${n}" preserveAspectRatio="none"></svg></div><div class="jg-ask" id="jgLinkMsg"></div>`;
    const board = $('jgLink'), cells = [...board.querySelectorAll('.jg-lc')];
    const done = c => { const p = paths[c]; return p.length > 1 && dots[p[0]] === c && dots[p[p.length - 1]] === c && p[0] !== p[p.length - 1]; };
    const cut = (c, idx) => { paths[c].slice(idx).forEach(i => { owner[i] = -1; }); paths[c] = paths[c].slice(0, idx); };
    const draw = () => {
      cells.forEach((el, i) => { el.style.background = owner[i] >= 0 ? COLORS[owner[i]] + '33' : ''; });
      board.querySelector('svg').innerHTML = paths.map((p, c) => p.length > 1 ? `<polyline points="${p.map(i => `${i % n + 0.5},${Math.floor(i / n) + 0.5}`).join(' ')}" fill="none" stroke="${COLORS[c]}" stroke-width="0.32" stroke-linecap="round" stroke-linejoin="round"/>` : '').join('');
    };
    const cellAt = e => { const el = document.elementFromPoint(e.clientX, e.clientY); const c = el && el.closest && el.closest('.jg-lc'); return c && board.contains(c) ? +c.dataset.i : -1; };
    const isAdj = (a, b) => Math.abs(a - b) === n || (Math.abs(a - b) === 1 && Math.floor(a / n) === Math.floor(b / n));
    board.addEventListener('pointerdown', e => {
      const i = cellAt(e); if (i < 0) return;
      e.preventDefault();
      if (dots[i] != null) { const c = dots[i]; cut(c, 0); paths[c] = [i]; owner[i] = c; active = c; }
      else if (owner[i] >= 0) { const c = owner[i]; cut(c, paths[c].indexOf(i) + 1); active = c; }
      else return;
      beep(500, 0.05); draw();
    });
    board.addEventListener('pointermove', e => {
      if (active < 0) return;
      const i = cellAt(e), p = paths[active], last = p[p.length - 1];
      if (i < 0 || i === last || !isAdj(i, last)) return;
      if (p.length > 1 && i === p[p.length - 2]) { owner[last] = dots[last] === active && p.length === 1 ? active : -1; p.pop(); draw(); return; }
      if (p.includes(i)) { cut(active, p.indexOf(i) + 1); draw(); return; }
      if (done(active)) return;
      if (dots[i] != null) {
        if (dots[i] !== active || i === p[0]) return;
        p.push(i); owner[i] = active; good(); draw(); active = -1; return;
      }
      if (owner[i] >= 0) cut(owner[i], paths[owner[i]].indexOf(i));
      p.push(i); owner[i] = active; beep(420, 0.03); draw();
    });
    const up = () => {
      if (active < 0 && !paths.some(p => p.length)) return;
      active = -1;
      const allLinked = paths.every((_, c) => done(c));
      if (allLinked && owner.every(o => o >= 0)) finish('colores', timeStars(Math.round((Date.now() - t0) / 1000), cfg.t), t().linkDone(Math.round((Date.now() - t0) / 1000)));
      else $('jgLinkMsg').textContent = allLinked ? t().fillAll : '';
    };
    board.addEventListener('pointerup', up);
    board.addEventListener('pointerleave', () => { if (active >= 0) up(); });
    draw();
  }

  // ── 10. Arma la figura (fit polyomino pieces into an abstract shape) ──
  // A random blob is cut into connected pieces of 2-5 cells by growing regions from
  // seeds, so the pieces always fit back together.
  function shapePuzzle(size, cellsWanted, pieces) {
    const nb = i => { const r = Math.floor(i / size), c = i % size, o = []; if (r) o.push(i - size); if (r < size - 1) o.push(i + size); if (c) o.push(i - 1); if (c < size - 1) o.push(i + 1); return o; };
    for (let tries = 0; tries < 400; tries++) {
      const region = new Set([rnd(size * size)]);
      while (region.size < cellsWanted) { const from = [...region][rnd(region.size)]; const to = nb(from)[rnd(nb(from).length)]; region.add(to); }
      const label = new Map(), seeds = shuffle([...region]).slice(0, pieces);
      seeds.forEach((s, p) => label.set(s, p));
      let grew = true;
      while (grew) {
        grew = false;
        for (const p of shuffle([...Array(pieces).keys()])) {
          const mine = [...label].filter(([, q]) => q === p).map(([c]) => c);
          if (mine.length >= 5) continue;
          const free = shuffle(mine.flatMap(nb).filter(c => region.has(c) && !label.has(c)));
          if (free.length) { label.set(free[0], p); grew = true; }
        }
      }
      if (label.size !== region.size) continue;
      const groups = Array.from({ length: pieces }, (_, p) => [...label].filter(([, q]) => q === p).map(([c]) => [c % size, Math.floor(c / size)]));
      if (groups.some(g => g.length < 2)) continue;
      return { region, groups };
    }
    return null;
  }
  const norm = cells => { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  const rot = cells => norm(cells.map(([x, y]) => [-y, x]));
  function formas(level) {
    const cfg = { facil: { size: 5, cells: 12, pieces: 4, t: [60, 150] }, medio: { size: 6, cells: 18, pieces: 5, t: [100, 220] }, dificil: { size: 7, cells: 26, pieces: 7, t: [160, 320] } }[level];
    const pz = shapePuzzle(cfg.size, cfg.cells, cfg.pieces), S = cfg.size;
    const pieces = pz.groups.map((g, p) => { let c = norm(g); for (let r = rnd(4); r > 0; r--) c = rot(c); return { id: p, cells: c, at: null }; });
    const fill = Array(S * S).fill(-1);
    let sel = null;
    const t0 = Date.now();
    $('jgArea').innerHTML = head('formas', t().shapeHelp) +
      `<div class="jg-shape" id="jgShape" style="--n:${S}">${Array.from({ length: S * S }, (_, i) => `<div class="jg-sc${pz.region.has(i) ? ' slot' : ''}" data-i="${i}"></div>`).join('')}</div>
       <div class="jg-tray-bar"><button type="button" class="jg-btn jg-sec" id="jgRot">${t().rotate}</button></div><div class="jg-tray" id="jgTray"></div>`;
    const board = $('jgShape'), cells = [...board.querySelectorAll('.jg-sc')];
    const target = (pc, i) => pc.cells.map(([x, y]) => { const ax = i % S + x - pc.cells[0][0], ay = Math.floor(i / S) + y - pc.cells[0][1]; return ax < 0 || ay < 0 || ax >= S || ay >= S ? -1 : ay * S + ax; });
    const fits = (pc, i) => target(pc, i).every(c => c >= 0 && pz.region.has(c) && fill[c] < 0);
    const mini = pc => { const w = Math.max(...pc.cells.map(c => c[0])) + 1, h = Math.max(...pc.cells.map(c => c[1])) + 1;
      return `<svg viewBox="0 0 ${w} ${h}" style="width:${w * 26}px;height:${h * 26}px">${pc.cells.map(([x, y]) => `<rect x="${x + 0.05}" y="${y + 0.05}" width="0.9" height="0.9" rx="0.15" fill="${COLORS[pc.id % COLORS.length]}"/>`).join('')}</svg>`; };
    const draw = (hover = -1) => {
      const prev = sel != null && hover >= 0 ? target(pieces[sel], hover) : [];
      const ok = sel != null && hover >= 0 && fits(pieces[sel], hover);
      cells.forEach((el, i) => {
        el.style.background = fill[i] >= 0 ? COLORS[fill[i] % COLORS.length] : '';
        el.classList.toggle('hov-ok', ok && prev.includes(i));
        el.classList.toggle('hov-no', !ok && prev.includes(i) && pz.region.has(i));
      });
      $('jgTray').innerHTML = pieces.filter(p => p.at == null).map(p => `<button type="button" class="jg-piece${sel === p.id ? ' on' : ''}" data-p="${p.id}">${mini(p)}</button>`).join('');
    };
    $('jgTray').addEventListener('click', e => { const b = e.target.closest('.jg-piece'); if (!b) return; sel = sel === +b.dataset.p ? null : +b.dataset.p; beep(500, 0.05); draw(); });
    $('jgRot').addEventListener('click', () => { if (sel == null) return; pieces[sel].cells = rot(pieces[sel].cells); beep(600, 0.05); draw(); });
    board.addEventListener('pointermove', e => { const c = e.target.closest('.jg-sc'); draw(c ? +c.dataset.i : -1); });
    board.addEventListener('click', e => {
      const c = e.target.closest('.jg-sc'); if (!c) return;
      const i = +c.dataset.i;
      if (fill[i] >= 0) {                                    // take a placed piece back
        const p = fill[i]; fill.forEach((v, j) => { if (v === p) fill[j] = -1; }); pieces[p].at = null; sel = p; beep(350, 0.05); draw(i); return;
      }
      if (sel == null) return;
      if (!fits(pieces[sel], i)) { bad(); return; }
      target(pieces[sel], i).forEach(j => { fill[j] = sel; });
      pieces[sel].at = i; sel = null; good();
      draw();
      if ([...pz.region].every(j => fill[j] >= 0)) {
        const secs = Math.round((Date.now() - t0) / 1000);
        finish('formas', timeStars(secs, cfg.t), t().shapeDone(secs));
      }
    });
    draw();
  }

  const GAMES = { memo, sigue, sudoku, simon, falta, calculo, palabra, intruso, colores, formas };

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-game]'); if (c) { start(c.dataset.game); return; }
    const l = e.target.closest('[data-level]'); if (l) { start(state.game, l.dataset.level); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'menu') menu();
    if (a.dataset.act === 'again') start(state.game);
    if (a.dataset.act === 'album' && window.ckAlbum) ckAlbum.open();
  });

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-es]').forEach(el => { el.textContent = el.dataset[lang]; });
    if (state.game) start(state.game); else menu();
  }
  // ck-nav.js calls setLang() when ES/EN is pressed in the shared bar.
  window.setLang = l => { lang = l === 'en' ? 'en' : 'es'; applyLang(); };

  window.ckJuegos = { start, menu, _t: { fullGrid, makeQuestion, SUDOKU, makeSum, GROUPS, WORDS, linkPuzzle, shapePuzzle } };
  applyLang();
})();
