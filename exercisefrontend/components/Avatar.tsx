import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import { SelectedFile } from '../hooks/social';

interface AvatarProps {
    imageUrl: string | undefined | SelectedFile
    size: {
      height:number | undefined,
      width: number | undefined
    } | undefined
}

export const Avatar:React.FC<AvatarProps> = ({imageUrl,size}) => {
  const resolvedImageUrl = typeof imageUrl === "object" && imageUrl !== null ? imageUrl.uri : imageUrl;

  const profileImage = require('../assets/images/profileImage.jpg');
  return (
    <View>
      <Image source={resolvedImageUrl ?  {uri: resolvedImageUrl} : profileImage} style={[styles.avatar, size ? {height:size.height, width:size.width}: undefined]} />
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
