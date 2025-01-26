import {useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RegisterRequest, RegisterResponse, Song} from '../interfaces/types';
import {UserContext} from '../context/UserContext';
import {
  SPOTIFY_CLIENTID,
  SPOTIFY_TOKEN_SWAP_URL,
  SPOTIFY_TOKEN_REFRESH_URL,
} from '@env';
import {ApiConfig, ApiScope} from 'react-native-spotify-remote';
import SpotifyAuth from 'react-native-spotify-remote/dist/SpotifyAuth';
import {NowPlayingContext} from '../context/NowPlayContextSpotify';
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setLoading] = useState<boolean>(true);
  const {verifyToken} = useVerifyToken();

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

  return {isAuthenticated, isLoading};
}
async function refreshAccessToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch('http://192.168.0.16:8000/api/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({refresh: refreshToken}),
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

async function getAuthToken(): Promise<string | null> {
  try {
    let token = await AsyncStorage.getItem('access');
    const refreshToken = await AsyncStorage.getItem('refresh');
    if (!token) {
      if (refreshToken) {
        const success = await refreshAccessToken(refreshToken);
        if (success) {
          token = await AsyncStorage.getItem('access');
        } else {
          throw new Error('Token refresh failed');
        }
      } else {
        throw new Error('Access token is invalid');
      }
    }
    return token;
  } catch (error) {
    console.error(error);
    return null;
  }
}
export const useVerifyToken = () => {
  const [loading, setLoading] = useState(false);

  const verifyToken = async (token: string) => {
    try {
      setLoading(true);

      const response = await fetch(
        'http://192.168.0.16:8000/api/token/verify/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({token}), // Pass the token in the body
        },
      );

      setLoading(false);

      if (!response.ok) {
        return false; // Token is not valid
      }

      return true; // Token is valid
    } catch (error: any) {
      console.error('Token verification error:', error.message);
      setLoading(false);
      return false;
    }
  };

  return {verifyToken, loading};
};

export const useLogout = () => {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem('access'); // Clear the token from AsyncStorage
      await AsyncStorage.removeItem('refresh');

      setLoading(false);
    } catch (error) {
      console.log('Error:', error); // Debugging line
      setLoading(false);
    }
  };

  return {logout, loading};
};

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const register = async (userData: RegisterRequest) => {
    try {
      setLoading(true);

      const response = await fetch('http://192.168.0.16:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Network error');
      }
      if (data.message && data.message.includes('Verify OTP')) {
        setOtpSent(true);
        setLoading(false);
        return;
      }
      // if (data.user && data.refresh && data.access) {
      //   await AsyncStorage.setItem('access', data.access);
      //   await AsyncStorage.setItem('refresh', data.refresh);
      // }

      setLoading(false);
    } catch (error) {
      console.log('Error:', error);
      setLoading(false);
      throw error;
    }
  };

  const verifyOTP = async (userdata: any) => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.0.16:8000/api/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userdata),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Network error');
      }
      if (data.user && data.refresh && data.access) {
        await AsyncStorage.setItem('access', data.access);
        await AsyncStorage.setItem('refresh', data.refresh);
      }
      setLoading(false);
    } catch (error) {
      console.log('Error:', error);
      setLoading(false);
    }
  };
  return {register, loading, otpSent, verifyOTP};
};

export const useUserContext = () => {
  const userContext = useContext(UserContext);
  if (!userContext) {
    throw new Error('Must use inside of a Provider');
  } else {
    return userContext;
  }
};

export const useUser = () => {
  const [isLoading, setLoading] = useState<boolean>(false);
  async function getUser() {
    try {
      const token = await getAuthToken();
      setLoading(true);
      const response = await fetch('http://192.168.0.16:8000/api/user/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer  ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.log(data.error || 'An error has occurred');
        throw new Error(data.error || 'An error has occurred');
      }
      setLoading(false);
      return data;
    } catch (error) {
      console.error(error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }
  return {getUser, isLoading};
};

export const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const appleLogin = async (appleObject: any) => {
    try {
      setLoading(true);
      const response = await fetch(
        'http://192.168.0.16:8000/api/social-login/',
        {
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify(appleObject),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        console.log(data.error || 'There is a network error');
        throw new Error(data.error || 'There is a network error');
      }
      await AsyncStorage.setItem('access', data.access);
      await AsyncStorage.setItem('refresh', data.refresh);

      return true;
    } catch (error: any) {
      console.error('Error:', error.message);
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const response = await fetch('http://192.168.0.16:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, password}),
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
      return true; // Indicate success
    } catch (error: any) {
      console.error('Error:', error.message);
      setLoading(false);
      throw error; // Rethrow the error to be caught in onSubmit
    }
  };

  return {login, loading, appleLogin};
};

export const useResetPassword = () => {
  const [isLoading, setLoading] = useState<boolean>(false);

  async function resetPassword(resetPasswordObject: any) {
    try {
      setLoading(true);
      const response = await fetch(
        'http://192.168.0.16:8000/api/reset-password/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resetPasswordObject),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        console.log(data.error || 'There is a network error');
        throw new Error(data.error || 'There is a network error');
      }
      setLoading(false);
      return data?.message;
    } catch (error) {
      console.log('Error:', error);
      setLoading(false);
    }
  }

  async function requestPasswordReset(resetPasswordObject: any) {
    try {
      setLoading(true);
      const response = await fetch(
        'http://192.168.0.16:8000/api/request-password-reset/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resetPasswordObject),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        console.log(data.error || 'There is a network error');
        throw new Error(data.error || 'There is a network error');
      }
      setLoading(false);
      return data?.message;
    } catch (error) {
      console.log('Error:', error);
      setLoading(false);
    }
  }

  return {requestPasswordReset, resetPassword, isLoading};
};

export const useSpotify = () => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const SPOTIFY_REDIRECT_URL = "exercisefrontend://spotify-auth"
  const webApiScopes = [
    "user-read-playback-state",
    "user-read-currently-playing",
    "user-modify-playback-state"
  ]

  const config: ApiConfig = {
    clientID: SPOTIFY_CLIENTID,
    redirectURL: SPOTIFY_REDIRECT_URL,
    tokenRefreshURL: SPOTIFY_TOKEN_REFRESH_URL,
    tokenSwapURL: SPOTIFY_TOKEN_SWAP_URL,
    scopes: [
      ApiScope.AppRemoteControlScope,      // ✅ Required for remote playback control
      ApiScope.UserReadPlaybackStateScope, // ✅ Equivalent to 'user-read-playback-state'
      ApiScope.UserReadCurrentlyPlayingScope, // ✅ Equivalent to 'user-read-currently-playing'
    ],
     
    authType: 'CODE',
    showDialog: true, 
  };

  const authenticateWithSpotify = async () => {
    try {
      setLoading(true);
      console.log("Starting Spotify Authentication...");
      
      const auth = await SpotifyAuth.authorize(config);
      console.log("Spotify Auth Response:", auth); // ✅ Debugging the response
      if (auth.accessToken) {
        await AsyncStorage.setItem("spotify_accessToken", auth.accessToken);
        console.log("Spotify Access Token Saved:", auth.accessToken);
      } else {
        console.warn("No access token received from Spotify.");
      }
  
      if (auth.refreshToken) {
        await AsyncStorage.setItem("spotify_refreshToken", auth.refreshToken);
        console.log("Spotify Refresh Token Saved:", auth.refreshToken);
      } else {
        console.warn("No refresh token received from Spotify.");
      }
  
      console.log("Successfully authenticated with Spotify!");
    } catch (error) {
      console.error("An error occurred during Spotify authentication:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSession = async () => {
    try {
      const session = await SpotifyAuth.getSession();
      if (session && session.refreshToken) {
        console.log('Refresh Token:', session.refreshToken);
        return true;
      } else {
        return false;
        console.log('No active session or refresh token found.');
      }
    } catch (error) {
      console.error('Error retrieving session:', error);
    }
  };

  const fetchNowPlaying = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("spotify_accessToken");
      if (!token) throw new Error("Access token not found");
  
      const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status === 204) {
        console.warn("⚠️ No track currently playing - Spotify returned 204 No Content.");
        return null;
      }
  
      const data = await response.json();
      console.log("✅ Parsed JSON Response:", data);
  
      if (!data || !data.item) {
        console.warn("⚠️ No track currently playing");
        return null;
      }
  
      // ✅ Extracting relevant track information
      const track:Song = {
        track_name: data.item.name, // "Trumpet"
        artist_name: data.item.artists.map((artist: any) => artist.name).join(", "), // "Olamide, CKay"
        album_image_url: data.item.album.images[0].url, // Highest quality album cover
        album_name: data.item.album.name, // Album name
        preview_url: data.item.preview_url
      };

      updateNowPlaying(track);
  
      return track;
    } catch (error: any) {
      console.error("❌ Error fetching now playing:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateNowPlaying = async (track: any) => {
    try {
      const token = await getAuthToken();
      if (!track) return;

      await fetch('http://192.168.0.16:8000/api/now_playing/update/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(track),
      });
      console.log('Now playing updated on backend!');
    } catch (error) {
      console.error('Error updating track on backend:', error);
    }
  };

  return {
    isLoading,
    authenticateWithSpotify,
    fetchNowPlaying,
    getCurrentSession,
  };
};

export const useSpotifyContext = () => {
  const context = useContext(NowPlayingContext);
  if (!context) {
    throw new Error('Must be used inside of a provider');
  } else {
    return context;
  }
};
