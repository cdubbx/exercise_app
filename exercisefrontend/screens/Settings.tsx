import {StyleSheet, Text, TouchableOpacity, View, Switch} from 'react-native';
import React, {useEffect} from 'react';
import Entypo from 'react-native-vector-icons/Entypo';
import {HStack, Stack} from '@react-native-material/core';
import {useSpotify, useSpotifyContext} from '../hooks/auth';

const Settings = () => {
  const {isPlaying, toggleIsPlaying} = useSpotifyContext();
  const {isLoading, authenticateWithSpotify, fetchNowPlaying, getCurrentSession} = useSpotify()


  useEffect(() => {
    // getCurrentSession()
  }, []);
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={authenticateWithSpotify}>
        <HStack style={styles.spotifyButton}>
          <Entypo name="spotify" color={'green'} size={40} />
          <Stack>
            <Text style={styles.textListen}>Connect to</Text>
            <Text style={styles.spotifyText}>Spotify</Text>
          </Stack>
        </HStack>
      </TouchableOpacity>
      <HStack style={styles.toggleStack}>
        <Text>Show Spotify Now Playing</Text>
        <Switch onValueChange={toggleIsPlaying} value={isPlaying} />
      </HStack>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  spotifyButton: {
    backgroundColor: 'black',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  textListen: {
    color: 'green',
    fontSize: 30,
  },
  spotifyText: {
    color: 'white',
    fontSize: 30,
  },
  toggleStack: {
    alignItems:'center', 
    gap:10
  }
});
