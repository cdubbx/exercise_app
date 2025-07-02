import {View, SafeAreaView, Image} from 'react-native';
import {Box, HStack, Stack, Text} from '@react-native-material/core';
import React, {useEffect} from 'react';
import {Exercise} from '../interfaces/interfaces'; // Ensure this path is correct

interface PlannedExerciseProps {
  item: Exercise;
}

export default function PlannedExercise({item}: any) {
  const exercise = item?.saved_workout_details?.exercise ?? item?.exercise;


  return (
    <SafeAreaView>
     <HStack mb={10} spacing={20} items="center">
            <Image
              source={{
                uri:
                  Array.isArray(exercise?.img_url) && exercise?.img_url.length > 0
                    ? exercise?.img_url[0]
                    : 'fallback_image_url_here',
              }}
              style={{height: 60, width: 60, borderRadius: 10}}
            />
            <Stack spacing={3}>
              <Text style={{fontSize: 13, color: 'black', fontWeight: 'bold'}}>
                {exercise?.name}
              </Text>
              <Text style={{fontSize: 11, color: 'black', fontWeight: 'bold'}}>
                {exercise?.category.charAt(0).toUpperCase() + exercise?.category.slice(1)}
              </Text>
              <Text style={{fontSize: 11, color: 'black', fontWeight: 'bold'}}>
                {item?.reps}
              </Text>
            </Stack>
          </HStack>
    </SafeAreaView>
  );
}
