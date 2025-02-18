import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {HStack, Stack} from '@react-native-material/core';
import {
  useAuth,
  useDeleteProfile,
  useLogout,
  useSpotify,
  useSpotifyContext,
  useUpdateUser,
  useUserContext,
} from '../hooks/auth';
import {NavigationProp} from '@react-navigation/native';
import {ProfileStackParamList} from '../interfaces/screentypes';

interface SettingsProp {
  navigation: NavigationProp<ProfileStackParamList, 'Settings'>;
}
interface UserPrivacySettings {
  is_private: boolean | undefined;
  is_searchable: boolean | undefined;
}

const Settings: React.FC<SettingsProp> = ({navigation}) => {
  const {isPlaying, toggleIsPlaying} = useSpotifyContext();
  const {updateUser, isLoading: settingsLoading} = useUpdateUser();
  const {logout} = useLogout();
  const {user, isAuthenticated, setIsAuthenticated} = useUserContext();
  const {deleteProfile, isLoading: deleteLoading} = useDeleteProfile();
  const {
    isLoading,
    authenticateWithSpotify,
    fetchNowPlaying,
    getCurrentSession,
  } = useSpotify();
  const [userInfo, setUserInfo] = useState<UserPrivacySettings>({
    is_private: user?.is_private,
    is_searchable: user?.is_searchable,
  });
  const {checkToken} = useAuth();

  const toggeIsPrivate = () => {
    setUserInfo(prev => ({
      ...prev,
      is_private: !prev.is_private,
    }));
  };

  const handleLogout = async () => {
    const isLoggedOut = await logout();
    await checkToken();
    // if(isLoggedOut && !isAuthenticated)  navigation.reset({
    //   index: 0,
    //   routes: [{ name: 'Login1' }],
    // });;
  };

  const toggeIsSearchable = () => {
    setUserInfo(prev => ({
      ...prev,
      is_searchable: !prev.is_searchable,
    }));
  };

  useEffect(() => {
    if(userInfo.is_private != user?.is_private || userInfo.is_searchable != user?.is_searchable )
    updateUser(userInfo);
  }, [userInfo.is_private, userInfo.is_searchable]);
  return (
    <View style={styles.container}>
      <HStack style={styles.settingsHeaderStack}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}>
          <Ionicons
            style={{alignSelf: 'flex-start'}}
            name="arrow-back-circle"
            size={26}
          />
        </TouchableOpacity>
      </HStack>
      <Text style={styles.settingsHeader}>Settings Screen</Text>

      <Stack style={styles.toggleVStack}>
        <HStack style={styles.toggleStack}>
          <Text>Show Spotify Now Playing</Text>
          <Switch onValueChange={toggleIsPlaying} value={isPlaying} />
        </HStack>
        <HStack style={styles.toggleStack}>
          <Text>Set you profile to private</Text>
          <Switch
            onValueChange={toggeIsPrivate}
            value={userInfo.is_private}></Switch>
        </HStack>
        <HStack style={styles.toggleStack}>
          <Text>Make your profile searchable </Text>
          <Switch
            onValueChange={toggeIsSearchable}
            value={userInfo.is_searchable}></Switch>
        </HStack>
        <HStack style={styles.toggleStack}>
          <Text>Logout</Text>
          <TouchableOpacity
            onPress={() => {
              handleLogout();
            }}>
            <MaterialCommunityIcons name="logout" size={26} />
          </TouchableOpacity>
        </HStack>

        <HStack style={styles.toggleStack}>
          <Text>Delete Profile</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    onPress: async () => {
                      await deleteProfile();
                    },
                    style: 'destructive',
                  },
                ],
              );
            }}>
            <AntDesign name="deleteuser" size={30} />
          </TouchableOpacity>
        </HStack>
      </Stack>
      <TouchableOpacity onPress={authenticateWithSpotify}>
        <HStack style={styles.spotifyButton}>
          <Entypo name="spotify" color={'green'} size={40} />
          <Stack>
            <Text style={styles.textListen}>Connect to</Text>
            <Text style={styles.spotifyText}>Spotify</Text>
          </Stack>
        </HStack>
      </TouchableOpacity>

      {/* <TouchableOpacity
        onPress={() => {
          navigation.navigate('AddWorkoutScreen');
        }}>
        <Text>Upload a work</TouchableOpacity>out</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  spotifyButton: {
    backgroundColor: 'black',
    borderRadius: 10,
    padding: 10,
    width: '50%',
    gap: 10,
    marginTop: 50,
  },
  textListen: {
    color: 'green',
    fontSize: 30,
  },
  spotifyText: {
    color: 'white',
    fontSize: 30,
  },
  toggleStack: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    width: '100%',
    justifyContent: 'space-between',
  },
  toggleVStack: {
    gap: 10,
    width: '100%',
  },

  settingsHeader: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginLeft: -10,
    marginBottom: 20,
    // alignSelf:'center'
    // textAlign:'center',
  },
  settingsHeaderStack: {
    width: '100%',
    marginLeft: 20,
  },
});

export default Settings;
