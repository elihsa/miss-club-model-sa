// build-info-runtime.js - Client-side build info fetcher
// Fetches build info from /api/build-info and updates the footer display

(function() {
  'use strict';

  const buildInfoEl = document.getElementById('buildInfo');
  if (!buildInfoEl) {
    console.warn('[build-info] #buildInfo element not found');
    return;
  }

  async function fetchBuildInfo() {
    try {
      const response = await fetch('/api/build-info', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('[build-info] Failed to fetch:', err);
      return null;
    }
  }

  function formatBuildInfo(data) {
    if (!data) {
      return 'Build info unavailable';
    }
    const parts = [];
    if (data.build) parts.push(data.build);
    if (data.buildTimeLocal) parts.push(data.buildTimeLocal);
    if (data.commit && data.commit !== 'local') parts.push(`commit: ${data.commit.slice(0, 7)}`);
    if (data.branch && data.branch !== 'unknown') parts.push(data.branch);
    return parts.join(' | ');
  }

  async function init() {
    const data = await fetchBuildInfo();
    buildInfoEl.textContent = formatBuildInfo(data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();