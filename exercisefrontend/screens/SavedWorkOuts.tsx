import React, {useRef, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ProfileStackParamList} from '../interfaces/screentypes';
import {useDeleteWorkout, useFetchedSavedWorkOuts, useUploadWorkOuts} from '../hooks/exercises';
import {openTab} from '../services/navigation';
import FetchedExercise from '../cards/FetchedExercise';

type ListKind = 'saved' | 'custom';
interface Props {navigation: NavigationProp<ProfileStackParamList, 'SavedExerciseList'>}

export default function SavedWorkOuts({navigation}: Props) {
  const [kind, setKind] = useState<ListKind>('saved');
  const saved = useFetchedSavedWorkOuts();
  const custom = useUploadWorkOuts(false);
  const {deleteSavedWorkout, deleteUserSavedWorkout} = useDeleteWorkout();
  const [removed, setRemoved] = useState<string[]>([]);
  const removing = useRef(new Set<string>());
  const insets = useSafeAreaInsets();
  const isCustom = kind === 'custom';
  const loading = isCustom ? custom.isLoading : saved.loading;
  const error = isCustom ? custom.error : saved.error;
  const refresh = isCustom ? custom.refresh : saved.refresh;
  const workouts = (isCustom ? custom.userWorkouts : saved.fetchedExercises).filter(item => !removed.includes(`${kind}:${item.id}`));
  const addExercise = () => openTab('Profile1', {screen: 'AddWorkoutScreen'});
  const browse = () => openTab('Home1', {screen: 'ExplorePage'});
  const remove = async (item: any, listKind: ListKind) => {
    const key = `${listKind}:${item.id}`;
    if (removing.current.has(key)) { return; }
    removing.current.add(key);
    try {
      if (listKind === 'custom') { await deleteUserSavedWorkout(item.id); } else { await deleteSavedWorkout(item.id); }
      setRemoved(previous => [...previous, key]);
    } catch (failure) {
      Alert.alert('Could not remove workout', failure instanceof Error ? failure.message : 'Please try again.');
    } finally { removing.current.delete(key); }
  };
  const confirmRemove = (item: any) => {
    const name = item.exercise?.name || item.name || 'this workout';
    Alert.alert(isCustom ? 'Delete your exercise?' : 'Remove saved workout?',
      `${isCustom ? 'Delete' : 'Remove'} ${name}? Calendar plans using it will also be removed.`, [
        {text: 'Cancel', style: 'cancel'},
        {text: isCustom ? 'Delete' : 'Remove', style: 'destructive', onPress: () => remove(item, kind)},
      ]);
  };
  return <View style={[styles.screen, {paddingTop: insets.top + 8}]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.headerButton}><Text style={styles.back}>‹</Text></TouchableOpacity>
      <Text style={styles.title}>Saved Workouts</Text>
      <View style={styles.headerButton} />
    </View>
    <View style={styles.tabs}>
      {([{key: 'saved', label: 'Exercises'}, {key: 'custom', label: 'Your Exercises'}] as const).map(tab => <TouchableOpacity key={tab.key}
        accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{selected: kind === tab.key}}
        onPress={() => setKind(tab.key)} style={[styles.tab, kind === tab.key && styles.selectedTab]}>
        <Text style={[styles.tabText, kind === tab.key && styles.selectedText]}>{tab.label}</Text>
      </TouchableOpacity>)}
    </View>
    <View style={styles.listHeading}>
      <Text style={styles.hint}>{loading ? 'Loading…' : `${workouts.length} ${workouts.length === 1 ? 'exercise' : 'exercises'}`}</Text>
      {isCustom && <TouchableOpacity accessibilityRole="button" onPress={addExercise} style={styles.addLink}><Text style={styles.linkText}>+ Add exercise</Text></TouchableOpacity>}
    </View>
    <FlatList data={workouts} keyExtractor={item => String(item.id)} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading && workouts.length > 0} onRefresh={refresh} tintColor="black" />}
      ListHeaderComponent={!!error ? <View accessibilityRole="alert" style={styles.message}>
        <Text style={styles.messageTitle}>Couldn’t load {isCustom ? 'your exercises' : 'saved workouts'}</Text><Text style={styles.hint}>{error}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={refresh} style={styles.action}><Text style={styles.actionText}>Try again</Text></TouchableOpacity>
      </View> : null}
      ListEmptyComponent={error ? null : loading ? <View style={styles.loading}><ActivityIndicator color="black" /><Text style={styles.hint}>Loading exercises…</Text></View> : <View style={styles.message}>
        <Text style={styles.messageTitle}>{isCustom ? 'No exercises added yet' : 'No saved workouts yet'}</Text>
        <Text style={styles.hint}>{isCustom ? 'Add your own exercise, then plan its sets and reps.' : 'Save an exercise from Home, then add it to your plan here.'}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={isCustom ? addExercise : browse} style={styles.action}>
          <Text style={styles.actionText}>{isCustom ? 'Add exercise' : 'Browse exercises'}</Text>
        </TouchableOpacity>
      </View>}
      ListFooterComponent={workouts.length > 0 ? <Text style={styles.footer}>Tap an exercise to choose a day, sets, and reps.</Text> : null}
      renderItem={({item}) => <View style={styles.workout}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Plan ${item.exercise?.name || item.name || 'workout'}`}
          onPress={() => navigation.navigate('SavedExercises', {exercise: item.exercise || item})} onLongPress={() => confirmRemove(item)} style={styles.workoutBody}>
          <FetchedExercise item={item} showChevron={false} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Options for ${item.exercise?.name || item.name || 'workout'}`} onPress={() => confirmRemove(item)} style={styles.options}>
          <Text style={styles.optionsText}>•••</Text>
        </TouchableOpacity>
      </View>}
    />
  </View>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14},
  headerButton: {width: 44, height: 44, justifyContent: 'center'},
  back: {fontSize: 32, color: 'black'},
  title: {fontSize: 20, fontWeight: '600', color: 'black', flexShrink: 1, textAlign: 'center'},
  tabs: {flexDirection: 'row', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 3, marginHorizontal: 20, gap: 4},
  tab: {flex: 1, minHeight: 40, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 7, alignItems: 'center', justifyContent: 'center'},
  selectedTab: {backgroundColor: 'black'},
  tabText: {fontSize: 13, color: 'black', fontWeight: '500', textAlign: 'center'},
  selectedText: {color: 'white'},
  listHeading: {minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20},
  hint: {fontSize: 12, color: '#555', lineHeight: 18},
  addLink: {minHeight: 44, justifyContent: 'center'},
  linkText: {fontSize: 12, color: 'black', fontWeight: '600'},
  content: {paddingHorizontal: 20, paddingBottom: 100},
  workout: {flexDirection: 'row', alignItems: 'center', borderRadius: 12, backgroundColor: 'white', marginBottom: 8},
  workoutBody: {flex: 1, paddingVertical: 12, paddingLeft: 12, paddingRight: 4},
  options: {width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center'},
  optionsText: {fontSize: 17, color: '#555'},
  message: {padding: 16, borderRadius: 12, backgroundColor: 'white', gap: 10, marginBottom: 12},
  messageTitle: {fontSize: 15, fontWeight: '600', color: 'black'},
  action: {backgroundColor: 'black', borderRadius: 8, paddingHorizontal: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start'},
  actionText: {fontSize: 12, color: 'white', fontWeight: '600'},
  loading: {padding: 24, alignItems: 'center', gap: 12},
  footer: {fontSize: 12, lineHeight: 18, color: '#555', marginTop: 8},
});
