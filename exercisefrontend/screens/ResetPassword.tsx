import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    SafeAreaView,
  } from 'react-native';
  import React, {useState} from 'react';
  import {NavigationProp, RouteProp} from '@react-navigation/native';
  import {AuthStackParamList} from '../types/screentypes';
  import {useResetPassword} from '../hooks/auth';
  
  interface ResetPasswordScreenProps {
    route: RouteProp<AuthStackParamList, 'ResetPassword'>;
    navigation: NavigationProp<AuthStackParamList, 'ResetPassword'>;
  }
  
  const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
    navigation,
    route,
  }) => {
    const {token, email} = route.params;
    const [newPassword, setNewPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const {resetPassword} = useResetPassword();
  
    const handleResetPassword = async () => {
      if (!newPassword) {
        Alert.alert('Error', 'Please enter a new password.');
        return;
      }
  
      setLoading(true);
      try {
        const resetObject = {
          email: email,
          token: token,
          new_password: newPassword, // Include the new password in the payload
        };
        const message = await resetPassword(resetObject);
        Alert.alert('Success', message);
        navigation.navigate('Login'); // Navigate back to login after success
      } catch (error: any) {
        Alert.alert('Error', `An error has occurred: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Reset Your Password</Text>
        <Text style={styles.emailText}>For: {email}</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };
  
  export default ResetPasswordScreen;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      backgroundColor: '#fff',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: '#333',
    },
    emailText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      color: '#666',
    },
    input: {
      height: 50,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      fontSize: 16,
      marginBottom: 20,
      backgroundColor: '#f9f9f9',
    },
    button: {
      backgroundColor: '#007BFF',
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: '#A3C7FF',
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });