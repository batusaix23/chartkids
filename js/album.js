// js/album.js — "Mi álbum de stickers": the stickers won in the surprise chest
// (js/cofre.js) glued into an album. Two pages:
//   • Amigos y aventuras — 24 stickers (ckCofre.STICKERS), for everyone
//   • Colección Dorada 👑 — 12 golden stickers (ckCofre.GOLD), Premium only; shown
//     locked to free users
// Missing stickers show as a mystery silhouette. Tapping a sticker makes it jump and
// says its name (js/voz.js). Completing a page is celebrated once.
// Reads localStorage ck_stickers = [{ id, date }] (duplicates allowed) and
// chartkids_premium; writes ck_album_done = ["normal" | "gold"]. No AI, no network.
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
  const premium = () => { try { return localStorage.getItem('chartkids_premium') === 'true'; } catch (e) { return false; } };
  const lists = () => ({ normal: (window.ckCofre && ckCofre.STICKERS) || [], gold: (window.ckCofre && ckCofre.GOLD) || [] });

  function counts() {
    const c = {};
    get('ck_stickers', []).forEach(s => { c[s.id] = (c[s.id] || 0) + 1; });
    return c;
  }
  function total() {
    const c = counts(), L = lists();
    return { have: L.normal.filter(s => c[s[0]]).length, of: L.normal.length };
  }

  let page = 'normal';

  function pageHTML() {
    const es = curLang() === 'es', c = counts(), L = lists();
    const list = L[page];
    const locked = page === 'gold' && !premium();
    const have = list.filter(s => c[s[0]]).length;
    const pct = list.length ? Math.round((have / list.length) * 100) : 0;
    const slots = list.map(([id, emoji, nes, nen]) => {
      const n = c[id] || 0, name = es ? nes : nen;
      if (!n) return `<div class="cka-slot cka-missing"><span class="cka-emoji">${emoji}</span><small>?</small></div>`;
      return `<button type="button" class="cka-slot cka-have${page === 'gold' ? ' cka-gold' : ''}" data-name="${esc(name)}">
        <span class="cka-emoji">${emoji}</span><small>${esc(name)}</small>${n > 1 ? `<b class="cka-dup">×${n}</b>` : ''}</button>`;
    }).join('');
    const done = !locked && have === list.length && list.length > 0;
    return `
      <div class="cka-tabs">
        <button type="button" class="cka-tab${page === 'normal' ? ' on' : ''}" data-page="normal">🐾 ${es ? 'Amigos y aventuras' : 'Friends & adventures'}</button>
        <button type="button" class="cka-tab${page === 'gold' ? ' on' : ''}" data-page="gold">👑 ${es ? 'Colección Dorada' : 'Golden Collection'}</button>
      </div>
      <div class="cka-progress"><div class="cka-bar"><div style="width:${pct}%"></div></div><span>${have} / ${list.length}</span></div>
      ${done ? `<div class="cka-done">🏆 ${es ? '¡Página completa! ¡Eres un gran coleccionista!' : 'Page complete! You are a great collector!'}</div>` : ''}
      ${locked ? `<div class="cka-lock"><div>🔒</div><b>${es ? 'Colección Dorada para Premium' : 'Golden Collection for Premium'}</b>
        <span>${es ? 'Con Premium, el cofre también trae stickers dorados.' : 'With Premium, the chest also brings golden stickers.'}</span>
        <a href="/premium.html" class="cka-btn">👑 ${es ? 'Ver Premium' : 'See Premium'}</a></div>` : ''}
      <div class="cka-grid${locked ? ' cka-locked' : ''}">${slots}</div>
      <div class="cka-hint">${es ? '🎁 Gana stickers abriendo el cofre sorpresa de cada semana.' : '🎁 Win stickers by opening the weekly surprise chest.'}</div>`;
  }

  function celebrateIfDone() {
    const c = counts(), L = lists(), done = get('ck_album_done', []);
    for (const key of ['normal', 'gold']) {
      if (key === 'gold' && !premium()) continue;
      const list = L[key];
      if (list.length && list.every(s => c[s[0]]) && !done.includes(key)) {
        done.push(key); set('ck_album_done', done);
        const es = curLang() === 'es';
        if (window.ckFx) { ckFx.rain(100); ckFx.banner('🏆', es ? '¡Álbum completo!' : 'Album complete!', es ? '¡Juntaste todos los stickers!' : 'You collected every sticker!'); }
        if (typeof playWinSound === 'function') playWinSound();
      }
    }
  }

  function render(m) { m.querySelector('.cka-body').innerHTML = pageHTML(); }

  function open(startPage) {
    page = startPage === 'gold' ? 'gold' : 'normal';
    const es = curLang() === 'es';
    document.getElementById('cka-modal')?.remove();
    document.getElementById('ckcf-modal')?.remove();   // opened from the chest prize
    const m = document.createElement('div');
    m.id = 'cka-modal';
    m.innerHTML = `<div class="cka-box" role="dialog" aria-modal="true">
      <button type="button" class="cka-x" aria-label="${es ? 'Cerrar' : 'Close'}">×</button>
      <div class="cka-title">🏷️ ${es ? 'Mi álbum de stickers' : 'My sticker album'}</div>
      <div class="cka-body"></div></div>`;
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('.cka-x')) { m.remove(); return; }
      const tab = e.target.closest('[data-page]');
      if (tab) { page = tab.dataset.page; render(m); return; }
      const st = e.target.closest('.cka-have');
      if (st) {
        st.classList.remove('cka-jump'); void st.offsetWidth; st.classList.add('cka-jump');
        if (window.ckVoz) ckVoz.speak(st.dataset.name, curLang());
      }
    });
    document.body.appendChild(m);
    render(m);
    celebrateIfDone();
  }

  // App button label: "Álbum 5/24".
  function refresh() {
    const t = total(), es = curLang() === 'es';
    document.querySelectorAll('.cka-count').forEach(el => { el.textContent = `${es ? 'Álbum' : 'Album'} ${t.have}/${t.of}`; });
  }
  const kidButton = () => `<button type="button" class="cka-kid" onclick="ckAlbum.open()" aria-label="${curLang() === 'es' ? 'Álbum' : 'Album'}">🏷️</button>`;

  window.ckAlbum = { open, refresh, kidButton, celebrateIfDone, total };

  const css = document.createElement('style');
  css.textContent = `
  #cka-modal{position:fixed;inset:0;z-index:10010;background:rgba(10,8,25,.82);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Nunito',sans-serif}
  .cka-box{position:relative;background:linear-gradient(180deg,#fff7e6,#fdf2ff);color:#3b2a5a;border-radius:26px;padding:20px 18px 18px;width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.45)}
  .cka-x{position:absolute;top:8px;right:12px;background:none;border:none;color:#9ca3af;font-size:1.8rem;cursor:pointer;line-height:1}
  .cka-title{font-family:'Fredoka One',cursive;font-size:1.5rem;color:#6d28d9;text-align:center;margin-bottom:10px}
  .cka-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px}
  .cka-tab{padding:8px 14px;border-radius:50px;border:2px solid #e9d5ff;background:#fff;color:#4c1d95;font:800 .88rem 'Nunito',sans-serif;cursor:pointer}
  .cka-tab.on{background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border-color:transparent}
  .cka-progress{display:flex;align-items:center;gap:10px;margin:4px 4px 12px;font-weight:900;color:#6d28d9}
  .cka-bar{flex:1;height:12px;border-radius:12px;background:#ede9fe;overflow:hidden}
  .cka-bar>div{height:100%;background:linear-gradient(90deg,#a78bfa,#f472b6,#fbbf24);border-radius:12px;transition:width .5s}
  .cka-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px}
  .cka-slot{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:108px;padding:8px 4px;border-radius:18px;border:2px dashed #e9d5ff;background:rgba(255,255,255,.6);font-family:'Nunito',sans-serif}
  .cka-slot small{font-weight:800;font-size:.72rem;line-height:1.15;text-align:center;color:#4c1d95}
  .cka-emoji{font-size:2.7rem;line-height:1.1}
  .cka-missing .cka-emoji{filter:brightness(0);opacity:.13}
  .cka-missing small{color:#c4b5fd;font-size:1rem}
  .cka-have{border:3px solid #fff;background:#fff;box-shadow:0 4px 12px rgba(124,58,237,.18);cursor:pointer;transform:rotate(-2deg)}
  .cka-have:nth-child(even){transform:rotate(2deg)}
  .cka-gold{background:linear-gradient(135deg,#fef3c7,#fde68a);box-shadow:0 4px 14px rgba(245,158,11,.4)}
  .cka-dup{position:absolute;top:4px;right:6px;background:#f472b6;color:#fff;font-size:.68rem;padding:1px 6px;border-radius:10px}
  .cka-jump{animation:ckaJump .5s ease}
  @keyframes ckaJump{0%,100%{transform:scale(1)}40%{transform:scale(1.25) rotate(-6deg)}70%{transform:scale(.95)}}
  .cka-locked .cka-slot{opacity:.5}
  .cka-lock{text-align:center;margin:0 0 12px;padding:14px;border-radius:18px;background:#fff;border:2px solid #fde68a}
  .cka-lock div{font-size:2rem}.cka-lock b{display:block;color:#92400e}.cka-lock span{display:block;font-weight:700;font-size:.88rem;margin:4px 0 8px}
  .cka-btn{display:inline-block;padding:8px 16px;border-radius:50px;background:linear-gradient(135deg,#f59e0b,#ec4899);color:#fff;font-weight:900;text-decoration:none}
  .cka-done{text-align:center;font-weight:900;color:#92400e;background:#fef3c7;border-radius:14px;padding:8px;margin-bottom:10px}
  .cka-hint{text-align:center;font-weight:800;color:#7c6f99;font-size:.85rem;margin-top:12px}
  .cka-kid{position:fixed;top:14px;left:170px;z-index:10000;width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,.85);font-size:1.3rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}
  @media (prefers-reduced-motion:reduce){.cka-jump{animation:none}}`;
  document.head.appendChild(css);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();
})();
