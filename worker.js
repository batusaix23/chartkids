// ChartKids API Worker - Cloudflare Workers + Workers AI
// Este código va en tu Cloudflare Worker

export default {
  async fetch(request, env) {
    // Manejar CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Solo permitir POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    try {
      const { messages, lang } = await request.json();

      // System prompt según el idioma
      const systemPrompt = lang === 'en'
        ? `You are a friendly and creative assistant that helps parents create personalized activity charts for their children.

Your goal is to collect the following information through natural conversation:
1. Child's name (optional)
2. Child's age
3. Type of tasks (home chores, school, habits, behavior)
4. Goal/reward: can be a toy, money (with specific amount), or any reward
5. Number of tasks (between 5 and 12)
6. Number of days (5 or 7)

When you have enough information, generate the chart as JSON. Always respond in English.

When ready to generate the chart, include a JSON block at the end of your response with this EXACT format:

<CHART_JSON>
{
  "childName": "name or empty",
  "title": "motivating chart title",
  "goal": "prize/goal description",
  "goalType": "money or toy",
  "goalAmount": 20,
  "days": 7,
  "tasks": [
    {"icon": "emoji", "name": "short task name", "category": "home|school|habits|behavior"}
  ]
}
</CHART_JSON>

Tasks should be age-appropriate. Ages 4-6: simple tasks. Ages 7-10: more responsibility. Task names max 30 characters.`
        : `Eres un asistente amigable y creativo que ayuda a padres a crear "charts de actividades" personalizados para sus hijos.

Tu objetivo es recopilar la siguiente información a través de una conversación natural:
1. Nombre del niño/a (opcional)
2. Edad del niño/a
3. Tipo de tareas (hogar, escolar, hábitos, comportamiento)
4. Meta/premio: puede ser un juguete, dinero (con monto específico), o cualquier premio
5. Número de tareas (entre 5 y 12)
6. Número de días (5 o 7)

Cuando tengas suficiente información, genera el chart en formato JSON. Responde SIEMPRE en español.

Cuando estés listo para generar el chart, incluye un bloque JSON al final de tu respuesta con este formato EXACTO:

<CHART_JSON>
{
  "childName": "nombre o vacío",
  "title": "título motivador del chart",
  "goal": "descripción del premio/meta",
  "goalType": "money o toy",
  "goalAmount": 20,
  "days": 7,
  "tasks": [
    {"icon": "emoji", "name": "nombre tarea corto", "category": "hogar|escolar|habitos|comportamiento"}
  ]
}
</CHART_JSON>

Las tareas deben ser apropiadas para la edad. Para 4-6 años: simples. Para 7-10 años: más responsabilidades. Nombres de tareas máx 30 caracteres.`;

      // Preparar mensajes para la IA
      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      // Llamar a Workers AI (Llama 3.1)
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: aiMessages,
        max_tokens: 1024,
        temperature: 0.7,
      });

      return new Response(JSON.stringify({
        response: response.response
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Error processing request',
        details: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
