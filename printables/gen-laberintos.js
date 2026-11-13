'use strict';
// printables/gen-laberintos.js — 100 printable mazes with answer keys.
// Run: node printables/gen-laberintos.js
//
// Every maze is a "perfect" maze (recursive backtracker): exactly one path between
// any two cells. The generator verifies that for each sheet (all cells reachable,
// cells-1 passages, start→finish path found) and draws the path on the answer key.
// The first 72 slugs are the existing /maze/ URLs (kept for search engines).

const L = require('./lib');

// [slug, title_es, title_en, diff, char, dest, story_es, story_en]
const THEMES = [
  // ── existing URLs ──
  ['lion-maze-maze', 'Laberinto del León', 'Lion Maze', 'facil', '🦁', '🍖', '¡Ayuda al león a encontrar su comida!', 'Help the lion find its food!'],
  ['elephant-maze-maze', 'Laberinto del Elefante', 'Elephant Maze', 'facil', '🐘', '🍉', '¡Guía al elefante hasta su sandía!', 'Guide the elephant to its watermelon!'],
  ['jungle-maze-maze', 'Laberinto de la Selva', 'Jungle Maze', 'medio', '🐒', '🍌', '¡Lleva al mono hasta los plátanos!', 'Take the monkey to the bananas!'],
  ['safari-maze-maze', 'Laberinto del Safari', 'Safari Maze', 'medio', '🦒', '💧', '¡Guía a la jirafa al abrevadero!', 'Guide the giraffe to the water hole!'],
  ['ocean-animals-maze-maze', 'Animales del Océano', 'Ocean Animals Maze', 'dificil', '🐬', '🐚', '¡Lleva al delfín hasta el arrecife!', 'Take the dolphin to the reef!'],
  ['arctic-animals-maze-maze', 'Animales del Ártico', 'Arctic Animals Maze', 'dificil', '🐧', '🐟', '¡Ayuda al pingüino a pescar!', 'Help the penguin go fishing!'],
  ['baby-dino-maze-maze', 'El Dinosaurio Bebé', 'Baby Dino Maze', 'facil', '🦕', '🥚', '¡Ayuda al dino a encontrar su huevo!', 'Help the dino find its egg!'],
  ['jurassic-maze-maze', 'Laberinto Jurásico', 'Jurassic Maze', 'medio', '🦖', '🌿', '¡Lleva al T-Rex hasta las plantas!', 'Take the T-Rex to the plants!'],
  ['volcano-maze-maze', 'El Volcán', 'Volcano Maze', 'medio', '🦕', '🏝️', '¡Escapa del volcán hasta la isla!', 'Escape the volcano to the island!'],
  ['prehistoric-maze-maze', 'Mundo Prehistórico', 'Prehistoric Maze', 'dificil', '🦖', '🏕️', '¡Llega al campamento prehistórico!', 'Reach the prehistoric camp!'],
  ['dino-egg-hunt-maze-maze', 'Búsqueda del Huevo', 'Dino Egg Hunt Maze', 'medio', '🦕', '🥚', '¡Encuentra el huevo escondido!', 'Find the hidden egg!'],
  ['t-rex-escape-maze-maze', 'Escapa del T-Rex', 'T-Rex Escape Maze', 'dificil', '🐒', '🌳', '¡Ayuda al mono a llegar a su árbol!', 'Help the monkey reach its tree!'],
  ['car-park-maze-maze', 'El Estacionamiento', 'Car Park Maze', 'facil', '🚗', '🅿️', '¡Estaciona el carro en su lugar!', 'Park the car in its spot!'],
  ['city-traffic-maze-maze', 'Tráfico en la Ciudad', 'City Traffic Maze', 'facil', '🚕', '🏠', '¡Lleva el taxi hasta la casa!', 'Drive the taxi to the house!'],
  ['race-track-maze-maze', 'La Pista de Carreras', 'Race Track Maze', 'medio', '🏎️', '🏁', '¡Llega a la meta de la carrera!', 'Reach the race finish line!'],
  ['airport-maze-maze', 'El Aeropuerto', 'Airport Maze', 'medio', '✈️', '🛫', '¡Lleva el avión a la pista!', 'Take the plane to the runway!'],
  ['train-tracks-maze-maze', 'Las Vías del Tren', 'Train Tracks Maze', 'dificil', '🚂', '🚉', '¡Lleva el tren hasta la estación!', 'Drive the train to the station!'],
  ['space-launch-maze-maze', 'Lanzamiento Espacial', 'Space Launch Maze', 'dificil', '👩‍🚀', '🚀', '¡Llega al cohete antes del despegue!', 'Reach the rocket before liftoff!'],
  ['rocket-maze-maze', 'El Cohete', 'Rocket Maze', 'facil', '🚀', '🌙', '¡Vuela el cohete hasta la luna!', 'Fly the rocket to the moon!'],
  ['planet-hop-maze-maze', 'Salto de Planetas', 'Planet Hop Maze', 'medio', '🛸', '🪐', '¡Visita el planeta de los anillos!', 'Visit the ringed planet!'],
  ['astronaut-maze-maze', 'El Astronauta', 'Astronaut Maze', 'medio', '👨‍🚀', '🛰️', '¡Ayuda al astronauta a llegar al satélite!', 'Help the astronaut reach the satellite!'],
  ['galaxy-maze-maze', 'La Galaxia', 'Galaxy Maze', 'dificil', '🚀', '🌌', '¡Cruza toda la galaxia!', 'Cross the whole galaxy!'],
  ['star-map-maze-maze', 'Mapa de Estrellas', 'Star Map Maze', 'dificil', '🔭', '⭐', '¡Encuentra la estrella más brillante!', 'Find the brightest star!'],
  ['black-hole-maze-maze', 'El Agujero Negro', 'Black Hole Maze', 'dificil', '🛸', '🏠', '¡Esquiva el agujero negro y vuelve a casa!', 'Dodge the black hole and get home!'],
  ['hero-training-maze-maze', 'Entrenamiento de Héroe', 'Hero Training Maze', 'facil', '🦸', '🏅', '¡Completa el entrenamiento!', 'Finish the training!'],
  ['city-rescue-maze-maze', 'Rescate en la Ciudad', 'City Rescue Maze', 'medio', '🦸‍♀️', '🐱', '¡Rescata al gatito!', 'Rescue the kitten!'],
  ['superpower-maze-maze', 'El Superpoder', 'Superpower Maze', 'medio', '🦸‍♂️', '⚡', '¡Encuentra tu superpoder!', 'Find your superpower!'],
  ['villain-maze-maze', 'La Guarida', 'Villain Maze', 'dificil', '🦸', '💎', '¡Recupera el diamante perdido!', 'Get back the lost diamond!'],
  ['hero-hq-maze-maze', 'Cuartel de Héroes', 'Hero HQ Maze', 'dificil', '🦸‍♀️', '🏢', '¡Vuelve al cuartel de los héroes!', 'Return to hero headquarters!'],
  ['final-battle-maze-maze', 'El Gran Desafío', 'Final Challenge Maze', 'dificil', '🦸‍♂️', '🏆', '¡Llega al trofeo final!', 'Reach the final trophy!'],
  ['castle-maze-maze', 'El Castillo', 'Castle Maze', 'facil', '🤴', '🏰', '¡Lleva al príncipe a su castillo!', 'Take the prince to his castle!'],
  ['dragon-cave-maze-maze', 'La Cueva del Dragón', 'Dragon Cave Maze', 'medio', '🐉', '💰', '¡Ayuda al dragón a encontrar su tesoro!', 'Help the dragon find its treasure!'],
  ['enchanted-forest-maze-maze', 'El Bosque Encantado', 'Enchanted Forest Maze', 'medio', '🧚', '🍄', '¡Lleva al hada a su casita!', 'Take the fairy to her little house!'],
  ['magic-tower-maze-maze', 'La Torre Mágica', 'Magic Tower Maze', 'dificil', '🧙', '📜', '¡Encuentra el libro de hechizos!', 'Find the spell book!'],
  ['unicorn-garden-maze-maze', 'El Jardín del Unicornio', 'Unicorn Garden Maze', 'facil', '🦄', '🌈', '¡Lleva al unicornio al arcoíris!', 'Take the unicorn to the rainbow!'],
  ['wizard-maze-maze', 'El Mago', 'Wizard Maze', 'dificil', '🧙‍♂️', '🔮', '¡Ayuda al mago a encontrar su bola mágica!', 'Help the wizard find his crystal ball!'],
  ['fire-station-maze-maze', 'La Estación de Bomberos', 'Fire Station Maze', 'facil', '🚒', '🏠', '¡Llega rápido a la casa!', 'Get to the house fast!'],
  ['hospital-maze-maze', 'El Hospital', 'Hospital Maze', 'facil', '🚑', '🏥', '¡Lleva la ambulancia al hospital!', 'Drive the ambulance to the hospital!'],
  ['city-jobs-maze-maze', 'Oficios de la Ciudad', 'City Jobs Maze', 'medio', '👮', '🏙️', '¡Ayuda al policía a patrullar la ciudad!', 'Help the officer patrol the city!'],
  ['construction-maze-maze', 'La Construcción', 'Construction Maze', 'medio', '🚜', '🏗️', '¡Lleva el tractor a la obra!', 'Drive the tractor to the building site!'],
  ['farm-maze-maze', 'La Granja', 'Farm Maze', 'facil', '🐄', '🌾', '¡Lleva a la vaca al pasto!', 'Take the cow to the field!'],
  ['big-city-maze-maze', 'La Gran Ciudad', 'Big City Maze', 'dificil', '🚌', '🏫', '¡Lleva el autobús a la escuela!', 'Drive the bus to school!'],
  ['soccer-field-maze-maze', 'La Cancha de Fútbol', 'Soccer Field Maze', 'facil', '⚽', '🥅', '¡Mete el gol!', 'Score the goal!'],
  ['sports-arena-maze-maze', 'La Arena Deportiva', 'Sports Arena Maze', 'medio', '🏀', '🏆', '¡Llega a la canasta ganadora!', 'Reach the winning basket!'],
  ['olympic-maze-maze', 'Los Juegos Olímpicos', 'Olympic Maze', 'medio', '🏃', '🥇', '¡Corre hasta la medalla de oro!', 'Run to the gold medal!'],
  ['stadium-maze-maze', 'El Estadio', 'Stadium Maze', 'dificil', '⚾', '🧤', '¡Lleva la pelota al guante!', 'Get the ball to the glove!'],
  ['gym-maze-maze', 'El Gimnasio', 'Gym Maze', 'facil', '🤸', '🏅', '¡Termina la rutina!', 'Finish the routine!'],
  ['championship-maze-maze', 'El Campeonato', 'Championship Maze', 'dificil', '🎾', '🏆', '¡Gana el campeonato!', 'Win the championship!'],
  ['pizza-delivery-maze-maze', 'Entrega de Pizza', 'Pizza Delivery Maze', 'facil', '🛵', '🍕', '¡Entrega la pizza caliente!', 'Deliver the hot pizza!'],
  ['fruit-garden-maze-maze', 'El Huerto de Frutas', 'Fruit Garden Maze', 'facil', '🐛', '🍎', '¡Lleva al gusanito a la manzana!', 'Take the little worm to the apple!'],
  ['kitchen-maze-maze', 'La Cocina', 'Kitchen Maze', 'medio', '👩‍🍳', '🎂', '¡Llega al pastel de cumpleaños!', 'Get to the birthday cake!'],
  ['restaurant-maze-maze', 'El Restaurante', 'Restaurant Maze', 'medio', '👨‍🍳', '🍽️', '¡Lleva la comida a la mesa!', 'Bring the food to the table!'],
  ['bakery-maze-maze', 'La Panadería', 'Bakery Maze', 'facil', '🐭', '🧀', '¡Lleva al ratón hasta el queso!', 'Take the mouse to the cheese!'],
  ['food-market-maze-maze', 'El Mercado', 'Food Market Maze', 'dificil', '🛒', '🥕', '¡Encuentra las zanahorias!', 'Find the carrots!'],
  ['garden-maze-maze', 'El Jardín', 'Garden Maze', 'facil', '🐝', '🌻', '¡Lleva a la abeja al girasol!', 'Take the bee to the sunflower!'],
  ['forest-path-maze-maze', 'El Sendero del Bosque', 'Forest Path Maze', 'facil', '🦊', '🏡', '¡Ayuda al zorro a volver a casa!', 'Help the fox get home!'],
  ['mountain-trail-maze-maze', 'La Montaña', 'Mountain Trail Maze', 'medio', '🐐', '⛰️', '¡Sube hasta la cima!', 'Climb to the top!'],
  ['jungle-path-maze-maze', 'El Camino de la Selva', 'Jungle Path Maze', 'medio', '🐯', '🌴', '¡Guía al tigre por la selva!', 'Guide the tiger through the jungle!'],
  ['river-maze-maze', 'El Río', 'River Maze', 'dificil', '🛶', '🏕️', '¡Rema hasta el campamento!', 'Paddle to the campsite!'],
  ['volcano-path-maze-maze', 'Camino al Volcán', 'Volcano Path Maze', 'dificil', '🧗', '🌋', '¡Llega a ver el volcán!', 'Get to see the volcano!'],
  ['christmas-tree-maze-maze', 'El Árbol de Navidad', 'Christmas Tree Maze', 'facil', '🎅', '🎄', '¡Lleva a Santa al árbol!', 'Take Santa to the tree!'],
  ['halloween-maze-maze', 'Noche de Halloween', 'Halloween Maze', 'facil', '🧒', '🍬', '¡Encuentra los dulces!', 'Find the candy!'],
  ['easter-egg-hunt-maze-maze', 'Búsqueda de Huevos de Pascua', 'Easter Egg Hunt Maze', 'facil', '🐰', '🥚', '¡Ayuda al conejo a encontrar el huevo!', 'Help the bunny find the egg!'],
  ['holiday-party-maze-maze', 'La Fiesta', 'Holiday Party Maze', 'medio', '🥳', '🎁', '¡Llega a los regalos!', 'Get to the presents!'],
  ['winter-maze-maze', 'El Invierno', 'Winter Maze', 'medio', '⛄', '🧣', '¡Lleva la bufanda al muñeco de nieve!', 'Bring the scarf to the snowman!'],
  ['festival-maze-maze', 'El Festival', 'Festival Maze', 'dificil', '🎈', '🎡', '¡Llega a la rueda de la fortuna!', 'Reach the Ferris wheel!'],
  ['puppy-maze-maze', 'El Perrito', 'Puppy Maze', 'facil', '🐶', '🦴', '¡Ayuda al perrito a encontrar su hueso!', 'Help the puppy find its bone!'],
  ['kitten-maze-maze', 'El Gatito', 'Kitten Maze', 'facil', '🐱', '🧶', '¡Lleva al gatito a su ovillo!', 'Take the kitten to its yarn!'],
  ['pet-park-maze-maze', 'El Parque de Mascotas', 'Pet Park Maze', 'facil', '🐕', '🎾', '¡Busca la pelota!', 'Fetch the ball!'],
  ['bug-garden-maze-maze', 'El Jardín de Bichos', 'Bug Garden Maze', 'medio', '🐞', '🍃', '¡Lleva a la mariquita a la hoja!', 'Take the ladybug to the leaf!'],
  ['pet-show-maze-maze', 'La Exposición de Mascotas', 'Pet Show Maze', 'medio', '🐩', '🎀', '¡Llega al moño del premio!', 'Get to the prize ribbon!'],
  ['butterfly-maze-maze', 'La Mariposa', 'Butterfly Maze', 'medio', '🦋', '🌸', '¡Lleva a la mariposa a la flor!', 'Take the butterfly to the flower!'],
  // ── new ──
  ['laberinto-tortuga', 'La Tortuga y el Mar', 'Turtle to the Sea', 'facil', '🐢', '🌊', '¡Ayuda a la tortuguita a llegar al mar!', 'Help the baby turtle reach the sea!'],
  ['laberinto-oso-miel', 'El Oso y la Miel', 'Bear and Honey', 'facil', '🐻', '🍯', '¡Lleva al oso hasta la miel!', 'Take the bear to the honey!'],
  ['laberinto-pollito', 'El Pollito', 'Little Chick', 'facil', '🐥', '🐔', '¡Ayuda al pollito a encontrar a mamá!', 'Help the chick find its mom!'],
  ['laberinto-pez-payaso', 'El Pez Payaso', 'Clownfish Maze', 'facil', '🐠', '🐚', '¡Lleva al pez a su coral!', 'Take the fish to its coral!'],
  ['laberinto-ardilla', 'La Ardilla', 'Squirrel Maze', 'facil', '🐿️', '🌰', '¡Ayuda a la ardilla a encontrar su bellota!', 'Help the squirrel find its acorn!'],
  ['laberinto-conejo-zanahoria', 'Conejo y Zanahoria', 'Bunny and Carrot', 'facil', '🐇', '🥕', '¡Lleva al conejo hasta la zanahoria!', 'Take the bunny to the carrot!'],
  ['laberinto-barco', 'El Barquito', 'Little Boat', 'facil', '⛵', '🏝️', '¡Navega hasta la isla!', 'Sail to the island!'],
  ['laberinto-helado', 'El Helado', 'Ice Cream Maze', 'facil', '👧', '🍦', '¡Llega al carrito de helados!', 'Get to the ice cream cart!'],
  ['laberinto-cumpleanos', 'El Cumpleaños', 'Birthday Maze', 'facil', '🧒', '🎂', '¡Llega a tu fiesta de cumpleaños!', 'Get to your birthday party!'],
  ['laberinto-pirata', 'El Tesoro Pirata', 'Pirate Treasure', 'medio', '🏴‍☠️', '💰', '¡Encuentra el cofre del tesoro!', 'Find the treasure chest!'],
  ['laberinto-koala', 'El Koala', 'Koala Maze', 'medio', '🐨', '🌿', '¡Lleva al koala a su eucalipto!', 'Take the koala to its eucalyptus!'],
  ['laberinto-panda', 'El Panda', 'Panda Maze', 'medio', '🐼', '🎋', '¡Ayuda al panda a encontrar el bambú!', 'Help the panda find the bamboo!'],
  ['laberinto-bicicleta', 'Paseo en Bicicleta', 'Bike Ride Maze', 'medio', '🚲', '🏞️', '¡Pedalea hasta el parque!', 'Ride to the park!'],
  ['laberinto-carta', 'La Carta', 'The Letter Maze', 'medio', '📮', '🏠', '¡Entrega la carta en la casa!', 'Deliver the letter to the house!'],
  ['laberinto-biblioteca', 'La Biblioteca', 'Library Maze', 'medio', '👩‍🎓', '📚', '¡Encuentra el libro de cuentos!', 'Find the storybook!'],
  ['laberinto-semilla', 'La Semilla', 'Little Seed Maze', 'medio', '💧', '🌱', '¡Riega la semilla para que crezca!', 'Water the seed so it grows!'],
  ['laberinto-submarino', 'El Submarino', 'Submarine Maze', 'dificil', '🐙', '⚓', '¡Lleva al pulpo hasta el ancla!', 'Take the octopus to the anchor!'],
  ['laberinto-piramide', 'La Pirámide', 'Pyramid Maze', 'dificil', '🐪', '🏜️', '¡Cruza el desierto en camello!', 'Cross the desert by camel!'],
  ['laberinto-iglu', 'El Iglú', 'Igloo Maze', 'dificil', '🐧', '🧊', '¡Llega al iglú antes de la tormenta!', 'Reach the igloo before the storm!'],
  ['laberinto-ballena', 'La Ballena', 'Whale Maze', 'dificil', '🐋', '🌅', '¡Nada hasta el atardecer!', 'Swim to the sunset!'],
  ['laberinto-robot', 'El Robot', 'Robot Maze', 'dificil', '🤖', '🔋', '¡Ayuda al robot a cargar su batería!', "Help the robot charge its battery!"],
  ['laberinto-buho', 'El Búho Nocturno', 'Night Owl Maze', 'dificil', '🦉', '🌙', '¡Vuela hasta la luna!', 'Fly to the moon!'],
  ['laberinto-ciudad-noche', 'La Ciudad de Noche', 'City at Night', 'dificil', '🚖', '🏨', '¡Llega al hotel!', 'Get to the hotel!'],
  ['laberinto-colmena', 'La Colmena', 'Beehive Maze', 'dificil', '🐝', '🍯', '¡Lleva el néctar a la colmena!', 'Bring the nectar to the hive!'],
  ['laberinto-montana-nevada', 'La Montaña Nevada', 'Snowy Mountain', 'dificil', '🎿', '🏔️', '¡Esquía hasta la cabaña!', 'Ski down to the cabin!'],
  ['laberinto-castillo-arena', 'Castillo de Arena', 'Sandcastle Maze', 'dificil', '🦀', '🏖️', '¡Lleva al cangrejo al castillo de arena!', 'Take the crab to the sandcastle!'],
  ['laberinto-ovni', 'El OVNI', 'UFO Maze', 'dificil', '👽', '🛸', '¡Ayuda al extraterrestre a volver a su nave!', 'Help the alien get back to its ship!'],
  ['laberinto-gran-premio', 'El Gran Premio', 'Grand Prix Maze', 'dificil', '🏎️', '🏆', '¡Gana el gran premio!', 'Win the grand prix!'],
];

// Grid size and look per level. Cells shrink as mazes get harder.
const LEVEL = {
  facil:   { cols: 7,  rows: 9,  wall: 7, age: '3-5' },
  medio:   { cols: 12, rows: 15, wall: 5, age: '6-8' },
  dificil: { cols: 18, rows: 23, wall: 3.5, age: '9-12' },
};

const N = 1, S = 2, E = 4, Wb = 8;           // passage bits
const DX = { [N]: 0, [S]: 0, [E]: 1, [Wb]: -1 };
const DY = { [N]: -1, [S]: 1, [E]: 0, [Wb]: 0 };
const OPP = { [N]: S, [S]: N, [E]: Wb, [Wb]: E };

// Iterative recursive-backtracker → perfect maze. grid[y][x] holds open-passage bits.
function carve(cols, rows, rand) {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const stack = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = L.shuffle([N, S, E, Wb], rand).filter(d => {
      const nx = x + DX[d], ny = y + DY[d];
      return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny][nx];
    });
    if (!dirs.length) { stack.pop(); continue; }
    const d = dirs[0], nx = x + DX[d], ny = y + DY[d];
    grid[y][x] |= d; grid[ny][nx] |= OPP[d];
    seen[ny][nx] = true;
    stack.push([nx, ny]);
  }
  return grid;
}

// BFS over the whole grid from (0,0); returns the path to (cols-1, rows-1) as [x,y]
// cells and how many cells were reached (must be all of them).
function solve(grid) {
  const rows = grid.length, cols = grid[0].length;
  const prev = new Map([['0,0', null]]);
  const q = [[0, 0]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of [N, S, E, Wb]) {
      if (!(grid[y][x] & d)) continue;
      const k = `${x + DX[d]},${y + DY[d]}`;
      if (!prev.has(k)) { prev.set(k, `${x},${y}`); q.push([x + DX[d], y + DY[d]]); }
    }
  }
  const end = `${cols - 1},${rows - 1}`;
  if (!prev.has(end)) return null;
  const path = [];
  for (let k = end; k; k = prev.get(k)) path.push(k.split(',').map(Number));
  return { path: path.reverse(), reached: prev.size };
}

// Hard guarantees before a sheet is written.
function verify(grid, sol, slug) {
  const rows = grid.length, cols = grid[0].length;
  let passages = 0;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = grid[y][x];
    if (v & E) passages++;
    if (v & S) passages++;
    if ((v & E) && !(grid[y][x + 1] & Wb)) throw new Error(`${slug}: asymmetric wall`);
    if ((v & S) && !(grid[y + 1][x] & N)) throw new Error(`${slug}: asymmetric wall`);
  }
  if (!sol) throw new Error(`${slug}: no path from start to finish`);
  if (sol.reached !== rows * cols) throw new Error(`${slug}: unreachable cells`);
  if (passages !== rows * cols - 1) throw new Error(`${slug}: not a perfect maze (loops)`);
}

function mazeBody(t, grid, sol, withAnswer) {
  const [, , , diff, char, dest] = t;
  const lv = LEVEL[diff];
  const rows = grid.length, cols = grid[0].length;
  // Space for the character above the entrance and the goal below the exit.
  const top = L.BODY_TOP + 64, bottom = L.BODY_BOTTOM - 70;
  const cell = Math.floor(Math.min((L.W - 120) / cols, (bottom - top) / rows));
  const mw = cell * cols, mh = cell * rows;
  const x0 = Math.round((L.W - mw) / 2), y0 = Math.round(top + (bottom - top - mh) / 2);
  const ink = '#1e293b';

  // Outer border with an opening at top-left (entrance) and bottom-right (exit).
  let d = `M${x0 + cell},${y0}H${x0 + mw}V${y0 + mh}M${x0 + mw - cell},${y0 + mh}H${x0}V${y0}`;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = grid[y][x], px = x0 + x * cell, py = y0 + y * cell;
    if (x < cols - 1 && !(v & E)) d += `M${px + cell},${py}V${py + cell}`;
    if (y < rows - 1 && !(v & S)) d += `M${px},${py + cell}H${px + cell}`;
  }

  const emo = Math.round(Math.min(56, Math.max(40, cell * 0.9)));
  const sx = x0 + cell / 2, ex = x0 + mw - cell / 2;
  let out = '';
  // Entrance: character above the gap, arrow pointing in.
  out += `<text x="${sx}" y="${y0 - 14}" text-anchor="middle" font-family="${L.EMOJI_FONT}" font-size="${emo}">${char}</text>`;
  out += `<text x="${sx + emo * 0.75}" y="${y0 - 22}" font-family="${L.BODY_FONT}" font-size="15" font-weight="900" fill="#16a34a">INICIO ↓</text>`;
  // Exit: goal below the gap.
  out += `<text x="${ex}" y="${y0 + mh + emo + 6}" text-anchor="middle" font-family="${L.EMOJI_FONT}" font-size="${emo}">${dest}</text>`;
  out += `<text x="${ex - emo * 0.75}" y="${y0 + mh + 30}" text-anchor="end" font-family="${L.BODY_FONT}" font-size="15" font-weight="900" fill="#dc2626">↓ META</text>`;

  if (withAnswer) {
    const pts = sol.path.map(([x, y]) => `${x0 + x * cell + cell / 2},${y0 + y * cell + cell / 2}`);
    pts.unshift(`${sx},${y0 - 4}`);
    pts.push(`${ex},${y0 + mh + 4}`);
    out += `<polyline points="${pts.join(' ')}" fill="none" stroke="#f43f5e" stroke-width="${Math.max(4, cell * 0.28)}" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`;
  }
  out += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${lv.wall}" stroke-linecap="round"/>`;
  return out;
}

function build() {
  const counts = { facil: 0, medio: 0, dificil: 0 };
  const items = THEMES.map(t => {
    const [slug, es, en, diff] = t;
    counts[diff]++;
    const lv = LEVEL[diff];
    const grid = carve(lv.cols, lv.rows, L.rng(L.seedOf('maze:' + slug)));
    const sol = solve(grid);
    verify(grid, sol, slug);
    const common = { cat: 'laberintos', title: es, diff };
    return {
      slug, title_es: es, title_en: en, diff, age: lv.age,
      desc_es: `${es}: laberinto para imprimir gratis, nivel ${L.DIFF[diff].es.toLowerCase()}, para niños de ${lv.age} años. ${t[6]} Incluye solución.`,
      desc_en: `${en}: free printable maze, ${L.DIFF[diff].en.toLowerCase()} level, for kids aged ${lv.age}. ${t[7]} Answer key included.`,
      tip_es: 'Primero sigue el camino con el dedo y después trázalo con un lápiz. Si te equivocas, ¡usa una goma y vuelve a intentar!',
      tip_en: 'Trace the path with your finger first, then with a pencil. Made a mistake? Erase it and try again!',
      sheet: L.sheet({ ...common, instruction: `${t[6]} Ve de INICIO a META.`, body: mazeBody(t, grid, sol, false) }),
      answer: L.sheet({ ...common, instruction: 'Este es el camino correcto', body: mazeBody(t, grid, sol, true), answer: true }),
      pathLen: sol.path.length,
    };
  });
  if (items.length !== 100) throw new Error(`expected 100 mazes, got ${items.length}`);
  console.log('niveles:', counts);
  L.writeCategory('laberintos', items);
}

build();
