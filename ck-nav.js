// ck-nav.js — ChartKids shared navigation bar
(function () {
  const PAGES = [
    { href: 'index.html',        emoji: '🏠', label: 'Charts' },
    { href: 'actividades.html',  emoji: '🎨', label: 'Actividades' },
    { href: 'recompensas.html',  emoji: '⭐', label: 'Recompensas' },
    { href: 'descargables.html', emoji: '📥', label: 'Descargables' },
    { href: 'premium.html',      emoji: '👑', label: 'Premium', gold: true },
  ];

  const CSS = `
    #ck-nav{font-family:'Nunito',sans-serif;background:#0f0f1a;border-bottom:1px solid #2e2e50;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:1000;}
    .ckn-logo{font-family:'Fredoka One',cursive;font-size:1.4rem;background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none;flex-shrink:0;}
    .ckn-logo span{-webkit-text-fill-color:#fbbf24;}
    .ckn-links{display:flex;align-items:center;gap:5px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;flex:1;padding:2px 0;}
    .ckn-links::-webkit-scrollbar{display:none;}
    .ckn-link{display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:50px;text-decoration:none;font-weight:800;font-size:.82rem;color:#94a3b8;background:#1a1a2e;border:1px solid #2e2e50;transition:all .2s;white-space:nowrap;flex-shrink:0;}
    .ckn-link:hover{color:#f1f5f9;border-color:#7c3aed;background:#232340;}
    .ckn-link.ckn-active{color:#f1f5f9;border-color:#7c3aed;background:rgba(124,58,237,.18);}
    .ckn-link.ckn-gold{color:#fbbf24;border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.08);}
    .ckn-link.ckn-gold:hover,.ckn-link.ckn-gold.ckn-active{background:rgba(245,158,11,.18);border-color:rgba(245,158,11,.6);}
    .ckn-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}
    .ckn-lang{display:flex;background:#232340;border-radius:50px;padding:3px;gap:2px;}
    .ckn-lang-btn{padding:5px 12px;border-radius:50px;border:none;background:transparent;color:#94a3b8;font-family:'Nunito',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .2s;}
    .ckn-lang-btn.active{background:linear-gradient(135deg,#7c3aed,#06b6d4);color:white;}
    .ckn-loginbtn{padding:7px 16px;border-radius:50px;border:1px solid #2e2e50;background:#1a1a2e;color:#94a3b8;font-family:'Nunito',sans-serif;font-size:.8rem;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap;}
    .ckn-loginbtn:hover{border-color:#7c3aed;color:#f1f5f9;}
    .ckn-user{display:flex;align-items:center;gap:7px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);padding:5px 12px 5px 7px;border-radius:50px;}
    .ckn-avatar{width:24px;height:24px;border-radius:50%;flex-shrink:0;}
    .ckn-username{font-size:.8rem;font-weight:700;color:#22c55e;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .ckn-signout{background:none;border:none;color:#64748b;font-size:.72rem;cursor:pointer;font-family:'Nunito',sans-serif;text-decoration:underline;padding:0;}
    @media(max-width:600px){
      #ck-nav{padding:9px 12px;}
      .ckn-logo{font-size:1.15rem;}
      .ckn-link{padding:7px 9px;}
      .ckn-label{display:none;}
      .ckn-username,.ckn-signout{display:none;}
      .ckn-lang{display:none;}
    }
  `;

  function currentPage() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function getLang() {
    return localStorage.getItem('ck_lang') || 'es';
  }

  function buildHTML() {
    const cur = currentPage();
    const lang = getLang();

    const links = PAGES.map(p => {
      const active = cur === p.href ? ' ckn-active' : '';
      const gold   = p.gold ? ' ckn-gold' : '';
      return `<a href="${p.href}" class="ckn-link${gold}${active}">${p.emoji} <span class="ckn-label">${p.label}</span></a>`;
    }).join('');

    return `
      <a href="index.html" class="ckn-logo">Chart<span>Kids</span>✨</a>
      <div class="ckn-links">${links}</div>
      <div class="ckn-right">
        <div id="ckn-auth"></div>
        <div class="ckn-lang">
          <button class="ckn-lang-btn ${lang==='es'?'active':''}" onclick="cknSetLang('es')">ES</button>
          <button class="ckn-lang-btn ${lang==='en'?'active':''}" onclick="cknSetLang('en')">EN</button>
        </div>
      </div>
    `;
  }

  window.renderCknAuth = async function () {
    const el = document.getElementById('ckn-auth');
    if (!el || typeof ckGetUser !== 'function') return;
    try {
      const user = await ckGetUser();
      if (user) {
        const avatar = user.user_metadata?.avatar_url;
        const name = (user.user_metadata?.full_name || user.email || '').split(' ')[0];
        el.innerHTML = `<div class="ckn-user">
          ${avatar ? `<img src="${avatar}" class="ckn-avatar" referrerpolicy="no-referrer">` : ''}
          <span class="ckn-username">${name}</span>
          <button class="ckn-signout" onclick="ckSignOut()">Salir</button>
        </div>`;
      } else {
        el.innerHTML = `<button class="ckn-loginbtn" onclick="ckSignIn()">☁️ Login</button>`;
      }
    } catch (e) {}
  };

  window.cknSetLang = function (lang) {
    localStorage.setItem('ck_lang', lang);
    document.querySelectorAll('.ckn-lang-btn').forEach(b =>
      b.classList.toggle('active', b.textContent === lang.toUpperCase())
    );
    if (typeof setLang === 'function') setLang(lang);
  };

  function init() {
    const root = document.getElementById('ck-nav');
    if (!root) return;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    root.innerHTML = buildHTML();
    setTimeout(renderCknAuth, 150);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
