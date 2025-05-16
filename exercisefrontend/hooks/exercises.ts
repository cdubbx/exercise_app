import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useEffect, useContext, useRef} from 'react';
import {Exercise, PlannedWorkout, SavedWorkout} from '../interfaces/interfaces';
import {ExerciseContext} from '../context/ExerciseContext';
import {getAuthToken} from './auth';

export const useExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(
          'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/exercises/',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        const limitedData = data.slice(0, 10); // Limit to the first 10 exercises
        setExercises(limitedData);
      } catch (error) {
        if (error instanceof Error) setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []); // The empty array ensures this effect runs only once after the initial render

  const searchExercises = async (search:any) => {
    const response = await fetch(
      `https://exerciseplus-a70aea8e1a80.herokuapp.com/api/exercises/?search=${search}`,
    );
    const data = await response.json();
    return data.results;
  };

  return {exercises, loading, error, searchExercises};
};

export const useMuscleExercise = (bodyPart: string) => {
  const [bodyExercises, setBodyExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  const loadingRef = useRef(false); // 🔹 Tracks loading in real-time

  const fetchExercises = async (url?: string, isLoadMore = false) => {
    if (loadingRef.current === true) return;
    loadingRef.current = true;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const token = await getAuthToken();
      const apiUrl =
        url ||
        `https://exerciseplus-a70aea8e1a80.herokuapp.com/api/exercises/?primaryMuscles=${bodyPart}`;

      console.log(`🔹 Fetching from: ${apiUrl} (isLoadMore: ${isLoadMore})`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('✅ API Response:', data);

      if (response.ok) {
        setBodyExercises(prevExercises =>
          isLoadMore ? [...prevExercises, ...data.results] : data.results,
        );
        setNextUrl(data.next);
      } else {
        throw new Error(data.detail || 'Failed to fetch exercises');
      }
    } catch (error) {
      console.error(error);
    } finally {
      loadingRef.current = false; // 🔹 Reset ref
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };

  const loadMoreExercises = () => {
    console.log('📢 loadMoreExercises() called!');

    if (!nextUrl || loadingRef.current) {
      console.log(
        '❌ Preventing duplicate fetch (already loading or no next URL)',
      );
      return;
    }

    fetchExercises(nextUrl, true);
  };

  useEffect(() => {
    fetchExercises();
  }, [bodyPart]);

  return {
    loading,
    loadingMore,
    bodyExercises,
    error,
    loadMoreExercises,
    hasMore: !!nextUrl,
  };
};

export const useSaveWorkOuts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const saveWorkouts = async (item: any) => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('access'); // Retrieve the access token

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(
        'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/saveWorkOuts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`, // Use the access token
          },
          body: JSON.stringify({
            workout: item,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.json();
        console.log('Error response:', errorText.error); // Debugging line
        setError(errorText.error);
        throw new Error(errorText.error || 'Network error');
      }
      setLoading(false);
      return true;
    } catch (error: any) {
      console.log('Save workout error:', error.message);
      setLoading(false);
      throw error;
    }
  };

  return {saveWorkouts, loading, error};
};

export const useSavePlannedWorkouts = () => {
  const [loading, setLoading] = useState(false);
  const savePlannedWorkouts = async (workout: any) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access');

      if (!token) {
        throw new Error('No access token found');
      }
      const response = await fetch(
        'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/plannedWorkouts/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workout: workout,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Network error');
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
  return {savePlannedWorkouts, loading};
};

export const useFetchedSavedWorkOuts = () => {
  const [loading, setLoading] = useState(false);
  const [fetchedExercises, setFetchedExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const fetchSavedWorkouts = async () => {
      try {
        setLoading(true);
        const token = await getAuthToken();
        const response = await fetch(
          'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/userSavedWorkouts/',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setFetchedExercises(data);
      } catch (error) {
        console.error('Error fetching saved workouts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedWorkouts();
  }, []);

  return {fetchedExercises, loading};
};

export const useFetchedPlanedWorkouts = () => {
  const [loading, setLoading] = useState(false);
  // const [fetchedExercises, setFetchedExercises] = useState([]);
  const fetchPlannedWorkouts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access');
      const response = await fetch(
        'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/plannedWorkouts/',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error('Network Error');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
    }
  };
  return {loading, fetchPlannedWorkouts};
};

export const useSetExercise = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useSetExercise must be used within a provier');
  }
  return context;
};

export const useUploadWorkOuts = () => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [userWorkouts, setUserWorkouts] = useState<any[]>([]);
  const [publicWorkouts, setPublicWorkouts] = useState<any[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(
    'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/user-upload-workouts/',
  );

  async function addWorkout(exercise: any) {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(
        'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/user-upload-workout/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(exercise),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        console.log(data.error || 'Network Error');
        throw new Error('Network Error');
      }
      return data?.message || 'Successfully uploaded workout.';
    } catch (error) {
      console.error(error);
    }
  }

  async function getWorkouts() {
    try {
      if (!nextUrl || isLoading) {
        return;
      }
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.log(data.error || 'Network error');
        throw new Error(data.error || 'Network error');
      }
      setUserWorkouts(data.results);
      setNextUrl(data.next);

      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  }

  async function getPublicWorkouts() {
    try {
      setLoading(true);
      setNextUrl(
        'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/user-upload-workouts/?is_public=true',
      );
      if (!nextUrl || isLoading) return;
      const token = await getAuthToken();
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.log(data.error || 'Network error');
        throw new Error(data.error || 'Network error');
      }
      setPublicWorkouts(data.results);
      setNextUrl(data.next);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getWorkouts();
    getPublicWorkouts();
  }, []);
  return {addWorkout, isLoading, userWorkouts, publicWorkouts};
};
export const useDeleteWorkout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSavedWorkout = async (workoutId: any) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(
        `https://exerciseplus-a70aea8e1a80.herokuapp.com/api/delete-saved-workout/${workoutId}/`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.json();
        setError(errorText.error || 'Failed to delete workout');
        throw new Error(errorText.error || 'Failed to delete workout');
      }
    } catch (error: any) {
      console.error('Delete workout error:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePlannedWorkout = async (workoutId: any) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(
        `https://exerciseplus-a70aea8e1a80.herokuapp.com/api/delete-planned-workout/${workoutId}/`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.json();
        setError(errorText.error || 'Failed to delete workout');
        throw new Error(errorText.error || 'Failed to delete workout');
      }
    } catch (error: any) {
      console.error('Delete workout error:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUserSavedWorkout = async (workoutId: any) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(
        `https://exerciseplus-a70aea8e1a80.herokuapp.com/api/delete-user-workout/${workoutId}/`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.json();
        setError(errorText.error || 'Failed to delete workout');
        throw new Error(errorText.error || 'Failed to delete workout');
      }
    } catch (error: any) {
      console.error('Delete workout error:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  return {
    deleteSavedWorkout,
    deletePlannedWorkout,
    deleteUserSavedWorkout,
    loading,
    error,
  };
};

export const useReport = () => {
  const [message, setMessage] = useState<string | any>('');
  const [isLoading, setLoading] = useState<boolean>(false);
  const reportUser = async (reportObj: any) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(
        `https://exerciseplus-a70aea8e1a80.herokuapp.com/api/report/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({reportObj}),
        },
      );

      if (!response.ok) {
        const errorText = await response.json();
        setMessage(errorText.error || 'Failed to report user');
        throw new Error(errorText.error || 'Failed to report user');
      }
      setMessage('User reported successfully');
    } catch (error: any) {
      console.error('Report user error:', error.message);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {reportUser, message, isLoading};
};

// useGPTExerciseChat.js

export const useGPTExerciseChat = () => {
  const [messages, setMessages] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const sendMessage = async (userInput: any) => {
    const newMessages = [...messages, {role: 'user', content: userInput}];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch(
        'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/gpt-chat/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({query: userInput}),
        },
      );

      const data = await response.json();

      const assistantMsg = {
        role: 'assistant',
        content: data.gpt_response || 'Sorry, something went wrong.',
        exercises: data.exercises
      };

      setMessages([...newMessages, assistantMsg]);
    } catch (error: any) {
      setMessages([
        ...newMessages,
        {role: 'assistant', content: 'Error: ' + error.message},
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {messages, sendMessage, loading};
};

// export const useReportWorkout = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const reportWorkout = async (workoutId: string, reason: string) => {
//     try {
//       setLoading(true);
//       const token = await getAuthToken();
//       const response = await fetch(`https://exerciseplus-a70aea8e1a80.herokuapp.com/api/workouts/${workoutId}/report/`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ reason }),
//       });

//       if (!response.ok) {
//         const errorText = await response.json();
//         setError(errorText.error || 'Failed to report workout');
//         throw new Error(errorText.error || 'Failed to report workout');
//       }
//     } catch (error: any) {
//       console.error('Report workout error:', error.message);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {reportWorkout, loading, error};
// };
