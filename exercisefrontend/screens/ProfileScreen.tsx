import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MenuView} from '@react-native-menu/menu';
import {Picker} from '@react-native-picker/picker';
import {ToastOverlay, useToast} from '../context/ToastContext';
import {openChat, openTab} from '../services/navigation';
import {useUpdateUser, useUserContext} from '../hooks/auth';
import {useFetchedSavedWorkOuts} from '../hooks/exercises';
import {useFilePicker, useS3Uploader} from '../hooks/social';
import {Avatar} from '../components/Avatar';
import FetchedExercise from '../cards/FetchedExercise';
import {ProfileStackParamList} from '../interfaces/screentypes';
import {useWalkThrough} from '../utils/TutorialSystemService';
import {formatDate} from '../utils/utils';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;
interface ProfileDraft {username: string; weight: string; goal_weight: string; phone_number: string; image_url?: string}
const emptyDraft: ProfileDraft = {username: '', weight: '', goal_weight: '', phone_number: ''};
const displayWeight = (value: unknown) => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? 'Not set' : String(Number(value));

export default function ProfileScreen({navigation}: Props): React.JSX.Element {
  const {user} = useUserContext();
  const {fetchedExercises, loading: savedLoading, error: savedError} = useFetchedSavedWorkOuts();
  const {updateUser, isLoading} = useUpdateUser();
  const {pickFile, error: pickerError, setFile} = useFilePicker();
  const {uploadToS3} = useS3Uploader();
  const showToast = useToast();
  const tour = useWalkThrough();
  const {register} = tour;
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [feet, setFeet] = useState<number | null>(null);
  const [inches, setInches] = useState(0);
  const [heightChanged, setHeightChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editVersion = useRef(0);
  const saveBusy = useRef(false);
  const photoBusy = useRef(false);
  const busy = isLoading || uploading;
  const joined = user?.date_joined ? formatDate(user.date_joined, 'full') : '';
  const streak = user?.streak ?? 0;
  const savedCount = savedLoading || savedError ? '—' : String(fetchedExercises.length);

  useEffect(() => { register({id: 'bot-screen-tooltip', order: 7, onActivate: openChat}, true); }, [register]);
  const openEditor = () => {
    editVersion.current++;
    setDraft({username: user?.username ?? '', weight: user?.weight == null ? '' : String(user.weight),
      goal_weight: user?.goal_weight == null ? '' : String(user.goal_weight), phone_number: user?.phone_number ?? '', image_url: user?.image_url});
    const totalInches = Math.round((Number(user?.height) || 0) * 12);
    setFeet(user?.height == null || user.height === '' ? null : Math.floor(totalInches / 12)); setInches(totalInches % 12); setHeightChanged(false);
    setFile(null); setUploading(false); photoBusy.current = false; setEditing(true);
  };
  const closeEditor = () => {
    if (saveBusy.current) { return; }
    editVersion.current++; setEditing(false); setFile(null);
  };
  const changePhoto = async () => {
    if (photoBusy.current || saveBusy.current) { return; }
    photoBusy.current = true; setUploading(true);
    const version = editVersion.current;
    try {
      const selected = await pickFile();
      if (!selected || version !== editVersion.current) { return; }
      const url = await uploadToS3(selected, 'profile');
      if (url && version === editVersion.current) { setDraft(previous => ({...previous, image_url: url})); }
    } catch (failure) {
      if (version === editVersion.current) { showToast(failure instanceof Error ? failure.message : 'Could not upload your photo. Please try again.'); }
    } finally {
      if (version === editVersion.current) { photoBusy.current = false; setUploading(false); }
    }
  };
  const saveProfile = async () => {
    if (saveBusy.current || photoBusy.current) { return; }
    saveBusy.current = true;
    try {
      const message = await updateUser({...draft, username: draft.username.trim(), phone_number: draft.phone_number.trim(),
        ...(heightChanged ? {height: feet === null ? null : Number((feet + inches / 12).toFixed(4))} : {})});
      setEditing(false); editVersion.current++; setFile(null);
      showToast(message || 'Profile updated successfully.');
    } catch (failure) {
      showToast(failure instanceof Error ? failure.message : 'Could not save your profile. Please try again.');
    } finally { saveBusy.current = false; }
  };
  const savedWorkouts = () => navigation.navigate('SavedExerciseList', {exercises: fetchedExercises});
  const menu = <MenuView title="Profile" actions={[
    {id: 'edit', title: 'Edit Profile', image: Platform.select({ios: 'square.and.pencil'})},
    {id: 'settings', title: 'Settings', image: Platform.select({ios: 'gearshape'})},
    {id: 'addWorkout', title: 'Add Workout', image: Platform.select({ios: 'plus'})},
  ]} onPressAction={({nativeEvent}) => {
    if (nativeEvent.event === 'edit') { openEditor(); }
    else if (nativeEvent.event === 'settings') { navigation.navigate('Settings'); }
    else if (nativeEvent.event === 'addWorkout') { navigation.navigate('AddWorkoutScreen'); }
  }}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Profile options" style={styles.menuButton}>
    <Text style={styles.menuText}>•••</Text>
  </TouchableOpacity></MenuView>;

  return <View style={[styles.screen, {paddingTop: insets.top + 12}]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {tour.wrap('settings-menu', menu, {showChildInTooltip: true, order: 6, placement: 'bottom', topAdjustment: 20, content: <Text>Open this menu to edit your profile, add a workout, or view Settings.</Text>})}
      </View>
      <View style={styles.identityCard}>
        <View style={styles.identityRow}>
          <Avatar size={{height: 52, width: 52}} imageUrl={user?.image_url} />
          <View style={styles.identityText}>
            <Text style={styles.username}>{user?.username || 'Your profile'}</Text>
            {!!joined && joined !== 'Invalid date' && <Text style={styles.supportingText}>Member since {joined}</Text>}
          </View>
        </View>
        <TouchableOpacity accessibilityRole="button" onPress={openEditor} hitSlop={4} style={styles.editButton}><Text style={styles.editLabel}>Edit Profile</Text></TouchableOpacity>
      </View>
      <View style={styles.stats}>
        <View style={styles.statCard}><Text style={styles.statValue}>{streak} {streak === 1 ? 'day' : 'days'}</Text><Text style={styles.supportingText}>App streak</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{savedCount}</Text><Text style={styles.supportingText}>Saved workouts</Text></View>
      </View>
      <View style={styles.goalsCard}>
        <Text style={styles.sectionTitle}>Your goals</Text>
        <View style={styles.goalsRow}>
          <View style={styles.goal}><Text style={styles.supportingText}>Current weight</Text><Text style={styles.goalValue}>{displayWeight(user?.weight)}</Text></View>
          <View style={styles.goal}><Text style={styles.supportingText}>Goal weight</Text><Text style={styles.goalValue}>{displayWeight(user?.goal_weight)}</Text></View>
        </View>
      </View>
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Workouts</Text>
          <TouchableOpacity accessibilityRole="button" onPress={savedWorkouts} style={styles.textButton}><Text style={styles.linkText}>Show More →</Text></TouchableOpacity>
        </View>
        {savedLoading && !fetchedExercises.length ? <ActivityIndicator color="black" accessibilityLabel="Loading saved workouts" style={styles.loader} /> : savedError ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Couldn’t load saved workouts</Text><Text style={styles.supportingText}>{savedError}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={savedWorkouts} style={styles.textButton}><Text style={styles.linkText}>Open saved workouts →</Text></TouchableOpacity>
        </View> : !fetchedExercises.length ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Save your first workout</Text><Text style={styles.supportingText}>You do not have any saved workouts, let’s save a workout.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => openTab('Home1', {screen: 'ExplorePage'})} style={styles.primaryButton}><Text style={styles.primaryLabel}>Browse exercises</Text></TouchableOpacity>
        </View> : fetchedExercises.slice(0, 2).map(item => <TouchableOpacity key={String(item.id)} accessibilityRole="button"
          onPress={() => navigation.navigate('SavedExercises', {exercise: item.exercise})} style={styles.workoutCard}>
          <FetchedExercise item={item} />
        </TouchableOpacity>)}
      </View>
    </ScrollView>
    <Modal visible={editing} presentationStyle="pageSheet" onRequestClose={closeEditor}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.editorHeader}>
            <TouchableOpacity accessibilityRole="button" disabled={isLoading} onPress={closeEditor} style={styles.cancelButton}><Text style={styles.linkText}>Cancel</Text></TouchableOpacity>
            <Text style={styles.editorTitle}>Edit Profile</Text><View style={styles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={busy} onPress={changePhoto} style={styles.photoButton}>
              <Avatar size={{height: 90, width: 90}} imageUrl={draft.image_url} /><Text style={styles.linkText}>{uploading ? 'Uploading photo…' : 'Change photo'}</Text>
            </TouchableOpacity>
            {uploading && <ActivityIndicator color="black" />}
            {!!pickerError && !pickerError.toLowerCase().includes('cancel') && <Text style={styles.supportingText}>{pickerError}</Text>}
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput accessibilityLabel="Username" value={draft.username} onChangeText={text => setDraft(previous => ({...previous, username: text}))}
                placeholder="Your username" placeholderTextColor="#777" autoCapitalize="none" autoCorrect={false} editable={!busy} style={styles.input} />
              <Text style={styles.fieldLabel}>Phone number</Text>
              <TextInput accessibilityLabel="Phone number" value={draft.phone_number} onChangeText={text => setDraft(previous => ({...previous, phone_number: text}))}
                placeholder="Add a phone number" placeholderTextColor="#777" keyboardType="phone-pad" editable={!busy} style={styles.input} />
            </View>
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Current weight</Text>
              <TextInput accessibilityLabel="Current weight" value={draft.weight} onChangeText={text => setDraft(previous => ({...previous, weight: text}))}
                placeholder="Add your weight" placeholderTextColor="#777" keyboardType="decimal-pad" editable={!busy} style={styles.input} />
              <Text style={styles.fieldLabel}>Goal weight</Text>
              <TextInput accessibilityLabel="Goal weight" value={draft.goal_weight} onChangeText={text => setDraft(previous => ({...previous, goal_weight: text}))}
                placeholder="Add your goal weight" placeholderTextColor="#777" keyboardType="decimal-pad" editable={!busy} style={styles.input} />
              <Text style={styles.fieldLabel}>Height</Text>
              <View style={styles.heightRow}>
                <Picker accessibilityLabel="Height in feet" selectedValue={feet} enabled={!busy} style={styles.heightPicker} onValueChange={value => { setFeet(value); if (value === null) { setInches(0); } setHeightChanged(true); }}>
                  <Picker.Item label="Not set" value={null} color="black" />
                  {Array.from({length: 8}, (_, i) => i + 3).map(value => <Picker.Item key={value} label={`${value} ft`} value={value} color="black" />)}
                </Picker>
                <Picker accessibilityLabel="Height in inches" selectedValue={inches} enabled={!busy && feet !== null} style={styles.heightPicker} onValueChange={value => { setInches(value); setHeightChanged(true); }}>
                  {Array.from({length: 12}, (_, value) => <Picker.Item key={value} label={`${value} in`} value={value} color="black" />)}
                </Picker>
              </View>
            </View>

          </ScrollView>
          <View style={styles.editorFooter}>
            <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={saveProfile} style={[styles.primaryButton, busy && styles.disabled]}><Text style={styles.primaryLabel}>{isLoading ? 'Saving…' : 'Save Profile'}</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        <ToastOverlay />
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  content: {paddingHorizontal: 20, paddingBottom: 100, gap: 12},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  title: {fontSize: 24, fontWeight: 'bold', color: 'black'},
  menuButton: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  menuText: {fontSize: 22, color: 'black'},
  identityCard: {backgroundColor: 'white', borderRadius: 12, padding: 12, gap: 8},
  identityRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  identityText: {flex: 1, gap: 3},
  username: {fontSize: 18, fontWeight: '600', color: 'black'},
  supportingText: {fontSize: 12, lineHeight: 18, color: '#555'},
  editButton: {minHeight: 36, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center'},
  editLabel: {fontSize: 13, fontWeight: '600', color: 'black'},
  stats: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  statCard: {flex: 1, minWidth: 115, backgroundColor: 'white', borderRadius: 12, padding: 12, gap: 2},
  statValue: {fontSize: 18, fontWeight: '600', color: 'black'},
  goalsCard: {backgroundColor: 'white', padding: 12, borderRadius: 12, gap: 10},
  goalsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 16},
  goal: {flex: 1, minWidth: 115, gap: 3},
  goalValue: {fontSize: 16, fontWeight: '500', color: 'black'},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: 'black'},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 8},
  textButton: {minHeight: 44, justifyContent: 'center'},
  linkText: {fontSize: 13, fontWeight: '600', color: 'black'},
  workoutCard: {backgroundColor: 'white', padding: 10, borderRadius: 12, marginBottom: 8},
  emptyCard: {backgroundColor: 'white', padding: 14, borderRadius: 12, gap: 10},
  emptyTitle: {fontSize: 16, fontWeight: '600', color: 'black'},
  loader: {padding: 20},
  editorHeader: {minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20},
  editorTitle: {fontSize: 17, fontWeight: '600', color: 'black'},
  cancelButton: {minHeight: 44, width: 60, justifyContent: 'center'},
  headerSpacer: {width: 60},
  editorFooter: {paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderColor: '#ddd'},
  editorContent: {padding: 20, paddingBottom: 24, gap: 16},
  photoButton: {alignSelf: 'center', alignItems: 'center', gap: 12, minHeight: 44},
  formCard: {padding: 14, borderRadius: 12, backgroundColor: 'white', gap: 8},
  fieldLabel: {fontSize: 13, fontWeight: '500', color: '#555'},
  input: {minHeight: 46, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', color: 'black', fontSize: 15},
  heightRow: {flexDirection: 'row'},
  heightPicker: {flex: 1, color: 'black'},
  primaryButton: {minHeight: 50, borderRadius: 10, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center', padding: 12},
  primaryLabel: {fontSize: 15, fontWeight: '600', color: 'white'},
  disabled: {opacity: 0.35},
});
