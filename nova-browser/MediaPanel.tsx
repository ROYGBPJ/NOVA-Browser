import React from 'react';
import { Modal, ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import type { MediaState } from './src/core/media';

type Props={visible:boolean;media:MediaState;onClose:()=>void;onAction:(tabId:string,command:'play'|'pause'|'mute')=>void;onStopAll:()=>void;onSwitchTab:(tabId:string)=>void};
export default function MediaPanel({visible,media,onClose,onAction,onStopAll,onSwitchTab}:Props){
 const sessions=Object.values(media);
 return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
  <View style={s.root}><View style={s.head}><Text style={s.title}>Media</Text><Pressable onPress={onClose}><Text style={s.action}>Done</Text></Pressable></View>
   <ScrollView contentContainerStyle={s.body}>
    {sessions.map(m=><View key={m.tabId} style={s.card}>
      <Pressable onPress={()=>{onSwitchTab(m.tabId);onClose();}}><Text style={s.track}>{m.title||m.site||'Website audio'}</Text><Text style={s.sub}>{m.artist||m.site} · {m.state}</Text></Pressable>
      <View style={s.controls}>
       <Pressable onPress={()=>onAction(m.tabId,m.state==='playing'?'pause':'play')}><Text style={s.action}>{m.state==='playing'?'Pause':'Play'}</Text></Pressable>
       <Pressable onPress={()=>onAction(m.tabId,'mute')}><Text style={s.action}>{m.muted?'Unmute':'Mute'}</Text></Pressable>
      </View>
    </View>)}
    {!sessions.length&&<Text style={s.sub}>No active or recently reported website media sessions.</Text>}
    {!!sessions.length&&<Pressable style={s.stop} onPress={onStopAll}><Text style={s.action}>Pause all media</Text></Pressable>}
    <Text style={s.note}>Controls are sent to the page's own HTML audio/video player. Some embedded or DRM players do not expose controllable media elements.</Text>
   </ScrollView>
  </View>
 </Modal>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#10131f',paddingTop:42},head:{padding:18,flexDirection:'row',justifyContent:'space-between'},title:{fontSize:23,fontWeight:'700',color:'#fff'},body:{padding:16,gap:12},card:{backgroundColor:'#1c2333',padding:14,borderRadius:12,gap:12},track:{color:'#fff',fontSize:16,fontWeight:'700'},sub:{color:'#aab2c8',fontSize:12,marginTop:5},controls:{flexDirection:'row',gap:24},action:{color:'#cfc5ff',fontWeight:'700'},stop:{backgroundColor:'#30334a',padding:12,borderRadius:10,alignSelf:'flex-start'},note:{color:'#8992aa',fontSize:12,lineHeight:18,marginTop:10}});
