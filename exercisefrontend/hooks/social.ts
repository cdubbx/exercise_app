import {useEffect, useState} from 'react';
import AWS from 'aws-sdk';
import RNFetchBlob from 'react-native-blob-util';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';
import {getAuthToken} from './auth';
import {User} from '../interfaces/types';
import {SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID} from '@env';

export interface SelectedFile {
  uri: string;
  name?: string;
  type?: string;
}

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-east-2',
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  params: {Bucket: 'exerciseplus'},
});

export const useS3Uploader = () => {
  const [uploadProgess, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>('');


  
  const uploadToS3 = async (file: any, path: 'profile' | 'exercises'): Promise<string | null | undefined> => {
    
    if (!file) {
      throw new Error('No file provided for upload');
    }
    setError(null);
    setUploadProgress(0);
    let params;

    try {
      switch (path) {
        case 'profile':
        case 'exercises': 
          params = {
            Bucket: 'exerciseplus',
            Key: `${path}-images/${file.name}`, 
            ContentType: file.type,
          };
          break;
        default:
          throw new Error('Invalid path provided');
      }
      if (!params) {
        throw new Error('S3 upload parameters not defined');
      }
      const signedUrl = await s3.getSignedUrlPromise('putObject', params);
      console.log("Signed URL:", signedUrl);
      console.log(file.type);
      
      const response = await RNFetchBlob.fetch(
        'PUT',
        signedUrl,
        {
          'Content-Type': file.type,
        },
        RNFetchBlob.wrap(file.uri.replace('file://', '')),
      );
      if (response.respInfo.status === 200) {
        const uploadedUrl = signedUrl.split('?')[0];
        setUploadedUrl(uploadedUrl);
        return uploadedUrl;
      } else {
        throw new Error(
          `Upload failed with status ${response.respInfo.status}`,
        );
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Upload error:', error);
      return null; 
    }
  };

  return {uploadToS3, uploadProgess, uploadedUrl};
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
        return false;
      }
      if (result.errorMessage) {
        setError(result.errorMessage);
        setFile(null);
        return false;
      }

      if (result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setFile({
          uri: selectedAsset.uri!,
          name: selectedAsset.fileName || 'unknown',
          type: selectedAsset.type || 'image/jpeg',
        });
        return true;
      }
    } catch (error) {
      setError(`An error has occurred while picking the file: ${error}`);
      console.error(error);
      setFile(null);
    }
  };
  return {file, error, pickFile, setFile};
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [nextUrl, setNextUrl] = useState<string | null>(
    'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/users/',
  );

  async function fetchUsers() {
    if (!nextUrl || isLoading) return;
    try {
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
      setUsers(prevUsers => [...prevUsers, ...data.results]);
      setNextUrl(data.next);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchUsers();
  }, []);

  return {users, isLoading, fetchUsers, hasMore: !!nextUrl};
};
