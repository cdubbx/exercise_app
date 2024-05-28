import {
  View,
  SafeAreaView,
  Touchable,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect } from 'react';
import {Button, HStack, Stack, Text} from '@react-native-material/core';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import {useLogout} from '../hooks/auth';
import {useFetchedSavedWorkOuts} from '../hooks/exercises';
import Exercise from './ExerciseCard';
import { Exercise as ExerciseInterface, SavedWorkout, ExerciseCardProps } from '../interfaces';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type ProfileStackParamList = {
  Home: undefined;
  BodyPart: { bodyParts: string };
  ExerciseCard: { item: string };
  SavedWorkouts: { exercises: any[] };
  Profile: undefined;
};


type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>

export default function ProfileScreen({navigation}:Props): React.JSX.Element {
  const {logout} = useLogout();
  const {exercises, loading} = useFetchedSavedWorkOuts();

  const individualExercise = exercises[0] 

  if(loading){
    return <ActivityIndicator />
  }


  if (!exercises.length) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text color="white">No exercises found</Text>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView>
      <LinearGradient
        colors={['rgba(67,67,101,1)', 'rgba(32,31,66,1)', 'rgba(2,0,36,1)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={{minHeight: 900}}>
        <Stack>
          <HStack p={20} spacing={20} items="center" justify="between">
            <AntDesign name="leftcircle" size={24} color={'white'} />
            <Text
              color="white"
              style={{fontSize: 26, fontFamily: 'Roboto-Medium'}}>
              Name
            </Text>
            <Entypo name="dots-three-vertical" size={15} color={'white'} />'
          </HStack>
          // mini calendar widget
          <HStack></HStack>
          <TouchableOpacity
            onPress={() => {
              logout();
            }}>
            <Text color="white">Logout</Text>
          </TouchableOpacity>
          {/* <FlatList
            data={exercises}
            renderItem={({ item }) => <Exercise item={item} />}
            keyExtractor={(item:SavedWorkout) => item.id.toString()} // Ensure each item has a unique id
          /> */}
          <TouchableOpacity onPress={()=> {
            navigation.navigate('SavedWorkouts', {
              exercises:exercises
            })
          }}>
             <Exercise item={individualExercise} />
          </TouchableOpacity>
         
        </Stack>
      </LinearGradient>
    </SafeAreaView>
  );
}
