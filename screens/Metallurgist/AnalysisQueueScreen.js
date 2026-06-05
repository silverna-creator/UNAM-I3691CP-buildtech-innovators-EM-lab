import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const AnalysisQueueScreen = ({ selectedSample, setSelectedSample, gradePurity, setGradePurity, rejectionReason, setRejectionReason, submitAssayResults, pendingSamples, onBack }) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>{selectedSample ? "Evaluating Batch" : "Assay Queue"}</Text>
          
          {selectedSample ? (
            <View style={styles.roleBox}>
              <Text style={{ color: '#e67e22', fontWeight: 'bold' }}>Batch: {selectedSample.sampleId}</Text>
              <TextInput style={styles.input} placeholder="Enter Purity Grade" value={gradePurity} onChangeText={setGradePurity} />
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2ecc71' }]} onPress={() => submitAssayResults(selectedSample.id, 'Approved')}>
                <Text style={styles.buttonText}>🔒 Seal & Certify</Text>
              </TouchableOpacity>
              <TextInput style={[styles.input, { borderColor: '#e74c3c' }]} placeholder="Reason to Decline" value={rejectionReason} onChangeText={setRejectionReason} />
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#e74c3c' }]} onPress={() => submitAssayResults(selectedSample.id, 'Declined')}>
                <Text style={styles.buttonText}>❌ Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#7f8c8d', marginTop: 10 }]} onPress={() => setSelectedSample(null)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {pendingSamples.map((sample) => (
                <View key={sample.id} style={styles.roleBox}>
                  <Text style={{ color: '#fff' }}>Sample: {sample.sampleId}</Text>
                  <TouchableOpacity style={styles.roleButton} onPress={() => setSelectedSample(sample)}>
                    <Text style={styles.buttonText}>🔬 Run Chemical Analysis</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.button} onPress={onBack}><Text style={styles.buttonText}>Return to Dashboard</Text></TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default AnalysisQueueScreen;