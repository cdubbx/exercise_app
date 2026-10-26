import {afterEach, beforeEach, expect, jest, test} from '@jest/globals';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {useFetchedSavedWorkOuts, useUploadWorkOuts} from '../hooks/exercises';
const mockFetch = jest.fn<(...args: any[]) => Promise<any>>();
jest.mock('../services/api', () => ({API_URL: 'http://localhost/api', apiFetch: (...args: any[]) => mockFetch(...args), readResponse: async (response: any) => response.payload}));
jest.mock('../context/ExerciseContext', () => ({ExerciseContext: require('react').createContext({})}));
jest.mock('../context/ChatContext', () => ({useChat: jest.fn()}));
jest.mock('@react-navigation/native', () => ({useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect])}));
let own: ReturnType<typeof useUploadWorkOuts>; let saved: ReturnType<typeof useFetchedSavedWorkOuts>;
function Own() { own = useUploadWorkOuts(false); return null; }
function Saved() { saved = useFetchedSavedWorkOuts(); return null; }
let tree: renderer.ReactTestRenderer;
beforeEach(() => { jest.clearAllMocks(); });
afterEach(() => { act(() => tree.unmount()); });
test('private custom exercise loading does not request the deferred public feed', async () => {
  mockFetch.mockResolvedValue({payload: {results: [{id: 'own'}], next: null}});
  await act(async () => { tree = renderer.create(<Own />); });
  expect(mockFetch).toHaveBeenCalledTimes(1); expect(mockFetch.mock.calls[0][0]).toBe('http://localhost/api/user-upload-workouts/'); expect(own.userWorkouts).toEqual([{id: 'own'}]);
});
test('an old load cannot overwrite a newer refresh', async () => {
  let resolve!: (data: any) => void;
  mockFetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await act(async () => { tree = renderer.create(<Saved />); });
  mockFetch.mockResolvedValue({payload: [{id: 'new'}]});
  await act(async () => { await saved.refresh(); });
  await act(async () => { resolve({payload: [{id: 'old'}]}); });
  expect(saved.fetchedExercises).toEqual([{id: 'new'}]); expect(saved.loading).toBe(false);
});

test('muscle refresh ignores an older page and allows another load after failure', async () => {
  const {useMuscleExercise} = require('../hooks/exercises');
  let muscle: ReturnType<typeof useMuscleExercise>;
  function Muscle() { muscle = useMuscleExercise('biceps'); return null; }
  let resolve!: (data: any) => void;
  mockFetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await act(async () => { tree = renderer.create(<Muscle />); });
  mockFetch.mockResolvedValueOnce({payload: {results: [{id: 'fresh'}], next: 'page-two'}});
  await act(async () => { muscle.refresh(); });
  await act(async () => { resolve({payload: {results: [{id: 'stale'}], next: null}}); });
  expect(muscle.bodyExercises).toEqual([{id: 'fresh'}]);
  mockFetch.mockRejectedValueOnce(new Error('Offline'));
  await act(async () => { muscle.loadMoreExercises(); });
  expect(muscle.bodyExercises).toEqual([{id: 'fresh'}]); expect(muscle.error?.message).toBe('Offline');
  mockFetch.mockResolvedValueOnce({payload: {results: [{id: 'fresh'}, {id: 'second'}], next: null}});
  await act(async () => { muscle.loadMoreExercises(); });
  expect(muscle.bodyExercises).toEqual([{id: 'fresh'}, {id: 'second'}]); expect(muscle.error).toBeNull(); expect(muscle.hasMore).toBe(false);
});
