import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyBrowserData, addBookmark, removeBookmark, recordVisit, clearHistory, addCustomSearch, removeCustomSearch,
  addDownload, setPermission, permissionFor, createGroup, assignTabToGroup,
  updateSettings, normalizeBrowserData, serializeBrowserData, isThirdPartyRequest
} from '../core/browserData.ts';
import { isBlockedTracker, shouldAllowNavigation } from '../core/contentBlocking.ts';

test('bookmarks add once and remove', () => {
  let d = addBookmark(emptyBrowserData(), 'https://example.com', 'Example');
  d = addBookmark(d, 'https://example.com', 'Duplicate');
  assert.equal(d.bookmarks.length, 1);
  d = removeBookmark(d, d.bookmarks[0].id);
  assert.equal(d.bookmarks.length, 0);
});
test('history respects setting, de-duplicates and clears', () => {
  let d = recordVisit(emptyBrowserData(), 'https://example.com', 'Example', 10);
  d = recordVisit(d, 'https://example.com', 'Example 2', 20);
  assert.equal(d.history.length, 1);
  assert.equal(d.history[0].title, 'Example 2');
  assert.equal(clearHistory(d).history.length, 0);
  d = updateSettings(d, { saveHistory: false });
  assert.equal(recordVisit(d, 'https://other.com').history.length, 1);
});
test('downloads reject unsafe schemes and sanitize filename', () => {
  let d = addDownload(emptyBrowserData(), 'file:///secret', 'secret');
  assert.equal(d.downloads.length, 0);
  d = addDownload(d, 'https://example.com/a', '../bad:name?.pdf');
  assert.equal(d.downloads[0].filename.includes('/'), false);
});
test('site permissions are scoped to origin and type', () => {
  let d = setPermission(emptyBrowserData(), 'https://example.com', 'camera', 'block');
  assert.equal(permissionFor(d, 'https://example.com/path', 'camera'), 'block');
  assert.equal(permissionFor(d, 'https://example.com', 'microphone'), 'ask');
});
test('tab groups assign tabs exclusively', () => {
  let d = createGroup(emptyBrowserData(), 'Research');
  d = createGroup(d, 'Personal');
  d = assignTabToGroup(d, d.groups[0].id, 'tab-a');
  d = assignTabToGroup(d, d.groups[1].id, 'tab-a');
  assert.deepEqual(d.groups[0].tabIds, []);
  assert.deepEqual(d.groups[1].tabIds, ['tab-a']);
});
test('settings persist and malformed storage recovers', () => {
  const d = updateSettings(emptyBrowserData(), { autoplay: 'block', readerTheme: 'sepia' });
  assert.equal(normalizeBrowserData(serializeBrowserData(d)).settings.autoplay, 'block');
  assert.equal(normalizeBrowserData('{broken').settings.autoplay, 'user-gesture');
});
test('custom search engines persist and can be removed', () => {
  let d = addCustomSearch(emptyBrowserData(), 'Example Search', 'https://search.example/?q=%s');
  assert.equal(d.customEngines.length, 1);
  assert.equal(normalizeBrowserData(serializeBrowserData(d)).customEngines[0].name, 'Example Search');
  d = updateSettings(d, { searchEngineId: d.customEngines[0].id });
  d = removeCustomSearch(d, d.customEngines[0].id);
  assert.equal(d.customEngines.length, 0);
  assert.equal(d.settings.searchEngineId, 'ddg');
  assert.throws(() => addCustomSearch(d, 'Broken', 'javascript:alert(1)'), /http/);
});
test('tracker and navigation filters are conservative', () => {
  assert.equal(isBlockedTracker('https://www.google-analytics.com/collect'), true);
  assert.equal(isBlockedTracker('https://example.com'), false);
  assert.equal(shouldAllowNavigation('javascript:alert(1)'), false);
  assert.equal(shouldAllowNavigation('https://example.com'), true);
  assert.equal(isThirdPartyRequest('https://example.com', 'https://cdn.other.net/a'), true);
});
