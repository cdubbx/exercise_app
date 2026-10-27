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
import {useNavigation} from '@react-navigation/native';
import {useResetPassword} from '../hooks/auth';

const RequestResetPassword: React.FC = () => {
  const navigation = useNavigation<any>();
  const {requestPasswordReset, isLoading} = useResetPassword();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleRequestPasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email address linked to your account.');
      return;
    }
    try {
      const message = await requestPasswordReset({email: email.trim()});
      setSent(true);
      Alert.alert('Check your inbox', message || 'If an account matches that email, a reset link is on its way.');
    } catch (error: any) {
      Alert.alert('Could not send reset link', error.message || 'Please try again in a moment.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.brand}>Exercise Plus+</Text>
            <Text style={styles.title}>{sent ? 'Check your email' : 'Forgot password?'}</Text>
            <Text style={styles.subtitle}>
              {sent
                ? 'Open the reset link from your email on this computer or phone to choose a new password.'
                : 'Enter the email address on your account. We’ll send you a secure link to reset your password.'}
            </Text>
            {!sent && (
              <>
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
                  returnKeyType="send"
                  onSubmitEditing={handleRequestPasswordReset}
                />
                <TouchableOpacity disabled={isLoading} onPress={handleRequestPasswordReset} style={[styles.primary, isLoading && styles.disabled]}>
                  <Text style={styles.primaryText}>{isLoading ? 'Sending link…' : 'Send reset link'}</Text>
                </TouchableOpacity>
              </>
            )}
            {sent && (
              <TouchableOpacity onPress={() => {setSent(false); setEmail('');}} style={styles.secondary}>
                <Text style={styles.secondaryText}>Send another link</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.link}>Back to sign in</Text>
            </TouchableOpacity>
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
  secondary: {minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10},
  secondaryText: {color: 'black', fontSize: 14, fontWeight: '600'},
  back: {alignSelf: 'center', marginTop: 24, padding: 6},
  link: {color: 'black', fontSize: 14, fontWeight: '600'},
});

export default RequestResetPassword;
