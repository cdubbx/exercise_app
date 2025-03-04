import {
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import {HStack, Stack, Text} from '@react-native-material/core';
import LinearGradient from 'react-native-linear-gradient';
import {useFetchedPlanedWorkouts, useSetExercise} from '../hooks/exercises';
import Exercise from './ExerciseCard';
import {SavedWorkout, PlannedWorkout} from '../interfaces/interfaces'; // Ensure this path is correct
import PlannedExercise from '../cards/PlannedExercise';

export default function CalendarCard() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const {fetchedExercises, loading} = useFetchedPlanedWorkouts();
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

  useEffect(()=> {
    console.log(exercises);
  }, [exercises])

  const combinedExercises = exercises
    ? [
        ...exercises,
        ...fetchedExercises.filter(
          (ex: any) => !exercises?.some(existing => existing?.exercise?.id === ex?.saved_workout_details?.exercise?.id),
        ),
      ]
    : fetchedExercises;
  const filteredExercises = selectedDay
    ? combinedExercises.filter(
        (workout: PlannedWorkout) =>
          workout.day_of_the_week ===
          daysOfTheWeek[selectedDay as keyof typeof daysOfTheWeek],
      )
    : combinedExercises;

  const selectDay = (day: string) => {
    setSelectedDay(day);
  };

  useEffect(() => {
    console.log(filteredExercises, selectedDay);
  }, [exercises]);

  return (
    <SafeAreaView style={{padding: 10}}>
        <Stack h={900}>
          <HStack spacing={10} p={5} justify="center">
            {Object.keys(daysOfTheWeek).map((day, index) => (
              <TouchableOpacity
                key={index} // Add a key prop
                style={{
                  backgroundColor:
                    selectedDay === day ? 'black' : 'transparent',
                  height: 30,
                  borderRadius: 5,
                  padding: 5,
                }}
                onPress={() => {
                  selectDay(day);
                }}>
                <Text color={selectedDay === day ? 'white' : 'black'}>{day}</Text>
              </TouchableOpacity>
            ))}
          </HStack>
          {selectedDay ? (
            <FlatList
              data={filteredExercises}
              renderItem={({item}) => 
              <View style={styles.exerciseContainer}>
                 <PlannedExercise item={item} />
              </View>
            }
              keyExtractor={(item: PlannedWorkout, index) => item + index.toString()}
            />
          ) : (
            <Text style={{textAlign:'center'}}>Choose a day to see the plan</Text>
          )}
        </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  exerciseContainer: {
    margin:10
  }
})