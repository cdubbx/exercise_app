import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Text, TextInput, TouchableOpacity} from 'react-native';
import HomeScreen from '../screens/HomeScreen';
const mockSearch = jest.fn<(query: string) => Promise<any[]>>();
const mockNavigate = jest.fn(); const mockOpenTab = jest.fn();
const mockTour = {register: jest.fn(), start: jest.fn(), next: jest.fn(), isRunning: false, wrap: (_id: string, child: React.ReactNode) => child};
jest.mock('../hooks/auth', () => ({useUserContext: () => ({user: {id: 'first', username: 'Review'}})}));
jest.mock('../hooks/exercises', () => ({useExercises: () => ({searchExercises: mockSearch})}));
jest.mock('../utils/TutorialSystemService', () => ({useWalkThrough: () => mockTour}));
jest.mock('../services/navigation', () => ({openTab: (...args: any[]) => mockOpenTab(...args)}));
jest.mock('@react-navigation/native', () => ({useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect])}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0, bottom: 0})}));
jest.mock('react-native-linear-gradient', () => require('react-native').View);
jest.mock('react-native-vector-icons/AntDesign', () => 'Icon');
jest.mock('../cards/BodyPartExerciseCard', () => ({__esModule: true, default: ({item}: any) => require('react').createElement(require('react-native').Text, null, item.name)}));
let tree: renderer.ReactTestRenderer;
const result = {id: 'curl', name: 'Biceps curl'};
const change = (text: string) => act(() => tree.root.findByType(TextInput).props.onChangeText(text));
const tick = async (ms = 300) => { await act(async () => { jest.advanceTimersByTime(ms); }); };
const texts = () => tree.root.findAllByType(Text).map(node => node.props.children).flat().join(' ');
function press(label: string) {
  act(() => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => text.props.children === label))!.props.onPress());
}
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); mockSearch.mockResolvedValue([result]);
  act(() => { tree = renderer.create(<HomeScreen route={{} as any} navigation={{navigate: mockNavigate} as any} />); });
});
afterEach(() => { act(() => tree.unmount()); jest.clearAllTimers(); jest.useRealTimers(); });
test('all five body parts and the profile shortcut retain their destinations', () => {
  expect(tree.root.findAllByType(TouchableOpacity).filter(node => node.props.accessibilityLabel?.startsWith('Browse '))).toHaveLength(5);
  press('Browse Abs exercises'); expect(mockNavigate).toHaveBeenCalledWith('BodyPart', {bodyParts: 'abdominals'});
  press('Open profile'); expect(mockOpenTab).toHaveBeenCalledWith('Profile1', {screen: 'Profile'});
});
test('search waits for three characters and debounce, then opens the result', async () => {
  change('cu'); await tick(); expect(mockSearch).not.toHaveBeenCalled();
  change('curl'); await tick(299); expect(mockSearch).not.toHaveBeenCalled();
  await tick(1); expect(mockSearch).toHaveBeenCalledWith('curl');
  press('View Biceps curl'); expect(mockNavigate).toHaveBeenCalledWith('ExerciseCard', {item: result});
  press('Clear search'); expect(tree.root.findByType(TextInput).props.value).toBe(''); expect(texts()).toContain('Browse by body part');
});
test('a reply arriving after clearing search cannot replace the catalog', async () => {
  let resolve!: (data: any[]) => void;
  mockSearch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  change('curl'); await tick(); press('Clear search');
  await act(async () => { resolve([result]); });
  expect(texts()).toContain('Browse by body part'); expect(texts()).not.toContain('Biceps curl');
});
test('search failure offers a working retry without a false empty-results message', async () => {
  mockSearch.mockRejectedValueOnce(new Error('Offline'));
  change('curl'); await tick(); expect(texts()).toContain('Couldn’t search exercises'); expect(texts()).not.toContain('No exercises found');
  press('Try again'); await tick(); expect(texts()).toContain('Biceps curl'); expect(texts()).not.toContain('Offline');
});
