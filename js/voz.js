// js/voz.js — read text aloud with the browser's own voices (speechSynthesis), shared by
// the story (js/cuento.js) and the pet. No network, no AI.
//  • waits for the voice list (it loads late; reading before that used the default
//    voice — an English voice reading Spanish, which is what made it unintelligible)
//  • Spanish: a Latin American voice first (es-MX, es-US, es-419, other es-XX), Spain
//    (es-ES) only as a last resort; natural/online voices preferred
//  • English: en-US first; natural/online voices preferred
//  • reads sentence by sentence (Chrome cuts long utterances after ~15 s)
//  • never reads Spanish with an English voice: if the device has no Spanish voice,
//    speak() returns false so the page can say so
(function () {
  'use strict';

  const LATAM = ['es-mx', 'es-us', 'es-419', 'es-co', 'es-ar', 'es-cl', 'es-pe', 'es-ve', 'es-ec', 'es-gt', 'es-cr', 'es-pa', 'es-do', 'es-pr', 'es-uy', 'es-py', 'es-bo', 'es-sv', 'es-hn', 'es-ni', 'es-cu'];
  const GOOD = /natural|online|neural|premium|enhanced|google/i;
  // Voice gender by name (system voices don't say it). 'm' = boy, 'f' = girl.
  const MALE = /\b(mark|david|guy|andrew|brian|christopher|eric|roger|steffan|tony|ryan|alex|fred|daniel|aaron|arthur|jorge|ra[uú]l|pablo|alvaro|álvaro|gerardo|diego|carlos|gonzalo|tom[aá]s|juan|jorge|emilio|federico|lorenzo|male)\b/i;
  const FEMALE = /\b(zira|aria|jenny|michelle|ana|emma|ava|hazel|susan|samantha|karen|moira|tessa|victoria|libby|sonia|dalia|sabina|paulina|helena|laura|m[oó]nica|paloma|elvira|elena|salom[eé]|camila|valentina|renata|larissa|female)\b/i;
  // Google's voices without a name ("Google español", "Google US English") are female.
  const genderOf = v => /^Google (espa|US English)/i.test(v.name) ? 'f' : MALE.test(v.name) ? 'm' : FEMALE.test(v.name) ? 'f' : '';

  let voicesReady = null;
  function voices() {
    if (!('speechSynthesis' in window)) return Promise.resolve([]);
    const now = speechSynthesis.getVoices();
    if (now.length) return Promise.resolve(now);
    if (!voicesReady) {
      voicesReady = new Promise(res => {
        const done = () => res(speechSynthesis.getVoices());
        speechSynthesis.addEventListener('voiceschanged', done, { once: true });
        setTimeout(done, 2000);
      });
    }
    return voicesReady;
  }

  const norm = l => String(l || '').toLowerCase().replace('_', '-');
  function score(v, lang, gender) {
    const l = norm(v.lang);
    let s = 0;
    if (lang === 'es') {
      if (!l.startsWith('es')) return -1;
      const i = LATAM.indexOf(l);
      s = i === 0 ? 60 : i > 0 ? 50 : l === 'es' ? 30 : l === 'es-es' ? 10 : 20;
    } else {
      if (!l.startsWith('en')) return -1;
      s = l === 'en-us' ? 60 : l === 'en-gb' ? 45 : 35;
    }
    if (GOOD.test(v.name)) s += 25;
    if (/\b(mark|zira|jorge|ra[uú]l|dalia|sabina)\b/i.test(v.name)) s += 4; // owner's picks among equals
    // The chosen boy/girl voice outweighs 'natural', but never the language/region.
    if (gender) { const g = genderOf(v); if (g === gender) s += 30; else if (g) s -= 5; }
    if (v.localService === false) s += 3; // cloud voices usually sound better
    return s;
  }

  // Best voice for 'es' or 'en', or null if the device has none for that language.
  async function pick(lang, gender) {
    const list = await voices();
    let best = null, bestS = -1;
    for (const v of list) { const s = score(v, lang, gender); if (s > bestS) { best = v; bestS = s; } }
    return bestS >= 0 ? best : null;
  }

  function clean(text) {
    return String(text)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
      .replace(/[«»“”"*_#]/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  function chunks(text) {
    const parts = clean(text).match(/[^.!?…]+[.!?…]*/g) || [clean(text)];
    const out = [];
    let cur = '';
    for (const p of parts.map(s => s.trim()).filter(Boolean)) {
      if ((cur + ' ' + p).length > 180 && cur) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p;
    }
    if (cur) out.push(cur);
    return out;
  }

  // Sentences of a text as written (for showing and highlighting them); speak() takes
  // them back through opts.chunks and reads exactly those, one by one.
  function sentences(text) {
    return (String(text).replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*["»”)]*/g) || [])
      .map(s => s.trim()).filter(s => clean(s));
  }

  let token = 0;
  function stop() { token++; try { speechSynthesis.cancel(); } catch (e) {} }
  function speaking() { try { return speechSynthesis.speaking || speechSynthesis.pending; } catch (e) { return false; } }

  // Speak text in 'es' or 'en'. opts: { voice, gender: 'm'|'f', rate, onend,
  //   chunks: [sentences] to read exactly those, start: index to begin at,
  //   onchunk(i): called as each chunk starts (for highlighting) }.
  // Resolves false if the device has no voice for that language.
  async function speak(text, lang, opts) {
    opts = opts || {};
    if (!('speechSynthesis' in window)) return false;
    stop();
    const my = ++token;
    const voice = opts.voice || await pick(lang, opts.gender);
    if (!voice) return false;
    const parts = opts.chunks || chunks(text);
    let i = opts.start || 0;
    const next = () => {
      if (my !== token) return;
      if (i >= parts.length) { if (opts.onend) opts.onend(); return; }
      const said = clean(parts[i]);
      if (opts.onchunk) opts.onchunk(i);
      i++;
      if (!said) { next(); return; }
      const u = new SpeechSynthesisUtterance(said);
      u.voice = voice; u.lang = voice.lang;
      u.rate = opts.rate || 0.9;
      u.pitch = 1;
      u.onend = next;
      u.onerror = next;
      speechSynthesis.speak(u);
    };
    next();
    return true;
  }

  window.ckVoz = { speak, stop, speaking, pick, voices, score, genderOf, sentences };
})();
