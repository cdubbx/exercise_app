import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {getImageUrl} from '../utils/utils';
import {Exercise} from '../interfaces/interfaces';

export default function BodyPartExercise({item}: {item: Exercise}) {
  const image = Array.isArray(item.img_url) ? item.img_url[0] : item.img_url;
  return <View style={styles.row}>
    {image ? <Image source={{uri: getImageUrl(image)}} resizeMode="cover" style={styles.image} /> : <View style={[styles.image, styles.placeholder]} />}
    <View style={styles.details}><Text numberOfLines={2} style={styles.name}>{item.name}</Text>{!!item.category && <Text numberOfLines={1} style={styles.category}>{item.category}</Text>}</View>
    <Text style={styles.chevron}>›</Text>
  </View>;
}
const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  image: {width: 48, height: 48, borderRadius: 8}, placeholder: {backgroundColor: '#eee'},
  details: {flex: 1, gap: 4}, name: {fontSize: 14, fontWeight: '600', color: 'black'},
  category: {fontSize: 12, color: '#555'}, chevron: {fontSize: 26, color: '#777'},
});
