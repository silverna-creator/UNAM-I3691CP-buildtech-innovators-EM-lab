import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';

import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendPasswordResetEmail } from "firebase/auth";

// --- CONFIGURATION ---
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
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

export default function App() {
  const [screen, setScreen] = useState('loading'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');

  // --- PERSISTENCE GUARD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we are currently in the middle of registering a new person, don't interrupt
      if (screen === 'signup' || screen === 'profile') return; 

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName);
            setRole(userData.role);
            setCompanyName(userData.company);
            setScreen('dashboard');
          } else {
            setScreen('login');
          }
        } catch (error) {
          setScreen('login');
        }
      } else {
        setScreen('login');
      }
    });
    return unsubscribe;
  }, [screen]);

  // --- AUTH LOGIC ---
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRole(userData.role);
        setFullName(userData.fullName);
        setCompanyName(userData.company);
        setScreen('dashboard');
      }
    } catch (error) {
      Alert.alert('Login Error', 'Invalid email or password');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setFullName('');
    setRole('');
    setCompanyName('');
    setEmail('');
    setPassword('');
    setScreen('login');
  };

  const handlePasswordReset = () => {
  if (!email) {
    Alert.alert("Error", "No email found for this profile.");
    return;
  }
  sendPasswordResetEmail(auth, email)
    .then(() => {
      Alert.alert("Check your Email", `A password reset link has been sent to ${email}`);
    })
    .catch((error) => {
      Alert.alert("Error", error.message);
    });
};


  const handleSignup = async () => {
    if (!email || !password || !fullName || !role || !companyName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // CHECK FOR DUPLICATE COMPANY (Admins only)
      if (role.toLowerCase() === 'admin') {
        const companyQuery = query(collection(db, "users"), where("company", "==", companyName));
        const querySnapshot = await getDocs(companyQuery);
        if (!querySnapshot.empty) {
          Alert.alert("Name Taken", "This Company Name is already registered. Please use a unique name (e.g., UNAM 2.0).");
          return;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        company: companyName,
        role: role,
        email: email,
        createdAt: new Date()
      });

      Alert.alert('Success', 'Account created successfully!');
      // Return to Dashboard after Admin registers someone
      setScreen('dashboard');
    } catch (error) {
      Alert.alert('Signup Error', error.message);
    }
  };

  // --- VIEWS ---
  if (screen === 'loading') {
    return <View style={styles.container}><Text style={styles.title}>Loading...</Text></View>;
  }

  if (screen === 'dashboard') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EM-Lab</Text>
        <Text style={styles.subtitle}>{companyName} - {role}</Text>

        {role.toLowerCase() === 'admin' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Admin Dashboard</Text>
            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('signup')}>
              <Text style={styles.buttonText}>Register New Staff</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ... Other Role Boxes stay as they were ... */}
        {role.toLowerCase() === 'lab technician' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Technician Portal</Text>
            <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Log Test Results</Text></TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'profile') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.roleBox}>
           <Text style={styles.buttonText}>Name: {fullName}</Text>
           <Text style={styles.buttonText}>Role: {role}</Text>
           <Text style={styles.buttonText}>Company: {companyName}</Text>
        </View>

        {/* New Security Feature: Password Reset */}
        <TouchableOpacity 
          style={[styles.roleButton, {backgroundColor: '#3498db', marginTop: 10}]} 
          onPress={handlePasswordReset}
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => setScreen('dashboard')}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'signup') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>Registration</Text>
            
            <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
            <TextInput style={styles.input} placeholder="Company Name" value={companyName} onChangeText={setCompanyName} />
            <TextInput style={styles.input} placeholder="Role (e.g. Admin/Staff)" value={role} onChangeText={setRole} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            
            <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
              <Text style={styles.loginButtonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setScreen('dashboard')}>
              <Text style={styles.switchText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- LOGIN VIEW (Default) ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EM-Lab</Text>
      <Text style={styles.subtitle}>Electronics & Metallurgy Lab</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.switchText}>Staff: Contact your Manager for access.</Text>
        <TouchableOpacity onPress={() => setScreen('signup')}>
          <Text style={[styles.switchText, { marginTop: 10, textDecorationLine: 'none' }]}>
            Are you a Lab Manager? <Text style={styles.signUpText}>Register your Company</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', padding: 20 },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 42, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#c8d4e6', marginBottom: 40 },
  input: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16 },
  loginButton: { backgroundColor: '#0047AB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  button: { backgroundColor: '#2c5f8a', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  switchText: { color: '#c8d4e6', textAlign: 'center', marginTop: 20, textDecorationLine: 'underline' },
  signUpText: { color: '#3498db', fontWeight: 'bold' },
  roleBox: { backgroundColor: '#2c3e50', padding: 20, borderRadius: 15, marginVertical: 20, borderWidth: 1, borderColor: '#3498db' },
  roleTitle: { color: '#3498db', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  roleButton: { backgroundColor: '#34495e', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
});