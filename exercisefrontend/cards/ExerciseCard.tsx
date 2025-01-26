import {
  View,
  Image,
  StyleProp,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {Box, HStack, Stack, Text} from '@react-native-material/core';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useSaveWorkOuts, useSetExercise} from '../hooks/exercises';

type HomeStackParamList = {
  Home: undefined;
  BodyPart: {bodyParts: string};
  ExerciseCard: {item: string};
};

type Props = NativeStackScreenProps<HomeStackParamList, 'BodyPart'>;

// Note the correction in the prop name from 'exericse' to 'exercise' and the typing syntax
export default function ExerciseCard({route, navigation}: any) {
  const [reps, setReps] = useState(0);
  const {addExercises} = useSetExercise();
  const {saveWorkouts} = useSaveWorkOuts();

  const exerciseItems = route.params?.item;


  function incrementRep() {
    setReps(prevState => prevState + 1);
  }

  function decrementRep() {
    setReps(prevState => prevState - 1);

    if (reps <= 0) {
      setReps(0);
    }
  }
  const onSaveWorkout = async () => {
    if(exerciseItems !== undefined){
      addExercises(exerciseItems);
    }
    saveWorkouts(exerciseItems);
  };

  return (
    //@ts-ignore
    <SafeAreaView>
      <LinearGradient
        colors={['rgba(67,67,101,1)', 'rgba(32,31,66,1)', 'rgba(2,0,36,1)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={{minHeight: 900}}>
        <ScrollView>
          <Stack spacing={10}>
            <HStack p={20} spacing={20} items="center" justify="between">
              <AntDesign name="leftcircle" size={20} color={'white'} />
              <Text
                color="white"
                style={{fontSize: 20, fontFamily: 'Roboto-Medium'}}>
                Exercises
              </Text>
              <Box mr={-10}>
                <Entypo name="dots-three-vertical" size={15} color={'white'} />
              </Box>
              '
            </HStack>
            //@ts-ignore
            <Image
              source={{
                uri:
                  Array.isArray(exerciseItems?.img_url) &&
                  exerciseItems?.img_url.length > 0
                    ? exerciseItems?.img_url[0]
                    : 'fallback_image_url_here',
              }}
              style={{height: 200, width: 'auto'}}
            />
            //@ts-ignore
            <HStack justify="end">
              {/* <HStack  spacing={10} p={10}>
                // adding the incrementer
                <TouchableOpacity
                  onPress={() => {
                    decrementRep();
                  }}>
                  <AntDesign name="minussquareo" size={20} color={'white'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    incrementRep();
                  }}>
                  <AntDesign name="plussquare" size={20} color={'white'} />
                </TouchableOpacity>
              </HStack> */}

              <TouchableOpacity
                onPress={() => {
                  onSaveWorkout();
                }}>
                <Box
                  border={1}
                  borderColor={'#494949'}
                  p={5}
                  style={{borderRadius: 20}}>
                  <Text color="white">Save</Text>
                </Box>
              </TouchableOpacity>
            </HStack>
            <Stack p={10} spacing={10}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: 'Roboto-Medium',
                }}>
                Name: {exerciseItems?.name}
              </Text>

              <Text
                numberOfLines={6}
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: 'Roboto-Medium',
                }}>
                Category: {exerciseItems?.category}
              </Text>
              <Text
                numberOfLines={6}
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: 'Roboto-Medium',
                }}>
                Equipment: {exerciseItems?.equipment}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: 'Roboto-Medium',
                }}>
                Instructions:
              </Text>
              <Text
                numberOfLines={6}
                style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: 'Roboto-Medium',
                }}>
                {exerciseItems?.instructions}
              </Text>

              <HStack>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: 'white',
                    fontFamily: 'Roboto-Medium',
                  }}>
                  Rep Count: {reps}{' '}
                </Text>
              </HStack>
            </Stack>
          </Stack>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
