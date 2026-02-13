import {
  View,
  SafeAreaView,
  Touchable,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, even, HStack, Stack, Text} from '@react-native-material/core';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import {
  useLogout,
  useUpdateUser,
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
import {convertToDecimalFeet, formatDate, formatWeight} from '../utils/utils';
import {AddWorkOuts} from '../components/AddWorkOuts';
import {ProfileStackParamList} from '../interfaces/screentypes';
import LottieView from 'lottie-react-native';
// import {SpotifySong} from '../cards/SpotifySong';
import {Song, User} from '../interfaces/types';
import {useFilePicker, useS3Uploader} from '../hooks/social';
import {Picker} from '@react-native-picker/picker';
import BodyPartExercise from '../cards/BodyPartExerciseCard';
import FetchedExercise from '../cards/FetchedExercise';
import {MenuView, MenuComponentRef} from '@react-native-menu/menu';
import { useWalkThrough } from '../utils/TutorialSystemService';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

interface UserData {
  username?: string;
  height?: number | null | string;
  weight?: number | null | string;
  phone_number?: string;
  goal_weight?: string | null | number;
  [key: string]: any;
  img_url?: string;
}

export default function ProfileScreen({navigation}: Props): React.JSX.Element {
  const {logout} = useLogout();
  const {exercises, removeExercise} = useSetExercise(); // this is where exercises are saved in context.
  const {fetchedExercises} = useFetchedSavedWorkOuts(); 
  const [localExercises, setLocalExercises] = useState<ExerciseInterface|any>()
  const [feet, setFeet] = useState<number>(5);
  const [inches, setInches] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const {file, error, pickFile, setFile} = useFilePicker();
  const [showMore, setShowMore] = useState<boolean>(false);
  const {uploadToS3} = useS3Uploader();
  const {user} = useUserContext();
  // const {isPlaying} = useSpotifyContext();
  // const {fetchNowPlaying, getCurrentSession} = useSpotify();
  const [showPlaying, setShowPlaying] = useState<boolean>(false);
  const [isVisble, setIsVisible] = useState<boolean>(false);
  const [showText, setShowText] = useState<string>('Show More');
  const [isMenuVisible, setMenuVisible] = useState<boolean>(false);
  const {updateUser, isLoading} = useUpdateUser();
  const menuAnchorRef = useRef<MenuComponentRef>(null);

  const [userInfo, setUserInfo] = useState<UserData>({
    username: user?.username,
    height: user?.height,
    weight: user?.weight,
    phone_number: user?.phone_number,
    goal_weight: user?.goal_weight,
    image_url: user?.image_url,
  });

  const [track, setTrack] = useState<Song | undefined | null>();
  const streak = 5;

  const showNowPlaying = async (track: any) => {
    if (track) {
      setShowPlaying(true);
    } else {
      setShowPlaying(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (feet !== null && inches !== null) {
        setUserInfo(prev => ({
          ...prev,
          height: convertToDecimalFeet(feet, inches),
        }));
      }
      const message = await updateUser(userInfo);
      Alert.alert(message);
      setIsVisible(false);
    } catch (error) {
      Alert.alert('An error has occurred', `${error}`);
    }
  };

  const handleImageUpload = useCallback(async (file:any) => {
    if (!file) {
      Alert.alert('No file selected');
      return;
    }
    try {
      const url = await uploadToS3(file, 'profile');
      console.log('This is the uploaded url', url);

      if (url) {
        setImageUrl(url);
        setUserInfo((prev => ({
          ...prev, 
          image_url:url
        })))
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Upload failed:', err);
        Alert.alert('Error uploading file', err.message);
      }
    }
  }, [file, uploadToS3]);

  const mergeExercises = () => {
  const normalize = (items: any[] = []) =>
    items.map(ex => (ex?.exercise ? ex.exercise : ex)).filter(Boolean);

  const combined = [...normalize(fetchedExercises), ...normalize(exercises)];
  const uniqueById = new Map(combined.map(ex => [ex?.id, ex]));
  return Array.from(uniqueById.values());
};

  const tour = useWalkThrough()
  const joinDate = formatDate(user?.date_joined, 'full');
  useEffect(() => {
    // const handleShowPlaying = async () => {
    //   const track: Song | undefined | null = await fetchNowPlaying();
    //   await showNowPlaying(track);
    //   setTrack(track);
    // };
    // handleShowPlaying();
    setLocalExercises(mergeExercises());
  }, [exercises, fetchedExercises, track]);

  const onClose = () => {
    setIsVisible(false);
  };

  const handleMenuAction = (actionId: string) => {
    switch (actionId) {
      case 'edit':
        setIsVisible(true);
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'addWorkout':
        navigation.navigate('AddWorkoutScreen');
      default:
        Alert.alert('Unknown action selected');
    }
  };

  const iphoneMenu = (
    <MenuView
              title="Profile Settings"
              actions={[
                {
                  id: 'edit',
                  title: 'Edit Profile',
                  image: Platform.select({
                    ios: 'square.and.pencil',
                  }),
                  imageColor: '#000000',
                },
                {
                  id: 'settings',
                  title: 'Settings',
                  image: Platform.select({
                    ios: 'gearshape',
                  }),
                  imageColor: '#000000',
                },
                {
                  id: 'addWorkout',
                  title: 'Add Workout',
                  image: Platform.select({
                    ios: 'plus',
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
  )

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <Stack>
        <HStack p={20} spacing={20} items="center" justify="end">
          {Platform.OS === 'ios' && (
            tour.wrap('settings-menu', iphoneMenu, {
              showChildInTooltip:true,
              order:6,
              placement:'bottom',
              topAdjustment:20,
              content: <Text>Click here to select the settings menu</Text>
            }) 
          )}
        </HStack>
        <Stack style={styles.profileStack}>
          <HStack style={styles.avatarStack}>
            <Avatar size={undefined} imageUrl={userInfo?.image_url} />
            <Stack>
              <Text color="black" style={styles.avatarText}>
                {userInfo?.username}
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
            <Text style={styles.weightText}>
              {typeof userInfo?.weight === 'string'
                ? formatWeight(parseFloat(userInfo?.weight))
                : userInfo?.weight}
            </Text>
          </Stack>

          <Stack>
            <Text style={styles.weightText}>Goal Weight</Text>
            <Text style={styles.weightText}>
              {typeof userInfo?.goal_weight === 'string'
                ? formatWeight(parseFloat(userInfo?.goal_weight))
                : userInfo?.goal_weight}
            </Text>
          </Stack>
        </HStack>
        {/* {showPlaying && <SpotifySong song={track} />}
        {exercises && (
          <View style={{marginTop: 15}}>
            <AddWorkOuts navigation={navigation} exercises={exercises} />
          </View>
        )} */}
        <Text style={{marginTop: 25}}>Saved Workouts</Text>
        {fetchedExercises &&
          fetchedExercises.length > 0 &&
          fetchedExercises
            .slice(0, showMore ? fetchedExercises.length : 2)
            .map(item => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('SavedExercises', {
                    exercise: item.exercise,
                  });
                }}>
                <View style={{marginTop: 5}}>
                  <FetchedExercise item={item} />
                </View>
              </TouchableOpacity>
            ))}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('SavedExerciseList', {
              exercises: fetchedExercises,
            });
          }}>
          <Text style={{marginTop: 15}}>{'Show More'}</Text>
        </TouchableOpacity>
      </Stack>
      <Modal
        visible={isVisble}
        presentationStyle="pageSheet"
        onRequestClose={() => {
          onClose();
        }}>
        <Stack style={styles.modalContainer}>
          <Text style={styles.modalHeaderText}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.modalProfilePic}
            onPress={async () => {
              const result = await pickFile();
               // Wait for file selection
              if (result) {
                await handleImageUpload(result); // Call handleImageUpload only if a file is selected
              } else {
                Alert.alert('No file selected');
              }
            }}>
            <Avatar size={undefined} imageUrl={file ? file : user?.image_url} />
          </TouchableOpacity>
          <Text style={{marginTop: 20}}>
            Weight:{' '}
            {typeof userInfo?.weight === 'string'
              ? formatWeight(parseFloat(userInfo?.weight))
              : userInfo?.weight}
          </Text>
          <TextInput
            // value={user?.weight}
            placeholder="Enter your weight"
            inputMode="numeric"
            onChangeText={text =>
              setUserInfo(prev => ({
                ...prev,
                weight: text,
              }))
            }
          />

          <Text>
            Goal Weight:{' '}
            {typeof userInfo?.goal_weight === 'string'
              ? formatWeight(parseFloat(userInfo?.goal_weight))
              : userInfo?.goal_weight}
          </Text>
          <TextInput
            // value={user?.weight}
            placeholder="Enter your goal weight"
            inputMode="numeric"
            onChangeText={text =>
              setUserInfo(prev => ({
                ...prev,
                goal_weight: text,
              }))
            }
          />
          <HStack>
            <Text>Height: {userInfo?.height}</Text>

            <Picker
              style={[styles.modalPickerHeight,  { color: "black" }]}
              selectedValue={feet}
              onValueChange={setFeet}>
              {Array.from({length: 8}, (_, i) => i + 3).map(f => (
                <Picker.Item key={f} label={`${f} ft`} value={f} color='black' />
              ))}
            </Picker>
            <Picker
              style={styles.modalPickerHeight}
              selectedValue={inches}
              onValueChange={setInches}>
              {Array.from({length: 12}, (_, i) => i).map(inch => (
                <Picker.Item style={{color:'black'}} key={inch} label={`${inch} in.`} color='black' value={inch} />
              ))}
            </Picker>
            <Picker selectedValue={inches} />
          </HStack>

          <Text>Phone number: {userInfo?.phone_number}</Text>
          <TextInput
            // value={String(user?.phone_number)}
            placeholder="Enter your Phone Number"
            inputMode="numeric"
            onChangeText={text =>
              setUserInfo(prev => ({
                ...prev,
                phone_number: text,
              }))
            }
          />

          <Text>Username: {userInfo?.username}</Text>
          <TextInput
            placeholder="Enter your new username"
            onChangeText={text =>
              setUserInfo(prev => ({
                ...prev,
                username: text,
              }))
            }
          />

          <TouchableOpacity
            style={styles.updateUserButton}
            onPress={() => {
              handleUpdateUser();
            }}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </Stack>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginLeft: 10,
    marginTop: 50,
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

  modalContainer: {
    padding: 20,
    gap: 10,
  },
  modalHeaderText: {
    fontSize: 20,
    textAlign: 'center',
  },
  modalProfilePic: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPickerHeight: {
    width: 120,
  },
  updateUserButton: {
    width: 100,
    padding: 8,
    backgroundColor: 'black',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 40,
  },
  saveButtonText: {
    color:'white'
  }
});
