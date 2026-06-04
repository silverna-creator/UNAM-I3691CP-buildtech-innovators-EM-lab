import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../styles/globalStyles';

const AssayHistoryScreen = ({ assayHistory, onBack }) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Assay History</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {assayHistory.map((item) => (
              <View key={item.id} style={[styles.roleBox, { borderLeftWidth: 4, borderLeftColor: item.status === 'Declined' ? '#e74c3c' : '#2ecc71' }]}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Batch: {item.sampleId}</Text>
                <Text style={{ color: item.status === 'Declined' ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>
                  {item.status === 'Declined' ? `❌ Declined: ${item.rejectionReason}` : `💎 Certified: ${item.purityGrade || item.purity}`}
                </Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={onBack}><Text style={styles.buttonText}>Return to Dashboard</Text></TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default AssayHistoryScreen;