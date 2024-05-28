import {View, Text, SafeAreaView, Image} from 'react-native';
import {Box, HStack, Text as MatText, Stack} from '@react-native-material/core';
import React from 'react';

export default function BodyPartExercise({item}: any) {
  return (
    <SafeAreaView>
      <HStack mb={10}
       spacing={40} 
       items="center"
    //    style = {{
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.25,
    //     shadowRadius: 3.84,
    //     elevation: 5, // For Android shado
    //    }}
      
      
      >
        //@ts-ignore
        <Image
          source={{
            uri:
              Array.isArray(item?.img_url) && item?.img_url.length > 0
                ? item?.img_url[0]
                : 'fallback_image_url_here',
          }}
          style={{height: 100, width: 100, borderRadius: 10}}
        />
        //@ts-ignore
        <Stack spacing={3}>
          <Text style={{fontSize: 13, color: 'white', fontWeight: 'bold'}}>
            {item?.name}
          </Text>
          <Text style={{fontSize: 11, color: 'white', fontWeight: 'bold'}}>
            {item?.category}
          </Text>
        </Stack>
      </HStack>
    </SafeAreaView>
  );
}
