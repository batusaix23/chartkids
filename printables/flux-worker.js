// printables/flux-worker.js — local-only helper Worker for batch image generation.
// Not deployed. Run:  npx wrangler dev printables/flux-worker.js --port 8788
// (uses the AI binding from wrangler.toml; images are billed to Workers AI).
// POST {prompt, steps?} → image/jpeg bytes.
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('POST {prompt}', { status: 405 });
    const { prompt, steps = 8 } = await request.json();
    if (!prompt) return new Response('missing prompt', { status: 400 });
    try {
      const out = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt, steps });
      const bin = Uint8Array.from(atob(out.image), c => c.charCodeAt(0));
      return new Response(bin, { headers: { 'content-type': 'image/jpeg' } });
    } catch (err) {
      return new Response(String(err && err.message || err), { status: 502 });
    }
  },
};
