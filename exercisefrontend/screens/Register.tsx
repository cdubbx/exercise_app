import {View, SafeAreaView, TextInput, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {Stack, VStack, Text, HStack} from '@react-native-material/core';
import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useLogin, useRegister} from '../hooks/auth';
import { AuthStackParamList } from '../interfaces/screentypes';
import {appleAuth, AppleButton} from '@invertase/react-native-apple-authentication';


interface RegisterScreenProps {
  navigation: NavigationProp<AuthStackParamList, 'Register'>
}


const Register: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const {register} = useRegister();
  const {appleLogin} = useLogin()

  const onSubmit = async () => {
    try {
      const userData = {
        email: email,
        password: password,
      };

      await register(userData);
      navigation.navigate('OTP', {
        email:email
      });
    } catch (error:any) {
      console.log(error);
      Alert.alert('Registration Error', error.message);  // Display the error message to the user

    }
  };

  async function onAppleButtonPress() {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN, 
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME]
      })

      const {user, email, identityToken} = appleAuthRequestResponse; 
      const appleObject = {
        email:email, 
        id_token: identityToken
      }

      await appleLogin(appleObject)
      navigation.navigate('Tabs')


    } catch (error:any) {
      if (error?.code === appleAuth.Error.CANCELED){
        console.warn('User canceled Apple Sign');
      } else 
      console.error(error);
    }
  }

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

        <View style={styles.container}>
      <AppleButton
        buttonStyle={AppleButton.Style.BLACK}
        buttonType={AppleButton.Type.SIGN_IN}
        style={styles.appleButton}
        onPress={onAppleButtonPress}
      />
    </View>
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  appleButton: {
    width: 200,
    height: 44,
  },
});

export default Register