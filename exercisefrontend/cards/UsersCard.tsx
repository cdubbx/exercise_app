import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {NavigationProp} from '@react-navigation/native';
import {ExploreStackParamList} from '../interfaces/screentypes';
import {User as UserType} from '../interfaces/types';
import {Avatar} from '../components/Avatar';
import {useUserContext} from '../hooks/auth';

interface UserCardProps {
  navigation: NavigationProp<ExploreStackParamList, 'Explore'>;
  user: UserType;
  
}

const UsersCard: React.FC<UserCardProps> = ({navigation, user}) => {
  const {user: User} = useUserContext();
  const authUser = User;
  const isOtherUser = User?.id != user.id;
  const size = {
    height: 60, 
    width: 60
  }
  return (
    <View>
      {!isOtherUser ? (
        <View style={styles.container}>
          <Avatar size = {size ? size : undefined} imageUrl={user.image_url} />
          <Text style={styles.usernameText}>{user.username}</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('OtherUser', {
              user: user,
            });
          }}>
          <View style={styles.container}>
            <Avatar size = {size ? size : undefined} imageUrl={user.image_url} />
            <Text style={styles.usernameText}>{user.username}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UsersCard;

const styles = StyleSheet.create({
  usernameText: {
    fontSize:10,
    width:'70%',
  }, 
  container: {
    gap:5,
    width:'30%',
    marginLeft:10,
    marginTop:10
  }
});
