/** Inject into a WebView only after explicit user request. No page mutation. */
export const READER_EXTRACT_JS = `
(function() {
  try {
    const remove = 'script,style,noscript,svg,canvas,iframe,nav,footer,header,aside,form,button,[role="navigation"],[aria-hidden="true"]';
    const clone = document.body ? document.body.cloneNode(true) : null;
    if (!clone) return;
    clone.querySelectorAll(remove).forEach(n => n.remove());
    const candidates = Array.from(clone.querySelectorAll('article,main,[role="main"],section'));
    const best = candidates.sort((a,b) => (b.innerText || '').length - (a.innerText || '').length)[0] || clone;
    const text = (best.innerText || '').replace(/\\s+/g, ' ').trim();
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'reader', title: document.title, url: location.href, text: text.slice(0, 100000)
    }));
  } catch (_) {}
})();
true;
`;
