// ChatScreen.js
import React, {useState, useRef, useEffect, useMemo} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useGPTExerciseChat} from '../hooks/exercises';
import BodyPartExercise from '../cards/BodyPartExerciseCard';
import {HomeStackParamList} from '../interfaces/screentypes';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HStack, Box} from '@react-native-material/core';
import FloatingButton from '../components/FloatingButton';
import {useFloatingButtonActions} from '../context/FloatingButtonContext';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useChat} from '../context/ChatContext';
import {shouldShowTutorial, useWalkThrough} from '../utils/TutorialSystemService';

type Props = NativeStackScreenProps<HomeStackParamList, 'BotScreen'>;

const BotScreen: React.FC<Props> = ({navigation}) => {
  const [input, setInput] = useState('');
  const [showTutorialWrapper, setShowTutorialWrapper] = useState(false);
  const flatListRef = useRef<any>(null);
  // I'm thinking about using use ref to get component (this will be a pure test to see how I can determine of the floating button)
  const floatingButtonRef = useRef<any>(null);
  const {messages, sendMessage, loading} = useChat();
  const {show, hide, moveTo} = useFloatingButtonActions();
  const tour = useWalkThrough();
  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages],
  );

  useEffect(() => {
    hide();
  }, []);

  useEffect(() => {
    let isMounted = true;
    shouldShowTutorial()
      .then(shouldShow => {
        if (isMounted) setShowTutorialWrapper(shouldShow);
      })
      .catch(() => {
        if (isMounted) setShowTutorialWrapper(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // on component mount I want to get the position based on the layout, part of me is thinking that use onLayout view would make more sense,
  // this button won't be a child component of any of these screens.

  const inputComposer = (
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
      <FloatingButton />
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
  );

  const wrappedInputComposer = showTutorialWrapper
    ? tour.wrap('bot-screen-tooltip', inputComposer, {
        order: 7,
        placement: 'top',
        showChildInTooltip: false,
        content: (
          <Text>
            When you click the floating button, this is where you interact with
            the bot.
          </Text>
        ),
      })
    : inputComposer;

  const screenContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1, backgroundColor: 'white', padding: 10}}>
      <HStack
        ph={25}
        pv={15}
        spacing={20}
        mt={40}
        items="center"
        justify="between">
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}>
          <AntDesign name="leftcircle" size={20} color={'black'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Exercise Bot</Text>
        <Box mr={-10}>
          <Entypo name="dots-three-vertical" size={15} color={'black'} />
        </Box>
      </HStack>
      <FlatList
        ref={flatListRef}
        data={sortedMessages}
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
      {wrappedInputComposer}
    </KeyboardAvoidingView>
  );

  return screenContent;
};

const styles = StyleSheet.create({
  headerText: {
    fontSize: 20,
    width: '70%',
    textAlign: 'center',
    color: 'black',
  },
});
export default BotScreen;
