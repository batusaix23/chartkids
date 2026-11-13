'use strict';
// printables/gen-colorear.js — 150 coloring pages drawn by FLUX and cleaned to pure
// black-and-white line art. Needs the FLUX helper for images not yet cached:
//   npx wrangler dev printables/flux-worker.js --port 8788
// Run: node printables/gen-colorear.js [--write]
//
// Automatic checks per image (a failing image is re-requested, up to 4 variants):
//   • ink coverage between 3% and 22% (too little = faint, too much = heavy fills)
//   • no large solid black areas (they survive a strong erosion; outlines don't)
//   • the drawing doesn't run off the edges
// The slugs are existing /coloring/ URLs (…-coloring-page).

const sharp = require('sharp');
const L = require('./lib');
const { ensureImages } = require('./flux-batch');

// [slug prefix, es, en, subject, diff]
const PAGES = [
  // ── fácil: one big friendly subject ──
  ['apple', 'Manzana', 'Apple', 'a big apple with a leaf', 'facil'],
  ['banana', 'Plátano', 'Banana', 'a smiling banana', 'facil'],
  ['strawberry', 'Fresa', 'Strawberry', 'a big smiling strawberry', 'facil'],
  ['watermelon', 'Sandía', 'Watermelon', 'a slice of watermelon with seeds', 'facil'],
  ['pineapple', 'Piña', 'Pineapple', 'a smiling pineapple', 'facil'],
  ['orange', 'Naranja', 'Orange', 'an orange with a leaf', 'facil'],
  ['grapes', 'Uvas', 'Grapes', 'a bunch of grapes with a leaf', 'facil'],
  ['avocado', 'Aguacate', 'Avocado', 'a cute avocado cut in half', 'facil'],
  ['mango', 'Mango', 'Mango', 'a mango with a leaf', 'facil'],
  ['cupcake', 'Cupcake', 'Cupcake', 'a cupcake with frosting and a cherry', 'facil'],
  ['donut', 'Dona', 'Donut', 'a donut with sprinkles', 'facil'],
  ['ice-cream-cone', 'Helado', 'Ice Cream Cone', 'an ice cream cone with two scoops', 'facil'],
  ['happy-pizza', 'Pizza Feliz', 'Happy Pizza', 'a smiling pizza', 'facil'],
  ['fun-hamburger', 'Hamburguesa', 'Hamburger', 'a cute smiling hamburger', 'facil'],
  ['fun-taco', 'Taco', 'Taco', 'a cute smiling taco', 'facil'],
  ['birthday-cake', 'Pastel de Cumpleaños', 'Birthday Cake', 'a birthday cake with candles', 'facil'],
  ['valentine-heart', 'Corazón', 'Heart', 'a big heart with a smiling face', 'facil'],
  ['rainbow', 'Arcoíris', 'Rainbow', 'a rainbow with two clouds', 'facil'],
  ['snowman', 'Muñeco de Nieve', 'Snowman', 'a happy snowman with a hat and scarf', 'facil'],
  ['christmas-tree', 'Árbol de Navidad', 'Christmas Tree', 'a christmas tree with ornaments and a star', 'facil'],
  ['halloween-pumpkin', 'Calabaza', 'Pumpkin', 'a smiling halloween pumpkin', 'facil'],
  ['easter-eggs', 'Huevos de Pascua', 'Easter Eggs', 'three decorated easter eggs in grass', 'facil'],
  ['baby-cat', 'Gatito', 'Kitten', 'a cute baby kitten sitting', 'facil'],
  ['puppy-dog', 'Perrito', 'Puppy', 'a cute puppy sitting', 'facil'],
  ['pet-rabbit', 'Conejito', 'Bunny', 'a cute bunny sitting', 'facil'],
  ['hamster', 'Hámster', 'Hamster', 'a cute chubby hamster', 'facil'],
  ['pet-fish', 'Pececito', 'Little Fish', 'a cute little fish with bubbles', 'facil'],
  ['pet-turtle', 'Tortuguita', 'Little Turtle', 'a cute little turtle', 'facil'],
  ['ladybug', 'Mariquita', 'Ladybug', 'a cute ladybug on a leaf', 'facil'],
  ['bee', 'Abeja', 'Bee', 'a cute smiling bee', 'facil'],
  ['butterfly', 'Mariposa', 'Butterfly', 'a butterfly with big patterned wings', 'facil'],
  ['caterpillar', 'Oruga', 'Caterpillar', 'a cute smiling caterpillar', 'facil'],
  ['ant', 'Hormiga', 'Ant', 'a cute cartoon ant waving', 'facil'],
  ['starfish', 'Estrella de Mar', 'Starfish', 'a smiling starfish', 'facil'],
  ['seahorse', 'Caballito de Mar', 'Seahorse', 'a cute seahorse', 'facil'],
  ['whale', 'Ballena', 'Whale', 'a happy whale spouting water', 'facil'],
  ['baby-elephant', 'Elefantito', 'Baby Elephant', 'a cute baby elephant', 'facil'],
  ['baby-tiger', 'Tigrito', 'Baby Tiger', 'a cute baby tiger', 'facil'],
  ['baby-dragon', 'Dragoncito', 'Baby Dragon', 'a cute baby dragon', 'facil'],
  ['baby-t-rex', 'T-Rex Bebé', 'Baby T-Rex', 'a cute baby t-rex', 'facil'],
  ['friendly-bear', 'Osito', 'Friendly Bear', 'a friendly teddy bear waving', 'facil'],
  ['happy-hippo', 'Hipopótamo Feliz', 'Happy Hippo', 'a happy hippo', 'facil'],
  ['friendly-ghost', 'Fantasmita', 'Friendly Ghost', 'a cute smiling little ghost', 'facil'],
  ['friendly-alien', 'Extraterrestre', 'Friendly Alien', 'a cute friendly alien waving', 'facil'],
  ['sailboat', 'Velero', 'Sailboat', 'a sailboat on small waves', 'facil'],
  ['bicycle', 'Bicicleta', 'Bicycle', 'a kids bicycle', 'facil'],
  ['taxi', 'Taxi', 'Taxi', 'a cute cartoon taxi', 'facil'],
  ['school-bus', 'Autobús Escolar', 'School Bus', 'a cute school bus', 'facil'],
  ['helicopter', 'Helicóptero', 'Helicopter', 'a cute cartoon helicopter', 'facil'],
  ['space-rocket', 'Cohete', 'Rocket', 'a cartoon rocket with stars', 'facil'],
  // ── medio: subject with a simple scene ──
  ['lion-smiling', 'León Sonriente', 'Smiling Lion', 'a smiling lion with a big mane in the savanna', 'dificil'],
  ['tall-giraffe', 'Jirafa', 'Giraffe', 'a tall giraffe next to a tree', 'dificil'],
  ['running-zebra', 'Cebra', 'Zebra', 'a zebra running in the grass', 'medio'],
  ['panda-eating-bamboo', 'Panda', 'Panda', 'a panda eating bamboo', 'dificil'],
  ['koala-in-tree', 'Koala', 'Koala', 'a koala hugging a tree branch', 'dificil'],
  ['hanging-monkey', 'Mono', 'Monkey', 'a monkey hanging from a jungle vine', 'dificil'],
  ['polar-bear', 'Oso Polar', 'Polar Bear', 'a polar bear on the ice', 'medio'],
  ['emperor-penguin', 'Pingüinos', 'Penguins', 'a penguin family on the ice', 'dificil'],
  ['jumping-dolphin', 'Delfín', 'Dolphin', 'a dolphin jumping over waves', 'medio'],
  ['smiling-octopus', 'Pulpo', 'Octopus', 'a smiling octopus under the sea', 'medio'],
  ['sea-turtle', 'Tortuga Marina', 'Sea Turtle', 'a sea turtle swimming with fish', 'dificil'],
  ['tropical-fish', 'Peces Tropicales', 'Tropical Fish', 'tropical fish and seaweed', 'dificil'],
  ['friendly-shark', 'Tiburón Amigable', 'Friendly Shark', 'a friendly smiling shark', 'medio'],
  ['cartoon-jellyfish', 'Medusa', 'Jellyfish', 'a cute jellyfish under the sea', 'medio'],
  ['swimming-otter', 'Nutria', 'Otter', 'an otter floating on its back', 'medio'],
  ['curious-fox', 'Zorro', 'Fox', 'a curious fox in the forest', 'dificil'],
  ['cute-hedgehog', 'Erizo', 'Hedgehog', 'a cute hedgehog with mushrooms', 'dificil'],
  ['squirrel-with-acorn', 'Ardilla', 'Squirrel', 'a squirrel holding a nut on a branch', 'medio'],
  ['howling-wolf', 'Lobo', 'Wolf', 'a wolf sitting under the moon', 'medio'],
  ['beaver-building', 'Castor', 'Beaver', 'a beaver building a dam', 'dificil'],
  ['kangaroo-with-baby', 'Canguro', 'Kangaroo', 'a kangaroo with a baby in its pouch', 'medio'],
  ['camel-in-desert', 'Camello', 'Camel', 'a camel in the desert', 'dificil'],
  ['parrot', 'Loro', 'Parrot', 'a parrot on a branch', 'medio'],
  ['jumping-rabbit', 'Conejo Saltando', 'Jumping Rabbit', 'a rabbit jumping in a meadow', 'medio'],
  ['rabbit-with-carrot', 'Conejo con Zanahoria', 'Rabbit with Carrot', 'a bunny holding a carrot', 'medio'],
  ['kitten-playing', 'Gatito Jugando', 'Playing Kitten', 'a kitten playing with a ball of yarn', 'medio'],
  ['puppy-with-ball', 'Perrito con Pelota', 'Puppy with Ball', 'a puppy playing with a ball', 'medio'],
  ['hamster-on-wheel', 'Hámster en su Rueda', 'Hamster on Wheel', 'a hamster running on a wheel', 'medio'],
  ['bee-collecting-pollen', 'Abeja y Flores', 'Bee and Flowers', 'a bee flying over flowers', 'dificil'],
  ['butterfly-on-flower', 'Mariposa en una Flor', 'Butterfly on Flower', 'a butterfly on a big flower', 'dificil'],
  ['dragonfly', 'Libélula', 'Dragonfly', 'a dragonfly over a pond', 'medio'],
  ['flower-garden', 'Jardín de Flores', 'Flower Garden', 'a flower garden with tulips and daisies', 'dificil'],
  ['stegosaurus', 'Estegosaurio', 'Stegosaurus', 'a friendly stegosaurus', 'medio'],
  ['triceratops', 'Triceratops', 'Triceratops', 'a friendly triceratops', 'medio'],
  ['brontosaurus', 'Brontosaurio', 'Brontosaurus', 'a friendly long-necked dinosaur', 'medio'],
  ['pterodactyl', 'Pterodáctilo', 'Pterodactyl', 'a friendly pterodactyl flying', 'medio'],
  ['dinosaur-with-egg', 'Dinosaurio con Huevo', 'Dinosaur with Egg', 'a mother dinosaur with an egg', 'dificil'],
  ['sleeping-dinosaur', 'Dinosaurio Dormido', 'Sleeping Dinosaur', 'a cute dinosaur sleeping', 'medio'],
  ['dinosaur-on-skateboard', 'Dino en Patineta', 'Skateboarding Dino', 'a cute dinosaur on a skateboard', 'medio'],
  ['friendly-dragon', 'Dragón Amigable', 'Friendly Dragon', 'a friendly dragon with wings', 'medio'],
  ['magic-unicorn', 'Unicornio Mágico', 'Magic Unicorn', 'a unicorn with stars', 'medio'],
  ['flying-unicorn', 'Unicornio Volador', 'Flying Unicorn', 'a unicorn with wings flying over clouds', 'dificil'],
  ['magic-mermaid', 'Sirena', 'Mermaid', 'a smiling mermaid sitting on a rock', 'dificil'],
  ['forest-fairy', 'Hada del Bosque', 'Forest Fairy', 'a little fairy on a mushroom', 'dificil'],
  ['smiling-princess', 'Princesa', 'Princess', 'a smiling princess in a gown', 'medio'],
  ['kind-queen', 'Reina', 'Queen', 'a friendly queen with a crown', 'medio'],
  ['medieval-knight', 'Caballero', 'Knight', 'a friendly knight with a shield', 'medio'],
  ['cute-witch', 'Brujita', 'Little Witch', 'a cute little witch on a broom', 'medio'],
  ['astronaut-waving', 'Astronauta', 'Astronaut', 'an astronaut waving in space', 'medio'],
  ['cat-astronaut', 'Gato Astronauta', 'Cat Astronaut', 'a cat in a space suit', 'medio'],
  ['space-robot', 'Robot Espacial', 'Space Robot', 'a friendly robot in space', 'medio'],
  ['saturn-planet', 'Saturno', 'Saturn', 'the planet saturn with stars', 'medio'],
  ['mars-rover', 'Explorador de Marte', 'Mars Rover', 'a rover on mars', 'dificil'],
  ['fire-truck', 'Camión de Bomberos', 'Fire Truck', 'a fire truck', 'medio'],
  ['police-car', 'Patrulla', 'Police Car', 'a police car', 'medio'],
  ['ambulance', 'Ambulancia', 'Ambulance', 'an ambulance', 'medio'],
  ['tractor', 'Tractor', 'Tractor', 'a farm tractor', 'medio'],
  ['train', 'Tren', 'Train', 'a steam train', 'medio'],
  ['race-car', 'Carro de Carreras', 'Race Car', 'a race car', 'medio'],
  ['excavator', 'Excavadora', 'Excavator', 'an excavator digging', 'medio'],
  ['submarine', 'Submarino', 'Submarine', 'a submarine with fish', 'dificil'],
  ['ice-cream-truck', 'Camión de Helados', 'Ice Cream Truck', 'an ice cream truck', 'medio'],
  ['commercial-airplane', 'Avión', 'Airplane', 'an airplane flying in the clouds', 'medio'],
  ['firefighter', 'Bombero', 'Firefighter', 'a kid firefighter with a hose', 'medio'],
  ['doctor', 'Doctora', 'Doctor', 'a kid doctor with a stethoscope', 'medio'],
  ['chef-cooking', 'Chef', 'Chef', 'a kid chef cooking', 'medio'],
  ['teacher', 'Maestra', 'Teacher', 'a teacher at the blackboard', 'medio'],
  ['farmer', 'Granjero', 'Farmer', 'a farmer with a cow', 'dificil'],
  ['veterinarian', 'Veterinaria', 'Veterinarian', 'a vet with a puppy', 'dificil'],
  ['soccer-player', 'Futbolista', 'Soccer Player', 'a kid kicking a soccer ball', 'medio'],
  ['skateboarder', 'Patinador', 'Skateboarder', 'a kid on a skateboard', 'medio'],
  ['surfer', 'Surfista', 'Surfer', 'a kid surfing a wave', 'dificil'],
  ['girl-superhero', 'Superheroína', 'Girl Superhero', 'a girl superhero with a cape', 'medio'],
  ['boy-superhero', 'Superhéroe', 'Boy Superhero', 'a boy superhero with a cape', 'medio'],
  // ── difícil: full scenes with more detail ──
  ['enchanted-castle', 'Castillo Encantado', 'Enchanted Castle', 'a fairytale castle on a hill with towers and flags', 'dificil'],
  ['enchanted-forest', 'Bosque Encantado', 'Enchanted Forest', 'an enchanted forest with mushrooms, trees and a little house', 'dificil'],
  ['underwater-palace', 'Palacio Submarino', 'Underwater Palace', 'an underwater palace with fish and coral', 'dificil'],
  ['pirate-ship', 'Barco Pirata', 'Pirate Ship', 'a pirate ship on the waves with a flag', 'dificil'],
  ['solar-system', 'Sistema Solar', 'Solar System', 'the sun and planets of the solar system', 'dificil'],
  ['space-station', 'Estación Espacial', 'Space Station', 'a space station with an astronaut and planets', 'dificil'],
  ['dinosaur-in-jungle', 'Dinosaurios en la Selva', 'Dinosaurs in the Jungle', 'friendly dinosaurs in a jungle with a volcano', 'dificil'],
  ['dinosaur-family', 'Familia de Dinosaurios', 'Dinosaur Family', 'a family of friendly dinosaurs', 'dificil'],
  ['princess-with-unicorn', 'Princesa y Unicornio', 'Princess and Unicorn', 'a princess with a unicorn in a garden', 'dificil'],
  ['royal-carriage', 'Carruaje Real', 'Royal Carriage', 'a royal carriage pulled by a horse', 'dificil'],
  ['magic-tower', 'Torre Mágica', 'Magic Tower', 'a wizard tower with stars and moon', 'dificil'],
  ['christmas-train', 'Tren de Navidad', 'Christmas Train', 'a christmas train carrying presents', 'dificil'],
  ['santa-claus', 'Santa Claus', 'Santa Claus', 'santa claus with his sleigh and presents', 'dificil'],
  ['rudolph-reindeer', 'Reno', 'Reindeer', 'a reindeer in the snow with trees', 'dificil'],
  ['winter-scene', 'Paisaje de Invierno', 'Winter Scene', 'kids building a snowman next to a house in winter', 'dificil'],
  ['spring-scene', 'Primavera', 'Spring Scene', 'a spring meadow with flowers, butterflies and a tree', 'dificil'],
  ['summer-scene', 'Verano', 'Summer Scene', 'kids playing at the beach with sandcastles', 'dificil'],
  ['autumn-scene', 'Otoño', 'Autumn Scene', 'an autumn park with falling leaves and a squirrel', 'dificil'],
  ['family-picnic', 'Picnic Familiar', 'Family Picnic', 'a family having a picnic in the park', 'dificil'],
  ['birthday-party', 'Fiesta de Cumpleaños', 'Birthday Party', 'kids at a birthday party with balloons and cake', 'dificil'],
  ['carnival', 'La Feria', 'The Fair', 'a fair with a ferris wheel and balloons', 'dificil'],
  ['waterfall', 'Cascada', 'Waterfall', 'a waterfall in the mountains with trees', 'dificil'],
  ['mountains', 'Montañas', 'Mountains', 'mountains with a lake and pine trees', 'dificil'],
  ['volcano', 'Volcán', 'Volcano', 'a volcano island with palm trees', 'dificil'],
  ['school-party', 'Fiesta en la Escuela', 'School Party', 'a classroom party with kids and decorations', 'dificil'],
  ['team-of-heroes', 'Equipo de Héroes', 'Team of Heroes', 'a team of kid superheroes in the city', 'dificil'],
];

const prompt = (s, diff) => `children's coloring book page, black and white line art: ${s}. ` +
  `Cute, friendly, smiling cartoon style. Thick, even, bold black outlines; ` +
  (diff === 'facil' ? 'one big simple subject, very large shapes, almost no background. ' :
   diff === 'medio' ? 'large closed shapes with a simple background of a few big elements. ' :
                      'a full scene with more details but every area still clearly closed. ') +
  `Plain white background, no shading, no gray tones, no solid black fills, no words, no letters.`;

const AGE = { facil: '3-5', medio: '6-8', dificil: '9-12' };
const MAX_TRIES = 4;
const keyOf = (slug, v) => v === 1 ? `col-${slug}` : `col-${slug}-v${v}`;

// Clean to pure black/white and run the quality checks. Returns {png} or {fail}.
async function clean(file) {
  const size = 1024;
  const { data } = await sharp(file).resize(size, size, { fit: 'contain', background: '#fff' })
    .flatten({ background: '#fff' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const bw = Buffer.alloc(size * size);
  let ink = 0;
  for (let i = 0; i < bw.length; i++) { const k = data[i] < 170; bw[i] = k ? 0 : 255; if (k) ink++; }
  const cov = ink / bw.length;
  if (cov < 0.03) return { fail: `muy poca línea (${(cov * 100).toFixed(1)}%)` };
  if (cov > 0.22) return { fail: `demasiado negro (${(cov * 100).toFixed(1)}%)` };
  // Solid fills: a pixel whose whole 13×13 cross is ink is inside a filled area.
  const r = 6; let solid = 0, samples = 0;
  for (let y = r; y < size - r; y += 2) for (let x = r; x < size - r; x += 2) {
    samples++;
    let all = true;
    for (let k = -r; k <= r && all; k += 3) if (bw[y * size + x + k] || bw[(y + k) * size + x]) all = false;
    if (all) solid++;
  }
  const solidFrac = solid / samples;
  if (solidFrac > 0.012) return { fail: `zonas negras rellenas (${(solidFrac * 100).toFixed(1)}%)` };
  // Ink along the border means the drawing is cut off.
  let edge = 0;
  for (let i = 0; i < size; i++) edge += (bw[i] === 0) + (bw[(size - 1) * size + i] === 0) + (bw[i * size] === 0) + (bw[i * size + size - 1] === 0);
  if (edge > size * 0.25) return { fail: 'el dibujo se sale de la hoja' };
  const png = await sharp(bw, { raw: { width: size, height: size, channels: 1 } }).png({ palette: true, colors: 2, compressionLevel: 9 }).toBuffer();
  return { png };
}

function pageSheet(es, diff, png) {
  const top = L.BODY_TOP + 6, h = L.BODY_BOTTOM - top, w = L.W - 64;
  const s = Math.min(w, h);
  return L.sheet({ cat: 'colorear', title: es, instruction: '¡Colorea el dibujo con tus colores favoritos!', diff,
    body: `<image x="${(L.W - s) / 2}" y="${top + (h - s) / 2}" width="${s}" height="${s}" href="data:image/png;base64,${png.toString('base64')}"/>` });
}

async function build({ only } = {}) {
  const slugs = new Set();
  for (const p of PAGES) { if (slugs.has(p[0])) throw new Error('dup ' + p[0]); slugs.add(p[0]); }
  const list = only ? PAGES.filter(p => only.includes(p[0])) : PAGES;
  let pending = list.map(p => ({ p, v: 1, tries: 0 }));
  const ok = new Map(), problems = [];
  while (pending.length) {
    const files = await ensureImages(pending.map(x => ({ key: keyOf(x.p[0], x.v), prompt: prompt(x.p[3], x.p[4]) })));
    const next = [];
    for (const x of pending) {
      const res = await clean(files.get(keyOf(x.p[0], x.v)));
      if (!res.fail) { ok.set(x.p[0], res.png); continue; }
      if (++x.tries >= MAX_TRIES) { problems.push(`${x.p[0]}: ${res.fail}`); continue; }
      next.push({ ...x, v: x.v + 1 });
    }
    pending = next;
  }
  if (problems.length) console.log('Revisar:\n  ' + problems.join('\n  '));
  return list.filter(p => ok.has(p[0])).map(([slug, es, en, , diff]) => ({
    slug: `${slug}-coloring-page`, title_es: `${es} para colorear`, title_en: `${en} Coloring Page`, diff, age: AGE[diff],
    desc_es: `${es}: dibujo para colorear gratis, con contornos gruesos y zonas grandes, para niños de ${AGE[diff]} años. Listo para imprimir.`,
    desc_en: `${en}: free coloring page with thick outlines and big areas, for kids aged ${AGE[diff]}. Ready to print.`,
    tip_es: 'Primero colorea las zonas grandes y después los detalles. ¡No importa salirse un poquito de la línea!',
    tip_en: 'Color the big areas first, then the details. It is fine to go a little outside the lines!',
    sheet: pageSheet(es, diff, ok.get(slug)),
  }));
}

module.exports = { build, PAGES };
if (require.main === module) {
  build().then(items => {
    const d = {}; items.forEach(i => { d[i.diff] = (d[i.diff] || 0) + 1; });
    console.log(`listas: ${items.length} de ${PAGES.length}`, d);
    if (process.argv.includes('--write')) L.writeCategory('colorear', items);
  }).catch(e => { console.error(e.message); process.exit(1); });
}
