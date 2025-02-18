import {
  View,
  SafeAreaView,
  Touchable,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  TextInput,
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
import {
  useFetchedSavedWorkOuts,
  useReport,
  useSetExercise,
} from '../hooks/exercises';
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
import {MenuView, MenuComponentRef} from '@react-native-menu/menu';

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
  const [isMenuVisible, setMenuVisible] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const {reportUser} = useReport();

  const streak = 5;

  const handleReportUser = async (reportReason:any) => {
    console.log(reportReason);
    try {
      const reportObj = {
        report_type: 'user',
        reported_id: user.id,
        report_text: reportReason,
      };

      if (reportObj.report_text) {
        const message = await reportUser(reportObj);
        Alert.alert(
          'Success',
          `You have successfully reported ${user.username}`,
        );
      }
    } catch (error) {
      Alert.alert('An error has occurred.');
    }
  };

  const joinDate = formatDate(user?.date_joined, 'full');
  const handleMenuAction = (actionId: string) => {
    switch (actionId) {
      case 'report':
        Alert.alert(
          'Report User',
          'Are you sure you want to report this user?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Report',
              onPress: async () => {
                // setModalVisible(true);
                Alert.prompt(
                  'Report User',
                  'Please provide a reason for reporting this user:',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Submit',
                      onPress: (reason) => {
                        if (reason) {
                          handleReportUser(reason); // ✅ Save input to state
                        }
                      },
                      style: 'destructive',
                    },
                  ],
                  'plain-text'
                );
              },
              style: 'destructive',
            },
          ],
          {cancelable: true},
        );
        break;
      default:
        Alert.alert('Unknown action selected');
    }
  };

  const newSocket = new WebSocket(
    `ws://exerciseplus-a70aea8e1a80.herokuapp.com/ws/spotify/${user.username}/`,
  );

  useEffect(() => {
    newSocket.onopen = () => {
      console.log('Connected to WebSocket');
    };
    
    newSocket.onmessage = event => {
      const data = JSON.parse(event.data);
      // console.log('Received song update:', data);
      if (data) {
        setShowPlaying(true);
        setTrack(data);
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
          {Platform.OS === 'ios' && (
            <MenuView
              actions={[
                {
                  id: 'report',
                  title: 'Report User',
                  image: Platform.select({
                    ios: 'exclamationmark.bubble',
                  }),
                  imageColor: '#000000',
                },
              ]}
              onPressAction={event =>
                handleMenuAction(event.nativeEvent.event)
              }>
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(true);
                }}>
                <Entypo name="dots-three-vertical" size={15} color={'black'} />
              </TouchableOpacity>
            </MenuView>
          )}
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
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report User</Text>
            <TextInput
              placeholder="Enter reason for report..."
              value={reportReason}
              onChangeText={setReportReason}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                color="gray"
              />
              <Button
                title="Submit"
                onPress={() => {
                  if (reportReason.trim() !== '') {
                    setModalVisible(false);
                  } else {
                    Alert.alert('Error', 'Please provide a reason.');
                  }
                }}
                color="red"
              />
            </View>
          </View>
        </View>
      </Modal>
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
  headerStack: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    // backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: 'gray',
    padding: 8,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default OtherUserScreen;
