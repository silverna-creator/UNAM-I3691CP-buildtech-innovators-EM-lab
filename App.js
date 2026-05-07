import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView } from 'react-native';

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
    
    // TEMPORARY LOGIC: This "fakes" a database check
    // If you type "admin" in the email box, it sets the role to Admin!
    if (email.toLowerCase().includes('admin')) {
      setRole('Admin');
    } else if (email.toLowerCase().includes('tech')) {
      setRole('Lab Technician');
    } else if (email.toLowerCase().includes('op')) {
      setRole('Furnace Operator');
    } else if (email.toLowerCase().includes('metal')) {
      setRole('Metallurgist');
    }
    
    setScreen('dashboard');
  };

  const handleSignup = async () => {
    // 1. Basic validation
    if (!email || !password || !fullName || !role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // 2. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Save the extra details (Role & Company) to Firestore database
      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        company: companyName,
        role: role,
        email: email,
        createdAt: new Date()
      });

      Alert.alert('Success', 'Account created and role saved!');
      setScreen('login');
    } catch (error) {
      Alert.alert('Signup Error', error.message);
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