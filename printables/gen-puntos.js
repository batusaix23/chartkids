'use strict';
// printables/gen-puntos.js — 100 connect-the-dots sheets with answer keys.
// Needs the FLUX helper for images not yet cached:
//   npx wrangler dev printables/flux-worker.js --port 8788
// Run: node printables/gen-puntos.js
//
// Pipeline per subject: FLUX draws a solid black silhouette → threshold → morphological
// opening removes thin strokes (strings, whiskers) → largest blob → trace its outer
// contour → simplify to the target number of dots → place numbers outside the shape
// without collisions. Sheets that fail any check are reported and not written.

const sharp = require('sharp');
const L = require('./lib');
const { ensureImages } = require('./flux-batch');

// [slug, es, en, subject for FLUX, diff]
const SUBJECTS = [
  // ── fácil (15 puntos) ──
  ['connect-the-apple-dots', 'La Manzana', 'Apple', 'an apple with a leaf', 'facil'],
  ['connect-the-fish-bowl-dots', 'El Pez', 'Fish', 'a cartoon fish', 'facil'],
  ['connect-the-sun-dots', 'El Sol', 'Sun', 'a cartoon sun: a circle surrounded by eight big thick pointed triangle rays', 'facil'],
  ['connect-the-ice-cream-dots', 'El Helado', 'Ice Cream', 'an ice cream cone with two round scoops on a big waffle cone', 'facil'],
  ['connect-the-tree-dots', 'El Árbol', 'Tree', 'a tree with a big round fluffy crown on a thick short trunk', 'facil'],
  ['connect-the-pumpkin-dots', 'La Calabaza', 'Pumpkin', 'a pumpkin with a short stem', 'facil'],
  ['connect-the-easter-egg-dots', 'El Huevo de Pascua', 'Easter Egg', 'an egg standing upright', 'facil'],
  ['connect-the-christmas-tree-dots', 'El Árbol de Navidad', 'Christmas Tree', 'a christmas tree with a star on top', 'facil'],
  ['connect-the-cake-dots', 'El Pastel', 'Cake', 'a birthday cake with three candles', 'facil'],
  ['connect-the-snowman-dots', 'El Muñeco de Nieve', 'Snowman', 'a snowman with a top hat', 'facil'],
  ['connect-the-car-dots', 'El Carro', 'Car', 'a chunky cartoon car with big round wheels, side view', 'facil'],
  ['connect-the-rocket-dots', 'El Cohete', 'Rocket', 'a cartoon rocket standing upright with fins', 'facil'],
  ['connect-the-flower-dots', 'La Flor', 'Flower', 'a tulip flower with a thick stem and two big leaves', 'facil'],
  ['connect-the-rainbow-dots', 'El Arcoíris', 'Rainbow', 'a thick rainbow arch with a cloud at each end', 'facil'],
  ['connect-the-pizza-dots', 'La Pizza', 'Pizza', 'a triangular pizza wedge, food', 'facil'],
  ['puntos-corazon', 'El Corazón', 'Heart', 'a heart shape', 'facil'],
  ['puntos-estrella', 'La Estrella', 'Star', 'a five-pointed star', 'facil'],
  ['puntos-casa', 'La Casa', 'House', 'a simple house with a chimney', 'facil'],
  ['puntos-barco', 'El Barquito', 'Little Boat', 'a toy boat with one triangular sail', 'facil'],
  ['puntos-globo', 'El Globo', 'Balloon', 'a round balloon with a short tied end', 'facil'],
  ['puntos-hongo', 'El Hongo', 'Mushroom', 'a cartoon mushroom with a round cap', 'facil'],
  ['puntos-pera', 'La Pera', 'Pear', 'a big pear fruit with a stem and one leaf', 'facil'],
  ['puntos-taza', 'La Taza', 'Cup', 'a big coffee mug with a round handle, side view', 'facil'],
  ['puntos-nube', 'La Nube', 'Cloud', 'a fluffy cloud', 'facil'],
  ['puntos-luna', 'La Luna', 'Moon', 'a crescent moon', 'facil'],
  ['puntos-hoja', 'La Hoja', 'Leaf', 'a maple leaf', 'facil'],
  ['puntos-paleta', 'La Paleta', 'Lollipop', 'a round lollipop on a stick', 'facil'],
  ['puntos-campana', 'La Campana', 'Bell', 'a bell', 'facil'],
  ['puntos-gota', 'La Gota', 'Water Drop', 'a water drop', 'facil'],
  ['puntos-cometa', 'La Cometa', 'Kite', 'a diamond kite with a short tail', 'facil'],
  ['puntos-regalo', 'El Regalo', 'Gift', 'a square gift box, front view, with a big ribbon bow on the top', 'facil'],
  ['puntos-sombrero', 'El Sombrero', 'Hat', 'a cowboy hat', 'facil'],
  ['puntos-fresa', 'La Fresa', 'Strawberry', 'a strawberry with leaves on top', 'facil'],
  ['puntos-zanahoria', 'La Zanahoria', 'Carrot', 'a carrot with leaves', 'facil'],
  // ── medio (30 puntos) ──
  ['connect-the-kitten-dots', 'El Gatito', 'Kitten', 'a cat sitting', 'medio'],
  ['connect-the-puppy-dots', 'El Perrito', 'Puppy', 'a puppy sitting', 'medio'],
  ['connect-the-rabbit-dots', 'El Conejo', 'Rabbit', 'a rabbit sitting with tall ears', 'medio'],
  ['connect-the-elephant-dots', 'El Elefante', 'Elephant', 'an elephant walking, side view', 'medio'],
  ['connect-the-whale-dots', 'La Ballena', 'Whale', 'a whale, side view', 'medio'],
  ['connect-the-dolphin-dots', 'El Delfín', 'Dolphin', 'a dolphin jumping', 'medio'],
  ['connect-the-butterfly-dots', 'La Mariposa', 'Butterfly', 'a butterfly with open wings, top view', 'medio'],
  ['connect-the-airplane-dots', 'El Avión', 'Airplane', 'an airplane, side view', 'medio'],
  ['connect-the-train-dots', 'El Tren', 'Train', 'a chunky cartoon toy train engine with a chimney, side view', 'medio'],
  ['connect-the-fire-truck-dots', 'El Camión de Bomberos', 'Fire Truck', 'a chunky cartoon fire truck with a ladder on top, side view', 'medio'],
  ['connect-the-castle-dots', 'El Castillo', 'Castle', 'a castle with three towers', 'medio'],
  ['connect-the-ufo-dots', 'El Platillo Volador', 'UFO', 'a flying saucer', 'medio'],
  ['connect-the-planet-dots', 'El Planeta', 'Planet', 'the planet saturn: a ball with one thick wide ring, tilted', 'medio'],
  ['connect-the-robot-dots', 'El Robot', 'Robot', 'a boxy toy robot standing', 'medio'],
  ['connect-the-mountain-dots', 'La Montaña', 'Mountain', 'a mountain range with two peaks', 'medio'],
  ['connect-the-parrot-dots', 'El Loro', 'Parrot', 'a parrot perched, side view', 'medio'],
  ['connect-the-alien-dots', 'El Extraterrestre', 'Alien', 'a cute cartoon alien with antennae', 'medio'],
  ['connect-the-spaceship-dots', 'La Nave Espacial', 'Spaceship', 'a cartoon spaceship', 'medio'],
  ['connect-the-unicorn-dots', 'El Unicornio', 'Unicorn', 'a unicorn head with mane and horn', 'medio'],
  ['puntos-rana', 'La Rana', 'Frog', 'a frog sitting, front view', 'medio'],
  ['puntos-gallina', 'La Gallina', 'Hen', 'a hen standing, side view', 'medio'],
  ['puntos-zorro', 'El Zorro', 'Fox', 'a fox sitting with a big bushy tail, side view', 'medio'],
  ['puntos-tortuga', 'La Tortuga', 'Turtle', 'a turtle walking, side view', 'medio'],
  ['puntos-pato', 'El Pato', 'Duck', 'a duck, side view', 'medio'],
  ['puntos-caracol', 'El Caracol', 'Snail', 'a snail, side view', 'medio'],
  ['puntos-pinguino', 'El Pingüino', 'Penguin', 'a penguin standing', 'medio'],
  ['puntos-buho', 'El Búho', 'Owl', 'an owl sitting, front view', 'medio'],
  ['puntos-ardilla', 'La Ardilla', 'Squirrel', 'a squirrel sitting with a big tail', 'medio'],
  ['puntos-cerdito', 'El Cerdito', 'Piglet', 'a pig standing, side view', 'medio'],
  ['puntos-oso', 'El Oso', 'Bear', 'a teddy bear sitting, front view, round ears, arms and legs', 'medio'],
  ['puntos-helicoptero', 'El Helicóptero', 'Helicopter', 'a helicopter, side view', 'medio'],
  ['puntos-tractor', 'El Tractor', 'Tractor', 'a chunky cartoon farm tractor with a big back wheel, side view', 'medio'],
  ['puntos-guitarra', 'La Guitarra', 'Guitar', 'an acoustic guitar standing upright, front view', 'medio'],
  // ── difícil (55 puntos) ──
  ['connect-the-lion-dots', 'El León', 'Lion', 'a lion standing, side view', 'dificil'],
  ['connect-the-tiger-dots', 'El Tigre', 'Tiger', 'a tiger walking, side view', 'dificil'],
  ['connect-the-eagle-dots', 'El Águila', 'Eagle', 'an eagle flying with wide spread wings, front view', 'dificil'],
  ['connect-the-t-rex-dots', 'El T-Rex', 'T-Rex', 'a tyrannosaurus rex, side view', 'dificil'],
  ['connect-the-stegosaurus-dots', 'El Estegosaurio', 'Stegosaurus', 'a stegosaurus, side view', 'dificil'],
  ['connect-the-triceratops-dots', 'El Triceratops', 'Triceratops', 'a triceratops, side view', 'dificil'],
  ['connect-the-brachiosaurus-dots', 'El Braquiosaurio', 'Brachiosaurus', 'a brachiosaurus with a long neck, side view', 'dificil'],
  ['connect-the-pterodactyl-dots', 'El Pterodáctilo', 'Pterodactyl', 'a pterodactyl flying', 'dificil'],
  ['connect-the-dragon-dots', 'El Dragón', 'Dragon', 'a friendly dragon standing with wings', 'dificil'],
  ['connect-the-mermaid-dots', 'La Sirena', 'Mermaid', 'a mermaid sitting', 'dificil'],
  ['connect-the-fairy-dots', 'El Hada', 'Fairy', 'a fairy with wings', 'dificil'],
  ['connect-the-princess-dots', 'La Princesa', 'Princess', 'a princess in a long gown with a crown', 'dificil'],
  ['connect-the-astronaut-dots', 'El Astronauta', 'Astronaut', 'an astronaut standing in a space suit', 'dificil'],
  ['connect-the-superhero-dots', 'El Superhéroe', 'Superhero', 'a superhero kid flying with a cape', 'dificil'],
  ['connect-the-santa-dots', 'Santa Claus', 'Santa Claus', 'santa claus standing, front view, round belly', 'dificil'],
  ['connect-the-firefighter-dots', 'El Bombero', 'Firefighter', 'a firefighter with a helmet standing', 'dificil'],
  ['connect-the-chef-dots', 'El Chef', 'Chef', 'a chef with a tall hat holding a pan', 'dificil'],
  ['connect-the-doctor-dots', 'El Doctor', 'Doctor', 'a doctor standing with a stethoscope', 'dificil'],
  ['connect-the-pilot-dots', 'El Piloto', 'Pilot', 'a pilot standing with a cap', 'dificil'],
  ['connect-the-scientist-dots', 'La Científica', 'Scientist', 'a scientist holding a flask', 'dificil'],
  ['connect-the-runner-dots', 'El Corredor', 'Runner', 'a child running', 'dificil'],
  ['connect-the-gymnast-dots', 'La Gimnasta', 'Gymnast', 'a gymnast doing a split jump', 'dificil'],
  ['connect-the-skater-dots', 'El Patinador', 'Skater', 'a kid on a skateboard', 'dificil'],
  ['connect-the-hero-dots', 'El Caballero', 'Knight', 'a knight with a shield, no weapon', 'dificil'],
  ['connect-the-cape-dots', 'El Mago', 'Wizard', 'a wizard with a pointy hat and robe', 'dificil'],
  ['puntos-koala', 'El Koala', 'Koala', 'a koala hugging a thick tree branch', 'dificil'],
  ['puntos-jirafa', 'La Jirafa', 'Giraffe', 'a giraffe standing, side view', 'dificil'],
  ['puntos-caballo', 'El Caballo', 'Horse', 'a horse galloping, side view', 'dificil'],
  ['puntos-canguro', 'El Canguro', 'Kangaroo', 'a kangaroo standing, side view', 'dificil'],
  ['puntos-cocodrilo', 'El Cocodrilo', 'Crocodile', 'a crocodile, side view', 'dificil'],
  ['puntos-pulpo', 'El Pulpo', 'Octopus', 'an octopus with curly tentacles', 'dificil'],
  ['puntos-flamenco', 'El Flamenco', 'Flamingo', 'a flamingo standing on one leg', 'dificil'],
  ['puntos-ciervo', 'El Ciervo', 'Deer', 'a deer with antlers, side view', 'dificil'],
];

const LEVEL = {
  facil:   { dots: 20, age: '3-5', font: 22, r: 7 },
  medio:   { dots: 30, age: '6-8', font: 18, r: 6 },
  dificil: { dots: 55, age: '9-12', font: 14, r: 5 },
};

const prompt = s => `solid black silhouette of ${s}, one single simple compact shape filled completely black, ` +
  `centered with lots of white margin, plain pure white background, no details, no outline, no text, ` +
  `no shadow, no ground, no grass, no smoke, no strings, no thin lines`;

// ── image → contour ─────────────────────────────────────────
async function loadMask(file, size = 512) {
  const { data } = await sharp(file).resize(size, size, { fit: 'contain', background: '#fff' })
    .flatten({ background: '#fff' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const m = new Uint8Array(size * size);
  for (let i = 0; i < m.length; i++) m[i] = data[i] < 128 ? 1 : 0;
  return { m, size };
}
function morph(mask, size, r, erode) {
  // Separable square structuring element: horizontal pass then vertical pass.
  const tmp = new Uint8Array(size * size), out = new Uint8Array(size * size);
  const pass = (src, dst, horiz) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let v = erode ? 1 : 0;
      for (let k = -r; k <= r; k++) {
        const xx = horiz ? x + k : x, yy = horiz ? y : y + k;
        const s = (xx < 0 || yy < 0 || xx >= size || yy >= size) ? 0 : src[yy * size + xx];
        if (erode ? !s : s) { v = erode ? 0 : 1; break; }
      }
      dst[y * size + x] = v;
    }
  };
  pass(mask, tmp, true); pass(tmp, out, false);
  return out;
}
function largestBlob(mask, size) {
  const label = new Int32Array(size * size).fill(-1);
  let best = -1, bestN = 0, id = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || label[i] !== -1) continue;
    let n = 0; const st = [i]; label[i] = id;
    while (st.length) {
      const p = st.pop(); n++;
      const x = p % size, y = (p / size) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy, q = yy * size + xx;
        if (xx >= 0 && yy >= 0 && xx < size && yy < size && mask[q] && label[q] === -1) { label[q] = id; st.push(q); }
      }
    }
    if (n > bestN) { bestN = n; best = id; }
    id++;
  }
  const out = new Uint8Array(size * size);
  for (let i = 0; i < out.length; i++) out[i] = label[i] === best ? 1 : 0;
  return { blob: out, area: bestN };
}
// Moore-neighbour tracing of the blob's outer boundary (clockwise in screen coords).
function trace(blob, size) {
  const at = (x, y) => x >= 0 && y >= 0 && x < size && y < size && blob[y * size + x];
  let start = -1;
  for (let i = 0; i < blob.length && start < 0; i++) if (blob[i]) start = i;
  const sx = start % size, sy = (start / size) | 0;
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const pts = [[sx, sy]];
  let x = sx, y = sy, d = 6; // came from above
  for (let guard = 0; guard < size * size; guard++) {
    let found = false;
    for (let k = 0; k < 8; k++) {
      const nd = (d + 6 + k) % 8;  // start looking left of previous direction
      const nx = x + dirs[nd][0], ny = y + dirs[nd][1];
      if (at(nx, ny)) { x = nx; y = ny; d = nd; found = true; break; }
    }
    if (!found || (x === sx && y === sy)) break;
    pts.push([x, y]);
  }
  return pts;
}
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const len = Math.hypot(bx - ax, by - ay) || 1;
  let idx = 0, max = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
}
// Closed contour → about `n` points: RDP keeps the corners that make it recognisable;
// then long edges are split so dots stay evenly spread.
function simplify(contour, n) {
  // A closed curve starts and ends on the same point, which breaks plain RDP. Split it
  // at the point farthest from the start and simplify the two open halves.
  const [sx, sy] = contour[0];
  let far = 0, fd = 0;
  contour.forEach(([x, y], i) => { const d = Math.hypot(x - sx, y - sy); if (d > fd) { fd = d; far = i; } });
  const halfA = contour.slice(0, far + 1), halfB = contour.slice(far).concat([contour[0]]);
  const run = eps => rdp(halfA, eps).slice(0, -1).concat(rdp(halfB, eps).slice(0, -1));
  let lo = 0.3, hi = 80, best = run(hi);
  for (let i = 0; i < 30; i++) {
    const eps = (lo + hi) / 2;
    const s = run(eps);
    if (s.length > n) lo = eps; else { hi = eps; best = s; }
  }
  let pts = best;
  while (pts.length < n) {               // split the longest edge
    let li = 0, ld = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d > ld) { ld = d; li = i; }
    }
    const a = pts[li], b = pts[(li + 1) % pts.length];
    pts.splice(li + 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }
  return pts;
}

// ── sheet ───────────────────────────────────────────────────
function layout(pts, lv) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const boxW = L.W - 160, boxH = L.BODY_BOTTOM - L.BODY_TOP - 120;
  const k = Math.min(boxW / (maxX - minX), boxH / (maxY - minY));
  const ox = (L.W - (maxX - minX) * k) / 2, oy = L.BODY_TOP + 60 + (boxH - (maxY - minY) * k) / 2;
  let P = pts.map(([x, y]) => [ox + (x - minX) * k, oy + (y - minY) * k]);
  // Start at the top-most dot so "1" is easy to find.
  const top = P.reduce((bi, p, i) => (p[1] < P[bi][1] ? i : bi), 0);
  P = P.slice(top).concat(P.slice(0, top));
  const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length;

  // Keep dots apart: drop one of any pair closer than minGap, then refill the count
  // by splitting the longest edge. Dots that are close but not neighbours (e.g. two
  // legs) only need to be clearly separate, so they get a smaller limit.
  const fs = lv.font, minGap = Math.max(lv.r * 2 + 6, fs * 1.1);
  const n = P.length;
  for (let round = 0; round < 200; round++) {
    let bad = -1;
    for (let i = 0; i < P.length && bad < 0; i++) {
      for (let j = i + 1; j < P.length; j++) {
        const neighbours = j === i + 1 || (i === 0 && j === P.length - 1);
        const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
        if (d < (neighbours ? minGap : lv.r * 2 + 8)) { bad = j === 0 ? i : j; break; }
      }
    }
    if (bad < 0 && P.length === n) break;
    if (bad > 0) P.splice(bad, 1);
    while (P.length < n) {
      let li = 0, ld = 0;
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (d > ld) { ld = d; li = i; }
      }
      const a = P[li], b = P[(li + 1) % P.length];
      P.splice(li + 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    }
    if (round === 199) return { fail: 'puntos demasiado juntos' };
  }

  // Labels: try positions around each dot, outward first; never overlap another
  // label, a dot, or the outline itself.
  const placed = [];
  const circleHitsBox = (px, py, r, b) => {
    const qx = Math.max(b[0], Math.min(px, b[2])), qy = Math.max(b[1], Math.min(py, b[3]));
    return Math.hypot(px - qx, py - qy) < r;
  };
  const segDist = (px, py) => {
    let m = Infinity;
    for (let i = 0; i < P.length; i++) {
      const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length];
      const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
      m = Math.min(m, Math.hypot(px - ax - t * dx, py - ay - t * dy));
    }
    return m;
  };
  const labels = [];
  for (let i = 0; i < P.length; i++) {
    const [x, y] = P[i];
    const base = Math.atan2(y - cy, x - cx);
    const txt = String(i + 1), w = txt.length * fs * 0.62, h = fs;
    let ok = null;
    for (const dist of [lv.r + Math.max(w, h) * 0.6 + 2, lv.r + Math.max(w, h) * 0.9 + 4, lv.r + Math.max(w, h) * 1.3 + 6]) {
      for (const da of [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, 2.0, -2.0, 2.6, -2.6, Math.PI]) {
        const a = base + da;
        const lx = x + Math.cos(a) * dist, ly = y + Math.sin(a) * dist;
        const box = [lx - w / 2 - 1, ly - h / 2, lx + w / 2 + 1, ly + h / 2];
        const hit = labels.some(b => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3])) ||
          P.some(([px, py]) => circleHitsBox(px, py, lv.r + 2, box)) ||
          segDist(lx, ly) < Math.max(w, h) * 0.5 + 2 ||
          box[0] < 30 || box[2] > L.W - 30 || box[1] < L.BODY_TOP + 10 || box[3] > L.BODY_BOTTOM;
        if (!hit) { ok = { lx, ly, box }; break; }
      }
      if (ok) break;
    }
    if (!ok) { if (process.env.DBG) console.log('fail', i, JSON.stringify({ dot: P[i], prev: P[i - 1], next: P[(i + 1) % P.length], labels: labels.slice(-2), n: P.length, minGap })); return { fail: `no cabe el número ${i + 1}` }; }
    labels.push(ok.box);
    placed.push({ x, y, lx: ok.lx, ly: ok.ly, n: i + 1 });
  }
  return placed;
}

function dotsBody(placed, lv, answer) {
  let s = '';
  if (answer) {
    s += `<polygon points="${placed.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="#e0f2fe" stroke="#0891b2" stroke-width="4" stroke-linejoin="round"/>`;
  }
  for (const p of placed) {
    const first = p.n === 1;
    s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${first ? lv.r + 2 : lv.r}" fill="${first ? '#16a34a' : '#1e293b'}"/>`;
    s += `<text x="${p.lx.toFixed(1)}" y="${(p.ly + lv.font * 0.36).toFixed(1)}" text-anchor="middle" font-family="${L.BODY_FONT}" font-size="${lv.font}" font-weight="800" fill="${first ? '#16a34a' : '#334155'}">${p.n}</text>`;
  }
  return s;
}

// One FLUX image → dot layout, or {fail} with the reason.
async function attempt(file, lv) {
  const { m, size } = await loadMask(file);
  const opened = morph(morph(m, size, 3, true), size, 3, false);   // remove thin lines
  const { blob, area } = largestBlob(opened, size);
  const frac = area / (size * size);
  if (frac < 0.015 || frac > 0.7) return { fail: `figura de tamaño raro (${(frac * 100).toFixed(1)}%)` };
  const contour = trace(blob, size);
  const xs = contour.map(p => p[0]), ys = contour.map(p => p[1]);
  if (Math.min(...xs) <= 1 || Math.min(...ys) <= 1 || Math.max(...xs) >= size - 2 || Math.max(...ys) >= size - 2) {
    return { fail: 'la figura toca el borde (cortada)' };
  }
  return layout(simplify(contour, lv.dots), lv);
}

// Variant v of a subject's image. REDO lists subjects whose first images passed the
// automatic checks but were judged unrecognisable on review: they start at a later variant.
const REDO = { 'connect-the-sun-dots': 2, 'connect-the-ice-cream-dots': 2, 'connect-the-tree-dots': 2,
  'connect-the-car-dots': 2, 'connect-the-flower-dots': 2, 'puntos-pera': 2, 'puntos-taza': 2, 'puntos-regalo': 2,
  'connect-the-train-dots': 2, 'connect-the-fire-truck-dots': 2, 'connect-the-planet-dots': 2, 'puntos-oso': 2,
  'puntos-tractor': 2, 'puntos-guitarra': 2, 'connect-the-eagle-dots': 2, 'connect-the-santa-dots': 2 };
const keyOf = (slug, v) => v === 1 ? 'sil-' + slug : `sil-${slug}-v${v}`;
const MAX_TRIES = 4;

async function build() {
  const items = [], problems = [];
  let pending = SUBJECTS.map(s => ({ s, v: REDO[s[0]] || 1, tries: 0 }));
  const results = new Map();
  while (pending.length) {
    const files = await ensureImages(pending.map(p => ({ key: keyOf(p.s[0], p.v), prompt: prompt(p.s[3]) })));
    const next = [];
    for (const p of pending) {
      const r = await attempt(files.get(keyOf(p.s[0], p.v)), LEVEL[p.s[4]]);
      if (!r.fail) { results.set(p.s[0], r); continue; }
      if (++p.tries >= MAX_TRIES) { problems.push(`${p.s[0]}: ${r.fail} (tras ${MAX_TRIES} intentos)`); continue; }
      next.push({ ...p, v: p.v + 1 });
    }
    pending = next;
  }
  for (const [slug, es, en, , diff] of SUBJECTS) {
    const placed = results.get(slug);
    if (!placed) continue;
    const lv = LEVEL[diff];
    const common = { cat: 'puntos', title: es, diff };
    items.push({
      slug, title_es: es, title_en: en, diff, age: lv.age,
      desc_es: `${es}: une los ${lv.dots} puntos en orden para descubrir el dibujo. Ficha gratis para imprimir, para niños de ${lv.age} años, con solución.`,
      desc_en: `${en}: connect the ${lv.dots} dots in order to reveal the picture. Free printable for kids aged ${lv.age}, answer key included.`,
      tip_es: 'Empieza en el punto verde (1) y une los números en orden. Al terminar, ¡colorea el dibujo!',
      tip_en: 'Start at the green dot (1) and join the numbers in order. When you finish, color the picture!',
      sheet: L.sheet({ ...common, instruction: `Une los puntos del 1 al ${lv.dots} y descubre el dibujo`, body: dotsBody(placed, lv, false) }),
      answer: L.sheet({ ...common, instruction: `¡Es ${es.replace(/^(El|La|Los|Las) /, m => m.toLowerCase())}!`, body: dotsBody(placed, lv, true), answer: true }),
    });
  }
  if (problems.length) console.log('Revisar:\n  ' + problems.join('\n  '));
  return items;
}

module.exports = { build, SUBJECTS, _t: { loadMask, morph, largestBlob, trace, simplify, layout, LEVEL } };
if (require.main === module) {
  build().then(items => {
    console.log(`listas: ${items.length} de ${SUBJECTS.length}`);
    if (process.argv.includes('--write')) L.writeCategory('puntos', items);
  }).catch(e => { console.error(e); process.exit(1); });
}
