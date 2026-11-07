import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../core/tabs.ts';

test('open, switch, close picks neighbor', () => {
  let s = T.initialTabs();
  s = T.openTab(s, 'https://a.com'); const a = s.activeId!;
  s = T.openTab(s, 'https://b.com'); const b = s.activeId!;
  s = T.openTab(s, 'https://c.com');
  s = T.switchTab(s, b);
  s = T.closeTab(s, b);
  assert.equal(s.tabs.length, 2);
  assert.notEqual(s.activeId, b);
  assert.ok(s.tabs.some(t => t.id === a));
});
test('reopen closed tab', () => {
  let s = T.openTab(T.initialTabs(), 'https://a.com');
  s = T.closeTab(s, s.activeId!);
  assert.equal(s.tabs.length, 0);
  s = T.reopenClosed(s);
  assert.equal(s.tabs[0].url, 'https://a.com');
});
test('private tabs are never recorded or persisted', () => {
  let s = T.openTab(T.initialTabs(), 'https://pub.com');
  s = T.openTab(s, 'https://priv.com', true);
  const json = T.serializeSession(s);
  assert.ok(!json.includes('priv.com'));
  s = T.closeTab(s, s.activeId!);
  assert.equal(s.recentlyClosed.length, 0);
});
test('pin sorts first; duplicate unpins copy', () => {
  let s = T.openTab(T.openTab(T.initialTabs(), 'https://a.com'), 'https://b.com');
  s = T.togglePin(s, s.tabs[1].id);
  assert.equal(s.tabs[0].url, 'https://b.com');
  s = T.duplicateTab(s, s.tabs[0].id);
  assert.equal(s.tabs[1].pinned, false);
});
test('corrupt session recovers', () => {
  assert.equal(T.restoreSession('{{not json').tabs.length, 0);
  assert.equal(T.restoreSession(null).tabs.length, 0);
  const s = T.openTab(T.initialTabs(), 'https://a.com');
  assert.equal(T.restoreSession(T.serializeSession(s)).tabs.length, 1);
});
