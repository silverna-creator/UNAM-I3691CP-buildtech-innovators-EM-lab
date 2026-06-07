// screens/LabTechnician/ViewSamplesScreen.js

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const ViewSampleScreen = ({ loggedSamples, onBack, onRefresh }) => {

  useEffect(() => {
    if (typeof onRefresh === 'function') onRefresh();
    const interval = setInterval(() => {
      if (typeof onRefresh === 'function') onRefresh();
    }, 10000);
    return () => clearInterval(interval);
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
                let borderColor = '#e67e22';
                let badgeColor = '#7d4e00';
                let badgeText = '⚠️ Pending Analysis';

                if (sample.status === 'Approved') {
                  borderColor = '#2ecc71';
                  badgeColor = '#1e8449';
                  badgeText = '✅ Assay Certified';
                } else if (sample.status === 'Declined') {
                  borderColor = '#e74c3c';
                  badgeColor = '#922b21';
                  badgeText = '❌ Batch Declined';
                } else if (sample.status === 'In Melt Cycle') {
                  borderColor = '#e67e22';
                  badgeColor = '#784212';
                  badgeText = '🔥 In Melt Cycle';
                }

                return (
                  <View key={sample.id || sample.sampleId} style={[styles.sampleCard, { borderLeftColor: borderColor }]}>

                    <Text style={styles.sampleCardHeader}>
                      🧪 {sample.sampleId || sample.displayId || 'Unknown Lot'}
                    </Text>

                    <View style={[styles.sampleCardBadge, { backgroundColor: badgeColor, marginBottom: 10 }]}>
                      <Text style={styles.sampleCardBadgeText}>{badgeText}</Text>
                    </View>

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

                    {sample.moistureTestResult != null && (
                      <View style={styles.sampleCardRow}>
                        <Text style={styles.sampleCardLabel}>Moisture Content</Text>
                        <Text style={[styles.sampleCardValue, { color: '#f1c40f' }]}>
                          {sample.moistureTestResult}%
                        </Text>
                      </View>
                    )}

                    {sample.flotationPrepResult != null && (
                      <View style={styles.sampleCardRow}>
                        <Text style={styles.sampleCardLabel}>Flotation Prep</Text>
                        <Text style={[styles.sampleCardValue, { color: '#f1c40f' }]}>
                          {sample.flotationPrepResult} g/cm³
                        </Text>
                      </View>
                    )}

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

                    {sample.status === 'Approved' && (
                      <View style={styles.sampleCardRow}>
                        <Text style={styles.sampleCardLabel}>Purity Grade</Text>
                        <Text style={[styles.sampleCardValue, { color: '#2ecc71', fontWeight: 'bold' }]}>
                          {sample.purityGrade || 'N/A'}
                        </Text>
                      </View>
                    )}

                    {sample.status === 'Declined' && (
                      <View style={styles.sampleCardRow}>
                        <Text style={styles.sampleCardLabel}>Rejection Reason</Text>
                        <Text style={[styles.sampleCardValue, { color: '#e74c3c' }]}>
                          {sample.rejectionReason || 'N/A'}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.sampleCardRow, { marginTop: 8, borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 6 }]}>
                      <Text style={styles.sampleCardLabel}>Logged by</Text>
                      <Text style={styles.sampleCardValue}>{sample.loggedBy || 'Lab Technician'}</Text>
                    </View>

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