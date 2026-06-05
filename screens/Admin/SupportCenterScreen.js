// SupportCentreScreen.js

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const SupportCenterScreen = ({ ticketText, setTicketText, onSubmit, onCancel }) => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <Text style={styles.title}>SaaS Support Center</Text>
          <Text style={styles.subtitle}>Open a ticket with Platform Super-Admins</Text>

          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: 'top', backgroundColor: '#161624' }]}
            placeholder="Describe your issue..."
            multiline
            value={ticketText}
            onChangeText={setTicketText}
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: '#3498db' }]} onPress={onSubmit}>
            <Text style={styles.buttonText}>Submit Support Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 20 }} onPress={onCancel}>
            <Text style={{ color: '#3498db', textAlign: 'center' }}>Cancel & Return</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default SupportCenterScreen;