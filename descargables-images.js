// descargables-images.js — AI-generated coloring page images via Pollinations.ai
// Each URL uses a fixed seed for consistency. Model: flux (best for line art)
// Prompt formula: "kids coloring book page, [subject], thick black outlines, white background, no color, printable"

const BASE = 'https://image.pollinations.ai/prompt/';
const OPTS = '&nologo=true&model=flux&width=600&height=780';

function cpUrl(prompt, seed) {
  return BASE + encodeURIComponent(
    'kids coloring book page, ' + prompt +
    ', thick black outlines, white fill, no color, simple cute drawing, clean white background, printable'
  ) + '?seed=' + seed + OPTS;
}

const COLORING_IMAGES = {

  // ── GRANJA ──
  vaca:    cpUrl('cow standing in farm field with fence, grass, sunny sky, spots on body, udder visible', 3001),
  cerdo:   cpUrl('pig rolling in mud puddle on farm, curly tail, big snout, barn in background', 3002),
  gallina: cpUrl('hen sitting on nest with eggs, farm background, comb on head, tail feathers', 3003),

  // ── MASCOTAS ──
  perro:   cpUrl('happy dog sitting in park wagging tail, collar with tag, bone on ground, trees background', 3011),
  gato:    cpUrl('cat sitting on window sill, whiskers, stripes on fur, curtains behind, cozy room', 3012),
  conejo:  cpUrl('rabbit in garden with long ears, carrots and flowers around it, fluffy tail', 3013),

  // ── BOSQUE ──
  oso:     cpUrl('bear walking in autumn forest, trees with falling leaves, mushrooms on ground', 3021),
  zorro:   cpUrl('fox sitting in autumn forest, bushy tail, pointy ears, leaves falling around', 3022),
  buho:    cpUrl('owl perched on branch at night, large eyes, moon and stars behind, forest trees', 3023),

  // ── DEPORTES ──
  pelota_futbol: cpUrl('soccer ball in front of goal net, grass field, sunny day', 3031),
  canasta:       cpUrl('basketball going into hoop with net, backboard visible, court floor', 3032),
  bicicleta:     cpUrl('bicycle leaning against a tree in park, wheels with spokes, grass and flowers', 3033),

  // ── COMIDA ──
  helado:       cpUrl('ice cream cart with two big scoops of ice cream on cone, dripping, park background', 3041),
  hamburguesa:  cpUrl('big hamburger on plate with lettuce tomato and cheese layers, table setting', 3042),
  pastel:       cpUrl('three-layer birthday cake with candles and frosting drips on table, balloons around', 3043),

  // ── FRUTAS ──
  manzana: cpUrl('apple on tree branch with leaves, sunny orchard background', 3051),
  sandia:  cpUrl('watermelon slice with seeds on picnic cloth outdoors, checkered blanket', 3052),
  fresa:   cpUrl('strawberry plant with big strawberry, leaves, bee nearby, garden background', 3053),

  // ── PROFESIONES ──
  doctor:   cpUrl('friendly doctor with stethoscope in clinic, clipboard in hand, medical chart on wall', 3061),
  bombero:  cpUrl('firefighter in uniform with helmet holding hose, fire truck behind, flames on ground', 3062),
  cocinero: cpUrl('chef with tall hat and apron holding big pot with steam, kitchen stove behind', 3063),

  // ── TRANSPORTE ──
  autobus:     cpUrl('school bus on road with buildings and trees behind, windows with kids visible', 3071),
  barco:       cpUrl('sailboat on ocean waves with sail and mast, seagulls flying, sunny sky', 3072),
  helicoptero: cpUrl('helicopter flying in cloudy sky, rotor blades spinning, mountain scenery below', 3073),

  // ── HADAS ──
  hada:     cpUrl('fairy with butterfly wings holding magic wand with star, flying over flowers and garden', 3081),
  sirena:   cpUrl('mermaid underwater with fish tail and scales, coral reef and tropical fish around her', 3082),
  princesa: cpUrl('princess in ballgown with crown standing in throne room, castle window behind', 3083),

  // ── CUMPLEANOS ──
  torta_cumple: cpUrl('birthday cake with five candles and dripping frosting on decorated table, balloons around', 3091),
  globos:       cpUrl('bunch of balloons tied together floating up with ribbons, gift boxes below, confetti', 3092),
  regalo:       cpUrl('stack of wrapped gift boxes with big bows and ribbons, stars and confetti around', 3093),

  // ── MUSICA ──
  guitarra:   cpUrl('acoustic guitar leaning against wall with music notes floating around it', 3101),
  piano_keys: cpUrl('upright piano with keyboard keys visible, music sheet on stand, music notes floating', 3102),
  tambor:     cpUrl('drum kit with bass drum snare and cymbals on stage, drumsticks, spotlight above', 3103),

  // ── INSECTOS ──
  abeja:   cpUrl('bee landing on flower with wings spread, stripes on body, garden with flowers background', 3111),
  caracol: cpUrl('snail with spiral shell in garden, antennae up, mushroom and leaves beside it', 3112),
  hormiga: cpUrl('ant carrying big leaf over head, other ants in line, garden path with pebbles', 3113),

  // ── AFRICA ──
  elefante: cpUrl('elephant standing on savanna with acacia tree behind, wrinkled skin texture, big ears', 3121),
  jirafa:   cpUrl('giraffe eating leaves from tall tree on african savanna, spots on body, sunset behind', 3122),
  cebra:    cpUrl('zebra on african plains with bold stripes on body, distant trees and mountains behind', 3123),

  // ── SELVA ──
  mono:  cpUrl('monkey swinging on vine in jungle, holding banana, tropical leaves and trees around', 3131),
  loro:  cpUrl('parrot perched on branch in jungle, colorful feathers, tropical flowers and leaves around', 3132),
  rana:  cpUrl('frog sitting on lily pad in pond, big eyes, water lilies and reeds around', 3133),

  // ── OCEANO ──
  ballena:      cpUrl('whale jumping out of ocean waves, spout from blowhole, seagulls and horizon behind', 3141),
  caballito_mar:cpUrl('seahorse among colorful coral reef, fins visible, small fish and seaweed around', 3142),
  tortuga_mar:  cpUrl('sea turtle swimming in ocean with hexagonal shell pattern, tropical fish and coral around', 3143),

  // ── INVIERNO ──
  pinguino:   cpUrl('penguin standing on ice with iceberg behind, snowflakes falling, white belly visible', 3151),
  copo_nieve: cpUrl('large detailed snowflake with six symmetrical branches and crystal patterns, winter sky', 3152),
  oso_polar:  cpUrl('polar bear in snowy landscape with pine trees, snowflakes falling, arctic scene', 3153),

  // ── PIRATAS ──
  barco_pirata:  cpUrl('pirate ship with skull and crossbones flag on ocean waves, cannons on side, dramatic sky', 3161),
  cofre_tesoro:  cpUrl('treasure chest open full of gold coins and gems on sandy beach, palm tree behind', 3162),
  loro_pirata:   cpUrl('pirate parrot with eyepatch on pirate hat perch, treasure map in background', 3163),

  // ── ESPACIO 2 ──
  alien: cpUrl('friendly alien with big eyes in spaceship cockpit window, stars and planets outside', 3171),
  ufo:   cpUrl('flying saucer with dome hovering over farm with light beam, tiny cows and house below', 3172),
  luna:  cpUrl('moon with craters and man in moon face, stars around, rocket ship in background', 3173),

  // ── CIUDAD ──
  bomberos_truck: cpUrl('red fire truck on city street with extending ladder, firefighters, buildings behind', 3181),
  autobus_ciudad: cpUrl('city bus at bus stop with passengers, city buildings and trees in background', 3182),
  semaforo_calle: cpUrl('traffic light on city street with crosswalk, car waiting, people crossing, buildings', 3183),

  // ── FRUTAS 2 ──
  platano: cpUrl('bunch of bananas on market stall with banana leaf, tropical fruits around', 3191),
  naranja: cpUrl('orange cut in half showing juicy segments, whole orange beside it on plate with leaf', 3192),
  uvas:    cpUrl('bunch of grapes on vine with leaves and tendrils, wicker basket below in vineyard', 3193),
};
