import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { styles } from '../../src/styles/globalStyles';

const MeltControlScreen = ({ selectedSample, temp, setTemp, duration, setDuration, onSubmit, onReturn }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Furnace Control Room</Text>
      <Text style={styles.subtitle}>Batch: {selectedSample.displayId || selectedSample.sampleId}</Text>
      
      <View style={styles.roleBox}>
        <Text style={styles.roleTitle}>Update Telemetry Log</Text>
        <TextInput style={styles.input} placeholder="Current Temp (°C)" keyboardType="numeric" value={temp} onChangeText={setTemp} />
        <TextInput style={styles.input} placeholder="Duration (mins)" keyboardType="numeric" value={duration} onChangeText={setDuration} />
        <TouchableOpacity style={[styles.button, { backgroundColor: '#e67e22' }]} onPress={onSubmit}>
          <Text style={styles.buttonText}>📈 Submit Telemetry</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.button} onPress={onReturn}>
        <Text style={styles.buttonText}>Return to Queue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default MeltControlScreen;