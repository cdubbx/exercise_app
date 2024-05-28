import {View, SafeAreaView, TextInput, TouchableOpacity, Alert} from 'react-native';
import {Stack, VStack, Text, HStack} from '@react-native-material/core';
import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useRegister} from '../hooks/auth';

type RootStackParamList = {
  Tabs: undefined;
  Login: undefined;
};

export default function Register(): React.JSX.Element {
  const [email, setEmail] = useState<String>('');
  const [password, setPassword] = useState<String>('');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const {register} = useRegister();

  const onSubmit = async () => {
    try {
      const userData = {
        email: email,
        password: password,
      };

      await register(userData);
      navigation.navigate('Tabs');
    } catch (error:any) {
      console.log(error);
      Alert.alert('Registration Error', error.message);  // Display the error message to the user

    }
  };

  return (
    <SafeAreaView>
      <Stack mt={80}>
        <Stack justify="center" items="center" pb={40}>
          <Text>Execise App</Text>
        </Stack>
        <Stack
          justify="center"
          items="center"
          mt={20}
          spacing={5}
          direction="column">
          <TextInput
            style={{margin: 16, width: 300, backgroundColor: '#f0f0f0'}}
            placeholder="email"
            onChangeText={text => {
              setEmail(text);
              console.log(text);
            }}
          />
          <TextInput
            style={{margin: 16, width: 300, backgroundColor: '#f0f0f0'}}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={text => {
              setPassword(text);
              console.log(text);
            }}
          />
        </Stack>
        <HStack mt={-30} items={'center'} p={40} justify="center">
          <TouchableOpacity activeOpacity={1} onPress={onSubmit}>
            <Text>Sign up</Text>
          </TouchableOpacity>
        </HStack>

        <HStack>
          <Text>Already a user</Text>
          <TouchableOpacity onPress={() => {
            navigation.navigate('Login')
          }}>
          <Text>Login</Text>
          </TouchableOpacity>
        </HStack>
      </Stack>
    </SafeAreaView>
  );
}
