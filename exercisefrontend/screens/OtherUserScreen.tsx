import {
  View,
  SafeAreaView,
  Touchable,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Button, HStack, Stack, Text} from '@react-native-material/core';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import {
  useLogout,
  useSpotify,
  useSpotifyContext,
  useUserContext,
} from '../hooks/auth';
import {useFetchedSavedWorkOuts, useSetExercise} from '../hooks/exercises';
import Exercise from './ExerciseCard';
import {
  Exercise as ExerciseInterface,
  SavedWorkout,
  ExerciseCardProps,
} from '../interfaces/interfaces';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Avatar} from '../components/Avatar';
import {formatDate} from '../utils/utils';
import {AddWorkOuts} from '../components/AddWorkOuts';
import {
  ExploreStackParamList,
  ProfileStackParamList,
} from '../interfaces/screentypes';
import LottieView from 'lottie-react-native';
import {SPOTIFY_CLIENTID} from '@env';
import {SpotifySong} from '../cards/SpotifySong';
import {Song} from '../interfaces/types';
import {NavigationProp, RouteProp} from '@react-navigation/native';

interface OtherUserScreenProps {
  navigation: NavigationProp<ExploreStackParamList, 'OtherUser'>;
  route: RouteProp<ExploreStackParamList, 'OtherUser'>;
}

const OtherUserScreen: React.FC<OtherUserScreenProps> = ({
  navigation,
  route,
}) => {
  const {user} = route.params;
  const [showPlaying, setShowPlaying] = useState<boolean>(false);
  const [track, setTrack] = useState<Song | undefined | null>();
  const [socket, setSocket] = useState<WebSocket>();

  const streak = 5;

  const joinDate = formatDate(user?.date_joined, 'full');

  const newSocket = new WebSocket(
    `ws://192.168.0.8/ws/spotify/${user.username}/`,
  );

  useEffect(() => {
    newSocket.onopen = () => {
      console.log('Connected to WebSocket');
    };
    newSocket.onmessage = event => {
      const data = JSON.parse(event.data);
      console.log('Received song update:', data);
      if (data.track) {
        setTrack(data.track);
      }
    };
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SafeAreaView>
      <Stack style={styles.container}>
        <HStack style={styles.headerStack}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}>
            <AntDesign name="leftcircle" size={24} color={'black'} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Entypo name="dots-three-vertical" size={15} color={'black'} />
          </TouchableOpacity>
        </HStack>
        <HStack p={20} spacing={20} items="center" justify="end"></HStack>
        <Stack style={styles.profileStack}>
          <HStack style={styles.avatarStack}>
            <Avatar size={undefined} imageUrl={user?.image_url} />
            <Stack>
              <Text color="black" style={styles.avatarText}>
                {user?.username}
              </Text>
              <HStack style={styles.animationStack}>
                {streak > 1 ? (
                  <LottieView
                    source={{
                      uri: 'https://lottie.host/fd464efb-1546-4cc5-8258-7cf9570c0291/MHh8RjVRUk.lottie',
                    }}
                    autoPlay
                    loop
                    style={styles.animation}
                  />
                ) : (
                  <Ionicons name="flame-outline" size={20} />
                )}

                <Text>Streak</Text>
              </HStack>
              <HStack style={styles.infoStack}>
                <TouchableOpacity>
                  <Text style={{fontSize: 12}}>Friends</Text>
                  <Text>5</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={{fontSize: 12}}>Exercises Completed</Text>
                  <Text style={{textAlign: 'center'}}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text></Text>
                </TouchableOpacity>
              </HStack>
            </Stack>
          </HStack>
        </Stack>
        <HStack style={styles.weightStack}>
          <Stack>
            <Text style={styles.weightText}>Current Weight</Text>
            <Text style={styles.weightText}>265</Text>
          </Stack>

          <Stack>
            <Text style={styles.weightText}>Goal Weight</Text>
            <Text style={styles.weightText}>235</Text>
          </Stack>
        </HStack>
        {showPlaying && <SpotifySong song={track} />}
      </Stack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'gray',
    // textAlign:'center',
    marginTop: 5,
  },
  avatarStack: {
    alignItems: 'flex-start',
    gap: 15,
  },
  profileStack: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  infoStack: {
    marginTop: 20,
    justifyContent: 'space-between',
    gap: 30,
  },
  animation: {
    width: 40,
    height: 40,
  },
  animationStack: {
    alignItems: 'center',
  },
  weightStack: {
    paddingLeft: 10,
    gap: 30,
    marginTop: 20,
  },
  weightText: {
    fontSize: 13,
  },
  headerStack:{
    justifyContent:'space-between',
    alignItems:'center',
    marginHorizontal:10,
  }
});

export default OtherUserScreen;
