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
              <Text style={{ color: '#e67e22', fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>
                Batch: {selectedSample.sampleId || selectedSample.displayId}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 13 }}>
                Ore Type: {selectedSample.oreType || 'N/A'}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 13 }}>
                Initial Weight: {selectedSample.initialWeight != null ? `${selectedSample.initialWeight} kg` : 'N/A'}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 13 }}>
                Moisture Content: {selectedSample.moistureTestResult != null ? `${selectedSample.moistureTestResult}%` : 'Not tested'}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>
                Flotation Prep: {selectedSample.flotationPrepResult != null ? `${selectedSample.flotationPrepResult} g/cm³` : 'Not tested'}
              </Text>
              {sample.sampleSource ? (
                    <View style={styles.sampleCardRow}>
                      <Text style={styles.sampleCardLabel}>Received From</Text>
                      <Text style={styles.sampleCardValue}>{sample.sampleSource}</Text>
                    </View>
                  ) : null}

                  {sample.receivedAt ? (
                    <View style={styles.sampleCardRow}>
                      <Text style={styles.sampleCardLabel}>Date Received</Text>
                      <Text style={styles.sampleCardValue}>{sample.receivedAt}</Text>
                    </View>
                  ) : null}

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
                <View key={sample.id} style={styles.sampleCard}>

                  <Text style={styles.sampleCardHeader}>
                    🧪 {sample.sampleId || sample.displayId}
                  </Text>

                  <View style={styles.sampleCardRow}>
                    <Text style={styles.sampleCardLabel}>Ore Type</Text>
                    <Text style={styles.sampleCardValue}>{sample.oreType || 'N/A'}</Text>
                  </View>

                  <View style={styles.sampleCardRow}>
                    <Text style={styles.sampleCardLabel}>Initial Weight</Text>
                    <Text style={styles.sampleCardValue}>
                      {sample.initialWeight != null ? `${sample.initialWeight} kg` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.sampleCardRow}>
                    <Text style={styles.sampleCardLabel}>Moisture Content</Text>
                    <Text style={styles.sampleCardValue}>
                      {sample.moistureTestResult != null ? `${sample.moistureTestResult}%` : 'Not tested'}
                    </Text>
                  </View>

                  <View style={styles.sampleCardRow}>
                    <Text style={styles.sampleCardLabel}>Flotation Prep</Text>
                    <Text style={styles.sampleCardValue}>
                      {sample.flotationPrepResult != null ? `${sample.flotationPrepResult} g/cm³` : 'Not tested'}
                    </Text>
                  </View>

                  {sample.sampleSource ? (
                    <View style={styles.sampleCardRow}>
                      <Text style={styles.sampleCardLabel}>Received From</Text>
                      <Text style={styles.sampleCardValue}>{sample.sampleSource}</Text>
                    </View>
                  ) : null}

                  {sample.receivedAt ? (
                    <View style={styles.sampleCardRow}>
                      <Text style={styles.sampleCardLabel}>Date Received</Text>
                      <Text style={styles.sampleCardValue}>{sample.receivedAt}</Text>
                    </View>
                  ) : null}

                  <View style={styles.sampleCardBadge}>
                    <Text style={styles.sampleCardBadgeText}>⏳ Pending Analysis</Text>
                  </View>

                  <TouchableOpacity style={[styles.roleButton, { marginTop: 12 }]} onPress={() => setSelectedSample(sample)}>
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