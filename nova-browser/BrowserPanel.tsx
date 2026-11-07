import React, { useState } from 'react';
import { Modal, ScrollView, View, Text, Pressable, TextInput, Switch, StyleSheet } from 'react-native';
import type { BrowserData, Bookmark } from './src/core/browserData';
import { removeBookmark, clearHistory, updateSettings } from './src/core/browserData';

type Props = {
  visible: boolean; section: string; data: BrowserData;
  onChange: (next: BrowserData) => void; onNavigate: (url: string) => void;
  onClose: () => void;
};
const sections = ['Bookmarks', 'History', 'Downloads', 'Settings', 'Permissions'];
export default function BrowserPanel({ visible, section, data, onChange, onNavigate, onClose }: Props) {
  const [filter, setFilter] = useState('');
  const [home, setHome] = useState(data.settings.homepage);
  const title = sections.includes(section) ? section : 'NOVA';
  const action = (label: string, fn: () => void) => <Pressable key={label} style={p.action} onPress={fn}><Text style={p.actionText}>{label}</Text></Pressable>;
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={p.root}>
      <View style={p.header}><Text style={p.heading}>{title}</Text>{action('Done', onClose)}</View>
      <ScrollView contentContainerStyle={p.content}>
        {section === 'Bookmarks' && <>
          <TextInput value={filter} onChangeText={setFilter} placeholder="Filter bookmarks" style={p.input}/>
          {data.bookmarks.filter(x => (x.title + x.url).toLowerCase().includes(filter.toLowerCase())).map((b: Bookmark) =>
            <View key={b.id} style={p.item}><Pressable style={{flex:1}} onPress={() => { onNavigate(b.url); onClose(); }}><Text style={p.itemTitle}>{b.title}</Text><Text style={p.sub}>{b.url}</Text></Pressable>{action('Delete', () => onChange(removeBookmark(data,b.id)))}</View>)}
          {!data.bookmarks.length && <Text style={p.sub}>No bookmarks yet. Use ☆ in the browser toolbar to save a page.</Text>}
        </>}
        {section === 'History' && <>
          {action('Clear all history', () => onChange(clearHistory(data)))}
          {data.history.map(h => <Pressable key={h.id} style={p.item} onPress={() => {onNavigate(h.url);onClose();}}><View><Text style={p.itemTitle}>{h.title}</Text><Text style={p.sub}>{h.url}</Text><Text style={p.sub}>{new Date(h.visitedAt).toLocaleString()}</Text></View></Pressable>)}
          {!data.history.length && <Text style={p.sub}>No browsing history saved.</Text>}
        </>}
        {section === 'Downloads' && <>
          <Text style={p.sub}>Download records are shown here. iOS WebView download handling and file export still require device validation.</Text>
          {data.downloads.map(d => <View key={d.id} style={p.item}><View><Text style={p.itemTitle}>{d.filename}</Text><Text style={p.sub}>{d.status} · {d.url}</Text></View></View>)}
          {!data.downloads.length && <Text style={p.sub}>No downloads yet.</Text>}
        </>}
        {section === 'Settings' && <>
          <Text style={p.label}>Homepage</Text><TextInput value={home} onChangeText={setHome} autoCapitalize="none" style={p.input}/>
          {action('Save homepage', () => onChange(updateSettings(data,{homepage:home})))}
          <Setting label="Save browsing history" value={data.settings.saveHistory} onChange={v=>onChange(updateSettings(data,{saveHistory:v}))}/>
          <Setting label="Block popups" value={data.settings.blockPopups} onChange={v=>onChange(updateSettings(data,{blockPopups:v}))}/>
          <Setting label="Block known trackers" value={data.settings.blockTrackers} onChange={v=>onChange(updateSettings(data,{blockTrackers:v}))}/>
          <Setting label="Do Not Track header" value={data.settings.doNotTrack} onChange={v=>onChange(updateSettings(data,{doNotTrack:v}))}/>
          <Setting label="Clear data on exit" value={data.settings.clearOnExit} onChange={v=>onChange(updateSettings(data,{clearOnExit:v}))}/>
          <Text style={p.label}>Autoplay</Text>
          {(['allow','user-gesture','block'] as const).map(v=>action((data.settings.autoplay===v?'✓ ':'')+({allow:'Allow autoplay', 'user-gesture':'Require user gesture', block:'Block autoplay'}[v]),()=>onChange(updateSettings(data,{autoplay:v}))))}
          <Text style={p.label}>Reader appearance</Text>
          {(['light','sepia','dark'] as const).map(v=>action((data.settings.readerTheme===v?'✓ ':'')+v,()=>onChange(updateSettings(data,{readerTheme:v}))))}
        </>}
        {section === 'Permissions' && <>
          <Text style={p.sub}>Per-site camera, microphone and location choices are stored by origin. WebView permission prompts remain controlled by iOS and the website's own request flow.</Text>
          {data.permissions.map(x=><View key={x.origin+x.kind} style={p.item}><View><Text style={p.itemTitle}>{x.kind} · {x.decision}</Text><Text style={p.sub}>{x.origin}</Text></View></View>)}
          {!data.permissions.length && <Text style={p.sub}>No site permissions have been saved.</Text>}
        </>}
      </ScrollView>
    </View>
  </Modal>;
}
function Setting({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void}) {
  return <View style={p.setting}><Text style={p.itemTitle}>{label}</Text><Switch value={value} onValueChange={onChange}/></View>;
}
const p=StyleSheet.create({
 root:{flex:1,backgroundColor:'#10131f',paddingTop:42},header:{paddingHorizontal:18,paddingVertical:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 heading:{fontSize:23,fontWeight:'700',color:'#f5f6ff'},content:{padding:16,gap:10},action:{backgroundColor:'#252a3b',padding:12,borderRadius:12,alignSelf:'flex-start'},
 actionText:{color:'#cfc5ff',fontWeight:'600'},input:{backgroundColor:'#202638',color:'#fff',padding:12,borderRadius:10},item:{padding:12,backgroundColor:'#1a2030',borderRadius:12,flexDirection:'row',alignItems:'center',gap:8},
 itemTitle:{color:'#f5f6ff',fontSize:15,fontWeight:'600'},sub:{color:'#aab2c8',fontSize:12,marginTop:4},label:{color:'#cfc5ff',fontWeight:'700',marginTop:8},setting:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:12,backgroundColor:'#1a2030',borderRadius:12}
});
