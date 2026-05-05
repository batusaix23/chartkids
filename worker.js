// ChartKids API Worker - Cloudflare Workers + Workers AI + Analytics
// Este código va en tu Cloudflare Worker
//
// CONFIGURACIÓN REQUERIDA en Cloudflare Dashboard:
// 1. Crear KV Namespace llamado "CHARTKIDS_ANALYTICS"
// 2. En Worker Settings > Variables > KV Namespace Bindings:
//    - Variable name: ANALYTICS
//    - KV Namespace: CHARTKIDS_ANALYTICS

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Manejar CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // Endpoint para ver estadísticas (protegido con clave)
    if (url.pathname === '/stats' && request.method === 'GET') {
      const authKey = url.searchParams.get('key');
      // IMPORTANTE: Cambia esta clave por una segura
      if (authKey !== 'YOUR_SECRET_STATS_KEY') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
      return await getAnalytics(env);
    }

    // Solo permitir POST para el chat
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    try {
      const { messages, lang, chartData } = await request.json();

      // Si recibimos chartData, es una solicitud de guardar analytics
      if (chartData) {
        await saveChartAnalytics(env, chartData, lang, request);
        return new Response(JSON.stringify({ saved: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }

      // System prompt según el idioma
      const systemPrompt = lang === 'en'
        ? `You are ChartKids AI, a specialized assistant that ONLY helps parents create activity charts for children ages 3-12.

## YOUR CAPABILITIES (What you CAN do):
- Create personalized activity charts for children
- Suggest age-appropriate tasks for: home chores, school habits, behavior, health/hygiene
- Recommend rewards/goals (toys, money, experiences)
- Adapt tasks to the child's specific age
- Generate charts for 5 or 7 days (weekly) OR 12 months (yearly charts)

## YOUR LIMITATIONS (What you CANNOT do):
- Answer questions unrelated to activity charts for children
- Provide medical, psychological or professional advice
- Create content for children with special needs (recommend consulting a specialist)
- Generate charts for children under 3 or over 12 years old
- Discuss topics outside parenting and child behavior charts

## HOW TO RESPOND TO OFF-TOPIC REQUESTS:
If someone asks something outside your capabilities, respond kindly:
"I'm ChartKids AI, specialized only in creating activity charts for children. I can't help with [topic], but I'd love to help you create a motivational chart for your child! Tell me about your child and what habits you'd like to encourage."

## INFORMATION TO COLLECT (through natural conversation):
1. Child's name (optional)
2. Child's age (3-12 years, if outside range, explain limitation)
3. Type of tasks: home, school, habits, behavior
4. Goal/reward: toy, money (with amount), experience, or any reward
5. Number of tasks (5-12 recommended)
6. Duration: 5 days, 7 days, or 12 months (for yearly goals)

## JSON FORMAT (include ONLY when you have enough info):
\`\`\`json
{
  "childName": "name or empty",
  "title": "motivating title",
  "goal": "prize description",
  "goalType": "money or toy",
  "goalAmount": 20,
  "days": 7,
  "theme": "money",
  "tasks": [
    {"icon": "🛏️", "name": "Make bed", "category": "home"},
    {"icon": "📚", "name": "Do homework", "category": "school"}
  ]
}
\`\`\`

## RULES:
- theme options: "money", "lego", "music", "travel", "bike", "gaming", "pet", "park", "clothes", "general"
- Age-appropriate tasks: 3-5 years (very simple), 6-8 (simple with some responsibility), 9-12 (more complex)
- For yearly charts use days:12
- Always be warm, encouraging, and positive
- Use emojis for tasks
- If unsure about something, ASK the parent for clarification`
        : `Eres ChartKids IA, un asistente especializado que SOLO ayuda a padres a crear charts de actividades para niños de 3 a 12 años.

## TUS CAPACIDADES (Lo que SÍ puedes hacer):
- Crear charts de actividades personalizados para niños
- Sugerir tareas apropiadas para la edad: hogar, escuela, hábitos, salud/higiene
- Recomendar recompensas/metas (juguetes, dinero, experiencias)
- Adaptar tareas a la edad específica del niño
- Generar charts de 5 o 7 días (semanales) O 12 meses (charts anuales)

## TUS LIMITACIONES (Lo que NO puedes hacer):
- Responder preguntas no relacionadas con charts de actividades para niños
- Dar consejos médicos, psicológicos o profesionales
- Crear contenido para niños con necesidades especiales (recomienda consultar especialista)
- Generar charts para niños menores de 3 o mayores de 12 años
- Discutir temas fuera de crianza y charts de comportamiento infantil

## CÓMO RESPONDER A SOLICITUDES FUERA DE TEMA:
Si alguien pide algo fuera de tus capacidades, responde amablemente:
"Soy ChartKids IA, especializado únicamente en crear charts de actividades para niños. No puedo ayudarte con [tema], pero me encantaría ayudarte a crear un chart motivador para tu hijo. ¡Cuéntame sobre tu pequeño y qué hábitos te gustaría fomentar!"

## INFORMACIÓN A RECOPILAR (conversación natural):
1. Nombre del niño/a (opcional)
2. Edad del niño/a (3-12 años, si está fuera del rango, explica la limitación)
3. Tipo de tareas: hogar, escuela, hábitos, comportamiento
4. Meta/premio: juguete, dinero (con monto), experiencia, o cualquier premio
5. Número de tareas (5-12 recomendado)
6. Duración: 5 días, 7 días, o 12 meses (para metas anuales)

## FORMATO JSON (incluir SOLO cuando tengas suficiente información):
\`\`\`json
{
  "childName": "nombre o vacío",
  "title": "título motivador",
  "goal": "descripción del premio",
  "goalType": "money o toy",
  "goalAmount": 20,
  "days": 7,
  "theme": "money",
  "tasks": [
    {"icon": "🛏️", "name": "Tender la cama", "category": "hogar"},
    {"icon": "📚", "name": "Hacer tarea", "category": "escolar"}
  ]
}
\`\`\`

## REGLAS:
- Opciones de theme: "money", "lego", "music", "travel", "bike", "gaming", "pet", "park", "clothes", "general"
- Tareas según edad: 3-5 años (muy simples), 6-8 (simples con algo de responsabilidad), 9-12 (más complejas)
- Para charts anuales usa days:12
- Siempre sé cálido, alentador y positivo
- Usa emojis para las tareas
- Si no estás seguro de algo, PREGUNTA al padre para aclarar`;

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

      // Guardar interacción en analytics (solo el prompt del usuario, no datos personales)
      await saveInteraction(env, messages, lang, request);

      return new Response(JSON.stringify({
        response: response.response
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Error processing request',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  },
};

// CORS headers helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Guardar interacción del usuario (anónima)
async function saveInteraction(env, messages, lang, request) {
  if (!env.ANALYTICS) return; // Si no hay KV configurado, ignorar

  try {
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats:${today}`;

    // Obtener estadísticas del día
    let stats = await env.ANALYTICS.get(statsKey, 'json') || {
      date: today,
      totalRequests: 0,
      languages: { es: 0, en: 0 },
      countries: {},
      prompts: []
    };

    // Actualizar contadores
    stats.totalRequests++;
    stats.languages[lang] = (stats.languages[lang] || 0) + 1;

    // Obtener país del request (Cloudflare proporciona esto)
    const country = request.cf?.country || 'Unknown';
    stats.countries[country] = (stats.countries[country] || 0) + 1;

    // Guardar solo el último mensaje del usuario (sin datos personales)
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    if (lastUserMsg && stats.prompts.length < 100) { // Limitar a 100 prompts por día
      stats.prompts.push({
        time: new Date().toISOString(),
        lang,
        prompt: lastUserMsg.content.substring(0, 200) // Limitar longitud
      });
    }

    // Guardar con expiración de 90 días
    await env.ANALYTICS.put(statsKey, JSON.stringify(stats), {
      expirationTtl: 90 * 24 * 60 * 60
    });
  } catch (e) {
    console.error('Analytics error:', e);
  }
}

// Guardar datos del chart generado (anónimo)
async function saveChartAnalytics(env, chartData, lang, request) {
  if (!env.ANALYTICS) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const chartsKey = `charts:${today}`;

    let charts = await env.ANALYTICS.get(chartsKey, 'json') || {
      date: today,
      totalCharts: 0,
      themes: {},
      goalTypes: {},
      taskCategories: {},
      avgTasks: 0,
      avgDays: 0
    };

    // Actualizar estadísticas
    charts.totalCharts++;
    charts.themes[chartData.theme] = (charts.themes[chartData.theme] || 0) + 1;
    charts.goalTypes[chartData.goalType] = (charts.goalTypes[chartData.goalType] || 0) + 1;

    // Contar categorías de tareas
    if (chartData.tasks) {
      chartData.tasks.forEach(task => {
        const cat = task.category || 'other';
        charts.taskCategories[cat] = (charts.taskCategories[cat] || 0) + 1;
      });

      // Calcular promedios
      const totalTasks = charts.avgTasks * (charts.totalCharts - 1) + chartData.tasks.length;
      charts.avgTasks = Math.round(totalTasks / charts.totalCharts * 10) / 10;
    }

    const totalDays = charts.avgDays * (charts.totalCharts - 1) + (chartData.days || 7);
    charts.avgDays = Math.round(totalDays / charts.totalCharts * 10) / 10;

    await env.ANALYTICS.put(chartsKey, JSON.stringify(charts), {
      expirationTtl: 90 * 24 * 60 * 60
    });
  } catch (e) {
    console.error('Chart analytics error:', e);
  }
}

// Obtener estadísticas (endpoint protegido)
async function getAnalytics(env) {
  if (!env.ANALYTICS) {
    return new Response(JSON.stringify({ error: 'Analytics not configured' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    // Obtener últimos 30 días de estadísticas
    const stats = [];
    const charts = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStats = await env.ANALYTICS.get(`stats:${dateStr}`, 'json');
      const dayCharts = await env.ANALYTICS.get(`charts:${dateStr}`, 'json');

      if (dayStats) stats.push(dayStats);
      if (dayCharts) charts.push(dayCharts);
    }

    // Calcular totales
    const summary = {
      totalRequests: stats.reduce((sum, s) => sum + s.totalRequests, 0),
      totalCharts: charts.reduce((sum, c) => sum + c.totalCharts, 0),
      languages: {},
      countries: {},
      themes: {},
      goalTypes: {},
      taskCategories: {},
      recentPrompts: []
    };

    // Agregar datos
    stats.forEach(s => {
      Object.entries(s.languages || {}).forEach(([k, v]) => {
        summary.languages[k] = (summary.languages[k] || 0) + v;
      });
      Object.entries(s.countries || {}).forEach(([k, v]) => {
        summary.countries[k] = (summary.countries[k] || 0) + v;
      });
      // Últimos prompts
      if (s.prompts) {
        summary.recentPrompts.push(...s.prompts);
      }
    });

    charts.forEach(c => {
      Object.entries(c.themes || {}).forEach(([k, v]) => {
        summary.themes[k] = (summary.themes[k] || 0) + v;
      });
      Object.entries(c.goalTypes || {}).forEach(([k, v]) => {
        summary.goalTypes[k] = (summary.goalTypes[k] || 0) + v;
      });
      Object.entries(c.taskCategories || {}).forEach(([k, v]) => {
        summary.taskCategories[k] = (summary.taskCategories[k] || 0) + v;
      });
    });

    // Ordenar y limitar prompts recientes
    summary.recentPrompts = summary.recentPrompts
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 50);

    return new Response(JSON.stringify({
      summary,
      dailyStats: stats,
      dailyCharts: charts
    }, null, 2), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
