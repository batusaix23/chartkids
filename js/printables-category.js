// printables-category.js — renders a category hub page (laberintos.html, colorear.html, …)
// from its manifest at /data/printables/<cat>.json (written by printables/lib.js).
// Usage: <script src="/js/printables-category.js" data-cat="laberintos" defer></script>
(function () {
  var script = document.currentScript;
  var CAT = script && script.dataset.cat;
  var grid = document.getElementById('itemsGrid');
  if (!CAT || !grid) return;

  var DIFF = { facil: ['Fácil', 'Easy'], medio: ['Medio', 'Medium'], dificil: ['Difícil', 'Hard'] };
  var manifest = null;
  var lang = 'es';
  try { lang = localStorage.getItem('ck_lang') === 'en' ? 'en' : 'es'; } catch (e) {}

  function t(es, en) { return lang === 'en' ? en : es; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function activeVal(id) {
    var b = document.querySelector('#' + id + ' .fchip.active');
    return b ? b.dataset.val : '';
  }

  function render() {
    if (!manifest) return;
    var diff = activeVal('diffChips'), age = activeVal('ageChips');
    var list = manifest.items.filter(function (i) {
      return (!diff || i.diff === diff) && (!age || i.age === age);
    });
    var count = document.getElementById('resultCount');
    if (count) count.textContent = t(list.length + ' de ' + manifest.total + ' fichas', list.length + ' of ' + manifest.total + ' worksheets');
    grid.innerHTML = list.map(function (i) {
      var href = '/' + manifest.dir + '/' + i.slug + '/';
      var d = DIFF[i.diff] || ['', ''];
      return '<a class="item-card" href="' + href + '">' +
        '<div class="item-thumb"><img src="' + href + 'sheet.svg" alt="' + esc(t(i.title_es, i.title_en)) + '" loading="lazy" width="816" height="1056"></div>' +
        '<div class="item-info"><div class="item-name">' + esc(t(i.title_es, i.title_en)) + '</div>' +
        '<div class="item-tags"><span class="item-tag">' + esc(i.age) + ' ' + t('años', 'yrs') + '</span>' +
        '<span class="item-tag">' + esc(t(d[0], d[1])) + '</span>' +
        (i.answer ? '<span class="item-tag">✔ ' + t('Solución', 'Answers') + '</span>' : '') + '</div>' +
        '<span class="item-btn btn-ready">🖨️ ' + t('Ver e imprimir', 'View & print') + '</span></div></a>';
    }).join('') || '<p class="no-results">' + t('Sin resultados con estos filtros.', 'No results for these filters.') + '</p>';
  }

  function applyStatic() {
    document.querySelectorAll('[data-es]').forEach(function (el) {
      el.textContent = lang === 'en' ? (el.dataset.en || el.dataset.es) : el.dataset.es;
    });
    document.documentElement.lang = lang;
  }

  // ck-nav.js calls setLang() when the visitor switches language.
  window.setLang = function (l) { lang = l === 'en' ? 'en' : 'es'; applyStatic(); render(); };

  document.querySelectorAll('.filter-chips').forEach(function (g) {
    g.querySelectorAll('.fchip').forEach(function (b) {
      b.addEventListener('click', function () {
        g.querySelectorAll('.fchip').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        render();
      });
    });
  });

  applyStatic();
  fetch('/data/printables/' + CAT + '.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (m) { manifest = m; render(); })
    .catch(function () {
      grid.innerHTML = '<p class="no-results">' + t('No se pudieron cargar las fichas. Recarga la página.', 'Could not load the worksheets. Please reload.') + '</p>';
    });
})();
