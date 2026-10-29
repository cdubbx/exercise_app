import React from 'react';
import {Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CalendarParamList} from '../interfaces/screentypes';

type Props = {
  navigation: NavigationProp<CalendarParamList, 'PlannedWorkoutDetail'>;
  route: RouteProp<CalendarParamList, 'PlannedWorkoutDetail'>;
};

export default function PlannedWorkoutDetail({navigation, route}: Props) {
  const insets = useSafeAreaInsets();
  const workout = route.params.workout;
  const exercise = workout.saved_workout_details?.exercise ?? workout.exercise;
  const image = Array.isArray(exercise?.img_url) ? exercise.img_url[0] : exercise?.img_url;
  const muscles = exercise?.primaryMuscles ?? exercise?.muscles;
  const muscleText = Array.isArray(muscles) ? muscles.join(', ') : muscles;

  return (
    <View style={[styles.screen, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to calendar" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout details</Text>
        <View style={styles.headerSpace} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {image ? <Image source={{uri: image}} style={styles.image} /> : <View style={[styles.image, styles.imagePlaceholder]}><Text style={styles.placeholderText}>Exercise</Text></View>}
        <Text style={styles.title}>{exercise?.name ?? 'Workout'}</Text>
        <View style={styles.scheduleCard}>
          <Text style={styles.eyebrow}>SCHEDULED</Text>
          <Text style={styles.schedule}>{workout.day_of_the_week} · {workout.time_of_day || 'Anytime'}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your plan</Text>
          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.metricValue}>{workout.sets ?? 1}</Text><Text style={styles.metricLabel}>Sets</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{workout.reps ?? '—'}</Text><Text style={styles.metricLabel}>Reps per set</Text></View>
          </View>
        </View>
        {(exercise?.category || exercise?.equipment || muscleText) && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise information</Text>
          {!!exercise?.category && <InfoRow label="Category" value={exercise.category} />}
          {!!exercise?.equipment && <InfoRow label="Equipment" value={exercise.equipment} />}
          {!!muscleText && <InfoRow label="Muscles" value={muscleText} />}
        </View>}
      </ScrollView>
    </View>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  header: {height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  backButton: {width: 44, height: 44, justifyContent: 'center'},
  backText: {fontSize: 34, color: 'black', lineHeight: 38},
  headerTitle: {fontSize: 17, fontWeight: '600', color: 'black'},
  headerSpace: {width: 44},
  content: {padding: 20, paddingBottom: 40, gap: 18},
  image: {width: '100%', height: 230, borderRadius: 20, backgroundColor: 'white'},
  imagePlaceholder: {alignItems: 'center', justifyContent: 'center'},
  placeholderText: {fontSize: 14, color: '#555'},
  title: {fontSize: 25, fontWeight: '700', color: 'black'},
  scheduleCard: {backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 7},
  eyebrow: {fontSize: 11, fontWeight: '600', letterSpacing: 0.8, color: '#666'},
  schedule: {fontSize: 16, fontWeight: '600', color: 'black'},
  section: {backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 14},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: 'black'},
  metrics: {flexDirection: 'row', gap: 12},
  metric: {flex: 1, minHeight: 80, backgroundColor: '#f2f2f2', borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 5},
  metricValue: {fontSize: 22, fontWeight: '700', color: 'black'},
  metricLabel: {fontSize: 12, color: '#555'},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 16, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12},
  infoLabel: {fontSize: 13, color: '#666'},
  infoValue: {fontSize: 13, color: 'black', fontWeight: '500', flexShrink: 1, textAlign: 'right'},
});
