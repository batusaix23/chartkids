'use strict';
// printables/gen-certificados.js — 50 printable certificates. The item page has a
// name field that fills the [data-name] text before printing.
// Run: node printables/gen-certificados.js

const L = require('./lib');
const { W, H, FONT, BODY_FONT, EMOJI_FONT, esc } = L;

// [slug, title_es, title_en, emoji, color, award line, reason]
const CERTS = [
  ['lector-estrella', 'Lector Estrella', 'Star Reader', '📚', '#6366f1', 'LECTOR ESTRELLA', 'por leer con entusiasmo y descubrir nuevas historias.'],
  ['genio-matematicas', 'Genio de las Matemáticas', 'Math Genius', '🧮', '#0ea5e9', 'GENIO DE LAS MATEMÁTICAS', 'por resolver problemas con esfuerzo y buenas ideas.'],
  ['buen-comportamiento', 'Buen Comportamiento', 'Good Behavior', '😇', '#22c55e', 'BUEN COMPORTAMIENTO', 'por ser amable, respetuoso y seguir las reglas.'],
  ['super-ayudante', 'Súper Ayudante', 'Super Helper', '🦸', '#ef4444', 'SÚPER AYUDANTE', 'por ayudar siempre a los demás con una sonrisa.'],
  ['mejor-amigo', 'Mejor Amigo', 'Best Friend', '🤝', '#f59e0b', 'AMIGO DE ORO', 'por compartir, escuchar y cuidar a sus amigos.'],
  ['valentia', 'Valentía', 'Bravery', '🦁', '#ea580c', 'VALENTÍA', 'por enfrentar sus miedos con mucho valor.'],
  ['creatividad', 'Creatividad', 'Creativity', '🎨', '#ec4899', 'MENTE CREATIVA', 'por imaginar, crear y llenar el mundo de color.'],
  ['deportista', 'Gran Deportista', 'Great Athlete', '⚽', '#16a34a', 'GRAN DEPORTISTA', 'por jugar limpio, esforzarse y trabajar en equipo.'],
  ['mejor-esfuerzo', 'Mejor Esfuerzo', 'Best Effort', '💪', '#8b5cf6', 'MEJOR ESFUERZO', 'por nunca rendirse y dar siempre lo mejor.'],
  ['puntualidad', 'Puntualidad', 'Punctuality', '⏰', '#0891b2', 'SIEMPRE PUNTUAL', 'por llegar a tiempo todos los días.'],
  ['orden', 'Orden y Limpieza', 'Neat and Tidy', '🧹', '#14b8a6', 'ORDEN Y LIMPIEZA', 'por mantener sus cosas ordenadas y limpias.'],
  ['respeto', 'Respeto', 'Respect', '🌍', '#2563eb', 'RESPETO', 'por tratar a todos con amabilidad y respeto.'],
  ['compartir', 'Compartir', 'Sharing', '🍪', '#d97706', 'CORAZÓN GENEROSO', 'por compartir con los demás sin que se lo pidan.'],
  ['escritor', 'Gran Escritor', 'Great Writer', '✍️', '#7c3aed', 'GRAN ESCRITOR', 'por escribir con letra clara y mucha imaginación.'],
  ['cientifico', 'Pequeño Científico', 'Little Scientist', '🔬', '#10b981', 'PEQUEÑO CIENTÍFICO', 'por hacer preguntas, experimentar y descubrir.'],
  ['artista', 'Artista del Mes', 'Artist of the Month', '🖌️', '#db2777', 'ARTISTA DEL MES', 'por sus dibujos llenos de color y alegría.'],
  ['musico', 'Estrella Musical', 'Music Star', '🎵', '#9333ea', 'ESTRELLA MUSICAL', 'por cantar, tocar y compartir su música.'],
  ['graduacion-preescolar', 'Graduación de Preescolar', 'Preschool Graduation', '🎓', '#1d4ed8', 'GRADUADO DE PREESCOLAR', 'por terminar con éxito su etapa de preescolar.'],
  ['graduacion-kinder', 'Graduación de Kínder', 'Kindergarten Graduation', '🎓', '#be185d', 'GRADUADO DE KÍNDER', 'por terminar con éxito el kínder. ¡A la primaria!'],
  ['graduacion-primaria', 'Graduación de Primaria', 'Elementary Graduation', '🎓', '#0f766e', 'GRADUADO DE PRIMARIA', 'por terminar la primaria con esfuerzo y dedicación.'],
  ['cumpleanos', 'Feliz Cumpleaños', 'Happy Birthday', '🎂', '#f43f5e', '¡FELIZ CUMPLEAÑOS!', 'por cumplir un año más lleno de aventuras.'],
  ['primer-diente', 'Mi Primer Diente', 'My First Lost Tooth', '🦷', '#38bdf8', 'PRIMER DIENTE PERDIDO', 'por ser valiente al perder su primer diente.'],
  ['ir-al-bano', 'Ya Voy al Baño Solito', 'Potty Champion', '🚽', '#06b6d4', 'CAMPEÓN DEL BAÑO', 'por aprender a ir al baño solito. ¡Lo lograste!'],
  ['dormir-solo', 'Duermo en Mi Cama', 'Sleeping in My Own Bed', '🛏️', '#6366f1', 'DORMILÓN VALIENTE', 'por dormir toda la noche en su propia cama.'],
  ['come-verduras', 'Comelón de Verduras', 'Veggie Eater', '🥦', '#65a30d', 'COMELÓN DE VERDURAS', 'por probar y comer sus verduras.'],
  ['primer-dia-escuela', 'Primer Día de Escuela', 'First Day of School', '🎒', '#f97316', 'PRIMER DÍA DE ESCUELA', 'por empezar la escuela con valentía y alegría.'],
  ['nadador', 'Gran Nadador', 'Swimming Star', '🏊', '#0284c7', 'GRAN NADADOR', 'por aprender a nadar y no tenerle miedo al agua.'],
  ['bicicleta', 'Sin Rueditas', 'Bike Rider', '🚲', '#16a34a', 'CICLISTA SIN RUEDITAS', 'por aprender a andar en bicicleta solito.'],
  ['dientes-limpios', 'Dientes Brillantes', 'Sparkling Teeth', '🦷', '#22d3ee', 'DIENTES BRILLANTES', 'por cepillarse los dientes todos los días.'],
  ['tareas', 'Tareas Completas', 'Homework Hero', '📝', '#a855f7', 'HÉROE DE LAS TAREAS', 'por hacer sus tareas a tiempo y con cuidado.'],
  ['lector-del-mes', 'Lector del Mes', 'Reader of the Month', '📖', '#4f46e5', 'LECTOR DEL MES', 'por la cantidad de libros que leyó este mes.'],
  ['estrella-semana', 'Estrella de la Semana', 'Star of the Week', '⭐', '#eab308', 'ESTRELLA DE LA SEMANA', 'por brillar esta semana con su buena actitud.'],
  ['super-hermano', 'Súper Hermano', 'Super Brother', '👦', '#3b82f6', 'SÚPER HERMANO', 'por cuidar, jugar y ayudar a sus hermanos.'],
  ['super-hermana', 'Súper Hermana', 'Super Sister', '👧', '#ec4899', 'SÚPER HERMANA', 'por cuidar, jugar y ayudar a sus hermanos.'],
  ['ajedrez', 'Campeón de Ajedrez', 'Chess Champion', '♟️', '#334155', 'CAMPEÓN DE AJEDREZ', 'por pensar cada jugada con paciencia.'],
  ['ayudante-casa', 'Ayudante de Casa', 'Home Helper', '🏠', '#f59e0b', 'AYUDANTE DE CASA', 'por ayudar en las tareas de la casa.'],
  ['cuida-planeta', 'Guardián del Planeta', 'Planet Protector', '🌱', '#15803d', 'GUARDIÁN DEL PLANETA', 'por reciclar, ahorrar agua y cuidar la naturaleza.'],
  ['amigo-animales', 'Amigo de los Animales', 'Animal Friend', '🐶', '#b45309', 'AMIGO DE LOS ANIMALES', 'por cuidar y respetar a los animales.'],
  ['paciencia', 'Paciencia', 'Patience', '🐢', '#0d9488', 'GRAN PACIENCIA', 'por saber esperar su turno con calma.'],
  ['honestidad', 'Honestidad', 'Honesty', '💎', '#0369a1', 'HONESTIDAD', 'por decir siempre la verdad.'],
  ['gratitud', 'Gratitud', 'Gratitude', '💛', '#ca8a04', 'CORAZÓN AGRADECIDO', 'por dar las gracias y valorar lo que tiene.'],
  ['trabajo-equipo', 'Trabajo en Equipo', 'Teamwork', '🧩', '#7c3aed', 'TRABAJO EN EQUIPO', 'por colaborar y escuchar las ideas de todos.'],
  ['explorador', 'Gran Explorador', 'Great Explorer', '🧭', '#c2410c', 'GRAN EXPLORADOR', 'por su curiosidad y ganas de descubrir el mundo.'],
  ['chef', 'Pequeño Chef', 'Little Chef', '👩‍🍳', '#e11d48', 'PEQUEÑO CHEF', 'por ayudar a cocinar con cuidado y alegría.'],
  ['bailarin', 'Gran Bailarín', 'Dance Star', '💃', '#d946ef', 'ESTRELLA DEL BAILE', 'por bailar con ritmo y mucha energía.'],
  ['mejora', 'Gran Mejora', 'Most Improved', '📈', '#059669', 'GRAN MEJORA', 'por todo lo que ha mejorado con práctica y esfuerzo.'],
  ['asistencia', 'Asistencia Perfecta', 'Perfect Attendance', '📅', '#2563eb', 'ASISTENCIA PERFECTA', 'por no faltar ni un solo día.'],
  ['sonrisa', 'La Mejor Sonrisa', 'Best Smile', '😁', '#f97316', 'LA MEJOR SONRISA', 'por alegrar el día de todos con su sonrisa.'],
  ['abecedario', 'Me Sé el Abecedario', 'I Know My ABCs', '🔤', '#4338ca', 'EXPERTO DEL ABECEDARIO', 'por aprenderse todas las letras del abecedario.'],
  ['numeros', 'Ya Cuento hasta 100', 'I Can Count to 100', '💯', '#dc2626', 'CONTADOR EXPERTO', 'por contar del 1 al 100 sin equivocarse.'],
];

function certSheet([, , , emoji, color, award, reason]) {
  const cx = W / 2;
  const corners = [[96, 120, '⭐'], [W - 96, 120, '✨'], [96, H - 82, '✨'], [W - 96, H - 82, '⭐']];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#fff"/>
<rect x="26" y="26" width="${W - 52}" height="${H - 52}" rx="26" fill="none" stroke="${color}" stroke-width="14"/>
<rect x="50" y="50" width="${W - 100}" height="${H - 100}" rx="16" fill="${color}08" stroke="${color}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
${corners.map(([x, y, s]) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${EMOJI_FONT}" font-size="34">${s}</text>`).join('')}
<text x="${cx}" y="208" text-anchor="middle" font-family="${EMOJI_FONT}" font-size="120">${emoji}</text>
<text x="${cx}" y="300" text-anchor="middle" font-family="${FONT}" font-size="56" fill="${color}" letter-spacing="4">CERTIFICADO</text>
<rect x="${cx - 300}" y="326" width="600" height="64" rx="32" fill="${color}"/>
<text x="${cx}" y="369" text-anchor="middle" font-family="${FONT}" font-size="${award.length > 22 ? 26 : 32}" fill="#fff">${esc(award)}</text>
<text x="${cx}" y="468" text-anchor="middle" font-family="${BODY_FONT}" font-size="24" font-weight="700" fill="#475569">Se otorga con mucho orgullo a</text>
<text x="${cx}" y="570" text-anchor="middle" font-family="${FONT}" font-size="54" fill="#1e293b" data-name=""></text>
<line x1="${cx - 280}" y1="590" x2="${cx + 280}" y2="590" stroke="#1e293b" stroke-width="3"/>
<text x="${cx}" y="660" text-anchor="middle" font-family="${BODY_FONT}" font-size="24" font-weight="700" fill="#334155">${esc(reason)}</text>
<text x="${cx}" y="740" text-anchor="middle" font-family="${EMOJI_FONT}" font-size="40">🏅</text>
<line x1="110" y1="880" x2="350" y2="880" stroke="#1e293b" stroke-width="2"/>
<text x="230" y="910" text-anchor="middle" font-family="${BODY_FONT}" font-size="18" font-weight="800" fill="#64748b">Fecha</text>
<line x1="${W - 350}" y1="880" x2="${W - 110}" y2="880" stroke="#1e293b" stroke-width="2"/>
<text x="${W - 230}" y="910" text-anchor="middle" font-family="${BODY_FONT}" font-size="18" font-weight="800" fill="#64748b">Firma</text>
<text x="${cx}" y="${H - 64}" text-anchor="middle" font-family="${BODY_FONT}" font-size="13" fill="#94a3b8">Imprimible gratis · chartkids.com</text>
</svg>`;
}

function build() {
  if (CERTS.length !== 50) throw new Error(`expected 50, got ${CERTS.length}`);
  return CERTS.map(c => ({
    slug: c[0], title_es: `Certificado: ${c[1]}`, title_en: `Certificate: ${c[2]}`, diff: 'todos', age: '3-12',
    personalize: true,
    desc_es: `Certificado de ${c[1].toLowerCase()} para niños, ${c[6]} Escribe el nombre e imprímelo gratis.`,
    desc_en: `${c[2]} certificate for kids. Type the name and print it for free.`,
    tip_es: 'Escribe el nombre arriba de la hoja y se pondrá en el certificado. Entrégalo en un momento especial: ¡los niños lo recuerdan mucho!',
    tip_en: 'Type the name above the sheet and it appears on the certificate. Hand it over at a special moment — kids remember it!',
    sheet: certSheet(c),
  }));
}

if (require.main === module) L.writeCategory('certificados', build());
module.exports = { build };
