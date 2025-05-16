// ChatScreen.js
import React, {useState, useRef} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useGPTExerciseChat} from '../hooks/exercises';
import BodyPartExercise from '../cards/BodyPartExerciseCard';
import {HomeStackParamList} from '../interfaces/screentypes';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import { HStack } from '@react-native-material/core';

type Props = NativeStackScreenProps<HomeStackParamList, 'BotScreen'>;

const BotScreen: React.FC<Props> = ({navigation}) => {
  const [input, setInput] = useState('');
  const flatListRef = useRef<any>(null);
  const {messages, sendMessage, loading} = useGPTExerciseChat();

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1, backgroundColor: 'white', padding:10}}>
         <HStack style={{marginTop:50, justifyContent:'center', marginBottom:40}}>
                <Text style={{fontSize:25}}>Exercise Bot</Text>
            </HStack>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}: any) => (
          <View
            style={{
              alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: item.role === 'user' ? '#007AFF' : '#E5E5EA', // iMessage blue
              borderRadius: 16,
              margin: 8,
              padding: 10,
              maxWidth: '90%',
            }}>
            {/* GPT or user message */}
            <Text
              style={{
                color: item.role === 'user' ? 'white' : 'black',
                marginBottom: item.exercises ? 10 : 0,
              }}>
              {item.content}
            </Text>

            {/* Render exercises if this is an assistant response with exercises */}
            {item.role === 'assistant' && item.exercises?.length > 0 && (
              <View style={{marginTop: 10}}>
                {item.exercises.map((exercise: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={{marginBottom: 10}}
                    onPress={() => {
                      navigation.navigate('ExerciseCard', {item: exercise});
                    }}>
                    <BodyPartExercise item={exercise} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: true})
        }
        onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
      />
      <View style={{flexDirection: 'row', padding: 10}}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask something..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={{marginLeft: 10, justifyContent: 'center'}}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{color: '#00000', fontWeight: 'bold'}}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default BotScreen;
