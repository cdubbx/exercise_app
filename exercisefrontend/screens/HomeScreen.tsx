import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator, ImageBackground, Keyboard, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useUserContext} from '../hooks/auth';
import {useExercises} from '../hooks/exercises';
import {Avatar} from '../components/Avatar';
import {ExploreStackParamList} from '../interfaces/screentypes';
import {Exercise} from '../interfaces/interfaces';
import BodyPartExercise from '../cards/BodyPartExerciseCard';
import {useWalkThrough} from '../utils/TutorialSystemService';
import SpotifyPlayer from '../components/SpotifyPlayer';
import {openTab} from '../services/navigation';

type Props = NativeStackScreenProps<ExploreStackParamList, 'ExplorePage'>;
const bodyParts = [
  {name: 'Biceps', muscle: 'biceps', image: require('../assets/AdobeStock_261117493.jpeg')},
  {name: 'Chest', muscle: 'chest', image: require('../assets/AdobeStock_476125371.jpeg')},
  {name: 'Legs', muscle: 'legs', image: require('../assets/AdobeStock_310385765.jpeg')},
  {name: 'Abs', muscle: 'abdominals', image: require('../assets/AdobeStock_274012804.jpeg')},
  {name: 'Back', muscle: 'back', image: require('../assets/AdobeStock_402679815.jpeg')},
];
const categories = ['Strength', 'Power Lifting', 'Stretching'];

export default function HomeScreen({navigation}: Props): React.JSX.Element {
  const {user} = useUserContext();
  const {searchExercises} = useExercises();
  const tour = useWalkThrough();
  const {register, start, isRunning} = tour;
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);
  const query = search.trim();
  const searching = query.length >= 3;

  useFocusEffect(useCallback(() => { if (!isRunning) { start(); } }, [start, isRunning]));
  useEffect(() => {
    register({id: 'search-bar', order: 1, onActivate: () => openTab('Home1', {screen: 'ExplorePage'})}, true);
    register({id: 'bicep-step', order: 2, onActivate: () => openTab('Home1', {screen: 'ExplorePage'})}, true);
    register({id: 'individual-bicep', order: 3, onActivate: () => openTab('Home1', {screen: 'BodyPart', params: {bodyParts: 'biceps'}})}, true);
  }, [register]);
  useEffect(() => {
    let active = true;
    setSearchError(''); setResults([]);
    if (query.length < 3) { setSearchLoading(false); return; }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchExercises(query);
        if (active) { setResults(data); }
      } catch (failure) {
        if (active) { setSearchError(failure instanceof Error ? failure.message : 'Please try again.'); }
      } finally { if (active) { setSearchLoading(false); } }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, searchExercises, retryVersion]);

  const searchBar = <View style={styles.searchBar}>
    <AntDesign name="search1" size={18} color="#555" />
    <TextInput accessibilityLabel="Search exercises" placeholder="Search exercises or body parts" placeholderTextColor="#777"
      value={search} onChangeText={setSearch} style={styles.searchInput} autoCorrect={false} autoCapitalize="none"
      returnKeyType="search" onSubmitEditing={() => Keyboard.dismiss()} />
    {!!search && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} style={styles.clearButton}>
      <Text style={styles.clearText}>×</Text>
    </TouchableOpacity>}
  </View>;

  return <View style={[styles.screen, {paddingTop: insets.top + 12}]}>
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>Home</Text><Text style={styles.subtitle}>What would you like to train?</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => openTab('Profile1', {screen: 'Profile'})} style={styles.profileButton}>
          <Avatar size={{height: 44, width: 44}} imageUrl={user?.image_url} />
        </TouchableOpacity>
      </View>
      {tour.wrap('search-bar', searchBar, {order: 1, placement: 'bottom', showChildInTooltip: true, content: <Text>Search for an exercise or body part here.</Text>})}
      {query.length > 0 && !searching && <Text style={styles.hint}>Type at least 3 characters to search.</Text>}
      {!searching && <SpotifyPlayer />}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{searching ? 'Search results' : 'Browse by body part'}</Text>
        <Text style={styles.subtitle}>{searching ? `For “${query}”` : 'Choose a muscle group to see exercises.'}</Text>
      </View>
      {searching ? <View style={styles.results}>
        {searchLoading ? <View style={styles.messageCard}><ActivityIndicator color="black" /><Text style={styles.messageText}>Searching exercises…</Text></View> : searchError ? <View accessibilityRole="alert" style={styles.messageCard}>
          <Text style={styles.messageTitle}>Couldn’t search exercises</Text><Text style={styles.messageText}>{searchError}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => setRetryVersion(version => version + 1)} style={styles.retryButton}><Text style={styles.retryLabel}>Try again</Text></TouchableOpacity>
        </View> : results.length === 0 ? <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>No exercises found</Text><Text style={styles.messageText}>Try another exercise name or body part.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => setSearch('')} style={styles.retryButton}><Text style={styles.retryLabel}>Browse body parts</Text></TouchableOpacity>
        </View> : results.map(exercise => <TouchableOpacity key={exercise.id} accessibilityRole="button" accessibilityLabel={`View ${exercise.name}`}
          onPress={() => { Keyboard.dismiss(); navigation.navigate('ExerciseCard', {item: exercise}); }} style={styles.resultCard}>
          <BodyPartExercise item={exercise} />
        </TouchableOpacity>)}
      </View> : <View style={styles.catalog}>
        {bodyParts.map((part, index) => {
          const card = <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Browse ${part.name} exercises`} activeOpacity={0.85}
            onPress={() => {
              Keyboard.dismiss(); navigation.navigate('BodyPart', {bodyParts: part.muscle});
              if (part.muscle === 'biceps' && isRunning) { tour.next(); }
            }}>
            <ImageBackground source={part.image} resizeMode="cover" style={styles.imageCard} imageStyle={styles.image}>
              <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.8)']} locations={[0, 0.35, 1]} pointerEvents="none" style={StyleSheet.absoluteFill} />
              <View style={styles.cardOverlay}>
                <View style={styles.cardHeading}><Text style={styles.bodyPartName}>{part.name}</Text><Text style={styles.cardArrow}>↗</Text></View>
                <View style={styles.categories}>{categories.map(category => <View key={category} style={styles.category}><Text style={styles.categoryText}>{category}</Text></View>)}</View>
              </View>
            </ImageBackground>
          </TouchableOpacity>;
          return <View key={part.muscle}>{index === 0 ? tour.wrap('bicep-step', card, {order: 2, placement: 'bottom', showChildInTooltip: true, closeOnChildInteraction: true, content: <Text>Tap a body part to browse exercises.</Text>}) : card}</View>;
        })}
      </View>}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  content: {paddingHorizontal: 20, paddingBottom: 100},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24},
  heading: {flex: 1, gap: 6},
  title: {fontSize: 26, fontWeight: 'bold', color: 'black'},
  subtitle: {fontSize: 13, color: '#555', lineHeight: 20},
  profileButton: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white'},
  searchBar: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#ddd', paddingLeft: 16, minHeight: 52},
  searchInput: {flex: 1, minHeight: 52, color: 'black', fontSize: 14, paddingHorizontal: 12, paddingVertical: 12},
  clearButton: {width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  clearText: {fontSize: 24, color: '#555'},
  hint: {fontSize: 12, color: '#555', marginTop: 10},
  sectionHeader: {marginTop: 26, marginBottom: 16, gap: 6},
  sectionTitle: {fontSize: 18, fontWeight: '600', color: 'black'},
  catalog: {gap: 16},
  imageCard: {minHeight: 200, borderRadius: 20, overflow: 'hidden'},
  image: {borderRadius: 20},
  cardOverlay: {minHeight: 200, padding: 18, justifyContent: 'space-between', gap: 60},
  cardHeading: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12},
  bodyPartName: {fontSize: 23, fontWeight: '600', color: 'white', flex: 1},
  cardArrow: {fontSize: 24, color: 'white'},
  categories: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  category: {borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.2)'},
  categoryText: {fontSize: 11, fontWeight: '500', color: 'white'},
  results: {gap: 12},
  resultCard: {padding: 14, backgroundColor: 'white', borderRadius: 20},
  messageCard: {padding: 22, backgroundColor: 'white', borderRadius: 20, gap: 12},
  messageTitle: {fontSize: 16, fontWeight: '600', color: 'black'},
  messageText: {fontSize: 14, color: '#555', lineHeight: 21},
  retryButton: {backgroundColor: 'black', borderRadius: 10, minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start'},
  retryLabel: {fontSize: 13, fontWeight: '600', color: 'white'},
});
