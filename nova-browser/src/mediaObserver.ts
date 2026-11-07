// Read-only observer injected into pages. It never modifies the page's players:
// it listens for media events and reads navigator.mediaSession metadata the site
// itself provides. Anything the site does not provide is simply omitted.
export const MEDIA_OBSERVER_JS = `
(function () {
  if (window.__novaMedia) return; window.__novaMedia = true;
  function post(m) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  function active() {
    var els = document.querySelectorAll('audio,video');
    for (var i = 0; i < els.length; i++) if (!els[i].paused && !els[i].ended) return els[i];
    return els.length ? els[0] : null;
  }
  function report(state) {
    var el = active(); if (!el) return;
    var md = (navigator.mediaSession && navigator.mediaSession.metadata) || null;
    var art = md && md.artwork && md.artwork.length ? md.artwork[md.artwork.length - 1].src : undefined;
    post({ t: 'media', state: state || (el.paused ? 'paused' : 'playing'), site: location.hostname,
      title: md ? md.title : undefined, artist: md ? md.artist : undefined, album: md ? md.album : undefined,
      artworkUrl: art, position: el.currentTime, duration: isFinite(el.duration) ? el.duration : undefined,
      muted: el.muted });
  }
  ['play','pause','ended','loadedmetadata','seeked','volumechange'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (e.target && (e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO'))
        report(ev === 'ended' ? 'ended' : undefined);
    }, true);
  });
  setInterval(function () { var el = active(); if (el && !el.paused) report('playing'); }, 5000);
  // Commands from native: run against the page's own player.
  window.__novaCmd = function (c, v) {
    var el = active(); if (!el) return;
    if (c === 'play') el.play(); else if (c === 'pause') el.pause();
    else if (c === 'seek') el.currentTime = v;
    else if (c === 'skipForward') el.currentTime += v || 15;
    else if (c === 'skipBackward') el.currentTime -= v || 15;
    else if (c === 'mute') el.muted = !!v;
    // next/previous: browsers do not expose a site's media-session action handlers,
    // so these are not forwarded; NOVA disables those lock-screen buttons.
  };
  true;
})();
`;
