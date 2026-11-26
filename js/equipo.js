// js/equipo.js — "Equipo familiar": when the family has 2+ charts (siblings), one shared
// meter adds up everyone's stars this week toward a team goal with a family prize
// ("Noche de pizza en familia 🍕"). Cooperative, not a race: it shows what each child
// added, never a ranking. Reaching the goal is celebrated once per week.
// Storage: localStorage ck_equipo = { prize, target (number|null = automatic), celebrated: "YYYY-Www" }.
// Reads the saved charts (getAllCharts) and the open chart's live checks from index.html.
(function () {
  'use strict';

  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const curLang = () => {
    let l = 'es';
    try { l = (typeof lang !== 'undefined' && lang) || document.documentElement.lang || 'es'; } catch (e) {}
    return l === 'en' ? 'en' : 'es';
  };
  const DEFAULT_PRIZE = { es: 'Noche de pizza en familia 🍕', en: 'Family pizza night 🍕' };

  function isoWeek(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
    return `${y}-W${String(w).padStart(2, '0')}`;
  }

  // Clearly different colours, so each child's part of the bar can be told apart.
  const PALETTE = ['#a855f7', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#ef4444', '#3b82f6', '#eab308'];
  const hue = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1;
    const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };

  // Each child's stars this week (the open chart uses its live checks).
  function members() {
    let charts = [];
    try { charts = getAllCharts(); } catch (e) { return []; }
    const used = [];
    return charts.map((c, i) => {
      const d = c.chartData || {};
      const total = (d.tasks || []).length * (d.days || 7);
      let count = (c.checked || []).length;
      try { if (c.id === currentChartId && typeof checked !== 'undefined') count = checked.size; } catch (e) {}
      const full = (d.childName || d.title || '?').trim();
      let color = '#7c3aed';
      try { color = avatarColorFromName(full); } catch (e) {}
      // Too close to a sibling's colour → take the next palette colour that isn't.
      const close = x => used.some(u => Math.min(Math.abs(hue(u) - hue(x)), 360 - Math.abs(hue(u) - hue(x))) < 40);
      if (close(color)) color = PALETTE.find(p => !close(p)) || PALETTE[i % PALETTE.length];
      used.push(color);
      return { id: c.id, name: full.split(/\s+/)[0] || '?', count, total, color };
    });
  }

  function state() {
    const m = members();
    const cfg = get('ck_equipo', {});
    const sum = m.reduce((s, x) => s + x.count, 0);
    const all = m.reduce((s, x) => s + x.total, 0);
    const target = Math.max(1, Math.min(all || 1, cfg.target || Math.ceil(all * 0.6)));
    return { m, sum, all, target, prize: cfg.prize || DEFAULT_PRIZE[curLang()], cfg };
  }

  function render() {
    const box = document.getElementById('ckTeam');
    if (!box) return;
    const s = state();
    if (s.m.length < 2) { box.innerHTML = ''; return; }
    const es = curLang() === 'es';
    const done = s.sum >= s.target;
    const left = Math.max(0, s.target - s.sum);
    const segs = s.m.filter(x => x.count).map(x =>
      `<div class="ckt-seg" style="width:${Math.min(100, (x.count / s.target) * 100)}%;background:${x.color}" title="${esc(x.name)}: ${x.count}⭐"></div>`).join('');
    const legend = s.m.map(x => `<span class="ckt-kid"><i style="background:${x.color}"></i>${esc(x.name)} <b>${x.count}⭐</b></span>`).join('');
    box.innerHTML = `<div class="ckt${done ? ' ckt-done' : ''}">
      <div class="ckt-head"><b>🤝 ${es ? 'Equipo familiar' : 'Family team'}</b>
        <button type="button" class="ckt-edit" title="${es ? 'Cambiar premio y meta' : 'Change prize and goal'}">✏️</button></div>
      <div class="ckt-prize">🎯 ${esc(s.prize)}</div>
      <div class="ckt-bar">${segs}</div>
      <div class="ckt-meta">${done ? (es ? '🎉 ¡Lo lograron juntos!' : '🎉 You did it together!')
        : (es ? `${s.sum} de ${s.target} ⭐ · faltan ${left} entre todos` : `${s.sum} of ${s.target} ⭐ · ${left} to go together`)}</div>
      <div class="ckt-legend">${legend}</div>
    </div>`;
    maybeCelebrate(s);
  }

  function maybeCelebrate(s) {
    const wk = isoWeek();
    if (s.sum < s.target || s.cfg.celebrated === wk) return;
    set('ck_equipo', { ...s.cfg, celebrated: wk });
    const es = curLang() === 'es';
    if (window.ckFx) {
      ckFx.rain(100);
      ckFx.banner('🤝', es ? '¡El equipo lo logró!' : 'The team did it!', es ? `Premio: ${s.prize}` : `Prize: ${s.prize}`);
    }
    if (typeof playWinSound === 'function') playWinSound();
  }

  function edit() {
    const s = state(), es = curLang() === 'es';
    const prize = prompt(es ? '¿Cuál es el premio del equipo esta semana?' : "What's the team prize this week?", s.prize);
    if (prize === null) return;
    const t = prompt(es ? `¿Cuántas estrellas deben juntar entre todos? (máximo ${s.all})` : `How many stars together? (max ${s.all})`, String(s.target));
    if (t === null) return;
    const n = Math.round(Number(t));
    set('ck_equipo', { ...s.cfg, prize: prize.trim().slice(0, 60) || s.prize, target: n > 0 ? Math.min(n, s.all) : null });
    render();
  }

  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#ckTeam .ckt-edit')) edit(); });

  window.ckTeam = { render, state };

  const css = document.createElement('style');
  css.textContent = `
  #ckTeam:empty{display:none}
  .ckt{margin:0 0 14px;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,rgba(6,182,212,.12),rgba(124,58,237,.12));border:1px solid rgba(6,182,212,.35);font-family:'Nunito',sans-serif;color:#f1f5f9}
  .ckt-done{border-color:rgba(245,158,11,.7);background:linear-gradient(135deg,rgba(245,158,11,.16),rgba(236,72,153,.14))}
  .ckt-head{display:flex;align-items:center;justify-content:space-between}
  .ckt-head b{font-size:1rem}
  .ckt-edit{background:none;border:none;cursor:pointer;font-size:1rem}
  .ckt-prize{font-weight:800;font-size:.9rem;color:#fde68a;margin:2px 0 8px}
  .ckt-bar{display:flex;height:16px;border-radius:16px;background:rgba(255,255,255,.1);overflow:hidden}
  .ckt-seg{height:100%;transition:width .5s}
  .ckt-meta{font-weight:800;font-size:.85rem;margin-top:6px;color:#cbd5e1}
  .ckt-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
  .ckt-kid{display:inline-flex;align-items:center;gap:5px;font-weight:700;font-size:.82rem;color:#e2e8f0}
  .ckt-kid i{width:10px;height:10px;border-radius:50%;display:inline-block}`;
  document.head.appendChild(css);
})();
