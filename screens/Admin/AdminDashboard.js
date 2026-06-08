// screens/Admin/AdminDashboard.js

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';
import HoverButton from '../../src/styles/HoverButton';

const AdminDashboard = ({ 
  companyName, 
  furnaceLogs, 
  maxFurnaceTemp, 
  setScreen, 
  handleLogout, 
  fetchStaffDirectory 
}) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - ADMIN PANEL</Text>
            
            {/* 🌡️ Live Furnace Telemetry Section */}
            <View style={[styles.roleBox, { borderColor: '#f1c40f', borderWidth: 1, marginBottom: 15 }]}>
              <Text style={{ color: '#f1c40f', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                📡 Live Furnace Telemetry Feed
              </Text>
              
              {furnaceLogs.length === 0 ? (
                <Text style={{ color: '#aaa', fontSize: 13, fontStyle: 'italic' }}>
                  🟢 All smelting systems clear. No active melt cycles currently running.
                </Text>
              ) : (
                furnaceLogs.map((melt) => {
                  const currentTemp = parseFloat(melt.temperature) || 0;
                  const maxAllowed = parseFloat(maxFurnaceTemp);
                  const isOverheated = !isNaN(maxAllowed) ? currentTemp > maxAllowed : false;

                  return (
                    <View key={melt.id} style={{ 
                      backgroundColor: isOverheated ? '#7b1113' : '#232931', 
                      padding: 10, borderRadius: 6, marginTop: 5, 
                      borderColor: isOverheated ? '#e74c3c' : 'transparent', 
                      borderWidth: 1 
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                          ID: {melt.sampleId || "Active Melt"}
                        </Text>
                        <Text style={{ color: isOverheated ? '#ff8d8f' : '#2ecc71', fontWeight: 'bold', fontSize: 13 }}>
                          {currentTemp}°C / {maxAllowed}°C Limit
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Admin Control Buttons */}
            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>Admin Controls</Text>
              
              <HoverButton
                type="role"
                onPress={() => setScreen('signup')}
                label="Register New Staff"
              />

              <HoverButton
                type="labSecondary"
                onPress={fetchStaffDirectory}
                label="📋 View Active Staff Directory"
              />

              <HoverButton
                type="settings"
                onPress={() => setScreen('system_settings')}
                label="⚙️ Manage System Settings"
              />

              <HoverButton
                type="role"
                onPress={() => setScreen('support_center')}
                label="🎫 Contact Platform Support"
                customStyle={{ backgroundColor: '#2E2E4A', marginTop: 10 }}
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

          </ScrollView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default AdminDashboard;