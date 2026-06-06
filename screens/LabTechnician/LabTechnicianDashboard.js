import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const LabTechnicianDashboard = ({ 
  companyName, 
  setScreen, 
  handleLogout, 
  fetchMineralSamples,
  notifications,
  onOpenNotifications 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications ? notifications.length : 0;

  const handleBellPress = () => {
  const isOpening = !showNotifications;
  setShowNotifications(isOpening);

  // Only mark as read when CLOSING the dropdown, not opening
  if (!isOpening && unreadCount > 0) {
    onOpenNotifications();
  }
};
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
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
          <Text style={styles.title}>EM-Lab</Text>
          <Text style={styles.subtitle}>{companyName} - TECHNICIAN</Text>

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