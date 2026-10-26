import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Modal, Text, TextInput, TouchableOpacity} from 'react-native';
import ProfileScreen from '../screens/ProfileScreen';
const mockUpdate = jest.fn<(...args: any[]) => Promise<string>>();
const mockPick = jest.fn<() => Promise<any>>();
const mockUpload = jest.fn<(...args: any[]) => Promise<string>>();
const mockNavigate = jest.fn(); const mockToast = jest.fn();
const mockTour = {register: jest.fn(), wrap: (_id: string, child: React.ReactNode) => child};
let mockUser: any;
let mockSaved: any;
jest.mock('../hooks/auth', () => ({useUserContext: () => ({user: mockUser}), useUpdateUser: () => ({updateUser: mockUpdate, isLoading: false})}));
jest.mock('../hooks/exercises', () => ({useFetchedSavedWorkOuts: () => mockSaved}));
jest.mock('../hooks/social', () => ({useFilePicker: () => ({pickFile: mockPick, setFile: jest.fn(), error: null}), useS3Uploader: () => ({uploadToS3: mockUpload})}));
jest.mock('../context/ToastContext', () => ({useToast: () => mockToast, ToastOverlay: () => null}));
jest.mock('../services/navigation', () => ({openChat: jest.fn(), openTab: jest.fn()}));
jest.mock('../utils/TutorialSystemService', () => ({useWalkThrough: () => mockTour}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0, bottom: 0})}));
jest.mock('@react-native-menu/menu', () => ({MenuView: 'Menu'}));
jest.mock('@react-native-picker/picker', () => ({Picker: Object.assign((props: any) => require('react').createElement('Picker', props, props.children), {Item: 'PickerItem'})}));
jest.mock('../cards/FetchedExercise', () => ({__esModule: true, default: ({item}: any) => require('react').createElement(require('react-native').Text, null, item.exercise.name)}));
let tree: renderer.ReactTestRenderer;
const screen = () => <ProfileScreen route={{} as any} navigation={{navigate: mockNavigate} as any} />;
async function press(label: string) {
  await act(async () => { await tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => text.props.children === label))!.props.onPress(); });
}
function enter(label: string, value: string) {
  act(() => tree.root.findAllByType(TextInput).find(field => field.props.accessibilityLabel === label)!.props.onChangeText(value));
}
const texts = () => tree.root.findAllByType(Text).map(node => node.props.children).flat().join(' ');
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  mockUser = {id: 'first', username: 'Review', weight: '150', goal_weight: '145', height: '5.5', phone_number: '', streak: 2, is_private: true};
  mockSaved = {fetchedExercises: [{id: 1, exercise: {id: 'curl', name: 'Curl'}}], loading: false, error: ''};
  mockUpdate.mockResolvedValue('Profile updated.'); mockPick.mockResolvedValue(null);
  act(() => { tree = renderer.create(screen()); });
});
afterEach(() => { act(() => { jest.runOnlyPendingTimers(); tree.unmount(); }); jest.useRealTimers(); });
test('cancelled edits never change the profile and reopening restores saved values', async () => {
  await press('Edit Profile'); enter('Username', 'Unsaved'); enter('Current weight', '999'); await press('Cancel');
  expect(tree.root.findByType(Modal).props.visible).toBe(false); expect(texts()).toContain('Review'); expect(texts()).not.toContain('Unsaved');
  await press('Edit Profile');
  expect(tree.root.findAllByType(TextInput).find(field => field.props.accessibilityLabel === 'Username')!.props.value).toBe('Review');
  expect(mockUpdate).not.toHaveBeenCalled();
});
test('save sends editable fields and leaves an unchanged height and privacy untouched', async () => {
  await press('Edit Profile'); enter('Username', ' Renamed '); enter('Current weight', '151.5'); await press('Save Profile');
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({username: 'Renamed', weight: '151.5', goal_weight: '145'}));
  const payload = mockUpdate.mock.calls[0][0] as any;
  expect(payload).not.toHaveProperty('height'); expect(payload).not.toHaveProperty('is_private'); expect(payload).not.toHaveProperty('id');
  expect(tree.root.findByType(Modal).props.visible).toBe(false); expect(mockToast).toHaveBeenCalledWith('Profile updated.');
});
test('failed save keeps the draft open with meaningful feedback', async () => {
  mockUpdate.mockRejectedValueOnce(new Error('Offline'));
  await press('Edit Profile'); enter('Current weight', '151.5'); await press('Save Profile');
  expect(tree.root.findByType(Modal).props.visible).toBe(true); expect(mockToast).toHaveBeenCalledWith('Offline');
  expect(tree.root.findAllByType(TextInput).find(field => field.props.accessibilityLabel === 'Current weight')!.props.value).toBe('151.5');
});
test('cancelling photo selection does not upload or modify the draft', async () => {
  await press('Edit Profile'); await press('Change profile photo');
  expect(mockUpload).not.toHaveBeenCalled(); expect(mockToast).not.toHaveBeenCalled();
});
test('height is sent only when adjusted, including an explicit Not set selection', async () => {
  await press('Edit Profile');
  act(() => tree.root.findAllByType('Picker' as any).find(field => field.props.accessibilityLabel === 'Height in feet')!.props.onValueChange(null));
  await press('Save Profile'); expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({height: null}));
});
test('saved workouts and profile menu preserve their existing destinations', async () => {
  await press('Curl'); expect(mockNavigate).toHaveBeenCalledWith('SavedExercises', {exercise: {id: 'curl', name: 'Curl'}});
  await press('Show More →'); expect(mockNavigate).toHaveBeenCalledWith('SavedExerciseList', {exercises: mockSaved.fetchedExercises});
  act(() => tree.root.findByType('Menu' as any).props.onPressAction({nativeEvent: {event: 'settings'}}));
  expect(mockNavigate).toHaveBeenCalledWith('Settings');
  mockSaved = {...mockSaved, fetchedExercises: [], error: 'Offline'};
  act(() => tree.update(screen())); expect(texts()).toContain('Couldn’t load saved workouts'); expect(texts()).not.toContain('Save your first workout');
});
