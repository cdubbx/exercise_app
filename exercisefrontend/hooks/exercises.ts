import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useEffect, useContext} from 'react';
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
        const response = await fetch('http://192.168.0.8:8000/api/exercises/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
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

  return {exercises, loading, error};
};

export const useMuscleExercise = (bodyPart: string) => {
  const [bodyExercises, setBodyExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(
          `http://192.168.0.8:8000/api/exercises/?primaryMuscles=${bodyPart}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        // ✅ Ensure we only filter when needed (SQLite workaround)
        const filteredExercises = data.filter((exercise: any) =>
          exercise.primaryMuscles?.includes(bodyPart),
        );

        setBodyExercises(filteredExercises);
      } catch (error) {
        if (error instanceof Error) {
          setError(error);
        }
      } finally {
        setLoading(false);
      }
    };

    if (bodyPart) {
      fetchExercises();
    }
  }, [bodyPart]);

  return {loading, bodyExercises, error};
};

export const useSaveWorkOuts = () => {
  const [loading, setLoading] = useState(false);

  const saveWorkouts = async (item: any) => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('access'); // Retrieve the access token

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch('http://192.168.0.8:8000/api/saveWorkOuts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`, // Use the access token
        },
        body: JSON.stringify({
          workout: item,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText); // Debugging line
        throw new Error('Network error');
      }

      setLoading(false);
    } catch (error: any) {
      console.log('Save workout error:', error.message);
      setLoading(false);
    }
  };

  return {saveWorkouts, loading};
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
        'http://192.168.0.8:8000/api/plannedWorkouts/',
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
    } catch (error) {
      console.log(error);
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
        const token = await AsyncStorage.getItem('access');
        const response = await fetch(
          'http://192.168.0.8:8000/api/userSavedWorkouts/',
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
  const [fetchedExercises, setFetchedExercises] = useState([]);
  useEffect(() => {
    let isMounted = true;
    const fetchPlannedWorkouts = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('access');
        const response = await fetch(
          'http://192.168.0.8:8000/api/plannedWorkouts/',
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
        setFetchedExercises(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchPlannedWorkouts();
  }, []);

  return {fetchedExercises, loading};
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
    'http://192.168.0.8:8000/api/user-upload-workouts/',
  );

  async function addWorkout(exercise: any) {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(
        'http://192.168.0.8 :8000/api/user-upload-workout/',
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
        'http://192.168.0.8:8000/api/user-upload-workouts/?is_public=true',
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
