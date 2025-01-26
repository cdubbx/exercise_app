import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';

interface AvatarProps {
    imageUrl: string | undefined
}

export const Avatar:React.FC<AvatarProps> = ({imageUrl}) => {
  const profileImage = require('../assets/images/profileImage.jpg');
  return (
    <View>
      <Image source={imageUrl? {uri: imageUrl} : profileImage} style={styles.avatar} />
    </View>
  );
};

const styles = StyleSheet.create({
    avatar: {
        height:90,
        width:90, 
        borderRadius:90,
        
    }
});
