//**
// Gestisce il tema chiaro/scuro
//  */
(function () {
  var STORAGE_KEY = 'trackit_theme';

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function updateButton(theme) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Passa a modalità chiara' : 'Passa a modalità scura'
    );
  }

  function toggleTheme() {
    var next = getTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    updateButton(next);
  }

  /* Applica il tema SUBITO (prima del render) per evitare FOUC */
  applyTheme(getTheme());

  /* Collega il bottone quando il DOM è pronto */
  document.addEventListener('DOMContentLoaded', function () {
    updateButton(getTheme());
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }
  });
})();
