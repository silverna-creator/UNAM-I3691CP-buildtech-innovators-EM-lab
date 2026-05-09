import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmjvhlExpJwEfkd1Dx0dnJm5cpkwfnOc8",
  authDomain: "em-lab-app.firebaseapp.com",
  databaseURL: "https://em-lab-app-default-rtdb.firebaseio.com",
  projectId: "em-lab-app",
  storageBucket: "em-lab-app.firebasestorage.app",
  messagingSenderId: "388695420434",
  appId: "1:388695420434:web:e0111e1b03221bc353b2cb",
  measurementId: "G-D0YZ74XX6G"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [screen, setScreen] = useState('signup'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      // Log the user in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch their Role from the database
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRole(userData.role); // This sets the role (Metallurgist, Admin, etc.)
        setFullName(userData.fullName);
        setCompanyName(userData.company);
        setScreen('dashboard');
      }
    } catch (error) {
      Alert.alert('Login Error', 'Invalid email or password');
    }
  };

  const handleSignup = async () => {
    // 1. Validation
    if (!email || !password || !fullName || !role) {
      Alert.alert('Error', 'Please fill in all fields for the new staff member.');
      return;
    }

    try {
      // 2. Create the account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Save to Database
      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        company: companyName, 
        role: role,
        email: email,
      });

      // 4. SUCCESS: Reset fields and STAY on this screen
      Alert.alert('Success', `${fullName} added to ${companyName}. You can now register another person.`);
      
      // Clear the inputs for the next entry
      setFullName('');
      setEmail('');
      setPassword('');
      setRole(''); 
      // NOTE: We do NOT call setScreen here, so the Admin stays on the Signup page.

    } catch (error) {
      Alert.alert('Registration Error', error.message);
    }
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
            <TouchableOpacity 
      style={styles.roleButton} 
      onPress={() => setScreen('signup')}
    >
      <Text style={styles.buttonText}>Register New Staff</Text>
    </TouchableOpacity>
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

        <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'profile') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>User Profile</Text>
        <View style={styles.roleBox}>
           <Text style={styles.buttonText}>Name: {fullName || 'Demo User'}</Text>
           <Text style={styles.buttonText}>Role: {role}</Text>
           <Text style={styles.buttonText}>Company: {companyName || 'EM-Lab'}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => setScreen('dashboard')}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'signup') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>Register New Staff</Text>
            <Text style={{color: '#8e9eae', textAlign: 'center', marginBottom: 20}}>
              Domain: {companyName || 'EM-Lab'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Staff Full Name"
              placeholderTextColor="#8e9eae"
              value={fullName}
              onChangeText={setFullName}
            />

            {/* ROLE SELECTION */}
            <Text style={{color: '#fff', marginBottom: 10, textAlign: 'center'}}>Assign Role:</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
              {['Technician', 'Metallurgist', 'Operator'].map((r) => (
                <TouchableOpacity 
                  key={r}
                  style={[styles.roleButton, role === r && { backgroundColor: '#3498db' }]} 
                  onPress={() => setRole(r)}
                >
                  <Text style={styles.buttonText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Staff Email"
              placeholderTextColor="#8e9eae"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Assign Temporary Password"
              placeholderTextColor="#8e9eae"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
              <Text style={styles.loginButtonText}>Confirm & Save Staff</Text>
            </TouchableOpacity>

            {/* THE FIX: This now points exactly to your Dashboard state */}
            <TouchableOpacity 
              style={[styles.button, {marginTop: 10, backgroundColor: '#4a5568'}]} 
              onPress={() => setScreen('dashboard')}
            >
              <Text style={styles.buttonText}>Cancel / Back to Dashboard</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
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
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2a4f',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    paddingVertical: 50,
  },
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
  // --- NEW ROLE STYLES ---
  roleBox: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  roleTitle: {
    color: '#3498db',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  roleButton: {
    backgroundColor: '#34495e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
});