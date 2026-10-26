import React, {useEffect, useRef} from 'react';
import {ActivityIndicator, FlatList, ImageBackground, ListRenderItemInfo, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useMuscleExercise} from '../hooks/exercises';
import BodyPartExercise from '../cards/BodyPartExerciseCard';
import {HomeStackParamList} from '../interfaces/screentypes';
import {Exercise} from '../interfaces/interfaces';
import {useWalkThrough} from '../utils/TutorialSystemService';
import {openTab} from '../services/navigation';

interface Props {
  navigation: NavigationProp<HomeStackParamList, 'BodyPart'>;
  route: RouteProp<HomeStackParamList, 'BodyPart'>;
}
const legGroups = [
  {name: 'Glutes', muscle: 'glutes', image: require('../assets/AdobeStock_379171391.jpeg')},
  {name: 'Hamstrings', muscle: 'hamstrings', image: require('../assets/AdobeStock_287421213.jpeg')},
  {name: 'Quads', muscle: 'quadriceps', image: require('../assets/AdobeStock_442546175.jpeg')},
];
export default function BodyPart({route, navigation}: Props) {
  const parts = route.params.bodyParts;
  const title = parts.charAt(0).toUpperCase() + parts.slice(1);
  const {top} = useSafeAreaInsets();
  const {loading, bodyExercises, loadMoreExercises, loadingMore, error, hasMore, refresh} = useMuscleExercise(parts);
  const tour = useWalkThrough();
  const {register} = tour;
  const exerciseRef = useRef<FlatList<Exercise>>(null);
  useEffect(() => {
    register({id: 'save-button', order: 4, showChildInTooltip: false, placement: 'bottom', onActivate: () => {
      const first = bodyExercises[0];
      if (!first) { return; }
      exerciseRef.current?.scrollToOffset({offset: 0, animated: true});
      openTab('Home1', {screen: 'ExerciseCard', params: {item: first}});
    }}, true);
  }, [register, bodyExercises]);

  const button = (label: string, onPress: () => void) => <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
  const renderItem = ({item, index}: ListRenderItemInfo<Exercise>) => {
    const card = <View collapsable={false}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${item.name}`} style={styles.row} onPress={() => navigation.navigate('ExerciseCard', {item})}><BodyPartExercise item={item} /></TouchableOpacity></View>;
    return index === 0 ? tour.wrap('individual-bicep', card, {order: 3, placement: 'bottom', showChildInTooltip: false, content: <Text>Tap an exercise to see its instructions and save it.</Text>}) : card;
  };
  return <View style={[styles.screen, {paddingTop: top}]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity>
      <View style={styles.heading}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{parts === 'legs' ? 'Choose a muscle group' : 'Find an exercise to add to your workouts'}</Text></View>
    </View>
    {parts === 'legs' ? <ScrollView contentContainerStyle={styles.groups} showsVerticalScrollIndicator={false}>
      {legGroups.map(group => <TouchableOpacity key={group.muscle} accessibilityRole="button" accessibilityLabel={`Browse ${group.name} exercises`} onPress={() => navigation.navigate('BodyPart', {bodyParts: group.muscle})}>
        <ImageBackground source={group.image} style={styles.group} imageStyle={styles.groupImage}>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
          <View style={styles.groupLabel}><Text style={styles.groupName}>{group.name}</Text><Text style={styles.groupArrow}>↗</Text></View>
        </ImageBackground>
      </TouchableOpacity>)}
    </ScrollView> : <FlatList key={parts} ref={exerciseRef} data={bodyExercises} renderItem={renderItem} keyExtractor={item => String(item.id)} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
      refreshing={loading && bodyExercises.length > 0} onRefresh={refresh}
      onEndReachedThreshold={0.3} onEndReached={() => { if (hasMore && !error && !loading) { loadMoreExercises(); } }}
      ListEmptyComponent={<View style={styles.message}>{loading ? <><ActivityIndicator color="black" /><Text style={styles.messageText}>Loading exercises…</Text></> : <><Text style={styles.messageTitle}>{error ? 'Couldn’t load exercises' : 'No exercises yet'}</Text><Text style={styles.messageText}>{error ? 'Check your connection and try again.' : 'Try another muscle group or check again later.'}</Text>{button('Try again', refresh)}</>}</View>}
      ListFooterComponent={bodyExercises.length > 0 ? <View style={styles.footer}>{loadingMore ? <ActivityIndicator color="black" /> : error ? <><Text style={styles.messageText}>Couldn’t load more exercises.</Text>{button('Retry loading more', loadMoreExercises)}</> : hasMore ? button('Load more exercises', loadMoreExercises) : <Text style={styles.messageText}>You’ve reached the end</Text>}</View> : null}
    />}
  </View>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  header: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12},
  back: {width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'},
  backText: {fontSize: 30, lineHeight: 34, color: 'black'},
  heading: {flex: 1, gap: 4}, title: {fontSize: 20, fontWeight: '600', color: 'black'},
  subtitle: {fontSize: 12, color: '#555'},
  list: {paddingHorizontal: 20, paddingTop: 4, paddingBottom: 90, flexGrow: 1},
  row: {padding: 10, backgroundColor: 'white', borderRadius: 12, marginBottom: 8},
  message: {padding: 22, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', gap: 12, marginTop: 8},
  messageTitle: {fontSize: 16, fontWeight: '600', color: 'black'},
  messageText: {fontSize: 13, lineHeight: 20, color: '#555', textAlign: 'center'},
  button: {minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', borderRadius: 10},
  buttonText: {fontSize: 13, fontWeight: '600', color: 'white'},
  footer: {alignItems: 'center', paddingVertical: 18, gap: 10},
  groups: {paddingHorizontal: 20, paddingTop: 4, paddingBottom: 90, gap: 12},
  group: {height: 144, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end'},
  groupImage: {borderRadius: 14},
  groupLabel: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16},
  groupName: {fontSize: 18, fontWeight: '600', color: 'white'}, groupArrow: {fontSize: 22, color: 'white'},
});
