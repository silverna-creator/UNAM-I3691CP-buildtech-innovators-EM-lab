import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../styles/globalStyles'; // Use your centralized styles

const SampleDirectoryScreen = ({ loggedSamples, onBack }) => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <Text style={styles.title}>Sample Batches</Text>
          <Text style={styles.subtitle}>Active Laboratory Inventory</Text>

          <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
            {!loggedSamples || loggedSamples.length === 0 ? (
              <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
                No samples found in local memory pool yet.
              </Text>
            ) : (
              loggedSamples.map((item) => (
                <View key={item.id || item.sampleId} style={[styles.roleBox, { padding: 15, marginBottom: 10 }]}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                    Batch ID: {item.displayId || item.sampleId || "UNKNOWN_ID"}
                  </Text>
                  <Text style={{ color: '#3498db', fontSize: 14, marginTop: 4 }}>
                    Ore Matrix: {item.oreType || "Not Specified"}
                  </Text>
                  <Text style={{ color: '#c8d4e6', fontSize: 13, marginBottom: 4 }}>
                    Mass: {item.initialWeight || 0} kg
                  </Text>

                  {item.moistureTestResult != null && (
                    <Text style={{ color: '#fff', fontSize: 13 }}>
                      <Text style={{ fontWeight: 'bold', color: '#f1c40f' }}>💧 Moisture:</Text> {item.moistureTestResult}%
                    </Text>
                  )}

                  <Text style={{ 
                    color: item.status === 'Completed' ? '#2ecc71' : '#e67e22', 
                    fontSize: 12, fontWeight: 'bold', marginTop: 8 
                  }}>
                    Status: {item.status || "Pending Analysis"}
                  </Text>
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

export default SampleDirectoryScreen;