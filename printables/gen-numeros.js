'use strict';
// printables/gen-numeros.js — 100 color-by-number sheets.
// Needs the FLUX helper for images not yet cached:
//   npx wrangler dev printables/flux-worker.js --port 8788
// Run: node printables/gen-numeros.js [--write]
//
// FLUX draws a FLAT-COLOR cartoon with thick black outlines. From that image:
//   1. dark pixels = outlines; the closed white-space between them = regions
//   2. each region's colour = the median colour FLUX painted there, snapped to a
//      12-crayon palette — so the sky ends up blue and grass green (coherent colours)
//   3. each number is placed at the region's most interior point (distance transform),
//      so it is always inside its area; regions too small to hold a number are inked
// The answer key is the same picture filled with the palette colours.

const sharp = require('sharp');
const L = require('./lib');
const { ensureImages } = require('./flux-batch');

const PALETTE = [
  [1, 'Rojo', '#e53935'], [2, 'Naranja', '#fb8c00'], [3, 'Amarillo', '#fdd835'], [4, 'Verde claro', '#8bc34a'],
  [5, 'Verde', '#2e7d32'], [6, 'Azul claro', '#4fc3f7'], [7, 'Azul', '#1e63c6'], [8, 'Morado', '#8e24aa'],
  [9, 'Rosa', '#f48fb1'], [10, 'Café', '#8d5a3b'], [11, 'Gris', '#9e9e9e'], [12, 'Beige', '#f6d2a8'],
].map(([n, name, hex]) => ({ n, name, hex, rgb: [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) }));

// [slug, es, en, subject, diff]
const SUBJECTS = [
  // fácil: few big areas
  ['numeros-manzana', 'Manzana', 'Apple', 'a red apple with a green leaf', 'facil'],
  ['numeros-fresa', 'Fresa', 'Strawberry', 'a red strawberry with green leaves', 'facil'],
  ['numeros-sandia', 'Sandía', 'Watermelon', 'a watermelon slice', 'facil'],
  ['numeros-platano', 'Plátano', 'Banana', 'a yellow banana', 'facil'],
  ['numeros-pera', 'Pera', 'Pear', 'a green pear with a leaf', 'facil'],
  ['numeros-helado', 'Helado', 'Ice Cream', 'an ice cream cone with a pink scoop', 'facil'],
  ['numeros-cupcake', 'Cupcake', 'Cupcake', 'a cupcake with pink frosting and a cherry', 'facil'],
  ['numeros-globo', 'Globos', 'Balloons', 'three balloons red blue and yellow', 'facil'],
  ['numeros-sol', 'Sol', 'Sun', 'a smiling yellow sun in a blue sky', 'facil'],
  ['numeros-arcoiris', 'Arcoíris', 'Rainbow', 'a rainbow with white clouds', 'facil'],
  ['numeros-flor', 'Flor', 'Flower', 'a big flower with petals, stem and leaves', 'facil'],
  ['numeros-tulipan', 'Tulipán', 'Tulip', 'a red tulip with green leaves', 'facil'],
  ['numeros-hongo', 'Hongo', 'Mushroom', 'a red mushroom with white spots', 'facil'],
  ['numeros-mariquita', 'Mariquita', 'Ladybug', 'a ladybug on a green leaf', 'facil'],
  ['numeros-pez', 'Pez', 'Fish', 'an orange fish in blue water', 'facil'],
  ['numeros-pollito', 'Pollito', 'Chick', 'a yellow chick', 'facil'],
  ['numeros-patito', 'Patito', 'Duckling', 'a yellow duckling in water', 'facil'],
  ['numeros-rana', 'Rana', 'Frog', 'a green frog on a lily pad', 'facil'],
  ['numeros-tortuga', 'Tortuga', 'Turtle', 'a green turtle', 'facil'],
  ['numeros-caracol', 'Caracol', 'Snail', 'a snail with a brown shell', 'facil'],
  ['numeros-casa', 'Casita', 'Little House', 'a little house with a red roof and a tree', 'facil'],
  ['numeros-carro', 'Carro', 'Car', 'a red car', 'facil'],
  ['numeros-barco', 'Barco', 'Boat', 'a sailboat on blue water', 'facil'],
  ['numeros-cohete', 'Cohete', 'Rocket', 'a rocket in a dark blue sky with stars', 'facil'],
  ['numeros-corazon', 'Corazones', 'Hearts', 'three hearts red and pink', 'facil'],
  ['numeros-estrella', 'Estrella', 'Star', 'a smiling yellow star', 'facil'],
  ['numeros-calabaza', 'Calabaza', 'Pumpkin', 'an orange pumpkin with a green stem', 'facil'],
  ['numeros-regalo', 'Regalo', 'Gift', 'a gift box with a ribbon bow', 'facil'],
  ['numeros-arbol', 'Árbol', 'Tree', 'a tree with a green crown and brown trunk', 'facil'],
  ['numeros-muneco-nieve', 'Muñeco de Nieve', 'Snowman', 'a snowman with an orange nose and a blue scarf', 'facil'],
  ['numeros-osito', 'Osito', 'Teddy Bear', 'a brown teddy bear', 'facil'],
  ['numeros-gatito', 'Gatito', 'Kitten', 'an orange kitten', 'facil'],
  ['numeros-perrito', 'Perrito', 'Puppy', 'a brown puppy', 'facil'],
  ['numeros-ballena', 'Ballena', 'Whale', 'a blue whale in the sea', 'facil'],
  // medio: subject + simple background
  ['numeros-mariposa', 'Mariposa', 'Butterfly', 'a butterfly with colorful wings over flowers', 'medio'],
  ['numeros-abeja', 'Abeja', 'Bee', 'a bee next to a sunflower', 'medio'],
  ['numeros-loro', 'Loro', 'Parrot', 'a colorful parrot on a branch', 'medio'],
  ['numeros-buho', 'Búho', 'Owl', 'an owl on a branch under the moon', 'medio'],
  ['numeros-zorro', 'Zorro', 'Fox', 'an orange fox in the forest', 'medio'],
  ['numeros-ardilla', 'Ardilla', 'Squirrel', 'a squirrel with an acorn on a tree', 'medio'],
  ['numeros-conejo', 'Conejo', 'Rabbit', 'a bunny with a carrot in the grass', 'medio'],
  ['numeros-leon', 'León', 'Lion', 'a lion with a big mane', 'medio'],
  ['numeros-jirafa', 'Jirafa', 'Giraffe', 'a giraffe next to a tree', 'medio'],
  ['numeros-elefante', 'Elefante', 'Elephant', 'a gray elephant in the grass', 'medio'],
  ['numeros-panda', 'Panda', 'Panda', 'a panda with bamboo', 'medio'],
  ['numeros-pinguino', 'Pingüino', 'Penguin', 'a penguin on ice with blue water', 'medio'],
  ['numeros-pulpo', 'Pulpo', 'Octopus', 'a purple octopus under the sea', 'medio'],
  ['numeros-delfin', 'Delfín', 'Dolphin', 'a dolphin jumping over waves', 'medio'],
  ['numeros-tortuga-marina', 'Tortuga Marina', 'Sea Turtle', 'a sea turtle with coral', 'medio'],
  ['numeros-caballito-mar', 'Caballito de Mar', 'Seahorse', 'a seahorse with seaweed', 'medio'],
  ['numeros-dinosaurio', 'Dinosaurio', 'Dinosaur', 'a green friendly dinosaur with a palm tree', 'medio'],
  ['numeros-dragon', 'Dragón', 'Dragon', 'a friendly dragon with wings', 'medio'],
  ['numeros-unicornio', 'Unicornio', 'Unicorn', 'a unicorn with a rainbow mane', 'medio'],
  ['numeros-sirena', 'Sirena', 'Mermaid', 'a mermaid on a rock', 'medio'],
  ['numeros-robot', 'Robot', 'Robot', 'a friendly robot', 'medio'],
  ['numeros-astronauta', 'Astronauta', 'Astronaut', 'an astronaut with a planet', 'medio'],
  ['numeros-ovni', 'Platillo Volador', 'UFO', 'a flying saucer with an alien', 'medio'],
  ['numeros-tren', 'Tren', 'Train', 'a toy train with wagons', 'medio'],
  ['numeros-bomberos', 'Camión de Bomberos', 'Fire Truck', 'a red fire truck', 'medio'],
  ['numeros-autobus', 'Autobús', 'Bus', 'a yellow school bus', 'medio'],
  ['numeros-avion', 'Avión', 'Airplane', 'an airplane in the sky with clouds', 'medio'],
  ['numeros-helicoptero', 'Helicóptero', 'Helicopter', 'a helicopter in the sky', 'medio'],
  ['numeros-tractor', 'Tractor', 'Tractor', 'a green tractor on a farm', 'medio'],
  ['numeros-castillo', 'Castillo', 'Castle', 'a castle with towers and flags', 'medio'],
  ['numeros-faro', 'Faro', 'Lighthouse', 'a lighthouse by the sea', 'medio'],
  ['numeros-pastel', 'Pastel de Cumpleaños', 'Birthday Cake', 'a birthday cake with candles', 'medio'],
  ['numeros-pizza', 'Pizza', 'Pizza', 'a pizza with toppings', 'medio'],
  // difícil: full scenes, many areas
  ['numeros-granja', 'La Granja', 'The Farm', 'a farm with a red barn, a cow and a field', 'dificil'],
  ['numeros-jardin', 'El Jardín', 'The Garden', 'a garden with flowers, a butterfly and a fence', 'dificil'],
  ['numeros-playa', 'La Playa', 'The Beach', 'a beach with an umbrella, a sandcastle and the sea', 'dificil'],
  ['numeros-oceano', 'Fondo del Mar', 'Under the Sea', 'fish, coral and seaweed under the sea', 'dificil'],
  ['numeros-selva', 'La Selva', 'The Jungle', 'a jungle with a monkey, palm trees and a parrot', 'dificil'],
  ['numeros-bosque', 'El Bosque', 'The Forest', 'a forest with pine trees, a deer and mushrooms', 'dificil'],
  ['numeros-espacio', 'El Espacio', 'Outer Space', 'planets, stars and a rocket in space', 'dificil'],
  ['numeros-ciudad', 'La Ciudad', 'The City', 'a city street with buildings, a car and a tree', 'dificil'],
  ['numeros-parque', 'El Parque', 'The Park', 'a park with a slide, a tree and a bench', 'dificil'],
  ['numeros-invierno', 'Invierno', 'Winter', 'a snowy house with a snowman and pine trees', 'dificil'],
  ['numeros-otono', 'Otoño', 'Autumn', 'an autumn tree with falling leaves and a squirrel', 'dificil'],
  ['numeros-primavera', 'Primavera', 'Spring', 'a spring meadow with flowers and a rainbow', 'dificil'],
  ['numeros-verano', 'Verano', 'Summer', 'a summer picnic with a sun and a tree', 'dificil'],
  ['numeros-navidad', 'Navidad', 'Christmas', 'a christmas tree with presents', 'dificil'],
  ['numeros-halloween', 'Halloween', 'Halloween', 'pumpkins and a friendly ghost under the moon', 'dificil'],
  ['numeros-pascua', 'Pascua', 'Easter', 'a bunny with easter eggs in a basket', 'dificil'],
  ['numeros-circo', 'El Circo', 'The Circus', 'a circus tent with balloons', 'dificil'],
  ['numeros-feria', 'La Feria', 'The Fair', 'a ferris wheel with balloons', 'dificil'],
  ['numeros-pirata', 'Barco Pirata', 'Pirate Ship', 'a pirate ship on the sea', 'dificil'],
  ['numeros-tren-montana', 'Tren de Montaña', 'Mountain Train', 'a train in the mountains', 'dificil'],
  ['numeros-volcan', 'Volcán', 'Volcano', 'a volcano with dinosaurs', 'dificil'],
  ['numeros-acuario', 'Acuario', 'Aquarium', 'a fish tank with fish and plants', 'dificil'],
  ['numeros-cocina', 'La Cocina', 'The Kitchen', 'a kitchen table with fruits and a teapot', 'dificil'],
  ['numeros-tienda', 'La Tienda', 'The Store', 'a small shop with fruits and an awning', 'dificil'],
  ['numeros-escuela', 'La Escuela', 'The School', 'a school building with a flag and trees', 'dificil'],
  ['numeros-estanque', 'El Estanque', 'The Pond', 'a pond with ducks, lily pads and reeds', 'dificil'],
  ['numeros-colmena', 'La Colmena', 'The Beehive', 'a beehive with bees and flowers', 'dificil'],
  ['numeros-montana', 'Montañas', 'Mountains', 'mountains with a lake and a sun', 'dificil'],
  ['numeros-safari', 'Safari', 'Safari', 'a giraffe and an elephant in the savanna', 'dificil'],
  ['numeros-campamento', 'Campamento', 'Campsite', 'a tent, a campfire and trees at night', 'dificil'],
  ['numeros-arrecife', 'Arrecife', 'Coral Reef', 'a coral reef with a turtle and fish', 'dificil'],
  ['numeros-dragon-castillo', 'Dragón y Castillo', 'Dragon and Castle', 'a friendly dragon next to a castle', 'dificil'],
  ['numeros-hadas', 'Casa de Hadas', 'Fairy House', 'a fairy mushroom house in the forest', 'dificil'],
];

const LIMITS = { facil: [5, 30], medio: [12, 60], dificil: [25, 110] };
const AGE = { facil: '3-5', medio: '6-8', dificil: '9-12' };
const MAX_TRIES = 4;
const SIZE = 640;                                  // working resolution
const keyOf = (slug, v) => v === 1 ? `cbn-${slug}` : `cbn-${slug}-v${v}`;
const prompt = (s, diff) => `flat color cartoon illustration for a children's color by number page: ${s}. ` +
  `Thick bold black outlines around every shape, ${diff === 'facil' ? 'very few big simple shapes' : diff === 'medio' ? 'a few large shapes and a simple background' : 'a simple scene made of clear closed shapes'}, ` +
  `solid flat colors only, no gradients, no shading, no texture, no small details, white background, no text.`;

function nearest(rgb) {
  let best = null, bd = Infinity;
  for (const p of PALETTE) {
    const dr = rgb[0] - p.rgb[0], dg = rgb[1] - p.rgb[1], db = rgb[2] - p.rgb[2];
    const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;     // rough perceptual weights
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

async function analyse(file, diff) {
  const { data } = await sharp(file).resize(SIZE, SIZE, { fit: 'contain', background: '#fff' })
    .flatten({ background: '#fff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const N = SIZE * SIZE;
  // 1. outline mask (dark pixels), dilated by 1 px to close small gaps
  const dark = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const o = i * 3; dark[i] = (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) < 90 ? 1 : 0; }
  const line = new Uint8Array(N);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    let v = 0;
    for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1 && !v; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < SIZE && yy < SIZE && dark[yy * SIZE + xx]) v = 1;
    }
    line[y * SIZE + x] = v;
  }
  const inkFrac = line.reduce((s, v) => s + v, 0) / N;
  if (inkFrac < 0.04 || inkFrac > 0.4) return { fail: `líneas raras (${(inkFrac * 100).toFixed(0)}%)` };
  // 2. regions = 4-connected non-line components
  const label = new Int32Array(N).fill(-1), regions = [];
  for (let i = 0; i < N; i++) {
    if (line[i] || label[i] >= 0) continue;
    const id = regions.length, px = [], st = [i];
    label[i] = id;
    while (st.length) {
      const p = st.pop(); px.push(p);
      const x = p % SIZE, y = (p / SIZE) | 0;
      if (x > 0 && !line[p - 1] && label[p - 1] < 0) { label[p - 1] = id; st.push(p - 1); }
      if (x < SIZE - 1 && !line[p + 1] && label[p + 1] < 0) { label[p + 1] = id; st.push(p + 1); }
      if (y > 0 && !line[p - SIZE] && label[p - SIZE] < 0) { label[p - SIZE] = id; st.push(p - SIZE); }
      if (y < SIZE - 1 && !line[p + SIZE] && label[p + SIZE] < 0) { label[p + SIZE] = id; st.push(p + SIZE); }
    }
    regions.push({ id, px });
  }
  // 3. distance to the nearest line (chamfer), to find each region's most interior point
  const dist = new Float32Array(N);
  for (let i = 0; i < N; i++) dist[i] = line[i] ? 0 : 1e9;
  const pass = (y, x, dx, dy) => {
    const i = y * SIZE + x;
    for (const [ox, oy, w] of [[dx, 0, 1], [0, dy, 1], [dx, dy, 1.414], [-dx, dy, 1.414]]) {
      const xx = x + ox, yy = y + oy;
      if (xx >= 0 && yy >= 0 && xx < SIZE && yy < SIZE) dist[i] = Math.min(dist[i], dist[yy * SIZE + xx] + w);
    }
  };
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) pass(y, x, -1, -1);
  for (let y = SIZE - 1; y >= 0; y--) for (let x = SIZE - 1; x >= 0; x--) pass(y, x, 1, 1);
  // 4. colour + number position per region
  const out = [];
  const minArea = N * 0.0012;
  for (const r of regions) {
    let best = r.px[0];
    for (const p of r.px) if (dist[p] > dist[best]) best = p;
    r.in = dist[best];
    r.x = best % SIZE; r.y = (best / SIZE) | 0;
    if (r.px.length < minArea || r.in < 6) { r.ink = true; continue; }       // too small → ink it
    const sample = r.px.filter((_, k) => k % 7 === 0);
    const med = [0, 1, 2].map(c => { const v = sample.map(p => data[p * 3 + c]).sort((a, b) => a - b); return v[v.length >> 1]; });
    const light = med.every(v => v > 225);                                     // white → leave blank
    r.color = light ? null : nearest(med);
    out.push(r);
  }
  const numbered = out.filter(r => r.color);
  const [lo, hi] = LIMITS[diff];
  if (numbered.length < lo || numbered.length > hi) return { fail: `${numbered.length} zonas (esperaba ${lo}–${hi})` };
  if (new Set(numbered.map(r => r.color.n)).size < 3) return { fail: 'menos de 3 colores' };
  return { label, line, regions, numbered };
}

async function renderPngs(a) {
  const N = SIZE * SIZE, bw = Buffer.alloc(N), col = Buffer.alloc(N * 3);
  const regionOf = a.regions;
  for (let i = 0; i < N; i++) {
    const r = a.line[i] ? null : regionOf[a.label[i]];
    const ink = !r || r.ink;
    bw[i] = ink ? 0 : 255;
    const rgb = ink ? [30, 30, 30] : r.color ? r.color.rgb : [255, 255, 255];
    col[i * 3] = rgb[0]; col[i * 3 + 1] = rgb[1]; col[i * 3 + 2] = rgb[2];
  }
  const line = await sharp(bw, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png({ palette: true, colors: 2, compressionLevel: 9 }).toBuffer();
  const color = await sharp(col, { raw: { width: SIZE, height: SIZE, channels: 3 } }).png({ palette: true, colors: 16, compressionLevel: 9 }).toBuffer();
  return { line, color };
}

function sheetBody(a, png, answer) {
  const used = [...new Map(a.numbered.map(r => [r.color.n, r.color])).values()].sort((x, y) => x.n - y.n);
  const keyRows = Math.ceil(used.length / 4), keyH = 26 + keyRows * 40;
  const top = L.BODY_TOP + 4, h = L.BODY_BOTTOM - top - keyH - 14, s = Math.min(L.W - 64, h);
  const x0 = (L.W - s) / 2, y0 = top + (h - s) / 2, k = s / SIZE;
  let out = `<image x="${x0}" y="${y0}" width="${s}" height="${s}" href="data:image/png;base64,${png.toString('base64')}"/>`;
  if (!answer) for (const r of a.numbered) {
    const fs = Math.max(9, Math.min(22, r.in * k * 1.1));
    out += `<text x="${(x0 + r.x * k).toFixed(1)}" y="${(y0 + r.y * k + fs * 0.36).toFixed(1)}" text-anchor="middle" font-family="${L.BODY_FONT}" font-size="${fs.toFixed(1)}" font-weight="800" fill="#334155">${r.color.n}</text>`;
  }
  // colour key
  const ky = L.BODY_BOTTOM - keyH, cw = (L.W - 80) / 4;
  out += `<rect x="36" y="${ky - 6}" width="${L.W - 72}" height="${keyH + 6}" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>`;
  out += `<text x="56" y="${ky + 16}" font-family="${L.BODY_FONT}" font-size="15" font-weight="900" fill="#475569">CLAVE DE COLORES</text>`;
  used.forEach((p, i) => {
    const cx = 56 + (i % 4) * cw, cy = ky + 44 + Math.floor(i / 4) * 40;
    out += `<circle cx="${cx + 14}" cy="${cy - 6}" r="15" fill="${p.hex}" stroke="#1e293b" stroke-width="1.5"/>`;
    out += `<text x="${cx + 14}" y="${cy - 1}" text-anchor="middle" font-family="${L.BODY_FONT}" font-size="14" font-weight="900" fill="${[3, 12, 6, 9, 4].includes(p.n) ? '#1e293b' : '#fff'}">${p.n}</text>`;
    out += `<text x="${cx + 38}" y="${cy}" font-family="${L.BODY_FONT}" font-size="16" font-weight="800" fill="#1e293b">${p.name}</text>`;
  });
  return out;
}

async function build({ only } = {}) {
  const list = only ? SUBJECTS.filter(s => only.includes(s[0])) : SUBJECTS;
  let pending = list.map(s => ({ s, v: 1, tries: 0 }));
  const ok = new Map(), problems = [];
  while (pending.length) {
    const files = await ensureImages(pending.map(x => ({ key: keyOf(x.s[0], x.v), prompt: prompt(x.s[3], x.s[4]) })));
    const next = [];
    for (const x of pending) {
      const a = await analyse(files.get(keyOf(x.s[0], x.v)), x.s[4]);
      if (!a.fail) { ok.set(x.s[0], { a, png: await renderPngs(a) }); continue; }
      if (++x.tries >= MAX_TRIES) { problems.push(`${x.s[0]}: ${a.fail}`); continue; }
      next.push({ ...x, v: x.v + 1 });
    }
    pending = next;
  }
  if (problems.length) console.log('Revisar:\n  ' + problems.join('\n  '));
  return list.filter(s => ok.has(s[0])).map(([slug, es, en, , diff]) => {
    const { a, png } = ok.get(slug);
    const common = { cat: 'numeros', title: es, diff };
    return {
      slug, title_es: `${es}: colorear por números`, title_en: `${en}: Color by Number`, diff, age: AGE[diff],
      desc_es: `${es}: ficha de colorear por números para imprimir gratis, con ${a.numbered.length} zonas y clave de colores. Para niños de ${AGE[diff]} años. Incluye el dibujo terminado.`,
      desc_en: `${en}: free printable color-by-number with ${a.numbered.length} areas and a color key, for kids aged ${AGE[diff]}. Finished picture included.`,
      tip_es: 'Busca un número en la clave y colorea todas las zonas que lo tengan. Después sigue con el siguiente color.',
      tip_en: 'Pick a number from the key and color every area with that number, then move on to the next color.',
      sheet: L.sheet({ ...common, instruction: 'Colorea cada zona con el color de su número', body: sheetBody(a, png.line, false) }),
      answer: L.sheet({ ...common, instruction: 'Así queda el dibujo terminado', body: sheetBody(a, png.color, true), answer: 'DIBUJO TERMINADO' }),
    };
  });
}

module.exports = { build, SUBJECTS };
if (require.main === module) {
  build().then(items => {
    const d = {}; items.forEach(i => { d[i.diff] = (d[i.diff] || 0) + 1; });
    console.log(`listas: ${items.length} de ${SUBJECTS.length}`, d);
    if (process.argv.includes('--write')) L.writeCategory('numeros', items);
  }).catch(e => { console.error(e.message); process.exit(1); });
}
