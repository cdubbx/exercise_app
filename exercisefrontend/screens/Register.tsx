import {
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import {Stack, VStack, Text, HStack} from '@react-native-material/core';
import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useLogin, useRegister} from '../hooks/auth';
import {AuthStackParamList} from '../interfaces/screentypes';
import {
  appleAuth,
  AppleButton,
} from '@invertase/react-native-apple-authentication';

interface RegisterScreenProps {
  navigation: NavigationProp<AuthStackParamList, 'Register'>;
}

const Register: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const {register} = useRegister();
  const {appleLogin} = useLogin();

  const onSubmit = async () => {
    try {
      const userData = {
        email: email,
        password: password,
      };

      await register(userData);
      navigation.navigate('OTP', {
        email: email,
      });
    } catch (error: any) {
      console.log(error);
      Alert.alert('Registration Error', error.message); // Display the error message to the user
    }
  };

  async function onAppleButtonPress() {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const {user, email, identityToken} = appleAuthRequestResponse;
      const appleObject = {
        email: email,
        id_token: identityToken,
      };

      await appleLogin(appleObject);
      navigation.navigate('Tabs');
    } catch (error: any) {
      if (error?.code === appleAuth.Error.CANCELED) {
        console.warn('User canceled Apple Sign');
      } else console.error(error);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack>
        <Stack justify="center" items="center" >
          <Text style={styles.signUpText}>Execise App</Text>
        </Stack>
        <Stack
          justify="center"
          items="center"
          mt={20}
          spacing={5}
          direction="column">
          <Stack style={styles.inputStack}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              onChangeText={text => setEmail(text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={true}
              onChangeText={text => setPassword(text)}
            />
          </Stack>
        </Stack>

        <VStack style={styles.buttonStack}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.button}
            onPress={onSubmit}>
            <Text style={styles.buttonText}>Sign up</Text>
          </TouchableOpacity>
          <HStack style={styles.alreadyUserStack}>
            <Text>Already a user</Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Login');
              }}>
              <Text>Login</Text>
            </TouchableOpacity>
          </HStack>

               <HStack style={styles.divider}>
                      <View style={styles.dividerLine}></View>
                      <Text style={styles.dividerText}>Or</Text>
                      <View style={styles.dividerLine}></View>
                    </HStack>

          <View>
            <AppleButton
              buttonStyle={AppleButton.Style.BLACK}
              buttonType={AppleButton.Type.SIGN_IN}
              style={styles.appleButton}
              onPress={onAppleButtonPress}
            />
          </View>
        </VStack>
      </Stack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex:1,
    marginTop:80
  },
  appleButton: {
    width: 200,
    height: 44,
    marginTop:50,
  },
  input: {
    margin: 16,
    width: 300,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  inputStack: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    flexDirection: 'column',
    marginBottom: 10,

  },
  alreadyUserStack: {
    justifyContent: 'center',
    marginTop:10,
    gap:10
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 60,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonStack: {
    // marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:30,
  },
  divider: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  signUpText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop:20,
    marginBottom:50,
  },
});

export default Register;
