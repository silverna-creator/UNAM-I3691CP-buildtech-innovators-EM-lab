import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../styles/globalStyles';

const SystemSettingsScreen = ({ maxFurnaceTemp, setMaxFurnaceTemp, isLabActive, setIsLabActive, onSave, onCancel }) => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <Text style={styles.title}>System Settings</Text>
          <Text style={styles.subtitle}>Configure Laboratory Parameters</Text>

          <View style={[styles.roleBox, { width: '100%', padding: 20 }]}>
            <Text style={{ color: '#f1c40f', fontWeight: 'bold', marginBottom: 15 }}>🔥 FURNACE THRESHOLDS</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#232931', color: '#fff' }]}
              keyboardType="numeric"
              value={maxFurnaceTemp}
              onChangeText={setMaxFurnaceTemp}
              placeholder="e.g., 1200"
            />

            <Text style={{ color: '#f1c40f', fontWeight: 'bold', marginVertical: 15 }}>🏢 LAB STATUS</Text>
            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: isLabActive ? '#27ae60' : '#c0392b' }]}
              onPress={() => setIsLabActive(!isLabActive)}
            >
              <Text style={styles.buttonText}>
                System Status: {isLabActive ? "ACTIVE" : "INACTIVE (PAUSED)"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.roleButton, { marginTop: 20, backgroundColor: '#2980b9' }]} onPress={onSave}>
            <Text style={styles.buttonText}>💾 Save Configurations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#7f8c8d', marginTop: 10 }]} onPress={onCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default SystemSettingsScreen;