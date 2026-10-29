import React, {useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useUpdatePlannedWorkout} from '../hooks/exercises';
import {CalendarParamList} from '../interfaces/screentypes';

interface Props {
  navigation: NavigationProp<CalendarParamList, 'EditPlannedWorkout'>;
  route: RouteProp<CalendarParamList, 'EditPlannedWorkout'>;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const times = ['Morning', 'Afternoon', 'Evening', 'Anytime'] as const;

export default function EditPlannedWorkout({navigation, route}: Props) {
  const {workout} = route.params;
  const exercise = workout.saved_workout_details?.exercise ?? workout.exercise;
  const [day, setDay] = useState(workout.day_of_the_week);
  const [time, setTime] = useState(workout.time_of_day || 'Anytime');
  const [sets, setSets] = useState(String(workout.sets ?? 1));
  const [reps, setReps] = useState(String(workout.reps ?? ''));
  const {updatePlannedWorkout, loading} = useUpdatePlannedWorkout();
  const insets = useSafeAreaInsets();

  const save = async () => {
    const parsedSets = Number(sets);
    const parsedReps = Number(reps);
    if (!Number.isInteger(parsedSets) || parsedSets < 1 || parsedSets > 100 || !Number.isInteger(parsedReps) || parsedReps < 1 || parsedReps > 1000) {
      Alert.alert('Check your workout', 'Sets must be 1–100 and reps must be 1–1000.');
      return;
    }
    try {
      await updatePlannedWorkout(workout.id, {day_of_the_week: day, time_of_day: time, sets: parsedSets, reps: parsedReps});
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not update workout', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return <View style={[styles.screen, {paddingTop: insets.top + 8}]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cancel editing" onPress={() => navigation.goBack()} style={styles.headerAction}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
      <Text accessibilityRole="header" style={styles.headerTitle}>Edit workout</Text>
      <View style={styles.headerAction} />
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.name}>{exercise?.name ?? 'Workout'}</Text>
      <Text style={styles.subtitle}>Change when you’ll do it or adjust your target.</Text>

      <Text style={styles.label}>Day</Text>
      <View style={styles.options}>{days.map(option => <TouchableOpacity key={option} accessibilityRole="button" accessibilityState={{selected: day === option}}
        onPress={() => setDay(option)} style={[styles.option, day === option && styles.selectedOption]}>
        <Text style={[styles.optionText, day === option && styles.selectedOptionText]}>{option.slice(0, 3)}</Text>
      </TouchableOpacity>)}</View>

      <Text style={styles.label}>Time of day</Text>
      <View style={styles.options}>{times.map(option => <TouchableOpacity key={option} accessibilityRole="button" accessibilityState={{selected: time === option}}
        onPress={() => setTime(option)} style={[styles.timeOption, time === option && styles.selectedOption]}>
        <Text style={[styles.optionText, time === option && styles.selectedOptionText]}>{option}</Text>
      </TouchableOpacity>)}</View>

      <View style={styles.targets}>
        <View style={styles.targetField}><Text style={styles.label}>Sets</Text><TextInput accessibilityLabel="Sets" keyboardType="number-pad" value={sets} onChangeText={setSets} style={styles.input} /></View>
        <View style={styles.targetField}><Text style={styles.label}>Reps</Text><TextInput accessibilityLabel="Reps" keyboardType="number-pad" value={reps} onChangeText={setReps} style={styles.input} /></View>
      </View>
      <TouchableOpacity accessibilityRole="button" disabled={loading} onPress={save} style={[styles.saveButton, loading && styles.disabled]}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>Save changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  header: {minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center'},
  headerAction: {width: 64, minHeight: 44, justifyContent: 'center'},
  cancel: {fontSize: 13, color: '#555'},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '600', color: 'black', textAlign: 'center'},
  content: {padding: 20, paddingTop: 18, gap: 12, paddingBottom: 40},
  name: {fontSize: 22, lineHeight: 28, fontWeight: '700', color: 'black'},
  subtitle: {fontSize: 13, lineHeight: 19, color: '#555', marginBottom: 10},
  label: {fontSize: 13, fontWeight: '600', color: 'black', marginTop: 8},
  options: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4},
  option: {minWidth: 44, minHeight: 42, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'},
  timeOption: {minHeight: 42, paddingHorizontal: 13, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'},
  selectedOption: {backgroundColor: 'black', borderColor: 'black'},
  optionText: {fontSize: 12, color: 'black'},
  selectedOptionText: {color: 'white', fontWeight: '600'},
  targets: {flexDirection: 'row', gap: 12, marginTop: 4},
  targetField: {flex: 1, gap: 5},
  input: {minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: 'white', color: 'black', fontSize: 15},
  saveButton: {minHeight: 48, borderRadius: 11, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center', marginTop: 16},
  saveText: {fontSize: 14, fontWeight: '600', color: 'white'},
  disabled: {opacity: 0.6},
});
