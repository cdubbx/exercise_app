import {
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import React, {useEffect} from 'react';
import {useAuth, useLogout} from '../hooks/auth';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {useNavigation} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {useExercises} from '../hooks/exercises';
import {Avatar, Box, HStack, Text, VStack} from '@react-native-material/core';
import ExerciseCard from '../cards/ExerciseCard';

type HomeStackParamList = {
  Home: undefined;
  BodyPart: {bodyParts: string};
  Register: undefined;
};

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export default function HomeScreen({navigation}: Props): React.JSX.Element {
 
  const armImage = require('../assets/AdobeStock_261117493.jpeg');
  const chestImage = require('../assets/AdobeStock_476125371.jpeg');
  const legImage = require('../assets/AdobeStock_310385765.jpeg');
  const abImage = require('../assets/AdobeStock_274012804.jpeg');
  const backImage = require('../assets/AdobeStock_402679815.jpeg');

  const imageCard = {
    bicep: {
      name: 'Biceps',
      img_url: armImage,
      bodyParts: 'biceps',
    },

    chest: {
      name: 'Chest',
      img_url: chestImage,
      bodyParts: 'chest',
    },
    legs: {
      name: 'Legs',
      img_url: legImage,
      bodyParts: 'legs',
    },
    abs: {
      name: 'Abs',
      img_url: abImage,
      bodyParts: 'abdominals',
    },

    back: {
      name: 'Back',
      img_url: backImage,
      bodyParts: 'chest',
    },
  };

  // const navigation = useNavigation<HomeScreenNavigationProp>()

  const {exercises, loading} = useExercises();
  const {logout} = useLogout()

  if (loading) {
    return <Text>Loading</Text>;
  }

  return (
    //@ts-ignore
    <SafeAreaView
      //@ts-ignore
      style={{display: 'flex', justifyContent: 'center', direction: 'row'}}>
      <LinearGradient
        colors={['rgba(67,67,101,1)', 'rgba(32,31,66,1)', 'rgba(2,0,36,1)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <ScrollView>
          <HStack justify="between" items="center" m={10} mb={-3} mr={10}>
            <Avatar
              image={{
                uri: 'https://miro.medium.com/v2/resize:fit:720/format:webp/1*W35QUSvGpcLuxPo3SRTH4w.png',
              }}
              size={30}
            />
            <TouchableOpacity
              onPress={async () => {
                  await logout()
                  navigation.navigate('Register')
              }}>
              <FontAwesome name="bell" size={24} color={'white'} />
            </TouchableOpacity>
          </HStack>

          <HStack m={13} mb={20} justify="start">
            //@ts-ignore
            <Text
              color="white"
              style={{fontWeight: 'bold', fontFamily: 'Arial'}}>
              Welcome User
            </Text>
          </HStack>
          {Object.entries(imageCard).map(([key, card]) => (
            <TouchableOpacity
              key={key}
              activeOpacity={1}
              style={{marginBottom: 10}}
              onPress={() => {
                navigation.navigate('BodyPart', {
                  bodyParts: card.bodyParts,
                });
              }}>
              <HStack
                p={10}
                style={{
                  borderColor: '#494949',
                  borderWidth: 1,
                  borderRadius: 10,
                  height: 200,
                }}>
                //@ts-ignore
                <View
                  style={{width: '100%', height: 150, position: 'relative'}}>
                  <Text
                    style={{
                      top: 10,
                      left: 10,
                      color: 'white',
                      position: 'absolute',
                      zIndex: 1,
                      fontWeight: 'bold',
                      fontSize: 18,
                    }}>
                    {card.name}
                  </Text>

                  <Image
                    source={card.img_url}
                    style={{
                      width: '100%',
                      height: 198,
                      borderRadius: 10,
                      padding: 10,
                      opacity: 0.5,
                    }}
                  />

                  <HStack
                    spacing={10}
                    p={10}
                    justify="center"
                    style={{position: 'absolute', bottom: -50}}>
                    <Box
                      border={0.3}
                      borderColor={'#9A9B9B'}
                      ph={8}
                      pv={3}
                      style={{borderRadius: 20}}>
                      <Text
                        color="white"
                        style={{fontSize: 12, fontWeight: 'bold'}}>
                        Strength
                      </Text>
                    </Box>
                    <Box
                      border={0.3}
                      borderColor={'#9A9B9B'}
                      ph={8}
                      pv={3}
                      style={{borderRadius: 20}}>
                      <Text
                        color="white"
                        style={{fontSize: 12, fontWeight: 'bold'}}>
                        Power Lifting
                      </Text>
                    </Box>

                    <Box
                      border={0.3}
                      borderColor={'#9A9B9B'}
                      ph={8}
                      pv={3}
                      style={{borderRadius: 20}}>
                      <Text
                        color="white"
                        style={{fontSize: 12, fontWeight: 'bold'}}>
                        Stretching
                      </Text>
                    </Box>
                  </HStack>
                </View>
              </HStack>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
