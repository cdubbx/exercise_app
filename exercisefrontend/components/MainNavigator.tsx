import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { useUserContext } from '../hooks/auth'
import { AuthNavigator, TabNavigator } from '../App'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function MainNavigator() {
    const {token, setToken} = useUserContext()

    useEffect(() => {     
        const handleToken = async () => {
            const accessToken = await AsyncStorage.getItem("access");
            const refreshToken = await AsyncStorage.getItem("refresh");
            if (accessToken && refreshToken) {
              setToken({ access: accessToken, refresh: refreshToken });
            } else {
              setToken(null); 
            }
        }   
        handleToken()
    }, [token])
    return token ? <TabNavigator /> : <AuthNavigator />;
}