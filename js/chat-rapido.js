// js/chat-rapido.js — "Arma tu chart en 4 toques": age → what to work on → reward →
// name (optional), all with buttons. It writes the message for the parent and sends it
// to the AI chat that already exists in index.html (sendMessage), so it costs the same
// as typing it. Shown above the chat's quick prompts; collapses once a chart exists.
(function () {
  'use strict';

  const T = {
    es: {
      title: '⚡ Arma tu chart en 4 toques', step: n => `Paso ${n} de 4`,
      q1: '¿Qué edad tiene?', q2: '¿Qué quieren mejorar? (elige 1 a 4)', q3: '¿Qué premio lo motiva?', q4: '¿Cómo se llama? (opcional)',
      ages: ['3-4 años', '5-6 años', '7-8 años', '9-12 años'],
      areas: ['🌅 Rutina de la mañana', '🦷 Higiene', '📚 Tareas de la escuela', '🧹 Ayudar en casa', '😴 Hora de dormir', '🥦 Comer bien', '😊 Portarse bien', '📵 Menos pantallas'],
      rewards: ['🍦 Un antojo', '🎮 Tiempo de juego', '🧸 Un juguete', '🌳 Un paseo especial', '💰 Dinero', '⭐ Solo estrellas'],
      money: '¿Cuánto dinero a la semana?', name: 'Nombre', next: 'Siguiente →', back: '← Atrás', go: '✨ Crear mi chart',
      msg: f => `Quiero un chart para ${f.name || 'mi peque'}, que tiene ${f.age}. ` +
        `Queremos trabajar: ${f.areas.join(', ')}. ` +
        (f.rewardIdx === 4 ? `El premio es dinero: ${f.money || '50'} pesos a la semana.`
          : f.rewardIdx === 5 ? 'Sin premio especial, solo juntar estrellas.' : `El premio: ${f.rewardText}.`),
    },
    en: {
      title: '⚡ Build your chart in 4 taps', step: n => `Step ${n} of 4`,
      q1: 'How old are they?', q2: 'What do you want to work on? (pick 1 to 4)', q3: 'Which reward motivates them?', q4: "What's their name? (optional)",
      ages: ['3-4 years', '5-6 years', '7-8 years', '9-12 years'],
      areas: ['🌅 Morning routine', '🦷 Hygiene', '📚 Homework', '🧹 Helping at home', '😴 Bedtime', '🥦 Eating well', '😊 Good behavior', '📵 Less screen time'],
      rewards: ['🍦 A treat', '🎮 Play time', '🧸 A toy', '🌳 A special outing', '💰 Money', '⭐ Just stars'],
      money: 'How much money per week?', name: 'Name', next: 'Next →', back: '← Back', go: '✨ Create my chart',
      msg: f => `I want a chart for ${f.name || 'my kid'}, who is ${f.age} old. ` +
        `We want to work on: ${f.areas.join(', ')}. ` +
        (f.rewardIdx === 4 ? `The reward is money: $${f.money || '5'} per week.`
          : f.rewardIdx === 5 ? 'No special reward, just collecting stars.' : `The reward: ${f.rewardText}.`),
    },
  };

  const curLang = () => {
    let l = 'es';
    try { l = (typeof lang !== 'undefined' && lang) || document.documentElement.lang || 'es'; } catch (e) {}
    return l === 'en' ? 'en' : 'es';
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const noEmoji = s => s.slice(s.indexOf(' ') + 1);

  // Choices are kept as indexes so a language switch mid-way keeps them.
  let step = 1, open = true;
  let f = { age: -1, areas: [], reward: -1, money: '', name: '' };
  const reset = () => { step = 1; f = { age: -1, areas: [], reward: -1, money: '', name: '' }; };

  function chips(list, isOn) {
    return `<div class="ckw-chips">${list.map((v, i) => `<button type="button" class="ckw-chip${isOn(i) ? ' on' : ''}" data-i="${i}">${esc(v)}</button>`).join('')}</div>`;
  }

  function render() {
    const box = document.getElementById('ckWizard');
    if (!box) return;
    const t = T[curLang()];
    if (!open) { box.innerHTML = `<button type="button" class="ckw-open">${t.title}</button>`; return; }
    let body = '';
    if (step === 1) body = `<div class="ckw-q">${t.q1}</div>${chips(t.ages, i => f.age === i)}`;
    if (step === 2) body = `<div class="ckw-q">${t.q2}</div>${chips(t.areas, i => f.areas.includes(i))}`;
    if (step === 3) body = `<div class="ckw-q">${t.q3}</div>${chips(t.rewards, i => f.reward === i)}` +
      (f.reward === 4 ? `<label class="ckw-q">${t.money}<input type="number" min="1" max="10000" class="ckw-in" data-k="money" value="${esc(f.money)}"></label>` : '');
    if (step === 4) body = `<div class="ckw-q">${t.q4}</div><input type="text" maxlength="30" class="ckw-in" data-k="name" placeholder="${t.name}" value="${esc(f.name)}">`;
    const can = step === 1 ? f.age >= 0 : step === 2 ? f.areas.length > 0 : step === 3 ? f.reward >= 0 : true;
    box.innerHTML = `<div class="ckw">
      <div class="ckw-head"><b>${t.title}</b><span>${t.step(step)}</span><button type="button" class="ckw-x" aria-label="×">×</button></div>
      ${body}
      <div class="ckw-nav">${step > 1 ? `<button type="button" class="ckw-back">${t.back}</button>` : '<span></span>'}
        ${step < 4 ? `<button type="button" class="ckw-next"${can ? '' : ' disabled'}>${t.next}</button>` : `<button type="button" class="ckw-go">${t.go}</button>`}</div>
    </div>`;
  }

  function send() {
    const t = T[curLang()];
    const input = document.getElementById('chatInput');
    if (!input || typeof sendMessage !== 'function') return;
    input.value = t.msg({
      name: f.name.trim(), age: t.ages[f.age], money: f.money,
      areas: f.areas.map(i => noEmoji(t.areas[i]).toLowerCase()),
      rewardIdx: f.reward, rewardText: noEmoji(t.rewards[f.reward] || '').toLowerCase(),
    });
    open = false; reset(); render();
    sendMessage();
  }

  document.addEventListener('click', e => {
    const box = document.getElementById('ckWizard');
    if (!box || !box.contains(e.target)) return;
    if (e.target.closest('.ckw-open')) { open = true; render(); return; }
    if (e.target.closest('.ckw-x')) { open = false; render(); return; }
    if (e.target.closest('.ckw-back')) { step--; render(); return; }
    if (e.target.closest('.ckw-next')) { step++; render(); return; }
    if (e.target.closest('.ckw-go')) { send(); return; }
    const chip = e.target.closest('.ckw-chip');
    if (!chip) return;
    const i = +chip.dataset.i;
    if (step === 1) { f.age = i; step = 2; }
    else if (step === 2) f.areas = f.areas.includes(i) ? f.areas.filter(a => a !== i) : f.areas.length < 4 ? [...f.areas, i] : f.areas;
    else if (step === 3) { f.reward = i; if (i !== 4) step = 4; }
    render();
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.classList && el.classList.contains('ckw-in') && el.dataset.k) f[el.dataset.k] = el.value;
  });
  document.addEventListener('keydown', e => {
    const el = e.target;
    if (e.key !== 'Enter' || !el.classList || !el.classList.contains('ckw-in')) return;
    e.preventDefault();
    if (step < 4) { step++; render(); } else send();
  });

  // Collapsed while a chart is on screen (the parent can still open it).
  function sync() { if (typeof chartData !== 'undefined' && chartData && step === 1) open = false; render(); }

  window.ckWizard = { render, sync };

  const css = document.createElement('style');
  css.textContent = `
  .ckw{background:linear-gradient(135deg,rgba(124,58,237,.14),rgba(236,72,153,.10));border:1px solid rgba(124,58,237,.35);border-radius:16px;padding:12px;margin:8px 0;font-family:'Nunito',sans-serif;color:#f1f5f9}
  .ckw-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .ckw-head b{flex:1;font-size:.95rem}
  .ckw-head span{font-size:.75rem;font-weight:800;color:#a78bfa}
  .ckw-x{background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer;line-height:1}
  .ckw-q{display:block;font-weight:800;font-size:.88rem;margin:6px 0;color:#e2e8f0}
  .ckw-chips{display:flex;flex-wrap:wrap;gap:6px}
  .ckw-chip{padding:7px 11px;border-radius:50px;border:1px solid #3b3b66;background:#232340;color:#f1f5f9;font:800 .82rem 'Nunito',sans-serif;cursor:pointer}
  .ckw-chip.on{background:linear-gradient(135deg,#7c3aed,#ec4899);border-color:transparent}
  .ckw-in{width:100%;margin-top:4px;padding:9px 12px;border-radius:12px;border:1px solid #3b3b66;background:#232340;color:#f1f5f9;font:700 .95rem 'Nunito',sans-serif}
  .ckw-nav{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
  .ckw-back{background:none;border:none;color:#a78bfa;font:800 .85rem 'Nunito',sans-serif;cursor:pointer}
  .ckw-next,.ckw-go,.ckw-open{padding:9px 16px;border-radius:50px;border:none;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font:900 .88rem 'Nunito',sans-serif;cursor:pointer}
  .ckw-next:disabled{opacity:.45;cursor:not-allowed}
  .ckw-open{display:block;width:100%;margin:8px 0}`;
  document.head.appendChild(css);
})();
