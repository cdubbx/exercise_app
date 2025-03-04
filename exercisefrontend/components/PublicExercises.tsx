import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useUploadWorkOuts } from '../hooks/exercises'
import FetchedExercise from '../cards/FetchedExercise';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { ExploreStackParamList } from '../interfaces/screentypes';


interface PublicExerciseScreenProps { 
    navigation: NavigationProp<ExploreStackParamList, 'PublicWorkoutsScreen'>;
    route: RouteProp<ExploreStackParamList, 'PublicWorkoutsScreen'>;
}
const PublicExercises: React.FC<PublicExerciseScreenProps> = ({navigation, route}) => {
    const {publicWorkouts} = route.params;
  return (
   <FlatList
   contentContainerStyle = {styles.container}
   data={publicWorkouts}
   keyExtractor={(item) => item.id.toString()}
   renderItem={({item}) => (
        <FetchedExercise item = {item} />
   )}
   ListHeaderComponent={
    <View>
        <Text style={styles.headerText}>Public Exercises</Text>
    </View>
   }
   />
  )
}

  

const styles = StyleSheet.create({
    container: {
        marginTop:100,
    },
    headerText: {
        textAlign:'center',
        fontSize:20
    }
})

export default PublicExercises