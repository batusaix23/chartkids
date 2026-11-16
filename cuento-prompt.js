// cuento-prompt.js — prompt and parser for the "Cuento del día" (story) feature.
// Imported by worker.js (generateCuento). Kept in its own module so the prompt can be
// tested against several models without touching the Worker.
//
// buildCuentoMessages(facts) → chat messages for Workers AI
//   facts: { lang:'es'|'en', name, petName, petKind, goal, tasks:[string], stars:number }
//   (already cleaned and kid-safe-checked by the caller)
// parseCuento(text) → { title, paragraphs:[string] } or null if unusable

const SYSTEM = {
  es: `Eres una autora latinoamericana de cuentos para niños de 3 a 8 años.
Escribe en español latino neutro, como se habla en México y Latinoamérica: usa "ustedes", nunca "vosotros"; palabras sencillas que entiende un niño de 5 años; oraciones claras y bien escritas, con buena ortografía y acentos.
Tono tierno, divertido y mágico. Nada de miedo, peligro, violencia, tristeza ni temas de adultos.
Formato estricto:
- Primera línea: el título, de 3 a 6 palabras, sin comillas y sin la palabra "Título".
- Después, exactamente 3 párrafos separados por una línea en blanco. Cada párrafo tiene de 4 a 5 oraciones completas (unas 50 palabras). El cuento completo tiene entre 140 y 180 palabras.
- Párrafo 1: presenta al héroe y a su mascota en un lugar mágico.
- Párrafo 2: cada tarea se vuelve una prueba mágica que el héroe supera con alegría. Menciona cada tarea de forma natural.
- Párrafo 3: celebran las estrellas ganadas, mencionan la meta si existe, y terminan con una despedida tranquila de buenas noches que invita a seguir mañana.
Usa solo los datos que te doy: no inventes otros números de estrellas ni otras tareas. Incluye un detalle divertido o tierno de la mascota.
No uses listas, emojis, números de párrafo ni preguntas al lector. Escribe solo el cuento.`,
  en: `You are a children's author writing for kids aged 3 to 8.
Write in simple American English: words a 5-year-old understands, clear and well-written sentences.
Sweet, funny and magical tone. No fear, danger, violence, sadness or adult topics.
Strict format:
- First line: the title, 3 to 6 words, no quotes, without the word "Title".
- Then exactly 3 paragraphs separated by a blank line. Each paragraph has 4 to 5 full sentences (about 50 words). The whole story is 140 to 180 words.
- Paragraph 1: introduce the hero and their pet in a magical place.
- Paragraph 2: each task becomes a magic challenge the hero happily completes. Mention every task naturally.
- Paragraph 3: they celebrate the stars earned, mention the goal if there is one, and end with a calm good-night that invites them to keep going tomorrow.
Use only the details I give you: do not invent other star counts or other tasks. Include one funny or sweet detail about the pet.
No lists, emojis, paragraph numbers or questions to the reader. Write only the story.`,
};

export function buildCuentoMessages(f) {
  const es = f.lang !== 'en';
  const lines = es
    ? [`Héroe del cuento: ${f.name}.`,
       f.petName ? `Su mascota: ${f.petName}${f.petKind ? ', ' + f.petKind.toLowerCase() : ''}.` : 'Su compañera: una estrellita mágica que habla.',
       f.tasks && f.tasks.length ? `Tareas que cumplió (las pruebas mágicas): ${f.tasks.join(', ')}.` : '',
       f.stars ? `Estrellas ganadas en su chart: ${f.stars}.` : '',
       f.goal ? `Su gran meta o premio: ${f.goal}.` : '']
    : [`Hero of the story: ${f.name}.`,
       f.petName ? `Their pet: ${f.petName}${f.petKind ? ', ' + f.petKind.toLowerCase() : ''}.` : 'Their buddy: a little talking magic star.',
       f.tasks && f.tasks.length ? `Tasks they did (the magic challenges): ${f.tasks.join(', ')}.` : '',
       f.stars ? `Stars earned on their chart: ${f.stars}.` : '',
       f.goal ? `Their big goal or reward: ${f.goal}.` : ''];
  return [
    { role: 'system', content: SYSTEM[es ? 'es' : 'en'] },
    { role: 'user', content: (es ? 'Escribe el cuento de hoy con estos datos:\n' : "Write today's story with these details:\n") + lines.filter(Boolean).join('\n') },
  ];
}

export function parseCuento(text, maxParagraphs = 5) {
  const lines = String(text || '').replace(/\r/g, '').split('\n')
    .map(l => l.trim().replace(/^[#*>\-\s]+/, '').replace(/^(p[áa]rrafo|paragraph)\s*\d+\s*[:.\-]\s*/i, ''))
    .filter(Boolean);
  if (lines.length < 3) return null;
  const title = lines[0].replace(/^(t[ií]tulo|title)\s*:\s*/i, '').replace(/^["«“*\s]+|["»”*\s.]+$/g, '').slice(0, 80);
  const paragraphs = lines.slice(1).slice(0, maxParagraphs);
  if (!title || paragraphs.join(' ').length < 200) return null;
  return { title, paragraphs };
}

// ─── "Crea tu historia" (historias.html) ─────────────────────
// buildHistoriaMessages(facts) → messages for a story made from a form
//   facts: { lang, name, age:3-12, companion, place, lesson, length:'corto'|'mediano' }
//   (cleaned and kid-safe-checked by the caller)
export const HISTORIA_LENGTH = {
  corto:   { paragraphs: 3, words: '140 a 180', wordsEn: '140 to 180', maxTokens: 520 },
  mediano: { paragraphs: 6, words: '320 a 400', wordsEn: '320 to 400', maxTokens: 1100 },
};

export function buildHistoriaMessages(f) {
  const es = f.lang !== 'en';
  const L = HISTORIA_LENGTH[f.length] || HISTORIA_LENGTH.corto;
  const system = es
    ? `Eres una autora latinoamericana de cuentos para niños.
Escribe en español latino neutro, como se habla en México y Latinoamérica: usa "ustedes", nunca "vosotros". Buena ortografía y acentos.
Adapta las palabras a un niño de ${f.age} años: oraciones claras, palabras que entienda.
Tono tierno, divertido y mágico. Puede haber un pequeño reto o sorpresa, pero nada de miedo real, peligro, violencia, tristeza fuerte ni temas de adultos.
Formato estricto:
- Primera línea: el título, de 3 a 7 palabras, sin comillas y sin la palabra "Título".
- Después, exactamente ${L.paragraphs} párrafos separados por una línea en blanco. El cuento completo tiene entre ${L.words} palabras.
- El cuento tiene inicio, un pequeño reto en el medio y un final feliz.
- Si hay una lección, muéstrala con lo que pasa en el cuento, sin sermones, y termina con una frase corta y bonita sobre ella.
No uses listas, emojis, números de párrafo ni preguntas al lector. Escribe solo el cuento.`
    : `You are a children's author.
Write in simple American English with correct spelling.
Fit the words to a ${f.age}-year-old child: clear sentences, words they understand.
Sweet, funny and magical tone. There may be a small challenge or surprise, but no real fear, danger, violence, strong sadness or adult topics.
Strict format:
- First line: the title, 3 to 7 words, no quotes, without the word "Title".
- Then exactly ${L.paragraphs} paragraphs separated by a blank line. The whole story is ${L.wordsEn} words.
- The story has a beginning, a small challenge in the middle and a happy ending.
- If there is a lesson, show it through what happens, without preaching, and end with one short, lovely line about it.
No lists, emojis, paragraph numbers or questions to the reader. Write only the story.`;
  const lines = es
    ? [`Protagonista: ${f.name}, de ${f.age} años.`,
       f.companion ? `Su compañero de aventura: ${f.companion}.` : '',
       f.place ? `Dónde ocurre: ${f.place}.` : '',
       f.lesson ? `Lección o valor del cuento: ${f.lesson}.` : '']
    : [`Main character: ${f.name}, ${f.age} years old.`,
       f.companion ? `Adventure buddy: ${f.companion}.` : '',
       f.place ? `Where it happens: ${f.place}.` : '',
       f.lesson ? `Lesson or value: ${f.lesson}.` : ''];
  return [
    { role: 'system', content: system },
    { role: 'user', content: (es ? 'Escribe un cuento nuevo con estos datos:' : 'Write a new story with these details:') + String.fromCharCode(10) + lines.filter(Boolean).join(String.fromCharCode(10)) },
  ];
}
