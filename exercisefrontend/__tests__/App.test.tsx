import {jest, test, expect} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import MainNavigator from '../components/MainNavigator';
import {useUserContext} from '../hooks/auth';
jest.mock('../hooks/auth', () => ({useUserContext: jest.fn()}));
jest.mock('../App', () => ({
  AuthNavigator: () => { const {Text: T} = require('react-native'); return <T>Sign in</T>; },
  RootStackNavigator: () => { const {Text: T} = require('react-native'); return <T>Your workouts</T>; },
}));

test('startup waits for authentication and login/logout switch the root navigator', () => {
  const useUser = useUserContext as jest.Mock<any>;
  useUser.mockReturnValue({isReady: false, isAuthenticated: false});
  let tree: renderer.ReactTestRenderer;
  act(() => { tree = renderer.create(<MainNavigator />); });
  expect(tree!.toJSON()).toBeNull();
  useUser.mockReturnValue({isReady: true, isAuthenticated: false});
  act(() => tree!.update(<MainNavigator />)); expect(tree!.root.findByType(Text).props.children).toBe('Sign in');
  useUser.mockReturnValue({isReady: true, isAuthenticated: true});
  act(() => tree!.update(<MainNavigator />)); expect(tree!.root.findByType(Text).props.children).toBe('Your workouts');
  useUser.mockReturnValue({isReady: true, isAuthenticated: false});
  act(() => tree!.update(<MainNavigator />)); expect(tree!.root.findByType(Text).props.children).toBe('Sign in');
});
