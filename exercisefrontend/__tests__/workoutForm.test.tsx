import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert, TextInput, TouchableOpacity} from 'react-native';
import WorkoutForm from '../screens/WorkoutForm';
const mockAdd = jest.fn<(...args: any[]) => Promise<string>>(); const mockPick = jest.fn<() => Promise<any>>(); const mockUpload = jest.fn<(...args: any[]) => Promise<string>>(); const mockBack = jest.fn();
jest.mock('../hooks/exercises', () => ({useUploadWorkOuts: () => ({addWorkout: mockAdd})}));
jest.mock('../hooks/social', () => ({useFilePicker: () => ({pickFile: mockPick, setFile: jest.fn(), error: null}), useS3Uploader: () => ({uploadToS3: mockUpload})}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0})}));
let tree: renderer.ReactTestRenderer;
const button = (label: string) => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label)!;
const field = (label: string) => tree.root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === label)!;
const enter = (label: string, text: string) => act(() => field(label).props.onChangeText(text));
const save = async () => { await act(async () => { await button('Save new workout').props.onPress(); }); };
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockAdd.mockResolvedValue('Added.'); mockPick.mockResolvedValue(null);
  act(() => { tree = renderer.create(<WorkoutForm navigation={{goBack: mockBack} as any} route={{} as any} />); });
});
afterEach(() => { act(() => { jest.runOnlyPendingTimers(); tree.unmount(); }); jest.useRealTimers(); });
test('blank workout names cannot submit', async () => { await save(); expect(mockAdd).not.toHaveBeenCalled(); expect(Alert.alert).toHaveBeenCalledWith('Workout name required', expect.any(String)); });
test('muscle text remains editable and is parsed only on submission', async () => {
  enter('Workout name', ' My row '); enter('Primary muscles', 'lower back, biceps ');
  expect(field('Primary muscles').props.value).toBe('lower back, biceps '); await save();
  expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({name: 'My row', primaryMuscles: ['lower back', 'biceps'], is_public: false, img_url: []})); expect(mockBack).toHaveBeenCalled();
});
test('a failed submission retains the draft and stays on the form', async () => {
  mockAdd.mockRejectedValueOnce(new Error('Offline')); enter('Workout name', 'My row'); await save();
  expect(field('Workout name').props.value).toBe('My row'); expect(mockBack).not.toHaveBeenCalled(); expect(Alert.alert).toHaveBeenCalledWith('Could not add workout', 'Offline');
});
test('cancelled photo selection does not upload or submit', async () => {
  await act(async () => { await button('Add photo').props.onPress(); }); expect(mockUpload).not.toHaveBeenCalled(); expect(mockAdd).not.toHaveBeenCalled(); expect(Alert.alert).not.toHaveBeenCalled();
});
test('pending uploads block save and successful image URLs are included in the payload', async () => {
  let resolve!: (url: string) => void;
  mockPick.mockResolvedValueOnce({uri: 'file://photo.jpg', name: 'photo.jpg', type: 'image/jpeg'});
  mockUpload.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await act(async () => { void button('Add photo').props.onPress(); });
  expect(button('Save new workout').props.disabled).toBe(true);
  await act(async () => { resolve('https://example.invalid/photo.jpg'); });
  enter('Workout name', 'My row'); await save();
  expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({img_url: ['https://example.invalid/photo.jpg']}));
});
