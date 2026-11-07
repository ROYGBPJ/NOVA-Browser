export interface SearchEngine { id: string; name: string; template: string; builtin: boolean }

export const BUILTIN_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', template: 'https://www.google.com/search?q=%s', builtin: true },
  { id: 'bing', name: 'Bing', template: 'https://www.bing.com/search?q=%s', builtin: true },
  { id: 'ddg', name: 'DuckDuckGo', template: 'https://duckduckgo.com/?q=%s', builtin: true },
  { id: 'yahoo', name: 'Yahoo', template: 'https://search.yahoo.com/search?p=%s', builtin: true },
  { id: 'ecosia', name: 'Ecosia', template: 'https://www.ecosia.org/search?q=%s', builtin: true },
  { id: 'brave', name: 'Brave Search', template: 'https://search.brave.com/search?q=%s', builtin: true },
];

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  return engine.template.replace('%s', encodeURIComponent(query));
}

export function addCustomEngine(list: SearchEngine[], name: string, template: string): SearchEngine[] {
  if (!name.trim()) throw new Error('Engine name is required');
  if (!/^https?:\/\//i.test(template) || !template.includes('%s')) {
    throw new Error('Template must be an http(s) URL containing %s');
  }
  const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (list.some(e => e.id === id)) throw new Error('Engine already exists');
  return [...list, { id, name, template, builtin: false }];
}

export function removeEngine(list: SearchEngine[], id: string): SearchEngine[] {
  const target = list.find(e => e.id === id);
  if (!target) return list;
  if (list.length <= 1) throw new Error('Cannot remove the last engine');
  return list.filter(e => e.id !== id);
}
