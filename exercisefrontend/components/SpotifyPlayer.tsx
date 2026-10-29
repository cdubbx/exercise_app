import React from 'react';
import Entypo from 'react-native-vector-icons/Entypo';
import {ActivityIndicator, Alert, Image, Linking, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {SpotifyAction, useSpotify} from '../context/NowPlayContextSpotify';

export default function SpotifyPlayer({settings = false, modal = false}: {settings?: boolean; modal?: boolean}) {
  const spotify = useSpotify();
  if (!spotify || (!settings && !modal && (!spotify.connected || !spotify.configured || !spotify.showPlayer))) { return null; }
  const {player, busy, error, connected, configured} = spotify;
  const openSpotify = async () => {
    try { await Linking.openURL(player?.track?.url || 'https://open.spotify.com'); }
    catch { Alert.alert('Could not open Spotify', 'Open the Spotify app and start music there.'); }
  };
  const control = (action: SpotifyAction, label: string, disabled: boolean) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={busy || !configured || disabled} onPress={() => { void spotify.control(action); }} style={[styles.control, (busy || !configured || disabled) && styles.disabled]}><Text style={styles.controlText}>{label}</Text></TouchableOpacity>;
  return <View style={styles.card}>
    <View style={styles.heading}><View style={styles.brandRow}><Entypo name="spotify" size={20} color="#1DB954" /><Text style={styles.brand}>Spotify</Text></View>{busy && <ActivityIndicator size="small" color="black" />}{settings && connected && <Switch accessibilityLabel="Show Spotify player on Home" value={spotify.showPlayer} onValueChange={() => { void spotify.togglePlayer(); }} />}</View>
    {!connected ? <><Text style={styles.note}>{configured ? 'Control music playing in Spotify. Premium is required.' : 'Spotify connection is not available on this server yet.'}</Text><TouchableOpacity accessibilityRole="button" disabled={busy || !configured} onPress={() => { void spotify.connect(); }} style={[styles.primary, !configured && styles.disabled]}><Text style={styles.primaryText}>Connect Spotify</Text></TouchableOpacity></> : <>
      {player?.track ? <View style={styles.track}>{player.track.image && <Image source={{uri: player.track.image}} style={styles.art} />}<View style={styles.details}><Text numberOfLines={2} style={styles.name}>{player.track.name}</Text><Text numberOfLines={1} style={styles.note}>{player.track.artists}</Text></View></View> : <Text style={styles.note}>Open Spotify and start music on a device.</Text>}
      <View style={styles.controls}>{control('previous', 'Previous', !player?.device_active || !!player.disallows.skipping_prev)}{control(player?.is_playing ? 'pause' : 'play', player?.is_playing ? 'Pause' : 'Play', !player?.device_active || !!player.disallows[player?.is_playing ? 'pausing' : 'resuming'])}{control('next', 'Next', !player?.device_active || !!player.disallows.skipping_next)}</View>
      <TouchableOpacity accessibilityRole="link" onPress={openSpotify}><Text style={styles.link}>Open in Spotify ↗</Text></TouchableOpacity>
      {settings && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => Alert.alert('Disconnect Spotify?', 'This removes the connection from Exercise App. You can also revoke access in your Spotify account.', [{text: 'Cancel', style: 'cancel'}, {text: 'Disconnect', onPress: () => { void spotify.disconnect(); }}])}><Text style={styles.link}>Disconnect Spotify</Text></TouchableOpacity>}
    </>}
    {!!error && <View accessibilityLiveRegion="polite" style={styles.error}><Text style={styles.note}>{error}</Text><TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => { void spotify.refresh(); }}><Text style={styles.link}>Try again</Text></TouchableOpacity></View>}
  </View>;
}
const styles = StyleSheet.create({
  card: {backgroundColor: 'white', borderRadius: 12, padding: 12, gap: 12, marginTop: 16},
  heading: {flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between'},
  brandRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  brand: {fontSize: 15, fontWeight: '600', color: 'black'}, note: {fontSize: 12, color: '#555', lineHeight: 18},
  track: {flexDirection: 'row', alignItems: 'center', gap: 10}, art: {width: 48, height: 48}, details: {flex: 1, gap: 4}, name: {fontSize: 14, fontWeight: '600', color: 'black'},
  controls: {flexDirection: 'row', gap: 8}, control: {flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center'}, controlText: {fontSize: 13, color: 'black', fontWeight: '600'},
  primary: {backgroundColor: 'black', minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}, primaryText: {fontSize: 13, color: 'white', fontWeight: '600'},
  disabled: {opacity: 0.4}, link: {color: 'black', fontSize: 13, fontWeight: '600', paddingVertical: 8}, error: {gap: 4},
});
