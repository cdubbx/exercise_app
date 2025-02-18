import {View, Text, SafeAreaView, Image, StyleSheet} from 'react-native';
import {Box, HStack, Text as MatText, Stack} from '@react-native-material/core';
import React, {useEffect} from 'react';

export default function FetchedExercise({item}: any) {
  const exercise = Array.isArray(item) ? item[0].exercise : item?.exercise || item?.saved_workout_details?.exercise || item;
  useEffect(() => {
      
  }, [])
  
  return (
    <View style={styles.container}>
      <HStack spacing={20} items="center">
        <Image
          source={{
            uri:
              Array.isArray(exercise?.img_url) && exercise?.img_url.length > 0
                ? exercise?.img_url[0]
                : 'fall-back.png',
          }}
          style={{height: 60, width: 60, borderRadius: 10}}
        />
        <Stack spacing={3}>
          <Text style={{fontSize: 13, color: 'black', fontWeight: 'bold'}}>
            {exercise?.name}
          </Text>
          <Text style={{fontSize: 11, color: 'black', fontWeight: 'bold'}}>
            {exercise?.category}
          </Text>
        </Stack>
      </HStack>
    </View>
  );
}


const styles = StyleSheet.create({
    container: {
        marginTop:10
    }
})