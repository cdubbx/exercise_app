import {
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Exercise from './ExerciseCard';
import {SavedWorkout} from '../interfaces/interfaces';
import LinearGradient from 'react-native-linear-gradient';

import {HStack, Stack, Text} from '@react-native-material/core';
import {ProfileStackParamList} from '../interfaces/screentypes';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import FetchedExercise from '../cards/FetchedExercise';
import {useUploadWorkOuts} from '../hooks/exercises';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface SavedWorkoutsScreenProps {
  navigation: NavigationProp<ProfileStackParamList, 'SavedExerciseList'>;
  route: RouteProp<ProfileStackParamList, 'SavedExerciseList'>;
}

const SavedWorkOuts: React.FC<SavedWorkoutsScreenProps> = ({
  route,
  navigation,
}) => {
  const {exercises} = route.params ?? []; // Provide a default value if params is undefined
  const [isCustom, setCustom] = useState<boolean>(false);
  const {userWorkouts} = useUploadWorkOuts();
  const [selected, setSelected] = useState({
    exercises: true,
    customExercises: false,
  });

  const toggleCustom = (workoutType: 'custom' | 'regular') => {
    switch (workoutType) {
      case 'custom':
        setCustom(true);
        setSelected(prev => ({
          customExercises: true,
          exercises: false,
        }));
        break;
      case 'regular':
        setCustom(false);
        setSelected({
          exercises: true,
          customExercises: false,
        });
        break;
      default:
        console.log('No workoutType was selected');
        break;
    }
  };
  const selectedExercises = isCustom ? userWorkouts : exercises;
  return (
    <SafeAreaView>
      <FlatList
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={{marginLeft:10}}
              onPress={() => {
                navigation.goBack();
              }}>
              <Ionicons
                style={{alignSelf: 'flex-start'}}
                name="arrow-back-circle"
                size={26}
              />
            </TouchableOpacity>
            <Text style={{textAlign: 'center', marginBottom: 20, fontSize:18}} color="Black">
              Saved Workouts
            </Text>
            <HStack style={styles.tabButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton1,
                  ,
                  {
                    backgroundColor: selected.exercises
                      ? 'black'
                      : 'transparent',
                  },
                ]}
                onPress={() => {
                  toggleCustom('regular');
                }}>
                <Text
                  style={{
                    textAlign: 'left',
                    color: selected.exercises ? 'white' : 'black',
                  }}>
                  Exercises
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton2,
                  {
                    backgroundColor: selected.customExercises
                      ? 'black'
                      : 'transparent',
                  },
                ]}
                onPress={() => {
                  toggleCustom('custom');
                }}>
                <Text
                  style={{color: selected.customExercises ? 'white' : 'black'}}>
                  Custom Exercises
                </Text>
              </TouchableOpacity>
            </HStack>
          </View>
        }
        data={selectedExercises}
        renderItem={({item}): any => (
          <TouchableOpacity
            style={{marginLeft: 10}}
            onPress={() => {
              navigation.navigate('SavedExercises', {
                exercise: item.exercise ?? item,
              });
            }}>
            <FetchedExercise item={item} />
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id.toString()} // Ensure each item has a unique id
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabButton1: {
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius:1,

  },
  tabButton2: {
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius:1,
  },
  tabButtonContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
});
export default SavedWorkOuts;
