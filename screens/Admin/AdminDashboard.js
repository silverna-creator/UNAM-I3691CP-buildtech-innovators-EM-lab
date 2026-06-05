//AdminDashboard.js

import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Assuming styles are in src/styles/globalStyles.js
import { styles } from '../../src/styles/globalStyles'; 

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
                      padding: 10, borderRadius: 6, marginTop: 5, borderColor: isOverheated ? '#e74c3c' : 'transparent', borderWidth: 1 
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>ID: {melt.sampleId || "Active Melt"}</Text>
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
              
              <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('signup')}>
                <Text style={styles.buttonText}>Register New Staff</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} onPress={fetchStaffDirectory}>
                <Text style={styles.buttonText}>📋 View Active Staff Directory</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#e67e22', marginTop: 10 }]} onPress={() => setScreen('system_settings')}>
                <Text style={styles.buttonText}>⚙️ Manage System Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2E2E4A', marginTop: 10 }]} onPress={() => setScreen('support_center')}>
                <Text style={styles.buttonText}>🎫 Contact Platform Support</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b', marginTop: 10}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default AdminDashboard;