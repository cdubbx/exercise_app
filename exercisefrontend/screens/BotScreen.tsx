import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList} from '../interfaces/screentypes';
import {ChatMessage} from '../interfaces/interfaces';
import {useChat} from '../context/ChatContext';
import {openTab} from '../services/navigation';
import {useWalkThrough} from '../utils/TutorialSystemService';

const suggestions = ['Find exercises for my back', 'Explain sets and reps', 'Help me plan a workout'];
type Props = NativeStackScreenProps<RootStackParamList, 'BotScreen'>;

const BotScreen: React.FC<Props> = ({navigation}) => {
  const [input, setInput] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const list = useRef<FlatList<ChatMessage>>(null);
  const composer = useRef<TextInput>(null);
  const nearBottom = useRef(true);
  const {messages, sendMessage, loading, error, retryMessage, clearConversation} = useChat();
  const tour = useWalkThrough();
  const insets = useSafeAreaInsets();
  const canSend = !!input.trim() && !loading;
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const handleSend = () => {
    if (!canSend) { return; }
    nearBottom.current = true;
    sendMessage(input);
    setInput('');
  };
  const browseExercises = () => { Keyboard.dismiss(); openTab('Home1', {screen: 'Home'}); };
  const confirmClear = () => Alert.alert('Clear conversation?', 'This clears the messages in this chat.', [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Clear', style: 'destructive', onPress: () => { clearConversation(); setInput(''); }},
  ]);
  const inputComposer = <View style={[styles.composerArea, {paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 12)}]}>
    <View style={styles.composer}>
      <TextInput ref={composer} accessibilityLabel="Message Exercise Bot" value={input} onChangeText={setInput}
        placeholder="Ask about your workout…" placeholderTextColor="#777" multiline maxLength={2000}
        style={styles.input} textAlignVertical="top" />
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{disabled: !canSend}}
        disabled={!canSend} onPress={handleSend} style={[styles.sendButton, !canSend && styles.disabled]}>
        <Text style={styles.sendText}>↑</Text>
      </TouchableOpacity>
    </View>
  </View>;

  return <View style={[styles.screen, {paddingTop: insets.top}]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.headerButton}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Exercise Bot</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear conversation" disabled={!messages.length && !input}
        onPress={confirmClear} style={[styles.headerButton, !messages.length && !input && styles.disabled]}>
        <Text style={styles.clearText}>Clear</Text>
      </TouchableOpacity>
    </View>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
      <FlatList ref={list} data={messages} keyExtractor={message => message.id!} style={styles.list}
        contentContainerStyle={styles.messages} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
        onScroll={({nativeEvent: {contentOffset, contentSize, layoutMeasurement}}) => {
          nearBottom.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 100;
        }} scrollEventThrottle={100}
        onLayout={() => { if (nearBottom.current) { list.current?.scrollToEnd({animated: true}); } }}
        onContentSizeChange={() => { if (nearBottom.current) { list.current?.scrollToEnd({animated: true}); } }}
        ListEmptyComponent={<View style={styles.welcome}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Let’s talk workouts</Text>
            <Text style={styles.supportingText}>Ask a question, or explore exercises to build your plan.</Text>
            <TouchableOpacity accessibilityRole="button" onPress={browseExercises} style={styles.browseButton}>
              <Text style={styles.browseText}>Browse exercises</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.suggestionHeading}>Start with a question</Text>
          {suggestions.map(suggestion => <TouchableOpacity key={suggestion} accessibilityRole="button" onPress={() => { setInput(suggestion); composer.current?.focus(); }} style={styles.suggestion}>
            <Text style={styles.suggestionText}>{suggestion}</Text><Text style={styles.suggestionArrow}>↗</Text>
          </TouchableOpacity>)}
        </View>}
        ListFooterComponent={<View>
          {loading && <View accessibilityRole="alert" style={styles.loading}><ActivityIndicator color="black" /><Text style={styles.supportingText}>Getting a reply…</Text></View>}
          {!!error && <View accessibilityRole="alert" style={styles.errorCard}>
            <Text style={styles.errorTitle}>{error.unavailable ? 'Exercise Bot isn’t available yet' : 'Your question didn’t get a reply'}</Text>
            <Text style={styles.supportingText}>{error.message}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={error.unavailable ? browseExercises : () => { nearBottom.current = true; retryMessage(); }} style={styles.browseButton}>
              <Text style={styles.browseText}>{error.unavailable ? 'Browse exercises' : 'Try again'}</Text>
            </TouchableOpacity>
          </View>}
        </View>}
        renderItem={({item}) => <View style={[styles.message, item.role === 'user' ? styles.userMessage : styles.botMessage]}>
          <Text style={[styles.sender, item.role === 'user' && styles.whiteText]}>{item.role === 'user' ? 'You' : 'Exercise Bot'}</Text>
          <Text selectable style={[styles.messageText, item.role === 'user' && styles.whiteText]}>{item.content}</Text>
          {item.role === 'assistant' && item.exercises?.map((exercise, index) => <TouchableOpacity key={exercise.id ?? index} accessibilityRole="button"
            onPress={() => navigation.navigate('ExerciseCard', {item: exercise})} style={styles.exerciseLink}>
            <Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.exerciseHint}>View exercise →</Text>
          </TouchableOpacity>)}
        </View>}
      />
      {tour.wrap('bot-screen-tooltip', inputComposer, {
        order: 7, placement: 'top', showChildInTooltip: false,
        content: <Text>Type a workout question here and press send. You can also browse exercises from this screen.</Text>,
      })}
    </KeyboardAvoidingView>
  </View>;
};
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f2f2f2'},
  body: {flex: 1},
  header: {minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headerButton: {minWidth: 50, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  backIcon: {fontSize: 36, color: 'black'},
  title: {fontSize: 20, fontWeight: '600', color: 'black'},
  clearText: {fontSize: 14, color: 'black'},
  list: {flex: 1},
  messages: {padding: 20, paddingBottom: 12, gap: 14},
  welcome: {gap: 12},
  welcomeCard: {backgroundColor: 'white', padding: 22, borderRadius: 20, gap: 14, marginBottom: 16},
  welcomeTitle: {fontSize: 23, fontWeight: '600', color: 'black'},
  supportingText: {fontSize: 14, lineHeight: 21, color: '#555'},
  browseButton: {backgroundColor: 'black', minHeight: 44, borderRadius: 10, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 16, marginTop: 4},
  browseText: {color: 'white', fontSize: 13, fontWeight: '600'},
  suggestionHeading: {fontSize: 14, color: '#555', marginBottom: 2},
  suggestion: {padding: 16, minHeight: 52, borderWidth: 1, borderColor: '#ddd', borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12},
  suggestionText: {fontSize: 14, color: 'black', flex: 1},
  suggestionArrow: {fontSize: 18, color: '#555'},
  message: {maxWidth: '92%', borderRadius: 20, padding: 16, gap: 8},
  userMessage: {alignSelf: 'flex-end', backgroundColor: 'black'},
  botMessage: {alignSelf: 'flex-start', backgroundColor: 'white'},
  sender: {fontSize: 11, color: '#555', fontWeight: '600'},
  messageText: {fontSize: 15, color: 'black', lineHeight: 22},
  whiteText: {color: 'white'},
  loading: {flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12},
  errorCard: {padding: 20, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, backgroundColor: 'white', gap: 12},
  errorTitle: {fontSize: 16, color: 'black', fontWeight: '600'},
  composerArea: {paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1, borderColor: '#e2e2e2', backgroundColor: '#f2f2f2'},
  composer: {backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', alignItems: 'flex-end', padding: 6, gap: 8},
  input: {flex: 1, minHeight: 44, maxHeight: 120, fontSize: 15, color: 'black', paddingHorizontal: 10, paddingTop: 12, paddingBottom: 10},
  sendButton: {height: 44, width: 44, backgroundColor: 'black', borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  sendText: {fontSize: 25, color: 'white'},
  disabled: {opacity: 0.3},
  exerciseLink: {backgroundColor: '#f2f2f2', borderRadius: 10, padding: 14, gap: 6},
  exerciseName: {fontSize: 14, fontWeight: '600', color: 'black'},
  exerciseHint: {fontSize: 12, color: '#555'},
});
export default BotScreen;
