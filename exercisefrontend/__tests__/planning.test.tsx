import {jest, test, expect, beforeEach, afterEach} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert, Image, Text, TextInput, TouchableOpacity} from 'react-native';
import SavedExercise from '../cards/SavedFetchedExercise';
const mockSave = jest.fn<(...args: any[]) => Promise<any>>();
const mockAdd = jest.fn();
jest.mock('../hooks/exercises', () => ({
  useSavePlannedWorkouts: () => ({savePlannedWorkouts: (...args: any[]) => mockSave(...args), loading: false}),
  useSetExercise: () => ({addExercises: mockAdd, exercises: []}),
}));
jest.mock('../context/ExerciseContext', () => ({}));
jest.mock('react-native-picker-select', () => 'Picker');
jest.mock('@react-native-material/core', () => {
  const {View: V, Text: T} = require('react-native');
  return {Box: V, Stack: V, HStack: V, Text: T};
});
const back = jest.fn();
let tree: renderer.ReactTestRenderer;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  act(() => { tree = renderer.create(<SavedExercise route={{params: {exercise: {id: 'exercise-1', name: 'My curl', img_url: ['https://example.com/curl.png']}}} as any} navigation={{goBack: back} as any} />); });
});
afterEach(() => {
  act(() => { jest.runOnlyPendingTimers(); tree.unmount(); });
  jest.useRealTimers();
});
const enter = (label: string, value: string) => act(() => tree.root.findAllByType(TextInput).find(field => field.props.accessibilityLabel === label)!.props.onChangeText(value));
const selectDay = () => act(() => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Monday')!.props.onPress());
const selectTime = (time: string) => act(() => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === `Time of day: ${time}`)!.props.onPress());
const submit = async () => {
  const button = tree.root.findAllByType(TouchableOpacity).find(node => node.findAllByType(Text).some(text => text.props.children === 'Add to Plan'))!;
  await act(async () => { await button.props.onPress(); });
};
test('keeps the rounded exercise photo and editable planning controls', () => {
  expect(tree.root.findByType(Image).props.style).toMatchObject({width: 240, height: 240, borderRadius: 20});
  expect(tree.root.findAllByType(TextInput)).toHaveLength(2);
});
test('invalid sets and repetitions do not submit or leave the screen', async () => {
  selectDay(); enter('Sets', '0'); enter('Repetitions', '10'); await submit();
  expect(mockSave).not.toHaveBeenCalled(); expect(back).not.toHaveBeenCalled(); expect(Alert.alert).toHaveBeenCalledWith('Invalid workout', expect.any(String));
});
test('saves numeric sets/reps and returns once after server success', async () => {
  mockSave.mockResolvedValue({id: 12, sets: 3, reps: 10});
  selectDay(); selectTime('Morning'); enter('Sets', '3'); enter('Repetitions', '10'); await submit();
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({day: 'Monday', time_of_day: 'Morning', sets: 3, reps: 10, exercise: expect.objectContaining({id: 'exercise-1'})}));
  expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({id: 12})); expect(back).toHaveBeenCalledTimes(1);
});
test('a failed save retains the form and does not add a phantom workout', async () => {
  mockSave.mockRejectedValue(new Error('Offline')); selectDay(); enter('Repetitions', '10'); await submit();
  expect(back).not.toHaveBeenCalled(); expect(mockAdd).not.toHaveBeenCalled(); expect(Alert.alert).toHaveBeenCalled();
});

test('rep presets and steppers update the saved quantities', async () => {
  const press = (label: string) => act(() => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label)!.props.onPress());
  mockSave.mockResolvedValue({id: 13});
  selectDay(); press('12 reps'); press('Increase repetitions'); press('Decrease sets'); await submit();
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({sets: 2, reps: 13, day: 'Monday', time_of_day: 'Anytime'}));
});
test('steppers stop at the quantity limits and require a selected day', async () => {
  enter('Sets', '1'); enter('Repetitions', '1000');
  const buttons = tree.root.findAllByType(TouchableOpacity);
  expect(buttons.find(node => node.props.accessibilityLabel === 'Decrease sets')!.props.disabled).toBe(true);
  expect(buttons.find(node => node.props.accessibilityLabel === 'Increase repetitions')!.props.disabled).toBe(true);
  await submit(); expect(mockSave).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Please select a day of the week.');
});
