import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { resolveInput } from './src/core/url';
import { BUILTIN_ENGINES, buildSearchUrl } from './src/core/search';
import * as T from './src/core/tabs';
import { mediaReducer, nowPlayingTab } from './src/core/media';
import { MEDIA_OBSERVER_JS } from './src/mediaObserver';
import { NovaMedia } from './modules/nova-media';

const SESSION_FILE = FileSystem.documentDirectory + 'session.json';
type TabAction = (s: T.TabsState) => T.TabsState;

export default function App() {
  const dark = useColorScheme() === 'dark';
  const c = dark ? { bg: '#0b0d14', bar: '#161a26', fg: '#e8ecff', accent: '#7c5cff' }
                 : { bg: '#f4f5fb', bar: '#ffffff', fg: '#10131f', accent: '#5a3df0' };
  const [tabs, dispatchTabs] = useReducer((s: T.TabsState, a: TabAction) => a(s), T.initialTabs());
  const [media, dispatchMedia] = useReducer(mediaReducer, {});
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<Record<string, WebView | null>>({});
  const loaded = useRef(false);

  // Restore session once, then open a tab if none.
  useEffect(() => {
    (async () => {
      let json: string | null = null;
      try { json = await FileSystem.readAsStringAsync(SESSION_FILE); } catch {}
      const restored = T.restoreSession(json);
      dispatchTabs(() => (restored.tabs.length ? restored : T.openTab(T.initialTabs(), 'https://duckduckgo.com')));
      loaded.current = true;
    })();
    NovaMedia.configureSession(false).catch(() => {});
  }, []);

  // Persist (private tabs excluded by serializeSession).
  useEffect(() => {
    if (loaded.current) FileSystem.writeAsStringAsync(SESSION_FILE, T.serializeSession(tabs)).catch(() => {});
  }, [tabs]);

  // Native remote commands -> active website player.
  useEffect(() => {
    const sub = NovaMedia.onRemoteCommand(({ command, position, interval }) => {
      const id = nowPlayingTab(media);
      const wv = id ? refs.current[id] : null;
      if (!wv) return;
      const cmd = command === 'toggle' ? 'play' : command;
      wv.injectJavaScript(`window.__novaCmd && window.__novaCmd(${JSON.stringify(cmd)}, ${position ?? interval ?? 'undefined'}); true;`);
    });
    return () => sub.remove();
  }, [media]);

  // Mirror active session to Now Playing.
  useEffect(() => {
    const id = nowPlayingTab(media);
    if (id && media[id]) {
      NovaMedia.setNowPlaying({ ...media[id] }).catch(() => {});
      NovaMedia.setSupportedCommands({ play: true, pause: true, seek: !!media[id].duration }).catch(() => {});
    } else NovaMedia.clearNowPlaying().catch(() => {});
  }, [media]);

  const active = tabs.tabs.find(t => t.id === tabs.activeId);

  const go = useCallback(() => {
    if (!active) return;
    const r = resolveInput(input);
    if (r.kind === 'blocked') return setError(r.reason);
    setError(null);
    const url = r.kind === 'url' ? r.url : buildSearchUrl(BUILTIN_ENGINES[2], r.query);
    dispatchTabs(s => T.updateTab(s, active.id, { url }));
  }, [input, active]);

  const onMessage = (tabId: string) => (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.t === 'media') dispatchMedia({ type: 'update', session: { ...m, tabId } });
    } catch {}
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.bg }]}>
      <View style={[s.bar, { backgroundColor: c.bar }]}>
        <Pressable accessibilityLabel="Back" onPress={() => active && refs.current[active.id]?.goBack()}><Text style={[s.btn, { color: c.fg }]}>‹</Text></Pressable>
        <Pressable accessibilityLabel="Forward" onPress={() => active && refs.current[active.id]?.goForward()}><Text style={[s.btn, { color: c.fg }]}>›</Text></Pressable>
        <TextInput
          style={[s.input, { color: c.fg, borderColor: c.accent }]}
          value={input} onChangeText={setInput} onSubmitEditing={go}
          placeholder="Search or enter address" placeholderTextColor="#888"
          autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go"
          accessibilityLabel="Address bar" />
        <Pressable accessibilityLabel="Reload" onPress={() => active && refs.current[active.id]?.reload()}><Text style={[s.btn, { color: c.fg }]}>⟳</Text></Pressable>
      </View>
      {error && <Text style={s.err}>{error}</Text>}

      <View style={s.web}>
        {tabs.tabs.map(t => (
          // All WebViews stay mounted; inactive ones are hidden, so playback survives tab switches.
          <View key={t.id} style={[StyleSheet.absoluteFill, t.id !== tabs.activeId && s.hidden]}>
            <WebView
              ref={r => { refs.current[t.id] = r; }}
              source={{ uri: t.url }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsAirPlayForMediaPlayback
              allowsBackForwardNavigationGestures
              sharedCookiesEnabled={!t.isPrivate}
              incognito={t.isPrivate}
              injectedJavaScript={MEDIA_OBSERVER_JS}
              onMessage={onMessage(t.id)}
              onNavigationStateChange={n => {
                dispatchTabs(st => T.updateTab(st, t.id, { title: n.title || n.url, url: n.url }));
                if (t.id === tabs.activeId) setInput(n.url);
              }}
              onShouldStartLoadWithRequest={req => resolveInput(req.url).kind !== 'blocked'}
              onError={e => setError(e.nativeEvent.description)}
            />
          </View>
        ))}
      </View>

      <View style={[s.bar, { backgroundColor: c.bar }]}>
        <Pressable accessibilityLabel="New tab" onPress={() => dispatchTabs(st => T.openTab(st, 'https://duckduckgo.com'))}><Text style={[s.btn, { color: c.fg }]}>＋</Text></Pressable>
        <Pressable accessibilityLabel="New private tab" onPress={() => dispatchTabs(st => T.openTab(st, 'https://duckduckgo.com', true))}><Text style={[s.btn, { color: c.fg }]}>🕶</Text></Pressable>
        <Text style={{ color: c.fg, flex: 1, textAlign: 'center' }} numberOfLines={1}>
          {tabs.tabs.length} tab{tabs.tabs.length === 1 ? '' : 's'}{Object.values(media).some(m => m.state === 'playing') ? ' · ♪' : ''}
        </Text>
        <Pressable accessibilityLabel="Reopen closed tab" onPress={() => dispatchTabs(T.reopenClosed)}><Text style={[s.btn, { color: c.fg }]}>↺</Text></Pressable>
        <Pressable accessibilityLabel="Close tab" onPress={() => active && dispatchTabs(st => T.closeTab(st, active.id))}><Text style={[s.btn, { color: c.fg }]}>✕</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  btn: { fontSize: 24, paddingHorizontal: 6, minWidth: 32, textAlign: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  err: { color: '#ff5470', paddingHorizontal: 14, paddingVertical: 4 },
  web: { flex: 1 },
  hidden: { opacity: 0, pointerEvents: 'none' },
});
