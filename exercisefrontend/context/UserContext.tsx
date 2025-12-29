import {createContext, SetStateAction, useEffect, useState} from 'react';
import {authTokenObj, User} from '../interfaces/types';
import {useAuth, useUser} from '../hooks/auth';


interface UserContextTypes {
  user: User | undefined;
  setUser: React.Dispatch<SetStateAction< User | undefined>>;
  isAuthenticated: boolean | undefined; 
  setIsAuthenticated: React.Dispatch<SetStateAction<boolean | undefined>>;
  token: authTokenObj | undefined | null;
  setToken: React.Dispatch<SetStateAction< authTokenObj| undefined | null>>;
}

interface UserContextProps {
  children: React.ReactNode;
}

export const UserContext = createContext<UserContextTypes | undefined>(
  undefined,
);

export const UserContextProvider: React.FC<UserContextProps> = ({children}) => {
  const [user, setUser] = useState<User | undefined>();
  const {getUser} = useUser();
  const {isAuthenticated, checkToken, setIsAuthenticated} = useAuth();
  const [token, setToken] = useState<authTokenObj | undefined | null>()
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();

      setUser({
        ...userData,
        height:
          typeof userData?.height === 'string'
            ? parseFloat(userData?.height)
            : user?.height,
        weight:
          typeof userData?.weight === 'string'
            ? parseFloat(userData?.weight)
            : userData?.weight,
        goal_weight:
          typeof userData?.goal_weight === 'string'
            ? parseFloat(userData?.goal_weight)
            : userData?.goal_weight,
      });

      // console.log(parseFloat(userData?.height));
    };

    fetchUser();
  }, []);
  return (
    <UserContext.Provider value={{user, setUser, isAuthenticated, setIsAuthenticated, token, setToken}}>
      {children}
    </UserContext.Provider>
  );
};
