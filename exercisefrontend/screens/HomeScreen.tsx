import {openTab} from '../services/navigation';
import {
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useAuth, useLogout, useUserContext} from '../hooks/auth';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import Tooltip from 'react-native-walkthrough-tooltip';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {useExercises} from '../hooks/exercises';
import {Avatar, Box, HStack, Text, VStack} from '@react-native-material/core';
import ExerciseCard from '../cards/ExerciseCard';
import {ExploreStackParamList} from '../interfaces/screentypes';
import BodyPartExercise from '../cards/BodyPartExerciseCard';
import {useWalkThrough} from '../utils/TutorialSystemService';

type HomeStackParamList = {
  Home: undefined;
  BodyPart: {bodyParts: string};
  Register: undefined;
};

type Props = NativeStackScreenProps<ExploreStackParamList, 'ExplorePage'>;

export default function HomeScreen({navigation}: Props): React.JSX.Element {
  const {user} = useUserContext();
  const armImage = require('../assets/AdobeStock_261117493.jpeg');
  const chestImage = require('../assets/AdobeStock_476125371.jpeg');
  const legImage = require('../assets/AdobeStock_310385765.jpeg');
  const abImage = require('../assets/AdobeStock_274012804.jpeg');
  const backImage = require('../assets/AdobeStock_402679815.jpeg');

  const imageCard = {
    bicep: {
      name: 'Biceps',
      img_url: armImage,
      bodyParts: 'biceps',
    },

    chest: {
      name: 'Chest',
      img_url: chestImage,
      bodyParts: 'chest',
    },
    legs: {
      name: 'Legs',
      img_url: legImage,
      bodyParts: 'legs',
    },
    abs: {
      name: 'Abs',
      img_url: abImage,
      bodyParts: 'abdominals',
    },

    back: {
      name: 'Back',
      img_url: backImage,
      bodyParts: 'back',
    },
  };

  const bicepStepCardConfig = {
    id: 'bicep-step',
    placement:"top",
    showChildInToolTip: true,
    topAdjustment: 0
  }

  const [search, setSearch] = useState('');
  const {loading, searchExercises} = useExercises(); // <-- add searchResults
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [tip, setTip] = useState<boolean>(false);
  const [tip2, setTip2] = useState<boolean>(true);
  const navigationExercise = useRef<any>(null);

  const tour = useWalkThrough();

  useFocusEffect(useCallback(() => { if (!tour.isRunning) tour.start(); }, [tour.start, tour.isRunning]));

  useEffect(() => {
    tour.register({id: 'search-bar', order: 1, onActivate: () => openTab('Home1', {screen: 'ExplorePage'})}, true);
    tour.register({id: 'bicep-step', order: 2, onActivate: () => openTab('Home1', {screen: 'ExplorePage'})}, true);
    tour.register(
      {
        id: 'individual-bicep',
        order: 3,
        onActivate: () => {
          openTab('Home1', {screen: 'BodyPart', params: {bodyParts: 'biceps'}});
        },
      },
      true,
    );
  }, [navigation, tour]);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    let active = true;
    setSearchError('');
    setSearchResults([]);
    if (search.trim().length < 3) { setSearchLoading(false); return; }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try { const results = await searchExercises(search.trim()); if (active) setSearchResults(results); }
      catch (error: any) { if (active) setSearchError(error.message); }
      finally { if (active) setSearchLoading(false); }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [search]);

  const searchBar = (
          <View style={styles.searchBarHighlight}>
            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search exercises..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#888"
              />
            </View>
          </View>
          );

  return (
    //@ts-ignore
    <SafeAreaView
      //@ts-ignore
      style={{
        display: 'flex',
        justifyContent: 'center',
        direction: 'row',
        padding: 10,
      }}>
      <ScrollView style={{paddingHorizontal: 10}}>
        {/* Search Bar */}

        <HStack justify="end" items="center" m={10} mb={-3} mr={10}>
          <TouchableOpacity>
            <Entypo name="dots-three-vertical" size={18} color={'black'} />
          </TouchableOpacity>
        </HStack>
        {

          tour.wrap('search-bar', searchBar, {
            order: 1,
            placement: 'bottom',
            showChildInTooltip: true,
            content: <Text>This is the search bar</Text>
          })
        }

        
        {/* Show search results if searching, else show default cards */}
        {search.trim().length >= 3
          ? <>{searchLoading ? <Text>Searching...</Text> : searchError ? <Text>{searchError}</Text> : searchResults.length === 0 ? <Text>No exercises found.</Text> : null}{searchResults.map((exercise: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={{marginBottom: 10}}
                onPress={() => {
                  navigation.navigate('ExerciseCard', {item: exercise});
                }}>
                <BodyPartExercise item={exercise} />
              </TouchableOpacity>
            ))
          }</> : Object.entries(imageCard).map(([key, card], index) => {
              const cardContent = (
                <TouchableOpacity
                  key={key}
                  activeOpacity={1}
                  style={{marginBottom: 10}}
                  onPress={() => {
                    navigation.navigate('BodyPart', {
                      bodyParts: card.bodyParts,
                    });
                    if (key === 'bicep') tour.next();
                  }}>
                  <HStack style={styles.exerciseCardContainerContainer}>
                    <View style={styles.exerciseCardContainer}>
                      <Text style={styles.exerciseName}>{card.name}</Text>
                      <Image
                        source={card.img_url}
                        style={styles.exerciseImage}
                      />
                      <HStack style={styles.categoryStack}>
                        <Box style={styles.exerciseCard}>
                          <Text style={styles.exerciseCategory}>Strength</Text>
                        </Box>
                        <Box style={styles.exerciseCard}>
                          <Text style={styles.exerciseCategory}>
                            Power Lifting
                          </Text>
                        </Box>
                        <Box style={styles.exerciseCard}>
                          <Text style={styles.exerciseCategory}>
                            Stretching
                          </Text>
                        </Box>
                      </HStack>
                    </View>
                  </HStack>
                </TouchableOpacity>
              );
              return index === 0 ? (
                // <Tooltip
                //   key={key}
                //   isVisible={tip2}
                //   placement="top"
                //   onClose={() => setTip2(false)}
                //   content={<Text>Tap a body part</Text>}>
                //   {cardContent}
                // </Tooltip>

                tour.wrap('bicep-step', cardContent, {
                  order: 2,
                  placement: "bottom",
                  showChildInTooltip: true, // avoids your misalignment overlay issue
                  closeOnChildInteraction:true,
                  content: (
                    <Text>Tap a body part</Text>
                  )
                })

                
              ) : (
                <React.Fragment key={key}>{cardContent}</React.Fragment>
              );
            })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  exerciseName: {
    top: 15,
    left: 15,
    color: 'white',
    position: 'absolute',
    zIndex: 1,
    fontWeight: 'bold',
    fontSize: 18,
  },
  exerciseCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  exerciseCard: {
    borderWidth: 0.3,
    borderColor: '#9A9B9B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  exerciseImage: {
    width: '100%',
    height: 198,
    borderRadius: 10,
    padding: 10,
  },
  exerciseCardContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  exerciseCardContainerContainer: {
    borderRadius: 10,
    height: 200,
    padding: 10,
  },
  welcomeUserText: {
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'black',
  },
  categoryStack: {
    position: 'absolute',
    bottom: -50,
    padding: 10,
    gap: 10,
    justifyContent: 'center',
  },
  headerStack: {
    margin: 13,
    marginBottom: 20,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  searchBarContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  searchBarHighlight: {
    width: '100%',
    paddingHorizontal: 16,
  },
  searchBar: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#848383ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: 'black',
  },
});
