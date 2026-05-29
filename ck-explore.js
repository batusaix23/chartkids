// ck-explore.js — ChartKids bottom explore section (auto-injects before <footer>)
(function () {

  const SECTIONS = [
    {
      href: 'index.html',
      emoji: '✨',
      badge_es: 'IA', badge_en: 'AI',
      bColor: '#7c3aed',
      title_es: 'Crear mi Chart',   title_en: 'Create my Chart',
      desc_es:  'Dile a nuestra IA cómo es tu peque y diseñará un chart personalizado en segundos.',
      desc_en:  'Tell our AI about your child and it will design a personalised chart in seconds.',
      cta_es: 'Crear chart →',      cta_en: 'Create chart →',
      cColor: '#a78bfa'
    },
    {
      href: 'actividades.html',
      emoji: '🎨',
      badge_es: 'Gratis', badge_en: 'Free',
      bColor: '#22c55e',
      title_es: 'Actividades Creativas', title_en: 'Creative Activities',
      desc_es:  '22 semanas de actividades: dibujos, manualidades, experimentos y más.',
      desc_en:  '22 weeks of activities: drawing, crafts, experiments and more.',
      cta_es: 'Ver actividades →',  cta_en: 'See activities →',
      cColor: '#ec4899'
    },
    {
      href: 'actividad-semana.html',
      emoji: '📅',
      badge_es: 'Semanal', badge_en: 'Weekly',
      bColor: '#22c55e',
      title_es: 'Actividad de la Semana', title_en: 'Activity of the Week',
      desc_es:  'Una actividad especial renovada cada lunes con sorpresas y nuevos desafíos.',
      desc_en:  'A special activity renewed every Monday with surprises and new challenges.',
      cta_es: 'Ver esta semana →',  cta_en: 'See this week →',
      cColor: '#22c55e'
    },
    {
      href: 'actividad-ia.html',
      emoji: '🤖',
      badge_es: 'Nuevo', badge_en: 'New',
      bColor: '#7c3aed',
      title_es: 'Actividad con IA',  title_en: 'AI Activity',
      desc_es:  'Nuestra IA genera una actividad creativa personalizada para tu peque al instante.',
      desc_en:  'Our AI instantly generates a creative personalised activity for your child.',
      cta_es: 'Generar actividad →', cta_en: 'Generate activity →',
      cColor: '#a78bfa'
    },
    {
      href: 'descargables.html',
      emoji: '📥',
      badge_es: 'Gratis', badge_en: 'Free',
      bColor: '#6366f1',
      title_es: 'Descargables',     title_en: 'Downloads',
      desc_es:  'Láminas para colorear, fichas de actividades e imprimibles temáticos.',
      desc_en:  'Coloring pages, activity sheets and themed printables.',
      cta_es: 'Ver descargables →', cta_en: 'See downloads →',
      cColor: '#818cf8'
    },
    {
      href: 'recompensas.html',
      emoji: '⭐',
      badge_es: 'XP', badge_en: 'XP',
      bColor: '#fbbf24',
      title_es: 'Mis Recompensas',  title_en: 'My Rewards',
      desc_es:  'Gana XP, desbloquea insignias y sube de nivel completando actividades.',
      desc_en:  'Earn XP, unlock badges and level up by completing activities.',
      cta_es: 'Ver progreso →',     cta_en: 'See progress →',
      cColor: '#fbbf24'
    },
    {
      href: 'blog.html',
      emoji: '📝',
      badge_es: 'Blog', badge_en: 'Blog',
      bColor: '#06b6d4',
      title_es: 'Blog para Padres', title_en: 'Parents Blog',
      desc_es:  'Artículos sobre crianza, actividades creativas y desarrollo infantil.',
      desc_en:  'Articles on parenting, creative activities and child development.',
      cta_es: 'Leer artículos →',   cta_en: 'Read articles →',
      cColor: '#22d3ee'
    },
    {
      href: 'premium.html',
      emoji: '👑',
      badge_es: 'Premium', badge_en: 'Premium',
      bColor: '#fbbf24',
      title_es: 'ChartKids Premium', title_en: 'ChartKids Premium',
      desc_es:  'Desbloquea semanas 23+, kits PDF, certificados e insignias exclusivas.',
      desc_en:  'Unlock weeks 23+, PDF kits, certificates and exclusive badges.',
      cta_es: 'Ver Premium →',      cta_en: 'See Premium →',
      cColor: '#fbbf24'
    }
  ];

  const CSS = `
    .cke-wrap{margin:0;padding:0;}
    .cke-divider{border:none;border-top:1px solid #2e2e50;margin:0;}
    .cke-section{max-width:940px;margin:52px auto 44px;padding:0 20px;font-family:'Nunito',sans-serif;}
    .cke-header{text-align:center;margin-bottom:28px;}
    .cke-header h2{font-family:'Fredoka One',cursive;font-size:1.75rem;background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:6px;}
    .cke-header p{color:#94a3b8;font-size:.92rem;}
    .cke-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;}
    .cke-card{display:flex;flex-direction:column;background:#1a1a2e;border:1.5px solid #2e2e50;border-radius:14px;padding:20px 16px;text-decoration:none;color:#f1f5f9;transition:transform .18s,border-color .18s;}
    .cke-card:hover{transform:translateY(-3px);border-color:#7c3aed;}
    .cke-icon{font-size:1.8rem;margin-bottom:8px;}
    .cke-badge{display:inline-block;padding:2px 9px;border-radius:50px;font-size:.7rem;font-weight:800;margin-bottom:9px;align-self:flex-start;}
    .cke-title{font-family:'Fredoka One',cursive;font-size:1rem;margin-bottom:6px;color:#f1f5f9;}
    .cke-desc{font-size:.8rem;color:#94a3b8;line-height:1.5;flex:1;margin-bottom:12px;}
    .cke-cta{font-weight:800;font-size:.8rem;}
    @media(max-width:600px){
      .cke-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
      .cke-section{margin:36px auto 28px;}
      .cke-card{padding:14px 12px;}
      .cke-desc{display:none;}
    }
    @media(max-width:340px){.cke-grid{grid-template-columns:1fr;}}
  `;

  function getLang() {
    return localStorage.getItem('ck_lang') || 'es';
  }

  function buildHTML(lang) {
    const cur = (location.pathname.split('/').pop() || 'index.html').replace(/\?.*/, '');
    const visible = SECTIONS.filter(s => s.href !== cur);

    const cards = visible.map(s => {
      const badge = lang === 'es' ? s.badge_es : s.badge_en;
      const title = lang === 'es' ? s.title_es : s.title_en;
      const desc  = lang === 'es' ? s.desc_es  : s.desc_en;
      const cta   = lang === 'es' ? s.cta_es   : s.cta_en;
      return `<a href="${s.href}" class="cke-card">
        <div class="cke-icon">${s.emoji}</div>
        <span class="cke-badge" style="background:${s.bColor}22;color:${s.bColor};border:1px solid ${s.bColor}44">${badge}</span>
        <div class="cke-title">${title}</div>
        <p class="cke-desc">${desc}</p>
        <span class="cke-cta" style="color:${s.cColor}">${cta}</span>
      </a>`;
    }).join('');

    const heading = lang === 'es' ? 'Explora ChartKids' : 'Explore ChartKids';
    const sub     = lang === 'es' ? 'Todo lo que hay para ti y tu peque' : 'Everything for you and your little one';

    return `<div class="cke-wrap">
      <hr class="cke-divider">
      <section class="cke-section">
        <div class="cke-header">
          <h2>${heading}</h2>
          <p>${sub}</p>
        </div>
        <div class="cke-grid">${cards}</div>
      </section>
    </div>`;
  }

  function injectStyles() {
    if (document.querySelector('style[data-cke]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-cke', '1');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function render(lang) {
    let root = document.getElementById('ck-explore');
    if (!root) {
      // Auto-inject before <footer>
      const footer = document.querySelector('footer');
      if (!footer) return;
      root = document.createElement('div');
      root.id = 'ck-explore';
      footer.parentNode.insertBefore(root, footer);
    }
    root.innerHTML = buildHTML(lang || getLang());
  }

  // Called by ck-nav.js when language changes
  window.ckeRefreshLang = function (lang) { render(lang); };

  function init() {
    injectStyles();
    render();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
