import {
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
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

interface CalendarScreenProps {
  navigation: NavigationProp<CalendarParamList, 'Calendar'>;
}
const CalendarCard: React.FC<CalendarScreenProps> = ({navigation}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { loading, fetchPlannedWorkouts } = useFetchedPlanedWorkouts(); // Ensure refetch is available
  const [localExercises, setLocalExercises] = useState<any[]>();
  const [fetchedExercises, setFetchedExercises] = useState<any[]>();
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

  const flattenedExercises = fetchedExercises?.map(
    (exercise: any) => exercise.saved_workout_details,
  );

  const combinedExercises = fetchedExercises;
    useEffect(() => {
      const fetchAndFilterExercises = async () => {
        await handleFetchedExercises();
    
        if (selectedDay) {
          const filtered = fetchedExercises?.filter(
            (workout: any) =>
              workout.day_of_the_week ===
              daysOfTheWeek[selectedDay as keyof typeof daysOfTheWeek]
          );
          setLocalExercises(filtered);
        }
      };
    
      const handleFetchedExercises = async () => {
        const result = await fetchPlannedWorkouts();
        setFetchedExercises(result);
      };
    
      fetchAndFilterExercises();
    }, [selectedDay]);


    const handleDelete = (id: any) => {
      if (id) {
        setLocalExercises((prevExercises) =>
          prevExercises?.filter((exercise: any) => exercise.id !== id)
        );
        deletePlannedWorkout(id);
      }
    };

  return (
    <SafeAreaView style={{padding: 10}}>
      <Stack>
        <HStack style={styles.plusButtonContainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('SavedExerciseList', {
                exercises: [flattenedExercises, exercises],
              });
            }}>
            <AntDesign name="pluscircle" size={26} />
          </TouchableOpacity>
        </HStack>
        <HStack spacing={10} p={5} justify="center">
          {Object.keys(daysOfTheWeek).map((day, index) => (
            <TouchableOpacity
              key={index} // Add a key prop
              style={{
                backgroundColor: selectedDay === day ? 'black' : 'transparent',
                height: 30,
                borderRadius: 5,
                padding: 5,
              }}
              onPress={() => setSelectedDay(day)}>
              <Text color={selectedDay === day ? 'white' : 'black'}>{day}</Text>
            </TouchableOpacity>
          ))}
        </HStack>
        {selectedDay ? (
          <FlatList
            data={localExercises}
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
              item + index.toString()
            }
          />
        ) : (
          <Text style={{textAlign: 'center'}}>
            Choose a day to see the plan
          </Text>
        )}
      </Stack>
    </SafeAreaView>
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
