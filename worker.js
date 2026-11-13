// ChartKids API Worker - Cloudflare Workers + Workers AI + Analytics + Admin
// Este código va en tu Cloudflare Worker
//
// CONFIGURACIÓN REQUERIDA en Cloudflare Dashboard:
// 1. Crear KV Namespace llamado "CHARTKIDS_DATA"
// 2. En Worker Settings > Variables > KV Namespace Bindings:
//    - Variable name: DATA
//    - KV Namespace: CHARTKIDS_DATA
// 3. En Worker Settings > Variables > Environment Variables:
//    - ADMIN_KEY: tu clave secreta de admin (usa un valor largo y aleatorio)
//    - PAYPAL_CLIENT_ID: tu client ID de PayPal
//    - PAYPAL_SECRET: tu secret de PayPal (para API calls)

// ADMIN_KEY must be set as a Secret in Cloudflare Dashboard.
// Worker refuses admin endpoints if it's missing (fail-closed, no hardcoded fallback).

// Shared kid-safe word list; sets globalThis.KidSafe (same file the browser loads).
import './js/kid-safe.js';

// Workers AI models, tried in order. Cloudflare retires models periodically
// (@cf/meta/llama-3.1-8b-instruct was deprecated 2026-05-30), so a fallback keeps the
// AI features alive if the primary one disappears.
const AI_MODELS = [
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.1-8b-instruct-fp8',
];
// Cheaper order (~6× fewer neurons) for chat and activity ideas; the kid-safety check
// for coloring keeps the bigger model first because accuracy matters there.
const AI_MODELS_LITE = [
  '@cf/meta/llama-3.1-8b-instruct-fp8',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];

// Thrown when Workers AI can't serve the request (quota, outage, retired model…).
// The top-level handler turns it into a 503 {error:'ai_unavailable'} so pages can
// fall back to non-AI content instead of showing a raw error.
class AIUnavailable extends Error {}

async function runAI(env, options, models = AI_MODELS) {
  let lastErr;
  for (const model of models) {
    try {
      return await env.AI.run(model, options);
    } catch (err) {
      lastErr = err;
      console.error(`Workers AI model ${model} failed:`, err.message);
    }
  }
  throw new AIUnavailable(lastErr ? lastErr.message : 'AI failed');
}

// ─── AI COST PROTECTION ─────────────────────────────────────
// Policy (owner's decision, Nov 2026): stay inside the Workers AI FREE allocation
// (10,000 neurons/day, resets 00:00 UTC) until the site earns money — even though
// the account is on Workers Paid, nothing beyond the free allocation may be billed.
// Every AI endpoint goes through guardAI():
//   1. only requests from the site itself (Origin header)
//   2. per-IP burst limit per minute (Workers Rate Limiting bindings in wrangler.toml)
//   3. per-IP daily limit, and a site-wide daily NEURON BUDGET below the free 10,000.
//      Each call is charged an estimated cost; when the budget is spent the endpoint
//      answers 503 {error:'ai_unavailable'} and pages fall back to non-AI content.
// Estimates are deliberately high so the real usage stays under the free allocation.
// The budget is shared with offline batch jobs (printables/flux-batch.js), which run
// against the same account — keep those small.
const ALLOWED_ORIGINS = ['https://www.chartkids.com', 'https://chartkids.com'];
const AI_DAILY_NEURON_BUDGET = 9000;
const AI_LIMITS = {
  image:     { binding: 'RL_AI_IMAGE', perDay: 15, cost: 120 },  // FLUX image + safety check
  text:      { binding: 'RL_AI_TEXT', perDay: 40, cost: 90 },    // 70B safety check (coloring prompt)
  textLite:  { binding: 'RL_AI_TEXT', perDay: 60, cost: 20 },    // 8B chat / activity ideas
};

// Local testing: start with `wrangler dev --var DEV_ALLOW_LOCAL:1` to also accept
// http://localhost / 127.0.0.1 pages and Origin-less requests. Never set in production.
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

async function guardAI(request, env, kind) {
  const origin = request.headers.get('Origin') || '';
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const local = env.DEV_ALLOW_LOCAL === '1' && (!origin || LOCAL_ORIGIN.test(origin));
  if (!local && !ALLOWED_ORIGINS.includes(origin)) {
    return jsonResponse({ error: 'forbidden_origin' }, 403);
  }
  const cfg = AI_LIMITS[kind];

  const limiter = env[cfg.binding];
  if (limiter) {
    const { success } = await limiter.limit({ key: `${kind}:${ip}` });
    if (!success) return jsonResponse({ error: 'rate_limited', retry_after: 60 }, 429);
  }

  if (env.DATA) {
    const day = new Date().toISOString().slice(0, 10);
    const ipKey = `ai:${kind}:${day}:${ip}`, budgetKey = `ai:neurons:${day}`;
    const [ipN, spent] = await Promise.all([env.DATA.get(ipKey), env.DATA.get(budgetKey)]);
    if (Number(ipN || 0) >= cfg.perDay) return jsonResponse({ error: 'daily_limit' }, 429);
    if (Number(spent || 0) + cfg.cost > AI_DAILY_NEURON_BUDGET) {
      return jsonResponse({ error: 'ai_unavailable', reason: 'daily_budget' }, 503);
    }
    // KV counters are approximate (no atomic increment); the 1,000-neuron margin
    // under the free 10,000 absorbs small races between concurrent requests.
    const opts = { expirationTtl: 2 * 86400 };
    await Promise.all([
      env.DATA.put(ipKey, String(Number(ipN || 0) + 1), opts),
      env.DATA.put(budgetKey, String(Number(spent || 0) + cfg.cost), opts),
    ]);
  }
  return null;
}

// Keep chat input bounded: last 10 user/assistant turns, 1500 chars each.
function boundMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
}

// Newer Workers AI models return `response` already parsed into an object when the
// output is JSON. Callers (and the browser) expect a string, so normalize it here.
function aiText(result) {
  const r = result && result.response;
  if (typeof r === 'string') return r;
  return r == null ? '' : JSON.stringify(r);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Normalize: chartkids.com/api/* route delivers paths like /api/admin/stats.
    // Strip the /api prefix so all downstream matches work with a single canonical path.
    const path = url.pathname.startsWith('/api/') ? url.pathname.slice(4) : url.pathname;

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
        if (!env.ADMIN_KEY) {
          return jsonResponse({ error: 'Server misconfigured: ADMIN_KEY not set' }, 500);
        }
        const authKey = url.searchParams.get('key');
        if (!authKey || !timingSafeEqual(authKey, env.ADMIN_KEY)) {
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
        if (!env.ADMIN_KEY) {
          return jsonResponse({ error: 'Server misconfigured: ADMIN_KEY not set' }, 500);
        }
        const authKey = url.searchParams.get('key');
        if (!authKey || !timingSafeEqual(authKey, env.ADMIN_KEY)) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }
        return await getAnalytics(env);
      }

      // ─── COLOREAR IA: kid-safe prompt ───────────────────────
      if (path === '/coloring-prompt' && request.method === 'POST') {
        return (await guardAI(request, env, 'text')) || await coloringPrompt(request, env);
      }
      if (path === '/coloring-image' && request.method === 'POST') {
        return (await guardAI(request, env, 'image')) || await coloringImage(request, env);
      }

      // ─── ACTIVIDAD IA ENDPOINT ──────────────────────────────
      if (path === '/actividad' && request.method === 'POST') {
        return (await guardAI(request, env, 'textLite')) || await generateActividad(request, env);
      }

      // ─── CUSTOM WORKSHEET GENERATOR ─────────────────────────
      if (path === '/generate' && request.method === 'POST') {
        return await generateWorksheet(request, env);
      }
      if (path === '/generate' && request.method === 'GET') {
        return Response.redirect('https://chartkids.com/crear/', 302);
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
      const blocked = await guardAI(request, env, 'textLite');
      if (blocked) return blocked;
      const messages = boundMessages(body.messages);
      const lang = body.lang;
      if (!messages.length) return jsonResponse({ error: 'Missing messages' }, 400);
      const systemPrompt = getSystemPrompt(lang);

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      const response = await runAI(env, {
        messages: aiMessages,
        max_tokens: 600,
        temperature: 0.7,
      }, AI_MODELS_LITE);

      await saveInteraction(env, messages, lang, request);

      return jsonResponse({ response: aiText(response) });

    } catch (error) {
      console.error('Worker error:', error);
      if (error instanceof AIUnavailable) return jsonResponse({ error: 'ai_unavailable' }, 503);
      return jsonResponse({ error: 'Error processing request' }, 500);
    }
  },
};

// ─── COLOREAR IA ────────────────────────────────────────────
// Turns a child's free-text request (ES or EN) into a short, kid-friendly English
// scene for the image model — or refuses it. Two layers: the shared word list
// (js/kid-safe.js) and an AI judge that also rewrites the scene so it draws well
// as a coloring page (few subjects, big simple shapes).
const COLORING_SYSTEM = `You prepare requests for a coloring-book generator used by children aged 3 to 10.
Decide if the request is appropriate for young children, then rewrite it.

REFUSE (safe=false) anything with: violence, weapons, fighting, blood, injury, death, horror or scary themes,
romance or kissing, nudity or body focus, alcohol, drugs, smoking, hate, insults, real people or celebrities,
politics, religion-mocking content, or anything a parent would not want a small child to see.

ALLOWED and should be made friendly: animals, dinosaurs, dragons, monsters, pirates, knights, superheroes,
princesses, vehicles, space, nature, food, holidays, fantasy. Make them cute and smiling, never scary.
Famous cartoon characters or brands: describe a generic look-alike instead (e.g. "a friendly superhero kid
with a cape"), never the name.

When safe, write "subject": ONE short English sentence (max 25 words) describing the scene for a coloring page:
1 or 2 main characters, a simple background with at most 3 elements, big simple shapes, cheerful.
No colors, no text, no style words.

Reply ONLY with JSON: {"safe": true, "subject": "..."} or {"safe": false}`;

// Returns {safe:false} | {safe:true, subject}; throws if the AI answer is unusable.
async function checkColoringRequest(desc, env) {
  if (KidSafe.findBlocked(desc)) return { safe: false };

  const result = await runAI(env, {
    messages: [
      { role: 'system', content: COLORING_SYSTEM },
      { role: 'user', content: desc },
    ],
    max_tokens: 120,
    temperature: 0.2,
  });

  const text = aiText(result);
  const parsed = JSON.parse((text.match(/\{[\s\S]*\}/) || [text])[0]);
  const subject = typeof parsed.subject === 'string' ? parsed.subject.trim().slice(0, 300) : '';
  // Fail closed: anything not clearly safe, or a rewrite that itself trips the word list, is refused.
  if (parsed.safe !== true || !subject || KidSafe.findBlocked(subject)) return { safe: false };
  return { safe: true, subject };
}

async function readDesc(request) {
  let desc = '';
  try { ({ desc = '' } = await request.json()); } catch { /* bad JSON → empty */ }
  return String(desc).trim().slice(0, 200);
}

// POST /coloring-prompt {desc} → {safe, subject?}
async function coloringPrompt(request, env) {
  const desc = await readDesc(request);
  if (!desc) return jsonResponse({ error: 'Missing desc' }, 400);
  try {
    return jsonResponse(await checkColoringRequest(desc, env));
  } catch (err) {
    if (err instanceof AIUnavailable) throw err;          // → 503 ai_unavailable
    return jsonResponse({ error: 'AI returned invalid JSON' }, 502);
  }
}

// Fixed style for every page: what makes a drawing easy for a child to color.
function coloringImagePrompt(subject) {
  return `Children's coloring book page, black and white line art. ${subject}. ` +
    `Cute, friendly, smiling cartoon style for little kids. Thick, even, bold black outlines; ` +
    `large simple closed shapes with big empty white areas to color; few details. ` +
    `Minimal background with only a few big simple elements, lots of white space. ` +
    `No shading, no gray tones, no solid black fills, no words, no letters, no numbers.`;
}

// POST /coloring-image {desc} → {safe:false} | {safe:true, subject, image?}
// The image is generated here, so an unchecked request never reaches an image model.
// If generation fails, `image` is omitted and the page falls back to Pollinations
// with the already-checked subject.
async function coloringImage(request, env) {
  const desc = await readDesc(request);
  if (!desc) return jsonResponse({ error: 'Missing desc' }, 400);

  let check;
  try { check = await checkColoringRequest(desc, env); }
  catch (err) {
    if (err instanceof AIUnavailable) throw err;          // → 503 ai_unavailable
    return jsonResponse({ error: 'AI returned invalid JSON' }, 502);
  }
  if (!check.safe) return jsonResponse({ safe: false });

  try {
    const out = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: coloringImagePrompt(check.subject),
      steps: 8,
    });
    if (!out || !out.image) throw new Error('no image returned');
    return jsonResponse({ ...check, image: `data:image/jpeg;base64,${out.image}` });
  } catch (err) {
    console.error('coloring-image generation failed:', err.message);
    return jsonResponse(check);
  }
}

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

  const response = await runAI(env, {
    messages: [
      { role: 'system', content: 'Eres un experto en actividades creativas para niños. Respondes solo con JSON válido.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.85,
  }, AI_MODELS_LITE);

  try {
    const text = aiText(response).trim();
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

// Constant-time string compare — avoids leaking ADMIN_KEY via response-time diffs
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
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

// ─── CUSTOM WORKSHEET GENERATOR ─────────────────────────────

async function generateWorksheet(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { type = 'tracing', word = '', emoji = '✏️', color = '#7c3aed' } = body;

  // Sanitize: uppercase, letters/digits/accented chars/spaces only, max 12 chars
  const clean = (word || '').toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ0-9 ]/g, '').trim().slice(0, 12);
  if (!clean) return jsonResponse({ error: 'Escribe una palabra válida (letras, máx 12)' }, 400);

  // Validate color (must be a hex color)
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#7c3aed';

  if (type === 'tracing') {
    const svg  = buildTracingSVG(clean, emoji, safeColor);
    const html = buildTracingPage(clean, emoji, safeColor, svg);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() }
    });
  }

  return jsonResponse({ error: 'Tipo no soportado. Usa: tracing' }, 400);
}

function buildTracingSVG(word, emoji, catColor) {
  const W = 500, H = 650;
  // Baselines for 4 practice rows. font-size 56 → cap ≈ 40px above baseline.
  const LINE_Y = [245, 348, 451, 554];
  const CAP = 42, DESC = 16;

  let guides = '';
  LINE_Y.forEach(y => {
    guides += `<line x1="36" y1="${y - CAP}"  x2="464" y2="${y - CAP}"  stroke="#d1d5db" stroke-width="1"   stroke-dasharray="4 4"/>`;
    guides += `<line x1="36" y1="${y}"      x2="464" y2="${y}"      stroke="#b0b8c8" stroke-width="1.5"/>`;
    guides += `<line x1="36" y1="${y + DESC}" x2="464" y2="${y + DESC}" stroke="#d1d5db" stroke-width="1"   stroke-dasharray="4 4"/>`;
  });

  const r1y = LINE_Y[0], r2y = LINE_Y[1];
  // Two-layer approach: light fill shows full letter shape; dashed stroke marks the tracing path
  const traceDashed = `
  <text x="250" y="${r1y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="900" fill="#dbeafe">${esc(word)}</text>
  <text x="250" y="${r1y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="900" fill="none" stroke="#818cf8" stroke-width="2" stroke-dasharray="5 4">${esc(word)}</text>`;
  const traceLight  = `
  <text x="250" y="${r2y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="900" fill="#f1f5f9">${esc(word)}</text>
  <text x="250" y="${r2y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="900" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 5">${esc(word)}</text>`;
  const arrows = `
    <text x="20" y="${r1y - CAP / 2}" font-size="16" text-anchor="middle" fill="${safeHex(catColor)}">✏️</text>
    <text x="20" y="${r2y - CAP / 2}" font-size="16" text-anchor="middle" fill="${safeHex(catColor)}" opacity=".45">✏️</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fafafa"/>
<rect width="${W}" height="${H}" fill="white" opacity=".8"/>
<rect width="${W}" height="90" fill="${safeHex(catColor)}"/>
<text x="250" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="800" opacity=".85" font-family="Arial,sans-serif">TRAZADO DE PALABRAS · WRITING PRACTICE</text>
<text x="250" y="58" text-anchor="middle" font-size="36" fill="white" font-weight="900" font-family="Arial,sans-serif">${esc(emoji)} ${esc(word)}</text>
<text x="250" y="78" text-anchor="middle" font-size="10" fill="white" opacity=".85" font-family="Arial,sans-serif">Traza las letras · chartkids.com</text>
<text x="250" y="148" text-anchor="middle" font-size="58" font-weight="900" fill="${safeHex(catColor)}" opacity=".18" font-family="Arial,sans-serif">${esc(word)}</text>
<text x="250" y="148" text-anchor="middle" font-size="58" font-weight="900" fill="none" stroke="${safeHex(catColor)}" stroke-width="1.5" font-family="Arial,sans-serif">${esc(word)}</text>
<text x="250" y="163" text-anchor="middle" font-size="8" fill="#9ca3af" font-family="Arial,sans-serif">MODELO</text>
${guides}
${traceDashed}
${traceLight}
${arrows}
<text x="40" y="${LINE_Y[0] - CAP - 6}" font-size="9" fill="#9ca3af" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1">1 · TRAZA</text>
<text x="40" y="${LINE_Y[1] - CAP - 6}" font-size="9" fill="#9ca3af" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1">2 · TRAZA</text>
<text x="40" y="${LINE_Y[2] - CAP - 6}" font-size="9" fill="#9ca3af" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1">3 · ESCRIBE SOLO/A</text>
<text x="40" y="${LINE_Y[3] - CAP - 6}" font-size="9" fill="#9ca3af" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1">4 · ESCRIBE SOLO/A</text>
<text x="250" y="642" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">Imprimible gratuito · chartkids.com/crear/</text>
</svg>`;
}

function buildTracingPage(word, emoji, catColor, svg) {
  const minSvg = svg.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trazar ${esc(word)} | ChartKids</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f8fafc;color:#1e293b;padding:16px}
.wrap{max-width:560px;margin:0 auto}
.preview{background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);margin-bottom:16px}
.preview svg{width:100%;height:auto;display:block}
.actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn-print{background:${safeHex(catColor)};color:white;border:none;padding:12px 28px;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer}
.btn-back{background:white;color:#475569;border:1.5px solid #e2e8f0;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block}
h1{font-size:22px;margin-bottom:12px;color:#1e293b}
@media print{.actions,h1,body>*:not(.wrap){display:none!important}.wrap{max-width:100%;padding:0}.preview{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="wrap">
  <h1>${esc(emoji)} Ficha: ${esc(word)}</h1>
  <div class="preview">${minSvg}</div>
  <div class="actions">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
    <a href="/crear/" class="btn-back">← Crear otra</a>
  </div>
</div>
</body>
</html>`;
}

// Escape HTML special chars for SVG text content
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Ensure a value is a safe hex color (prevent CSS injection)
function safeHex(v) {
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#7c3aed';
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
