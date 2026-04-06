import {View, Text, SafeAreaView, Image} from 'react-native';
import {Box, HStack, Text as MatText, Stack} from '@react-native-material/core';
import React, {useEffect} from 'react';
import {getImageUrl} from '../utils/utils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function BodyPartExercise({item}: any) {
  useEffect(() => {
    console.log('this is the item', item?.img_url[0]);
  }, []);

  return (
    <SafeAreaView>
      <HStack mb={10} spacing={20} items="center">
        <Image
          source={{
            uri:
              item?.img_url &&
              Array.isArray(item?.img_url) &&
              item?.img_url.length > 0
                ? getImageUrl(item?.img_url[0])
                : item?.img_url,
            cache: 'default',
          }}
          style={{height: 60, width: 60, borderRadius: 10}}
        />
        <Stack spacing={3} style={{flex: 1}}>
          <Text
            numberOfLines={3}
            style={{
              fontSize: 14,
              color: 'black',
              fontWeight: 'bold',
              flexShrink: 1,
              flexWrap: 'wrap',
            }}>
            {item?.name}
          </Text>
          <Text style={{fontSize: 11, color: 'black'}}>{item?.category}</Text>
        </Stack>

        <MaterialIcons
          name="keyboard-arrow-right"
          size={30}
          color={'#b1b1b1ff'}
        />
      </HStack>
    </SafeAreaView>
  );
}
