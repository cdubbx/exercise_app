import { useState } from "react"
import AWS from 'aws-sdk'
import RNFetchBlob from 'react-native-blob-util'
import { ImageLibraryOptions, launchImageLibrary } from "react-native-image-picker";


interface SelectedFile {
    uri: string;
    name?: string;
    type?: string;
  }


// export const useS3Uploader = () => {
//     const [uploadProgess, setUploadProgress] = useState(0);
//     const [error, setError] = useState<string | null>(null);
//     const [uploadedUrl, setUploadedUrl] = useState<string | null>('')

//     const uploadToS3 = async (file:any) => {
//         setError(null);
//         setUploadProgress(0);

//         if(!file) {
//             throw new Error('No file provided for upload');
//         }

//         try {
//             const params = {
//                  Bucket: 'exercisePlus+',
//                  Key: `profile-images/${file.name}`, 
//                  ContentType: file.type
//             }

//             const signedUrl = await s3.getSignedUrlPromise('putObject', params);

//             const response = await RNFetchBlob.fetch(
//                 'PUT', 
//                 signedUrl,
//                 {
//                     'Content-Type': file.type,
//                 }, 
//                 RNFetchBlob.wrap(file.uri.replace('file://', ''))
//             )

//             if(response.respInfo.status === 200) {
//                 setUploadedUrl(signedUrl.split('?')[0])
//                 return signedUrl.split('?')[0]
//             } else {
//                 throw new Error(
//                     `Upload failed with status ${response.respInfo.status}`
//                 )
//             }
//         } catch (err:any){
//             setError(err);
//             console.error(err);
//         }
//     } 

//     return {uploadToS3, uploadProgess, uploadedUrl}
// }

export const useFilePicker = () => {
    const [file, setFile] = useState<SelectedFile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pickFile = async () => {
        try {
            const options: ImageLibraryOptions = {
                mediaType: 'photo',
                quality: 1,
            }

            const result = await launchImageLibrary(options);
            if(result.didCancel){
                setError('File selection canceled');
                setFile(null);
                return;
            }
            if (result.errorMessage){
                setError(result.errorMessage);
                setFile(null);
                return;
            }

            if (result.assets && result.assets.length > 0){
                const selectedAsset = result.assets[0];
                setFile({
                    uri: selectedAsset.uri!,
                    name: selectedAsset.fileName || 'unknown', 
                    type: selectedAsset.type || 'image/jpeg'
                }); 
                setError(null);
            }
        } catch (error) {
            setError(`An error has occurred while picking the file: ${error}`)
            console.error(error);
            setFile(null);            
        }
    }
    return {file, error, pickFile, setFile}
 }
 