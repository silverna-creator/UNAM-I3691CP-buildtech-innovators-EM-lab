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
  browserLocalPersistence, // Added this import
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
  // Web handles its own persistence automatically with getAuth
  auth = getAuth(app);
} else {
  // Mobile (Android/iOS)
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
  const [user, setUser] = useState(null); // Added missing user state
  const [isAdmin, setIsAdmin] = useState(false); // Added missing isAdmin state
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // --- SINGLE AUTH EFFECT (STABILIZED) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        
        // We set isReady immediately so the screen shows up 
        // while we fetch the extra data in the background
        setIsReady(true); 

        try {
          const userDoc = await getDoc(doc(db, "users", authenticatedUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName || "");
            setRole(userData.role || "");
            setCompanyName(userData.company || "Unam");
            setEmail(userData.email || authenticatedUser.email);
            setScreen('dashboard');
          } else {
            // If user exists in Auth but not in Firestore
            setScreen('login');
          }
        } catch (error) {
          console.error("Database fetch error:", error);
          setScreen('login');
        }
      } else {
        setUser(null);
        setIsReady(true); // Still set to true so Login shows up
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Data fetching is handled by the useEffect above
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
    const assignedRole = adminUser ? role : 'Admin'; 

    if (!email || !password || !fullName || !assignedRole || !companyName) {
      const msg = 'Please fill in all fields';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return;
    }

    try {
      let newUserUid;

      // --- CASE 1: ADMIN REGISTERS STAFF (SILENT BYPASS) ---
      if (adminUser) {
        // We create the secondary instance with a randomized name to completely hide it from the main thread
        const secondaryAppName = `SilentApp_${Math.random().toString(36).substring(7)}`;
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        // This happens completely in the background
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        newUserUid = userCredential.user.uid;

        // Force-signout the background user immediately so it doesn't touch your main session
        await secondaryAuth.signOut();
      } 
      // --- CASE 2: NEW MANAGER SETUP ---
      else {
        const companyQuery = query(collection(db, "users"), where("company", "==", companyName));
        const querySnapshot = await getDocs(companyQuery);
        if (!querySnapshot.empty) {
          const msg = "This Company Name is already registered.";
          Platform.OS === 'web' ? alert(msg) : Alert.alert("Name Taken", msg);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        newUserUid = userCredential.user.uid;
      }

      // --- DATABASE WRITE ---
      await setDoc(doc(db, "users", newUserUid), {
        fullName: fullName,
        company: companyName,
        role: assignedRole,
        email: email,
        createdAt: new Date()
      });

      // --- SCREEN ROUTING LOCK ---
      if (adminUser) {
        // FORCE THE APP TO STAY ON THE DASHBOARD
        setUser(adminUser); // Forcefully re-verify your main state
        setScreen('dashboard'); 
        
        const msg = `Staff member ${fullName} successfully registered! You can now send them their credentials.`;
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Success', msg);

        // Reset ONLY the registration input boxes so you can register another one
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('');
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
    try {
      // 1. Fallback check: try companyId first, if undefined use company
      const companyMatchField = companyName || "Unam";

      console.log("Attempting to fetch staff for company:", companyMatchField);

      // We query the 'users' collection matching your group's schema
      const staffQuery = query(
        collection(db, "users"), 
        where("company", "==", companyMatchField) 
        // Note: If your database uses companyId, change "company" to "companyId" above!
      );
      
      const querySnapshot = await getDocs(staffQuery);
      const members = [];
      
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() });
      });
      
      console.log("Staff fetched successfully:", members);
      setStaffList(members);
      setScreen('staff_directory');
    } catch (error) {
      // This prints the EXACT reason for the failure in your F12 console inspect tool
      console.error("Detailed Firestore Directory Error:", error.code, error.message);
      
      const msg = `Failed to load staff directory: ${error.message}`;
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
    }
  };

  // --- SCREEN RENDERING ---
  if (!isReady || screen === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EM-Lab</Text>
        <Text style={styles.subtitle}>Securing Session...</Text>
      </View>
    );
  }

  if (screen === 'dashboard') {
    // Normalizing the role string to make comparisons foolproof
    const userRole = role ? role.toLowerCase().trim() : '';

    return (
      <View style={styles.container}>
        <Text style={styles.title}>EM-Lab</Text>
        <Text style={styles.subtitle}>{companyName} - {role}</Text>
        
        {/* --- 1. ADMIN / LAB MANAGER PORTAL --- */}
        {userRole === 'admin' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Admin Dashboard</Text>
            <TouchableOpacity style={styles.roleButton} onPress={() => {
                setFullName(''); setEmail(''); setPassword(''); setRole('');
                setScreen('signup');
              }}>
              <Text style={styles.buttonText}>Register New Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} 
              onPress={fetchStaffDirectory}
            >
              <Text style={styles.buttonText}>📋 View Active Staff Directory</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- 2. LAB TECHNICIAN PORTAL --- */}
        {userRole === 'lab technician' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Technician Portal</Text>
            <TouchableOpacity style={styles.roleButton}>
              <Text style={styles.buttonText}>Log Test Results</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- 3. METALLURGIST PORTAL --- */}
        {userRole === 'metallurgist' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Metallurgist Portal</Text>
            <TouchableOpacity style={styles.roleButton}>
              <Text style={styles.buttonText}>Analyze Sample Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleButton}>
              <Text style={styles.buttonText}>Generate Quality Reports</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- 4. FURNACE OPERATOR PORTAL --- */}
        {userRole === 'furnace operator' && (
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Furnace Operations</Text>
            <TouchableOpacity style={styles.roleButton}>
              <Text style={styles.buttonText}>Log Melt Cycle Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleButton}>
              <Text style={styles.buttonText}>Monitor Furnace Status</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- GLOBAL ACCOUNT BUTTONS --- */}
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
      </View>
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
  // --- EMERGENCY RENDER GUARD ---
  // If we are on the signup screen, we show it NO MATTER WHAT.
  if (screen === 'signup') {
    // This is your current signup return block...
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
           <SafeAreaView style={styles.container}>
             <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
               <ScrollView contentContainerStyle={styles.scrollContainer}>
                 <Text style={styles.title}>EM-Lab</Text>
                 <Text style={styles.subtitle}>{auth.currentUser ? "Staff Registration" : "Manager Registration"}</Text>
                 
                 <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} placeholderTextColor="#888" />
                 <TextInput style={styles.input} placeholder="Company Name" value={companyName} onChangeText={setCompanyName} placeholderTextColor="#888" />
                 {/* --- START OF ADAPTIVE ROLE SECTION --- */}
{auth.currentUser ? (
  /* This shows when an Admin is registering a Staff member */
  <TextInput 
    style={styles.input} 
    placeholder="Staff Role (e.g. Lab Technician)" 
    value={role} 
    onChangeText={setRole} 
    placeholderTextColor="#888" 
  />
) : (
  /* This shows when a new Manager is registering a Company */
  <View style={[styles.roleBox, { 
    marginTop: 0, 
    marginBottom: 15, 
    borderColor: '#f1c40f', 
    backgroundColor: 'rgba(241, 196, 15, 0.1)',
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  }]}>
    <Text style={{ fontSize: 24, marginRight: 12 }}>🛡️</Text>
    <View>
      <Text style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: 14 }}>
        SECURITY VERIFIED
      </Text>
      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500' }}>
        Role: Company Administrator
      </Text>
    </View>
  </View>
)}
{/* --- END OF ADAPTIVE ROLE SECTION --- */}
                 <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" placeholderTextColor="#888" />
                 <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#888" />

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

  // Only show the loading screen for the Dashboard/Login, NOT the signup
  if (!isReady && screen !== 'signup') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EM-Lab</Text>
        <Text style={styles.subtitle}>Securing Session...</Text>
      </View>
    );
  }

 return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        {/* --- 1. SIGNUP SCREEN (Highest Priority) --- */}
        {screen === 'signup' && (
          <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>EM-Lab</Text>
                <Text style={styles.subtitle}>
                  {auth.currentUser ? "Staff Registration Portal" : "Company Manager Registration"}
                </Text>
                
                <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Company Name" value={companyName} onChangeText={setCompanyName} placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Role (e.g. Lab Technician)" value={role} onChangeText={setRole} placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#888" />
                
                {!auth.currentUser && (
                  <TouchableOpacity 
                    style={[styles.roleBox, { marginTop: 5, backgroundColor: isAdmin ? '#0047AB' : '#2c3e50', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} 
                    onPress={() => setIsAdmin(!isAdmin)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Register as Company Admin</Text>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#3498db', backgroundColor: isAdmin ? '#3498db' : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                      {isAdmin && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
                  <Text style={styles.loginButtonText}>Register</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => auth.currentUser ? setScreen('dashboard') : setScreen('login')}>
                  <Text style={styles.switchText}>
                    {auth.currentUser ? "Back to Dashboard" : "Back to Login"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        )}

        {/* --- 2. LOADING SCREEN --- */}
        {screen === 'loading' && !isReady && (
          <View style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>Securing Session...</Text>
          </View>
        )}

        {/* --- 3. DASHBOARD SCREEN --- */}
        {screen === 'dashboard' && (
          <View style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - {role}</Text>
            {role.toLowerCase() === 'admin' && (
              <View style={styles.roleBox}>
                <Text style={styles.roleTitle}>Admin Dashboard</Text>
                <TouchableOpacity style={styles.roleButton} onPress={() => {
                    setFullName(''); setEmail(''); setPassword(''); setRole('');
                    setScreen('signup');
                }}>
                  <Text style={styles.buttonText}>Register New Staff</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- 4. PROFILE SCREEN --- */}
        {screen === 'profile' && (
          <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.roleBox}>
              <Text style={styles.buttonText}>Name: {fullName}</Text>
              <Text style={styles.buttonText}>Role: {role}</Text>
              <Text style={styles.buttonText}>Company: {companyName}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => setScreen('dashboard')}>
              <Text style={styles.buttonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- 5. LOGIN SCREEN (Default) --- */}
        {screen === 'login' && (
          <View style={styles.container}>
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
                 setFullName(''); setEmail(''); setPassword(''); setRole(''); setCompanyName('');
                 setScreen('signup');
              }}>
                <Text style={[styles.switchText, { marginTop: 10, textDecorationLine: 'none' }]}>
                  Are you a Lab Manager? <Text style={styles.signUpText}>Register your Company</Text>
                </Text>  
              </TouchableOpacity>
            </View>
          </View>
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
  roleButton: { backgroundColor: '#34495e', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
});