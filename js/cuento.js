// js/cuento.js — "Cuento del día": a short story where the child is the hero, their
// chart pet is the sidekick and the tasks they did become great deeds.
//  • asks the Worker (POST /api/cuento, 8B model, ~20 neurons) once per chart per day;
//    the story is kept in localStorage 'ck_cuentos' and shown again that day:
//      { "<chartId>": { date: "YYYY-MM-DD", lang, title, paragraphs: [..], ai } }
//  • if AI is unavailable (daily budget, rate limit, offline…) a built-in story is
//    written in the browser instead, so the button always works
//  • "Escuchar" reads it aloud with the browser's own voice (js/voz.js)
// Reads the globals chartData / checked / currentChartId / lang / API_URL from index.html.
(function () {
  'use strict';

  const KEY = 'ck_cuentos';
  // Boy/girl reading voice per chart, chosen by the parent in the story window:
  // localStorage 'ck_voz' = { "<chartId>": "m" | "f" }
  const VKEY = 'ck_voz';
  const getGender = id => { try { return (JSON.parse(localStorage.getItem(VKEY) || '{}') || {})[id] || ''; } catch (e) { return ''; } };
  const setGender = (id, g) => { try { const all = JSON.parse(localStorage.getItem(VKEY) || '{}') || {}; all[id] = g; localStorage.setItem(VKEY, JSON.stringify(all)); } catch (e) {} };
  const curLang = () => {
    let l = 'es';
    try { l = (typeof lang !== 'undefined' && lang) || document.documentElement.lang || 'es'; } catch (e) {}
    return l === 'en' ? 'en' : 'es';
  };
  const today = () => new Date().toISOString().slice(0, 10);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const save = all => { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} };

  function facts() {
    const cd = typeof chartData !== 'undefined' ? chartData : null;
    if (!cd) return null;
    const ch = typeof checked !== 'undefined' ? checked : new Set();
    const days = cd.days || 7;
    // Tasks the child actually did, most-done first.
    const done = (cd.tasks || []).map((t, i) => ({ name: t.name, n: Array.from({ length: days }, (_, d) => ch.has(`${i}-${d}`)).filter(Boolean).length }))
      .filter(t => t.n > 0).sort((a, b) => b.n - a.n).map(t => t.name);
    const pet = window.ckPet && ckPet.info ? ckPet.info() : null;
    return {
      id: (typeof currentChartId !== 'undefined' && currentChartId) || 'chart',
      lang: curLang(), name: (cd.childName || '').trim(), goal: (cd.goal || '').trim(),
      tasks: done.slice(0, 4), allTasks: (cd.tasks || []).map(t => t.name).slice(0, 4),
      stars: ch.size, petName: pet ? pet.name : '', petKind: pet ? pet.kind : '', petEmoji: pet ? pet.emoji : '',
    };
  }

  // Built-in stories (no AI). Three shapes so repeated days don't feel identical.
  function localStory(f, variant) {
    const es = f.lang === 'es';
    const hero = f.name || (es ? 'nuestro héroe' : 'our hero');
    const buddy = f.petName ? (es ? `${f.petName}, su mascota fiel,` : `${f.petName}, their loyal buddy,`) : (es ? 'una estrellita mágica' : 'a little magic star');
    const deeds = (f.tasks.length ? f.tasks : f.allTasks).slice(0, 3).map(t => t.toLowerCase());
    const list = deeds.length > 1 ? deeds.slice(0, -1).join(', ') + (es ? ' y ' : ' and ') + deeds[deeds.length - 1] : (deeds[0] || (es ? 'ayudar en casa' : 'helping at home'));
    const goal = f.goal ? (es ? ` Cada estrella los acercaba a su gran premio: ${f.goal}.` : ` Every star brought them closer to the big prize: ${f.goal}.`) : '';
    const stars = f.stars ? (es ? `${f.stars} estrellas brillaban ya en su chart` : `${f.stars} stars were already shining on the chart`) : (es ? 'la primera estrella esperaba en su chart' : 'the very first star was waiting on the chart');
    const S = es ? [
      { title: `${hero} y la misión de las estrellas`, p: [
        `Había una vez ${hero}, que vivía en una casa llena de risas. Una mañana, ${buddy} apareció con un mapa brillante: "¡Hoy tenemos una misión muy importante!"`,
        `La misión era ${list}. Parecía fácil, pero era magia de verdad: cada vez que ${hero} terminaba una tarea, una estrella nueva se encendía en el cielo de su chart.${goal}`,
        `Al final del día, ${stars}. ${hero} sonrió, bostezó y dijo: "¡Mañana seguimos!" Porque los verdaderos héroes cumplen sus misiones un día a la vez. ⭐`] },
      { title: `El gran viaje de ${hero}`, p: [
        `En un reino donde las camas se tendían solas… bueno, casi nunca, vivía ${hero}. Por suerte tenía a ${buddy} para acompañarle en cada aventura.`,
        `Hoy el viaje pasó por lugares mágicos: ${list}. En cada parada, ${hero} dejó una huella dorada y el reino entero aplaudió.${goal}`,
        `Cuando la luna salió, ${stars}. "Eres valiente y constante", susurró la luna. Y ${hero} se durmió soñando con las aventuras de mañana. 🌙`] },
      { title: `${hero}, guardián de las estrellas`, p: [
        `Cuenta la leyenda que las estrellas del cielo necesitan un guardián. Este año eligieron a ${hero}, y ${buddy} vino a ayudar.`,
        `Para cuidar las estrellas había que hacer cosas especiales: ${list}. ¡Y ${hero} lo logró! Cada tarea hacía que el cielo brillara un poquito más.${goal}`,
        `Esta noche ${stars}, y las estrellas guiñaron un ojo para dar las gracias. Mañana habrá más estrellas que cuidar, ¡y nuestro guardián estará listo! ✨`] },
    ] : [
      { title: `${hero} and the star mission`, p: [
        `Once upon a time there was ${hero}, who lived in a house full of laughter. One morning ${buddy} showed up with a shiny map: "We have a very important mission today!"`,
        `The mission was ${list}. It looked easy, but it was real magic: every time ${hero} finished a task, a new star lit up on the chart.${goal}`,
        `By the end of the day, ${stars}. ${hero} smiled, yawned and said: "Let's keep going tomorrow!" Because real heroes finish their missions one day at a time. ⭐`] },
      { title: `${hero}'s great journey`, p: [
        `In a kingdom where beds made themselves… well, almost never, lived ${hero}. Luckily ${buddy} came along on every adventure.`,
        `Today the journey went through magic places: ${list}. At every stop, ${hero} left a golden footprint and the whole kingdom cheered.${goal}`,
        `When the moon came out, ${stars}. "You are brave and steady," whispered the moon. And ${hero} fell asleep dreaming of tomorrow's adventures. 🌙`] },
      { title: `${hero}, keeper of the stars`, p: [
        `Legend says the stars in the sky need a keeper. This year they chose ${hero}, and ${buddy} came to help.`,
        `To look after the stars you had to do special things: ${list}. And ${hero} did it! Each task made the sky shine a little brighter.${goal}`,
        `Tonight ${stars}, and the stars winked to say thank you. Tomorrow there will be more stars to look after, and our keeper will be ready! ✨`] },
    ];
    const s = S[((variant || 0) % S.length + S.length) % S.length];
    return { title: s.title, paragraphs: s.p, ai: false };
  }

  async function aiStory(f) {
    const base = typeof API_URL !== 'undefined' ? API_URL : 'https://chartkids.com/api/';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(base + 'cuento', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ lang: f.lang, name: f.name, petName: f.petName, petKind: f.petKind, goal: f.goal, tasks: f.tasks.length ? f.tasks : f.allTasks, stars: f.stars }),
      });
      if (!r.ok) return null;
      const j = await r.json();
      return j && j.title && Array.isArray(j.paragraphs) && j.paragraphs.length ? { title: j.title, paragraphs: j.paragraphs, ai: true } : null;
    } catch (e) { return null; } finally { clearTimeout(timer); }
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Reading aloud: js/voz.js picks a Latin American Spanish (or US English) voice and
  // never reads Spanish with an English voice.
  function stopVoice() { if (window.ckVoz) ckVoz.stop(); }
  async function speak(story, btn, gender) {
    const es = curLang() === 'es';
    const idle = es ? '🔊 Escuchar' : '🔊 Listen';
    if (!window.ckVoz) return;
    if (btn.dataset.playing === '1') { stopVoice(); btn.dataset.playing = ''; btn.textContent = idle; return; }
    btn.dataset.playing = '1';
    btn.textContent = es ? '⏹️ Detener' : '⏹️ Stop';
    const ok = await ckVoz.speak([story.title, ...story.paragraphs].join('. '), es ? 'es' : 'en',
      { gender, onend: () => { btn.dataset.playing = ''; btn.textContent = idle; } });
    if (!ok) {
      btn.dataset.playing = '';
      btn.textContent = es ? '🔇 Sin voz en español en este dispositivo' : '🔇 No English voice on this device';
      btn.disabled = true;
    }
  }

  function modal(html) {
    document.getElementById('ckcu-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'ckcu-modal';
    m.innerHTML = `<div class="ckcu-box" role="dialog" aria-modal="true">${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('.ckcu-x')) { stopVoice(); m.remove(); } });
    document.body.appendChild(m);
    return m;
  }

  function show(f, story, variant) {
    const es = f.lang === 'es';
    const m = modal(`<button type="button" class="ckcu-x" aria-label="${es ? 'Cerrar' : 'Close'}">×</button>
      <div class="ckcu-hero">${f.petEmoji || '📖'}</div>
      <h2 class="ckcu-title">${esc(story.title)}</h2>
      <div class="ckcu-text">${story.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${window.ckVoz && 'speechSynthesis' in window ? `<div class="ckcu-gender">${es ? 'Voz para' : 'Voice for'}:
        <button type="button" data-g="m">👦 ${es ? 'Niño' : 'Boy'}</button><button type="button" data-g="f">👧 ${es ? 'Niña' : 'Girl'}</button></div>` : ''}
      <div class="ckcu-btns">
        ${window.ckVoz && 'speechSynthesis' in window ? `<button type="button" class="ckcu-btn ckcu-main" data-a="voice">🔊 ${es ? 'Escuchar' : 'Listen'}</button>` : ''}
        <button type="button" class="ckcu-btn" data-a="other">🔄 ${es ? 'Otro cuento' : 'Another story'}</button>
      </div>`);
    const voiceBtn = m.querySelector('[data-a="voice"]');
    const mark = () => m.querySelectorAll('[data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === getGender(f.id)));
    mark();
    m.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => {
      setGender(f.id, b.dataset.g); mark();
      // Switching while it reads: restart with the new voice.
      if (voiceBtn && voiceBtn.dataset.playing === '1') { stopVoice(); voiceBtn.dataset.playing = ''; speak(story, voiceBtn, b.dataset.g); }
    }));
    voiceBtn?.addEventListener('click', () => speak(story, voiceBtn, getGender(f.id)));
    // "Another story" uses the built-in ones, so it never spends AI budget.
    m.querySelector('[data-a="other"]').addEventListener('click', () => { stopVoice(); const v = (variant || 0) + 1; show(f, localStory(f, v), v); });
  }

  async function open() {
    const f = facts();
    if (!f) return;
    const es = f.lang === 'es';
    const all = load();
    const cached = all[f.id];
    if (cached && cached.date === today() && cached.lang === f.lang) return show(f, cached, 0);

    modal(`<div class="ckcu-loading"><div class="ckcu-hero ckcu-bounce">${f.petEmoji || '📖'}</div>
      <div>${es ? 'Escribiendo tu cuento… ✨' : 'Writing your story… ✨'}</div></div>`);
    const story = (await aiStory(f)) || localStory(f, Math.floor(Math.random() * 3));
    all[f.id] = { date: today(), lang: f.lang, title: story.title, paragraphs: story.paragraphs, ai: story.ai };
    // Keep the store small: only charts that still exist.
    try { const ids = new Set(getAllCharts().map(c => c.id)); Object.keys(all).forEach(k => { if (!ids.has(k) && k !== f.id) delete all[k]; }); } catch (e) {}
    save(all);
    if (document.getElementById('ckcu-modal')) show(f, story, 0);
  }

  const kidButton = () => `<button type="button" class="ckcu-kid" onclick="ckCuento.open()" aria-label="${curLang() === 'es' ? 'Cuento' : 'Story'}">📖</button>`;

  window.ckCuento = { open, kidButton, localStory };

  const css = document.createElement('style');
  css.textContent = `
  #ckcu-modal{position:fixed;inset:0;z-index:10010;background:rgba(10,8,25,.8);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Nunito',sans-serif}
  .ckcu-box{position:relative;background:linear-gradient(180deg,#fffaf3,#fdf2ff);color:#3b2a5a;border-radius:24px;padding:22px 22px 18px;width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  .ckcu-hero{font-size:3.4rem;text-align:center;line-height:1.1}
  .ckcu-bounce{animation:ckcuB 1s ease-in-out infinite}
  @keyframes ckcuB{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  .ckcu-loading{text-align:center;font-weight:800;font-size:1.05rem;padding:20px 0;color:#6d28d9}
  .ckcu-title{font-family:'Fredoka One',cursive;font-size:1.5rem;text-align:center;color:#6d28d9;margin:6px 0 12px;line-height:1.2}
  .ckcu-text p{font-size:1.06rem;line-height:1.65;margin:0 0 12px;font-weight:600}
  .ckcu-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px}
  .ckcu-btn{flex:1 1 auto;white-space:nowrap;padding:11px 16px;border-radius:50px;border:2px solid rgba(124,58,237,.25);background:#fff;color:#4c1d95;font:800 .92rem 'Nunito',sans-serif;cursor:pointer}
  .ckcu-main{background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none}
  .ckcu-gender{display:flex;align-items:center;justify-content:center;gap:8px;margin:4px 0 10px;font-weight:800;font-size:.9rem;color:#6b5b8a}
  .ckcu-gender button{padding:7px 14px;border-radius:50px;border:2px solid rgba(124,58,237,.25);background:#fff;color:#4c1d95;font:800 .88rem 'Nunito',sans-serif;cursor:pointer}
  .ckcu-gender button.on{background:#7c3aed;color:#fff;border-color:#7c3aed}
  .ckcu-x{position:absolute;top:8px;right:12px;background:none;border:none;color:#9ca3af;font-size:1.8rem;cursor:pointer;line-height:1}
  .ckcu-kid{position:fixed;top:14px;left:66px;z-index:10000;width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,.85);font-size:1.3rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}
  @media (prefers-reduced-motion:reduce){.ckcu-bounce{animation:none}}`;
  document.head.appendChild(css);
})();
