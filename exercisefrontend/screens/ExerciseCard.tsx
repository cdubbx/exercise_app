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

const Exercise  = ({item}:any) => {
  const {exercise} = item;
  const [modal, setModal] = useState(false);
  const daysOfTheWeek = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
  const [reps, setReps] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>('');
  const {savePlannedWorkouts} = useSavePlannedWorkouts();
  const {addExercises, exercises} = useSetExercise();

  const selectDay = (day: any) => {
    setSelectedDay(day);
  };

  const onSubmit = async () => {
    try {
      const workoutData = {
        workout: item,
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
      <HStack justify="between" items="center">
        <HStack mb={10} spacing={40} items="center">
          <Image
            source={{
              uri:
                Array.isArray(item?.img_url) && item?.img_url.length > 0
                  ? item?.img_url[0]
                  : 'fallback_image_url_here',
            }}
            style={{height: 100, width: 100, borderRadius: 10}}
          />
          <Stack spacing={3}>
            <Text style={{fontSize: 13, color: 'white', fontWeight: 'bold'}}>
              {item?.name}
            </Text>
            <Text style={{fontSize: 11, color: 'white', fontWeight: 'bold'}}>
              {item?.category}
            </Text>
          </Stack>
        </HStack>
        <TouchableOpacity
          onPress={() => {
            setModal(true);
          }}>
          <AntDesign name="plussquare" size={20} color={'white'} />
        </TouchableOpacity>
      </HStack>

      <Modal
        visible={modal}
        onRequestClose={() => {
          setModal(false);
        }}
        transparent={false}>
        <SafeAreaView>
          <HStack justify="between" style={{padding: 10}}>
            <TouchableOpacity onPress={() => setModal(false)}>
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
                  Array.isArray(item?.img_url) &&
                  item?.img_url.length > 0
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
                items={[
                  {label: 'Monday', value: 'Monday'},
                  {label: 'Tuesday', value: 'Tuesday'},
                  {label: 'Wednesday', value: 'Wednesday'},
                  {label: 'Thursday', value: 'Thursday'},
                  {label: 'Friday', value: 'Friday'},
                  {label: 'Saturday', value: 'Saturday'},
                  {label: 'Sunday', value: 'Sunday'},
                ]}
                onValueChange={selectDay}
                style={{
                  inputIOS: {
                    color: 'black', // iOS picker text color
                    fontSize: 14,
                    padding: 10,
                  },
                  inputAndroid: {
                    color: 'black', // Android picker text color
                    fontSize: 14,
                    padding: 10,
                  },
                  placeholder: {
                    color: 'gray', // Placeholder text color
                    fontSize: 18,
                  },
                }}
              />
            </Box>
          </Stack>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Exercise;
