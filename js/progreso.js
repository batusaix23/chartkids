// js/progreso.js — "Mi progreso" (recompensas.html): one place that gathers everything
// a child earns across the site: stars this week, best streak, stickers, games, chests,
// stories, each chart's pet, and 12 achievements. Read-only: it reads what the chart
// (index.html), the chest/album, the games and the stories already store on this device.
(function () {
  'use strict';

  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let lang = (() => { try { return localStorage.getItem('ck_lang') || 'es'; } catch (e) { return 'es'; } })();
  if (lang !== 'en') lang = 'es';

  // Same species and stages as js/mascota.js (0 egg, 1 baby, 2 big).
  const PETS = { dragon: ['🦎', '🐉'], dino: ['🦕', '🦖'], unicornio: ['🐴', '🦄'], gato: ['🐱', '🦁'], pajaro: ['🐣', '🦅'] };
  const STAGE = { es: ['Huevo', 'Bebé', 'Grande'], en: ['Egg', 'Baby', 'Big'] };

  const T = {
    es: {
      title: '🏆 Mi progreso', sub: 'Todo lo que has ganado en ChartKids, en un solo lugar.',
      stars: 'Estrellas esta semana', streak: 'Mejor racha', weeks: n => `${n} ${n === 1 ? 'semana' : 'semanas'}`, stickers: 'Stickers',
      games: 'Juegos ganados', chests: 'Cofres abiertos', stories: 'Historias guardadas',
      pets: '🐾 Mis mascotas', noPets: 'Crea un chart y elige una mascota: nace de un huevo y crece con tus estrellas.',
      achievements: '🎖️ Logros', unlocked: (a, b) => `${a} de ${b} desbloqueados`,
      album: '🏷️ Ver mi álbum', play: '🧠 Jugar', chart: '📋 Mi chart',
      empty: '¡Aún no hay nada! Crea tu primer chart, juega o abre un cofre para empezar a llenar esta página.',
      A: [['🌟', 'Primera estrella', 'Marca tu primera tarea'], ['⭐', 'Súper semana', '25 estrellas en un chart'], ['🏅', 'Semana perfecta', 'Un chart al 100%'],
          ['🔥', 'Racha de fuego', '3 semanas seguidas al 75%'], ['🐣', 'Adoptaste una mascota', 'Elige tu mascota'], ['🐉', 'Mascota grande', 'Haz crecer a tu mascota'],
          ['🎁', 'Primer cofre', 'Abre un cofre sorpresa'], ['🏷️', 'Coleccionista', 'Junta 10 stickers'], ['🏆', 'Álbum completo', 'Los 24 stickers'],
          ['🎮', 'Jugador', 'Gana 10 juegos'], ['🧩', 'Mente brillante', '3★ en nivel difícil'], ['📖', 'Cuentista', 'Guarda 3 historias']],
    },
    en: {
      title: '🏆 My progress', sub: 'Everything you have earned on ChartKids, in one place.',
      stars: 'Stars this week', streak: 'Best streak', weeks: n => `${n} ${n === 1 ? 'week' : 'weeks'}`, stickers: 'Stickers',
      games: 'Games won', chests: 'Chests opened', stories: 'Saved stories',
      pets: '🐾 My pets', noPets: 'Create a chart and pick a pet: it hatches from an egg and grows with your stars.',
      achievements: '🎖️ Achievements', unlocked: (a, b) => `${a} of ${b} unlocked`,
      album: '🏷️ See my album', play: '🧠 Play', chart: '📋 My chart',
      empty: 'Nothing here yet! Create your first chart, play a game or open a chest to start filling this page.',
      A: [['🌟', 'First star', 'Mark your first task'], ['⭐', 'Super week', '25 stars on one chart'], ['🏅', 'Perfect week', 'A chart at 100%'],
          ['🔥', 'On fire', '3 weeks in a row at 75%'], ['🐣', 'Pet adopted', 'Pick your pet'], ['🐉', 'Big pet', 'Help your pet grow'],
          ['🎁', 'First chest', 'Open a surprise chest'], ['🏷️', 'Collector', 'Collect 10 stickers'], ['🏆', 'Album complete', 'All 24 stickers'],
          ['🎮', 'Gamer', 'Win 10 games'], ['🧩', 'Bright mind', '3★ on hard level'], ['📖', 'Storyteller', 'Save 3 stories']],
    },
  };

  function data() {
    const charts = get('chartkids_charts', []);
    const pets = get('ck_pets', {});
    let starsWeek = 0, maxChart = 0, perfect = false, bestStreak = 0;
    for (const c of charts) {
      const d = c.chartData || {}, n = (c.checked || []).length, total = (d.tasks || []).length * (d.days || 7);
      starsWeek += n; maxChart = Math.max(maxChart, n);
      if (total && n >= total) perfect = true;
      const h = get(`chartkids_history_${c.id}`, []);
      if (h.some(w => w.percentage >= 100)) perfect = true;
      let s = 0; for (const w of h) { if (w.percentage >= 75) s++; else break; }
      if (total && n / total >= 0.75) s++;
      bestStreak = Math.max(bestStreak, s);
    }
    const petList = charts.filter(c => pets[c.id]).map(c => ({ kid: ((c.chartData || {}).childName || '').trim(), ...pets[c.id] }));
    const stickerIds = new Set(get('ck_stickers', []).map(s => s.id));
    const normal = (window.ckCofre && ckCofre.STICKERS) || [];
    const haveNormal = normal.length ? normal.filter(s => stickerIds.has(s[0])).length : stickerIds.size;
    const chests = Object.values(get('ck_cofres', {})).reduce((n, weeks) => n + Object.keys(weeks || {}).length, 0);
    const games = get('ck_juegos', { played: 0, stars: 0, best: {} });
    const stories = get('ck_historias', []).length;
    const hard3 = Object.entries(games.best || {}).some(([k, v]) => /-dificil$/.test(k) && v >= 3);
    const ach = [starsWeek > 0, maxChart >= 25, perfect, bestStreak >= 3, petList.length > 0, petList.some(p => p.stage >= 2),
      chests > 0, stickerIds.size >= 10, normal.length > 0 && haveNormal >= normal.length, (games.played || 0) >= 10, hard3, stories >= 3];
    return { charts, starsWeek, bestStreak, petList, haveNormal, ofNormal: normal.length || 24, chests, games, stories, ach };
  }

  function render() {
    const box = document.getElementById('ckProgreso');
    if (!box) return;
    const t = T[lang], d = data();
    const nothing = !d.charts.length && !d.games.played && !d.chests && !d.stories && !d.haveNormal;
    const stat = (ic, v, l) => `<div class="ckp-stat"><span class="ckp-ic">${ic}</span><b>${v}</b><small>${l}</small></div>`;
    const pets = d.petList.length ? d.petList.map(p => {
      const sp = PETS[p.species] || PETS.dragon, stage = Math.max(0, Math.min(2, p.stage || 0));
      return `<div class="ckp-pet"><span>${stage === 0 ? '🥚' : sp[stage - 1]}</span><b>${esc(p.name || '')}</b><small>${STAGE[lang][stage]}${p.kid ? ' · ' + esc(p.kid) : ''}</small></div>`;
    }).join('') : `<p class="ckp-note">${t.noPets}</p>`;
    const done = d.ach.filter(Boolean).length;
    box.innerHTML = `<section class="ckp">
      <div class="ckp-head"><h2>${t.title}</h2><p>${t.sub}</p></div>
      ${nothing ? `<p class="ckp-note">${t.empty}</p>` : ''}
      <div class="ckp-stats">
        ${stat('⭐', d.starsWeek, t.stars)}${stat('🔥', t.weeks(d.bestStreak), t.streak)}${stat('🏷️', `${d.haveNormal}/${d.ofNormal}`, t.stickers)}
        ${stat('🎮', d.games.played || 0, t.games)}${stat('🎁', d.chests, t.chests)}${stat('📖', d.stories, t.stories)}
      </div>
      <h3>${t.pets}</h3><div class="ckp-pets">${pets}</div>
      <h3>${t.achievements} <small>${t.unlocked(done, d.ach.length)}</small></h3>
      <div class="ckp-ach">${t.A.map(([ic, name, how], i) => `<div class="ckp-a${d.ach[i] ? ' on' : ''}"><span>${d.ach[i] ? ic : '🔒'}</span><b>${name}</b><small>${how}</small></div>`).join('')}</div>
      <div class="ckp-btns">${window.ckAlbum ? `<button type="button" class="ckp-btn" onclick="ckAlbum.open()">${t.album}</button>` : ''}
        <a class="ckp-btn" href="/juegos.html">${t.play}</a><a class="ckp-btn ckp-sec" href="/index.html">${t.chart}</a></div>
    </section>`;
  }

  // ck-nav.js calls setLang() when ES/EN is pressed; keep the page's own handler working.
  const prev = window.setLang;
  window.setLang = l => { lang = l === 'en' ? 'en' : 'es'; if (typeof prev === 'function') prev(l); render(); };
  window.ckProgreso = { render, data };

  const css = document.createElement('style');
  css.textContent = `
  .ckp{margin:18px 0 28px;padding:20px;border-radius:24px;background:linear-gradient(135deg,rgba(124,58,237,.14),rgba(236,72,153,.1));border:1px solid rgba(124,58,237,.35);font-family:'Nunito',sans-serif;color:#f1f5f9}
  .ckp-head h2{font-family:'Fredoka One',cursive;font-size:1.6rem;margin:0}
  .ckp-head p{margin:4px 0 14px;color:#94a3b8;font-weight:700}
  .ckp h3{font-size:1.05rem;margin:20px 0 10px}
  .ckp h3 small{color:#a78bfa;font-weight:800;font-size:.8rem;margin-left:6px}
  .ckp-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
  .ckp-stat{display:flex;flex-direction:column;align-items:center;gap:2px;padding:14px 8px;border-radius:18px;background:#1a1a2e;border:1px solid #2e2e50;text-align:center}
  .ckp-ic{font-size:1.6rem}
  .ckp-stat b{font-size:1.35rem;font-family:'Fredoka One',cursive}
  .ckp-stat small{color:#94a3b8;font-weight:700;font-size:.78rem}
  .ckp-pets{display:flex;flex-wrap:wrap;gap:10px}
  .ckp-pet{display:flex;flex-direction:column;align-items:center;min-width:110px;padding:12px;border-radius:18px;background:#fffaf3;color:#4c1d95}
  .ckp-pet span{font-size:2.6rem;line-height:1.1}
  .ckp-pet small{color:#7c6f99;font-weight:700;font-size:.75rem}
  .ckp-ach{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
  .ckp-a{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:12px 8px;border-radius:16px;background:#1a1a2e;border:1px dashed #2e2e50;opacity:.6}
  .ckp-a.on{opacity:1;border:1px solid rgba(245,158,11,.6);background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(236,72,153,.1))}
  .ckp-a span{font-size:1.8rem}
  .ckp-a b{font-size:.9rem}
  .ckp-a small{color:#94a3b8;font-weight:700;font-size:.74rem}
  .ckp-note{color:#cbd5e1;font-weight:700}
  .ckp-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:18px}
  .ckp-btn{padding:10px 18px;border-radius:50px;border:none;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font:900 .92rem 'Nunito',sans-serif;cursor:pointer;text-decoration:none}
  .ckp-sec{background:#232340;border:1px solid #2e2e50}`;
  document.head.appendChild(css);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
