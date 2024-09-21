import {NavigationProp, RouteProp} from '@react-navigation/native';
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import {AuthStackParamList} from '../types/screentypes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { useRegister } from '../hooks/auth';
import { RegisterRequest } from '../types/types';

interface OTPScreenProps {
  route: RouteProp<AuthStackParamList, 'OTP'>;
  navigation: NavigationProp<AuthStackParamList, 'OTP'>;
}

const OTPScreen: React.FC<OTPScreenProps> = ({route}) => {
  const {email} = route.params;
  const {register} = useRegister();
  const [otp, setOtp] = useState<string>('');

  const userData: RegisterRequest = {
    email: email, 
    password: '', 
    otp: otp, 
  };

  const handleSubmit = () => {
    if (otp.length === 4) {
        register(userData)
    } else {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP.');
    }
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

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
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
    borderColor: '#007bff',
  },
  submitButton: {
    backgroundColor: '#007bff',
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
