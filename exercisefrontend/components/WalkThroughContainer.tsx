import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

interface WalkThroughContainerProps {
  content: React.ReactNode
  index: number
  total:number; 
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onClose: () => void
  isLast: boolean;
}

export const WalkThroughContainer = (props: WalkThroughContainerProps ) => {
  const {content, index, total, onNext, onBack, onSkip, onClose, isLast} = props
  return (
    <View style = {styles.containerStyle}>
      <View style ={styles.contentContainer}>
         {typeof content === "string" ? <Text>{content}</Text>: content}
      </View>
      <Text style = {styles.paginatorText}>{index + 1} / {total}</Text>
      <View style={styles.backButton}>
        <TouchableOpacity disabled={index === 0} onPress={onBack}>
            <Text style = {{opacity: index === 0 ? 0.4: 1}}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip}>
            <Text>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={isLast ? onClose: onNext}>
            <Text>{isLast ? "Done" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
 

const styles = StyleSheet.create({
    containerStyle: {
        padding: 10, 
        maxWidth: 260,
        height:300
    }, 
    contentContainer: {
        marginBottom: 10
    }, 
    paginatorText: {
        marginBottom: 8
    }, 
    backButton: {
        flexDirection: "row",
        justifyContent:'space-between'
    }, 
    
})