// URL vs. search recognition and unsafe-scheme protection.
export type Resolved =
  | { kind: 'url'; url: string }
  | { kind: 'search'; query: string }
  | { kind: 'blocked'; reason: string };

const SAFE_SCHEMES = new Set(['http:', 'https:', 'about:']);
const BLOCKED_SCHEMES = new Set(['javascript:', 'data:', 'file:', 'vbscript:', 'blob:']);

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/;
const HOSTLIKE = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(:\d+)?(\/.*)?(\?.*)?(#.*)?$/i;
const LOCALHOST = /^localhost(:\d+)?(\/.*)?$/i;
const HOST_PORT = /^[a-z0-9.-]+:\d+(\/|$)/i;

export function resolveInput(raw: string): Resolved {
  const input = raw.trim();
  if (!input) return { kind: 'search', query: '' };

  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(input);
  if (scheme && !HOST_PORT.test(input)) {
    const s = scheme[0].toLowerCase();
    if (BLOCKED_SCHEMES.has(s)) return { kind: 'blocked', reason: `Blocked unsafe scheme "${s}"` };
    if (SAFE_SCHEMES.has(s)) return { kind: 'url', url: input };
    return { kind: 'blocked', reason: `Unsupported scheme "${s}"` };
  }
  if (/\s/.test(input)) return { kind: 'search', query: input };
  if (LOCALHOST.test(input) || IPV4.test(input)) return { kind: 'url', url: `http://${input}` };
  if (HOSTLIKE.test(input)) return { kind: 'url', url: `https://${input}` };
  return { kind: 'search', query: input };
}

export function isHttps(url: string): boolean {
  return /^https:\/\//i.test(url);
}

export function hostOf(url: string): string {
  const m = /^[a-z][a-z0-9+.-]*:\/\/([^/?#:]+)/i.exec(url);
  return m ? m[1].toLowerCase() : '';
}
