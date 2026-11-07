import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInput, isHttps, hostOf } from '../core/url.ts';
import { BUILTIN_ENGINES, buildSearchUrl, addCustomEngine, removeEngine } from '../core/search.ts';

test('recognizes bare domains as https URLs', () => {
  assert.deepEqual(resolveInput('example.com'), { kind: 'url', url: 'https://example.com' });
  assert.deepEqual(resolveInput('sub.example.co.uk/path?x=1'), { kind: 'url', url: 'https://sub.example.co.uk/path?x=1' });
});
test('localhost and IPs use http', () => {
  assert.equal(resolveInput('localhost:3000').kind, 'url');
  assert.deepEqual(resolveInput('192.168.1.1'), { kind: 'url', url: 'http://192.168.1.1' });
});
test('phrases and single words are searches', () => {
  assert.deepEqual(resolveInput('best pizza near me'), { kind: 'search', query: 'best pizza near me' });
  assert.deepEqual(resolveInput('cats'), { kind: 'search', query: 'cats' });
});
test('unsafe schemes are blocked', () => {
  for (const u of ['javascript:alert(1)', 'data:text/html,<b>', 'file:///etc/passwd', 'JAVASCRIPT:x'])
    assert.equal(resolveInput(u).kind, 'blocked', u);
  assert.equal(resolveInput('ftp://x.com').kind, 'blocked');
});
test('https helpers', () => {
  assert.ok(isHttps('https://a.com'));
  assert.ok(!isHttps('http://a.com'));
  assert.equal(hostOf('https://WWW.Example.com:8080/x'), 'www.example.com');
});
test('search engines', () => {
  const ddg = BUILTIN_ENGINES.find(e => e.id === 'ddg')!;
  assert.equal(buildSearchUrl(ddg, 'a b&c'), 'https://duckduckgo.com/?q=a%20b%26c');
  const list = addCustomEngine(BUILTIN_ENGINES, 'My Engine', 'https://x.com/s?q=%s');
  assert.equal(list.length, 7);
  assert.throws(() => addCustomEngine(list, 'Bad', 'https://x.com/'));
  assert.throws(() => addCustomEngine(list, 'My Engine', 'https://x.com/s?q=%s'));
  assert.equal(removeEngine(list, 'custom-my-engine').length, 6);
});
