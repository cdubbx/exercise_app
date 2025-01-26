import React, {useEffect} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Login from './screens/Login';
import {Button, even, Provider} from '@react-native-material/core';
import Register from './screens/Register';
import HomeScreen from './screens/HomeScreen';
import {useAuth} from './hooks/auth';
import ExploreScreen from './screens/ExploreScreen';
import ProfileScreen from './screens/ProfileScreen';
import BodyPart from './screens/BodyPart';
import ExerciseCard from './cards/ExerciseCard';
import CalendarCard from './screens/Calendar';
import SavedWorkOuts from './screens/SavedWorkOuts';
import OTPScreen from './screens/OTP';
import {
  AuthStackParamList,
  BottomTabParamList,
  ExploreStackParamList,
  HomeStackParamList,
  ProfileStackParamList,
  ResetPasswordList,
} from './interfaces/screentypes';
import ResetPassword from './screens/ResetPassword';
import ResetPasswordScreen from './screens/ResetPassword';
import RequestResetPassword from './screens/RequestResetPassword';
import {ExerciseProvider} from './context/ExerciseContext';
import {UserContextProvider} from './context/UserContext';
import SavedExercise from './cards/SavedFetchedExercise';
import Settings from './screens/Settings';
import {NowPlayingProvider} from './context/NowPlayContextSpotify';

export default function App(): React.JSX.Element {
  const {isAuthenticated} = useAuth();

  const AuthStack = createNativeStackNavigator<AuthStackParamList>();
  const HomeStack = createNativeStackNavigator<HomeStackParamList>();
  const ResetPassword = createNativeStackNavigator<ResetPasswordList>();
  const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
  const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator<BottomTabParamList>();

  // const BottomTabNavigator = () => {
  //   return (

  //   )
  // }

  const linking = {
    prefixes: ['exercisefrontend://'],
    config: {
      screens: {
        Settings: 'spotify-auth',
        ResetPassword: {
          path: 'reset-password',
          parse: {
            token: (token: string) => token,
            email: (email: string) => email,
          },
        },
      },
    },
  };

  const AuthNavigator = () => {
    return (
      <AuthStack.Navigator
        initialRouteName="Login"
        screenOptions={{headerShown: false}}>
        <AuthStack.Screen name="Login" component={Login} />
        <AuthStack.Screen name="Register" component={Register} />
        <AuthStack.Screen name="Tabs" component={TabNavigator} />
        <AuthStack.Screen name="OTP" component={OTPScreen} />
        <AuthStack.Screen
          name="RequestResetPassword"
          component={RequestResetPassword}
        />
        <AuthStack.Screen
          name="ResetPassword" // Matches linking config
          component={ResetPasswordScreen} // Pass the ResetPasswordStackNavigator here
          options={{headerShown: false}}
        />
      </AuthStack.Navigator>
    );
  };

  const HomeNavigator = () => {
    return (
      <HomeStack.Navigator
        initialRouteName="Home"
        screenOptions={{headerShown: false}}>
        <HomeStack.Screen name="Home" component={HomeScreen} />
        <HomeStack.Screen name="BodyPart" component={BodyPart} />
        <HomeStack.Screen name="ExerciseCard" component={ExerciseCard} />
        <HomeStack.Screen name="Register" component={Register} />
      </HomeStack.Navigator>
    );
  };

  const ExploreNavigator = () => {
    return (
      <ExploreStack.Navigator
        initialRouteName="Explore"
        screenOptions={{headerShown: false}}>
        <ExploreStack.Screen name="Explore" component={ExploreScreen} />
      </ExploreStack.Navigator>
    );
  };

  const ProfileNavigator = () => {
    return (
      <ProfileStack.Navigator
        initialRouteName="Profile"
        screenOptions={{headerShown: false}}>
        <ProfileStack.Screen name="Profile" component={ProfileScreen} />
        <ProfileStack.Screen name="SavedExercises" component={SavedExercise} />
        <ProfileStack.Screen name="Settings" component={Settings} />
      </ProfileStack.Navigator>
    );
  };

  const TabNavigator = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home1"
        screenOptions={{headerShown: false}}>
        <Tab.Screen name="Home1" component={HomeNavigator} />
        <Tab.Screen name="Calendar" component={CalendarCard} />
        <Tab.Screen name="Explore1" component={ExploreNavigator} />
        <Tab.Screen name="Profile1" component={ProfileNavigator} />
      </Tab.Navigator>
    );
  };

  return (
    <NowPlayingProvider>
      <UserContextProvider>
        <ExerciseProvider>
          <NavigationContainer linking={linking}>
            {isAuthenticated ? <TabNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </ExerciseProvider>
      </UserContextProvider>
    </NowPlayingProvider>
  );
}
