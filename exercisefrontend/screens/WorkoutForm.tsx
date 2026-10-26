import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ProfileStackParamList} from '../interfaces/screentypes';
import {useFilePicker, useS3Uploader} from '../hooks/social';
import {useUploadWorkOuts} from '../hooks/exercises';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AddWorkoutScreen'>;
const initial = {name: '', equipment: '', mechanic: '', level: '', category: ''};
export default function WorkoutForm({navigation}: Props) {
  const [fields, setFields] = useState(initial);
  const [muscles, setMuscles] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const photoBusy = useRef(false);
  const generation = useRef(0);
  const {pickFile, setFile, error: pickerError} = useFilePicker();
  const {uploadToS3} = useS3Uploader();
  const {addWorkout} = useUploadWorkOuts(false);
  const insets = useSafeAreaInsets();
  useEffect(() => { const current = generation; return () => { current.current++; }; }, []);
  const upload = async () => {
    if (photoBusy.current || busy.current) { return; }
    photoBusy.current = true; setUploading(true);
    const version = generation.current;
    try {
      const selected = await pickFile();
      if (!selected || version !== generation.current) { return; }
      const url = await uploadToS3(selected, 'exercises');
      if (url && version === generation.current) { setPhotos(previous => [...previous, url]); }
    } catch (failure) {
      if (version === generation.current) { Alert.alert('Could not upload photo', failure instanceof Error ? failure.message : 'Please try again.'); }
    } finally { if (version === generation.current) { photoBusy.current = false; setUploading(false); } }
  };
  const save = async () => {
    if (busy.current || photoBusy.current) { return; }
    if (!fields.name.trim()) { Alert.alert('Workout name required', 'Enter a name for your exercise.'); return; }
    busy.current = true; setSubmitting(true);
    const version = generation.current;
    try {
      const data = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim()]));
      const message = await addWorkout({...data, primaryMuscles: muscles.split(',').map(value => value.trim()).filter(Boolean), img_url: photos, is_public: false});
      if (version !== generation.current) { return; }
      setFields(initial); setMuscles(''); setPhotos([]); setFile(null);
      Alert.alert('Workout added', message || 'Find your exercise under Your Exercises.');
      navigation.goBack();
    } catch (failure) {
      if (version === generation.current) { Alert.alert('Could not add workout', failure instanceof Error ? failure.message : 'Please try again.'); }
    } finally { if (version === generation.current) { busy.current = false; setSubmitting(false); } }
  };
  const field = (key: keyof typeof initial, label: string, placeholder: string, half = false) => <View style={[styles.field, half && styles.halfField]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} style={styles.input} secureTextEntry={false} value={fields[key]} editable={!submitting}
      onChangeText={value => setFields(previous => ({...previous, [key]: value}))} placeholder={placeholder} placeholderTextColor="#777" maxLength={key === 'name' ? 255 : 50} />
  </View>;
  return <View style={[styles.screen, {paddingTop: insets.top + 8}]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" disabled={submitting} onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.back}>‹</Text></TouchableOpacity>
      <Text style={styles.title}>Add Workout</Text><View style={styles.backButton} />
    </View>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text style={styles.hint}>Create an exercise for Your Exercises. Only the name is required.</Text>
        {field('name', 'Workout name', 'e.g. Dumbbell row')}
        <View style={styles.fieldRow}>{field('equipment', 'Equipment', 'e.g. Dumbbell', true)}{field('mechanic', 'Mechanic', 'e.g. Compound', true)}</View>
        <View style={styles.fieldRow}>{field('level', 'Level', 'e.g. Beginner', true)}{field('category', 'Category', 'e.g. Strength', true)}</View>
        <View style={styles.field}>
          <Text style={styles.label}>Primary muscles</Text>
          <TextInput accessibilityLabel="Primary muscles" style={styles.input} secureTextEntry={false} value={muscles} editable={!submitting} onChangeText={setMuscles} placeholder="e.g. back, biceps" placeholderTextColor="#777" />
          <Text style={styles.hint}>Separate muscles with commas.</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Photos (optional)</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add photo" disabled={uploading || submitting} onPress={upload} style={styles.photoButton}>
            {uploading ? <ActivityIndicator color="black" /> : <Text style={styles.photoLabel}>+ Add photo</Text>}
          </TouchableOpacity>
          {!!pickerError && !pickerError.toLowerCase().includes('cancel') && <Text style={styles.hint}>{pickerError}</Text>}
          {photos.length > 0 && <ScrollView horizontal contentContainerStyle={styles.photos}>
            {photos.map((url, index) => <View key={`${index}:${url}`}>
              <Image source={{uri: url}} style={styles.photo} />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove photo ${index + 1}`} disabled={submitting} onPress={() => setPhotos(previous => previous.filter((_, i) => i !== index))} style={styles.removePhoto}><Text style={styles.removeText}>×</Text></TouchableOpacity>
            </View>)}
          </ScrollView>}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save new workout" disabled={uploading || submitting} onPress={save} style={[styles.saveButton, (uploading || submitting) && styles.disabled]}>
          <Text style={styles.saveText}>{submitting ? 'Saving…' : uploading ? 'Uploading photo…' : 'Save workout'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </View>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  header: {minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, justifyContent: 'space-between'},
  backButton: {width: 44, minHeight: 44, justifyContent: 'center'},
  back: {fontSize: 32, color: 'black'},
  title: {fontSize: 20, fontWeight: '600', color: 'black'},
  content: {padding: 20, paddingTop: 12, gap: 14, paddingBottom: 24},
  hint: {fontSize: 12, color: '#666', lineHeight: 18},
  fieldRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  field: {gap: 7},
  halfField: {flex: 1, flexBasis: 125, minWidth: 125},
  label: {fontSize: 12, fontWeight: '500', color: '#444'},
  input: {minHeight: 44, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: 'black'},
  photoButton: {borderWidth: 1, borderColor: '#ccc', borderRadius: 8, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white'},
  photoLabel: {fontSize: 13, color: 'black', fontWeight: '500'},
  photos: {gap: 10, paddingTop: 4, paddingRight: 8},
  photo: {width: 80, height: 80, borderRadius: 8},
  removePhoto: {position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center'},
  removeText: {fontSize: 21, color: 'white'},
  footer: {paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderColor: '#ddd'},
  saveButton: {minHeight: 44, backgroundColor: 'black', borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  saveText: {fontSize: 14, fontWeight: '600', color: 'white'},
  disabled: {opacity: 0.5},
});
