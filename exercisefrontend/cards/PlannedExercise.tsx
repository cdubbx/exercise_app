import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {PlannedWorkout} from '../interfaces/interfaces';

export default function PlannedExercise({item}: {item: PlannedWorkout}) {
  const exercise = item.saved_workout_details?.exercise ?? item.exercise;
  const image = Array.isArray(exercise?.img_url) ? exercise.img_url[0] : exercise?.img_url;
  return (
    <View style={styles.row}>
      {image ? <Image source={{uri: image}} style={styles.image} /> : <View style={[styles.image, styles.placeholder]}><Text style={styles.placeholderText}>Exercise</Text></View>}
      <View style={styles.details}>
        <Text style={styles.name}>{exercise?.name ?? 'Workout'}</Text>
        {!!exercise?.category && <Text style={styles.category}>{exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}</Text>}
        <Text style={styles.quantities}>{item.sets ?? 1} sets × {item.reps} reps</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14},
  image: {height: 70, width: 70, borderRadius: 10},
  placeholder: {backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center'},
  placeholderText: {fontSize: 11, color: '#555'},
  details: {flex: 1, gap: 5},
  name: {fontSize: 15, color: 'black', fontWeight: '600'},
  category: {fontSize: 12, color: '#555'},
  quantities: {fontSize: 13, fontWeight: '500', color: 'black'},
});
