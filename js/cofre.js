// js/cofre.js — "Cofre sorpresa": once a week, when the chart reaches 60% of its stars,
// a treasure chest unlocks. The child taps it 3 times to open it and always gets a
// collectible sticker (the album reads 'ck_stickers') plus one extra: a surprise
// printable sheet, a family coupon or a certificate. No AI; the only network use is
// reading the printable lists in /data/printables/*.json.
//
// Storage (localStorage):
//   ck_cofres   = { "<chartId>": { "<week#>": { date, sticker, extra } } }   (week# = archived weeks)
//   ck_stickers = [ { id, date } ]  — every sticker won, in order
// index.html calls ckCofre.update({ id, count, total }) after each progress change.
(function () {
  'use strict';

  const UNLOCK_AT = 60; // % of the week's stars
  const STICKERS = [
    ['dino-astronauta', '🦖', 'Dino Astronauta', 'Astronaut Dino'], ['unicornio-arcoiris', '🦄', 'Unicornio Arcoíris', 'Rainbow Unicorn'],
    ['gato-ninja', '🐱', 'Gato Ninja', 'Ninja Cat'], ['perro-bombero', '🐶', 'Perro Bombero', 'Firefighter Pup'],
    ['pulpo-chef', '🐙', 'Pulpo Chef', 'Chef Octopus'], ['robot-amigo', '🤖', 'Robot Amigo', 'Robot Buddy'],
    ['dragon-dormilon', '🐉', 'Dragón Dormilón', 'Sleepy Dragon'], ['tortuga-veloz', '🐢', 'Tortuga Veloz', 'Speedy Turtle'],
    ['buho-sabio', '🦉', 'Búho Sabio', 'Wise Owl'], ['leon-valiente', '🦁', 'León Valiente', 'Brave Lion'],
    ['panda-feliz', '🐼', 'Panda Feliz', 'Happy Panda'], ['ballena-cantante', '🐳', 'Ballena Cantante', 'Singing Whale'],
    ['cohete-estelar', '🚀', 'Cohete Estelar', 'Star Rocket'], ['arcoiris-magico', '🌈', 'Arcoíris Mágico', 'Magic Rainbow'],
    ['estrella-fugaz', '🌠', 'Estrella Fugaz', 'Shooting Star'], ['corona-real', '👑', 'Corona Real', 'Royal Crown'],
    ['pizza-feliz', '🍕', 'Pizza Feliz', 'Happy Pizza'], ['helado-doble', '🍦', 'Helado Doble', 'Double Ice Cream'],
    ['mariposa-brillante', '🦋', 'Mariposa Brillante', 'Shiny Butterfly'], ['zorro-astuto', '🦊', 'Zorro Astuto', 'Clever Fox'],
    ['pinguino-patinador', '🐧', 'Pingüino Patinador', 'Skating Penguin'], ['abeja-trabajadora', '🐝', 'Abeja Trabajadora', 'Busy Bee'],
    ['koala-abrazos', '🐨', 'Koala Abrazos', 'Hugging Koala'], ['trofeo-campeon', '🏆', 'Trofeo de Campeón', "Champion's Trophy"],
  ];
  const COUPONS = {
    es: ['Vale por elegir la cena 🍝', 'Vale por 15 minutos extra de juego 🎮', 'Vale por un baile en familia 💃', 'Vale por un cuento extra antes de dormir 📖',
         'Vale por elegir la película del fin de semana 🎬', 'Vale por un paseo al parque 🌳', 'Vale por hornear galletas juntos 🍪', 'Vale por una guerra de almohadas 🛏️'],
    en: ['Coupon: you choose dinner 🍝', 'Coupon: 15 extra minutes of play 🎮', 'Coupon: a family dance party 💃', 'Coupon: one extra bedtime story 📖',
         'Coupon: you pick the weekend movie 🎬', 'Coupon: a trip to the park 🌳', 'Coupon: bake cookies together 🍪', 'Coupon: a pillow fight 🛏️'],
  };
  const SHEET_CATS = ['laberintos', 'puntos', 'busca', 'matematicas', 'escritura', 'stem'];

  let ctx = null;
  const curLang = () => {
    let l = 'es';
    try { l = (typeof lang !== 'undefined' && lang) || document.documentElement.lang || 'es'; } catch (e) {}
    return l === 'en' ? 'en' : 'es';
  };
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function week() {
    try { return ctx && ctx.id && typeof getChartHistory === 'function' ? getChartHistory(ctx.id).length : 0; } catch (e) { return 0; }
  }
  function opened() { const all = get('ck_cofres', {}); return (ctx && ctx.id && all[ctx.id] && all[ctx.id][week()]) || null; }
  function state() {
    if (!ctx || !ctx.id || !ctx.total) return { s: 'none' };
    if (opened()) return { s: 'opened' };
    const pct = Math.round((ctx.count / ctx.total) * 100);
    if (pct >= UNLOCK_AT) return { s: 'ready' };
    return { s: 'locked', missing: Math.max(1, Math.ceil((UNLOCK_AT / 100) * ctx.total) - ctx.count) };
  }

  function label(st) {
    const es = curLang() === 'es';
    if (st.s === 'ready') return es ? '🎁 ¡Abre tu cofre!' : '🎁 Open your chest!';
    if (st.s === 'opened') return es ? '✅ Cofre abierto' : '✅ Chest opened';
    if (st.s === 'locked') return es ? `🔒 Cofre: faltan ${st.missing}⭐` : `🔒 Chest: ${st.missing}⭐ to go`;
    return '';
  }
  function render() {
    const st = state();
    const btn = document.getElementById('btnCofre');
    if (btn) {
      btn.style.display = st.s === 'none' ? 'none' : '';
      btn.textContent = label(st);
      btn.classList.toggle('ckcf-ready', st.s === 'ready');
    }
    document.querySelectorAll('.ckcf-kid').forEach(b => {
      b.classList.toggle('ckcf-ready', st.s === 'ready');
      b.title = label(st);
    });
  }
  function update(c) {
    const was = state().s;
    ctx = c;
    const now = state().s;
    render();
    // Unlocked by the star just marked: tell the child.
    if (was === 'locked' && now === 'ready' && window.ckFx) {
      const es = curLang() === 'es';
      setTimeout(() => ckFx.banner('🎁', es ? '¡Desbloqueaste el cofre!' : 'Chest unlocked!', es ? 'Tócalo para abrirlo' : 'Tap it to open it'), 900);
    }
  }

  // ── prizes ──
  async function listPrize(cat, type) {
    try {
      const data = await (await fetch(`/data/printables/${cat}.json`)).json();
      const it = pick(data.items);
      return { type, url: `/${data.dir}/${it.slug}/`, es: it.title_es, en: it.title_en };
    } catch (e) { return null; }
  }
  const coupon = () => ({ type: 'cupon', i: Math.floor(Math.random() * COUPONS.es.length) });
  async function makePrize() {
    const have = new Set(get('ck_stickers', []).map(s => s.id));
    const fresh = STICKERS.filter(s => !have.has(s[0]));
    const sticker = (fresh.length ? pick(fresh) : pick(STICKERS))[0];
    const r = Math.random();
    const extra = r < 0.4 ? await listPrize(pick(SHEET_CATS), 'ficha')
      : r < 0.85 ? coupon() : await listPrize('certificados', 'certificado');
    return { sticker, extra: extra || coupon() };
  }

  // ── chest window ──
  function modal(html) {
    document.getElementById('ckcf-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'ckcf-modal';
    m.innerHTML = `<div class="ckcf-box" role="dialog" aria-modal="true"><button type="button" class="ckcf-x" aria-label="×">×</button>${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('.ckcf-x')) m.remove(); });
    document.body.appendChild(m);
    return m;
  }
  function prizeHTML(p) {
    const es = curLang() === 'es';
    const st = STICKERS.find(s => s[0] === p.sticker) || STICKERS[0];
    const x = p.extra || {};
    const view = es ? 'Ver e imprimir' : 'View & print';
    let extra = '';
    if (x.type === 'ficha' || x.type === 'certificado') {
      extra = `<div class="ckcf-prize"><div class="ckcf-pe">${x.type === 'ficha' ? '🖨️' : '🏆'}</div><div>
        <b>${x.type === 'ficha' ? (es ? 'Ficha sorpresa' : 'Surprise sheet') : (es ? 'Certificado' : 'Certificate')}</b>
        <span>${esc(es ? x.es : x.en)}</span><a class="ckcf-btn" href="${esc(x.url)}" target="_blank" rel="noopener">${view}</a></div></div>`;
    } else if (x.type === 'cupon') {
      extra = `<div class="ckcf-prize ckcf-coupon"><div class="ckcf-pe">🎟️</div><div><b>${es ? 'Vale familiar' : 'Family coupon'}</b>
        <span>${esc(COUPONS[es ? 'es' : 'en'][x.i] || COUPONS.es[0])}</span><small>${es ? 'Enséñaselo a mamá o papá 😉' : 'Show it to mom or dad 😉'}</small></div></div>`;
    }
    const n = get('ck_stickers', []).length;
    return `<div class="ckcf-prize ckcf-sticker"><div class="ckcf-pe ckcf-big">${st[1]}</div><div><b>${es ? '¡Sticker nuevo!' : 'New sticker!'}</b>
      <span>${esc(es ? st[2] : st[3])}</span><small>${es ? `Llevas ${n} de ${STICKERS.length} stickers` : `You have ${n} of ${STICKERS.length} stickers`}</small></div></div>${extra}`;
  }

  function open() {
    const st = state();
    const es = curLang() === 'es';
    if (st.s === 'none') return;
    if (st.s === 'opened') {
      modal(`<div class="ckcf-title">${es ? 'Tu cofre de esta semana' : "This week's chest"}</div>${prizeHTML(opened())}
        <div class="ckcf-hint">${es ? 'Completa la próxima semana para ganar otro 🎁' : 'Finish next week to win another 🎁'}</div>`);
      return;
    }
    if (st.s === 'locked') {
      modal(`<div class="ckcf-chest ckcf-locked">🎁</div><div class="ckcf-title">${es ? 'Cofre sorpresa' : 'Surprise chest'}</div>
        <div class="ckcf-hint">${es ? `Gana ${st.missing} ⭐ más esta semana para abrirlo` : `Earn ${st.missing} more ⭐ this week to open it`}</div>`);
      return;
    }
    let taps = 0;
    const m = modal(`<div class="ckcf-title">${es ? '¡Tócalo 3 veces para abrirlo!' : 'Tap it 3 times to open it!'}</div>
      <button type="button" class="ckcf-chest" aria-label="${es ? 'Abrir cofre' : 'Open chest'}">🎁</button>
      <div class="ckcf-dots"><i></i><i></i><i></i></div><div class="ckcf-result"></div>`);
    const chest = m.querySelector('.ckcf-chest');
    const prizeP = makePrize(); // fetch while the child taps
    chest.addEventListener('click', async () => {
      if (taps >= 3) return;
      taps++;
      m.querySelectorAll('.ckcf-dots i').forEach((d, i) => d.classList.toggle('on', i < taps));
      chest.classList.remove('ckcf-shake'); void chest.offsetWidth; chest.classList.add('ckcf-shake');
      try { if (navigator.vibrate) navigator.vibrate(30 * taps); } catch (e) {}
      if (taps < 3) return;
      const prize = await prizeP;
      // Save first, so closing the window can't lose the prize.
      const today = new Date().toISOString().slice(0, 10);
      const all = get('ck_cofres', {});
      all[ctx.id] = all[ctx.id] || {};
      all[ctx.id][week()] = { date: today, ...prize };
      set('ck_cofres', all);
      set('ck_stickers', [...get('ck_stickers', []), { id: prize.sticker, date: today }]);
      chest.classList.add('ckcf-open');
      chest.textContent = '✨';
      if (window.ckFx) ckFx.rain(90);
      if (typeof playWinSound === 'function') playWinSound();
      m.querySelector('.ckcf-title').textContent = es ? '¡Sorpresa!' : 'Surprise!';
      m.querySelector('.ckcf-dots').remove();
      m.querySelector('.ckcf-result').innerHTML = prizeHTML(prize);
      render();
    });
  }

  const kidButton = () => `<button type="button" class="ckcf-kid" onclick="ckCofre.open()" aria-label="${curLang() === 'es' ? 'Cofre sorpresa' : 'Surprise chest'}">🎁</button>`;

  window.ckCofre = { update, open, render, kidButton, STICKERS };

  const css = document.createElement('style');
  css.textContent = `
  #btnCofre.ckcf-ready,.ckcf-kid.ckcf-ready{animation:ckcfGlow 1.2s ease-in-out infinite alternate}
  @keyframes ckcfGlow{from{box-shadow:0 0 0 0 rgba(251,191,36,0)}to{box-shadow:0 0 18px 4px rgba(251,191,36,.75)}}
  .ckcf-kid{position:fixed;top:14px;left:118px;z-index:10000;width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,.85);font-size:1.3rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}
  #ckcf-modal{position:fixed;inset:0;z-index:10010;background:rgba(10,8,25,.82);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Nunito',sans-serif}
  .ckcf-box{position:relative;background:linear-gradient(180deg,#fff7e6,#fdf2ff);color:#3b2a5a;border-radius:26px;padding:24px 20px 20px;width:min(440px,100%);max-height:calc(100vh - 32px);overflow:auto;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.45)}
  .ckcf-x{position:absolute;top:8px;right:12px;background:none;border:none;color:#9ca3af;font-size:1.8rem;cursor:pointer;line-height:1}
  .ckcf-title{font-family:'Fredoka One',cursive;font-size:1.45rem;color:#6d28d9;margin:4px 0 10px}
  .ckcf-chest{display:block;margin:6px auto;font-size:7rem;line-height:1.1;background:none;border:none;cursor:pointer;filter:drop-shadow(0 10px 18px rgba(124,58,237,.35));transition:transform .2s}
  .ckcf-locked{filter:grayscale(.8) opacity(.6);cursor:default}
  .ckcf-shake{animation:ckcfShake .45s ease}
  @keyframes ckcfShake{0%,100%{transform:rotate(0) scale(1)}20%{transform:rotate(-12deg) scale(1.08)}40%{transform:rotate(10deg) scale(1.12)}60%{transform:rotate(-8deg) scale(1.1)}80%{transform:rotate(6deg) scale(1.05)}}
  .ckcf-open{animation:ckcfPop .7s cubic-bezier(.2,1.6,.4,1)}
  @keyframes ckcfPop{0%{transform:scale(.4)}100%{transform:scale(1)}}
  .ckcf-dots{display:flex;gap:10px;justify-content:center;margin:6px 0 4px}
  .ckcf-dots i{width:14px;height:14px;border-radius:50%;background:#e9d5ff}
  .ckcf-dots i.on{background:#f59e0b}
  .ckcf-prize{display:flex;gap:12px;align-items:center;text-align:left;background:#fff;border:2px solid #ede9fe;border-radius:18px;padding:12px 14px;margin:10px 0;animation:ckcfPop .6s ease both}
  .ckcf-prize b{display:block;color:#4c1d95;font-size:1.02rem}
  .ckcf-prize span{display:block;font-weight:800}
  .ckcf-prize small{display:block;color:#7c6f99;font-weight:700;margin-top:2px}
  .ckcf-pe{font-size:2.4rem;flex-shrink:0}
  .ckcf-big{font-size:3.2rem}
  .ckcf-sticker{border-color:#fde68a;background:linear-gradient(135deg,#fffbeb,#fff)}
  .ckcf-coupon{border-style:dashed;border-color:#f472b6}
  .ckcf-btn{display:inline-block;margin-top:6px;padding:7px 14px;border-radius:50px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:800;font-size:.85rem;text-decoration:none}
  .ckcf-hint{font-weight:800;color:#7c6f99;margin-top:8px}
  @media (prefers-reduced-motion:reduce){.ckcf-shake,.ckcf-open,.ckcf-prize,#btnCofre.ckcf-ready,.ckcf-kid.ckcf-ready{animation:none}}`;
  document.head.appendChild(css);
})();
