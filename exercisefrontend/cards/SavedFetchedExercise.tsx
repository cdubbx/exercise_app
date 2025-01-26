import {
  View,
  Text,
  SafeAreaView,
  Image,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {Box, HStack, Text as MatText, Stack} from '@react-native-material/core';
import React, {useContext, useEffect, useState} from 'react';
import {ExerciseCardProps} from '../interfaces'; // Ensure this path is correct
import AntDesign from 'react-native-vector-icons/AntDesign';
import RNPickerSelect from 'react-native-picker-select';
import {useSavePlannedWorkouts, useSetExercise} from '../hooks/exercises';
import {Alert} from 'react-native';
import {ExerciseContext} from '../context/ExerciseContext';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {ProfileStackParamList} from '../interfaces/screentypes';

interface SavedExerciseScreenProps {
  route: RouteProp<ProfileStackParamList, 'SavedExercises'>;
  navigation: NavigationProp<ProfileStackParamList, 'SavedExercises'>;
}

const SavedExercise: React.FC<SavedExerciseScreenProps> = ({
  route,
  navigation,
}) => {
  const [modal, setModal] = useState(false);
  const daysOfTheWeek = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
  const [reps, setReps] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>('');
  const {savePlannedWorkouts} = useSavePlannedWorkouts();
  const {addExercises, exercises} = useSetExercise();
  const {exercise: item} = route.params;

  const selectDay = (day: any) => {
    setSelectedDay(day);
  };

  const onSubmit = async () => {
    try {
      const workoutData = {
        exercise: item,
        reps: reps,
        day: selectedDay,
      };
      await savePlannedWorkouts(workoutData);
      console.log(
        'These are the exercises that are being added to state',
        exercises,
      );

      setModal(false);
    } catch (error) {
      Alert.alert(`${error}`);
    }
  };

  return (
    <SafeAreaView>
      <HStack justify="between" style={{padding: 10}}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSubmit()}>
          <Text>Submit</Text>
        </TouchableOpacity>
      </HStack>

      <Stack items="center" spacing={10}>
        <Text>Add to Plan</Text>
        <Text style={{fontSize: 13, color: 'black', fontWeight: 'bold'}}>
          {item?.name}
        </Text>

        <Image
          source={{
            uri:
              Array.isArray(item?.img_url) && item?.img_url.length > 0
                ? item?.img_url[0]
                : 'fallback_image_url_here',
          }}
          style={{height: 300, width: 300, borderRadius: 20}}
        />

        <TextInput
          placeholder="Reps amount"
          style={{right: 130, marginTop: 40}}
          onChangeText={text => setReps(text)}
        />
        <Box style={{right: 120}}>
          <RNPickerSelect
            value={selectedDay} // ✅ Ensures correct selection
            onValueChange={selectDay}
            items={[
              {label: 'Monday', value: 'Monday'},
              {label: 'Tuesday', value: 'Tuesday'},
              {label: 'Wednesday', value: 'Wednesday'},
              {label: 'Thursday', value: 'Thursday'},
              {label: 'Friday', value: 'Friday'},
              {label: 'Saturday', value: 'Saturday'},
              {label: 'Sunday', value: 'Sunday'},
            ]}
            textInputProps={{ pointerEvents: "none" }}
            placeholder={{label: 'Select a day', value: null}} // ✅ Fix placeholder format
            style={{
              inputIOS: {
                color: 'black',
                fontSize: 14,
                padding: 10,
              },
              inputAndroid: {
                color: 'black',
                fontSize: 14,
                padding: 10,
              },
              placeholder: {
                color: 'gray',
                fontSize: 18,
              },
            }}
          />
        </Box>
      </Stack>
    </SafeAreaView>
  );
};

export default SavedExercise;
