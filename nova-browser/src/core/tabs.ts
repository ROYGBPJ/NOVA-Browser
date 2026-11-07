// Pure tab-manager state. WebViews are owned by the UI layer keyed by tab id,
// so switching tabs never recreates a WebView (preserves playback state).
export interface Tab {
  id: string; url: string; title: string;
  isPrivate: boolean; pinned: boolean; groupId?: string;
}
export interface TabsState {
  tabs: Tab[]; activeId: string | null; recentlyClosed: Tab[];
}
export const MAX_RECENTLY_CLOSED = 20;
let counter = 0;
const newId = () => `tab-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const initialTabs = (): TabsState => ({ tabs: [], activeId: null, recentlyClosed: [] });

export function openTab(s: TabsState, url = 'about:blank', isPrivate = false): TabsState {
  const tab: Tab = { id: newId(), url, title: 'New Tab', isPrivate, pinned: false };
  return { ...s, tabs: [...s.tabs, tab], activeId: tab.id };
}

export function switchTab(s: TabsState, id: string): TabsState {
  return s.tabs.some(t => t.id === id) ? { ...s, activeId: id } : s;
}

export function closeTab(s: TabsState, id: string): TabsState {
  const idx = s.tabs.findIndex(t => t.id === id);
  if (idx < 0) return s;
  const closed = s.tabs[idx];
  const tabs = s.tabs.filter(t => t.id !== id);
  let activeId = s.activeId;
  if (activeId === id) activeId = tabs.length ? tabs[Math.min(idx, tabs.length - 1)].id : null;
  // Private tabs are never recorded for reopening.
  const recentlyClosed = closed.isPrivate
    ? s.recentlyClosed
    : [closed, ...s.recentlyClosed].slice(0, MAX_RECENTLY_CLOSED);
  return { tabs, activeId, recentlyClosed };
}

export function reopenClosed(s: TabsState): TabsState {
  const [t, ...rest] = s.recentlyClosed;
  if (!t) return s;
  const tab = { ...t, id: newId() };
  return { tabs: [...s.tabs, tab], activeId: tab.id, recentlyClosed: rest };
}

export function duplicateTab(s: TabsState, id: string): TabsState {
  const src = s.tabs.find(t => t.id === id);
  if (!src) return s;
  const copy = { ...src, id: newId(), pinned: false };
  const i = s.tabs.findIndex(t => t.id === id);
  const tabs = [...s.tabs.slice(0, i + 1), copy, ...s.tabs.slice(i + 1)];
  return { ...s, tabs, activeId: copy.id };
}

export function togglePin(s: TabsState, id: string): TabsState {
  const tabs = s.tabs.map(t => (t.id === id ? { ...t, pinned: !t.pinned } : t));
  // Pinned tabs sort first, stable otherwise.
  tabs.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return { ...s, tabs };
}

export function updateTab(s: TabsState, id: string, patch: Partial<Pick<Tab, 'url' | 'title' | 'pinned' | 'groupId'>>): TabsState {
  return { ...s, tabs: s.tabs.map(t => (t.id === id ? { ...t, ...patch } : t)) };
}

export function closeAll(s: TabsState): TabsState {
  const keep = s.tabs.filter(t => !t.isPrivate);
  return { tabs: [], activeId: null, recentlyClosed: [...keep, ...s.recentlyClosed].slice(0, MAX_RECENTLY_CLOSED) };
}

// Session persistence: private tabs are excluded from what gets written to disk.
export function serializeSession(s: TabsState): string {
  const tabs = s.tabs.filter(t => !t.isPrivate);
  const activeId = tabs.some(t => t.id === s.activeId) ? s.activeId : tabs[0]?.id ?? null;
  return JSON.stringify({ v: 1, tabs, activeId, recentlyClosed: s.recentlyClosed });
}

export function restoreSession(json: string | null): TabsState {
  if (!json) return initialTabs();
  try {
    const p = JSON.parse(json);
    if (p?.v !== 1 || !Array.isArray(p.tabs)) return initialTabs();
    return { tabs: p.tabs, activeId: p.activeId ?? null, recentlyClosed: p.recentlyClosed ?? [] };
  } catch {
    return initialTabs(); // corrupted session: recover with a clean state
  }
}
