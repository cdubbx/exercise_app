import { View, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { HStack, Stack, Text } from '@react-native-material/core';
import LinearGradient from 'react-native-linear-gradient';
import { useFetchedPlanedWorkouts } from '../hooks/exercises';
import Exercise from './ExerciseCard';
import { SavedWorkout, PlannedWorkout } from '../interfaces'; // Ensure this path is correct
import PlannedExercise from '../cards/PlannedExercise';

export default function CalendarCard() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { exercises, loading } = useFetchedPlanedWorkouts();
  const daysOfTheWeek = {
    Mon: 'Monday',
    Tues: 'Tuesday',
    Wed: 'Wednesday',
    Thurs: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday'
  };

  const filteredExercises = selectedDay
    ? exercises.filter((workout: PlannedWorkout) => 
        workout.day_of_the_week === daysOfTheWeek[selectedDay as keyof typeof daysOfTheWeek])
    : exercises;

  const selectDay = (day: string) => {
    setSelectedDay(day);
  };

  // useEffect(() => {
  //   console.log(filteredExercises, selectedDay);
  // }, [filteredExercises]);

  return (
    <SafeAreaView style={{ padding: 10 }}>
      <LinearGradient
        colors={['rgba(67,67,101,1)', 'rgba(32,31,66,1)', 'rgba(2,0,36,1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Stack h = {900}>
            <HStack spacing={10} p={5} justify="center">
          {Object.keys(daysOfTheWeek).map((day, index) => (
            <TouchableOpacity
              key={index} // Add a key prop
              style={{
                backgroundColor: selectedDay === day ? '#648498' : 'transparent',
                height: 30,
                borderRadius: 5,
                padding: 5,
              }}
              onPress={() => {
                selectDay(day);
              }}
            >
              <Text color="white">{day}</Text>
            </TouchableOpacity>
          ))}
        </HStack>
        {selectedDay ? ( <FlatList
          data={filteredExercises}
          renderItem={({ item }) => <PlannedExercise item={item} />}
          keyExtractor={(item: PlannedWorkout) => item.id.toString()}
        />) : (
          <Text>Choose a day to see the plan</Text>
        )
      
      
      }
        </Stack>
      
       
      </LinearGradient>
    </SafeAreaView>
  );
}
