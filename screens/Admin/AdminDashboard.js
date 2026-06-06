import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const AdminDashboard = ({ 
  companyName, 
  furnaceLogs, 
  maxFurnaceTemp, 
  setScreen, 
  handleLogout, 
  fetchStaffDirectory,
  notifications,
  onOpenNotifications
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications ? notifications.length : 0;

  const handleBellPress = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      onOpenNotifications();
    }
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ── HEADER ROW WITH BELL ── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <Text style={[styles.title, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>EM-Lab</Text>
              <TouchableOpacity onPress={handleBellPress} style={{ position: 'relative', padding: 8 }}>
                <Text style={{ fontSize: 24 }}>🔔</Text>
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute', top: 2, right: 2,
                    backgroundColor: '#e74c3c', borderRadius: 10,
                    minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center'
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>{companyName} - ADMIN PANEL</Text>

            {/* ── NOTIFICATION DROPDOWN ── */}
            {showNotifications && (
              <View style={{
                backgroundColor: '#1e2d3d', borderRadius: 10, padding: 12,
                marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#3498db'
              }}>
                <Text style={{ color: '#3498db', fontWeight: 'bold', marginBottom: 8 }}>
                  🔔 Notifications
                </Text>
                {unreadCount === 0 ? (
                  <Text style={{ color: '#aaa', fontSize: 13 }}>No new notifications.</Text>
                ) : (
                  notifications.map((notif) => (
                    <View key={notif.id} style={{ marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#333', paddingBottom: 6 }}>
                      <Text style={{ color: '#ecf0f1', fontSize: 13 }}>{notif.message}</Text>
                      <Text style={{ color: '#7f8c8d', fontSize: 11, marginTop: 2 }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

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
                      borderColor: isOverheated ? '#e74c3c' : 'transparent', borderWidth: 1 
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                          ID: {melt.meltId || melt.sampleId || "Active Melt"}
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
            <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#c0392b', marginTop: 10 }]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default AdminDashboard;