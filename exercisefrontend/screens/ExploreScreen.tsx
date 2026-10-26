import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {HStack} from '@react-native-material/core';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import {useUsers} from '../hooks/social';
import {User} from '../interfaces/types';
import {NavigationProp} from '@react-navigation/native';
import {ExploreStackParamList} from '../interfaces/screentypes';
import UsersCard from '../cards/UsersCard';
import {useUploadWorkOuts} from '../hooks/exercises';
import PublicExercises from '../components/PublicExercises';
import FetchedExercise from '../cards/FetchedExercise';

interface ExploreScreenProps {
  navigation: NavigationProp<ExploreStackParamList, 'Explore'>;
}
const ExploreScreen: React.FC<ExploreScreenProps> = ({navigation}) => {
  const [query, setQuery] = useState('');
  const {users, isLoading, fetchUsers, error} = useUsers(query);
  const {publicWorkouts, isLoading: workoutsLoading} = useUploadWorkOuts();

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.container}>
          <HStack style={styles.textInput}>
            <EvilIcons name="search" size={20} />
            <TextInput
              placeholderTextColor={'black'}
              placeholder="Find other users"
              value={query}
              onChangeText={setQuery}
            />
          </HStack>
        </View>
      }
      data={users}
      keyExtractor={item => item.id}
      onEndReached={() => { void fetchUsers(); }}
      ListEmptyComponent={<Text>{error || (isLoading ? 'Loading...' : 'No public profiles found.')}</Text>}
      renderItem={({item}) => (
        <View>
          <UsersCard navigation={navigation} user={item} />
        </View>
      )}
      ListFooterComponent={
        <View style={styles.publicExerciseCard}>
          <Text style={styles.publicExercises}>Public Exercises</Text>

          {publicWorkouts &&
            publicWorkouts.length > 0 &&
            publicWorkouts.slice(0, 1).map((workout, index) => (
              <TouchableOpacity
                key={String(workout.id)}
                onPress={() => {
                  navigation.navigate('PublicWorkoutsScreen', {
                    publicWorkouts: publicWorkouts,
                  });
                }}>
                <FetchedExercise item={workout} />
              </TouchableOpacity>
            ))}
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 80,
    marginHorizontal: 10,
    // alignItems:'center',
    flex: 1,
    justifyContent: 'center',
  },
  textInput: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 20,
    width: '100%',
    gap: 5,
  },
  publicExercises: {
    fontWeight: 'bold',
    fontSize: 23,
    marginTop: 20,
  },
  publicExerciseCard: {
    marginBottom: 20,
    marginLeft: 10,
  },
});

export default ExploreScreen;
