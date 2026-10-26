import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSaveWorkOuts, useSetExercise} from '../hooks/exercises';
import {HomeStackParamList} from '../interfaces/screentypes';
import {useWalkThrough} from '../utils/TutorialSystemService';
import {openTab} from '../services/navigation';

interface Props {
  navigation: NavigationProp<HomeStackParamList, 'ExerciseCard'>;
  route: RouteProp<HomeStackParamList, 'ExerciseCard'>;
}
const capitalise = (value?: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not specified';

export default function ExerciseCard({route, navigation}: Props) {
  const exercise = route.params?.item;
  const {addExercises} = useSetExercise();
  const {saveWorkouts, loading} = useSaveWorkOuts();
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const tour = useWalkThrough();
  const {register} = tour;
  const insets = useSafeAreaInsets();
  const image = Array.isArray(exercise?.img_url) ? exercise.img_url[0] : exercise?.img_url;
  const rawInstructions = exercise?.instructions;
  const instructions = (Array.isArray(rawInstructions) ? rawInstructions.filter(step => typeof step === 'string').join('\n\n') : typeof rawInstructions === 'string' ? rawInstructions : '').replace(/\.(?!\s|$)/g, '. ');
  useEffect(() => { register({id: 'plus-button', order: 5, onActivate: () => openTab('Calendar')}, true); }, [register]);
  useEffect(() => {
    const current = generation;
    current.current++; setSaved(false); setExpanded(false);
    return () => { current.current++; };
  }, [exercise?.id]);
  const save = async () => {
    if (busy.current || loading || saved || !exercise) { return; }
    busy.current = true;
    const version = generation.current;
    try {
      const result = await saveWorkouts(exercise);
      if (result && version === generation.current) {
        if (result.created !== false) { addExercises(exercise); }
        setSaved(true);
        Alert.alert(result.created === false ? 'Already saved' : 'Workout saved', result.message || 'Find this exercise in your saved workouts.');
      }
    } catch (failure) {
      if (version === generation.current) { Alert.alert('Could not save workout', failure instanceof Error ? failure.message : 'Please try again.'); }
    } finally { busy.current = false; }
  };
  const button = <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save workout" disabled={loading || saved || !exercise}
    onPress={save} style={[styles.saveButton, saved && styles.savedButton, loading && styles.pending]}>
    {loading ? <ActivityIndicator color="white" /> : <Text style={[styles.saveText, saved && styles.savedText]}>{saved ? '✓ Saved' : 'Save workout'}</Text>}
  </TouchableOpacity>;

  return <View style={[styles.screen, {paddingTop: insets.top + 8}]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.back}>‹</Text></TouchableOpacity>
      <Text style={styles.name}>{exercise?.name || 'Exercise'}</Text><View style={styles.backButton} />
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {image ? <Image source={{uri: image, cache: 'default'}} resizeMode="contain" style={styles.image} /> : null}
      <View style={styles.metadata}>
        {[['Category', capitalise(exercise?.category)], ['Equipment', exercise?.equipment ? capitalise(exercise.equipment) : 'No equipment required'],
          ['Muscles', (exercise?.primaryMuscles ?? []).join(', ') || 'Not specified']].map(([label, value]) => <View key={label} style={styles.detailRow}>
          <Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text>
        </View>)}
      </View>
      <View style={styles.instructions}>
        <Text style={styles.sectionTitle}>How to do it</Text>
        <Text numberOfLines={expanded ? undefined : 4} style={styles.instructionText}>{instructions || 'Instructions aren’t available for this exercise.'}</Text>
        {!!instructions && <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded}} onPress={() => setExpanded(previous => !previous)} style={styles.expandButton}>
          <Text style={styles.expandText}>{expanded ? 'Show less' : 'Show more'}</Text>
        </TouchableOpacity>}
      </View>
    </ScrollView>
    <View style={styles.footer}>
      {tour.wrap('save-button', button, {order: 4, placement: 'top', showChildInTooltip: true, content: <Text>Save an exercise here to add it to your plan later.</Text>, onClose: () => tour.stop()})}
      <Text style={styles.footerHint}>{saved ? 'Saved to your profile.' : 'Save this exercise to plan it later.'}</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  header: {minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8},
  backButton: {width: 44, minHeight: 44, justifyContent: 'center'},
  back: {fontSize: 32, color: 'black'},
  name: {flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '600', color: 'black', textAlign: 'center'},
  content: {padding: 20, paddingTop: 12, gap: 16, paddingBottom: 24},
  image: {height: 220, width: '100%', borderRadius: 12, backgroundColor: '#e8e8e8'},
  metadata: {gap: 9, paddingBottom: 14, borderBottomWidth: 1, borderColor: '#ddd'},
  detailRow: {flexDirection: 'row', gap: 12},
  label: {width: 78, fontSize: 12, color: '#666', lineHeight: 19},
  value: {flex: 1, fontSize: 13, color: 'black', lineHeight: 19},
  instructions: {gap: 8},
  sectionTitle: {fontSize: 15, fontWeight: '600', color: 'black'},
  instructionText: {fontSize: 13, color: '#444', lineHeight: 20},
  expandButton: {minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start'},
  expandText: {fontSize: 12, fontWeight: '600', color: 'black'},
  footer: {paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderColor: '#ddd', gap: 7},
  saveButton: {minHeight: 44, borderRadius: 10, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center'},
  saveText: {fontSize: 14, fontWeight: '600', color: 'white'},
  savedButton: {backgroundColor: 'white', borderWidth: 1, borderColor: '#ccc'},
  savedText: {color: 'black'},
  pending: {opacity: 0.5},
  footerHint: {fontSize: 11, color: '#555', textAlign: 'center'},
});
