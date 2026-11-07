import React, { useEffect, useState } from 'react';
import { Alert, AppState, Modal, ScrollView, View, Text, Pressable, TextInput, Switch, StyleSheet } from 'react-native';
import type { BrowserData, Bookmark, PermissionKind } from './src/core/browserData';
import { removeBookmark, clearHistory, updateSettings, setPermission, permissionFor, originOf } from './src/core/browserData';
import { authenticateVault, readVault, saveLogin, deleteLogin, type SavedLogin } from './src/security/passwordVault';

type Props = {
  visible: boolean; section: string; data: BrowserData; currentUrl: string; isPrivate: boolean;
  onChange: (next: BrowserData) => void; onNavigate: (url: string) => void;
  onClose: () => void;
};
const sections = ['Bookmarks', 'History', 'Downloads', 'Settings', 'Permissions', 'Passwords'];
export default function BrowserPanel({ visible, section, data, currentUrl, isPrivate, onChange, onNavigate, onClose }: Props) {
  const [filter, setFilter] = useState('');
  const [home, setHome] = useState(data.settings.homepage);
  const [unlocked, setUnlocked] = useState(false);
  const [logins, setLogins] = useState<SavedLogin[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') { setUnlocked(false); setLogins([]); setPassword(''); }
    });
    return () => sub.remove();
  }, []);
  const title = sections.includes(section) ? section : 'NOVA';
  const action = (label: string, fn: () => void) => <Pressable key={label} style={p.action} onPress={fn}><Text style={p.actionText}>{label}</Text></Pressable>;
  const unlock = async () => {
    try {
      const ok = await authenticateVault();
      if (!ok) { Alert.alert('Authentication unavailable', 'Set up Touch ID or Face ID on this iPhone before unlocking saved passwords.'); return; }
      setLogins(await readVault()); setUnlocked(true);
    } catch { Alert.alert('Could not unlock', 'iOS authentication did not complete.'); }
  };
  const saveCurrent = async () => {
    const origin = originOf(currentUrl);
    if (!origin || !username.trim() || !password) { Alert.alert('Missing details', 'Enter a username and password on a secure website.'); return; }
    try {
      const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), origin, username: username.trim(), password, createdAt: Date.now() };
      await saveLogin(entry); setLogins(await readVault()); setUsername(''); setPassword('');
      Alert.alert('Saved', 'Login stored in the iPhone Keychain.');
    } catch { Alert.alert('Save failed', 'The iPhone Keychain could not save this login.'); }
  };
  const permissionRow = (kind: PermissionKind) => {
    const value = permissionFor(data, currentUrl, kind);
    return <View key={kind} style={p.item}><View style={{flex:1}}><Text style={p.itemTitle}>{kind}</Text><Text style={p.sub}>Current site: {value}</Text></View>
      {action('Ask',()=>onChange(setPermission(data,originOf(currentUrl),kind,'ask')))}
      {action('Allow',()=>onChange(setPermission(data,originOf(currentUrl),kind,'allow')))}
      {action('Block',()=>onChange(setPermission(data,originOf(currentUrl),kind,'block')))}
    </View>;
  };
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
          <Text style={p.sub}>Download events are listed here. File transfer, progress, saving to Files and share/export still need implementation and iPhone testing.</Text>
          {data.downloads.map(d => <View key={d.id} style={p.item}><View><Text style={p.itemTitle}>{d.filename}</Text><Text style={p.sub}>{d.status} · {d.url}</Text></View></View>)}
          {!data.downloads.length && <Text style={p.sub}>No downloads yet.</Text>}
        </>}
        {section === 'Settings' && <>
          <Text style={p.label}>Homepage</Text><TextInput value={home} onChangeText={setHome} autoCapitalize="none" style={p.input}/>
          {action('Save homepage', () => onChange(updateSettings(data,{homepage:home})))}
          <Setting label="Save browsing history" value={data.settings.saveHistory} onChange={v=>onChange(updateSettings(data,{saveHistory:v}))}/>
          <Setting label="Block popups (preference)" value={data.settings.blockPopups} onChange={v=>onChange(updateSettings(data,{blockPopups:v}))}/>
          <Setting label="Block known trackers" value={data.settings.blockTrackers} onChange={v=>onChange(updateSettings(data,{blockTrackers:v}))}/>
          <Setting label="Do Not Track (preference)" value={data.settings.doNotTrack} onChange={v=>onChange(updateSettings(data,{doNotTrack:v}))}/>
          <Setting label="Clear data on exit (preference)" value={data.settings.clearOnExit} onChange={v=>onChange(updateSettings(data,{clearOnExit:v}))}/>
          <Text style={p.label}>Autoplay</Text>
          {(['allow','user-gesture','block'] as const).map(v=>action((data.settings.autoplay===v?'✓ ':'')+({allow:'Allow autoplay', 'user-gesture':'Require user gesture', block:'Block autoplay'}[v]),()=>onChange(updateSettings(data,{autoplay:v}))))}
          <Text style={p.label}>Reader appearance</Text>
          {(['light','sepia','dark'] as const).map(v=>action((data.settings.readerTheme===v?'✓ ':'')+v,()=>onChange(updateSettings(data,{readerTheme:v}))))}
        </>}
        {section === 'Permissions' && <>
          <Text style={p.sub}>Saved site choices are NOVA preferences. iOS/WebKit permission prompts are not yet intercepted and enforced, so these controls do not override iOS prompts.</Text>
          <Text style={p.label}>{originOf(currentUrl) || 'Open a website to manage permissions'}</Text>
          {permissionRow('camera')}{permissionRow('microphone')}{permissionRow('location')}{permissionRow('notifications')}
          {data.permissions.map(x=><Text key={x.origin+x.kind} style={p.sub}>{x.kind}: {x.decision} — {x.origin}</Text>)}
        </>}
        {section === 'Passwords' && <>
          {!unlocked ? <>{action('Unlock with Touch ID / Face ID',unlock)}<Text style={p.sub}>Saved logins use the iPhone Keychain. Authentication and autofill must be tested on the target iPhone.</Text></> : <>
            {isPrivate ? <Text style={p.sub}>Password saving is disabled in private tabs.</Text> : <><Text style={p.label}>Save login for {originOf(currentUrl) || 'current site'}</Text>
            <TextInput value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" style={p.input}/>
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={p.input}/>
            {action('Save current login',saveCurrent)}</>}
            {logins.map(item=><View key={item.id} style={p.item}><View style={{flex:1}}><Text style={p.itemTitle}>{item.origin}</Text><Text style={p.sub}>{item.username}</Text></View>{action('Delete',async()=>{await deleteLogin(item.id);setLogins(await readVault());})}</View>)}
            {!logins.length && <Text style={p.sub}>No saved logins yet.</Text>}
            {action('Lock password vault',()=>{setUnlocked(false);setLogins([]);setPassword('');})}
          </>}
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
