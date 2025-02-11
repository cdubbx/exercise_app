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
  const {users, isLoading} = useUsers();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const {publicWorkouts, isLoading: workoutsLoading} = useUploadWorkOuts();

  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery === '') {
      setFilteredUsers([]);
      return;
    }
    setFilteredUsers(
      users.filter(
        user =>
          user?.username &&
          user.username.toLowerCase().startsWith(trimmedQuery),
      ),
    );
  };

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.container}>
          <HStack style={styles.textInput}>
            <EvilIcons name="search" size={20} />
            <TextInput
              placeholderTextColor={'black'}
              placeholder="Find other users"
              onChangeText={text => handleSearch(text)}
            />
          </HStack>
        </View>
      }
      data={filteredUsers}
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
    marginLeft:10,
  },
});

export default ExploreScreen;
