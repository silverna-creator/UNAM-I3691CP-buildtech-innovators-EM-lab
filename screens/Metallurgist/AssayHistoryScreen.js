import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const AssayHistoryScreen = ({ assayHistory, onBack }) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Assay History</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {assayHistory.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.sampleCard,
                  { borderLeftColor: item.status === 'Declined' ? '#e74c3c' : '#2ecc71' }
                ]}
              >
                {/* ── HEADER: Batch ID ── */}
                <Text style={styles.sampleCardHeader}>
                  🧪 {item.sampleId || item.displayId}
                </Text>

                {/* ── STATUS BADGE ── */}
                <View style={[
                  styles.sampleCardBadge,
                  { backgroundColor: item.status === 'Declined' ? '#922b21' : '#1e8449', marginBottom: 10 }
                ]}>
                  <Text style={styles.sampleCardBadgeText}>
                    {item.status === 'Declined' ? '❌ Declined' : '✅ Approved'}
                  </Text>
                </View>

                {/* ── SAMPLE DETAILS ── */}
                <View style={styles.sampleCardRow}>
                  <Text style={styles.sampleCardLabel}>Ore Type</Text>
                  <Text style={styles.sampleCardValue}>{item.oreType || 'N/A'}</Text>
                </View>

                <View style={styles.sampleCardRow}>
                  <Text style={styles.sampleCardLabel}>Initial Weight</Text>
                  <Text style={styles.sampleCardValue}>
                    {item.initialWeight != null ? `${item.initialWeight} kg` : 'N/A'}
                  </Text>
                </View>

                <View style={styles.sampleCardRow}>
                  <Text style={styles.sampleCardLabel}>Moisture Content</Text>
                  <Text style={styles.sampleCardValue}>
                    {item.moistureTestResult != null ? `${item.moistureTestResult}%` : 'Not tested'}
                  </Text>
                </View>

                <View style={styles.sampleCardRow}>
                  <Text style={styles.sampleCardLabel}>Flotation Prep</Text>
                  <Text style={styles.sampleCardValue}>
                    {item.flotationPrepResult != null ? `${item.flotationPrepResult} g/cm³` : 'Not tested'}
                  </Text>
                </View>

                {/* ── ASSAY OUTCOME ── */}
                {item.status === 'Approved' ? (
                  <View style={styles.sampleCardRow}>
                    <Text style={styles.sampleCardLabel}>Purity Grade</Text>
                    <Text style={[styles.sampleCardValue, { color: '#2ecc71', fontWeight: 'bold' }]}>
                      {item.purityGrade || 'N/A'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.sampleCardRow}>
                    <Text style={styles.sampleCardLabel}>Rejection Reason</Text>
                    <Text style={[styles.sampleCardValue, { color: '#e74c3c' }]}>
                      {item.rejectionReason || 'N/A'}
                    </Text>
                  </View>
                )}

                {/* ── CERTIFIED BY ── */}
                <View style={styles.sampleCardRow}>
                  <Text style={styles.sampleCardLabel}>Certified by</Text>
                  <Text style={styles.sampleCardValue}>{item.evaluatedBy || 'Metallurgist'}</Text>
                </View>

                <View style={styles.sampleCardRow}>
                  <Text style={styles.sampleCardLabel}>Evaluated at</Text>
                  <Text style={styles.sampleCardValue}>
                    {item.evaluatedAt ? new Date(item.evaluatedAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default AssayHistoryScreen;