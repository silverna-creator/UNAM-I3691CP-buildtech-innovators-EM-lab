import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../styles/globalStyles';

const StaffDirectoryScreen = ({ staffList, auth, onDeleteStaff, onBack }) => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <Text style={styles.title}>Staff Directory</Text>
          <Text style={styles.subtitle}>Managing Laboratory Personnel</Text>

          <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
            {staffList.length === 0 ? (
              <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No staff members found.</Text>
            ) : (
              staffList.map((member) => (
                <View key={member.id} style={[styles.roleBox, { padding: 15, marginBottom: 10 }]}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{member.fullName}</Text>
                  <Text style={{ color: '#3498db', fontSize: 14, fontWeight: '600' }}>💼 Role: {member.role}</Text>
                  <Text style={{ color: '#c8d4e6', fontSize: 13, marginTop: 4 }}>✉️ Email: {member.email}</Text>
                  
                  {member.id !== auth.currentUser?.uid && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                      <TouchableOpacity 
                        style={{ backgroundColor: '#e74c3c', padding: 8, borderRadius: 5 }} 
                        onPress={() => onDeleteStaff(member.id, member.fullName)}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Revoke Access</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default StaffDirectoryScreen;