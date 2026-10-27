import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Text} from '@react-native-material/core';
import {NavigationProp} from '@react-navigation/native';
import {useLogin, useRegister} from '../hooks/auth';
import {AuthStackParamList} from '../interfaces/screentypes';
import {appleAuth, AppleButton} from '@invertase/react-native-apple-authentication';

interface RegisterScreenProps {
  navigation: NavigationProp<AuthStackParamList, 'Register'>;
}

const Register: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {register} = useRegister();
  const {appleLogin} = useLogin();

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Create account', 'Enter your email and choose a password to continue.');
      return;
    }
    setLoading(true);
    try {
      await register({email: email.trim(), password});
      navigation.navigate('OTP', {email: email.trim()});
    } catch (error: any) {
      Alert.alert('Could not create account', error.message || 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  async function onAppleButtonPress() {
    try {
      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      await appleLogin({email: response.email, id_token: response.identityToken});
    } catch (error: any) {
      if (error?.code !== appleAuth.Error.CANCELED) {
        Alert.alert('Apple sign in', error.message || 'Apple sign in could not be completed.');
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.brand}>Exercise Plus+</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Build a routine that feels good and keeps you moving.</Text>

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#777"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a password"
              placeholderTextColor="#777"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
            />
            <TouchableOpacity disabled={loading} onPress={onSubmit} style={[styles.primary, loading && styles.disabled]}>
              <Text style={styles.primaryText}>{loading ? 'Creating account…' : 'Create account'}</Text>
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'ios' && (
              <>
                <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
                <AppleButton buttonStyle={AppleButton.Style.WHITE_OUTLINE} buttonType={AppleButton.Type.SIGN_UP} style={styles.appleButton} onPress={onAppleButtonPress} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  safeArea: {flex: 1, backgroundColor: '#f2f2f2'},
  scroll: {flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 22},
  card: {width: '100%', maxWidth: 440, padding: 24, borderRadius: 12, backgroundColor: 'white'},
  brand: {color: 'black', fontSize: 14, fontWeight: '600'},
  title: {marginTop: 28, color: 'black', fontSize: 26, fontWeight: 'bold'},
  subtitle: {marginTop: 8, marginBottom: 24, color: '#555', fontSize: 14, lineHeight: 21},
  label: {marginBottom: 8, color: '#333', fontSize: 13, fontWeight: '600'},
  input: {height: 50, marginBottom: 18, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: 'white', color: 'black', fontSize: 15},
  primary: {minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'black'},
  disabled: {opacity: 0.65},
  primaryText: {color: 'white', fontSize: 15, fontWeight: '600'},
  footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 24},
  footerText: {color: '#555', fontSize: 14},
  link: {color: 'black', fontSize: 14, fontWeight: '600'},
  divider: {flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22},
  dividerLine: {height: 1, flex: 1, backgroundColor: '#ddd'},
  dividerText: {color: '#555', fontSize: 11, fontWeight: '600'},
  appleButton: {width: '100%', height: 48},
});

export default Register;
