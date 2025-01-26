import {Alert, Image, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Song} from '../interfaces/types';
import {HStack, Stack} from '@react-native-material/core';
import Sound from 'react-native-sound';

interface SongProps {
  song: Song | null | undefined;
}

export const SpotifySong: React.FC<SongProps> = ({song}) => {
  const [sound, setSound] = useState<Sound | null>(null);

  // useEffect(() => {
  //     if (song?.preview_url) {
  //       const newSound = new Sound(song.preview_url, null, (error) => {
  //         if (error) {
  //           console.error("❌ Failed to load sound:", error);
  //           return;
  //         }
  //       });
  //       setSound(newSound);
  //     }

  //     return () => {
  //       sound?.release(); // Unload audio when component unmounts
  //     };
  //   }, [song]);

  //   const playPreview = () => {
  //     if (sound) {
  //       sound.play((success) => {
  //         if (!success) console.error("Playback failed");
  //       });
  //     } else {
  //       Alert.alert("No preview available for this track.");
  //     }
  //   };

  return (
    <Stack style={styles.container}>
      <Text style={styles.nowPlayingText}>Now Playing</Text>
      <HStack style={styles.songStack}>
        <Image
          source={{uri: song?.album_image_url}}
          style={styles.albumCover}
        />
        <Stack>
          <Text>{song?.track_name}</Text>
          <Text>{song?.artist_name}</Text>
        </Stack>
      </HStack>
    </Stack>
  );
};

const styles = StyleSheet.create({
  albumCover: {
    borderRadius: 10,
    height: 50,
    width: 50,
  },
  songStack: {
    gap: 10,
    alignItems: 'center',
  },
  nowPlayingText: {
    alignSelf: 'flex-start',
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 16,
  },
  container: {
    gap: 10,
  },
});
