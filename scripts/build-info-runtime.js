// scripts/build-info-runtime.js
// Loaded on every page. Reads build-info.json and fills the footer #buildInfo
// element with the current build number, date, and time.
(function () {
  var el = document.getElementById('buildInfo');
  if (!el) return;

  function render(info) {
    if (!info || !info.build) return;
    el.textContent =
      'Built ' + info.build + ' · ' + (info.buildTimeLocal || info.buildTime || '') +
      ' (SAST) · commit ' + (info.commit || '?');
    el.title = 'Build ' + info.build + ' generated ' + (info.buildTime || '');
  }

  fetch('build-info.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(render)
    .catch(function () {
      el.textContent = 'Build info unavailable.';
    });
})();
