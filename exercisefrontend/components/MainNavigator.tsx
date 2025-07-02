import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { useUserContext } from '../hooks/auth'
import { AuthNavigator, TabNavigator } from '../App'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function MainNavigator({isAuthenticated}:any) {
    return isAuthenticated ? <TabNavigator /> : <AuthNavigator />;
}