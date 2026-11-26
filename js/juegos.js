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
      },
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
      },
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

  const GAMES = { memo, sigue, sudoku, simon };

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

  window.ckJuegos = { start, menu, _t: { fullGrid, makeQuestion, SUDOKU } };
  applyLang();
})();
