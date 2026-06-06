import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const ViewSampleScreen = ({ loggedSamples, onBack, onRefresh }) => {

  useEffect(() => {
    if (typeof onRefresh === 'function') onRefresh(); // fetch immediately on mount
    const interval = setInterval(() => {
      if (typeof onRefresh === 'function') onRefresh();
    }, 10000);
    return () => clearInterval(interval); // cleanup on unmount
  }, []);
  
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Sample Registry</Text>
          <Text style={styles.subtitle}>Master Ore Logging & Assay Tracking</Text>

          <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
            {loggedSamples.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16, marginTop: 20 }}>
                  📭 No registered samples found in the laboratory ledger.
                </Text>
              </View>
            ) : (
              loggedSamples.map((sample) => {
                let statusColor = '#e67e22';
                let statusLabel = '⚠️ PENDING ANALYSIS';
                
                if (sample.status === 'Approved') {
                  statusColor = '#2ecc71';
                  statusLabel = '🟢 ASSAY CERTIFIED';
                } else if (sample.status === 'Declined') {
                  statusColor = '#e74c3c';
                  statusLabel = '🔴 BATCH DECLINED';
                }

                return (
                  <View key={sample.id || sample.sampleId} style={[styles.roleBox, { borderColor: statusColor, borderWidth: 1, marginBottom: 10, padding: 15 }]}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                      Batch ID: {sample.sampleId || sample.displayId || "Unknown Lot"}
                    </Text>
                    <Text style={{ color: '#c8d4e6', fontSize: 14, marginTop: 4 }}>
                      Ore Matrix: {sample.oreType} | ⚖️ Initial Mass: {sample.initialWeight} kg
                    </Text>

                    {sample.moistureTestResult != null && (
                      <Text style={{ color: '#fff', fontSize: 13, marginTop: 3 }}>
                        💧 Moisture Content: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{sample.moistureTestResult}%</Text>
                      </Text>
                    )}
                    
                    {sample.flotationPrepResult != null && (
                      <Text style={{ color: '#fff', fontSize: 13, marginTop: 2 }}>
                        🧪 Flotation Target: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{sample.flotationPrepResult} g/cm³</Text>
                      </Text>
                    )}

                    <Text style={{ color: statusColor, fontWeight: 'bold', marginTop: 6, fontSize: 13 }}>{statusLabel}</Text>

                    {sample.status === 'Approved' && (
                      <Text style={{ color: '#fff', fontSize: 13, marginTop: 4, fontWeight: '500' }}>
                        💎 Certified Purity: {sample.purityGrade || sample.purity}
                      </Text>
                    )}
                    
                    {sample.status === 'Declined' && (
                      <Text style={{ color: '#ff8a80', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>
                        ❌ Rejection Reason: {sample.rejectionReason}
                      </Text>
                    )}

                    <Text style={{ color: '#7f8c8d', fontSize: 11, marginTop: 6, borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 6 }}>
                      Logged By: {sample.loggedBy || "Lab Technician"}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default ViewSampleScreen;