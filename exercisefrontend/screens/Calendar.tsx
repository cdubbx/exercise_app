import {openTab} from '../services/navigation';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import {HStack, Stack, Text} from '@react-native-material/core';
import LinearGradient from 'react-native-linear-gradient';
import {
  useDeleteWorkout,
  useFetchedPlanedWorkouts,
  useSetExercise,
} from '../hooks/exercises';
import Exercise from './ExerciseCard';
import {SavedWorkout, PlannedWorkout} from '../interfaces/interfaces'; // Ensure this path is correct
import PlannedExercise from '../cards/PlannedExercise';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {NavigationProp, useFocusEffect} from '@react-navigation/native';
import {CalendarParamList} from '../interfaces/screentypes';
import {useWalkThrough} from '../utils/TutorialSystemService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CalendarScreenProps {
  navigation: NavigationProp<CalendarParamList, 'Calendar'>;
}
const CalendarCard: React.FC<CalendarScreenProps> = ({navigation}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const {loading, fetchPlannedWorkouts} = useFetchedPlanedWorkouts(); // Ensure refetch is available
  const [localExercises, setLocalExercises] = useState<any[]>();
  const [fetchedExercises, setFetchedExercises] = useState<any[]>();
  const tour = useWalkThrough();
  const {exercises} = useSetExercise();
  const daysOfTheWeek = {
    Mon: 'Monday',
    Tues: 'Tuesday',
    Wed: 'Wednesday',
    Thurs: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };

  const {deletePlannedWorkout} = useDeleteWorkout();
  const insets = useSafeAreaInsets()
  const flattenedExercises = fetchedExercises?.map(
    (exercise: any) => exercise.saved_workout_details,
  );

  const [fetchError, setFetchError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    setFetchError('');
    fetchPlannedWorkouts().then(data => { if (active) setFetchedExercises(data); })
      .catch(error => { if (active) setFetchError(error.message); });
    return () => { active = false; };
  }, [fetchPlannedWorkouts]));
  useEffect(() => {
    setLocalExercises((fetchedExercises ?? []).filter(workout => workout.day_of_the_week === daysOfTheWeek[selectedDay as keyof typeof daysOfTheWeek]));
  }, [selectedDay, fetchedExercises]);
  useEffect(() => {
    tour.register({id: 'settings-menu', order: 6, onActivate: () => openTab('Profile1', {screen: 'Profile'})}, true);
  }, [tour.register, navigation]);
  const handleDelete = async (id: number) => {
    try {
      await deletePlannedWorkout(id);
      setFetchedExercises(prev => prev?.filter(exercise => exercise.id !== id));
    } catch (error: any) { Alert.alert('Could not remove workout', error.message); }
  };

  const plusButton = (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('SavedExerciseList', {
          exercises: [flattenedExercises, exercises],
        });
      }}>
      <AntDesign name="pluscircle" size={26} />
    </TouchableOpacity>
  );
  return (
    <View style={{padding: 10, marginTop: Math.max(insets.top, 60)}}>
      <Stack>
        <HStack style={styles.plusButtonContainer}>
          {tour.wrap('plus-button', plusButton, {
            order: 5,
            placement: 'bottom',
            topAdjustment:20,
            content: (
              <Text>Press the plus button to access the saved workouts</Text>
            ),
            showChildInTooltip: false,
          })}
        </HStack>
        <HStack spacing={10} p={5} justify="center">
          {Object.keys(daysOfTheWeek).map((day, index) => (
            <TouchableOpacity
              key={index} // Add a key prop
              style={{
                backgroundColor:
                  selectedDay === day ? '#222222ff' : 'transparent',
                height: 30,
                borderRadius: 5,
                padding: 5,
                shadowColor: selectedDay === day ? '#faf4f4ff' : '#fdfbfbff',
                shadowRadius: selectedDay === day ? 6 : 0,
                shadowOffset:
                  selectedDay === day
                    ? {width: 0, height: 4}
                    : {width: 0, height: 0},
                elevation: 6,
              }}
              onPress={() => setSelectedDay(day)}>
              <Text color={selectedDay === day ? 'white' : 'black'}>{day}</Text>
            </TouchableOpacity>
          ))}
        </HStack>
        {fetchError ? <Text>{fetchError}</Text> : null}
        {loading ? <ActivityIndicator /> : null}
        {selectedDay ? (
          <FlatList
            data={localExercises}
            ListEmptyComponent={<Text>No workouts planned for this day.</Text>}
            renderItem={({item}) => (
              <TouchableOpacity
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
                }}
                style={styles.exerciseContainer}>
                <PlannedExercise item={item} />
              </TouchableOpacity>
            )}
            keyExtractor={(item: PlannedWorkout, index) =>
              String(item.id)
            }
          />
        ) : (
          <Text style={{textAlign: 'center'}}>
            Choose a day to see the plan
          </Text>
        )}
      </Stack>
    </View>
  );
};

const styles = StyleSheet.create({
  exerciseContainer: {
    margin: 10,
  },
  plusButtonContainer: {
    marginBottom: 20,
    justifyContent: 'flex-end',
    marginRight: 10,
  },
});

export default CalendarCard;
