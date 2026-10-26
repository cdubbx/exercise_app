import {NavigationProp, RouteProp} from '@react-navigation/native';
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import {AuthStackParamList} from '../interfaces/screentypes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { useRegister } from '../hooks/auth';
import { RegisterRequest } from '../interfaces/types';

interface OTPScreenProps {
  route: RouteProp<AuthStackParamList, 'OTP'>;
  navigation: NavigationProp<AuthStackParamList, 'OTP'>;
}

const OTPScreen: React.FC<OTPScreenProps> = ({route, navigation}) => {
  const {email} = route.params;
  const {verifyOTP, resendOTP, loading} = useRegister();
  const [otp, setOtp] = useState<string>('');

  const userData = {
    email: email, 
    otp: otp, 
  };

  const handleSubmit = async () => {
    if (otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP.');
      return;
    }
    try { await verifyOTP(userData); }
    catch (error: any) { Alert.alert('Verification failed', error.message); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        We have sent an OTP to your email: {email}
      </Text>

      <OTPTextInput
        inputCount={4}
        handleTextChange={setOtp}
        containerStyle={styles.otpContainer}
        textInputStyle={styles.otpInput}
      />

      <TouchableOpacity disabled={loading} onPress={async () => {
        try { const result = await resendOTP(email); Alert.alert('Verification code', result.message); }
        catch (error: any) { Alert.alert('Could not resend code', error.message); }
      }}><Text style={{color: '#333', marginBottom: 20}}>Resend code</Text></TouchableOpacity>
      <TouchableOpacity disabled={loading} style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  otpContainer: {
    marginBottom: 24,
  },
  otpInput: {
    borderBottomWidth: 2,
    borderColor: 'black',
  },
  submitButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OTPScreen;
