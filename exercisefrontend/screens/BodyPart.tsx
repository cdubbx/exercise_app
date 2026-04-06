import {
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMuscleExercise} from '../hooks/exercises';
import {Box, HStack, Stack, VStack, Text} from '@react-native-material/core';
import Exercise from './ExerciseCard';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import ExerciseCard from '../cards/ExerciseCard';
import BodyPartExercise from '../cards/BodyPartExerciseCard';
import {HomeStackParamList} from '../interfaces/screentypes';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {Exercise as ExerciseInterface} from '../interfaces/interfaces';
import Tooltip from 'react-native-walkthrough-tooltip';
import {useWalkThrough} from '../utils/TutorialSystemService';

interface Props {
  navigation: NavigationProp<HomeStackParamList, 'BodyPart'>;
  route: RouteProp<HomeStackParamList, 'BodyPart'>;
}

const BodyPart: React.FC<Props> = ({route, navigation}) => {
  const quadImg = require('../assets/AdobeStock_442546175.jpeg');
  const gluteImg = require('../assets/AdobeStock_379171391.jpeg');
  const hamstringImg = require('../assets/AdobeStock_287421213.jpeg');

  const parts = route.params.bodyParts;
  const {loading, bodyExercises, loadMoreExercises, loadingMore} =
    useMuscleExercise(parts);
  const [tip, setTip] = useState<boolean>(true);
  const tour = useWalkThrough();
  const exerciseRef = useRef<any>(null);

  const [hasExercises, setHasExercises] = useState(false);
  const fakeExercises = new Array(50).fill({id: 1, name: 'Fake Exercise'});
  // console.log(parts);

  useEffect(() => {
    tour.register(
      {
        id: 'save-button',
        order: 4,
        showChildInTooltip: false,
        placement: 'bottom',
        onActivate: () => {
          const first = bodyExercises[0];
          exerciseRef?.current?.scrollToIndex({index: 0, animated:true})
           navigation.navigate('ExerciseCard', {
              item: first,
            })
          }
      },
      true,
    );
  }, [tour]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  const renderItem = ({item, index}: ListRenderItemInfo<ExerciseInterface>) => {
    const card = (
      <View collapsable={false}>
        <TouchableOpacity
          style={{marginLeft: 10, width: '100%'}}
          onPress={() => {
            navigation.navigate('ExerciseCard', {
              item: item,
            });
          }}>
          <BodyPartExercise item={item} />
        </TouchableOpacity>
      </View>
    );

    if (index === 3) {
      return tour.wrap(`individual-bicep`, card, {
        order: 3,
        placement: 'bottom',
        showChildInTooltip: false, // avoids your misalignment overlay issue
        content: (
          <Text>
            Tap to see {parts.charAt(0).toUpperCase() + parts.slice(1)}{' '}
            exercises
          </Text>
        ),
        onClose: () => setTip(false),
      });
    }
     return card;
  };

  return (
    <>
      {bodyExercises.length > 0 && (
        <FlatList
          contentContainerStyle={styles.flatListContainer}
          inverted={false}
          data={bodyExercises}
          ref={exerciseRef}
          keyExtractor={(item: any, index) =>
            item.id ? item.id.toString() + index : `index-${index}`
          }
          onEndReachedThreshold={0.5}
          ListFooterComponent={<ActivityIndicator animating />}
          onEndReached={() => {
            console.log('This function is being called');
            loadMoreExercises();
          }}
          ListHeaderComponent={
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}>
                <AntDesign
                  style={styles.goBackButton}
                  name="leftcircle"
                  size={24}
                  color={'black'}
                />
              </TouchableOpacity>
              <Text style={styles.headerTextFlatlist}>
                {parts.charAt(0).toUpperCase() + parts.slice(1)}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}
      {bodyExercises.length === 0 && (
        <SafeAreaView>
          <Stack spacing={10}>
            <HStack p={20} spacing={20} items="center" justify="between">
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}>
                <AntDesign name="leftcircle" size={24} color={'black'} />
              </TouchableOpacity>
              <Text
                color="black"
                style={{fontSize: 26, fontFamily: 'Roboto-Medium'}}>
                Legs
              </Text>
              <Entypo name="dots-three-vertical" size={15} color={'black'} />'
            </HStack>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate('BodyPart', {
                  bodyParts: 'glutes',
                });
              }}>
              <HStack style={styles.exerciseCardContainerContainer}>
                <View style={styles.exerciseCardContainer}>
                  <Text style={styles.exerciseName}>Glutes</Text>
                  <Image source={gluteImg} style={styles.exerciseImage} />
                </View>
              </HStack>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate('BodyPart', {
                  bodyParts: 'hamstrings',
                });
              }}>
              <HStack style={styles.exerciseCardContainerContainer}>
                <View style={styles.exerciseCardContainer}>
                  <Text style={styles.exerciseName}>Hamstring</Text>
                  <Image source={hamstringImg} style={styles.exerciseImage} />
                </View>
              </HStack>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate('BodyPart', {
                  bodyParts: 'quadriceps',
                });
              }}>
              <HStack style={styles.exerciseCardContainerContainer}>
                <View style={styles.exerciseCardContainer}>
                  <Text style={styles.exerciseName}>Quads</Text>
                  <Image source={quadImg} style={styles.exerciseImage} />
                </View>
              </HStack>
            </TouchableOpacity>
          </Stack>
        </SafeAreaView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  goBackButton: {
    marginLeft: 10,
  },
  headerButtons: {
    justifyContent: 'space-between',
    marginBottom: 30,
    width: '100%',
    marginRight: 20,
  },
  exerciseName: {
    top: 15,
    left: 15,
    color: 'gray',
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
    justifyContent: 'center',
  },
  flatListContainer: {
    // marginLeft: 10,
    marginTop: 50,
  },
  headerTextFlatlist: {
    textAlign: 'center',
    fontSize: 20,
  },
});

export default BodyPart;
