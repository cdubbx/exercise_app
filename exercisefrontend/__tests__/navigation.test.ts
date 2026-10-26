import {jest, test, expect, beforeEach} from '@jest/globals';
import {navigationRef, openChat, openTab} from '../services/navigation';
jest.mock('@react-navigation/native', () => ({createNavigationContainerRef: () => ({isReady: jest.fn(), getCurrentRoute: jest.fn(), navigate: jest.fn(), dispatch: jest.fn(), getRootState: jest.fn(() => ({routes: []}))}), StackActions: {popTo: jest.fn((name, params) => ({type: 'POP_TO', payload: {name, params}}))}}));
const nav = navigationRef as unknown as {isReady: jest.Mock<any>; getCurrentRoute: jest.Mock<any>; navigate: jest.Mock; dispatch: jest.Mock; getRootState: jest.Mock<any>};
beforeEach(() => { jest.clearAllMocks(); nav.isReady.mockReturnValue(true); });
test('floating button does not open chat before navigation is ready', () => {
  nav.isReady.mockReturnValue(false); openChat(); expect(nav.navigate).not.toHaveBeenCalled();
});
test('floating button does not create a second active chat', () => {
  nav.getCurrentRoute.mockReturnValue({name: 'BotScreen'}); openChat(); expect(nav.navigate).not.toHaveBeenCalled();
});
test('floating button opens the shared root chat from a tab', () => {
  nav.getCurrentRoute.mockReturnValue({name: 'Profile'}); openChat(); expect(nav.navigate).toHaveBeenCalledWith('BotScreen');
});

test('tutorial navigation returns to tabs instead of leaving chat in front', () => {
  openTab('Profile1', {screen: 'Profile'});
  expect(nav.dispatch).toHaveBeenCalledWith({type: 'POP_TO', payload: {name: 'BottomTabs', params: {screen: 'Profile1', params: {screen: 'Profile'}}}});
});

test('tutorial pops a background profile stack back from Settings before focusing it', () => {
  nav.getRootState.mockReturnValue({routes: [{name: 'BottomTabs', state: {routes: [{name: 'Profile1', state: {key: 'profile-stack'}}]}}]});
  openTab('Profile1', {screen: 'Profile'});
  expect(nav.dispatch).toHaveBeenNthCalledWith(1, {type: 'POP_TO', payload: {name: 'Profile', params: undefined}, target: 'profile-stack'});
  expect(nav.dispatch).toHaveBeenNthCalledWith(2, {type: 'POP_TO', payload: {name: 'BottomTabs', params: {screen: 'Profile1'}}});
});
