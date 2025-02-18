import React, {useEffect, useState} from 'react';
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
import {getAuthToken, useAuth, useUser, useUserContext} from './hooks/auth';
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
  CalendarParamList,
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
import OtherUserScreen from './screens/OtherUserScreen';
import WorkoutForm from './screens/WorkoutForm';
import PublicExercises from './components/PublicExercises';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainNavigator from './components/MainNavigator';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ResetPasswordStack = createNativeStackNavigator<ResetPasswordList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<BottomTabParamList>();
const CalendarStack = createNativeStackNavigator<CalendarParamList>();


export const AuthNavigator = () => {
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

 const CalendarNavigator = () => {
  return (
    <CalendarStack.Navigator 
    initialRouteName='Calendar'
    screenOptions={{headerShown:false}}>
      <CalendarStack.Screen name='Calendar' component={CalendarCard} />
      <CalendarStack.Screen name='SavedExerciseList' component={SavedWorkOuts} />
      <CalendarStack.Screen name='SavedExercises' component={SavedExercise} />
    </CalendarStack.Navigator>
  )
 }

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
      <ExploreStack.Screen name="OtherUser" component={OtherUserScreen} />
      <ExploreStack.Screen
        name="PublicWorkoutsScreen"
        component={PublicExercises}
      />
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
      <ProfileStack.Screen
        name="SavedExerciseList"
        component={SavedWorkOuts}
      />
      <ProfileStack.Screen name="Settings" component={Settings} />
      <ProfileStack.Screen name="AddWorkoutScreen" component={WorkoutForm} />
      <ProfileStack.Screen name= "Login1" component={AuthNavigator} />
    </ProfileStack.Navigator>
  );
};

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home1"
      screenOptions={{headerShown: false}}>
      <Tab.Screen
        name="Home1"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({focused}) => {
            return <Entypo name="home" size={focused ? 30: 26} />;
          },
          tabBarLabel: 'Home',
          tabBarLabelStyle: {color: 'black'},
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarNavigator}
        options={{
          tabBarIcon: ({focused}) => {
            return <Entypo name="calendar" size={focused ? 30: 26} />;
          },
          tabBarLabel: 'Calendar',
          tabBarLabelStyle: {color: 'black'},
        }}
      />
      <Tab.Screen
        name="Explore1"
        component={ExploreNavigator}
        options={{
          tabBarIcon: ({focused}) => {
            return <AntDesign name="search1" size={focused ? 30: 26} />;
          },
          tabBarLabel: 'Explore',
          tabBarLabelStyle: {color: 'black'},
        }}
      />
      <Tab.Screen
        name="Profile1"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({focused}) => {
            return <AntDesign name="user" size={focused ? 30: 26} />;
          },
          tabBarLabel: 'Profile',
          tabBarLabelStyle: {color: 'black'},
        }}
      />
    </Tab.Navigator>
  );
};
export default function App(): React.JSX.Element {
  const {checkToken, isAuthenticated} = useAuth();
  const [token, setToken] = useState<string | null>(null);




  
  useEffect(() => {
    const handleGetAuth = async () => {
      checkToken()
     const fetchedToken = await AsyncStorage.getItem("access");
     console.log(fetchedToken); 
     if(!fetchedToken) setToken(null);
    }
    console.log("Token is null", token);
    
    handleGetAuth();
  }, [token])
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


  return (
    <NowPlayingProvider>
      <UserContextProvider>
        <ExerciseProvider>
          <NavigationContainer linking={linking}>
            <MainNavigator />
          </NavigationContainer>
        </ExerciseProvider>
      </UserContextProvider>
    </NowPlayingProvider>
  );
}
