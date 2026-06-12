(function () {
  try {
    var t = window.localStorage.getItem('ns-admin-theme');
    if (t) {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
