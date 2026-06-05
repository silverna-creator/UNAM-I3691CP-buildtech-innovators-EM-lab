import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const FurnaceQueueScreen = ({ furnaceLogs, onSelectSample, onBack }) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Certified Melt Queue</Text>
          <Text style={styles.subtitle}>Select an Approved Ore Batch to Smelt</Text>

          <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
            {furnaceLogs.length === 0 ? (
              <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
                📭 No certified assay batches are currently waiting.
              </Text>
            ) : (
              furnaceLogs.map((sample) => (
                <View key={sample.id} style={[styles.sampleCard, { borderLeftColor: '#2ecc71' }]}>

                  <Text style={styles.sampleCardHeader}>
                    🧪 {sample.displayId || sample.sampleId}
                  </Text>

                  <View style={styles.sampleCardRow}>
                    <Text style={styles.sampleCardLabel}>Ore Type</Text>
                    <Text style={styles.sampleCardValue}>{sample.oreType || 'N/A'}</Text>
                  </View>

                  <View style={styles.sampleCardRow}>
                    <Text style={styles.sampleCardLabel}>Purity Grade</Text>
                    <Text style={[styles.sampleCardValue, { color: '#2ecc71' }]}>{sample.purityGrade || 'N/A'}</Text>
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

                  <TouchableOpacity
                    style={[styles.roleButton, { backgroundColor: '#e67e22', marginTop: 12 }]}
                    onPress={() => onSelectSample(sample)}
                  >
                    <Text style={styles.buttonText}>🔥 Initialize Melt Cycle</Text>
                  </TouchableOpacity>

                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default FurnaceQueueScreen;