
window.VIDO_ANALYTICS = {
  domain: 'waelvido-cyber.github.io',
  enabled: true
};
window.vidoTrack = function(eventName, props) {
  try {
    if (window.VIDO_ANALYTICS && window.VIDO_ANALYTICS.enabled && typeof window.plausible === 'function') {
      window.plausible(eventName, { props: props || {} });
    }
  } catch (_) {}
};
