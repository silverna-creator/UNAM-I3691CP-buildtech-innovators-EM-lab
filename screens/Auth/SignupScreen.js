import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';

const SignupScreen = ({ 
  isLoggedIn, regName, setRegName, regCompany, setRegCompany, 
  regRole, setRegRole, regEmail, setRegEmail, regPassword, setRegPassword, 
  onRegister, onBack 
}) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>EM-Lab</Text>
              <Text style={styles.subtitle}>{isLoggedIn ? "Staff Registration Portal" : "Company Manager Registration"}</Text>

              <TextInput style={styles.input} placeholder="Full Name" value={regName} onChangeText={setRegName} placeholderTextColor="#888" />
              <TextInput style={styles.input} placeholder="Company Name" value={regCompany} onChangeText={setRegCompany} autoCapitalize="none" placeholderTextColor="#888" />
              
              {isLoggedIn ? (
                <TextInput style={styles.input} placeholder="Staff Role" value={regRole} onChangeText={setRegRole} placeholderTextColor="#888" />
              ) : (
                <View style={[styles.roleBox, { marginBottom: 15, borderColor: '#f1c40f', borderWidth: 1, padding: 15 }]}>
                  <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>🛡️ SECURITY VERIFIED: Admin Role</Text>
                </View>
              )}

              <TextInput style={styles.input} placeholder="Email" value={regEmail} onChangeText={setRegEmail} autoCapitalize="none" placeholderTextColor="#888" />
              <TextInput style={styles.input} placeholder="Password" value={regPassword} onChangeText={setRegPassword} secureTextEntry placeholderTextColor="#888" />

              <TouchableOpacity style={styles.loginButton} onPress={onRegister}>
                <Text style={styles.loginButtonText}>Register</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onBack}>
                <Text style={styles.switchText}>{isLoggedIn ? "Back to Dashboard" : "Back to Login"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default SignupScreen;