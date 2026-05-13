import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';


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

// --- SAFE INITIALIZATION ---
// Check if an app instance already exists
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Check if Auth is already initialized to avoid the [auth/already-initialized] error
let auth;
if (getApps().length > 0) {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

const db = getFirestore(app);

export default function App() {
  const [screen, setScreen] = useState('loading'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- PERSISTENCE GUARD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we are currently in the middle of registering a new person, don't interrupt
      if (screen === 'dashboard' || screen === 'signup' || screen === 'profile') return; 

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName);
            setRole(userData.role);
            setCompanyName(userData.company);
            setEmail(userData.email);
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
  }, []);

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

  const handleInternalPasswordChange = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully!");
      // Reset the local password states so they don't stay in memory
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error) {
      Alert.alert("Security Error", "Current password incorrect or session expired.");
    }
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

const handleForgotPassword = () => {
    if (!email) {
      Alert.alert("Input Required", "Please enter your email address in the input field above first.");
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert("Success", "A password reset link has been sent to your email.");
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

  return (
    <SafeAreaProvider>
      {/* We use this helper function to decide which "room" to show inside our building envelope */}
      {(() => {

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
        
        {/* User Info Section */}
        <View style={styles.roleBox}>
           <Text style={styles.buttonText}>Name: {fullName}</Text>
           <Text style={styles.buttonText}>Role: {role}</Text>
           <Text style={styles.buttonText}>Company: {companyName}</Text>
        </View>

        {/* Password Management Logic */}
        {isChangingPassword ? (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Update Security</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Current Password" 
              secureTextEntry 
              value={currentPassword}
              onChangeText={setCurrentPassword} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="New Password" 
              secureTextEntry 
              value={newPassword}
              onChangeText={setNewPassword} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Confirm New Password" 
              secureTextEntry 
              value={confirmPassword}
              onChangeText={setConfirmPassword} 
            />
            
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={() => {
                if (newPassword === confirmPassword && newPassword.length >= 6) {
                  handleInternalPasswordChange(currentPassword, newPassword);
                } else if (newPassword.length < 6) {
                  Alert.alert("Error", "New password must be at least 6 characters");
                } else {
                  Alert.alert("Error", "Passwords do not match");
                }
              }}
            >
              <Text style={styles.loginButtonText}>Save New Password</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsChangingPassword(false)}>
              <Text style={[styles.switchText, { textDecorationLine: 'none', color: '#e74c3c' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.roleButton, {backgroundColor: '#3498db', marginTop: 10}]} 
            onPress={() => setIsChangingPassword(true)}
          >
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
        )}

        {/* Navigation Back */}
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
      <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 15 }}>
  <Text style={[styles.switchText, { textDecorationLine: 'underline' }]}>Forgot Password?</Text>
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
})()}
    </SafeAreaProvider>
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