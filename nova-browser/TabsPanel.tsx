import React, { useState } from 'react';
import { Modal, ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import type { Tab } from './src/core/tabs';
import type { TabGroup } from './src/core/browserData';

type Props = {
  visible:boolean; tabs:Tab[]; activeId:string|null; groups:TabGroup[];
  onClose:()=>void; onSwitch:(id:string)=>void; onCloseTab:(id:string)=>void;
  onDuplicate:(id:string)=>void; onPin:(id:string)=>void;
  onCreateGroup:(name:string)=>void; onAssignGroup:(tabId:string,groupId?:string)=>void;
};
export default function TabsPanel(props:Props) {
  const [name,setName]=useState('');
  return <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose}>
    <View style={s.root}>
      <View style={s.head}><Text style={s.title}>Tabs · {props.tabs.length}</Text><Pressable onPress={props.onClose}><Text style={s.action}>Done</Text></Pressable></View>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.section}>Tab groups</Text>
        <View style={s.row}><TextInput value={name} onChangeText={setName} placeholder="New group name" placeholderTextColor="#8992aa" style={s.input}/><Pressable onPress={()=>{props.onCreateGroup(name);setName('');}} style={s.actionBox}><Text style={s.action}>Create</Text></Pressable></View>
        {props.groups.map(g=><Text key={g.id} style={s.group}>{g.name} · {g.tabIds.length} tabs</Text>)}
        <Text style={s.section}>Open tabs</Text>
        {props.tabs.map(t=><View key={t.id} style={[s.card,t.id===props.activeId&&s.selected]}>
          <Pressable style={{flex:1}} onPress={()=>{props.onSwitch(t.id);props.onClose();}}>
            <Text style={s.tabTitle}>{t.pinned?'📌 ':''}{t.isPrivate?'Private · ':''}{t.title||'Untitled'}</Text>
            <Text numberOfLines={1} style={s.url}>{t.url}</Text>
          </Pressable>
          <Pressable onPress={()=>props.onDuplicate(t.id)}><Text style={s.action}>Duplicate</Text></Pressable>
          <Pressable onPress={()=>props.onPin(t.id)}><Text style={s.action}>{t.pinned?'Unpin':'Pin'}</Text></Pressable>
          <Pressable onPress={()=>props.onCloseTab(t.id)}><Text style={s.action}>×</Text></Pressable>
          {props.groups.length>0&&<View style={s.groupRow}>
            {props.groups.map(g=><Pressable key={g.id} onPress={()=>props.onAssignGroup(t.id,g.id)}><Text style={s.groupAction}>{t.groupId===g.id?'✓ ':''}{g.name}</Text></Pressable>)}
            {t.groupId&&<Pressable onPress={()=>props.onAssignGroup(t.id,undefined)}><Text style={s.groupAction}>Remove group</Text></Pressable>}
          </View>}
        </View>)}
        {!props.tabs.length&&<Text style={s.url}>No open tabs.</Text>}
      </ScrollView>
    </View>
  </Modal>;
}
const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#10131f',paddingTop:42},head:{padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 title:{fontSize:23,fontWeight:'700',color:'#fff'},body:{padding:16,gap:12},section:{color:'#cfc5ff',fontWeight:'700',fontSize:16,marginTop:8},
 row:{flexDirection:'row',gap:8},input:{flex:1,backgroundColor:'#202638',padding:12,borderRadius:10,color:'#fff'},
 actionBox:{backgroundColor:'#30334a',padding:12,borderRadius:10},action:{color:'#cfc5ff',fontWeight:'600'},
 group:{color:'#d9dcef',padding:8,backgroundColor:'#1b2232',borderRadius:8},card:{padding:12,backgroundColor:'#1b2232',borderRadius:12,gap:10},
 selected:{borderWidth:1,borderColor:'#8c73ff'},tabTitle:{color:'#fff',fontWeight:'700'},url:{color:'#9ca7bf',fontSize:11},
 groupRow:{flexDirection:'row',flexWrap:'wrap',gap:12},groupAction:{color:'#b9aaff',fontSize:12}
});
