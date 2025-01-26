import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

const WorkoutForm = () => {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Upload Workout</Text>

      <Text style={styles.label}>Workout Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter workout name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter duration"
        keyboardType="numeric"
        value={duration}
        onChangeText={setDuration}
      />

      <Text style={styles.label}>Intensity</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter intensity (e.g. low, medium, high)"
        value={intensity}
        onChangeText={setIntensity}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Submit Workout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
    justifyContent: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default WorkoutForm;