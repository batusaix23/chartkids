// js/mascota.js — the chart's pet. It hatches from a magic egg and grows with the
// stars the child earns (egg → baby → big, crown at 100%). If no task is marked for a
// while it gets sad. One pet per chart, kept in localStorage 'ck_pets' by chart id:
//   { "<chartId>": { species, name, born, lastFed, stage } }   (times in ms)
// No AI and no network: everything runs in the browser.
//
// index.html calls:
//   ckPet.update({ id, count, total })   after every progress change (renders all slots)
//   ckPet.fed()                           when a task is marked (pet celebrates)
// and places <div class="ckpet-slot"></div> in the chart and in Modo Niño.
(function () {
  'use strict';

  const SPECIES = {
    dragon:    { es: 'Dragón',    en: 'Dragon',  baby: '🦎', big: '🐉', name: 'Chispa' },
    dino:      { es: 'Dino',      en: 'Dino',    baby: '🦕', big: '🦖', name: 'Rex' },
    unicornio: { es: 'Unicornio', en: 'Unicorn', baby: '🐴', big: '🦄', name: 'Luna' },
    gato:      { es: 'Gatito',    en: 'Kitty',   baby: '🐱', big: '🦁', name: 'Michi' },
    pajaro:    { es: 'Pajarito',  en: 'Birdie',  baby: '🐣', big: '🦅', name: 'Pío' },
  };
  // Stage by % of the chart's stars: 0 egg, 1 baby, 2 big.
  const BABY_AT = 15, BIG_AT = 60;
  const SAD_AFTER_MS = 36 * 3600 * 1000;
  const KEY = 'ck_pets';

  const T = {
    es: {
      pick: '¡Elige tu mascota!', pickSub: 'Nace de un huevo mágico y crece con cada estrella ⭐',
      egg: 'Huevo mágico', baby: s => `${s} bebé`, big: s => `${s} grande`,
      mEgg: '¡Algo se mueve adentro! Gana estrellas para que nazca.',
      mBaby: '¡Hola! Cada estrella me hace más fuerte.',
      mBig: '¡Mira qué grande estoy gracias a ti!',
      mDone: '¡Lo logramos! ¡Eres mi héroe! 🏆',
      mSad: '¡Te extraño! Marca una tarea para alegrarme.',
      next: n => `⭐ ${n} ${n === 1 ? 'estrella' : 'estrellas'} más para crecer`,
      fed: ['¡Ñam! ¡Gracias!', '¡Otra estrella! ¡Yupi!', '¡Me siento más fuerte!', '¡Eres genial!'],
      poke: ['¡Jiji, cosquillas!', '¡Vamos por otra estrella!', '¡Choca esos cinco! ✋', '¡Te quiero mucho!'],
      hello: '¡Cuídame mucho! 💜', grew: '¡Crecí! 🎉', hatched: '¡Nací! ¡Hola! 🎉',
      rename: '¿Cómo se llama tu mascota?', change: 'Cambiar',
    },
    en: {
      pick: 'Choose your pet!', pickSub: 'It hatches from a magic egg and grows with every star ⭐',
      egg: 'Magic egg', baby: s => `Baby ${s.toLowerCase()}`, big: s => `Big ${s.toLowerCase()}`,
      mEgg: 'Something is moving inside! Earn stars to hatch it.',
      mBaby: 'Hi! Every star makes me stronger.',
      mBig: 'Look how big I am thanks to you!',
      mDone: 'We did it! You are my hero! 🏆',
      mSad: 'I miss you! Mark a task to cheer me up.',
      next: n => `⭐ ${n} more ${n === 1 ? 'star' : 'stars'} to grow`,
      fed: ['Yum! Thank you!', 'Another star! Yay!', 'I feel stronger!', 'You are awesome!'],
      poke: ['Hehe, that tickles!', 'Let’s get another star!', 'High five! ✋', 'I love you!'],
      hello: 'Take good care of me! 💜', grew: 'I grew! 🎉', hatched: 'I hatched! Hi! 🎉',
      rename: 'What is your pet’s name?', change: 'Change',
    },
  };

  let ctx = null;          // { id, count, total } from the last update
  let pendingSay = null;   // speech bubble for the next render
  let pendingAnim = '';    // animation class for the next render

  const curLang = () => {
    let l = 'es';
    try { l = (typeof lang !== 'undefined' && lang) || document.documentElement.lang || 'es'; } catch (e) {}
    return l === 'en' ? 'en' : 'es';
  };
  const L = () => T[curLang()];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function loadAll() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveAll(all) { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} }
  function getPet() { return ctx && ctx.id ? loadAll()[ctx.id] || null : null; }
  function setPet(p) { if (!ctx || !ctx.id) return; const all = loadAll(); all[ctx.id] = p; saveAll(all); }

  function pctOf(c) { return c && c.total > 0 ? Math.round((c.count / c.total) * 100) : 0; }
  function stageOf(pct) { return pct >= BIG_AT ? 2 : pct >= BABY_AT ? 1 : 0; }
  function starsToNext(c, stage) {
    if (stage >= 2 || !c || !c.total) return 0;
    const need = Math.ceil(((stage === 0 ? BABY_AT : BIG_AT) / 100) * c.total);
    return Math.max(1, need - c.count);
  }

  function pickerHTML() {
    const t = L(), lg = curLang();
    const btns = Object.entries(SPECIES).map(([k, s]) =>
      `<button type="button" class="ckpet-choice" onclick="ckPet.choose('${k}')"><span>${s.big}</span>${esc(s[lg])}</button>`).join('');
    return `<div class="ckpet ckpet-picker"><div class="ckpet-pick-title">🥚 ${t.pick}</div>
      <div class="ckpet-pick-sub">${t.pickSub}</div><div class="ckpet-choices">${btns}</div></div>`;
  }

  function petHTML(p) {
    const t = L(), lg = curLang();
    const sp = SPECIES[p.species] || SPECIES.dragon;
    const pct = pctOf(ctx);
    const stage = stageOf(pct);
    const done = pct >= 100;
    const sad = !done && Date.now() - (p.lastFed || p.born || Date.now()) > SAD_AFTER_MS;
    const emoji = stage === 0 ? '🥚' : stage === 1 ? sp.baby : sp.big;
    const title = stage === 0 ? t.egg : stage === 1 ? t.baby(sp[lg]) : t.big(sp[lg]);
    const msg = sad ? t.mSad : done ? t.mDone : [t.mEgg, t.mBaby, t.mBig][stage];
    const next = starsToNext(ctx, stage);
    const cls = ['ckpet', 'ckpet-s' + stage, sad ? 'ckpet-sad' : '', done ? 'ckpet-done' : '',
      stage === 0 && ctx.count > 0 ? 'ckpet-crack' : '', pendingAnim].filter(Boolean).join(' ');
    return `<div class="${cls}">
      <button type="button" class="ckpet-body" onclick="ckPet.poke()" aria-label="${esc(p.name)}">
        ${done ? '<span class="ckpet-crown">👑</span>' : ''}
        <span class="ckpet-emoji">${emoji}</span>${sad ? '<span class="ckpet-tear">💧</span>' : ''}
        ${pendingSay ? `<span class="ckpet-bubble">${esc(pendingSay)}</span>` : ''}
      </button>
      <div class="ckpet-info">
        <div class="ckpet-name"><button type="button" class="ckpet-rename" onclick="ckPet.rename()">${esc(p.name)} ✏️</button>
          <span class="ckpet-kind">· ${esc(title)}</span></div>
        <div class="ckpet-msg">${esc(msg)}</div>
        ${next ? `<div class="ckpet-next">${t.next(next)}</div>` : ''}
        <div class="ckpet-bar"><div style="width:${Math.min(pct, 100)}%"></div></div>
      </div>
      <button type="button" class="ckpet-change" onclick="ckPet.change()">${t.change}</button>
    </div>`;
  }

  function render() {
    const slots = document.querySelectorAll('.ckpet-slot');
    if (!slots.length) return;
    const p = getPet();
    const html = !ctx || !ctx.id || !ctx.total ? '' : p ? petHTML(p) : pickerHTML();
    slots.forEach(s => { s.innerHTML = html; });
    pendingSay = null;
    pendingAnim = '';
  }

  function update(c) {
    ctx = c;
    const p = getPet();
    if (p) {
      const stage = stageOf(pctOf(c));
      if (stage > (p.stage || 0)) {
        pendingSay = (p.stage || 0) === 0 ? L().hatched : L().grew;
        pendingAnim = 'ckpet-grow';
      }
      if (stage !== p.stage) { p.stage = stage; setPet(p); }
    }
    render();
  }

  window.ckPet = {
    update,
    fed() {
      const p = getPet();
      if (!p) return;
      p.lastFed = Date.now();
      setPet(p);
      pendingSay = pick(L().fed);
      pendingAnim = 'ckpet-jump';
    },
    poke() {
      pendingSay = pick(L().poke);
      pendingAnim = 'ckpet-jump';
      render();
    },
    choose(species) {
      if (!SPECIES[species] || !ctx || !ctx.id) return;
      setPet({ species, name: SPECIES[species].name, born: Date.now(), lastFed: Date.now(), stage: stageOf(pctOf(ctx)) });
      pendingSay = L().hello;
      pendingAnim = 'ckpet-grow';
      render();
    },
    change() {
      if (!ctx || !ctx.id) return;
      const all = loadAll();
      delete all[ctx.id];
      saveAll(all);
      render();
    },
    rename() {
      const p = getPet();
      if (!p) return;
      const n = prompt(L().rename, p.name);
      if (n && n.trim()) { p.name = n.trim().slice(0, 20); setPet(p); render(); }
    },
    refresh: render,
    // For the weekly summary image (js/resumen.js): what the pet looks like now.
    info() {
      const p = getPet();
      if (!p) return null;
      const sp = SPECIES[p.species] || SPECIES.dragon, t = L(), lg = curLang();
      const stage = stageOf(pctOf(ctx));
      return { name: p.name, emoji: stage === 0 ? '🥚' : stage === 1 ? sp.baby : sp.big,
        kind: stage === 0 ? t.egg : stage === 1 ? t.baby(sp[lg]) : t.big(sp[lg]) };
    },
  };

  const css = document.createElement('style');
  css.textContent = `
  .ckpet-slot:empty{display:none}
  .ckpet-slot{margin:14px 0 4px}
  .ckpet{position:relative;display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:18px;
    background:rgba(255,255,255,.75);border:2px solid rgba(124,58,237,.25);color:#2d2d2d;font-family:'Nunito',sans-serif;
    box-shadow:0 4px 14px rgba(0,0,0,.08);text-align:left}
  .ckpet-body{position:relative;flex-shrink:0;width:84px;height:84px;border:none;border-radius:50%;cursor:pointer;
    background:radial-gradient(circle at 50% 40%,#fff 0%,#ede9fe 70%);display:flex;align-items:center;justify-content:center;
    box-shadow:inset 0 -4px 0 rgba(124,58,237,.15);padding:0}
  .ckpet-emoji{font-size:2.6rem;line-height:1;display:inline-block;animation:ckpetIdle 2.6s ease-in-out infinite}
  .ckpet-s1 .ckpet-emoji{font-size:3rem}
  .ckpet-s2 .ckpet-emoji{font-size:3.5rem}
  .ckpet-s0 .ckpet-emoji{animation:ckpetWobble 2.2s ease-in-out infinite}
  .ckpet-crack .ckpet-emoji{animation:ckpetWobble .9s ease-in-out infinite}
  .ckpet-crown{position:absolute;top:-14px;font-size:1.5rem;animation:ckpetIdle 2s ease-in-out infinite}
  .ckpet-tear{position:absolute;right:14px;top:30px;font-size:1rem;animation:ckpetTear 1.6s ease-in infinite}
  .ckpet-sad .ckpet-emoji{filter:grayscale(.6);animation:none;transform:translateY(4px) rotate(-6deg)}
  .ckpet-sad{border-color:rgba(100,116,139,.35)}
  .ckpet-done{border-color:rgba(245,158,11,.6);background:linear-gradient(135deg,rgba(255,251,235,.94),rgba(254,243,199,.94))}
  .ckpet-bubble{position:absolute;left:70px;top:-12px;z-index:3;white-space:nowrap;background:#7c3aed;color:#fff;font-weight:800;
    font-size:.8rem;padding:5px 10px;border-radius:12px 12px 12px 2px;animation:ckpetBubble 2.6s ease forwards;pointer-events:none}
  .ckpet-jump .ckpet-emoji{animation:ckpetJump .6s ease 2}
  .ckpet-grow .ckpet-body{animation:ckpetGrow 1s ease}
  .ckpet-info{flex:1;min-width:0}
  .ckpet-name{font-weight:900;font-size:1rem;color:#4c1d95;padding-right:52px}
  .ckpet-rename{background:none;border:none;padding:0;font:inherit;color:inherit;cursor:pointer}
  .ckpet-kind{font-weight:700;font-size:.82rem;color:#7c6f99}
  .ckpet-msg{font-weight:700;font-size:.88rem;margin:2px 0 4px}
  .ckpet-next{font-size:.78rem;font-weight:800;color:#b45309}
  .ckpet-bar{height:8px;border-radius:8px;background:rgba(124,58,237,.12);overflow:hidden;margin-top:6px}
  .ckpet-bar>div{height:100%;background:linear-gradient(90deg,#a78bfa,#f472b6,#fbbf24);border-radius:8px;transition:width .5s}
  .ckpet-change{position:absolute;top:8px;right:10px;background:none;border:none;color:#9ca3af;font-size:.7rem;font-weight:700;cursor:pointer;text-decoration:underline}
  .ckpet-picker{flex-direction:column;align-items:stretch;text-align:center;gap:6px}
  .ckpet-pick-title{font-family:'Fredoka One',cursive;font-size:1.15rem;color:#4c1d95}
  .ckpet-pick-sub{font-size:.82rem;font-weight:700;color:#6b7280}
  .ckpet-choices{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:4px}
  .ckpet-choice{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:72px;padding:8px 6px;border-radius:14px;
    border:2px solid rgba(124,58,237,.2);background:#fff;font-family:'Nunito',sans-serif;font-weight:800;font-size:.75rem;color:#4c1d95;cursor:pointer;transition:transform .15s,border-color .15s}
  .ckpet-choice span{font-size:2rem;line-height:1.1}
  .ckpet-choice:hover{transform:translateY(-3px) scale(1.05);border-color:#7c3aed}
  .ckpet-kid .ckpet{max-width:520px;margin:0 auto}
  @keyframes ckpetIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes ckpetWobble{0%,100%{transform:rotate(0)}20%{transform:rotate(-9deg)}40%{transform:rotate(8deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(3deg)}}
  @keyframes ckpetJump{0%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-22px) scale(1.15)}70%{transform:translateY(0) scale(.95)}}
  @keyframes ckpetGrow{0%{transform:scale(.6);filter:brightness(2)}60%{transform:scale(1.25)}100%{transform:scale(1);filter:none}}
  @keyframes ckpetTear{0%{opacity:0;transform:translateY(0)}30%{opacity:1}100%{opacity:0;transform:translateY(18px)}}
  @keyframes ckpetBubble{0%{opacity:0;transform:translateY(6px) scale(.8)}12%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}
  @media (max-width:480px){.ckpet{gap:10px;padding:10px}.ckpet-body{width:68px;height:68px}.ckpet-s2 .ckpet-emoji{font-size:2.8rem}.ckpet-bubble{left:50px}}
  @media (prefers-reduced-motion:reduce){.ckpet *{animation:none!important}}
  @media print{.ckpet-slot{display:none!important}}`;
  document.head.appendChild(css);
})();
