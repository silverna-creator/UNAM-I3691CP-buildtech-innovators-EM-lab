// src/components/LaboratoryLockdownScreen.js

import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const LaboratoryLockdownScreen = ({ onCheckStatus, onReturnToLogin }) => (
  <SafeAreaProvider>
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>⚠️ SYSTEM LOCKDOWN</Text>
        <Text style={styles.subtitle}>
          The Laboratory Administrator has temporarily paused operations or triggered an emergency safety override.
        </Text>
        
        <View style={styles.roleBox}>
          <Text style={styles.infoText}>
            All incoming mineral sample logging, assay certifications, and furnace melt cycles are strictly frozen until system clearance is restored.
          </Text>
        </View>

        <TouchableOpacity style={styles.statusButton} onPress={onCheckStatus}>
          <Text style={styles.buttonText}>🔄 Re-check System Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exitButton} onPress={onReturnToLogin}>
          <Text style={styles.buttonText}>🚪 Return to Login Screen</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' },
  safeArea: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#e74c3c', fontSize: 32, fontWeight: 'bold' },
  subtitle: { textAlign: 'center', marginTop: 10, color: '#c8d4e6' },
  roleBox: { borderColor: '#e74c3c', borderWidth: 1, marginTop: 20, padding: 20, alignItems: 'center', borderRadius: 8 },
  infoText: { color: '#fff', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  statusButton: { backgroundColor: '#2ecc71', marginTop: 30, width: '80%', padding: 15, borderRadius: 8, alignItems: 'center' },
  exitButton: { backgroundColor: '#475569', marginTop: 12, width: '80%', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});

export default LaboratoryLockdownScreen;