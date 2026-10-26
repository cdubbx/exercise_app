import React from 'react';
import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {Alert, Switch} from 'react-native';
import Settings from '../screens/Settings';
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>();
jest.mock('../hooks/auth', () => ({useUpdateUser: () => ({updateUser: mockUpdate, isLoading: false}), useLogout: () => ({logout: jest.fn()}), useUserContext: () => ({user: {is_private: false, is_searchable: false}}), useDeleteProfile: () => ({deleteProfile: jest.fn()})}));
jest.mock('../components/SpotifyPlayer', () => () => null);
jest.mock('../services/navigation', () => ({openTab: jest.fn()}));
jest.mock('../utils/TutorialSystemService', () => ({useWalkThrough: () => ({})}));
jest.mock('../utils/tutorialStorage', () => ({clearTutorialCompleted: jest.fn()}));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/AntDesign', () => 'Icon');
let tree: renderer.ReactTestRenderer;
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(() => {}); act(() => { tree = renderer.create(<Settings navigation={{goBack: jest.fn()} as any} />); }); });
afterEach(() => { act(() => tree.unmount()); jest.restoreAllMocks(); });
test('opening Spotify settings does not save privacy; explicit toggles save only the changed setting', async () => {
  expect(mockUpdate).not.toHaveBeenCalled(); mockUpdate.mockResolvedValue('Saved');
  await act(async () => { tree.root.findAllByType(Switch)[0].props.onValueChange(true); });
  expect(mockUpdate).toHaveBeenCalledWith({is_private: true});
});
test('failed privacy updates restore the previous switch value', async () => {
  mockUpdate.mockRejectedValueOnce(new Error('Offline'));
  await act(async () => { tree.root.findAllByType(Switch)[0].props.onValueChange(true); });
  expect(tree.root.findAllByType(Switch)[0].props.value).toBe(false);
  expect(Alert.alert).toHaveBeenCalledWith('Could not save settings', 'Offline');
});
