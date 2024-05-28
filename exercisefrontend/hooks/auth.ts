import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setLoading] = useState<boolean>(true);
  const { verifyToken } = useVerifyToken();

  useEffect(() => {
    const checkToken = async () => {
      try {
        setLoading(true);
        const accessToken = await AsyncStorage.getItem('access');
        const refreshToken = await AsyncStorage.getItem('refresh');

        if (accessToken) {
          const isValid = await verifyToken(accessToken);
          if (isValid) {
            setIsAuthenticated(true);
          } else if (refreshToken) {
            const refreshed = await refreshAccessToken(refreshToken);
            setIsAuthenticated(refreshed);
          } else {
            setIsAuthenticated(false);
          }
        } else if (refreshToken) {
          const refreshed = await refreshAccessToken(refreshToken);
          setIsAuthenticated(refreshed);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking token:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  return { isAuthenticated, isLoading };
}
async function refreshAccessToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/api/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    await AsyncStorage.setItem('access', data.access);
    await AsyncStorage.setItem('refresh', data.refresh);
    return true;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return false;
  }
}

export const useVerifyToken = () => {
  const [loading, setLoading] = useState(false);

  const verifyToken = async (token:string) => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:8000/api/token/verify/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),  // Pass the token in the body
      });

      setLoading(false);

      if (!response.ok) {
        return false;  // Token is not valid
      }

      return true;  // Token is valid
    } catch (error:any) {
      console.error('Token verification error:', error.message);
      setLoading(false);
      return false;
    }
  };

  return { verifyToken, loading };
};

export const useLogout = () => {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch('http://localhost:8000/api/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,  // Adjusted for JWT Authentication
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText); // Debugging line
        throw new Error('Network error');
      }

      await AsyncStorage.removeItem('token'); // Clear the token from AsyncStorage

      setLoading(false);
    } catch (error) {
      console.log('Error:', error); // Debugging line
      setLoading(false);
    }
  };

  return { logout, loading };
};


export const useRegister = () => {
  const [loading, setLoading] = useState(false);

  const register = async (userData:object) => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.error || 'Network error');
      }

      const data = await response.json();
      await AsyncStorage.setItem('access', data.access);
      await AsyncStorage.setItem('refresh', data.refresh);

      setLoading(false);
    } catch (error) {
      console.log('Error:', error); // Debugging line
      setLoading(false);
      throw error
    }
  };

  return { register, loading };
};

export const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const login = async (email:string, password:string) => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorText = await response.json();
        console.error('Login error response:', errorText);
        throw new Error(errorText.error || 'Network error');
      }

      const data = await response.json();
      await AsyncStorage.setItem('access', data.access);
      await AsyncStorage.setItem('refresh', data.refresh);

      setLoading(false);
      return true;  // Indicate success
    } catch (error:any) {
      console.error('Error:', error.message);
      setLoading(false);
      throw error;  // Rethrow the error to be caught in onSubmit
    }
  };

  return { login, loading };
};