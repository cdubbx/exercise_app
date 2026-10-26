import React from 'react';
import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {AppState, Linking, Text, TouchableOpacity} from 'react-native';
import {UserContext} from '../context/UserContext';
import {NowPlayingProvider, useSpotify} from '../context/NowPlayContextSpotify';
import SpotifyPlayer from '../components/SpotifyPlayer';
const mockFetch = jest.fn<(...args: any[]) => Promise<any>>();
jest.mock('../services/api', () => ({API_URL: 'http://localhost/api', apiFetch: (...args: any[]) => mockFetch(...args), readResponse: async (response: any) => response.payload}));
jest.mock('react-native-vector-icons/Entypo', () => 'Icon');
jest.mock('../context/UserContext', () => ({UserContext: require('react').createContext({})}));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
let spotify: NonNullable<ReturnType<typeof useSpotify>>;
let tree: renderer.ReactTestRenderer;
let user = {id: 'one'};
let player: any;
function Probe() { spotify = useSpotify()!; return <SpotifyPlayer settings />; }
const screen = () => <UserContext.Provider value={{user, isAuthenticated: true} as any}><NowPlayingProvider><Probe /></NowPlayingProvider></UserContext.Provider>;
async function mount() { await act(async () => { tree = renderer.create(screen()); }); }
async function press(label: string) { await act(async () => { tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => text.props.children === label))!.props.onPress(); }); }
const texts = () => tree.root.findAllByType(Text).map(node => node.props.children).flat().join(' ');
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); user = {id: 'one'};
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  player = {is_playing: true, device_active: true, track: {name: 'Test track', artists: 'Test artist', image: null, url: 'https://open.spotify.com/track/test'}, disallows: {}};
  mockFetch.mockImplementation(async (url, options) => ({payload: url.endsWith('connect/') ? {url: 'https://accounts.spotify.com/authorize?state=opaque'} : options.method === 'DELETE' || options.method === 'POST' ? null : url.endsWith('player/') ? player : {configured: true, connected: true}}));
});
afterEach(() => { if (tree) { act(() => tree.unmount()); } jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks(); });
test('connect opens the authorization URL without handling provider tokens in the client', async () => {
  await mount(); await act(async () => { await spotify.connect(); });
  expect(Linking.openURL).toHaveBeenCalledWith('https://accounts.spotify.com/authorize?state=opaque');
  expect(texts()).toContain('Test track');
});
test('pause and skip send account-authenticated backend actions', async () => {
  await mount(); await press('Pause'); await press('Next'); await press('Previous');
  const actions = mockFetch.mock.calls.filter(call => call[1].body).map(call => JSON.parse(call[1].body).action);
  expect(actions).toEqual(['pause', 'next', 'previous']);
});
test('Spotify restrictions disable controls while keeping the open Spotify link', async () => {
  player = {...player, disallows: {skipping_next: true}, device_active: false}; await mount();
  expect(tree.root.findAllByType(TouchableOpacity).filter(node => ['Previous', 'Pause', 'Next'].includes(node.props.accessibilityLabel)).every(node => node.props.disabled)).toBe(true);
  await press('Open in Spotify ↗'); expect(Linking.openURL).toHaveBeenCalledWith('https://open.spotify.com/track/test');
});
test('a player error preserves connection controls and remains retryable', async () => {
  mockFetch.mockImplementationOnce(async () => ({payload: {configured: true, connected: true}})).mockRejectedValueOnce(new Error('Premium required'));
  await mount(); expect(spotify.connected).toBe(true); expect(texts()).toContain('Premium required');
  await press('Try again'); expect(texts()).toContain('Test track'); expect(spotify.error).toBe('');
});
test('disconnect clears the local player after backend success', async () => {
  await mount(); await act(async () => { await spotify.disconnect(); });
  expect(spotify.connected).toBe(false); expect(spotify.player).toBeNull(); expect(texts()).not.toContain('Test track');
});
test('an old account response cannot restore its player after switching accounts', async () => {
  let resolve!: (data: any) => void;
  mockFetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await mount(); user = {id: 'two'}; player = {...player, track: {...player.track, name: 'Second account'}};
  await act(async () => tree.update(screen()));
  await act(async () => { resolve({payload: {configured: true, connected: false}}); });
  expect(texts()).toContain('Second account'); expect(spotify.connected).toBe(true);
});
test('backgrounding stops automatic playback polling', async () => {
  const previous = AppState.currentState; AppState.currentState = 'background';
  await mount(); const calls = mockFetch.mock.calls.length;
  await act(async () => { jest.advanceTimersByTime(60000); }); expect(mockFetch).toHaveBeenCalledTimes(calls);
  AppState.currentState = previous;
});
