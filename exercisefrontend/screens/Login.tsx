import {
  View,
  SafeAreaView,
  TextInput,
  Touchable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Stack, VStack, Text, HStack} from '@react-native-material/core';
import React, { useState } from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useLogin} from '../hooks/auth';

type RootStackParamList = {
  Register: undefined; // Add other screens as needed
  // OtherScreen: undefined;
  Tabs: undefined;
};
type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

export default function Login(): React.JSX.Element {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {login} = useLogin();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const onSubmit = async () => {
    try {
      const isSuccess = await login(email, password);
      if (isSuccess) {
        navigation.navigate('Tabs');
      }
    } catch (error:any) {
      console.log('Login failed:', error.message);
      Alert.alert('Login Error', error.message);  // Display the error message to the user
    }
  };

  return (
    <SafeAreaView>
      <Stack mt={80}>
        <Stack
          justify="center"
          items="center"
          spacing={10}
          pb={40}
          direction="row">
          <Text>Sign in to</Text>
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

        <VStack mt={-30} items={'center'} p={40} justify="center">
          <TouchableOpacity onPress={onSubmit}>
            <Text>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => navigation.navigate('Register')}>
            <Text>Create account</Text>
          </TouchableOpacity>
        </VStack>
      </Stack>
    </SafeAreaView>
  );
}
