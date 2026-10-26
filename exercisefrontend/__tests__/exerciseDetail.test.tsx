import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert, Text, TouchableOpacity} from 'react-native';
import ExerciseCard from '../cards/ExerciseCard';
const mockSave = jest.fn<(...args: any[]) => Promise<any>>(); const mockAdd = jest.fn(); const mockBack = jest.fn();
const mockTour = {register: jest.fn(), stop: jest.fn(), wrap: (_id: string, child: React.ReactNode) => child};
jest.mock('../hooks/exercises', () => ({useSaveWorkOuts: () => ({saveWorkouts: mockSave, loading: false}), useSetExercise: () => ({addExercises: mockAdd})}));
jest.mock('../services/navigation', () => ({openTab: jest.fn()}));
jest.mock('../utils/TutorialSystemService', () => ({useWalkThrough: () => mockTour}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0})}));
let tree: renderer.ReactTestRenderer;
const exercise = {id: 'curl', name: 'Curl', instructions: ['Stand upright.', 'Lift slowly.']};
const button = () => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Save workout')!;
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockSave.mockResolvedValue({created: true, message: 'Saved.'});
  act(() => { tree = renderer.create(<ExerciseCard route={{params: {item: exercise}} as any} navigation={{goBack: mockBack} as any} />); });
});
afterEach(() => { act(() => { jest.runOnlyPendingTimers(); tree.unmount(); }); jest.useRealTimers(); });
test('successful save updates feedback and prevents repeated saves', async () => {
  await act(async () => { await button().props.onPress(); });
  expect(mockSave).toHaveBeenCalledWith(exercise); expect(mockAdd).toHaveBeenCalledWith(exercise); expect(button().props.disabled).toBe(true);
  expect(Alert.alert).toHaveBeenCalledWith('Workout saved', 'Saved.');
});
test('an already saved result does not add a duplicate local exercise', async () => {
  mockSave.mockResolvedValueOnce({created: false, message: 'Already in your profile.'});
  await act(async () => { await button().props.onPress(); });
  expect(mockAdd).not.toHaveBeenCalled(); expect(button().props.disabled).toBe(true); expect(Alert.alert).toHaveBeenCalledWith('Already saved', expect.any(String));
});
test('failed save remains available for retry', async () => {
  mockSave.mockRejectedValueOnce(new Error('Offline'));
  await act(async () => { await button().props.onPress(); });
  expect(mockAdd).not.toHaveBeenCalled(); expect(button().props.disabled).toBe(false); expect(Alert.alert).toHaveBeenCalledWith('Could not save workout', 'Offline');
});
test('instructions expand and Back retains the existing navigation', () => {
  act(() => tree.root.findAllByType(TouchableOpacity).find(node => node.findAllByType(Text).some(text => text.props.children === 'Show more'))!.props.onPress());
  expect(tree.root.findAllByType(Text).some(text => text.props.children === 'Show less')).toBe(true);
  act(() => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Back')!.props.onPress()); expect(mockBack).toHaveBeenCalled();
});
