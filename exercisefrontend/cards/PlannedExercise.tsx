import { View,  SafeAreaView, Image } from 'react-native';
import { Box, HStack, Stack, Text } from '@react-native-material/core';
import React, { useEffect } from 'react';
import { Exercise } from '../interfaces'; // Ensure this path is correct

interface PlannedExerciseProps {
  item: Exercise;
}

export default function PlannedExercise({ item }:any) {

    const exercise =  item.saved_workout_details.exercise
  useEffect(() => {
    console.log('This is the item that is being passed through as a prop', item);
    console.log('This is the log for the image url', item.saved_workout_details.exercise);
    console.log('This is the log for the name ', item.reps);

    
  }, [item]);

  return (
    <SafeAreaView>
      <HStack justify="between">
        <HStack mb={10} spacing={40} items="center">
          <Image
            source={{
              uri: Array.isArray(exercise.img_url) && exercise.img_url.length > 0
                ? exercise.img_url[0]
                : 'fallback_image_url_here',
            }}
            style={{ height: 100, width: 100, borderRadius: 10 }}
          />
          <Stack spacing={3}>
            <Text style={{ fontSize: 13, color: 'white', fontWeight: 'bold' }}>
            {exercise.name}
            </Text>
            <Text style={{ fontSize: 11, color: 'white', fontWeight: 'bold' }}>
              {exercise.category}
            </Text>
            <Text style = {{fontSize:11}} color='white'>
                {item.reps}
            </Text>
          </Stack>
        </HStack>
      </HStack>
    </SafeAreaView>
  );
}
