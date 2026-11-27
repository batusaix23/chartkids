// js/uso.js — anonymous usage counts, so we know which parts of ChartKids families use.
// What is sent: a list like [["pagina","juegos"],["juego","memo-facil"]] plus the
// language. Nothing else: no name, no ID, no cookie, nothing from the charts.
// Respects "Do Not Track" / Global Privacy Control, and never runs on localhost unless
// ?uso=local is in the URL (for testing). Sent in one small beacon when the page is left.
// Loaded on every page by ck-nav.js. Other code may call ckUso('evento', 'detalle').
(function () {
  'use strict';
  if (window.ckUso) return;
  const ENDPOINT = 'https://chartkids.com/api/uso';
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const off = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true ||
    (local && !/[?&]uso=local\b/.test(location.search)) || location.protocol === 'file:';
  const queue = [];
  const clean = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

  function ckUso(evento, detalle) {
    if (off || queue.length >= 25) return;
    queue.push([clean(evento), clean(detalle)]);
  }
  ckUso.queue = queue;
  ckUso.off = off;

  function flush() {
    if (!queue.length) return;
    let lang = 'es';
    try { lang = localStorage.getItem('ck_lang') === 'en' ? 'en' : 'es'; } catch (e) {}
    const body = JSON.stringify({ l: lang, e: queue.splice(0, 25) });
    try {
      const blob = new Blob([body], { type: 'text/plain' });   // "simple" request: no preflight
      if (!(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob))) {
        fetch(ENDPOINT, { method: 'POST', body, keepalive: true, mode: 'no-cors' }).catch(() => {});
      }
    } catch (e) {}
  }
  ckUso.flush = flush;
  window.ckUso = ckUso;

  // Which section is this page? Item sheets live in folders (/maze/<slug>/) → "ficha-maze".
  function section() {
    const p = location.pathname.replace(/index\.html$/, '');
    if (p === '/' || p === '') return 'inicio';
    const parts = p.split('/').filter(Boolean);
    if (parts.length >= 2 && !/\.html$/.test(parts[parts.length - 1])) return 'ficha-' + parts[0];
    return parts[parts.length - 1].replace(/\.html$/, '');
  }
  ckUso('pagina', section());

  addEventListener('beforeprint', () => ckUso('imprimir', section()));
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  addEventListener('pagehide', flush);

  // Count the shared features where they are opened (buttons call window.ckX.open()).
  const wrap = (obj, fn, evento) => {
    const o = window[obj];
    if (!o || typeof o[fn] !== 'function' || o[fn].__uso) return;
    const orig = o[fn];
    o[fn] = function () { ckUso(evento, section()); return orig.apply(this, arguments); };
    o[fn].__uso = true;
  };
  function hook() {
    wrap('ckCofre', 'open', 'cofre');
    wrap('ckAlbum', 'open', 'album');
    wrap('ckCuento', 'open', 'cuento');
    wrap('ckResumen', 'open', 'resumen');
    wrap('ckPremioDibujo', 'open', 'premio');
  }
  if (document.readyState === 'complete') hook(); else addEventListener('load', hook);
})();
