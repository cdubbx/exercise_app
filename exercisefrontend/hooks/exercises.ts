import {useState, useEffect, useContext, useRef, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Exercise} from '../interfaces/interfaces';
import {ExerciseContext} from '../context/ExerciseContext';
import {API_URL, apiFetch, readResponse} from '../services/api';
import {useChat} from '../context/ChatContext';

async function request(path: string, method = 'GET', body?: unknown) {
  return readResponse(await apiFetch(`${API_URL}/${path}`, {
    method, headers: {'Content-Type': 'application/json'},
    ...(body === undefined ? {} : {body: JSON.stringify(body)}),
  }));
}

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const searchExercises = useCallback(async (search: string) => {
    return (await request(`exercises/?search=${encodeURIComponent(search)}`)).results;
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    searchExercises('').then(data => { if (active) setExercises(data); })
      .catch(err => { if (active) setError(err); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [searchExercises]);
  return {exercises, loading, error, searchExercises};
};

export const useMuscleExercise = (bodyPart: string) => {
  const [bodyExercises, setBodyExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const fetchPage = async (url: string, append: boolean, version: number) => {
    busy.current = true;
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const data = await readResponse(await apiFetch(url));
      if (generation.current !== version) return;
      setBodyExercises(prev => Array.from(new Map((append ? [...prev, ...data.results] : data.results).map((ex: Exercise) => [ex.id, ex])).values()) as Exercise[]);
      setNextUrl(data.next);
    } catch (err: any) { if (generation.current === version) setError(err); }
    finally { if (generation.current === version) { busy.current = false; setLoading(false); setLoadingMore(false); } }
  };
  const refresh = useCallback(() => {
    const version = ++generation.current;
    busy.current = false; setLoadingMore(false); setError(null);
    setBodyExercises([]); setNextUrl(null);
    // Legs is a navigation category whose existing cards select a specific muscle.
    if (bodyPart === 'legs') { setLoading(false); return; }
    void fetchPage(`${API_URL}/exercises/?primaryMuscles=${encodeURIComponent(bodyPart)}`, false, version);
  }, [bodyPart]);
  useEffect(() => {
    const requests = generation;
    refresh();
    return () => { requests.current++; };
  }, [refresh]);
  const loadMoreExercises = () => { if (nextUrl && !busy.current) void fetchPage(nextUrl, true, generation.current); };
  return {bodyExercises, loading, loadingMore, error, loadMoreExercises, refresh, hasMore: !!nextUrl};
};

export const useSaveWorkOuts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const saveWorkouts = async (item: any) => {
    if (busy.current) return null;
    busy.current = true; setLoading(true); setError('');
    try { return await request('saveWorkOuts', 'POST', {workout: item}); }
    catch (err: any) { setError(err.message); throw err; }
    finally { busy.current = false; setLoading(false); }
  };
  return {saveWorkouts, loading, error};
};

export const useSavePlannedWorkouts = () => {
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const savePlannedWorkouts = async (workout: any) => {
    if (busy.current) return null;
    busy.current = true; setLoading(true);
    try { return await request('plannedWorkouts/', 'POST', {workout}); }
    finally { busy.current = false; setLoading(false); }
  };
  return {savePlannedWorkouts, loading};
};

export const useUpdatePlannedWorkout = () => {
  const [loading, setLoading] = useState(false);
  const updatePlannedWorkout = async (id: number, changes: {
    day_of_the_week: string;
    time_of_day: string;
    sets: number;
    reps: number;
  }) => {
    setLoading(true);
    try { return await request(`plannedWorkouts/${id}/`, 'PATCH', changes); }
    finally { setLoading(false); }
  };
  return {updatePlannedWorkout, loading};
};

export const useFetchedSavedWorkOuts = () => {
  const [loading, setLoading] = useState(true);
  const [fetchedExercises, setFetchedExercises] = useState<any[]>([]);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    setLoading(true); setError('');
    try {
      const data = await request('userSavedWorkouts/');
      if (version === generation.current) { setFetchedExercises(data); }
    } catch (failure) {
      if (version === generation.current) { setError(failure instanceof Error ? failure.message : 'Please try again.'); }
    } finally { if (version === generation.current) { setLoading(false); } }
  }, []);
  useFocusEffect(useCallback(() => {
    refresh();
    return () => { generation.current++; };
  }, [refresh]));
  return {fetchedExercises, loading, error, refresh};
};

export const useFetchedPlanedWorkouts = () => {
  const [loading, setLoading] = useState(false);
  const fetchPlannedWorkouts = useCallback(async () => {
    setLoading(true);
    try { return await request('plannedWorkouts/'); }
    finally { setLoading(false); }
  }, []);
  return {loading, fetchPlannedWorkouts};
};

export const useSetExercise = () => {
  const context = useContext(ExerciseContext);
  if (!context) throw new Error('useSetExercise must be used inside ExerciseProvider');
  return context;
};

export const useUploadWorkOuts = (includePublic = true) => {
  const [isLoading, setLoading] = useState(true);
  const [userWorkouts, setUserWorkouts] = useState<any[]>([]);
  const [publicWorkouts, setPublicWorkouts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    setLoading(true); setError('');
    const loadAll = async (path: string) => {
      let url: string | null = `${API_URL}/${path}`;
      const items: any[] = [];
      while (url && version === generation.current) {
        const page = await readResponse(await apiFetch(url));
        items.push(...page.results); url = page.next;
      }
      return items;
    };
    try {
      const [own, shared] = await Promise.all([loadAll('user-upload-workouts/'), includePublic ? loadAll('user-upload-workouts/?is_public=true') : Promise.resolve([])]);
      if (version === generation.current) { setUserWorkouts(own); setPublicWorkouts(shared); }
    } catch (failure) {
      if (version === generation.current) { setError(failure instanceof Error ? failure.message : 'Please try again.'); }
    } finally { if (version === generation.current) { setLoading(false); } }
  }, [includePublic]);
  useFocusEffect(useCallback(() => {
    refresh();
    return () => { generation.current++; };
  }, [refresh]));
  const addWorkout = async (exercise: any) => {
    setLoading(true);
    try { return (await request('user-upload-workout/', 'POST', exercise)).message; }
    finally { setLoading(false); }
  };
  return {addWorkout, isLoading, userWorkouts, publicWorkouts, error, refresh};
};

export const useDeleteWorkout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async (path: string) => {
    setLoading(true); setError(null);
    try { await request(path, 'DELETE'); return true; }
    catch (err: any) { setError(err.message); throw err; }
    finally { setLoading(false); }
  };
  return {
    deleteSavedWorkout: (id: number) => remove(`delete-saved-workout/${id}/`),
    deletePlannedWorkout: (id: number) => remove(`delete-planned-workout/${id}/`),
    deleteUserSavedWorkout: (id: string) => remove(`delete-user-workout/${id}/`), loading, error,
  };
};

export const useReport = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setLoading] = useState(false);
  const reportUser = async (reportObj: any) => {
    setLoading(true);
    try { const data = await request('report/', 'POST', {reportObj}); setMessage(data.message); return data.message; }
    finally { setLoading(false); }
  };
  return {reportUser, message, isLoading};
};
export const useGPTExerciseChat = useChat;
