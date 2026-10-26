import {
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Exercise from './ExerciseCard';
import {SavedWorkout} from '../interfaces/interfaces';
import LinearGradient from 'react-native-linear-gradient';

import {HStack, Stack} from '@react-native-material/core';
import {ProfileStackParamList} from '../interfaces/screentypes';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import FetchedExercise from '../cards/FetchedExercise';
import {
  useDeleteWorkout,
  useFetchedSavedWorkOuts,
  useUploadWorkOuts,
} from '../hooks/exercises';
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

  const {fetchedExercises, error: savedError} = useFetchedSavedWorkOuts();

  const [isCustom, setCustom] = useState<boolean>(false);
  const [localExercises, setLocalExercises] = useState<any[]>();
  const {userWorkouts, error: uploadError} = useUploadWorkOuts();
  const {deleteSavedWorkout, deleteUserSavedWorkout} = useDeleteWorkout();
  const [selected, setSelected] = useState({
    exercises: true,
    customExercises: false,
  });

  const [removedIds, setRemovedIds] = useState<string[]>([]);
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
  const selectedExercises = (isCustom ? userWorkouts : fetchedExercises).filter(item => !removedIds.includes(`${isCustom}:${item.id}`));
  const flattenedExercises = selectedExercises?.flat().filter(Boolean);

  const handleDelete = async (id: any) => {
    try {
      if (isCustom) await deleteUserSavedWorkout(id); else await deleteSavedWorkout(id);
      setRemovedIds(prev => [...prev, `${isCustom}:${id}`]);
    } catch (error: any) { Alert.alert('Could not remove workout', error.message); }
  };

  return (
    <SafeAreaView>
      <FlatList
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={{marginLeft: 10}}
              onPress={() => {
                navigation.goBack();
              }}>
              <Ionicons
                style={{alignSelf: 'flex-start'}}
                name="arrow-back-circle"
                size={26}
              />
            </TouchableOpacity>
            <Text
              style={{textAlign: 'center', marginBottom: 20, fontSize: 18, color:"black"}}
              >
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
                numberOfLines={1}
                  style={[styles.tabLabel, {color: selected.customExercises ? 'white' : 'black', }]}>
                  Your Exercises
                </Text>
              </TouchableOpacity>
            </HStack>
          </View>
        }
        ListEmptyComponent={<Text style={{padding: 16}}>{savedError || uploadError || 'No saved workouts yet.'}</Text>}
        data={flattenedExercises}
        renderItem={({item}): any => (
          <TouchableOpacity
            style={{marginLeft: 10}}
            onPress={() => {
              navigation.navigate('SavedExercises', {
                exercise: item.exercise || item,
              });
            }}
            onLongPress={() => {
              if (item.id)
                Alert.alert(
                  'Delete Workout',
                  'Are you sure you want to delete this workout?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Delete',
                      onPress: () => {
                        if (item.id) handleDelete(item?.id);
                      },
                      style: 'destructive',
                    },
                  ],
                );
            }}>
            <FetchedExercise item={item} />
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) =>
          item?.id ? item.id.toString() + index : `fallback-key-${index}`
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabButton1: {
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius: 1,
    flex:1
    
  },
  tabButton2: {
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius: 1,
    flex:1
  },
  tabButtonContainer: {
    justifyContent: 'space-evenly',
    width: '100%',
  },
   tabLabel: {
    flexShrink: 1,           // allow the text to shrink to stay on one line
    flexWrap: 'nowrap',      // avoid wrapping
    textAlign: 'center',
  },
});
export default SavedWorkOuts;
