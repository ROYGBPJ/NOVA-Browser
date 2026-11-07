import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, SafeAreaView, useColorScheme, Alert, Modal, ScrollView } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { resolveInput } from './src/core/url';
import { BUILTIN_ENGINES, buildSearchUrl } from './src/core/search';
import * as T from './src/core/tabs';
import { mediaReducer, nowPlayingTab } from './src/core/media';
import { MEDIA_OBSERVER_JS } from './src/mediaObserver';
import { READER_EXTRACT_JS } from './src/reader';
import { NovaMedia } from './modules/nova-media';
import BrowserPanel from './BrowserPanel';
import TabsPanel from './TabsPanel';
import MediaPanel from './MediaPanel';
import { emptyBrowserData, normalizeBrowserData, serializeBrowserData, addBookmark, recordVisit, updateSettings, addDownload, createGroup, assignTabToGroup, type BrowserData } from './src/core/browserData';
import { isBlockedTracker, shouldAllowNavigation } from './src/core/contentBlocking';

const ROOT = FileSystem.documentDirectory ?? '';
const SESSION_FILE = ROOT + 'session.json';
const DATA_FILE = ROOT + 'browser-data.json';
type TabAction = (s: T.TabsState) => T.TabsState;
type PanelSection = 'Bookmarks' | 'History' | 'Downloads' | 'Settings' | 'Permissions' | 'Passwords';

export default function App() {
  const dark = useColorScheme() === 'dark';
  const c = dark ? { bg: '#0b0d14', bar: '#161a26', fg: '#e8ecff', accent: '#7c5cff' }
                 : { bg: '#f4f5fb', bar: '#ffffff', fg: '#10131f', accent: '#5a3df0' };
  const [tabs, dispatchTabs] = useReducer((s: T.TabsState, a: TabAction) => a(s), T.initialTabs());
  const [media, dispatchMedia] = useReducer(mediaReducer, {});
  const [data, setData] = useState<BrowserData>(emptyBrowserData());
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelSection | null>(null);
  const [tabsVisible, setTabsVisible] = useState(false);
  const [mediaVisible, setMediaVisible] = useState(false);
  const [findVisible, setFindVisible] = useState(false);
  const [findText, setFindText] = useState('');
  const [reader, setReader] = useState<{title:string;text:string;url:string}|null>(null);
  const refs = useRef<Record<string, WebView | null>>({});
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      let session: string | null = null, stored: string | null = null;
      try { session = await FileSystem.readAsStringAsync(SESSION_FILE); } catch {}
      try { stored = await FileSystem.readAsStringAsync(DATA_FILE); } catch {}
      const restored = T.restoreSession(session);
      setData(normalizeBrowserData(stored));
      dispatchTabs(() => restored.tabs.length ? restored : T.openTab(T.initialTabs(), 'https://duckduckgo.com'));
      loaded.current = true;
    })();
    NovaMedia.configureSession(false).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    FileSystem.writeAsStringAsync(SESSION_FILE, T.serializeSession(tabs)).catch(() => {});
  }, [tabs]);
  useEffect(() => {
    if (!loaded.current) return;
    FileSystem.writeAsStringAsync(DATA_FILE, serializeBrowserData(data)).catch(() => {});
  }, [data]);

  useEffect(() => {
    const sub = NovaMedia.onRemoteCommand(({ command, position, interval }) => {
      const id = nowPlayingTab(media);
      if (!id) return;
      const wv = refs.current[id];
      if (!wv) return;
      const cmd = command === 'toggle' ? (media[id]?.state === 'playing' ? 'pause' : 'play') : command;
      wv.injectJavaScript(`window.__novaCmd && window.__novaCmd(${JSON.stringify(cmd)}, ${position ?? interval ?? 'undefined'}); true;`);
    });
    return () => sub.remove();
  }, [media]);
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
    if (r.kind === 'blocked') { setError(r.reason); return; }
    setError(null);
    const url = r.kind === 'url' ? r.url : buildSearchUrl(BUILTIN_ENGINES.find(e => e.id === data.settings.searchEngineId) ?? BUILTIN_ENGINES[2], r.query);
    dispatchTabs(s => T.updateTab(s, active.id, { url }));
  }, [input, active, data.settings.searchEngineId]);

  const onMessage = (tabId: string, isPrivate: boolean) => (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.t === 'media') dispatchMedia({ type: 'update', session: { ...m, tabId } });
      if (m.type === 'reader' && tabs.activeId === tabId) setReader({ title:m.title || 'Reader', text:m.text || '', url:m.url || '' });
    } catch {}
  };
  const navigate = (url: string) => {
    if (!active) return;
    dispatchTabs(st => T.updateTab(st, active.id, { url }));
    setInput(url);
  };
  const openReader = () => {
    if (!active) return;
    refs.current[active.id]?.injectJavaScript(READER_EXTRACT_JS);
  };
  const runFind = (backwards = false) => {
    if (!active || !findText.trim()) return;
    refs.current[active.id]?.injectJavaScript('window.find(' + JSON.stringify(findText) + ', false, ' + String(backwards) + ', true, false, false, false); true;');
  };
  const translate = () => {
    if (!active) return;
    const target = encodeURIComponent(data.settings.translateTarget || 'en');
    navigate('https://translate.google.com/translate?sl=auto&tl=' + target + '&u=' + encodeURIComponent(active.url));
  };
  const bookmark = () => {
    if (!active || active.isPrivate) { Alert.alert('Private tab', 'Bookmarks are disabled in private tabs.'); return; }
    setData(d => addBookmark(d, active.url, active.title));
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.bg }]}>
      <View style={[s.bar, { backgroundColor: c.bar }]}>
        <Pressable accessibilityLabel="Back" onPress={() => active && refs.current[active.id]?.goBack()}><Text style={[s.btn,{color:c.fg}]}>‹</Text></Pressable>
        <Pressable accessibilityLabel="Forward" onPress={() => active && refs.current[active.id]?.goForward()}><Text style={[s.btn,{color:c.fg}]}>›</Text></Pressable>
        <TextInput style={[s.input,{color:c.fg,borderColor:c.accent}]} value={input} onChangeText={setInput} onSubmitEditing={go}
          placeholder="Search or enter address" placeholderTextColor="#888" autoCapitalize="none" autoCorrect={false}
          keyboardType="url" returnKeyType="go" accessibilityLabel="Address bar"/>
        <Pressable accessibilityLabel="Reload" onPress={() => active && refs.current[active.id]?.reload()}><Text style={[s.btn,{color:c.fg}]}>⟳</Text></Pressable>
      </View>
      {error && <Text style={s.err}>{error}</Text>}
      <View style={s.web}>
        {tabs.tabs.map(t => <View key={t.id} style={[StyleSheet.absoluteFill,t.id !== tabs.activeId && s.hidden]}>
          <WebView ref={r=>{refs.current[t.id]=r;}} source={{uri:t.url}}
            allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={data.settings.autoplay !== 'allow'}
            allowsAirPlayForMediaPlayback allowsBackForwardNavigationGestures
            sharedCookiesEnabled={!t.isPrivate} incognito={t.isPrivate}
            injectedJavaScript={MEDIA_OBSERVER_JS} onMessage={onMessage(t.id,t.isPrivate)}
            onNavigationStateChange={n=>{
              dispatchTabs(st=>T.updateTab(st,t.id,{title:n.title||n.url,url:n.url}));
              if (t.id===tabs.activeId) setInput(n.url);
              if (!t.isPrivate) setData(d=>recordVisit(d,n.url,n.title||n.url));
            }}
            onShouldStartLoadWithRequest={req=>{
              if (!shouldAllowNavigation(req.url)) return false;
              if (data.settings.blockTrackers && isBlockedTracker(req.url)) return false;
              return true;
            }}
            onFileDownload={event=>{
              const url=event.nativeEvent.downloadUrl;
              const name=url.split('/').pop()?.split('?')[0] || 'download';
              setData(d=>addDownload(d,url,name));
              Alert.alert('Download detected','NOVA saved this download to its download list. Saving the file to iPhone storage still needs device testing.');
            }}
            onError={e=>setError(e.nativeEvent.description)}
          />
        </View>)}
      </View>
      <View style={[s.bar,{backgroundColor:c.bar}]}>
        <Pressable accessibilityLabel="New tab" onPress={()=>dispatchTabs(st=>T.openTab(st,data.settings.homepage))}><Text style={[s.btn,{color:c.fg}]}>＋</Text></Pressable>
        <Pressable accessibilityLabel="New private tab" onPress={()=>dispatchTabs(st=>T.openTab(st,data.settings.homepage,true))}><Text style={[s.btn,{color:c.fg}]}>🕶</Text></Pressable>
        <Pressable accessibilityLabel="Bookmark page" onPress={bookmark}><Text style={[s.btn,{color:c.fg}]}>☆</Text></Pressable>
        <Pressable accessibilityLabel="Media panel" onPress={()=>setMediaVisible(true)}><Text style={[s.small,{color:c.fg}]}>Media</Text></Pressable>
        <Pressable accessibilityLabel="Reader mode" onPress={openReader}><Text style={[s.small,{color:c.fg}]}>Reader</Text></Pressable>
        <Pressable accessibilityLabel="Find in page" onPress={()=>setFindVisible(true)}><Text style={[s.small,{color:c.fg}]}>Find</Text></Pressable>
        <Pressable accessibilityLabel="Translate page" onPress={translate}><Text style={[s.small,{color:c.fg}]}>Translate</Text></Pressable>
        <Pressable accessibilityLabel="Browser menu" onPress={()=>setPanel('Bookmarks')}><Text style={[s.btn,{color:c.fg}]}>☰</Text></Pressable>
        <Text style={{color:c.fg}}>{tabs.tabs.length}</Text>
        <Pressable accessibilityLabel="Reopen closed tab" onPress={()=>dispatchTabs(T.reopenClosed)}><Text style={[s.btn,{color:c.fg}]}>↺</Text></Pressable>
        <Pressable accessibilityLabel="Close tab" onPress={()=>active&&dispatchTabs(st=>T.closeTab(st,active.id))}><Text style={[s.btn,{color:c.fg}]}>✕</Text></Pressable>
      </View>
      <View style={s.menuRow}>
        <Pressable onPress={()=>setTabsVisible(true)}><Text style={s.menuText}>Tabs</Text></Pressable>
        {(['Bookmarks','History','Downloads','Passwords','Settings','Permissions'] as PanelSection[]).map(name=>
          <Pressable key={name} onPress={()=>setPanel(name)}><Text style={s.menuText}>{name}</Text></Pressable>)}
      </View>
      <BrowserPanel visible={!!panel} section={panel || 'Bookmarks'} data={data} currentUrl={active?.url || ''} onChange={setData} onNavigate={navigate} onClose={()=>setPanel(null)}/>
      <MediaPanel visible={mediaVisible} media={media} onClose={()=>setMediaVisible(false)}
        onAction={(tabId,command)=>{const wv=refs.current[tabId];const value=command==='mute'?!media[tabId]?.muted:undefined;wv?.injectJavaScript('window.__novaCmd && window.__novaCmd(' + JSON.stringify(command) + ', ' + JSON.stringify(value) + '); true;');}}
        onStopAll={()=>{Object.keys(media).forEach(id=>refs.current[id]?.injectJavaScript("window.__novaCmd && window.__novaCmd('pause'); true;"));dispatchMedia({type:'stopAll'});}}
        onSwitchTab={id=>dispatchTabs(st=>T.switchTab(st,id))}/>
      <TabsPanel visible={tabsVisible} tabs={tabs.tabs} activeId={tabs.activeId} groups={data.groups} onClose={()=>setTabsVisible(false)}
        onSwitch={id=>dispatchTabs(st=>T.switchTab(st,id))} onCloseTab={id=>dispatchTabs(st=>T.closeTab(st,id))}
        onDuplicate={id=>dispatchTabs(st=>T.duplicateTab(st,id))} onPin={id=>dispatchTabs(st=>T.togglePin(st,id))}
        onCreateGroup={name=>{const nextData=createGroup(data,name);setData(nextData);const g=nextData.groups[nextData.groups.length-1];if(g&&active){setData(assignTabToGroup(nextData,g.id,active.id));dispatchTabs(st=>T.updateTab(st,active.id,{groupId:g.id}));}}}
        onAssignGroup={(tabId,groupId)=>{if(groupId){setData(d=>assignTabToGroup(d,groupId,tabId));dispatchTabs(st=>T.updateTab(st,tabId,{groupId}));}else{setData(d=>({...d,groups:d.groups.map(g=>({...g,tabIds:g.tabIds.filter(x=>x!==tabId)}))}));dispatchTabs(st=>T.updateTab(st,tabId,{groupId:undefined}));}}}/>
      <Modal visible={findVisible} transparent animationType="fade" onRequestClose={()=>setFindVisible(false)}>
        <View style={s.findShade}><View style={s.findCard}><Text style={s.findTitle}>Find in page</Text><TextInput value={findText} onChangeText={setFindText} placeholder="Find text" autoFocus style={s.findInput} onSubmitEditing={()=>runFind(false)}/>
          <View style={s.findButtons}><Pressable onPress={()=>runFind(true)}><Text style={s.findAction}>Previous</Text></Pressable><Pressable onPress={()=>runFind(false)}><Text style={s.findAction}>Next</Text></Pressable><Pressable onPress={()=>setFindVisible(false)}><Text style={s.findAction}>Done</Text></Pressable></View></View></View>
      </Modal>
      <Modal visible={!!reader} animationType="slide" onRequestClose={()=>setReader(null)}>
        <SafeAreaView style={s.reader}>
          <View style={s.readerHead}><Text style={s.readerTitle}>Reader</Text><Pressable onPress={()=>setReader(null)}><Text style={s.readerClose}>Done</Text></Pressable></View>
          <ScrollView contentContainerStyle={s.readerBody}>
            <Text style={s.readerTitle}>{reader?.title}</Text><Text style={s.readerUrl}>{reader?.url}</Text>
            <Text style={[s.readerText,{fontSize:data.settings.readerFontSize,color:data.settings.readerTheme==='dark'?'#eee':data.settings.readerTheme==='sepia'?'#5b4632':'#222'}]}>{reader?.text}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
const s=StyleSheet.create({
 root:{flex:1},bar:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:7,paddingVertical:8},
 btn:{fontSize:22,paddingHorizontal:4,minWidth:25,textAlign:'center'},small:{fontSize:12,fontWeight:'600',paddingHorizontal:3},
 input:{flex:1,borderWidth:1,borderRadius:14,paddingHorizontal:10,paddingVertical:8,fontSize:14},
 err:{color:'#ff5470',paddingHorizontal:14,paddingVertical:4},web:{flex:1},hidden:{opacity:0,pointerEvents:'none'},
 menuRow:{flexDirection:'row',justifyContent:'space-around',paddingVertical:7,backgroundColor:'#171c2a'},
 menuText:{fontSize:10,color:'#cfc5ff'},reader:{flex:1,backgroundColor:'#f4efe4'},readerHead:{padding:14,flexDirection:'row',justifyContent:'space-between'},
 readerTitle:{fontSize:22,fontWeight:'700',color:'#222'},readerClose:{color:'#654bd8',fontWeight:'700'},readerBody:{padding:22,gap:12},
 readerUrl:{fontSize:11,color:'#777'},readerText:{lineHeight:28},
 findShade:{flex:1,backgroundColor:'#0008',justifyContent:'center',padding:20},findCard:{backgroundColor:'#fff',borderRadius:16,padding:18,gap:14},findTitle:{fontSize:18,fontWeight:'700',color:'#222'},findInput:{backgroundColor:'#eee',padding:12,borderRadius:8,color:'#111'},findButtons:{flexDirection:'row',justifyContent:'space-between'},findAction:{color:'#5a3df0',fontWeight:'700'}
});
