// js/fiesta.js — extra fun when a star is marked (chart and Modo Niño):
//  • a musical note that climbs the scale with each star of the same day
//  • a small confetti burst from the tapped cell, plus a short vibration on phones
//  • "¡Día completado!" when every task of a day is done
//  • "¡Semana perfecta!" when one task is done every day of the week
//  • a sound on/off switch, remembered in localStorage 'ck_sound' ("off" = muted)
// The full-chart celebration (showCompletionCelebration in index.html) is unchanged;
// day/week banners are skipped when the whole chart reaches 100%.
// Browser only — no AI, no network.
(function () {
  'use strict';

  const DAYS = {
    es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  };
  // Pentatonic scale: any sequence of notes sounds nice.
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
  const COLORS = ['#f472b6', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#f97316'];

  const curLang = () => {
    let l = 'es';
    try { l = (typeof lang !== 'undefined' && lang) || document.documentElement.lang || 'es'; } catch (e) {}
    return l === 'en' ? 'en' : 'es';
  };
  const muted = () => { try { return localStorage.getItem('ck_sound') === 'off'; } catch (e) { return false; } };

  let actx = null;
  function audio() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function note(freq, start, dur, vol, type) {
    const a = audio();
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, a.currentTime + start);
    g.gain.setValueAtTime(0.0001, a.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.22, a.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
    o.connect(g); g.connect(a.destination);
    o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.05);
  }
  function play(fn) { if (muted()) return; try { fn(); } catch (e) { /* no audio */ } }

  const starNote = step => play(() => {
    const f = SCALE[Math.max(0, Math.min(step, SCALE.length - 1))];
    note(f, 0, 0.25, 0.2); note(f * 2, 0.03, 0.18, 0.06, 'sine');
  });
  const fanfare = () => play(() => [0, 2, 4, 5, 7].forEach((i, k) => note(SCALE[i], k * 0.09, 0.3, 0.2)));
  const chime = () => play(() => [4, 5, 7].forEach((i, k) => note(SCALE[i], k * 0.12, 0.45, 0.18, 'sine')));

  function vibrate(ms) { try { if (!muted() && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Small burst of paper bits from an element.
  function burst(el, n) {
    if (!el || calm()) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < (n || 14); i++) {
      const p = document.createElement('span');
      p.className = 'ckfx-bit';
      const ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 60;
      p.style.cssText = `left:${cx}px;top:${cy}px;background:${COLORS[i % COLORS.length]};` +
        `--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist - 30}px;--rot:${Math.random() * 720 - 360}deg;` +
        (i % 3 === 0 ? 'border-radius:50%;' : '');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  }

  // Confetti falling over the whole screen.
  function rain(n) {
    if (calm()) return;
    for (let i = 0; i < (n || 60); i++) {
      const p = document.createElement('span');
      p.className = 'ckfx-rain';
      p.style.cssText = `left:${Math.random() * 100}vw;background:${COLORS[i % COLORS.length]};` +
        `animation-delay:${Math.random() * 0.6}s;animation-duration:${1.6 + Math.random() * 1.2}s;--rot:${Math.random() * 900}deg;` +
        (i % 4 === 0 ? 'width:8px;height:8px;border-radius:50%;' : '');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 3600);
    }
  }

  function banner(emoji, title, sub) {
    document.querySelectorAll('.ckfx-banner').forEach(b => b.remove());
    const b = document.createElement('div');
    b.className = 'ckfx-banner';
    b.setAttribute('role', 'status');
    b.innerHTML = `<div class="ckfx-banner-emoji">${emoji}</div><div><div class="ckfx-banner-title"></div><div class="ckfx-banner-sub"></div></div>`;
    b.querySelector('.ckfx-banner-title').textContent = title;
    b.querySelector('.ckfx-banner-sub').textContent = sub;
    b.onclick = () => b.remove();
    document.body.appendChild(b);
    setTimeout(() => b.classList.add('ckfx-out'), 2600);
    setTimeout(() => b.remove(), 3100);
  }

  // Called by toggleCheck() after a star is ADDED.
  // info: { ti, d, el, checked (Set of "task-day"), tasks, days, taskName }
  function onStar(info) {
    const { ti, d, checked, tasks, days } = info;
    const kidCell = document.querySelector(`#kidOverlay.active #kd-${ti}-${d}`);
    const src = kidCell || info.el;
    const inDay = Array.from({ length: tasks }, (_, t) => checked.has(`${t}-${d}`)).filter(Boolean).length;
    const total = tasks * days;

    vibrate(25);
    burst(src, kidCell ? 18 : 12);
    if (total > 0 && checked.size >= total) return; // the big celebration takes over

    const dayDone = inDay === tasks;
    const weekDone = Array.from({ length: days }, (_, x) => checked.has(`${ti}-${x}`)).every(Boolean);
    const L = curLang();
    if (dayDone) {
      fanfare(); vibrate([40, 60, 40]); rain(70);
      const day = days === 7 ? DAYS[L][d] : (L === 'es' ? `día ${d + 1}` : `day ${d + 1}`);
      banner('🌟', L === 'es' ? '¡Día completado!' : 'Day complete!',
        L === 'es' ? `¡Hiciste todas tus tareas del ${day}!` : `You did every task on ${day}!`);
    } else if (weekDone) {
      chime(); rain(40);
      const name = info.taskName || '';
      banner('🏅', L === 'es' ? '¡Semana perfecta!' : 'Perfect week!',
        L === 'es' ? `${name ? '«' + name + '» ' : ''}todos los días. ¡Bravo!` : `${name ? '“' + name + '” ' : ''}every single day. Bravo!`);
    } else {
      starNote(inDay - 1);
    }
  }

  function toggleMute() {
    try { localStorage.setItem('ck_sound', muted() ? 'on' : 'off'); } catch (e) {}
    document.querySelectorAll('.ckfx-mute').forEach(b => { b.textContent = muted() ? '🔇' : '🔊'; });
    if (!muted()) starNote(2);
  }
  const muteButton = () => `<button type="button" class="ckfx-mute" onclick="ckFx.toggleMute()" aria-label="${curLang() === 'es' ? 'Sonido' : 'Sound'}">${muted() ? '🔇' : '🔊'}</button>`;

  window.ckFx = { onStar, muted, toggleMute, muteButton, burst, rain, banner };

  const css = document.createElement('style');
  css.textContent = `
  .ckfx-bit{position:fixed;z-index:10001;width:9px;height:6px;pointer-events:none;border-radius:2px;
    animation:ckfxBit .85s cubic-bezier(.2,.7,.4,1) forwards}
  @keyframes ckfxBit{0%{transform:translate(-50%,-50%) rotate(0);opacity:1}
    100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy) + 40px)) rotate(var(--rot));opacity:0}}
  .ckfx-rain{position:fixed;top:-12px;z-index:10001;width:9px;height:14px;pointer-events:none;border-radius:2px;
    animation:ckfxRain 2s linear forwards}
  @keyframes ckfxRain{0%{transform:translateY(0) rotate(0);opacity:1}90%{opacity:1}100%{transform:translateY(105vh) rotate(var(--rot));opacity:0}}
  .ckfx-banner{position:fixed;left:50%;top:84px;z-index:10002;transform:translateX(-50%);display:flex;align-items:center;gap:12px;
    padding:14px 22px;border-radius:22px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;
    box-shadow:0 12px 40px rgba(124,58,237,.45);font-family:'Nunito',sans-serif;cursor:pointer;max-width:calc(100vw - 32px);
    animation:ckfxIn .5s cubic-bezier(.2,1.4,.4,1)}
  .ckfx-banner.ckfx-out{animation:ckfxOut .45s ease forwards}
  .ckfx-banner-emoji{font-size:2.4rem;animation:ckfxSpin 1s ease}
  .ckfx-banner-title{font-family:'Fredoka One',cursive;font-size:1.35rem;line-height:1.1}
  .ckfx-banner-sub{font-weight:700;font-size:.9rem;opacity:.95}
  @keyframes ckfxIn{0%{transform:translateX(-50%) translateY(-30px) scale(.6);opacity:0}100%{transform:translateX(-50%);opacity:1}}
  @keyframes ckfxOut{to{transform:translateX(-50%) translateY(-20px) scale(.9);opacity:0}}
  @keyframes ckfxSpin{0%{transform:scale(.3) rotate(-90deg)}70%{transform:scale(1.3) rotate(10deg)}100%{transform:none}}
  .ckfx-mute{position:fixed;top:14px;left:14px;z-index:10000;width:44px;height:44px;border-radius:50%;border:none;
    background:rgba(255,255,255,.85);font-size:1.3rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}
  @media (prefers-reduced-motion:reduce){.ckfx-banner,.ckfx-banner-emoji{animation:none}}`;
  document.head.appendChild(css);
})();
