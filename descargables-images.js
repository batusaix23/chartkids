// descargables-images.js — Coloring page images via Pollinations.ai
// Model: flux | Prompts optimized for black-and-white line art
// Seeds 6001-6039: original 13 themes | Seeds 7001-7193: expansion pack (20 themes)

const BASE = 'https://image.pollinations.ai/prompt/';
const OPTS = '&nologo=true&model=flux&width=800&height=1040';

function cpUrl(prompt, seed) {
  return BASE + encodeURIComponent(
    'coloring page for children, ' + prompt +
    ', black line drawing only, no color, no shading, no fill, white background, thick bold outlines, cute kids illustration, printable coloring sheet'
  ) + '?seed=' + seed + OPTS;
}

const COLORING_IMAGES = {

  // ── VEHÍCULOS ──
  car:      cpUrl('cute car driving on road, round headlights, simple windows, trees and buildings background', 6001),
  airplane: cpUrl('airplane flying through clouds, round windows, wings and tail, sky and clouds around', 6002),
  train:    cpUrl('steam train on tracks, locomotive with chimney puffing steam, passenger cars behind, countryside', 6003),

  // ── ANIMALES ──
  lion:     cpUrl('lion with big fluffy mane, sitting proudly, savanna grass and acacia tree in background', 6011),
  dinosaur: cpUrl('friendly T-Rex dinosaur standing upright, small arms, big teeth smile, jungle background', 6012),
  fish:     cpUrl('cute fish with big round eye, fins and scales, underwater with seaweed and bubbles', 6013),

  // ── PERSONAJES ──
  robot:    cpUrl('friendly robot with square body, round eyes, antennae on head, simple mechanical arms and legs', 6021),
  unicorn:  cpUrl('unicorn with flowing mane and tail, spiral horn, stars around, meadow with flowers', 6022),
  doll:     cpUrl('rag doll with button eyes, yarn hair in pigtails, cute dress with bow, sitting pose', 6023),

  // ── NATURALEZA ──
  house:    cpUrl('cozy house with pointed roof, chimney with smoke, garden fence, flowers and trees around', 6031),
  tree:     cpUrl('big oak tree with round leafy canopy, thick trunk, birds sitting on branches, grass below', 6032),
  flower:   cpUrl('large sunflower with petals and seeds, stem with leaves, bee and butterfly nearby, garden', 6033),

  // ── DINOSAURIOS ──
  brachio:  cpUrl('brachiosaurus dinosaur with very long neck eating leaves from tall tree, jungle background', 6041),
  tricera:  cpUrl('triceratops dinosaur with three horns and neck frill, walking in prehistoric landscape', 6042),

  // ── CASTILLOS ──
  castle:   cpUrl('medieval castle with towers, battlements, drawbridge over moat, flag on top, clouds behind', 6051),
  dragon:   cpUrl('friendly dragon with wings spread, scales on body, breathing small flames, mountain background', 6052),
  knight:   cpUrl('knight in full armor with helmet, holding shield and sword, castle gate behind', 6053),

  // ── MAR ──
  dolphin:  cpUrl('dolphin jumping out of ocean waves, splash of water, sun shining, seagulls above', 6061),
  octopus:  cpUrl('cute octopus with eight tentacles, big eyes, underwater coral reef and fish around', 6062),
  shark:    cpUrl('friendly cartoon shark swimming, big smile, underwater with fish and seaweed around', 6063),

  // ── ESPACIO ──
  rocket:   cpUrl('rocket ship blasting off, flames from engines, stars and planets in space background', 6071),
  astronaut:cpUrl('astronaut in full space suit floating in space, helmet visor, Earth and stars behind', 6072),
  planet:   cpUrl('ringed planet like Saturn with bands, moons and stars around, space background', 6073),

  // ── MANDALAS ──
  mandala1: cpUrl('simple circular mandala with flower petals and geometric shapes, symmetric pattern, centered', 6081),
  mandala2: cpUrl('circular mandala with stars and curved leaves, intricate symmetric pattern, for kids to color', 6082),
  mandala3: cpUrl('circular mandala with hearts and swirl patterns, easy symmetric design, kids coloring page', 6083),

  // ── SUPERHÉROES ──
  hero_boy: cpUrl('boy superhero in cape and mask, hands on hips, city skyline in background, heroic pose', 6091),
  hero_girl:cpUrl('girl superhero in cape and mask, flying pose, stars around her, city below', 6092),
  sidekick: cpUrl('small friendly robot sidekick with big round eyes, cape on back, stars around', 6093),

  // ── PRIMAVERA ──
  butterfly:  cpUrl('butterfly with detailed wing patterns, landing on flower, garden with flowers behind', 6101),
  caterpillar:cpUrl('cute caterpillar with round body segments, antennae, walking on leaf with other leaves', 6102),
  ladybug:    cpUrl('round ladybug with spots, six legs, sitting on large leaf, flowers and grass around', 6103),

  // ── HALLOWEEN ──
  pumpkin:  cpUrl('jack-o-lantern pumpkin with carved face, candle glow, bats and full moon behind', 6111),
  ghost:    cpUrl('friendly ghost with round eyes and open mouth smile, floating, stars and moon behind', 6112),
  bat:      cpUrl('cartoon bat with spread wings, big ears, hanging upside down from branch, moon behind', 6113),

  // ── NAVIDAD ──
  christmas_tree: cpUrl('christmas tree with star on top, ornament balls and tinsel, gifts under tree, snow outside window', 6121),
  snowman:        cpUrl('snowman with carrot nose, scarf, buttons, stick arms, snowy landscape and falling snowflakes', 6122),
  santa:          cpUrl('Santa Claus with big belly, red suit and hat, white beard, holding sack of gifts, chimney', 6123),

  // ── GRANJA ──
  vaca:    cpUrl('happy cow standing in farm field, fence and red barn behind, udder visible, spots on body, simple friendly design', 7001),
  cerdo:   cpUrl('cute round pig with curly tail wallowing in mud puddle, farm fence and barn in background', 7002),
  gallina: cpUrl('hen sitting on nest with three eggs, simple feather details, red comb on head, farm fence behind', 7003),

  // ── MASCOTAS ──
  perro:   cpUrl('happy puppy dog sitting and wagging tail, collar with tag, bone on ground, simple park background', 7011),
  gato:    cpUrl('cute cat sitting on window sill, big round eyes, long whiskers, striped fur, curtains behind', 7012),
  conejo:  cpUrl('fluffy rabbit with long upright ears, holding carrot, simple flower garden around it', 7013),

  // ── BOSQUE ──
  oso:     cpUrl('friendly bear walking in autumn forest, mushrooms on ground, falling leaves, simple trees behind', 7021),
  zorro:   cpUrl('cute fox sitting with big bushy tail wrapped around, pointy ears, autumn leaves falling', 7022),
  buho:    cpUrl('round owl perched on tree branch, huge circular eyes, simple feather details, crescent moon and stars', 7023),

  // ── DEPORTES ──
  pelota_futbol: cpUrl('soccer ball in front of goal net, grass field, simple sunny sky with clouds', 7031),
  canasta:       cpUrl('basketball going through hoop net, backboard visible, simple court floor below', 7032),
  bicicleta:     cpUrl('bicycle with flower basket, leaning against tree in park, simple grass and flowers around', 7033),

  // ── COMIDA ──
  helado:       cpUrl('ice cream cone with two big round scoops, dripping drops, waffle cone texture, simple design', 7041),
  hamburguesa:  cpUrl('big hamburger on plate, sesame bun, lettuce tomato cheese layers visible from side, simple', 7042),
  pastel:       cpUrl('three-layer birthday cake with five lit candles, frosting drips on sides, balloons around', 7043),

  // ── FRUTAS ──
  manzana: cpUrl('shiny apple on tree branch with leaf attached, simple orchard background, cheerful shape', 7051),
  sandia:  cpUrl('large watermelon slice with black seeds, polka dot rind pattern, checkered picnic cloth', 7052),
  fresa:   cpUrl('big strawberry with seed dots, green leaves and stem, simple garden flower background', 7053),

  // ── PROFESIONES ──
  doctor:   cpUrl('friendly smiling doctor with stethoscope around neck, holding clipboard, simple clinic room', 7061),
  bombero:  cpUrl('firefighter in full uniform with helmet, holding fire hose, red fire truck visible behind', 7062),
  cocinero: cpUrl('chef in tall white hat and apron, holding large pot with steam rising, kitchen stove behind', 7063),

  // ── TRANSPORTE ──
  autobus:     cpUrl('yellow school bus on road, children visible in windows, trees and simple buildings behind', 7071),
  barco:       cpUrl('sailboat on ocean waves, tall mast with billowing sail, seagulls in sky, sun above', 7072),
  helicoptero: cpUrl('helicopter flying through clouds, spinning rotor blades, simple mountain landscape below', 7073),

  // ── HADAS ──
  hada:     cpUrl('tiny fairy with butterfly wings, holding magic wand with star tip, flying over flower garden', 7081),
  sirena:   cpUrl('mermaid with fish tail and scale pattern, waving hand, coral reef and tropical fish around', 7082),
  princesa: cpUrl('princess in long ballgown wearing crown, castle hall with arched windows, flowers around her', 7083),

  // ── CUMPLEANOS ──
  torta_cumple: cpUrl('birthday cake with five lit candles, dripping frosting, party streamers and confetti around', 7091),
  globos:       cpUrl('bouquet of round balloons tied with long ribbons, floating up, stars and confetti scattered', 7092),
  regalo:       cpUrl('three stacked gift boxes with large bows on top, curling ribbons on sides, confetti stars', 7093),

  // ── MUSICA ──
  guitarra:   cpUrl('acoustic guitar leaning against wall, music notes floating around it, simple design', 7101),
  piano_keys: cpUrl('upright piano with visible black and white keys, music sheet on stand, notes in the air', 7102),
  tambor:     cpUrl('drum kit with bass drum snare tom and cymbals, two drumsticks, stage spotlight above', 7103),

  // ── INSECTOS ──
  abeja:   cpUrl('cute bee with black and white stripes, wings spread, landing on large flower, garden behind', 7111),
  caracol: cpUrl('snail with spiral shell, long antennae out, surrounded by mushrooms and big leaves', 7112),
  hormiga: cpUrl('ant carrying large leaf above its head, line of other ants walking on garden path', 7113),

  // ── AFRICA ──
  elefante: cpUrl('large elephant with big round ears, standing on savanna, acacia tree and simple grass behind', 7121),
  jirafa:   cpUrl('tall giraffe with spot pattern, reaching up to eat leaves from treetop, savanna background', 7122),
  cebra:    cpUrl('zebra with clear bold stripe pattern, walking on open plains, distant acacia trees', 7123),

  // ── SELVA ──
  mono:  cpUrl('playful monkey swinging on vine in jungle, holding banana, large tropical leaves around', 7131),
  loro:  cpUrl('parrot perched on thick branch, wings partially spread, jungle flowers and leaves around', 7132),
  rana:  cpUrl('frog sitting on round lily pad, big round eyes, pond with water lilies and cattails', 7133),

  // ── OCEANO ──
  ballena:      cpUrl('large whale leaping out of ocean, water splashing, blowhole spout, seagulls above', 7141),
  caballito_mar:cpUrl('seahorse with curled tail clinging to coral, small fish and seaweed around it', 7142),
  tortuga_mar:  cpUrl('sea turtle swimming, hexagonal shell segments, tropical fish and coral reef around', 7143),

  // ── INVIERNO ──
  pinguino:   cpUrl('round penguin with white belly and black back, standing on ice, iceberg, falling snowflakes', 7151),
  copo_nieve: cpUrl('large detailed snowflake with six symmetrical arms, intricate crystal branch patterns, centered', 7152),
  oso_polar:  cpUrl('fluffy polar bear with round shape, sitting in snow, pine trees and snowflakes around', 7153),

  // ── PIRATAS ──
  barco_pirata:  cpUrl('pirate ship with skull and crossbones flag, sailing on ocean waves, cannons on the side', 7161),
  cofre_tesoro:  cpUrl('open treasure chest overflowing with coins and gems, sandy beach, palm tree beside it', 7162),
  loro_pirata:   cpUrl('parrot with pirate eyepatch and small hat perched on rope, tropical island background', 7163),

  // ── ESPACIO 2 ──
  alien: cpUrl('friendly alien with big oval eyes, waving from inside spaceship porthole, stars and planet outside', 7171),
  ufo:   cpUrl('flying saucer with dome top, light beam shining down, small farm with cows and house below', 7172),
  luna:  cpUrl('smiling moon face with craters, stars around it, small rocket ship flying nearby', 7173),

  // ── CIUDAD ──
  bomberos_truck: cpUrl('red fire truck on city street, long extending ladder on top, firefighter beside it, buildings', 7181),
  autobus_ciudad: cpUrl('city bus at bus stop, open door, passengers waiting on sidewalk, buildings and trees behind', 7182),
  semaforo_calle: cpUrl('traffic light on pole with red yellow green lights, zebra crosswalk, car stopped, pedestrians', 7183),

  // ── FRUTAS 2 ──
  platano: cpUrl('bunch of bananas with peel texture, large banana leaf behind, simple market stall setting', 7191),
  naranja: cpUrl('orange cut in half showing juicy segments, whole orange beside it, leaves on plate', 7192),
  uvas:    cpUrl('bunch of round grapes hanging from vine, leaves and curling tendrils, wicker basket below', 7193),
};
