import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert, Text, TouchableOpacity} from 'react-native';
import SavedWorkouts from '../screens/SavedWorkOuts';
const mockDeleteSaved = jest.fn<(...args: any[]) => Promise<void>>();
const mockDeleteCustom = jest.fn<(...args: any[]) => Promise<void>>();
const mockRefresh = jest.fn(); const mockNavigate = jest.fn(); const mockBack = jest.fn(); const mockOpen = jest.fn();
let mockSaved: any; let mockCustom: any;
jest.mock('../hooks/exercises', () => ({useFetchedSavedWorkOuts: () => mockSaved, useUploadWorkOuts: () => mockCustom,
  useDeleteWorkout: () => ({deleteSavedWorkout: mockDeleteSaved, deleteUserSavedWorkout: mockDeleteCustom})}));
jest.mock('../services/navigation', () => ({openTab: (...args: any[]) => mockOpen(...args)}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0})}));
let tree: renderer.ReactTestRenderer;
const screen = () => <SavedWorkouts navigation={{navigate: mockNavigate, goBack: mockBack} as any} />;
const texts = () => tree.root.findAllByType(Text).map(node => node.props.children).flat().join(' ').replace(/\s+/g, ' ');
async function press(label: string) { await act(async () => { await tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => text.props.children === label))!.props.onPress(); }); }
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockSaved = {fetchedExercises: [{id: 1, exercise: {id: 'curl', name: 'Curl'}}], loading: false, error: '', refresh: mockRefresh};
  mockCustom = {userWorkouts: [{id: 'own', name: 'My exercise'}], isLoading: false, error: '', refresh: mockRefresh};
  mockDeleteSaved.mockResolvedValue(undefined); mockDeleteCustom.mockResolvedValue(undefined);
  act(() => { tree = renderer.create(screen()); });
});
afterEach(() => { act(() => { jest.runOnlyPendingTimers(); tree.unmount(); }); jest.useRealTimers(); });
test('saved and custom rows open the correct exercise for planning', async () => {
  await press('Plan Curl'); expect(mockNavigate).toHaveBeenCalledWith('SavedExercises', {exercise: {id: 'curl', name: 'Curl'}});
  await press('Your Exercises'); await press('Plan My exercise'); expect(mockNavigate).toHaveBeenCalledWith('SavedExercises', {exercise: {id: 'own', name: 'My exercise'}});
  await press('Back'); expect(mockBack).toHaveBeenCalled();
});
test('errors stay with the selected tab and retry reloads that tab', async () => {
  mockSaved.error = 'Offline'; act(() => tree.update(screen())); await press('Your Exercises');
  expect(texts()).not.toContain('Offline'); expect(texts()).toContain('My exercise');
  await press('Exercises'); expect(texts()).toContain('Couldn’t load saved workouts'); await press('Try again'); expect(mockRefresh).toHaveBeenCalled();
});
test('remove waits for server success and warns about affected calendar plans', async () => {
  let resolve!: () => void;
  mockDeleteSaved.mockImplementationOnce(() => new Promise<void>(done => { resolve = done; }));
  await press('Options for Curl'); expect(Alert.alert).toHaveBeenCalledWith('Remove saved workout?', expect.stringContaining('Calendar plans'), expect.any(Array));
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
  act(() => { buttons.find(button => button.text === 'Remove').onPress(); }); expect(texts()).toContain('Curl');
  await act(async () => { resolve(); }); expect(texts()).not.toContain('Curl'); expect(mockDeleteSaved).toHaveBeenCalledWith(1);
});
test('failed custom deletion retains the row and does not affect saved exercises', async () => {
  mockDeleteCustom.mockRejectedValueOnce(new Error('Offline')); await press('Your Exercises'); await press('Options for My exercise');
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
  await act(async () => { await buttons.find(button => button.text === 'Delete').onPress(); });
  expect(texts()).toContain('My exercise'); expect(mockDeleteSaved).not.toHaveBeenCalled(); expect(Alert.alert).toHaveBeenLastCalledWith('Could not remove workout', 'Offline');
});
test('loading does not falsely report an empty library', () => {
  mockSaved = {...mockSaved, fetchedExercises: [], loading: true}; act(() => tree.update(screen()));
  expect(texts()).toContain('Loading exercises…'); expect(texts()).not.toContain('No saved workouts yet');
});
test('empty tabs offer the correct browse or create action', async () => {
  mockSaved.fetchedExercises = []; mockCustom.userWorkouts = []; act(() => tree.update(screen()));
  await press('Browse exercises'); expect(mockOpen).toHaveBeenCalledWith('Home1', {screen: 'ExplorePage'});
  await press('Your Exercises'); await press('Add exercise'); expect(mockOpen).toHaveBeenCalledWith('Profile1', {screen: 'AddWorkoutScreen'});
});
