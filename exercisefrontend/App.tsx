/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
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



import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Login from './screens/Login';
import { Button, Provider } from '@react-native-material/core';
import Register from './screens/Register';
import HomeScreen from './screens/HomeScreen';
import { useAuth } from './hooks/auth';
import ExploreScreen from './screens/ExploreScreen';
import ProfileScreen from './screens/ProfileScreen';
import BodyPart from './screens/BodyPart';
import ExerciseCard from './cards/ExerciseCard';
import CalendarCard from './screens/Calendar';
import SavedWorkOuts from './screens/SavedWorkOuts';
import OTPScreen from './screens/OTP';
import { AuthStackParamList, BottomTabParamList, ExploreStackParamList, HomeStackParamList, ProfileStackParamList } from './types/screentypes';


export default function App(): React.JSX.Element {
  
  const {isAuthenticated} = useAuth()
  



  const AuthStack = createNativeStackNavigator<AuthStackParamList>();
  const HomeStack = createNativeStackNavigator<HomeStackParamList>()
  const ExploreStack = createNativeStackNavigator<ExploreStackParamList>()
  const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()
  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator<BottomTabParamList>()




  // const BottomTabNavigator = () => {
  //   return (

  //   )
  // }

  const AuthNavigator = () => {
    return (
      <AuthStack.Navigator initialRouteName='Login' screenOptions={{headerShown:false}} >
        <AuthStack.Screen name='Login' component={Login} />
        <AuthStack.Screen name='Register' component={Register} />
        <AuthStack.Screen name='Tabs' component = {TabNavigator} />
        <AuthStack.Screen name = 'OTP' component={OTPScreen} />
      </AuthStack.Navigator>
    );
  }
  
  const HomeNavigator = () => {
    return(
        <HomeStack.Navigator initialRouteName='Home' screenOptions={{headerShown:false}}>
           <HomeStack.Screen name='Home' component = {HomeScreen} />
           <HomeStack.Screen name='BodyPart' component={BodyPart} />
           <HomeStack.Screen name='ExerciseCard' component={ExerciseCard} />
           <HomeStack.Screen name='Register' component={Register} />

        </HomeStack.Navigator>
    )
  
  }

  const ExploreNavigator = () => {

    return(
       <ExploreStack.Navigator initialRouteName='Explore' screenOptions={{headerShown:false}}>
        <ExploreStack.Screen name='Explore' component={ExploreScreen} />
      </ExploreStack.Navigator>
    )
     
  }

  const ProfileNavigator = () => {
    return (
       <ProfileStack.Navigator initialRouteName='Profile' screenOptions={{headerShown:false}}>
      <ProfileStack.Screen name='Profile' component={ProfileScreen} />
      <ProfileStack.Screen name='SavedWorkouts' component={SavedWorkOuts} />
    </ProfileStack.Navigator>
    )
   
  }


  const TabNavigator = () => {
    return(
      <Tab.Navigator initialRouteName='Home1' screenOptions={{headerShown:false}} >
          <Tab.Screen name='Home1' component={HomeNavigator} />
          <Tab.Screen name='Calendar' component={CalendarCard} />
          <Tab.Screen name = 'Explore1' component={ExploreNavigator} />
          <Tab.Screen name='Profile1' component={ProfileNavigator} />
      </Tab.Navigator>

    )
  }


  return (
  

       <NavigationContainer>

        {isAuthenticated ? <TabNavigator /> : <AuthNavigator /> }
   
    </NavigationContainer>
    

    

          

  
 
  );
}

