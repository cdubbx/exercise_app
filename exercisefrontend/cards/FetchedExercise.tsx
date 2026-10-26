import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

export default function FetchedExercise({item, showChevron = true}: {item: any; showChevron?: boolean}) {
  const entry = Array.isArray(item) ? item[0] : item;
  const exercise = entry?.exercise || entry?.saved_workout_details?.exercise || entry;
  const image = Array.isArray(exercise?.img_url) ? exercise.img_url[0] : exercise?.img_url;
  return <View style={styles.row}>
    {image ? <Image source={{uri: image, cache: 'default'}} style={styles.image} /> : <View style={[styles.image, styles.placeholder]} />}
    <View style={styles.details}>
      <Text numberOfLines={2} style={styles.name}>{exercise?.name || 'Workout'}</Text>
      {!!exercise?.category && <Text style={styles.category}>{exercise.category}</Text>}
    </View>
    {showChevron && <Text style={styles.chevron}>›</Text>}
  </View>;
}
const styles = StyleSheet.create({
  row: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12},
  image: {width: 48, height: 48, borderRadius: 8},
  placeholder: {backgroundColor: '#eee'},
  details: {flex: 1, gap: 4},
  name: {fontSize: 14, fontWeight: '600', color: 'black'},
  category: {fontSize: 12, color: '#555'},
  chevron: {fontSize: 26, color: '#777'},
});
