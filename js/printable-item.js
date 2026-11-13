// printable-item.js — behaviour for printable item pages (printables/lib.js output).
(function () {
  function applyLang(lang) {
    document.querySelectorAll('[data-es]').forEach(function (el) {
      el.textContent = lang === 'en' ? (el.dataset.en || el.dataset.es) : el.dataset.es;
    });
    document.documentElement.lang = lang;
  }

  // Called by ck-nav.js when the visitor switches ES/EN.
  window.setLang = function (lang) { applyLang(lang === 'en' ? 'en' : 'es'); };

  // Print the sheet currently on screen (worksheet or solution), one Letter page.
  window.piPrint = function () {
    var answer = document.getElementById('piAnswer');
    var target = answer && !answer.hidden ? answer : document.getElementById('piSheet');
    target.classList.add('pi-printing');
    var done = function () { target.classList.remove('pi-printing'); };
    window.addEventListener('afterprint', done, { once: true });
    window.print();
  };

  window.piToggleAnswer = function () {
    var answer = document.getElementById('piAnswer');
    var sheet = document.getElementById('piSheet');
    var btn = document.getElementById('piSolBtn');
    var show = answer.hidden;
    answer.hidden = !show;
    sheet.hidden = show;
    var en = document.documentElement.lang === 'en';
    btn.dataset.es = show ? '📄 Ver ficha' : '👀 Ver solución';
    btn.dataset.en = show ? '📄 Show worksheet' : '👀 Show answer';
    btn.textContent = en ? btn.dataset.en : btn.dataset.es;
  };

  // Certificates: typed name replaces every [data-name] text in the sheet(s).
  var nameInput = document.getElementById('piName');
  if (nameInput) {
    var slots = document.querySelectorAll('[data-name]');
    nameInput.addEventListener('input', function () {
      var v = nameInput.value.trim();
      slots.forEach(function (el) { el.textContent = v || el.dataset.name; });
    });
  }

  var saved = 'es';
  try { saved = localStorage.getItem('ck_lang') || 'es'; } catch (e) {}
  if (saved === 'en') applyLang('en');
})();
