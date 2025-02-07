import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useEffect} from 'react';
import { PlannedWorkout, SavedWorkout } from '../interfaces';

export const useExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        const response = await fetch('http://localhost:8000/api/exercises/', {
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

export const useMuscleExercise = (bodyPart: String) => {
  const [bodyExercises, setBodyExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/exercises/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        const filteredExercises = data.filter((exercise: any) =>
          exercise.primaryMuscles.includes(bodyPart),
        );
        setBodyExercises(filteredExercises);
        console.log('Filtered exercises:', filteredExercises);
      } catch (error) {
        if (error instanceof Error) {
          setError(error);
          setLoading(false);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [bodyPart]);

  return {loading, bodyExercises};
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


      const response = await fetch('http://localhost:8000/api/saveWorkOuts', {
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
  const savePlannedWorkouts = async (workout:any) => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('access')

      if (!token) {
        throw new Error('No access token found');
      }
      const response = await fetch('http://localhost:8000/api/plannedWorkouts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(
          { 
            workout: workout
          }),
        
      })
      if(!response.ok){
        throw new Error('Network error')
      }
      
    } catch (error) {
      console.log(error);
    }
  }
  return {savePlannedWorkouts, loading}
}

export const useFetchedSavedWorkOuts = () => {
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    let isMounted = true; // flag to check if the component is mounted

    const fetchSavedWorkouts = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('access');
        const response = await fetch(
          'http://localhost:8000/api/userSavedWorkouts/',
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
        if (isMounted) {
          setExercises(data);
        }
      } catch (error) {
        console.error('Error fetching saved workouts:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchSavedWorkouts();
    return () => {
      isMounted = false; // cleanup function to set the flag to false
    };
  }, []);

  return {exercises, loading};
};


export const useFetchedPlanedWorkouts = () => {
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  useEffect(()=> {
    let isMounted = true;

    const fetchPlannedWorkouts = async () => {
      try{
          setLoading(true)
          const token = await AsyncStorage.getItem('access');
          const response = await fetch('http://localhost:8000/api/plannedWorkouts/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json', 
              Authorization: `Bearer ${token}`
            }, 
          })

          if(!response.ok){
            throw new Error('Network Error')
          }
       
             
          const data = await response.json();
  
           setExercises(data);
            
            //  console.log('Fetched planned workouts:', JSON.stringify(data, null, 2)); // Log the entire response
                
      } catch (error){
        console.log(error);
        
      }
    }

    fetchPlannedWorkouts()
  }, [])
  

  return {exercises, loading}
}