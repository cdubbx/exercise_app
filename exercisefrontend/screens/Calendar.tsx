import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator, Alert, SectionList, RefreshControl, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {NavigationProp, useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {openTab} from '../services/navigation';
import {useDeleteWorkout, useFetchedPlanedWorkouts} from '../hooks/exercises';
import {PlannedWorkout} from '../interfaces/interfaces';
import {CalendarParamList} from '../interfaces/screentypes';
import PlannedExercise from '../cards/PlannedExercise';
import {useWalkThrough} from '../utils/TutorialSystemService';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timesOfDay = ['Morning', 'Afternoon', 'Evening', 'Anytime'] as const;
interface CalendarScreenProps {
  navigation: NavigationProp<CalendarParamList, 'Calendar'>;
}

const CalendarCard: React.FC<CalendarScreenProps> = ({navigation}) => {
  const [selectedDay, setSelectedDay] = useState(() => days[(new Date().getDay() + 6) % 7]);
  const [workouts, setWorkouts] = useState<PlannedWorkout[] | null>(null);
  const [fetchError, setFetchError] = useState('');
  const loadGeneration = useRef(0);
  const deleting = useRef(new Set<number>());
  const {loading, fetchPlannedWorkouts} = useFetchedPlanedWorkouts();
  const {deletePlannedWorkout} = useDeleteWorkout();
  const insets = useSafeAreaInsets();
  const tour = useWalkThrough();
  const {register} = tour;
  const dailyWorkouts = useMemo(() => (workouts ?? []).filter(workout => workout.day_of_the_week === selectedDay), [workouts, selectedDay]);
  const sections = useMemo(() => timesOfDay.map(title => ({
    title,
    data: dailyWorkouts.filter(workout => (workout.time_of_day || 'Anytime') === title),
  })).filter(section => section.data.length > 0), [dailyWorkouts]);
  const plannedDays = useMemo(() => new Set((workouts ?? []).map(workout => workout.day_of_the_week)), [workouts]);
  const addWorkout = () => navigation.navigate('SavedExerciseList', {exercises: []});

  const refresh = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setFetchError('');
    try {
      const data = await fetchPlannedWorkouts();
      if (generation === loadGeneration.current) { setWorkouts(data); }
    } catch (error) {
      if (generation === loadGeneration.current) { setFetchError(error instanceof Error ? error.message : 'Please try again.'); }
    }
  }, [fetchPlannedWorkouts]);
  useFocusEffect(useCallback(() => {
    refresh();
    return () => { loadGeneration.current++; };
  }, [refresh]));
  useEffect(() => {
    register({id: 'settings-menu', order: 6, onActivate: () => openTab('Profile1', {screen: 'Profile'})}, true);
  }, [register]);

  const removeWorkout = async (id: number) => {
    if (deleting.current.has(id)) { return; }
    deleting.current.add(id);
    try {
      await deletePlannedWorkout(id);
      setWorkouts(previous => previous?.filter(workout => workout.id !== id) ?? null);
    } catch (error) {
      Alert.alert('Could not remove workout', error instanceof Error ? error.message : 'Please try again.');
    } finally { deleting.current.delete(id); }
  };
  const confirmDelete = (item: PlannedWorkout) => {
    const name = item.saved_workout_details?.exercise?.name ?? item.exercise?.name ?? 'this workout';
    Alert.alert('Remove workout?', `Remove ${name} from ${item.day_of_the_week}? Your saved exercise will stay in your profile.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () => removeWorkout(item.id)},
    ]);
  };

  const addButton = (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add workout" onPress={addWorkout} style={styles.addButton}>
      <Text style={styles.addIcon}>+</Text><Text style={styles.addLabel}>Add workout</Text>
    </TouchableOpacity>
  );
  return (
    <View style={[styles.screen, {paddingTop: insets.top + 12}]}>
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={loading && workouts !== null} onRefresh={refresh} tintColor="black" />}
        ListHeaderComponent={<View>
          <View style={styles.header}>
            <Text style={styles.title}>Calendar</Text>
            {tour.wrap('plus-button', addButton, {
              order: 5, placement: 'bottom', topAdjustment: 20,
              content: <Text>Press Add workout to access your saved workouts.</Text>, showChildInTooltip: false,
            })}
          </View>
          <Text style={styles.subtitle}>Your weekly workout plan</Text>
          <View style={styles.days}>
            {days.map(day => <TouchableOpacity key={day} accessibilityRole="button" accessibilityLabel={day}
              accessibilityHint={plannedDays.has(day) ? 'Has planned workouts' : 'No planned workouts'}
              accessibilityState={{selected: selectedDay === day}} onPress={() => setSelectedDay(day)}
              style={[styles.day, selectedDay === day && styles.selectedDay]}>
              <Text style={[styles.dayText, selectedDay === day && styles.selectedDayText]}>{day.slice(0, 3)}</Text>
              <View style={[styles.dot, plannedDays.has(day) && (selectedDay === day ? styles.whiteDot : styles.blackDot)]} />
            </TouchableOpacity>)}
          </View>
          <View style={styles.dayHeading}>
            <Text style={styles.sectionTitle}>{selectedDay}</Text>
            {workouts !== null && <Text style={styles.count}>{dailyWorkouts.length} {dailyWorkouts.length === 1 ? 'workout' : 'workouts'}</Text>}
          </View>
          {!!fetchError && <View accessibilityRole="alert" style={styles.messageCard}>
            <Text style={styles.messageTitle}>Could not refresh your plan</Text>
            <Text style={styles.supportingText}>{fetchError}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={refresh} style={styles.retry}><Text style={styles.linkText}>Try again</Text></TouchableOpacity>
          </View>}
        </View>}
        ListEmptyComponent={fetchError ? null : loading || workouts === null ? <View style={styles.loading}>
          <ActivityIndicator color="black" /><Text style={styles.supportingText}>Loading your plan…</Text>
        </View> : <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Nothing planned for {selectedDay}</Text>
          <Text style={styles.supportingText}>Choose a saved exercise to build your plan.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={addWorkout} style={styles.emptyAction}>
            <Text style={styles.addLabel}>Add workout</Text>
          </TouchableOpacity>
        </View>}
        ListFooterComponent={dailyWorkouts.length > 0 ? <Text style={styles.footerHint}>Use ••• or hold a workout to remove it from your plan.</Text> : null}
        renderSectionHeader={({section}) => <View style={styles.timeHeading}><Text style={styles.timeTitle}>{section.title}</Text><View style={styles.timeRule} /></View>}
        renderItem={({item}) => <View style={styles.workoutCard}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${item.saved_workout_details?.exercise?.name ?? item.exercise?.name ?? 'workout'} details`}
            accessibilityHint="Opens workout details" onPress={() => navigation.navigate('PlannedWorkoutDetail', {workout: item})}
            onLongPress={() => confirmDelete(item)} style={styles.workoutContent}>
            <PlannedExercise item={item} />
          </TouchableOpacity>
          <View style={styles.workoutActions}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Edit ${item.saved_workout_details?.exercise?.name ?? item.exercise?.name ?? 'workout'}`}
              onPress={() => navigation.navigate('EditPlannedWorkout', {workout: item})} style={styles.actionButton}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Options for ${item.saved_workout_details?.exercise?.name ?? item.exercise?.name ?? 'workout'}`}
              onPress={() => confirmDelete(item)} style={styles.menuButton}><Text style={styles.menuText}>•••</Text></TouchableOpacity>
          </View>
        </View>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  content: {paddingHorizontal: 20, paddingBottom: 100},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12},
  title: {fontSize: 26, fontWeight: 'bold', color: 'black'},
  subtitle: {fontSize: 14, color: '#555', marginTop: 8},
  addButton: {minHeight: 44, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'black'},
  addIcon: {fontSize: 23, color: 'white'},
  addLabel: {fontSize: 13, fontWeight: '600', color: 'white'},
  days: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 24, marginBottom: 26},
  day: {flexGrow: 1, minWidth: 44, minHeight: 56, paddingHorizontal: 4, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6},
  selectedDay: {backgroundColor: 'black', borderColor: 'black'},
  dayText: {fontSize: 13, color: 'black'},
  selectedDayText: {color: 'white'},
  dot: {width: 4, height: 4, borderRadius: 2},
  whiteDot: {backgroundColor: 'white'},
  blackDot: {backgroundColor: 'black'},
  dayHeading: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14},
  sectionTitle: {fontSize: 18, fontWeight: '600', color: 'black', flexShrink: 1},
  timeHeading: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10},
  timeTitle: {fontSize: 13, fontWeight: '600', color: '#555'},
  timeRule: {height: 1, backgroundColor: '#ddd', flex: 1},
  count: {fontSize: 13, color: '#555'},
  workoutCard: {flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'white', padding: 14, borderRadius: 20, marginBottom: 12},
  workoutContent: {flex: 1},
  workoutActions: {alignItems: 'center', marginTop: -6, marginRight: -6},
  actionButton: {minWidth: 44, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6},
  actionText: {fontSize: 13, fontWeight: '600', color: 'black'},
  menuButton: {minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: -6, marginTop: -6},
  menuText: {fontSize: 17, color: '#555'},
  messageCard: {padding: 22, backgroundColor: 'white', borderRadius: 20, gap: 12, marginBottom: 12},
  messageTitle: {fontSize: 16, fontWeight: '600', color: 'black'},
  supportingText: {fontSize: 14, color: '#555', lineHeight: 21},
  emptyAction: {minHeight: 44, paddingHorizontal: 18, borderRadius: 10, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4},
  retry: {minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start'},
  linkText: {fontSize: 14, fontWeight: '600', color: 'black'},
  loading: {padding: 24, alignItems: 'center', gap: 12},
  footerHint: {fontSize: 12, lineHeight: 18, color: '#555', marginTop: 4, paddingHorizontal: 4},
});
export default CalendarCard;
