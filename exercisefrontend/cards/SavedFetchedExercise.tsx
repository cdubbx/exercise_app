import React, {useRef, useState} from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {useSavePlannedWorkouts, useSetExercise} from '../hooks/exercises';
import {ProfileStackParamList} from '../interfaces/screentypes';

interface SavedExerciseScreenProps {
  route: RouteProp<ProfileStackParamList, 'SavedExercises'>;
  navigation: NavigationProp<ProfileStackParamList, 'SavedExercises'>;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timesOfDay = ['Morning', 'Afternoon', 'Evening', 'Anytime'] as const;

function QuantityInput({label, value, onChange, maximum}: {
  label: string; value: string; onChange: (value: string) => void; maximum: number;
}) {
  const number = /^\d+$/.test(value) ? Number(value) : 0;
  const adjust = (change: number) => onChange(String(Math.min(maximum, Math.max(1, number + change))));
  return (
    <View style={styles.quantityCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          disabled={number <= 1} onPress={() => adjust(-1)} style={[styles.stepButton, number <= 1 && styles.disabled]}>
          <Text style={styles.stepText}>−</Text>
        </TouchableOpacity>
        <TextInput accessibilityLabel={label} keyboardType="number-pad" selectTextOnFocus
          value={value} onChangeText={onChange} placeholder="—" placeholderTextColor="#777"
          style={styles.quantityInput} returnKeyType="done" maxLength={String(maximum).length} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Increase ${label.toLowerCase()}`}
          disabled={number >= maximum} onPress={() => adjust(1)} style={[styles.stepButton, number >= maximum && styles.disabled]}>
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SavedExercise: React.FC<SavedExerciseScreenProps> = ({route, navigation}) => {
  const {width} = useWindowDimensions();
  const imageSize = Math.min(240, width - 40);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState<typeof timesOfDay[number]>('Anytime');
  const submitting = useRef(false);
  const {savePlannedWorkouts, loading} = useSavePlannedWorkouts();
  const {addExercises} = useSetExercise();
  const itemData = Array.isArray(route.params.exercise) ? route.params.exercise[0] : route.params.exercise;
  const item = itemData.exercise || itemData.saved_workout_details?.exercise || itemData;
  const imageUrl = Array.isArray(item?.img_url) ? item.img_url[0] : item?.img_url;
  const validQuantities = /^\d+$/.test(sets) && /^\d+$/.test(reps) && Number(sets) >= 1 && Number(sets) <= 100 && Number(reps) >= 1 && Number(reps) <= 1000;

  const onSubmit = async () => {
    if (submitting.current || loading) { return; }
    if (!selectedDay) { Alert.alert('Please select a day of the week.'); return; }
    if (!validQuantities) { Alert.alert('Invalid workout', 'Enter 1–100 sets and 1–1000 repetitions.'); return; }
    submitting.current = true;
    try {
      const result = await savePlannedWorkouts({exercise: item, reps: Number(reps), sets: Number(sets), day: selectedDay, time_of_day: selectedTime});
      if (result) {
        addExercises(result);
        Alert.alert('Success', `${item?.name} is in your plan.`);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Could not add workout', error instanceof Error ? error.message : 'Please try again.');
    } finally { submitting.current = false; }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add to Plan</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Text style={styles.exerciseName}>{item?.name}</Text>
          {imageUrl && <Image source={{uri: imageUrl, cache: 'default'}} style={{width: imageSize, height: imageSize, borderRadius: 20, alignSelf: 'center'}} />}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your workout</Text>
            <View style={styles.quantities}>
              <QuantityInput label="Sets" value={sets} onChange={setSets} maximum={100} />
              <QuantityInput label="Repetitions" value={reps} onChange={setReps} maximum={1000} />
            </View>
            <Text style={styles.hint}>Repetitions in each set</Text>
            <View style={styles.presets}>
              {[8, 10, 12, 15].map(amount => (
                <TouchableOpacity key={amount} accessibilityRole="button" accessibilityLabel={`${amount} reps`}
                  accessibilityState={{selected: reps === String(amount)}} onPress={() => setReps(String(amount))}
                  style={[styles.preset, reps === String(amount) && styles.selected]}>
                  <Text style={[styles.choiceText, reps === String(amount) && styles.selectedText]}>{amount} reps</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time of day</Text>
            <View style={styles.days}>
              {timesOfDay.map(time => (
                <TouchableOpacity key={time} accessibilityRole="button" accessibilityLabel={`Time of day: ${time}`}
                  accessibilityState={{selected: selectedTime === time}} onPress={() => setSelectedTime(time)}
                  style={[styles.day, styles.timeChoice, selectedTime === time && styles.selected]}>
                  <Text style={[styles.choiceText, selectedTime === time && styles.selectedText]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a day</Text>
            <View style={styles.days}>
              {days.map(day => (
                <TouchableOpacity key={day} accessibilityRole="button" accessibilityLabel={day}
                  accessibilityState={{selected: selectedDay === day}} onPress={() => setSelectedDay(day)}
                  style={[styles.day, selectedDay === day && styles.selected]}>
                  <Text style={[styles.choiceText, selectedDay === day && styles.selectedText]}>{day.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.summary}>{validQuantities ? `${sets} sets × ${reps} reps · ${selectedTime}${selectedDay ? ` · ${selectedDay}` : ''}` : 'Set your reps and choose a day.'}</Text>
            <TouchableOpacity accessibilityRole="button" disabled={loading} onPress={onSubmit}
              style={[styles.submit, loading && styles.disabled]}>
              <Text style={styles.submitText}>{loading ? 'Adding…' : 'Add to Plan'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10},
  cancel: {minHeight: 44, width: 70, justifyContent: 'center'},
  cancelText: {fontSize: 16, color: 'black'},
  title: {fontSize: 17, color: 'black'},
  headerSpacer: {width: 70},
  content: {padding: 20, paddingTop: 12, gap: 18, paddingBottom: 32},
  exerciseName: {fontSize: 16, color: 'black', fontWeight: 'bold', textAlign: 'center'},
  section: {gap: 12},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: 'black'},
  quantities: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  quantityCard: {flex: 1, flexBasis: 145, padding: 12, borderRadius: 20, backgroundColor: 'white'},
  fieldLabel: {fontSize: 13, color: '#555', marginBottom: 8},
  stepper: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  stepButton: {width: 44, height: 44, borderRadius: 10, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center'},
  stepText: {fontSize: 24, color: 'white'},
  quantityInput: {flex: 1, minWidth: 40, minHeight: 44, padding: 0, textAlign: 'center', fontSize: 24, fontWeight: '600', color: 'black'},
  hint: {fontSize: 12, color: '#555'},
  presets: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  preset: {minHeight: 44, paddingHorizontal: 14, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  days: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  day: {flexGrow: 1, minWidth: 44, minHeight: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4},
  timeChoice: {minWidth: 84, paddingHorizontal: 10},
  choiceText: {fontSize: 13, color: 'black'},
  selected: {backgroundColor: 'black', borderColor: 'black'},
  selectedText: {color: 'white'},
  footer: {gap: 12},
  summary: {fontSize: 13, color: '#555', textAlign: 'center'},
  submit: {backgroundColor: 'black', borderRadius: 10, minHeight: 50, alignItems: 'center', justifyContent: 'center', padding: 12},
  submitText: {fontSize: 16, fontWeight: '600', color: 'white'},
  disabled: {opacity: 0.35},
});
export default SavedExercise;
