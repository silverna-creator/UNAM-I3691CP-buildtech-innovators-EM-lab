import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const MetallurgistDashboard = ({ companyName, setScreen, handleLogout, fetchSamplesForAnalysis, fetchAssayHistory }) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>EM-Lab</Text>
          <Text style={styles.subtitle}>{companyName} - METALLURGIST</Text>

          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Quality Assurance & Analysis</Text>
            <TouchableOpacity style={styles.roleButton} onPress={fetchSamplesForAnalysis}>
              <Text style={styles.buttonText}>🧪 Analyze Pending Samples</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} 
              onPress={fetchAssayHistory}
            >
              <Text style={styles.buttonText}>📜 View Assay History</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
            <Text style={styles.buttonText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#c0392b' }]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default MetallurgistDashboard;