import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useFilePicker, useS3Uploader} from '../hooks/social';
import {useUploadWorkOuts} from '../hooks/exercises';

interface ExerciseData {
  [key: string]: any;
  primaryMuscles: string[] | undefined;
  img_url: string[] | undefined;
}
const WorkoutForm = () => {
  const {file, error, pickFile, setFile} = useFilePicker();
  const {uploadToS3} = useS3Uploader();
  const {addWorkout, isLoading} = useUploadWorkOuts();
  const [exerciseData, setExerciseData] = useState<ExerciseData>({
    name: '',
    category: '',
    primaryMuscles: [],
    equipment: '',
    level: '',
    img_url: [],
    mechanic: '',
  });

  const initialExerciseData = {
    name: '',
    category: '',
    primaryMuscles: [],
    equipment: '',
    level: '',
    img_url: [],
    mechanic: '',
  }

  const handleUpLoadWorkout = async () => {
    try {
      console.log(exerciseData);
      const message = await addWorkout(exerciseData);
      Alert.alert(message);
      setExerciseData(initialExerciseData)
    } catch (error) {
      Alert.alert('An error has occured', `${error}`);
    }
  };

  const handleImageUpload = useCallback(async () => {
    if (!file) {
      Alert.alert('No file selected');
      return;
    }
    try {
      const url = await uploadToS3(file, 'exercises');
      console.log('This is the uploaded url', url);

      if (url) {
        setExerciseData(prev => ({
          ...prev,
          img_url: [...(prev.img_url ?? []), url],
        }));
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Upload failed:', err);
        Alert.alert('Error uploading file', err.message);
      }
    }
  }, [file, uploadToS3]);

  // make it so you can see more than one image that is uploaded at time.

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Upload Workout</Text>
      <Text style={styles.label}>Workout Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter workout name"
        value={exerciseData.name}
        onChangeText={text =>
          setExerciseData(prev => ({
            ...prev,
            name: text,
          }))
        }
      />

      <Text style={styles.label}>Equipment</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Equipment"
        value={exerciseData.equipment}
        onChangeText={text =>
          setExerciseData(prev => ({
            ...prev,
            equipment: text,
          }))
        }
      />

      <Text style={styles.label}>Mechanic</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Mechanic"
        value={exerciseData.mechanic}
        onChangeText={text =>
          setExerciseData(prev => ({
            ...prev,
            mechanic: text,
          }))
        }
      />

      <Text style={styles.label}>Level</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter level (e.g. low, medium, high)"
        value={exerciseData.level}
        onChangeText={text =>
          setExerciseData(prev => ({
            ...prev,
            level: text,
          }))
        }
      />

      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter category"
        value={exerciseData.cateogry}
        onChangeText={text =>
          setExerciseData(prev => ({
            ...prev,
            category: text,
          }))
        }
      />

      <Text style={styles.label}>Primary Muscles</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter the Primary muscles"
        value={exerciseData.primaryMuscles?.join(' ') || ''} // Ensure it's a valid string
        onChangeText={text => {
          const musclesArray = text
            .trim() // Remove leading/trailing spaces
            .split(' ') // Convert text into an array
            .filter(Boolean); // Remove empty values caused by extra spaces

          setExerciseData(prev => ({
            ...prev,
            primaryMuscles: musclesArray.length > 0 ? musclesArray : [], // Avoid `['']`
          }));
        }}
      />

      <Text style={styles.label}>Upload an Image</Text>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={async () => {
          const result = await pickFile(); // Ensure file is picked first
          if (result) {
            await handleImageUpload(); // Call upload only if a file was picked
          }
        }}>
        {file && (
          <Image source={{uri: file?.uri}} style={styles.imageContainer} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleUpLoadWorkout}>
        <Text style={styles.buttonText}>Submit Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f4f4f4',
    marginHorizontal:10,
    marginTop:100,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    height: 300,
    width: 300,
  },
});

export default WorkoutForm;
