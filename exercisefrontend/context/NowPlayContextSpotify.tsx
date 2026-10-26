import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {AppState, Linking} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserContext} from './UserContext';
import {API_URL, apiFetch, readResponse} from '../services/api';

export type SpotifyAction = 'play' | 'pause' | 'next' | 'previous';
export interface SpotifyPlayerState {
  is_playing: boolean;
  device_active: boolean;
  track: {name: string; artists: string; image: string | null; url: string | null} | null;
  disallows: Record<string, boolean>;
}
interface SpotifyContextType {
  connected: boolean; configured: boolean; busy: boolean; error: string;
  showPlayer: boolean; player: SpotifyPlayerState | null;
  refresh: () => Promise<void>; connect: () => Promise<void>; disconnect: () => Promise<void>;
  control: (action: SpotifyAction) => Promise<void>; togglePlayer: () => Promise<void>;
}
export const NowPlayingContext = createContext<SpotifyContextType | null>(null);
export const useSpotify = () => useContext(NowPlayingContext);
const empty = {connected: false, configured: false, player: null as SpotifyPlayerState | null, error: ''};

export function NowPlayingProvider({children}: {children: React.ReactNode}) {
  const auth = useContext(UserContext);
  const accountId = auth?.isAuthenticated ? auth.user?.id : undefined;
  const account = useRef(accountId); account.current = accountId;
  const [state, setState] = useState({...empty, accountId});
  const [showPlayer, setShowPlayer] = useState(true);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const polling = useRef(false);
  const version = useRef(0);
  const request = useCallback(async (path = '', method = 'GET', body?: unknown) => readResponse(await apiFetch(`${API_URL}/spotify/${path}`, {method, ...(body ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {})})), []);
  const refresh = useCallback(async () => {
    if (!accountId || account.current !== accountId || polling.current) { return; }
    polling.current = true;
    const current = version.current;
    try {
      const status = await request();
      if (current === version.current && account.current === accountId) { setState(previous => ({...previous, ...status, accountId})); }
      const player = status.configured && status.connected ? await request('player/') : null;
      if (current === version.current && account.current === accountId) { setState({...status, player, error: '', accountId}); }
    } catch (failure) {
      if (current === version.current && account.current === accountId) { setState(previous => ({...previous, error: failure instanceof Error ? failure.message : 'Could not reach Spotify.', accountId})); }
    } finally { if (current === version.current) { polling.current = false; } }
  }, [accountId, request]);
  useEffect(() => {
    const current = ++version.current;
    polling.current = false; operation.current = false; setBusy(false);
    setState({...empty, accountId}); setShowPlayer(true);
    if (accountId) {
      AsyncStorage.getItem(`spotify-player:${accountId}`).then(value => { if (version.current === current) { setShowPlayer(value !== 'hidden'); } }).catch(() => {});
      void refresh();
    }
    return () => { version.current = current + 1; };
  }, [accountId, refresh]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', next => { if (next === 'active') { void refresh(); } });
    const link = Linking.addEventListener('url', event => { if (event.url === 'exercisefrontend://spotify-connect') { void refresh(); } });
    const timer = setInterval(() => { if (AppState.currentState === 'active' && showPlayer && state.connected && !state.error && !operation.current) { void refresh(); } }, 30000);
    return () => { listener.remove(); link.remove(); clearInterval(timer); };
  }, [refresh, showPlayer, state.connected, state.error]);
  const perform = async (work: () => Promise<void>) => {
    if (!accountId || operation.current) { return; }
    const current = version.current;
    operation.current = true; setBusy(true);
    setState(previous => ({...previous, error: ''}));
    try { await work(); }
    catch (failure) { if (version.current === current && account.current === accountId) { setState(previous => ({...previous, error: failure instanceof Error ? failure.message : 'Could not reach Spotify.'})); } }
    finally { if (version.current === current) { operation.current = false; setBusy(false); } }
  };
  const connect = () => perform(async () => {
    const data = await request('connect/', 'POST');
    if (account.current === accountId) { await Linking.openURL(data.url); }
  });
  const disconnect = () => perform(async () => {
    await request('', 'DELETE');
    if (account.current === accountId) {
      version.current++; polling.current = false; operation.current = false; setBusy(false);
      setState(previous => ({...previous, connected: false, player: null, error: ''}));
    }
  });
  const control = (action: SpotifyAction) => perform(async () => {
    await request('player/', 'POST', {action});
    if (account.current === accountId) { await refresh(); }
  });
  const togglePlayer = async () => {
    const next = !showPlayer; setShowPlayer(next);
    try { await AsyncStorage.setItem(`spotify-player:${accountId}`, next ? 'visible' : 'hidden'); }
    catch { setShowPlayer(!next); }
  };
  const visible = state.accountId === accountId ? state : empty;
  return <NowPlayingContext.Provider value={{...visible, busy, showPlayer, refresh, connect, disconnect, control, togglePlayer}}>{children}</NowPlayingContext.Provider>;
}
