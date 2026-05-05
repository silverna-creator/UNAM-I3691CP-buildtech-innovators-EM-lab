import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView } from 'react-native';

export default function App() {
  const [screen, setScreen] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setScreen('dashboard');
  };

  const handleSignup = () => {
    if (!email || !password || !fullName || !companyName || !role) {
      Alert.alert('Error', 'Please fill in all fields including Company and Role');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    Alert.alert('Success', `Account created for ${fullName} at ${companyName}!`);
    setScreen('login'); 
  };

  // --- VIEW 1: DYNAMIC DASHBOARD ---
  if (screen === 'dashboard') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EM-Lab</Text>
        <Text style={styles.subtitle}>Logged in as: {role}</Text>

        {/* 1. ADMIN DASHBOARD */}
        {role.toLowerCase() === 'admin' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Admin Dashboard</Text>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Manage Users</Text></TouchableOpacity>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>View Lab Reports</Text></TouchableOpacity>
          </View>
        )}

        {/* 2. FURNACE OPERATOR DASHBOARD */}
        {role.toLowerCase() === 'furnace operator' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Furnace Controls</Text>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Monitor Temperature</Text></TouchableOpacity>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Set Timer</Text></TouchableOpacity>
          </View>
        )}

        {/* 3. METALLURGIST DASHBOARD */}
        {role.toLowerCase() === 'metallurgist' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Metallurgy Lab</Text>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Material Analysis</Text></TouchableOpacity>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Sample Logs</Text></TouchableOpacity>
          </View>
        )}

        {/* 4. LAB TECHNICIAN DASHBOARD (The one I missed!) */}
        {role.toLowerCase() === 'lab technician' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Technician Portal</Text>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Log Test Results</Text></TouchableOpacity>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Equipment Status</Text></TouchableOpacity>
          </View>
        )}

        {/* 5. GENERIC VIEW (If the role doesn't match the above) */}
        {!['admin', 'furnace operator', 'metallurgist', 'lab technician'].includes(role.toLowerCase()) && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>General Access</Text>
            <Text style={{color: '#fff', textAlign: 'center', marginBottom: 10}}>Welcome to the lab system.</Text>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>View Profile</Text></TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={() => setScreen('login')}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'signup') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>EM-Lab</Text>
          <Text style={styles.subtitle}>Create an Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#8e9eae"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Company Name"
            placeholderTextColor="#8e9eae"
            value={companyName}
            onChangeText={setCompanyName}
          />

          <TextInput
            style={styles.input}
            placeholder="Role (e.g. Admin/Staff)"
            placeholderTextColor="#8e9eae"
            value={role}
            onChangeText={setRole}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8e9eae"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8e9eae"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#8e9eae"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
            <Text style={styles.loginButtonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setScreen('login')}>
            <Text style={styles.switchText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EM-Lab</Text>
      <Text style={styles.subtitle}>Electronics & Metallurgy Lab</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8e9eae"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8e9eae"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setScreen('signup')}>
        <Text style={styles.switchText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2a4f',
    justifyContent: 'center', // This centers the Login and Dashboard
  },
  scrollContainer: {
    flexGrow: 1, // This tells the scroll view to fill the space
    padding: 20,
    justifyContent: 'center', // This centers the items INSIDE the scroll view[cite: 2]
    paddingVertical: 50,
  },
  // ... leave the rest of your styles (title, input, etc.) exactly as they are
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#c8d4e6',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#2c5f8a',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2c5f8a',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    color: '#c8d4e6',
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});