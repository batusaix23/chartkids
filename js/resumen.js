// js/resumen.js — "Resumen de la semana": a 1080×1350 image of the open chart's week
// (stars earned, % done, days completed, perfect-week tasks, the pet) to share on
// WhatsApp. Drawn on a <canvas> in the browser — no AI, no server.
// Phones share the image itself (Web Share API with files); otherwise the image is
// downloaded and a WhatsApp button sends a text + link.
// Reads the globals chartData / checked / lang from index.html; writes nothing.
(function () {
  'use strict';

  const W = 1080, H = 1350;
  const SITE = 'https://www.chartkids.com/?ref=resumen';
  const DAY = { es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'], en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] };
  const DAY_FULL = {
    es: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  };
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  const curLang = () => {
    let l = 'es';
    try { l = (typeof lang !== 'undefined' && lang) || document.documentElement.lang || 'es'; } catch (e) {}
    return l === 'en' ? 'en' : 'es';
  };

  function stats() {
    const cd = typeof chartData !== 'undefined' ? chartData : null;
    const ch = typeof checked !== 'undefined' ? checked : new Set();
    if (!cd) return null;
    const tasks = cd.tasks || [], days = cd.days || 7, total = tasks.length * days;
    const perDay = Array.from({ length: days }, (_, d) => tasks.filter((_, t) => ch.has(`${t}-${d}`)).length);
    const perfect = tasks.filter((_, t) => Array.from({ length: days }, (_, d) => ch.has(`${t}-${d}`)).every(Boolean));
    let best = -1;
    perDay.forEach((n, d) => { if (n > 0 && (best < 0 || n > perDay[best])) best = d; });
    return {
      name: (cd.childName || '').trim(), goal: (cd.goal || '').trim(),
      count: ch.size, total, pct: total ? Math.round((ch.size / total) * 100) : 0,
      days, tasksN: tasks.length, perDay, fullDays: perDay.filter(n => tasks.length && n === tasks.length).length,
      perfect: perfect.map(t => `${t.icon || '⭐'} ${t.name}`), best,
      pet: window.ckPet && ckPet.info ? ckPet.info() : null,
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function fitText(ctx, text, maxW, size, family) {
    let s = size;
    do { ctx.font = `${s}px ${family}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 20);
  }
  function ellipsis(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
  }

  async function draw(s) {
    const L = curLang(), es = L === 'es';
    try { await Promise.all([document.fonts.load('80px "Fredoka One"'), document.fonts.load('800 40px Nunito')]); } catch (e) {}
    const TITLE = '"Fredoka One","Nunito",sans-serif', BODY = 'Nunito,"Segoe UI",sans-serif';
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#6d28d9'); bg.addColorStop(0.55, '#c026d3'); bg.addColorStop(1, '#f97316');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff';
    [[120, 160, 150], [960, 260, 110], [900, 1180, 190], [140, 1150, 90]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Brand
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `64px ${TITLE}`; ctx.fillStyle = '#fff';
    ctx.fillText('ChartKids ✨', W / 2, 110);
    ctx.font = `800 34px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(es ? 'Resumen de la semana' : 'Weekly summary', W / 2, 160);

    // Card
    const cx = 70, cy = 200, cw = W - 140, ch = H - 330;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
    roundRect(ctx, cx, cy, cw, ch, 48); ctx.fillStyle = '#fffaf3'; ctx.fill(); ctx.restore();

    // Pet or trophy
    const hero = s.pet ? s.pet.emoji : (s.pct >= 100 ? '🏆' : '⭐');
    ctx.font = `150px ${EMOJI_FONT}`; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText(hero, W / 2, cy + 125);
    if (s.pct >= 100 && s.pet) { ctx.font = `64px ${EMOJI_FONT}`; ctx.fillText('👑', W / 2, cy + 30); }
    ctx.textBaseline = 'alphabetic';

    // Headline
    const who = s.name || (es ? 'Mi campeón' : 'My champion');
    const head = es ? `¡${who} ganó ${s.count} ⭐!` : `${who} earned ${s.count} ⭐!`;
    fitText(ctx, head, cw - 90, 82, TITLE); ctx.fillStyle = '#4c1d95';
    ctx.fillText(head, W / 2, cy + 300);
    ctx.font = `800 36px ${BODY}`; ctx.fillStyle = '#7c6f99';
    const sub = s.pet ? (es ? `junto con ${s.pet.name} · ${s.pet.kind}` : `together with ${s.pet.name} · ${s.pet.kind}`)
      : (es ? `${s.count} de ${s.total} estrellas` : `${s.count} of ${s.total} stars`);
    ctx.fillText(ellipsis(ctx, sub, cw - 90), W / 2, cy + 355);

    // Progress bar
    const bx = cx + 60, bw = cw - 120, by = cy + 400;
    roundRect(ctx, bx, by, bw, 46, 23); ctx.fillStyle = '#ede9fe'; ctx.fill();
    const gw = Math.max(46, bw * Math.min(s.pct, 100) / 100);
    const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    pg.addColorStop(0, '#a78bfa'); pg.addColorStop(0.5, '#f472b6'); pg.addColorStop(1, '#fbbf24');
    roundRect(ctx, bx, by, gw, 46, 23); ctx.fillStyle = pg; ctx.fill();
    ctx.font = `900 30px ${BODY}`; ctx.fillStyle = s.pct > 12 ? '#fff' : '#4c1d95';
    ctx.textAlign = s.pct > 12 ? 'right' : 'left';
    ctx.fillText(`${s.pct}%`, s.pct > 12 ? bx + gw - 18 : bx + gw + 14, by + 34);
    ctx.textAlign = 'center';

    // Days row: pie of each day's tasks done; ✓ when complete
    const dl = DAY[L].slice(0, s.days), dy = cy + 525, step = Math.min(118, (cw - 120) / s.days);
    const startX = W / 2 - (step * (s.days - 1)) / 2;
    dl.forEach((lab, d) => {
      const x = startX + d * step, frac = s.tasksN ? s.perDay[d] / s.tasksN : 0;
      ctx.beginPath(); ctx.arc(x, dy, 42, 0, 7); ctx.fillStyle = '#ede9fe'; ctx.fill();
      if (frac > 0) {
        ctx.beginPath(); ctx.moveTo(x, dy); ctx.arc(x, dy, 42, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.closePath();
        ctx.fillStyle = frac >= 1 ? '#22c55e' : '#c4b5fd'; ctx.fill();
      }
      ctx.font = `900 32px ${BODY}`; ctx.fillStyle = frac >= 1 ? '#fff' : '#4c1d95'; ctx.textBaseline = 'middle';
      ctx.fillText(frac >= 1 ? '✓' : lab, x, dy + 2); ctx.textBaseline = 'alphabetic';
    });

    // Highlights
    const lines = [];
    if (s.fullDays) lines.push(`🌟 ${es ? `${s.fullDays} ${s.fullDays === 1 ? 'día completo' : 'días completos'}` : `${s.fullDays} full ${s.fullDays === 1 ? 'day' : 'days'}`}`);
    s.perfect.slice(0, 2).forEach(p => lines.push(`🏅 ${p} · ${es ? 'semana perfecta' : 'perfect week'}`));
    if (lines.length < 3 && s.best >= 0 && s.days === 7) lines.push(`🔥 ${es ? 'Mejor día' : 'Best day'}: ${DAY_FULL[L][s.best]}`);
    if (s.goal) lines.push(`🎯 ${es ? 'Meta' : 'Goal'}: ${s.goal}`);
    if (!lines.length) lines.push(es ? '💪 ¡Apenas empezamos!' : '💪 Just getting started!');
    ctx.textAlign = 'left'; ctx.font = `800 38px ${BODY}`; ctx.fillStyle = '#374151';
    lines.slice(0, 4).forEach((ln, i) => ctx.fillText(ellipsis(ctx, ln, cw - 130), cx + 65, cy + 700 + i * 76));
    ctx.textAlign = 'center';

    // Footer
    ctx.font = `800 34px ${BODY}`; ctx.fillStyle = '#fff';
    ctx.fillText(es ? '¡Crea el tuyo gratis en chartkids.com!' : 'Make yours free at chartkids.com!', W / 2, H - 62);
    return c;
  }

  let lastUrl = null;

  function shareText(s) {
    const es = curLang() === 'es', who = s.name || (es ? 'Mi peque' : 'My kid');
    return es ? `¡${who} ganó ${s.count} ⭐ esta semana en su chart de ChartKids! 🎉 Crea el tuyo gratis: ${SITE}`
      : `${who} earned ${s.count} ⭐ this week on their ChartKids chart! 🎉 Make yours free: ${SITE}`;
  }

  async function open() {
    const s = stats();
    if (!s || !s.total) return;
    const es = curLang() === 'es';
    const canvas = await draw(s);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(blob);
    const file = new File([blob], 'chartkids-resumen.png', { type: 'image/png' });
    let canFiles = false;
    try { canFiles = !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) {}

    document.getElementById('ckres-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'ckres-modal';
    m.innerHTML = `<div class="ckres-box" role="dialog" aria-modal="true">
      <button type="button" class="ckres-x" aria-label="${es ? 'Cerrar' : 'Close'}">×</button>
      <div class="ckres-title">📲 ${es ? 'Resumen de la semana' : 'Weekly summary'}</div>
      <img class="ckres-img" alt="">
      <div class="ckres-btns">
        ${canFiles ? `<button type="button" class="ckres-btn ckres-main" data-a="share">📤 ${es ? 'Compartir imagen' : 'Share image'}</button>` : ''}
        <button type="button" class="ckres-btn ${canFiles ? '' : 'ckres-main'}" data-a="download">⬇️ ${es ? 'Descargar' : 'Download'}</button>
        <button type="button" class="ckres-btn ckres-wa" data-a="wa">💬 WhatsApp</button>
      </div>
      <div class="ckres-tip">${canFiles ? '' : (es ? 'Descarga la imagen y adjúntala en WhatsApp 📎' : 'Download the image and attach it in WhatsApp 📎')}</div>
    </div>`;
    m.querySelector('.ckres-img').src = lastUrl;
    m.querySelector('.ckres-img').alt = es ? 'Resumen de la semana' : 'Weekly summary';
    m.addEventListener('click', async e => {
      if (e.target === m || e.target.classList.contains('ckres-x')) return m.remove();
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'share') {
        try { await navigator.share({ files: [file], text: shareText(s) }); } catch (err) { /* cancelled */ }
      } else if (a === 'download') {
        const link = document.createElement('a');
        link.href = lastUrl; link.download = 'chartkids-resumen.png';
        document.body.appendChild(link); link.click(); link.remove();
      } else if (a === 'wa') {
        window.open('https://wa.me/?text=' + encodeURIComponent(shareText(s)), '_blank', 'noopener');
      }
    });
    document.body.appendChild(m);
  }

  window.ckResumen = { open, draw, stats };

  const css = document.createElement('style');
  css.textContent = `
  #ckres-modal{position:fixed;inset:0;z-index:10010;background:rgba(10,8,25,.78);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Nunito',sans-serif}
  .ckres-box{position:relative;background:#1a1a2e;border:1px solid #2e2e50;border-radius:22px;padding:18px;width:min(420px,100%);max-height:calc(100vh - 32px);overflow:auto;text-align:center;color:#f1f5f9}
  .ckres-title{font-family:'Fredoka One',cursive;font-size:1.3rem;margin-bottom:12px}
  .ckres-img{width:100%;border-radius:14px;display:block;box-shadow:0 8px 30px rgba(0,0,0,.4)}
  .ckres-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}
  .ckres-btn{flex:1 1 auto;white-space:nowrap;padding:11px 12px;border-radius:50px;border:1px solid #2e2e50;background:#232340;color:#f1f5f9;font:800 .9rem 'Nunito',sans-serif;cursor:pointer}
  .ckres-btn:hover{border-color:#7c3aed}
  .ckres-main{background:linear-gradient(135deg,#7c3aed,#ec4899);border:none}
  .ckres-wa{background:#25d366;border:none;color:#06301a}
  .ckres-tip{font-size:.8rem;color:#94a3b8;margin-top:10px}
  .ckres-tip:empty{display:none}
  .ckres-x{position:absolute;top:8px;right:12px;background:none;border:none;color:#94a3b8;font-size:1.8rem;cursor:pointer;line-height:1}`;
  document.head.appendChild(css);
})();
