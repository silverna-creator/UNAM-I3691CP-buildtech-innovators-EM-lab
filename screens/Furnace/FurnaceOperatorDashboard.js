
import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const FurnaceOperatorDashboard = ({ onNavigate, onLogout }) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>EM-Lab</Text>
          <Text style={styles.subtitle}>FURNACE OPERATIONS</Text>

          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Furnace Operations</Text>
            
            {/* Navigates and triggers the fetch */}
            <TouchableOpacity style={styles.roleButton} onPress={() => onNavigate('view_approved_melts')}>
              <Text style={styles.buttonText}>📋 View Certified Batches for Melting</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} 
              onPress={() => onNavigate('furnace_directory')} // Assuming you have a route for this
            >
              <Text style={styles.buttonText}>📊 Monitor Furnace Status</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.roleButton} onPress={() => onNavigate('profile')}>
            <Text style={styles.buttonText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={onLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};