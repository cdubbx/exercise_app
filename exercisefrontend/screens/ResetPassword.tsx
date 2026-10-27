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
import {useToast} from '../context/ToastContext';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {AuthStackParamList} from '../interfaces/screentypes';
import {useResetPassword} from '../hooks/auth';

interface ResetPasswordScreenProps {
  route: RouteProp<AuthStackParamList, 'ResetPassword'>;
  navigation: NavigationProp<AuthStackParamList, 'ResetPassword'>;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({navigation, route}) => {
  const {token, email} = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  const {resetPassword} = useResetPassword();

  const handleResetPassword = async () => {
    if (loading) {return;}
    if (!newPassword) {
      Alert.alert('Password required', 'Enter a new password to continue.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Enter the same password in both fields.');
      return;
    }
    setLoading(true);
    try {
      const message = await resetPassword({email, token, new_password: newPassword});
      showToast(message || 'Password changed successfully.');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Could not reset password', error.message || 'This link may have expired. Request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.brand}>Exercise Plus+</Text>
            <Text style={styles.title}>Set a new password</Text>
            <Text style={styles.subtitle}>Create a new password for {email}.</Text>
            <Text style={styles.label}>New password</Text>
            <TextInput
              placeholder="Choose a password"
              placeholderTextColor="#777"
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="next"
            />
            <Text style={styles.label}>Confirm new password</Text>
            <TextInput
              placeholder="Enter it again"
              placeholderTextColor="#777"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={handleResetPassword}
            />
            <TouchableOpacity disabled={loading} style={[styles.primary, loading && styles.disabled]} onPress={handleResetPassword}>
              <Text style={styles.primaryText}>{loading ? 'Updating password…' : 'Update password'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;

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
  primary: {minHeight: 50, marginTop: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'black'},
  disabled: {opacity: 0.65},
  primaryText: {color: 'white', fontSize: 15, fontWeight: '600'},
});
