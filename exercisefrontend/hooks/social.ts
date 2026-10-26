import {API_URL, apiFetch, readResponse} from '../services/api';
import {useEffect, useState, useRef} from 'react';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';
import {getAuthToken} from './auth';
import {User} from '../interfaces/types';

export interface SelectedFile {
  uri: string;
  name?: string;
  type?: string;
}

export const useS3Uploader = () => {
  const [uploadProgess, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const uploadToS3 = async (file: SelectedFile, path: 'profile' | 'exercises'): Promise<string> => {
    setError(null); setUploadProgress(0);
    try {
      const form = new FormData();
      form.append('path', path);
      form.append('file', {uri: file.uri, name: file.name || 'image.jpg', type: file.type || 'image/jpeg'} as any);
      const data = await readResponse(await apiFetch(`${API_URL}/uploads/`, {method: 'POST', body: form}));
      setUploadedUrl(data.url); setUploadProgress(100);
      return data.url;
    } catch (err: any) { setError(err.message); throw err; }
  };
  return {uploadToS3, uploadProgess, uploadedUrl, error};
};

export const useFilePicker = () => {
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFile = async () => {
    try {
      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 1,
      };
  
      const result = await launchImageLibrary(options);
      if (result.didCancel) {
        setError('File selection canceled');
        setFile(null);
        return null;
      }
      if (result.errorMessage) {
        setError(result.errorMessage);
        setFile(null);
        return null;
      }
  
      if (result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const file = {
          uri: selectedAsset.uri!,
          name: selectedAsset.fileName || 'unknown',
          type: selectedAsset.type || 'image/jpeg',
        };
        setFile(file);
        return file; // ✅ return the file here
      }
  
      return null;
    } catch (error) {
      setError(`An error has occurred while picking the file: ${error}`);
      console.error(error);
      setFile(null);
      return null;
    }
  };
  return {error, pickFile, setFile, file};
};

export const useUsers = (search = '') => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const next = useRef<string | null>(null);
  const busy = useRef(false);
  const version = useRef(0);
  const fetchUsers = async () => {
    if (!next.current || busy.current) return;
    busy.current = true; setLoading(true); setError('');
    const current = version.current;
    try {
      const data = await readResponse(await apiFetch(next.current));
      if (current !== version.current) return;
      setUsers(prev => [...prev, ...data.results]); next.current = data.next;
    } catch (err: any) { if (current === version.current) setError(err.message); }
    finally { if (current === version.current) { busy.current = false; setLoading(false); } }
  };
  useEffect(() => {
    const current = ++version.current;
    setUsers([]); busy.current = false;
    next.current = `${API_URL}/users/?search=${encodeURIComponent(search.trim())}`;
    const timer = setTimeout(() => { void fetchUsers(); }, 250);
    return () => { version.current = current + 1; clearTimeout(timer); };
  }, [search]);
  return {users, isLoading, fetchUsers, hasMore: !!next.current, error};
};
