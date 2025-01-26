import {
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMuscleExercise} from '../hooks/exercises';
import {Box, HStack, Stack, VStack, Text} from '@react-native-material/core';
import Exercise from './ExerciseCard';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import ExerciseCard from '../cards/ExerciseCard';
import BodyPartExercise from '../cards/BodyPartExerciseCard';

type HomeStackParamList = {
  Home: undefined;
  BodyPart: {bodyParts: string};
  ExerciseCard: {item: string};
};

type Props = NativeStackScreenProps<HomeStackParamList, 'BodyPart'>;

export default function BodyPart({route, navigation}: Props) {
  const quadImg = require('../assets/AdobeStock_442546175.jpeg');
  const gluteImg = require('../assets/AdobeStock_379171391.jpeg');
  const hamstringImg = require('../assets/AdobeStock_287421213.jpeg');

  const parts = route.params.bodyParts;
  const {loading, bodyExercises} = useMuscleExercise(parts);
  const [hasExercises, setHasExercises] = useState(false);
  // console.log(parts);

  // console.log(bodyExercises);

  useEffect(
    () => () => {
      console.log(
        'These are the exercise fetched from the backend',
        bodyExercises,
      );
    },
    [parts],
  );

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    //@ts-ignore

    <SafeAreaView style={{height: 900}}>
      <LinearGradient
        colors={['rgba(67,67,101,1)', 'rgba(32,31,66,1)', 'rgba(2,0,36,1)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={{minHeight: 900}}>
        {bodyExercises.length > 0 ? (
          <FlatList
            data={bodyExercises}
            keyExtractor={(item: any) => item.id}
            //  ListHeaderComponent={

            //      <HStack>
            //          <Text>{item.primaryMuscles}</Text>
            //      </HStack>
            //  }

            renderItem={(
              {item}, // Destructure item here
            ) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ExerciseCard', {
                    item: item,
                  });
                }}>
                <BodyPartExercise item={item} />
              </TouchableOpacity>
            )}
          />
        ) : (
          <ScrollView>
            <Stack spacing={10}>
              <HStack p={20} spacing={20} items="center" justify="between">
                <AntDesign name="leftcircle" size={24} color={'white'} />
                <Text
                  color="white"
                  style={{fontSize: 26, fontFamily: 'Roboto-Medium'}}>
                  Exercises
                </Text>
                <Entypo name="dots-three-vertical" size={15} color={'white'} />'
              </HStack>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('BodyPart', {
                    bodyParts: 'glutes',
                  });
                }}>
                <HStack p={10} style={{borderRadius: 10, height: 200}}>
                  //@ts-ignore
                  <View
                    style={{width: '100%', height: 150, position: 'relative'}}>
                    <Text
                      style={{
                        top: 10,
                        left: 10,
                        color: 'white',
                        position: 'absolute',
                        zIndex: 1,
                        fontWeight: 'bold',
                        fontSize: 18,
                        fontFamily: 'Roboto',
                      }}>
                      Glutes
                    </Text>

                    <Image
                      source={gluteImg}
                      style={{
                        width: '100%',
                        height: 198,
                        borderRadius: 10,
                        padding: 10,
                        opacity: 0.5,
                      }}
                    />

                    <HStack
                      spacing={10}
                      p={10}
                      justify="center"
                      style={{position: 'absolute', bottom: -50}}>
                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Strength
                        </Text>
                      </Box>
                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Power Lifting
                        </Text>
                      </Box>

                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Stretching
                        </Text>
                      </Box>
                    </HStack>
                  </View>
                </HStack>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('BodyPart', {
                    bodyParts: 'hamstrings',
                  });
                }}>
                <HStack p={10} style={{borderRadius: 10, height: 200}}>
                  //@ts-ignore
                  <View
                    style={{width: '100%', height: 150, position: 'relative'}}>
                    <Text
                      style={{
                        top: 10,
                        left: 10,
                        color: 'white',
                        position: 'absolute',
                        zIndex: 1,
                        fontWeight: 'bold',
                        fontSize: 18,
                        fontFamily: 'Roboto',
                      }}>
                      Hamstring
                    </Text>

                    <Image
                      source={hamstringImg}
                      style={{
                        width: '100%',
                        height: 198,
                        borderRadius: 10,
                        padding: 10,
                        opacity: 0.5,
                      }}
                    />

                    <HStack
                      spacing={10}
                      p={10}
                      justify="center"
                      style={{position: 'absolute', bottom: -50}}>
                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Strength
                        </Text>
                      </Box>
                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Power Lifting
                        </Text>
                      </Box>

                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Stretching
                        </Text>
                      </Box>
                    </HStack>
                  </View>
                </HStack>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('BodyPart', {
                    bodyParts: 'quadriceps',
                  });
                }}>
                <HStack p={10} style={{borderRadius: 10, height: 900}}>
                  //@ts-ignore
                  <View
                    style={{width: '100%', height: 150, position: 'relative'}}>
                    <Text
                      style={{
                        top: 10,
                        left: 10,
                        color: 'white',
                        position: 'absolute',
                        zIndex: 1,
                        fontWeight: 'bold',
                        fontSize: 18,
                        fontFamily: 'Roboto',
                      }}>
                      Quads
                    </Text>

                    <Image
                      source={quadImg}
                      style={{
                        width: '100%',
                        height: 198,
                        borderRadius: 10,
                        padding: 10,
                        opacity: 0.5,
                      }}
                    />

                    <HStack
                      spacing={10}
                      p={10}
                      justify="center"
                      style={{position: 'absolute', bottom: -50}}>
                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Strength
                        </Text>
                      </Box>
                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Power Lifting
                        </Text>
                      </Box>

                      <Box
                        border={0.3}
                        borderColor={'#9A9B9B'}
                        ph={8}
                        pv={3}
                        style={{borderRadius: 20}}>
                        <Text
                          color="white"
                          style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Roboto',
                          }}>
                          Stretching
                        </Text>
                      </Box>
                    </HStack>
                  </View>
                </HStack>
              </TouchableOpacity>
            </Stack>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}
