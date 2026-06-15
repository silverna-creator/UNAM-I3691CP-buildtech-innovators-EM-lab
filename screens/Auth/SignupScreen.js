// screens/Auth/SignupScreen.js

import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../src/styles/globalStyles';
import HoverButton, { HoverInput } from '../../src/styles/HoverButton';

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
              <Text style={styles.subtitle}>
                {isLoggedIn ? "Staff Registration Portal" : "Company Manager Registration"}
              </Text>

              <HoverInput
                placeholder="Full Name"
                value={regName}
                onChangeText={setRegName}
                placeholderTextColor="#888"
              />

              <HoverInput
                placeholder="Company Name"
                value={regCompany}
                onChangeText={setRegCompany}
                autoCapitalize="none"
                placeholderTextColor="#888"
              />

              {isLoggedIn ? (
                <HoverInput
                  placeholder="Staff Role"
                  value={regRole}
                  onChangeText={setRegRole}
                  placeholderTextColor="#888"
                />
              ) : (
                <View style={[styles.roleBox, { marginBottom: 15, borderColor: '#f1c40f', borderWidth: 1, padding: 15 }]}>
                  <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>🛡️ SECURITY VERIFIED: Admin Role</Text>
                </View>
              )}

              <HoverInput
                placeholder="Email"
                value={regEmail}
                onChangeText={setRegEmail}
                autoCapitalize="none"
                placeholderTextColor="#888"
              />

              <HoverInput
                placeholder="Password"
                value={regPassword}
                onChangeText={setRegPassword}
                secureTextEntry={true}
                placeholderTextColor="#888"
              />

              <HoverButton
                type="login"
                onPress={onRegister}
                label="Register"
              />

              <HoverButton
                type="role"
                onPress={onBack}
                label={isLoggedIn ? "Back to Dashboard" : "Back to Login"}
                customStyle={{ backgroundColor: 'transparent', borderWidth: 0, marginTop: 5 }}
                customTextStyle={{ color: '#c8d4e6', textAlign: 'center' }}
              />

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

export default SignupScreen;