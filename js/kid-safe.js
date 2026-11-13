// ChartKids — kid-safe word filter (shared).
// Loaded by colorear-ia.html as a plain <script> and imported by worker.js,
// so the browser and the API apply exactly the same list.
// This is only the first, cheap layer: worker.js also asks the AI to judge and
// rewrite every coloring request before an image is generated.
(function (root) {
  // Whole words (after lowercasing and removing accents).
  const WORDS = [
    // violence / weapons
    'arma','armas','pistola','pistolas','rifle','escopeta','cuchillo','cuchillos','navaja','bomba','bombas',
    'granada','metralleta','balazo','disparo','disparar','guerra','matar','mata','mato','muerte','muerto',
    'muertos','cadaver','sangre','herida','tortura','golpear','pelea','violencia','violento','secuestro',
    'gun','guns','pistol','shotgun','knife','knives','bomb','bombs','grenade','bullet','shoot',
    'shooting','war','kill','killing','killed','dead','death','corpse','blood','bloody','gore','wound',
    'torture','fight','violence','violent','kidnap','weapon','weapons','sword','swords',
    // horror
    'terror','diablo','demonio','demonios','satanas','zombi','zombie','zombies','calavera','esqueleto',
    'horror','devil','demon','demons','satan','skull','creepy','scary','miedo','aterrador',
    // adult
    'sexo','sexy','sensual','desnudo','desnuda','desnudos','bikini','lenceria','porno','beso',
    'sex','nude','naked','lingerie','porn','erotic','kiss',
    // substances
    'droga','drogas','cocaina','marihuana','cerveza','vino','alcohol','borracho','cigarro','cigarrillo','tabaco','vape',
    'drug','drugs','cocaine','weed','beer','wine','drunk','cigarette','smoking','tobacco',
    // hate / self-harm
    'suicidio','racista','odio','suicide','racist','hate',
  ];
  // Word starts — catch plurals/conjugations and obvious variants.
  const STEMS = ['asesin','murder','suicid','desnud','pornogr','sangrient','ensangrent','decapit','mutil','nazi'];

  function normalize(text) {
    return String(text || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ');
  }

  const wordSet = new Set(WORDS);

  // Returns the first blocked word found, or null if the text looks fine.
  function findBlocked(text) {
    for (const w of normalize(text).split(/\s+/)) {
      if (!w) continue;
      if (wordSet.has(w)) return w;
      for (const s of STEMS) if (w.startsWith(s)) return w;
    }
    return null;
  }

  root.KidSafe = { findBlocked, normalize };
})(typeof window !== 'undefined' ? window : globalThis);
