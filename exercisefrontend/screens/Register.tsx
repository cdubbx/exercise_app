import {View, SafeAreaView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView} from 'react-native';
import {Stack, VStack, Text, HStack, Divider, Spacer} from '@react-native-material/core';
import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useRegister} from '../hooks/auth';
import LinearGradient from 'react-native-linear-gradient';

type RootStackParamList = {
  Tabs: undefined;
  Login: undefined;
};

export default function Register(): React.JSX.Element {
  const [email, setEmail] = useState<String>('');
  const [password, setPassword] = useState<String>('');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const {register} = useRegister();

  const onSubmit = async () => {
    try {
      const userData = {
        email: email,
        password: password,
      };

      await register(userData);
      navigation.navigate('Tabs');
    } catch (error:any) {
      console.log(error);
      Alert.alert('Registration Error', error.message);  // Display the error message to the user

    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
          colors={['rgba(67,67,101,1)', 'rgba(46,45,83,1)', 'rgba(32,31,66,1)', 'rgba(20,18,51,1)', 'rgba(2,0,36,1)']}
          start={{ x: 0.4, y: 0.3 }}
          end={{ x: 0.3, y: 2 }}
          style={{ flex: 1 }}
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'space-between', marginTop: 80 }}>
            <View style={{ alignItems: 'center', paddingBottom: 40 }}>
              <Text style={{ color:"white",fontSize: 25, fontWeight: '700' }}>Create your account</Text>
            </View>
            <View style={{ alignItems: 'center', marginHorizontal: 15 }}>
              
              <TextInput
                style={{ paddingBottom:10,color:"white", marginLeft: 16, marginHorizontal: 16, width: '100%'}}
                placeholder="Email"
                borderBottomColor={"#e3e3e3"}
                borderBottomWidth={1}
                placeholderTextColor={"#e3e3e3"}
                onChangeText={text => {
                  setEmail(text);
                  console.log(text);
                }}
              />
              <TextInput
                paddingTop={20}
                style={{ paddingBottom:10, color:"white",margin: 16, width: '100%' }}
                placeholder="Password"
                placeholderTextColor={"#e3e3e3"}
                secureTextEntry={true}
                borderBottomColor={"#e3e3e3"}
                borderBottomWidth={1}
                onChangeText={text => {
                  setPassword(text);
                  console.log(text);
                }}
              />
              
            </View>
            
            <View style={{ flex: 1 }} />
            <Divider color='#e2e2e2'></Divider>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 8, marginTop:10, marginBottom: 30 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <HStack spacing={7}>
                  <Text style={{ fontSize: 14, fontWeight: 'normal', color: "#e3e3e3"}}>Have an account?</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'normal', color: "white"}}>Login</Text>
                </HStack>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={1} onPress={onSubmit}>
                <Text style={{ fontSize: 15, fontWeight: 'bold', backgroundColor: 'white', overflow: 'hidden', borderRadius: 16, padding: 7 }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
