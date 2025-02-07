import { View, SafeAreaView, FlatList } from 'react-native'
import React from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Exercise from './ExerciseCard';
import { SavedWorkout } from '../interfaces';
import LinearGradient from 'react-native-linear-gradient';

import { Stack, Text } from '@react-native-material/core';

type ProfileStackParamList = {
    Home: undefined;
    BodyPart: { bodyParts: string };
    ExerciseCard: { item: string };
    SavedWorkouts: { exercises: any[] };
    Profile: undefined;
  };
  

type Props = NativeStackScreenProps<ProfileStackParamList, 'SavedWorkouts'>
export default function SavedWorkOuts({route}:Props): React.JSX.Element {

    const exercises = route.params?.exercises ?? []; // Provide a default value if params is undefined
    return (
    <SafeAreaView>
         <LinearGradient
        colors={['rgba(67,67,101,1)', 'rgba(32,31,66,1)', 'rgba(2,0,36,1)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
       >
     
         

           
            <FlatList
            style = {{padding:20}}
            ListHeaderComponent={ <Text  style = {{textAlign:'center', marginBottom:20}} color='white'>
            Saved Workouts
        </Text>}
            data={exercises}
            renderItem={({ item }) => <Exercise item={item} />}
            keyExtractor={(item:SavedWorkout) => item.id.toString()} // Ensure each item has a unique id
          />

               </LinearGradient>
    </SafeAreaView>
  )
}