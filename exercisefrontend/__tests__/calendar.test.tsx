import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert, Text, TouchableOpacity} from 'react-native';
import Calendar from '../screens/Calendar';

const mockFetch = jest.fn<() => Promise<any[]>>();
const mockDelete = jest.fn<(id: number) => Promise<void>>();
const mockNavigate = jest.fn();
const mockTour = {register: jest.fn(), wrap: (_id: string, child: React.ReactNode) => child};
jest.mock('../hooks/exercises', () => ({
  useFetchedPlanedWorkouts: () => ({loading: false, fetchPlannedWorkouts: mockFetch}),
  useDeleteWorkout: () => ({deletePlannedWorkout: mockDelete}),
}));
jest.mock('../utils/TutorialSystemService', () => ({useWalkThrough: () => mockTour}));
jest.mock('../services/navigation', () => ({openTab: jest.fn()}));
jest.mock('@react-navigation/native', () => ({useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect])}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0, bottom: 0})}));

let tree: renderer.ReactTestRenderer;
const plan = {id: 1, day_of_the_week: 'Tuesday', sets: 4, reps: 11, saved_workout_details: {exercise: {name: 'Curl', category: 'strength', img_url: []}}};
const texts = () => tree.root.findAllByType(Text).map(node => node.props.children).flat().join(' ');
async function press(label: string) {
  await act(async () => { await tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label)!.props.onPress(); });
}
beforeEach(async () => {
  jest.useFakeTimers(); jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockFetch.mockResolvedValue([plan]); mockDelete.mockResolvedValue(undefined);
  await act(async () => { tree = renderer.create(<Calendar navigation={{navigate: mockNavigate} as any} />); });
  await press('Tuesday');
});
afterEach(() => {
  act(() => { jest.runOnlyPendingTimers(); tree.unmount(); });
  jest.useRealTimers();
});
test('weekday selection filters workouts and the add action opens saved exercises', async () => {
  expect(texts()).toContain('Curl');
  await press('Sunday');
  expect(texts()).not.toContain('Curl'); expect(texts()).toContain('Nothing planned for');
  await press('Add workout');
  expect(mockNavigate).toHaveBeenCalledWith('SavedExerciseList', {exercises: []});
});
test('confirmed removal updates the plan only after the server succeeds', async () => {
  let resolve!: () => void;
  mockDelete.mockImplementation(() => new Promise<void>(done => { resolve = done; }));
  await press('Options for Curl');
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
  act(() => { buttons.find(button => button.text === 'Remove').onPress(); });
  expect(texts()).toContain('Curl');
  await act(async () => { resolve(); });
  expect(texts()).not.toContain('Curl'); expect(texts()).toContain('Nothing planned for');
  expect(mockDelete).toHaveBeenCalledWith(1);
});
test('failed removal keeps the workout visible and explains the failure', async () => {
  mockDelete.mockRejectedValue(new Error('Offline'));
  await press('Options for Curl');
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
  await act(async () => { await buttons.find(button => button.text === 'Remove').onPress(); });
  expect(texts()).toContain('Curl');
  expect(Alert.alert).toHaveBeenLastCalledWith('Could not remove workout', 'Offline');
});
test('fetch failure shows retry instead of a misleading empty plan', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Offline'));
  await act(async () => tree.unmount());
  await act(async () => { tree = renderer.create(<Calendar navigation={{navigate: mockNavigate} as any} />); });
  expect(texts()).toContain('Could not refresh your plan'); expect(texts()).not.toContain('Nothing planned');
  mockFetch.mockResolvedValue([plan]);
  const retry = tree.root.findAllByType(TouchableOpacity).find(node => node.findAllByType(Text).some(text => text.props.children === 'Try again'))!;
  await act(async () => { retry.props.onPress(); });
  await press('Tuesday'); expect(texts()).toContain('Curl');
});
