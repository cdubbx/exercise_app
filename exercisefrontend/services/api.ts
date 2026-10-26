import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '@env';

// Set API_BASE_URL in .env for a simulator/device or deployed backend.
export const API_URL = (API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');
export async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try { return await fetch(url, {...options, signal: controller.signal}); }
  catch (error: any) { throw new Error(error.name === 'AbortError' ? 'The server took too long to respond. Please try again.' : error.message); }
  finally { clearTimeout(timer); }
}

const expiryListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) {
  expiryListeners.add(listener);
  return () => { expiryListeners.delete(listener); };
}
async function expireSession() {
  await AsyncStorage.multiRemove(['access', 'refresh']);
  expiryListeners.forEach(listener => listener());
}
let refreshInFlight: {refresh: string; promise: Promise<string | null>} | null = null;

export async function getAuthToken(): Promise<string | null> {
  const access = await AsyncStorage.getItem('access');
  return access || refreshAccessToken();
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = await AsyncStorage.getItem('refresh');
  if (!refresh) return null;
  if (refreshInFlight?.refresh === refresh) return refreshInFlight.promise;
  const operation = (async () => {
    const response = await fetchWithTimeout(`${API_URL}/token/refresh/`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refresh}),
    });
    // A pending refresh must not restore or clear a different account's session.
    if (await AsyncStorage.getItem('refresh') !== refresh) return null;
    if (!response.ok) {
      if (response.status === 401) await expireSession();
      return null;
    }
    const data = await response.json();
    await AsyncStorage.setItem('access', data.access);
    if (data.refresh) await AsyncStorage.setItem('refresh', data.refresh);
    return data.access as string;
  })();
  const entry = {refresh, promise: operation};
  refreshInFlight = entry;
  try { return await operation; }
  finally { if (refreshInFlight === entry) refreshInFlight = null; }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Cursor links must stay on the configured API; never send tokens to arbitrary URLs.
  if (!(url === API_URL || url.startsWith(`${API_URL}/`))) throw new Error('Invalid API address.');
  const token = await getAuthToken();
  const session = await AsyncStorage.getItem('refresh');
  const headers = {...options.headers, ...(token ? {Authorization: `Bearer ${token}`} : {})};
  const response = await fetchWithTimeout(url, {...options, headers});
  if (await AsyncStorage.getItem('refresh') !== session) throw new Error('Your account changed. Please try again.');
  if (response.status !== 401 || !token) return response;
  const latest = await AsyncStorage.getItem('access');
  const refreshed = latest && latest !== token ? latest : await refreshAccessToken();
  if (!refreshed) {
    const current = await AsyncStorage.getItem('access');
    if (current && current !== token) throw new Error('Your account changed. Please try again.');
    await expireSession(); return response;
  }
  return fetchWithTimeout(url, {...options, headers: {...headers, Authorization: `Bearer ${refreshed}`}});
}

export async function readResponse(response: Response): Promise<any> {
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    const detail = data.error || data.detail || data;
    throw new Error(typeof detail === 'string' ? detail : Object.entries(detail).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n'));
  }
  return data;
}
