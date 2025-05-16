import {
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useAuth, useLogout, useUserContext} from '../hooks/auth';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';


import {useNavigation} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {useExercises} from '../hooks/exercises';
import {Avatar, Box, HStack, Text, VStack} from '@react-native-material/core';
import ExerciseCard from '../cards/ExerciseCard';
import {ExploreStackParamList} from '../interfaces/screentypes';
import BodyPartExercise from '../cards/BodyPartExerciseCard';

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
      bodyParts: 'chest',
    },
  };

  const [search, setSearch] = useState('');
  const {loading, searchExercises} = useExercises(); // <-- add searchResults
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const handleSearch = async () => {
      if (search.length >= 3) {
        const fetchedSearchedExercises = await searchExercises(search);
        setSearchResults(fetchedSearchedExercises);
      } else if (search.length === 0) {
        await searchExercises('');
      }
    };
    handleSearch();
  }, [search]);

  return (
    //@ts-ignore
    <SafeAreaView
      //@ts-ignore
      style={{display: 'flex', justifyContent: 'center', direction: 'row', padding: 10}}>
      <ScrollView style={{paddingHorizontal:10}}>
        {/* Search Bar */}

        <HStack justify="end" items="center" m={10} mb={-3} mr={10}>
          <TouchableOpacity>
            <Entypo name="dots-three-vertical" size={18} color={'black'} />
          </TouchableOpacity>
        </HStack>


        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search exercises..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#888"
          />
        </View>

        {/* Show search results if searching, else show default cards */}
        {search.length >= 3 && searchResults.length > 0
          ? searchResults.map((exercise: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={{marginBottom: 10}}
                onPress={() => {
                  navigation.navigate('ExerciseCard', {item: exercise});
                }}>
                <BodyPartExercise item={exercise} />
              </TouchableOpacity>
            ))
          : Object.entries(imageCard).map(([key, card]) => (
              <TouchableOpacity
                key={key}
                activeOpacity={1}
                style={{marginBottom: 10}}
                onPress={() => {
                  navigation.navigate('BodyPart', {
                    bodyParts: card.bodyParts,
                  });
                }}>
                <HStack style={styles.exerciseCardContainerContainer}>
                  <View style={styles.exerciseCardContainer}>
                    <Text style={styles.exerciseName}>{card.name}</Text>
                    <Image source={card.img_url} style={styles.exerciseImage} />
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
                        <Text style={styles.exerciseCategory}>Stretching</Text>
                      </Box>
                    </HStack>
                  </View>
                </HStack>
              </TouchableOpacity>
            ))}
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
    marginBottom: 8,
  },
  searchBar: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: 'black',
  },
});
