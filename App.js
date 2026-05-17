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
import { 
  getAuth, 
  initializeAuth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  sendPasswordResetEmail, 
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from "firebase/auth";

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// --- AUTH INITIALIZATION ---
let auth;

if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    const { getReactNativePersistence } = require('firebase/auth/react-native');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export default function App() {
  const [staffList, setStaffList] = useState([]);
  const [screen, setScreen] = useState('loading'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [user, setUser] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false); 

  // Dedicated registration variables to keep the active Admin session safe
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [maxFurnaceTemp, setMaxFurnaceTemp] = useState('1200'); 
  const [isLabActive, setIsLabActive] = useState(true);

  // --- SINGLE AUTH EFFECT ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setIsReady(true); 

        try {
          const userDoc = await getDoc(doc(db, "users", authenticatedUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName || "");
            setRole(userData.role || "");
            setCompanyName(userData.company || "UNAM");
            setEmail(userData.email || authenticatedUser.email);
            setScreen('dashboard');
          } else {
            setScreen('login');
          }
        } catch (error) {
          console.error("Database fetch error:", error);
          setScreen('login');
        }
      } else {
        setUser(null);
        setIsReady(true); 
        setScreen('login');
      }
    });
    return unsubscribe;
  }, []); 

  // --- AUTH LOGIC ---
  const handleLogin = async () => {
    const normalizedCompany = companyName ? companyName.toUpperCase().trim() : '';
    if (!email || !password) {
      const msg = 'Please enter email and password';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const msg = 'Login Error: Invalid email or password';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
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

  const handleSignup = async () => {
    const normalizedCompany = companyName ? companyName.toUpperCase().trim() : '';
    const adminUser = auth.currentUser; 
    const assignedRole = adminUser ? regRole : 'Admin'; 

    if (!regEmail || !regPassword || !regName || !assignedRole || !normalizedCompany) {
      const msg = 'Please fill in all fields';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return;
    }

    try {
      let newUserUid;

      if (adminUser) {
        const secondaryAppName = `SilentApp_${Math.random().toString(36).substring(7)}`;
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, regEmail, regPassword);
        newUserUid = userCredential.user.uid;

        await secondaryAuth.signOut();
      } else {
        const companyQuery = query(collection(db, "users"), where("company", "==", normalizedCompany));
        const querySnapshot = await getDocs(companyQuery);
        if (!querySnapshot.empty) {
          const msg = "This Company Name is already registered.";
          Platform.OS === 'web' ? alert(msg) : Alert.alert("Name Taken", msg);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
        newUserUid = userCredential.user.uid;
      }

      await setDoc(doc(db, "users", newUserUid), {
        fullName: regName,
        company: normalizedCompany,
        role: assignedRole,
        email: regEmail,
        createdAt: new Date()
      });

      if (adminUser) {
        setUser(adminUser); 
        setScreen('dashboard'); 
        
        const msg = `Staff member ${regName} successfully registered!`;
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Success', msg);

        // Clear out the boxes safely
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegRole('');
      } else {
        const msg = 'Company account created successfully! Please log in.';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Success', msg);
        setScreen('login');
      }

    } catch (error) {
      console.error("Signup Error:", error.message);
      const errorMsg = `Signup Error: ${error.message}`;
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('Signup Error', errorMsg);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      const msg = "Please enter your email address first.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Input Required", msg);
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        const msg = "A password reset link has been sent to your email.";
        Platform.OS === 'web' ? alert(msg) : Alert.alert("Success", msg);
      })
      .catch((error) => {
        Platform.OS === 'web' ? alert(error.message) : Alert.alert("Error", error.message);
      });
  };

  const handleInternalPasswordChange = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user) return;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully!");
      setIsChangingPassword(false);
    } catch (error) {
      Alert.alert("Error", "Authentication failed.");
    }
  };

 const fetchStaffDirectory = async () => {
    // If the logged-in Admin's company state is missing or empty, do not run the query
    if (!companyName) {
      const msg = "Error: Admin company profile not fully loaded yet. Please try again in a moment.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    try {
      console.log("Dynamically fetching staff strictly for company:", companyName);

      // Query the users collection filtering exclusively by the logged-in Admin's company
      const staffQuery = query(
        collection(db, "users"), 
        where("company", "==", companyName) 
      );
      
      const querySnapshot = await getDocs(staffQuery);
      const members = [];
      
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Successfully fetched ${members.length} staff members for ${companyName}:`, members);
      setStaffList(members);
      setScreen('staff_directory');
    } catch (error) {
      console.error("Detailed Firestore Directory Error:", error.code, error.message);
      const msg = `Failed to load staff directory: ${error.message}`;
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
    }
  };
  
  // --- NAVIGATION SCREEN ROUTING TERMINALS ---
  if (!isReady || screen === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EM-Lab</Text>
        <Text style={styles.subtitle}>Securing Session...</Text>
      </View>
    );
  }

  if (screen === 'signup') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>EM-Lab</Text>
                <Text style={styles.subtitle}>{auth.currentUser ? "Staff Registration Portal" : "Company Manager Registration"}</Text>
                 
                <TextInput style={styles.input} placeholder="Full Name" value={regName} onChangeText={setRegName} placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Company Name" value={companyName} onChangeText={setCompanyName} placeholderTextColor="#888" />
                
                {auth.currentUser ? (
                  <TextInput 
                    style={styles.input} 
                    placeholder="Staff Role (e.g. Lab Technician)" 
                    value={regRole} 
                    onChangeText={setRegRole} 
                    placeholderTextColor="#888" 
                  />
                ) : (
                  <View style={[styles.roleBox, { marginTop: 0, marginBottom: 15, borderColor: '#f1c40f', backgroundColor: 'rgba(241, 196, 15, 0.1)', borderWidth: 1, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>🛡️</Text>
                    <View>
                      <Text style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: 14 }}>SECURITY VERIFIED</Text>
                      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500' }}>Role: Company Administrator</Text>
                    </View>
                  </View>
                )}

                <TextInput style={styles.input} placeholder="Email" value={regEmail} onChangeText={setRegEmail} autoCapitalize="none" placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Password" value={regPassword} onChangeText={setRegPassword} secureTextEntry placeholderTextColor="#888" />

                <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
                  <Text style={styles.loginButtonText}>Register</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => auth.currentUser ? setScreen('dashboard') : setScreen('login')}>
                  <Text style={styles.switchText}>{auth.currentUser ? "Back to Dashboard" : "Back to Login"}</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  if (screen === 'staff_directory') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Staff Directory</Text>
            <Text style={styles.subtitle}>Managing Laboratory Personnel</Text>

            <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
              {staffList.length === 0 ? (
                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No staff members found.</Text>
              ) : (
                staffList.map((member) => (
                  <View key={member.id} style={[styles.roleBox, { marginTop: 0, marginBottom: 10, padding: 15 }]}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{member.fullName}</Text>
                    <Text style={{ color: '#3498db', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                      💼 Role: {member.role}
                    </Text>
                    <Text style={{ color: '#c8d4e6', fontSize: 13, marginTop: 4 }}>✉️ Email: {member.email}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={() => setScreen('dashboard')}>
              <Text style={styles.buttonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  if (screen === 'system_settings') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>System Settings</Text>
            <Text style={styles.subtitle}>Configure Laboratory Parameters</Text>

            <View style={[styles.roleBox, { width: '100%', padding: 20 }]}>
              <Text style={{ color: '#f1c40f', fontWeight: 'bold', marginBottom: 15 }}>🔥 FURNACE THRESHOLDS</Text>
              <Text style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}>Max Temperature Limit (°C):</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#232931', color: '#fff', marginBottom: 20 }]}
                keyboardType="numeric"
                value={maxFurnaceTemp}
                onChangeText={setMaxFurnaceTemp}
                placeholder="e.g., 1200"
              />

              <Text style={{ color: '#f1c40f', fontWeight: 'bold', marginBottom: 15, marginTop: 10 }}>🏢 LAB STATUS</Text>
              <TouchableOpacity 
                style={[styles.roleButton, { backgroundColor: isLabActive ? '#27ae60' : '#c0392b', width: '100%' }]}
                onPress={() => setIsLabActive(!isLabActive)}
              >
                <Text style={styles.buttonText}>
                  System Status: {isLabActive ? "ACTIVE (RECEIVING SAMPLES)" : "INACTIVE (PAUSED)"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.roleButton, { marginTop: 20, backgroundColor: '#2980b9' }]} 
              onPress={() => {
                const msg = "System configurations updated successfully!";
                Platform.OS === 'web' ? alert(msg) : Alert.alert("Success", msg);
                setScreen('dashboard');
              }}
            >
              <Text style={styles.buttonText}>💾 Save Configurations</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#7f8c8d', marginTop: 10 }]} onPress={() => setScreen('dashboard')}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  // --- MAIN LAYOUT GATE (DASHBOARD, PROFILE, LOGIN) ---
  const userRole = role ? role.toLowerCase().trim() : '';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        
        {/* --- DASHBOARD VIEW --- */}
        {screen === 'dashboard' && (
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - {role}</Text>
            
            {userRole === 'admin' && (
              <View style={styles.roleBox}>
                <Text style={styles.roleTitle}>Admin Dashboard</Text>
                <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('signup')}>
                  <Text style={styles.buttonText}>Register New Staff</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} onPress={fetchStaffDirectory}>
                  <Text style={styles.buttonText}>📋 View Active Staff Directory</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#e67e22', marginTop: 10 }]} onPress={() => setScreen('system_settings')}>
                  <Text style={styles.buttonText}>⚙️ Manage System Settings</Text>
                </TouchableOpacity>
              </View>
            )}

            {userRole === 'lab technician' && (
              <View style={styles.roleBox}>
                <Text style={styles.roleTitle}>Technician Portal</Text>
                <TouchableOpacity style={styles.roleButton}>
                  <Text style={styles.buttonText}>Log Test Results</Text>
                </TouchableOpacity>
              </View>
            )}

            {userRole === 'metallurgist' && (
              <View style={styles.roleBox}>
                <Text style={styles.roleTitle}>Metallurgist Portal</Text>
                <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Analyze Sample Data</Text></TouchableOpacity>
                <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Generate Quality Reports</Text></TouchableOpacity>
              </View>
            )}

            {userRole === 'furnace operator' && (
              <View style={styles.roleBox}>
                <Text style={styles.roleTitle}>Furnace Operations</Text>
                <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Log Melt Cycle Data</Text></TouchableOpacity>
                <TouchableOpacity style={styles.roleButton}><Text style={styles.buttonText}>Monitor Furnace Status</Text></TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {/* --- PROFILE VIEW --- */}
        {screen === 'profile' && (
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.roleBox}>
              <Text style={styles.buttonText}>Name: {fullName}</Text>
              <Text style={styles.buttonText}>Role: {role}</Text>
              <Text style={styles.buttonText}>Company: {companyName}</Text>
            </View>
            {isChangingPassword ? (
              <View style={styles.roleBox}>
                <TextInput style={styles.input} placeholder="Current Password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
                <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                <TextInput style={styles.input} placeholder="Confirm New Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                <TouchableOpacity style={styles.loginButton} onPress={() => handleInternalPasswordChange(currentPassword, newPassword)}>
                  <Text style={styles.loginButtonText}>Save New Password</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsChangingPassword(false)}>
                  <Text style={[styles.switchText, { textDecorationLine: 'none', color: '#e74c3c' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#3498db', marginTop: 10}]} onPress={() => setIsChangingPassword(true)}>
                <Text style={styles.buttonText}>Change Password</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.button} onPress={() => setScreen('dashboard')}>
              <Text style={styles.buttonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {/* --- LOGIN VIEW --- */}
        {screen === 'login' && (
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>Electronics & Metallurgy Lab</Text>
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" placeholderTextColor="#888" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#888" />
            
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 15 }}>
              <Text style={[styles.switchText, { textDecorationLine: 'underline' }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 20 }}>
              <Text style={styles.switchText}>Staff: Contact your Manager for access.</Text>
              <TouchableOpacity onPress={() => {
                 setRegName(''); setRegEmail(''); setRegPassword(''); setRegRole('');
                 setScreen('signup');
              }}>
                <Text style={[styles.switchText, { marginTop: 10, textDecorationLine: 'none' }]}>
                  Are you a Lab Manager? <Text style={styles.signUpText}>Register your Company</Text>
                </Text>  
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', padding: 20 },
  scrollContainer: { flexGrow: 1, paddingVertical: 40, justifyContent: 'center' },
  title: { fontSize: 42, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#c8d4e6', marginBottom: 40 },
  input: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16, color: '#000' },
  loginButton: { backgroundColor: '#0047AB', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  button: { backgroundColor: '#2c5f8a', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  switchText: { color: '#c8d4e6', textAlign: 'center', marginTop: 20 },
  signUpText: { color: '#3498db', fontWeight: 'bold' },
  roleBox: { backgroundColor: '#2c3e50', padding: 20, borderRadius: 15, marginVertical: 20, borderWidth: 1, borderColor: '#3498db' },
  roleTitle: { color: '#3498db', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  roleButton: { backgroundColor: '#34495e', padding: 12, borderRadius: 8, marginVertical: 5, alignItems: 'center' }
});