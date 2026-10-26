import {AppState} from 'react-native';
import React, {createContext, SetStateAction, useEffect, useState} from 'react';
import {authTokenObj, User} from '../interfaces/types';
import {API_URL, apiFetch, getAuthToken, readResponse, onSessionExpired} from '../services/api';
import SplashScreen from 'react-native-splash-screen';

interface UserContextTypes {
  user: User | undefined;
  setUser: React.Dispatch<SetStateAction<User | undefined>>;
  isAuthenticated: boolean | undefined;
  setIsAuthenticated: React.Dispatch<SetStateAction<boolean | undefined>>;
  token: authTokenObj | undefined | null;
  setToken: React.Dispatch<SetStateAction<authTokenObj | undefined | null>>;
  isReady: boolean;
}
export const UserContext = createContext<UserContextTypes | undefined>(undefined);

export const UserContextProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(false);
  const [token, setToken] = useState<authTokenObj | undefined | null>();
  const [isReady, setReady] = useState(false);
  useEffect(() => onSessionExpired(() => { setUser(undefined); setToken(null); setIsAuthenticated(false); }), []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (await getAuthToken()) {
          const data = await readResponse(await apiFetch(`${API_URL}/user/`));
          if (active) { setUser(data); setIsAuthenticated(true); }
        }
      } catch { if (active) setIsAuthenticated(false); }
      finally { if (active) { setReady(true); SplashScreen.hide(); } }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!isAuthenticated || !user?.id) { return; }
    let active = true;
    const accountId = user.id;
    const refreshImage = async () => {
      try {
        const data = await readResponse(await apiFetch(`${API_URL}/user/`));
        if (active && data.id === accountId) {
          setUser(previous => previous?.id === accountId ? {...previous, image_url: data.image_url} : previous);
        }
      } catch { /* Keep the current profile while offline. */ }
    };
    const listener = AppState.addEventListener('change', next => { if (next === 'active') { void refreshImage(); } });
    const timer = setInterval(() => { if (AppState.currentState === 'active') { void refreshImage(); } }, 45 * 60 * 1000);
    return () => { active = false; listener.remove(); clearInterval(timer); };
  }, [isAuthenticated, user?.id, user?.image_url]);
  return <UserContext.Provider value={{user, setUser, isAuthenticated, setIsAuthenticated, token, setToken, isReady}}>{children}</UserContext.Provider>;
};
