import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { useAuth, useUserContext } from '../hooks/auth'
import { AuthNavigator, TabNavigator } from '../App'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function MainNavigator() {
    const {token, setToken} = useUserContext()
  const {checkToken, isAuthenticated} = useAuth()


    useEffect(() => {     
        const handleToken = async () => {
            // const accessToken = await AsyncStorage.getItem("access");
            // const refreshToken = await AsyncStorage.getItem("refresh");
            // if (accessToken && refreshToken) {
              await checkToken();
              
              // setToken({ access: accessToken, refresh: refreshToken });
        }   
        handleToken()
    }, [token])
    return isAuthenticated ? <TabNavigator /> : <AuthNavigator />;
}