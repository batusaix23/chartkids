// js/premio-dibujo.js — "🖍️ Dibuja mi premio" (Premium): the AI draws the chart's reward
// ("Ir al parque") as a coloring page and it is glued into the chart as the reward
// picture; it can also be printed to color in.
//  • Worker POST /api/premio-dibujo {subscriptionID, desc, lang}: the PayPal subscription
//    is verified on the server before any AI is used; kid-safety check + FLUX as in
//    "Colorear con IA"; 5 drawings per subscription per day.
//  • Not Premium (no subscription on this device, or the server says so) → an invitation
//    to Premium; no AI is used.
// The drawing is shrunk to 512 px before it is stored in the chart (localStorage).
(function () {
  'use strict';

  const curLang = () => {
    let l = 'es';
    try { l = (typeof lang !== 'undefined' && lang) || document.documentElement.lang || 'es'; } catch (e) {}
    return l === 'en' ? 'en' : 'es';
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const subId = () => { try { return localStorage.getItem('chartkids_premium_sub') || localStorage.getItem('chartkids_subscription_id') || ''; } catch (e) { return ''; } };
  const api = () => (typeof API_URL !== 'undefined' ? API_URL : 'https://chartkids.com/api/') + 'premio-dibujo';

  const T = {
    es: { title: '🖍️ Dibuja mi premio', premium: 'Exclusivo de Premium', pitch: 'La IA dibuja el premio de tu peque como página para colorear y lo pega en su chart. ¡Motiva muchísimo!',
          see: '👑 Ver Premium', noGoal: 'Primero escribe el premio o la meta del chart (botón ✏️ Editar).', drawing: 'Dibujando tu premio… 🎨',
          unsafe: 'Ese premio no se puede dibujar. Prueba con otras palabras en ✏️ Editar.', limit: 'Ya dibujaste 5 premios hoy. ¡Mañana hay más!',
          busy: 'La IA está descansando. Intenta más tarde.', notPremium: 'No encontramos una suscripción Premium activa en este dispositivo.',
          done: '¡Listo! Ya está en tu chart.', print: '🖨️ Imprimir para colorear', again: '🔄 Otro dibujo' },
    en: { title: '🖍️ Draw my reward', premium: 'Premium exclusive', pitch: "AI draws your kid's reward as a coloring page and glues it into their chart. Super motivating!",
          see: '👑 See Premium', noGoal: "First write the chart's reward or goal (✏️ Edit button).", drawing: 'Drawing your reward… 🎨',
          unsafe: "That reward can't be drawn. Try other words in ✏️ Edit.", limit: 'You drew 5 rewards today. More tomorrow!',
          busy: 'The AI is resting. Try again later.', notPremium: "We couldn't find an active Premium subscription on this device.",
          done: "Done! It's on your chart now.", print: '🖨️ Print to color', again: '🔄 Another drawing' },
  };

  function modal(html) {
    document.getElementById('ckpd-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'ckpd-modal';
    m.innerHTML = `<div class="ckpd-box" role="dialog" aria-modal="true"><button type="button" class="ckpd-x" aria-label="×">×</button>${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('.ckpd-x')) m.remove(); });
    document.body.appendChild(m);
    return m;
  }

  function upsell(extra) {
    const t = T[curLang()];
    modal(`<div class="ckpd-title">${t.title}</div><div class="ckpd-badge">👑 ${t.premium}</div>
      <p class="ckpd-p">${t.pitch}</p>${extra ? `<p class="ckpd-note">${esc(extra)}</p>` : ''}
      <a class="ckpd-btn" href="/premium.html">${t.see}</a>`);
  }

  // Shrink to 512 px JPEG so the chart (localStorage) stays small.
  function shrink(dataUrl) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 512 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => res(dataUrl);
      img.src = dataUrl;
    });
  }

  function printPage(src, goal) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><meta charset="utf-8"><title>${esc(goal)}</title>
      <style>body{margin:0;font-family:sans-serif;text-align:center}h1{font-size:28px;margin:24px 0 8px}img{width:90%;max-width:700px}</style>
      <h1>${esc(goal)}</h1><img src="${src}" onload="setTimeout(()=>print(),300)">`);
    w.document.close();
  }

  async function open() {
    const t = T[curLang()];
    if (typeof chartData === 'undefined' || !chartData) return;
    const sub = subId();
    if (!sub) { upsell(); return; }
    const goal = String(chartData.goal || '').trim();
    if (!goal) { modal(`<div class="ckpd-title">${t.title}</div><p class="ckpd-p">${t.noGoal}</p>`); return; }

    const m = modal(`<div class="ckpd-title">${t.title}</div><div class="ckpd-goal">🎯 ${esc(goal)}</div>
      <div class="ckpd-wait"><div class="ckpd-spin">🎨</div>${t.drawing}</div>`);
    let r = null, j = {};
    try {
      r = await fetch(api(), { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionID: sub, desc: goal, lang: curLang() }) });
      j = await r.json().catch(() => ({}));
    } catch (e) { r = null; }
    if (!document.body.contains(m)) return;
    const say = msg => { m.querySelector('.ckpd-wait').innerHTML = `<p class="ckpd-note">${esc(msg)}</p>`; };
    if (!r) return say(t.busy);
    if (r.status === 403 && j.error === 'not_premium') { m.remove(); upsell(t.notPremium); return; }
    if (r.status === 429) return say(j.error === 'daily_limit' ? t.limit : t.busy);
    if (!r.ok) return say(t.busy);
    if (j.safe === false) return say(t.unsafe);
    if (!j.image) return say(t.busy);

    const small = await shrink(j.image);
    chartData.rewardImage = small;
    try {
      if (typeof rebuildChartKeepProgress === 'function') rebuildChartKeepProgress();
      if (typeof saveProgress === 'function') saveProgress();
    } catch (e) {}
    m.querySelector('.ckpd-wait').outerHTML = `<img class="ckpd-img" src="${small}" alt="${esc(goal)}">
      <div class="ckpd-ok">✅ ${t.done}</div>
      <div class="ckpd-btns"><button type="button" class="ckpd-btn" data-a="print">${t.print}</button>
      <button type="button" class="ckpd-btn ckpd-sec" data-a="again">${t.again}</button></div>`;
    m.querySelector('[data-a="print"]').onclick = () => printPage(j.image, goal);
    m.querySelector('[data-a="again"]').onclick = () => open();
    if (window.ckFx) ckFx.rain(50);
  }

  window.ckPremioDibujo = { open };

  const css = document.createElement('style');
  css.textContent = `
  #ckpd-modal{position:fixed;inset:0;z-index:10010;background:rgba(10,8,25,.82);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Nunito',sans-serif}
  .ckpd-box{position:relative;background:linear-gradient(180deg,#fff7e6,#fdf2ff);color:#3b2a5a;border-radius:24px;padding:22px 20px 18px;width:min(460px,100%);max-height:calc(100vh - 32px);overflow:auto;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.45)}
  .ckpd-x{position:absolute;top:8px;right:12px;background:none;border:none;color:#9ca3af;font-size:1.8rem;cursor:pointer;line-height:1}
  .ckpd-title{font-family:'Fredoka One',cursive;font-size:1.45rem;color:#6d28d9;margin-bottom:8px}
  .ckpd-badge{display:inline-block;padding:4px 12px;border-radius:50px;background:#fef3c7;color:#92400e;font-weight:900;font-size:.8rem;margin-bottom:8px}
  .ckpd-p{font-weight:700;line-height:1.5;margin:6px 0 12px}
  .ckpd-note{font-weight:800;color:#b45309}
  .ckpd-goal{font-weight:900;font-size:1.05rem;margin-bottom:10px}
  .ckpd-wait{font-weight:800;color:#6d28d9;padding:18px 0}
  .ckpd-spin{font-size:3rem;animation:ckpdSpin 1.2s ease-in-out infinite}
  @keyframes ckpdSpin{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg) scale(1.1)}}
  .ckpd-img{width:100%;max-width:340px;border-radius:16px;border:3px solid #fff;box-shadow:0 6px 20px rgba(124,58,237,.25);background:#fff}
  .ckpd-ok{font-weight:900;color:#15803d;margin:10px 0}
  .ckpd-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .ckpd-btn{display:inline-block;padding:10px 16px;border-radius:50px;border:none;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font:900 .9rem 'Nunito',sans-serif;cursor:pointer;text-decoration:none}
  .ckpd-sec{background:#fff;color:#4c1d95;border:2px solid #e9d5ff}
  @media (prefers-reduced-motion:reduce){.ckpd-spin{animation:none}}`;
  document.head.appendChild(css);
})();
