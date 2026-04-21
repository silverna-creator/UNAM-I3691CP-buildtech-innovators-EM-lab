import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EM-Lab</Text>
      <Text style={styles.subtitle}>Metallurgy Lab Management</Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => alert('Register Sample - Coming Soon')}
      >
        <Text style={styles.buttonText}>📋 Register New Sample</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => alert('View Samples - Coming Soon')}
      >
        <Text style={styles.buttonText}>🔬 View All Samples</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => alert('Add Test - Coming Soon')}
      >
        <Text style={styles.buttonText}>🧪 Add Test Result</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => alert('Log Temperature - Coming Soon')}
      >
        <Text style={styles.buttonText}>🌡️ Log Temperature</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a2a4f',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#c8d4e6',
  },
  button: {
    backgroundColor: '#2c5f8a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});