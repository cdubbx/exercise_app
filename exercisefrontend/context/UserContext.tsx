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
  return <UserContext.Provider value={{user, setUser, isAuthenticated, setIsAuthenticated, token, setToken, isReady}}>{children}</UserContext.Provider>;
};
