import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../styles/globalStyles';

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
                <View key={sample.id} style={[styles.roleBox, { borderColor: '#2ecc71', borderWidth: 1, marginBottom: 10, padding: 15 }]}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                    Sample ID: {sample.displayId || sample.sampleId}
                  </Text>
                  <Text style={{ color: '#c8d4e6', fontSize: 14 }}>
                    Ore Type: {sample.oreType} | Purity: {sample.purityGrade || sample.purity}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.button, { backgroundColor: '#e67e22', marginTop: 10 }]} 
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