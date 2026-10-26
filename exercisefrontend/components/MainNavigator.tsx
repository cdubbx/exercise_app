import React from 'react';
import {useUserContext} from '../hooks/auth';
import {AuthNavigator, RootStackNavigator} from '../App';

export default function MainNavigator() {
  const {isAuthenticated, isReady} = useUserContext();
  if (!isReady) return null;
  return isAuthenticated ? <RootStackNavigator /> : <AuthNavigator />;
}
