import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../styles/globalStyles';

const LabTechnicianDashboard = ({ 
  companyName, 
  setScreen, 
  handleLogout, 
  fetchMineralSamples 
}) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>EM-Lab</Text>
          <Text style={styles.subtitle}>{companyName} - TECHNICIAN</Text>

          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Technician Portal</Text>
            
            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('log_sample')}>
              <Text style={styles.buttonText}>🧪 Log New Mineral Sample</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} 
              onPress={() => fetchMineralSamples(companyName, true)} 
            >
              <Text style={styles.buttonText}>📋 View Logged Samples</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
            <Text style={styles.buttonText}>View Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b', marginTop: 10}]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default LabTechnicianDashboard;