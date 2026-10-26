import React from 'react';
import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {FlatList, Text, TouchableOpacity} from 'react-native';
import BodyPart from '../screens/BodyPart';
const mockNavigate = jest.fn(); const mockBack = jest.fn();
const mockMore = jest.fn(); const mockRefresh = jest.fn();
const exercise = {id: 'curl', name: 'Biceps curl', category: 'strength', img_url: []};
let mockData: any;
const mockTour = {register: jest.fn(), wrap: (_id: string, child: React.ReactNode) => child};
jest.mock('../hooks/exercises', () => ({useMuscleExercise: () => mockData}));
jest.mock('../utils/TutorialSystemService', () => ({useWalkThrough: () => mockTour}));
jest.mock('../services/navigation', () => ({openTab: jest.fn()}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0})}));
jest.mock('react-native-linear-gradient', () => require('react-native').View);
let tree: renderer.ReactTestRenderer;
function mount(part = 'biceps') { act(() => { tree = renderer.create(<BodyPart route={{params: {bodyParts: part}} as any} navigation={{navigate: mockNavigate, goBack: mockBack} as any} />); }); }
function press(label: string) { act(() => tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => text.props.children === label))!.props.onPress()); }
const texts = () => tree.root.findAllByType(Text).map(node => node.props.children).flat().join(' ');
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); mockData = {bodyExercises: [exercise], loading: false, loadingMore: false, error: null, hasMore: true, loadMoreExercises: mockMore, refresh: mockRefresh}; });
afterEach(() => { act(() => { jest.runOnlyPendingTimers(); tree.unmount(); }); jest.useRealTimers(); });
test('rows open the original exercise and refresh reloads the list', () => {
  mount(); press('View Biceps curl'); expect(mockNavigate).toHaveBeenCalledWith('ExerciseCard', {item: exercise});
  act(() => tree.root.findByType(FlatList).props.onRefresh()); expect(mockRefresh).toHaveBeenCalled();
});
test('back stays available during initial loading', () => {
  mockData = {...mockData, loading: true, bodyExercises: []}; mount(); press('Go back'); expect(mockBack).toHaveBeenCalled(); expect(texts()).toContain('Loading exercises');
});
test('initial failure offers retry', () => {
  mockData = {...mockData, bodyExercises: [], error: new Error('Offline')}; mount(); expect(texts()).toContain('Couldn’t load exercises'); press('Try again'); expect(mockRefresh).toHaveBeenCalled();
});
test('pagination failure keeps exercises and waits for explicit retry', () => {
  mockData.error = new Error('Offline'); mount(); expect(texts()).toContain('Biceps curl');
  act(() => tree.root.findByType(FlatList).props.onEndReached()); expect(mockMore).not.toHaveBeenCalled();
  press('Retry loading more'); expect(mockMore).toHaveBeenCalledTimes(1);
});
test('automatic pagination stops after the last page', () => {
  mockData.hasMore = false; mount(); act(() => tree.root.findByType(FlatList).props.onEndReached()); expect(mockMore).not.toHaveBeenCalled(); expect(texts()).toContain('You’ve reached the end');
});
test('all three original leg groups retain their destinations', () => {
  mount('legs'); press('Browse Glutes exercises'); press('Browse Hamstrings exercises'); press('Browse Quads exercises');
  expect(mockNavigate.mock.calls).toEqual([['BodyPart', {bodyParts: 'glutes'}], ['BodyPart', {bodyParts: 'hamstrings'}], ['BodyPart', {bodyParts: 'quadriceps'}]]);
});
