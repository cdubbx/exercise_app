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
    <SafeAreaView >
      <LinearGradient
        colors={['rgba(67,67,101,1)', 'rgba(32,31,66,1)', 'rgba(2,0,36,1)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
      <KeyboardAvoidingView behavior="padding" >
      
      <Stack mt={80}>
        <Stack justify="center" items="center" pb={40}>
          <Text style={{fontSize: 30, fontWeight: 700}} >Exercise+</Text>
        </Stack>
        <Stack
          justify="center"
          items="center"
          mt={5}
          ml={8}
          mr={8}
          spacing={0}
          direction="column">
          <TextInput
            style={{marginLeft: 16, marginHorizontal: 16, width: '100%', backgroundColor: '#dedede', borderRadius: 25, padding: 13}}
            placeholder="Email"
            onChangeText={text => {
              setEmail(text);
              console.log(text);
            }}
          />
          <TextInput
            style={{margin: 16, width: '100%', backgroundColor: '#dedede', borderRadius: 25, padding: 13}}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={text => {
              setPassword(text);
              console.log(text);
            }}
          />
        </Stack>
       
     

      <HStack ml={8}mt={70} mr={8}items={'center'} justify="space-between">
         
         <TouchableOpacity onPress={() => {
           navigation.navigate('Login')
         }}>
            <Text style={{fontWeight:'normal'}} >Have an account?</Text>
         </TouchableOpacity>
         <TouchableOpacity activeOpacity={1} onPress={onSubmit}>
           <Text style={{fontWeight: "bold",backgroundColor:"#dedede", overflow:"hidden",borderRadius: 15,padding: 7}}  >Sign up</Text>
         </TouchableOpacity>

       </HStack>

       </Stack>
      </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
