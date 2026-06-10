(function () {
  function applyLang(lang) {
    document.querySelectorAll('[data-es]').forEach(function (el) {
      if (!el.children.length) {
        el.textContent = lang === 'es' ? el.dataset.es : (el.dataset.en || el.dataset.es);
      }
    });
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.id === 'btn' + lang.toUpperCase());
    });
    document.documentElement.lang = lang;
    try { localStorage.setItem('ck_lang', lang); } catch (e) {}
  }

  window.setLang = function (lang) { applyLang(lang); };

  var saved = 'es';
  try { saved = localStorage.getItem('ck_lang') || 'es'; } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyLang(saved); });
  } else {
    applyLang(saved);
  }
})();
