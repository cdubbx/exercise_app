import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput, TouchableOpacity} from 'react-native';
import BotScreen from '../screens/BotScreen';
const mockSend = jest.fn(); const mockRetry = jest.fn(); const mockClear = jest.fn(); const mockBrowse = jest.fn(); const mockBack = jest.fn(); const mockNavigate = jest.fn();
let mockChat: any;
const mockTour = {wrap: (_id: string, child: React.ReactNode) => child};
jest.mock('../context/ChatContext', () => ({useChat: () => mockChat}));
jest.mock('../services/navigation', () => ({openTab: (...args: any[]) => mockBrowse(...args)}));
jest.mock('../utils/TutorialSystemService', () => ({useWalkThrough: () => mockTour}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0, bottom: 0})}));
let tree: renderer.ReactTestRenderer;
const renderScreen = () => <BotScreen navigation={{goBack: mockBack, navigate: mockNavigate} as any} route={{} as any} />;
const press = (label: string) => act(() => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => text.props.children === label))!.props.onPress());
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockChat = {messages: [], loading: false, error: null, sendMessage: mockSend, retryMessage: mockRetry, clearConversation: mockClear};
  act(() => { tree = renderer.create(renderScreen()); });
});
afterEach(() => { act(() => { jest.runOnlyPendingTimers(); tree.unmount(); }); jest.useRealTimers(); });
test('starter questions populate an editable draft and sending clears it', () => {
  press('Explain sets and reps'); expect(tree.root.findByType(TextInput).props.value).toBe('Explain sets and reps');
  expect(mockSend).not.toHaveBeenCalled(); press('Send message');
  expect(mockSend).toHaveBeenCalledWith('Explain sets and reps'); expect(tree.root.findByType(TextInput).props.value).toBe('');
});
test('blank input and pending replies disable send', () => {
  const button = () => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Send message')!;
  expect(button().props.disabled).toBe(true);
  act(() => tree.root.findByType(TextInput).props.onChangeText('A question'));
  mockChat.loading = true; act(() => tree.update(renderScreen())); expect(button().props.disabled).toBe(true);
});
test('unavailable replies offer browsing and network errors offer retry', () => {
  mockChat.error = {message: 'Unavailable', unavailable: true}; act(() => tree.update(renderScreen()));
  press('Browse exercises'); expect(mockBrowse).toHaveBeenCalledWith('Home1', {screen: 'Home'});
  mockChat.error = {message: 'Offline', unavailable: false}; act(() => tree.update(renderScreen()));
  press('Try again'); expect(mockRetry).toHaveBeenCalled();
});
test('clear requires confirmation and response exercises open their detail page', () => {
  const exercise = {id: 'curl', name: 'Curl'};
  mockChat.messages = [{id: 'reply', role: 'assistant', content: 'An exercise', exercises: [exercise], timestamp: 1}];
  act(() => tree.update(renderScreen())); press('Curl'); expect(mockNavigate).toHaveBeenCalledWith('ExerciseCard', {item: exercise});
  press('Clear conversation'); expect(mockClear).not.toHaveBeenCalled();
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
  act(() => buttons.find(button => button.text === 'Clear').onPress()); expect(mockClear).toHaveBeenCalledTimes(1);
  press('Back'); expect(mockBack).toHaveBeenCalled();
});
