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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useLogin, useResetPassword} from '../hooks/auth';
import appleAuth, {
  AppleButton,
} from '@invertase/react-native-apple-authentication';

type RootStackParamList = {
  Register: undefined; // Add other screens as needed
  Tabs: undefined;
  RequestResetPassword: undefined; // Add the reset password screen route
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

export default function Login(): React.JSX.Element {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {login, appleLogin} = useLogin();
  const {requestPasswordReset} = useResetPassword(); // Hook for reset password
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async () => {
    try {
      const isSuccess = await login(email, password);
      if (isSuccess) {
        navigation.navigate('Tabs');
      }
    } catch (error: any) {
      console.log('Login failed:', error.message);
      Alert.alert('Login Error', error.message);
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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        'Error',
        'Please enter your email address to reset your password.',
      );
      return;
    }

    setLoading(true);
    try {
      const message = await requestPasswordReset(email);
      Alert.alert('Success', message);
    } catch (error: any) {
      console.log('Reset password error:', error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView>
      <Stack mt={80}>
        <Stack style={styles.headerStack}>
          <Text style={styles.signInText}>Sign in</Text>
        </Stack>
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

        <VStack style={styles.buttonStack}>
          <Stack style={styles.buttonContainer}>
            <TouchableOpacity onPress={onSubmit} style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </Stack>

          <TouchableOpacity
            onPress={() => {
              navigation.navigate('RequestResetPassword');
            }}
            style={styles.link}>
            <Text style={styles.linkText}>
              {loading ? 'Sending reset link...' : 'Forgot Password?'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => navigation.navigate('Register')}
            style={styles.link}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>
          <HStack style={styles.divider}>
            <View style={styles.dividerLine}></View>
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine}></View>
          </HStack>
          
          <AppleButton
            buttonStyle={AppleButton.Style.BLACK}
            buttonType={AppleButton.Type.SIGN_IN}
            style={styles.appleButton}
            onPress={onAppleButtonPress}
          />
        </VStack>
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    margin: 16,
    width: 300,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 50,
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 80,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 10,
  },
  linkText: {
    color: 'black',
    fontSize: 14,
  },
  headerStack: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 40,
    flexDirection: 'row',
  },
  inputStack: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 5,
    flexDirection: 'column',
  },
  buttonStack: {
    marginTop: -30,
    alignItems: 'center',
    padding: 40,
    justifyContent: 'center',
  },
  buttonContainer: {
    gap: 10,
  },
  signInText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  appleButton: {
    width: 200,
    height: 44,
    marginTop: 50,
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
});
