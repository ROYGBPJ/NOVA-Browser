import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaReducer, playingTabs, nowPlayingTab, type MediaState } from '../core/media.ts';

test('sessions track multiple tabs and do not invent metadata', () => {
  let s: MediaState = {};
  s = mediaReducer(s, { type: 'update', session: { tabId: 't1', site: 'a.com', state: 'playing' } });
  s = mediaReducer(s, { type: 'update', session: { tabId: 't2', site: 'b.com', state: 'paused', title: 'Song' } });
  assert.deepEqual(playingTabs(s), ['t1']);
  assert.equal(s.t1.title, undefined);
  assert.equal(nowPlayingTab(s), 't1');
});
test('state changes, tab close, stop all', () => {
  let s: MediaState = {};
  s = mediaReducer(s, { type: 'update', session: { tabId: 't1', site: 'a', state: 'playing' } });
  s = mediaReducer(s, { type: 'state', tabId: 't1', state: 'paused' });
  assert.equal(s.t1.state, 'paused');
  s = mediaReducer(s, { type: 'tabClosed', tabId: 't1' });
  assert.deepEqual(s, {});
  s = mediaReducer(s, { type: 'update', session: { tabId: 't2', site: 'b', state: 'playing' } });
  assert.deepEqual(mediaReducer(s, { type: 'stopAll' }), {});
});
