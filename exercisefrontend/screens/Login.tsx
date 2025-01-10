import {
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import {Stack, VStack, Text} from '@react-native-material/core';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useLogin, useResetPassword} from '../hooks/auth';

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
  const {login} = useLogin();
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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address to reset your password.');
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
        <Stack
          justify="center"
          items="center"
          spacing={10}
          pb={40}
          direction="row">
          <Text>Sign in to</Text>
          <Text>Exercise App</Text>
        </Stack>
        <Stack
          justify="center"
          items="center"
          mt={20}
          spacing={5}
          direction="column">
          <TextInput
            style={styles.input}
            placeholder="Email"
            onChangeText={(text) => setEmail(text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={(text) => setPassword(text)}
          />
        </Stack>

        <VStack mt={-30} items="center" p={40} justify="center">
          <TouchableOpacity onPress={onSubmit} style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('RequestResetPassword')
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
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 10,
  },
  linkText: {
    color: '#007BFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});