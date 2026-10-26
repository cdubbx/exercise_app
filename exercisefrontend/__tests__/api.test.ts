import {jest, test, expect, beforeEach} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL, apiFetch, getAuthToken, refreshAccessToken, readResponse, onSessionExpired} from '../services/api';
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const response = (status: number, data: unknown) => ({status, ok: status < 400, json: jest.fn<() => Promise<unknown>>().mockResolvedValue(data)} as unknown as Response);
const fetchMock = jest.fn<typeof fetch>();
beforeEach(async () => { jest.clearAllMocks(); await AsyncStorage.clear(); global.fetch = fetchMock; fetchMock.mockReset(); });

test('refresh preserves the existing refresh token when rotation is disabled', async () => {
  await AsyncStorage.setItem('refresh', 'keep-me');
  fetchMock.mockResolvedValue(response(200, {access: 'new-access'}));
  expect(await getAuthToken()).toBe('new-access');
  expect(await AsyncStorage.getItem('refresh')).toBe('keep-me');
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({refresh: 'keep-me'});
});

test('parallel refreshes share one network operation', async () => {
  await AsyncStorage.setItem('refresh', 'refresh');
  fetchMock.mockResolvedValue(response(200, {access: 'new'}));
  expect(await Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()])).toEqual(['new', 'new', 'new']);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('an expired access token refreshes once and retries the original request', async () => {
  await AsyncStorage.multiSet([['access', 'old'], ['refresh', 'refresh']]);
  fetchMock.mockResolvedValueOnce(response(401, {})).mockResolvedValueOnce(response(200, {access: 'new'})).mockResolvedValueOnce(response(200, {id: 'user'}));
  const result = await apiFetch(`${API_URL}/user/`);
  expect(result.status).toBe(200); expect(fetchMock).toHaveBeenCalledTimes(3);
  expect((fetchMock.mock.calls[2][1]?.headers as Record<string, string>).Authorization).toBe('Bearer new');
});

test('invalid refresh clears both tokens and stops retrying', async () => {
  await AsyncStorage.multiSet([['access', 'old'], ['refresh', 'invalid']]);
  fetchMock.mockResolvedValue(response(401, {}));
  expect((await apiFetch(`${API_URL}/user/`)).status).toBe(401);
  expect(fetchMock).toHaveBeenCalledTimes(2); expect(await AsyncStorage.getItem('access')).toBeNull(); expect(await AsyncStorage.getItem('refresh')).toBeNull();
});

test('network failure preserves credentials for retry', async () => {
  await AsyncStorage.setItem('refresh', 'keep-me'); fetchMock.mockRejectedValue(new Error('Offline'));
  await expect(refreshAccessToken()).rejects.toThrow('Offline');
  expect(await AsyncStorage.getItem('refresh')).toBe('keep-me');
});

test('cursor links cannot exfiltrate credentials to another host', async () => {
  await expect(apiFetch('https://untrusted.example/api/users/')).rejects.toThrow('Invalid API address');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('backend validation errors are readable and 204 needs no JSON', async () => {
  await expect(readResponse(response(400, {sets: ['Must be positive.']}))).rejects.toThrow('sets: Must be positive.');
  const empty = response(204, null); expect(await readResponse(empty)).toBeNull(); expect(empty.json).not.toHaveBeenCalled();
});

test('expired credentials notify the app to return to sign-in', async () => {
  const expired = jest.fn(); const unsubscribe = onSessionExpired(expired);
  await AsyncStorage.multiSet([['access', 'old'], ['refresh', 'bad']]);
  fetchMock.mockResolvedValue(response(401, {}));
  await apiFetch(`${API_URL}/user/`); expect(expired).toHaveBeenCalled(); unsubscribe();
});

test('a refresh finishing after logout cannot restore the old credentials', async () => {
  await AsyncStorage.setItem('refresh', 'old-refresh');
  let finish!: (value: Response) => void;
  fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = refreshAccessToken();
  await new Promise(resolve => setTimeout(resolve, 0));
  await AsyncStorage.clear(); finish(response(200, {access: 'old-access'}));
  expect(await pending).toBeNull(); expect(await AsyncStorage.getItem('access')).toBeNull();
});

test('a request from an old account is never retried as a newly signed-in account', async () => {
  await AsyncStorage.multiSet([['access', 'old-access'], ['refresh', 'old-refresh']]);
  let finish!: (value: Response) => void;
  fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = apiFetch(`${API_URL}/user/update/`, {method: 'POST'});
  const rejected = expect(pending).rejects.toThrow('Your account changed');
  await new Promise(resolve => setTimeout(resolve, 0));
  await AsyncStorage.multiSet([['access', 'new-access'], ['refresh', 'new-refresh']]);
  finish(response(401, {})); await rejected;
  expect(fetchMock).toHaveBeenCalledTimes(1); expect(await AsyncStorage.getItem('access')).toBe('new-access');
});
