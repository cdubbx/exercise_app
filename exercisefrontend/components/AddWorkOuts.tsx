import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import BodyPartExercise from '../cards/BodyPartExerciseCard';
import {NavigationProp} from '@react-navigation/native';
import { ProfileStackParamList } from '../interfaces/screentypes';


interface ScreenNavProps {
    navigation: NavigationProp<ProfileStackParamList, 'Profile'>
    exercises: any;
}

export const AddWorkOuts: React.FC<ScreenNavProps> = ({exercises, navigation}) => {
  return (
    <FlatList
      ListHeaderComponent={
        <View style={{marginBottom: 10}}>
          <Text>Recently Add Exercises</Text>
        </View>
      }
      data={exercises}
      keyExtractor={item => item.id}
      renderItem={({item}): any => (
        <TouchableOpacity onPress={() => {
            navigation.navigate('SavedExercises', 
                {exercise:item}
            )
        }}>
          <BodyPartExercise item={item} />
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({});
