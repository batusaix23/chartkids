// ChartKids API Worker - Cloudflare Workers + Workers AI + Analytics + Admin
// Este código va en tu Cloudflare Worker
//
// CONFIGURACIÓN REQUERIDA en Cloudflare Dashboard:
// 1. Crear KV Namespace llamado "CHARTKIDS_DATA"
// 2. En Worker Settings > Variables > KV Namespace Bindings:
//    - Variable name: DATA
//    - KV Namespace: CHARTKIDS_DATA
// 3. En Worker Settings > Variables > Environment Variables:
//    - ADMIN_KEY: tu clave secreta de admin (ej: chartkids2024admin)
//    - PAYPAL_CLIENT_ID: tu client ID de PayPal
//    - PAYPAL_SECRET: tu secret de PayPal (para API calls)

const ADMIN_KEY = 'chartkids2024admin'; // Cambia esto o usa env.ADMIN_KEY

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      // ─── WEBHOOK ENDPOINT ───────────────────────────────────
      if (path === '/webhook' && request.method === 'POST') {
        return await handleWebhook(request, env);
      }

      // ─── ADMIN ENDPOINTS ────────────────────────────────────
      if (path.startsWith('/admin')) {
        const authKey = url.searchParams.get('key');
        if (authKey !== (env.ADMIN_KEY || ADMIN_KEY)) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        // GET /admin/stats
        if (path === '/admin/stats') {
          return await getAdminStats(env);
        }

        // GET /admin/subscriptions
        if (path === '/admin/subscriptions') {
          return await getSubscriptions(env);
        }

        // GET /admin/subscription/:id
        if (path.match(/^\/admin\/subscription\/[^/]+$/)) {
          const id = path.split('/').pop();
          return await getSubscription(env, id);
        }

        // POST /admin/subscription/:id/cancel
        if (path.match(/^\/admin\/subscription\/[^/]+\/cancel$/)) {
          const id = path.split('/')[3];
          return await cancelSubscription(env, id);
        }

        // GET /admin/webhooks
        if (path === '/admin/webhooks') {
          return await getWebhookLogs(env);
        }

        return jsonResponse({ error: 'Not found' }, 404);
      }

      // ─── ANALYTICS STATS ENDPOINT ───────────────────────────
      if (path === '/stats' && request.method === 'GET') {
        const authKey = url.searchParams.get('key');
        if (authKey !== (env.ADMIN_KEY || ADMIN_KEY)) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }
        return await getAnalytics(env);
      }

      // ─── ACTIVIDAD IA ENDPOINT ──────────────────────────────
      if (path === '/actividad' && request.method === 'POST') {
        return await generateActividad(request, env);
      }

      // ─── CHAT ENDPOINT (POST only) ──────────────────────────
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }

      const body = await request.json();

      // Save chart analytics
      if (body.chartData) {
        await saveChartAnalytics(env, body.chartData, body.lang, request);
        return jsonResponse({ saved: true });
      }

      // AI Chat
      const { messages, lang } = body;
      const systemPrompt = getSystemPrompt(lang);

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: aiMessages,
        max_tokens: 1024,
        temperature: 0.7,
      });

      await saveInteraction(env, messages, lang, request);

      return jsonResponse({ response: response.response });

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Error processing request', details: error.message }, 500);
    }
  },
};

// ─── ACTIVIDAD IA ───────────────────────────────────────────
async function generateActividad(request, env) {
  const { age, categoria, tiempo } = await request.json();

  const catMap = {
    dibujos: 'arte y dibujo', manualidades: 'manualidades con materiales reciclados o simples',
    experimentos: 'experimentos científicos caseros', cocina: 'cocina divertida y segura',
    sorpresa: 'cualquier categoría creativa'
  };
  const catLabel = catMap[categoria] || 'actividad creativa';

  const prompt = `Eres un experto en actividades educativas para niños. Genera UNA actividad creativa original para niños de ${age} años. Categoría: ${catLabel}. Tiempo disponible: ${tiempo} minutos.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, en este formato exacto:
{
  "emoji": "un emoji que represente la actividad",
  "title": "nombre corto y atractivo",
  "description": "descripción de 2 oraciones máximo, entusiasta",
  "age": "${age} años",
  "time": "${tiempo} min",
  "difficulty": "Fácil o Medio",
  "materials": ["material1", "material2", "material3", "material4"],
  "steps": ["paso 1 completo", "paso 2 completo", "paso 3 completo", "paso 4 completo"],
  "benefits": ["beneficio1", "beneficio2", "beneficio3"],
  "tip": "un consejo práctico para los padres"
}`;

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: 'Eres un experto en actividades creativas para niños. Respondes solo con JSON válido.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.85,
  });

  try {
    const text = response.response.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const activity = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return jsonResponse({ activity });
  } catch {
    return jsonResponse({ error: 'Error generando actividad. Intenta de nuevo.' }, 500);
  }
}

// ─── HELPERS ────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// ─── WEBHOOK HANDLER ────────────────────────────────────────

async function handleWebhook(request, env) {
  try {
    const payload = await request.json();
    const eventType = payload.event_type;
    const resource = payload.resource || {};

    console.log('Webhook received:', eventType);

    // Log the webhook event
    await logWebhookEvent(env, {
      type: eventType,
      timestamp: new Date().toISOString(),
      subscriptionId: resource.id || resource.billing_agreement_id,
      details: getEventDetails(eventType, resource)
    });

    // Handle different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await saveSubscription(env, {
          id: resource.id,
          status: 'ACTIVE',
          email: resource.subscriber?.email_address,
          name: resource.subscriber?.name?.given_name + ' ' + resource.subscriber?.name?.surname,
          startDate: resource.start_time,
          planId: resource.plan_id,
          amount: resource.billing_info?.last_payment?.amount?.value || '2.99',
          nextBilling: resource.billing_info?.next_billing_time
        });
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await updateSubscriptionStatus(env, resource.id, eventType.split('.').pop());
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await recordPayment(env, {
          subscriptionId: resource.billing_agreement_id,
          amount: resource.amount?.total,
          date: resource.create_time
        });
        break;
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return jsonResponse({ error: 'Webhook processing failed' }, 500);
  }
}

function getEventDetails(eventType, resource) {
  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      return `Nueva suscripción: ${resource.subscriber?.email_address || 'N/A'}`;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      return `Suscripción cancelada: ${resource.id}`;
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      return `Suscripción expirada: ${resource.id}`;
    case 'PAYMENT.SALE.COMPLETED':
      return `Pago recibido: $${resource.amount?.total || '0'} USD`;
    default:
      return eventType;
  }
}

// ─── SUBSCRIPTION MANAGEMENT ────────────────────────────────

async function saveSubscription(env, sub) {
  if (!env.DATA) return;

  // Save individual subscription
  await env.DATA.put(`sub:${sub.id}`, JSON.stringify({
    ...sub,
    createdAt: new Date().toISOString(),
    totalPaid: parseFloat(sub.amount) || 0
  }));

  // Add to subscriptions list
  let subs = await env.DATA.get('subscriptions', 'json') || [];
  if (!subs.find(s => s.id === sub.id)) {
    subs.unshift({ id: sub.id, status: sub.status, startDate: sub.startDate });
    await env.DATA.put('subscriptions', JSON.stringify(subs));
  }

  // Update stats
  await updateStats(env, 'newSubscription');
}

async function updateSubscriptionStatus(env, id, status) {
  if (!env.DATA) return;

  const sub = await env.DATA.get(`sub:${id}`, 'json');
  if (sub) {
    sub.status = status;
    sub.endDate = new Date().toISOString();
    await env.DATA.put(`sub:${id}`, JSON.stringify(sub));
  }

  // Update list
  let subs = await env.DATA.get('subscriptions', 'json') || [];
  const idx = subs.findIndex(s => s.id === id);
  if (idx !== -1) {
    subs[idx].status = status;
    await env.DATA.put('subscriptions', JSON.stringify(subs));
  }

  if (status === 'CANCELLED') {
    await updateStats(env, 'cancellation');
  }
}

async function recordPayment(env, payment) {
  if (!env.DATA) return;

  const sub = await env.DATA.get(`sub:${payment.subscriptionId}`, 'json');
  if (sub) {
    sub.totalPaid = (parseFloat(sub.totalPaid) || 0) + parseFloat(payment.amount || 0);
    sub.lastPayment = payment.date;
    await env.DATA.put(`sub:${payment.subscriptionId}`, JSON.stringify(sub));
  }

  await updateStats(env, 'payment', parseFloat(payment.amount) || 0);
}

async function updateStats(env, type, amount = 0) {
  if (!env.DATA) return;

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  let stats = await env.DATA.get(`stats:${month}`, 'json') || {
    month,
    newSubscriptions: 0,
    cancellations: 0,
    revenue: 0,
    payments: 0
  };

  switch (type) {
    case 'newSubscription':
      stats.newSubscriptions++;
      break;
    case 'cancellation':
      stats.cancellations++;
      break;
    case 'payment':
      stats.payments++;
      stats.revenue += amount;
      break;
  }

  await env.DATA.put(`stats:${month}`, JSON.stringify(stats));
}

async function logWebhookEvent(env, event) {
  if (!env.DATA) return;

  let events = await env.DATA.get('webhook_events', 'json') || [];
  events.unshift(event);
  events = events.slice(0, 100); // Keep last 100 events
  await env.DATA.put('webhook_events', JSON.stringify(events));
}

// ─── ADMIN API HANDLERS ─────────────────────────────────────

async function getAdminStats(env) {
  if (!env.DATA) {
    return jsonResponse({
      activeSubscriptions: 0,
      monthlyRevenue: 0,
      newSubscriptions: 0,
      cancelledSubscriptions: 0
    });
  }

  const month = new Date().toISOString().slice(0, 7);
  const stats = await env.DATA.get(`stats:${month}`, 'json') || {};
  const subs = await env.DATA.get('subscriptions', 'json') || [];

  const activeCount = subs.filter(s => s.status === 'ACTIVE').length;

  return jsonResponse({
    activeSubscriptions: activeCount,
    monthlyRevenue: stats.revenue || 0,
    newSubscriptions: stats.newSubscriptions || 0,
    cancelledSubscriptions: stats.cancellations || 0
  });
}

async function getSubscriptions(env) {
  if (!env.DATA) {
    return jsonResponse({ subscriptions: [] });
  }

  const subsList = await env.DATA.get('subscriptions', 'json') || [];
  const subscriptions = [];

  for (const item of subsList.slice(0, 50)) { // Limit to 50
    const sub = await env.DATA.get(`sub:${item.id}`, 'json');
    if (sub) {
      subscriptions.push(sub);
    }
  }

  return jsonResponse({ subscriptions });
}

async function getSubscription(env, id) {
  if (!env.DATA) {
    return jsonResponse({ error: 'Not found' }, 404);
  }

  const sub = await env.DATA.get(`sub:${id}`, 'json');
  if (!sub) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  return jsonResponse(sub);
}

async function cancelSubscription(env, id) {
  // Note: This only updates local status.
  // For actual PayPal cancellation, you need to call PayPal API
  // with the subscription ID using your PayPal credentials.

  if (!env.DATA) {
    return jsonResponse({ error: 'Data store not configured' }, 500);
  }

  await updateSubscriptionStatus(env, id, 'CANCELLED');
  return jsonResponse({ success: true, message: 'Subscription marked as cancelled locally. Cancel in PayPal dashboard to stop billing.' });
}

async function getWebhookLogs(env) {
  if (!env.DATA) {
    return jsonResponse({ events: [] });
  }

  const events = await env.DATA.get('webhook_events', 'json') || [];
  return jsonResponse({ events });
}

// ─── ANALYTICS FUNCTIONS ────────────────────────────────────

async function saveInteraction(env, messages, lang, request) {
  if (!env.DATA) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `analytics:${today}`;

    let stats = await env.DATA.get(statsKey, 'json') || {
      date: today,
      totalRequests: 0,
      languages: { es: 0, en: 0 },
      countries: {}
    };

    stats.totalRequests++;
    stats.languages[lang] = (stats.languages[lang] || 0) + 1;

    const country = request.cf?.country || 'Unknown';
    stats.countries[country] = (stats.countries[country] || 0) + 1;

    await env.DATA.put(statsKey, JSON.stringify(stats), {
      expirationTtl: 90 * 24 * 60 * 60
    });
  } catch (e) {
    console.error('Analytics error:', e);
  }
}

async function saveChartAnalytics(env, chartData, lang, request) {
  if (!env.DATA) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const chartsKey = `charts:${today}`;

    let charts = await env.DATA.get(chartsKey, 'json') || {
      date: today,
      totalCharts: 0,
      themes: {},
      goalTypes: {}
    };

    charts.totalCharts++;
    charts.themes[chartData.theme] = (charts.themes[chartData.theme] || 0) + 1;
    charts.goalTypes[chartData.goalType] = (charts.goalTypes[chartData.goalType] || 0) + 1;

    await env.DATA.put(chartsKey, JSON.stringify(charts), {
      expirationTtl: 90 * 24 * 60 * 60
    });
  } catch (e) {
    console.error('Chart analytics error:', e);
  }
}

async function getAnalytics(env) {
  if (!env.DATA) {
    return jsonResponse({ error: 'Analytics not configured' });
  }

  const stats = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayStats = await env.DATA.get(`analytics:${dateStr}`, 'json');
    if (dayStats) stats.push(dayStats);
  }

  return jsonResponse({ dailyStats: stats });
}

// ─── AI SYSTEM PROMPT ───────────────────────────────────────

function getSystemPrompt(lang) {
  return lang === 'en'
    ? `You are ChartKids AI, a specialized assistant that ONLY helps parents create activity charts for children ages 3-12.

## YOUR CAPABILITIES:
- Create personalized activity charts for children
- Suggest age-appropriate tasks for: home chores, school habits, behavior, health/hygiene
- Recommend rewards/goals (toys, money, experiences)
- Generate charts for 5 or 7 days (weekly) OR 12 months (yearly charts)

## YOUR LIMITATIONS:
- Answer questions unrelated to activity charts for children
- Provide medical, psychological or professional advice
- Create content for children with special needs (recommend consulting a specialist)
- Generate charts for children under 3 or over 12 years old

## INFORMATION TO COLLECT:
1. Child's age (3-12 years)
2. Type of tasks: home, school, habits, behavior
3. Goal/reward
4. Duration: 5 days, 7 days, or 12 months

## JSON FORMAT (when ready):
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
    {"icon": "🛏️", "name": "Make bed", "category": "home"}
  ]
}
\`\`\`

Theme options: "money", "lego", "music", "travel", "bike", "gaming", "pet", "park", "clothes", "general"`
    : `Eres ChartKids IA, un asistente especializado que SOLO ayuda a padres a crear charts de actividades para niños de 3 a 12 años.

## TUS CAPACIDADES:
- Crear charts de actividades personalizados para niños
- Sugerir tareas apropiadas para la edad: hogar, escuela, hábitos, salud/higiene
- Recomendar recompensas/metas (juguetes, dinero, experiencias)
- Generar charts de 5 o 7 días (semanales) O 12 meses (charts anuales)

## TUS LIMITACIONES:
- Responder preguntas no relacionadas con charts de actividades para niños
- Dar consejos médicos, psicológicos o profesionales
- Crear contenido para niños con necesidades especiales (recomienda consultar especialista)
- Generar charts para niños menores de 3 o mayores de 12 años

## INFORMACIÓN A RECOPILAR:
1. Edad del niño/a (3-12 años)
2. Tipo de tareas: hogar, escuela, hábitos, comportamiento
3. Meta/premio
4. Duración: 5 días, 7 días, o 12 meses

## FORMATO JSON (cuando estés listo):
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
    {"icon": "🛏️", "name": "Tender la cama", "category": "hogar"}
  ]
}
\`\`\`

Opciones de theme: "money", "lego", "music", "travel", "bike", "gaming", "pet", "park", "clothes", "general"`;
}
