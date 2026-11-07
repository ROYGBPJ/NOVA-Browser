/**
 * Conservative first-party-independent tracker host denylist.
 * This is a starter filter, not a replacement for regularly updated filter lists.
 */
const TRACKER_HOSTS = new Set([
  'doubleclick.net','googlesyndication.com','google-analytics.com',
  'connect.facebook.net','pixel.facebook.com','analytics.twitter.com',
  ' scorecardresearch.com'.trim(),'hotjar.com','segment.io','mixpanel.com'
]);
export function isBlockedTracker(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\\./, '');
    return [...TRACKER_HOSTS].some(domain => host === domain || host.endsWith('.' + domain));
  } catch { return false; }
}
export function shouldAllowNavigation(url: string): boolean {
  try {
    const u = new URL(url);
    return ['http:', 'https:', 'about:'].includes(u.protocol);
  } catch { return false; }
}
