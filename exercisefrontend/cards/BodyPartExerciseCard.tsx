import {View, Text, SafeAreaView, Image} from 'react-native';
import {Box, HStack, Text as MatText, Stack} from '@react-native-material/core';
import React, { useEffect } from 'react';

export default function BodyPartExercise({item}: any) {
  useEffect(() => {
    console.log('This is the item that is in state',item);
    
  }, [])
  return (
    <SafeAreaView>
      <HStack mb={10}
       spacing={20} 
       items="center"      
      >
        <Image
          source={{
            uri:
              Array.isArray(item?.img_url) && item?.img_url.length > 0
                ? item?.img_url[0]
                : 'fallback_image_url_here',
          }}
          style={{height: 60, width: 60, borderRadius: 10}}
        />
        <Stack spacing={3}>
          <Text style={{fontSize: 13, color: 'gray', fontWeight: 'bold'}}>
            {item?.name}
          </Text>
          <Text style={{fontSize: 11, color: 'gray', fontWeight: 'bold'}}>
            {item?.category}
          </Text>
        </Stack>
      </HStack>
    </SafeAreaView>
  );
}
