// Apply saved theme before first paint to prevent white flash
(function() {
  var pref = 'system';
  try {
    var s = JSON.parse(localStorage.getItem('filelens-settings'));
    if (s && s.theme) pref = s.theme;
  } catch(e) {
    // Migrate from old key
    var old = localStorage.getItem('csvEditor-theme');
    if (old) pref = old;
  }
  var t = pref === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : pref;
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = t === 'dark' ? 'dark' : 'light';
})();
