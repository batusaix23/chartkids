// Service Worker para ChartKids — funciona sin internet.
//  • Al instalarse guarda la app, los juegos, las historias (lector), las actividades y
//    los archivos que usan (CORE). Si uno falla, los demás se guardan igual.
//  • Páginas y archivos visitados se guardan en RUNTIME (máximo RUNTIME_MAX, los más
//    viejos salen), así las fichas que ya abriste también se ven sin internet.
//  • Sin internet y sin copia guardada → /offline.html (qué sí funciona sin conexión).
//  • Las llamadas a la IA (/api/) nunca se guardan.
const CACHE_NAME = 'chartkids-v67';
const RUNTIME = 'chartkids-runtime-v1';
const RUNTIME_MAX = 150;
const CORE = [
  '/', '/index.html', '/offline.html',
  '/juegos.html', '/historias.html', '/actividades.html', '/actividad-semana.html', '/recompensas.html',
  '/imprime-y-juega.html', '/blog.html', '/terms.html', '/privacy.html', '/support.html',
  '/ck-nav.js', '/ck-explore.js',
  '/js/fiesta.js', '/js/mascota.js', '/js/voz.js', '/js/cuento.js', '/js/cofre.js', '/js/album.js',
  '/js/resumen.js', '/js/chat-rapido.js', '/js/equipo.js', '/js/premio-dibujo.js', '/js/juegos.js',
  '/js/kid-safe.js', '/js/progreso.js', '/js/actividades-respaldo.js',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(CORE.map(u => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME && n !== RUNTIME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

async function trim() {
  const cache = await caches.open(RUNTIME);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - RUNTIME_MAX; i++) await cache.delete(keys[i]);
}

async function store(request, response) {
  if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) return;
  const core = await caches.open(CACHE_NAME);
  if (await core.match(request, { ignoreSearch: true })) { await core.put(request, response); return; }
  const cache = await caches.open(RUNTIME);
  await cache.put(request, response);
  await trim();
}

// Cache first (fast, works offline), refreshed in the background.
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.startsWith('/api/') || url.hostname.endsWith('workers.dev')) return;

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
    const network = fetch(req).then(res => { event.waitUntil(store(req, res.clone())); return res; }).catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') return (await caches.match('/offline.html')) || Response.error();
    return Response.error();
  })());
});
