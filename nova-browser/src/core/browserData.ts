/**
 * NOVA Browser persistent feature models.
 * Pure TypeScript only: safe to unit-test on Windows without Xcode.
 */
import { hostOf } from './url.ts';
import type { Tab } from './tabs';
import { addCustomEngine, removeEngine, type SearchEngine } from './search';

export type HistoryEntry = { id: string; url: string; title: string; visitedAt: number };
export type Bookmark = { id: string; url: string; title: string; folder: string; createdAt: number };
export type DownloadRecord = { id: string; url: string; filename: string; mimeType?: string; status: 'queued' | 'downloading' | 'complete' | 'failed'; createdAt: number; localUri?: string };
export type PermissionKind = 'camera' | 'microphone' | 'location' | 'notifications' | 'clipboard';
export type SitePermission = { origin: string; kind: PermissionKind; decision: 'ask' | 'allow' | 'block'; updatedAt: number };
export type TabGroup = { id: string; name: string; color: string; tabIds: string[] };
export type BrowserSettings = {
  searchEngineId: string;
  homepage: string;
  openLinksInNewTab: boolean;
  blockPopups: boolean;
  blockTrackers: boolean;
  blockThirdPartyCookies: boolean;
  doNotTrack: boolean;
  autoplay: 'allow' | 'user-gesture' | 'block';
  saveHistory: boolean;
  clearOnExit: boolean;
  readerFontSize: number;
  readerTheme: 'light' | 'dark' | 'sepia';
  translateTarget: string;
};
export type BrowserData = {
  version: 1;
  bookmarks: Bookmark[];
  customEngines: SearchEngine[];
  history: HistoryEntry[];
  downloads: DownloadRecord[];
  permissions: SitePermission[];
  groups: TabGroup[];
  settings: BrowserSettings;
};

export const DEFAULT_SETTINGS: BrowserSettings = {
  searchEngineId: 'ddg', homepage: 'https://duckduckgo.com',
  openLinksInNewTab: false, blockPopups: true, blockTrackers: true,
  blockThirdPartyCookies: false, doNotTrack: true, autoplay: 'user-gesture',
  saveHistory: true, clearOnExit: false, readerFontSize: 18,
  readerTheme: 'light', translateTarget: 'en'
};
export const emptyBrowserData = (): BrowserData => ({
  version: 1, bookmarks: [], customEngines: [], history: [], downloads: [], permissions: [], groups: [],
  settings: { ...DEFAULT_SETTINGS }
});
const id = (prefix: string) => prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
export const originOf = (url: string): string => {
  try { const u = new URL(url); return u.origin; } catch { return ''; }
};
export function normalizeBrowserData(raw: string | null): BrowserData {
  if (!raw) return emptyBrowserData();
  try {
    const v = JSON.parse(raw);
    if (v?.version !== 1) return emptyBrowserData();
    return {
      version: 1, bookmarks: Array.isArray(v.bookmarks) ? v.bookmarks : [],
      customEngines: Array.isArray(v.customEngines) ? v.customEngines : [],
      history: Array.isArray(v.history) ? v.history : [],
      downloads: Array.isArray(v.downloads) ? v.downloads : [],
      permissions: Array.isArray(v.permissions) ? v.permissions : [],
      groups: Array.isArray(v.groups) ? v.groups : [],
      settings: { ...DEFAULT_SETTINGS, ...(v.settings ?? {}) }
    };
  } catch { return emptyBrowserData(); }
}
export const serializeBrowserData = (data: BrowserData): string => JSON.stringify(data);
export function addBookmark(data: BrowserData, url: string, title = url, folder = 'Favorites'): BrowserData {
  if (!/^https?:\/\//i.test(url)) return data;
  if (data.bookmarks.some(b => b.url === url)) return data;
  return { ...data, bookmarks: [{ id: id('bm'), url, title, folder, createdAt: Date.now() }, ...data.bookmarks] };
}
export function removeBookmark(data: BrowserData, bookmarkId: string): BrowserData {
  return { ...data, bookmarks: data.bookmarks.filter(b => b.id !== bookmarkId) };
}
export function recordVisit(data: BrowserData, url: string, title = url, at = Date.now()): BrowserData {
  if (!data.settings.saveHistory || !/^https?:\/\//i.test(url)) return data;
  const entry = { id: id('h'), url, title, visitedAt: at };
  return { ...data, history: [entry, ...data.history.filter(h => h.url !== url)].slice(0, 5000) };
}
export function clearHistory(data: BrowserData): BrowserData { return { ...data, history: [] }; }
export function addDownload(data: BrowserData, url: string, filename: string, mimeType?: string): BrowserData {
  if (!/^https?:\/\//i.test(url)) return data;
  return { ...data, downloads: [{ id: id('dl'), url, filename: filename.replace(/[\\/:*?"<>|]/g, '_').slice(0, 180), mimeType, status: 'queued', createdAt: Date.now() }, ...data.downloads] };
}
export function updateDownload(data: BrowserData, downloadId: string, patch: Partial<DownloadRecord>): BrowserData {
  return { ...data, downloads: data.downloads.map(d => d.id === downloadId ? { ...d, ...patch, id: d.id, url: d.url } : d) };
}
export function setPermission(data: BrowserData, origin: string, kind: PermissionKind, decision: SitePermission['decision']): BrowserData {
  if (!/^https?:\/\//i.test(origin)) return data;
  const entry = { origin, kind, decision, updatedAt: Date.now() };
  return { ...data, permissions: [...data.permissions.filter(p => p.origin !== origin || p.kind !== kind), entry] };
}
export function permissionFor(data: BrowserData, url: string, kind: PermissionKind): SitePermission['decision'] {
  const origin = originOf(url);
  return data.permissions.find(p => p.origin === origin && p.kind === kind)?.decision ?? 'ask';
}
export function createGroup(data: BrowserData, name: string, color = '#795cff'): BrowserData {
  const clean = name.trim().slice(0, 32);
  if (!clean) return data;
  return { ...data, groups: [...data.groups, { id: id('group'), name: clean, color, tabIds: [] }] };
}
export function assignTabToGroup(data: BrowserData, groupId: string, tabId: string): BrowserData {
  return { ...data, groups: data.groups.map(g => ({ ...g, tabIds: g.id === groupId ? [...new Set([...g.tabIds, tabId])] : g.tabIds.filter(x => x !== tabId) })) };
}
export function removeGroup(data: BrowserData, groupId: string): BrowserData {
  return { ...data, groups: data.groups.filter(g => g.id !== groupId) };
}
export function addCustomSearch(data: BrowserData, name: string, template: string): BrowserData {
  return { ...data, customEngines: addCustomEngine(data.customEngines, name, template) };
}
export function removeCustomSearch(data: BrowserData, engineId: string): BrowserData {
  return { ...data, customEngines: removeEngine(data.customEngines, engineId) };
}
export function updateSettings(data: BrowserData, patch: Partial<BrowserSettings>): BrowserData {
  return { ...data, settings: { ...data.settings, ...patch } };
}
export function groupTabs(data: BrowserData, tabs: Tab[]): Array<TabGroup & { tabs: Tab[] }> {
  return data.groups.map(g => ({ ...g, tabs: tabs.filter(t => g.tabIds.includes(t.id)) }));
}
export function isThirdPartyRequest(pageUrl: string, requestUrl: string): boolean {
  const pageHost = hostOf(pageUrl).replace(/^www\./, '');
  const requestHost = hostOf(requestUrl).replace(/^www\./, '');
  return !!pageHost && !!requestHost && pageHost !== requestHost && !requestHost.endsWith('.' + pageHost);
}

// Conservative reader extraction: strips active content and returns readable text.
// Actual DOM extraction is performed by the isolated WebView script in reader.ts.
export function readerDocument(title: string, text: string, url: string) {
  return { title: title.trim() || hostOf(url), text: text.replace(/\s+/g, ' ').trim(), url };
}
