// screens/LabTechnician/LabTechnicianDashboard.js

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';
import HoverButton from '../../src/styles/HoverButton';

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
            
            <HoverButton
              type="labAction"
              onPress={() => setScreen('log_sample')}
              label="🧪 Log New Mineral Sample"
            />

            <HoverButton
              type="labSecondary"
              onPress={() => fetchMineralSamples(companyName, true)}
              label="📋 View Logged Samples"
            />
          </View>

          <HoverButton
            type="profile"
            onPress={() => setScreen('profile')}
            label="View Profile"
          />

          <HoverButton
            type="logout"
            onPress={handleLogout}
            label="Logout"
          />

        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default LabTechnicianDashboard;