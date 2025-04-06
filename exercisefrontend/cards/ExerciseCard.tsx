import {
  View,
  Image,
  StyleProp,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Box, HStack, Stack, Text} from '@react-native-material/core';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useSaveWorkOuts, useSetExercise} from '../hooks/exercises';
import {HomeStackParamList} from '../interfaces/screentypes';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {Alert} from 'react-native';

interface Props {
  navigation: NavigationProp<HomeStackParamList, 'ExerciseCard'>;
  route: RouteProp<HomeStackParamList, 'ExerciseCard'>;
}

// Note the correction in the prop name from 'exericse' to 'exercise' and the typing syntax
const ExerciseCard: React.FC<Props> = ({route, navigation}: any) => {
  const {addExercises} = useSetExercise();
  const {saveWorkouts, error, loading} = useSaveWorkOuts();
  const [showMore, setShowMore] = useState<boolean>(false);
  const [showMoreText, setShowMoreText] = useState<string>('Show more');

  const exerciseItems = route.params?.item;
  useEffect(() => {
    console.log('These are the exercise items', exerciseItems);
  });

  const onSaveWorkout = async () => {
    try {
      if (exerciseItems !== undefined) {
        const result = await saveWorkouts(exerciseItems);
        if(result)
        addExercises(exerciseItems);
      }
    } catch (err: any) {
      console.log(err);
      Alert.alert(
        'Error',
        err.message || 'An error occurred while saving the workout.',
      );
    }
  };

  const toggleShowMore = () => {
    setShowMore(prev => !prev);
    if (!showMore) {
      setShowMoreText('Show less');
    } else {
      setShowMoreText('Show more');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack spacing={10}>
        <HStack ph={25} pv={15} spacing={20} items="center" justify="between">
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}>
            <AntDesign name="leftcircle" size={20} color={'black'} />
          </TouchableOpacity>
          <Text color="black" style={styles.headerText}>
            {exerciseItems?.name}
          </Text>
          <Box mr={-10}>
            <Entypo name="dots-three-vertical" size={15} color={'black'} />
          </Box>
        </HStack>
        <Image
          source={{
            uri:
              Array.isArray(exerciseItems?.img_url) &&
              exerciseItems?.img_url.length > 0
                ? exerciseItems?.img_url[0]
                : 'fallback_image_url_here',
          }}
          style={{height: 300, width: 'auto'}}
        />
        <Stack p={10} style={styles.contentContainer} spacing={20}>
          <Text style={styles.categoryText}>
            Category:{' '}
            {exerciseItems?.category.charAt(0).toUpperCase() +
              exerciseItems?.category.slice(1)}
          </Text>
          <Text style={styles.equipmentText}>
            Equipment:{' '}
            {exerciseItems?.equipment.charAt(0).toUpperCase() +
              exerciseItems?.equipment.slice(1)}
          </Text>

          <Text
            numberOfLines={showMore ? undefined : 3}
            style={styles.instructions}>
            {exerciseItems?.instructions}
          </Text>
          <TouchableOpacity onPress={toggleShowMore}>
            <Text>{showMoreText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            disabled={loading}
            onPress={() => {
              onSaveWorkout();
            }}>
            <Text style={styles.saveButtonText} color="white">
              Save
            </Text>
          </TouchableOpacity>
        </Stack>
      </Stack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
  },
  instructions: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#323131',
    textAlign: 'left',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: 'black',
    borderRadius: 10,
    width: '70%',
    alignSelf: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  equipmentText: {
    fontSize: 20,
    color: 'black',
  },
  categoryText: {
    fontSize: 20,
    color: 'black',
  },
  headerText: {
    fontSize: 20,
    width: '70%',
    textAlign: 'center',
  },
});
export default ExerciseCard;
