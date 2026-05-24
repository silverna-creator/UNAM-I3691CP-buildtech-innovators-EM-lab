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

import { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs, addDoc } from "firebase/firestore";
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

  // --- LAB TECHNICIAN STATES ---
  const [samplesList, setSamplesList] = useState([]);
  const [sampleId, setSampleId] = useState('');
  const [oreType, setOreType] = useState('Copper'); // Default selection
  const [initialWeight, setInitialWeight] = useState('');

  // Furnace Operator Form States
  const [meltId, setMeltId] = useState('');
  const [furnaceTemp, setFurnaceTemp] = useState('');
  const [cycleDuration, setCycleDuration] = useState('');
  const [furnaceLogs, setFurnaceLogs] = useState([]);

  // Metallurgist State Hooks
  const [pendingSamples, setPendingSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [gradePurity, setGradePurity] = useState('');

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
            
            // Normalize the role string right at entry to prevent case mismatches
            const userRole = userData.role ? userData.role.toLowerCase().trim() : "";
            setRole(userRole);
            
            // Normalize company name to ensure uniform dynamic queries
            const userCompany = userData.company ? userData.company.trim() : "UNAM";
            setCompanyName(userCompany);
            
            setEmail(userData.email || authenticatedUser.email);

            // 🚦 The Smart Router Gateway
            if (userRole === 'admin') {
              setScreen('dashboard'); 
            } else if (userRole === 'lab technician') {
              console.log(`Routing ${userData.fullName} to Lab Technician Portal smoothly...`);
              setScreen('lab_technician_dashboard'); 
              fetchMineralSamples();
            } else if (userRole === 'furnace operator') {
              setScreen('furnace_operator_dashboard'); 
            } else if (userRole === 'metallurgist') {
              // 🔬 FIXED: Added explicit background listener support for metallurgist profiles!
              setScreen('metallurgist_dashboard'); 
            } else {
              setScreen('login');
            }
          } else {
            setScreen('login');
          }
        } catch (error) {
          console.error("Database fetch error during authentication routing:", error);
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
    if (!email || !password) {
      const msg = 'Please enter email and password';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return;
    }
    
    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Fetch the corresponding profile document from Firestore
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 3. Set global user states
        if (userData.fullName) setFullName(userData.fullName);
        if (userData.company) setCompanyName(userData.company);
        if (userData.role) setRole(userData.role);

        // Normalize the role text for safe string checking
        const cleanRole = userData.role ? userData.role.toLowerCase().trim() : '';
        console.log("LOGGED IN USER PROFILE DETECTED:", userData);

        // 4. ROUTING TERMINALS: Direct routing based on exact role strings
        if (cleanRole === 'admin') {
          setScreen('dashboard');
        } else if (cleanRole === 'lab technician') {
          setScreen('lab_technician_dashboard');
        } else if (cleanRole === 'furnace operator') {
          setScreen('furnace_operator_dashboard');
        } else if (cleanRole === 'metallurgist') {
          setScreen('metallurgist_dashboard'); // 🔬 Add this line!
        } else {
          // If role is corrupted or unexpected
          const unknownMsg = `Profile role mismatch: "${userData.role}". Contact your system admin.`;
          Platform.OS === 'web' ? alert(unknownMsg) : Alert.alert("Profile Error", unknownMsg);
          await auth.signOut();
          setScreen('login');
        }

      } else {
        // Document doesn't exist in the 'users' collection
        const noDocMsg = "Account authenticated, but no profile record was found in database.";
        Platform.OS === 'web' ? alert(noDocMsg) : Alert.alert("Database Error", noDocMsg);
        await auth.signOut();
        setScreen('login');
      }

    } catch (error) {
      // 🚪 DIAGNOSTICS FOR BEHIND CLOSED DOORS:
      console.log("==================== LOGIN BREAKDOWN ====================");
      console.log("ERROR CODE:", `'${error.code}'`);
      console.log("ERROR MESSAGE:", error.message);
      console.log("=========================================================");

      // Show the true error message so it doesn't mask behind a generic network warning
      let friendlyMessage = `Authentication failed: ${error.message}`;
      
      if (error.code === 'auth/user-not-found') {
        friendlyMessage = "This email is not registered in our system.";
      } else if (error.code === 'auth/wrong-password') {
        friendlyMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = "The email address format is invalid.";
      }

      Platform.OS === 'web' ? alert(friendlyMessage) : Alert.alert("Login Error", friendlyMessage);
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
    // 1. Safety Gate: If the Admin's company name is empty, alert and stop.
    if (!companyName) {
      const msg = "Error: Admin company profile not fully loaded yet. Please try again.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    try {
      // 2. Terminal Debugging Checks (Completely dynamic!)
      console.log("==================== DEBUG TERMINAL ====================");
      console.log("LOGGED-IN ADMIN COMPANY NAME STATE:", `'${companyName}'`);
      console.log("========================================================");

      // 3. Query using the live, dynamic companyName state directly
      const staffQuery = query(
        collection(db, "users"), 
        where("company", "==", companyName)
      );
      
      const querySnapshot = await getDocs(staffQuery);
      const members = [];
      
      querySnapshot.forEach((doc) => {
        console.log("FOUND USER MATCH IN DATABASE:", doc.id, doc.data());
        members.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Total staff records retrieved for ${companyName}: ${members.length}`);
      setStaffList(members);
      setScreen('staff_directory');
    } catch (error) {
      console.error("Detailed Firestore Directory Error:", error.code, error.message);
      const msg = `Failed to load staff directory: ${error.message}`;
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
    }
  };

  const logMineralSample = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Validation Check
    if (!sampleId.trim() || !initialWeight.trim()) {
      const msg = "Please fill in all sample details.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    try {
      console.log("Logging mineral sample for company:", companyName);

      // Create a reference to a new document inside a global "samples" collection
      const sampleData = {
        sampleId: sampleId.trim().toUpperCase(),
        oreType: oreType,
        initialWeight: parseFloat(initialWeight),
        company: companyName, // Multi-tenant link
        loggedBy: fullName,    // Track which technician did the work
        createdAt: new Date().toISOString(),
        status: "Pending Analysis" // Initial state for the pipeline
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "samples"), sampleData);
      console.log("Sample stored successfully with ID:", docRef.id);

      const successMsg = `Sample ${sampleId} logged successfully!`;
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert("Success", successMsg);

      // Clear the input fields completely
      setSampleId('');
      setInitialWeight('');
      
      // Refresh the local list automatically so it appears immediately
      fetchMineralSamples();
    } catch (error) {
      console.error("Error logging mineral sample:", error);
      const errorMsg = `Failed to log sample: ${error.message}`;
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("Error", errorMsg);
    }
  };

  const fetchMineralSamples = async () => {
    if (!companyName) return;

    try {
      console.log("Fetching mineral samples for company:", companyName);
      
      const samplesQuery = query(
        collection(db, "samples"),
        where("company", "==", companyName)
      );

      const querySnapshot = await getDocs(samplesQuery);
      const samples = [];

      querySnapshot.forEach((doc) => {
        samples.push({ id: doc.id, ...doc.data() });
      });

      // Sort by newest arrival first
      samples.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setSamplesList(samples);
      setScreen('sample_directory'); // Ensure they stay/go to the portal view
    } catch (error) {
      console.error("Error fetching mineral samples:", error);
    }
  };

  // 1. Commit Melt Cycle to Firestore
  const logMeltCycle = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!meltId.trim() || !furnaceTemp.trim() || !cycleDuration.trim()) {
      const msg = "Please fill in all melt cycle details.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    try {
      const meltData = {
        meltId: meltId.trim().toUpperCase(),
        temperature: parseFloat(furnaceTemp),
        durationMinutes: parseInt(cycleDuration),
        companyId: companyName, // Binds it to this specific company environment
        loggedBy: fullName,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "furnace_operations"), meltData);
      
      const successMsg = `Melt Cycle ${meltId.toUpperCase()} logged successfully!`;
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert("Success", successMsg);
      
      setMeltId('');
      setFurnaceTemp('');
      setCycleDuration('');
      fetchFurnaceOperations(); // Refresh the list automatically
    } catch (error) {
      console.error("Error logging melt cycle:", error);
    }
  };

  // 2. Fetch Historical Melt Runs
  const fetchFurnaceOperations = async () => {
    if (!companyName) return;

    try {
      const furnaceQuery = query(
        collection(db, "furnace_operations"),
        where("companyId", "==", companyName)
      );

      const querySnapshot = await getDocs(furnaceQuery);
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      // Sort with newest runs at the top
      logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFurnaceLogs(logs);
      setScreen('furnace_directory'); // Route directly to the uniform history view
    } catch (error) {
      console.error("Error retrieving furnace operations:", error);
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

  if (screen === 'log_sample') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>EM-Lab</Text>
                <Text style={styles.subtitle}>Log New Mineral Sample</Text>

                <TextInput style={styles.input} placeholder="Sample ID / Batch Code" value={sampleId} onChangeText={setSampleId} placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Initial Weight (kg)" value={initialWeight} onChangeText={setInitialWeight} keyboardType="numeric" placeholderTextColor="#888" />
                
                <Text style={{ color: '#c8d4e6', marginBottom: 10, fontSize: 13, fontWeight: '600', alignSelf: 'flex-start', marginLeft: '5%' }}>Ore Classification:</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%', marginBottom: 20 }}>
                  {['Copper', 'Gold', 'Zinc', 'Uranium'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setOreType(type)}
                      style={{
                        backgroundColor: oreType === type ? '#3498db' : '#232931',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: oreType === type ? '#3498db' : '#333'
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.loginButton} onPress={logMineralSample}>
                  <Text style={styles.loginButtonText}>Commit Sample</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setScreen('lab_technician_dashboard')}>
                  <Text style={styles.switchText}>Back to Dashboard</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  if (screen === 'sample_directory') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Sample Batches</Text>
            <Text style={styles.subtitle}>Active Laboratory Inventory</Text>

            <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
              {samplesList.length === 0 ? (
                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No samples registered yet.</Text>
              ) : (
                samplesList.map((item) => (
                  <View key={item.id} style={[styles.roleBox, { marginTop: 0, marginBottom: 10, padding: 15 }]}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{item.sampleId}</Text>
                    <Text style={{ color: '#f1c40f', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                      ⚙️ Status: {item.status}
                    </Text>
                    <Text style={{ color: '#c8d4e6', fontSize: 13, marginTop: 4 }}>Classification: {item.oreType} | Weight: {item.initialWeight} kg</Text>
                    <Text style={{ color: '#7f8c8d', fontSize: 11, marginTop: 4 }}>Logged By: {item.loggedBy}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={() => setScreen('lab_technician_dashboard')}>
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

  if (screen === 'log_melt_cycle') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>EM-Lab</Text>
                <Text style={styles.subtitle}>Log Melt Cycle Data</Text>

                <TextInput style={styles.input} placeholder="Melt ID / Batch Number" value={meltId} onChangeText={setMeltId} placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Current Temperature (°C)" value={furnaceTemp} onChangeText={setFurnaceTemp} keyboardType="numeric" placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Cycle Duration (Minutes)" value={cycleDuration} onChangeText={setCycleDuration} keyboardType="numeric" placeholderTextColor="#888" />

                <TouchableOpacity style={styles.loginButton} onPress={logMeltCycle}>
                  <Text style={styles.loginButtonText}>Commit Melt Run</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setScreen('furnace_operator_dashboard')}>
                  <Text style={styles.switchText}>Back to Dashboard</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  if (screen === 'furnace_directory') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Furnace Logs</Text>
            <Text style={styles.subtitle}>Historical Thermal Melt Run Registry</Text>

            <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
              {furnaceLogs.length === 0 ? (
                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No furnace cycles registered yet.</Text>
              ) : (
                furnaceLogs.map((item) => {
                  // Alert logic: check if the run exceeded our safety threshold (e.g., 1200°C or dynamic maxFurnaceTemp)
                  const isOverheated = item.temperature > parseFloat(maxFurnaceTemp || 1200);
                  
                  return (
                    <View 
                      key={item.id} 
                      style={[
                        styles.roleBox, 
                        { 
                          marginTop: 0, 
                          marginBottom: 10, 
                          padding: 15,
                          borderLeftWidth: 4,
                          borderLeftColor: isOverheated ? '#c0392b' : '#27ae60' 
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{item.meltId}</Text>
                        <Text style={{ color: isOverheated ? '#c0392b' : '#27ae60', fontSize: 13, fontWeight: 'bold' }}>
                          {isOverheated ? "⚠️ OVERHEAT" : "✅ NORMAL"}
                        </Text>
                      </View>
                      
                      <Text style={{ color: '#c8d4e6', fontSize: 14, marginTop: 4 }}>
                        🌡️ Temp: {item.temperature}°C | ⏱️ Duration: {item.durationMinutes} mins
                      </Text>
                      <Text style={{ color: '#7f8c8d', fontSize: 11, marginTop: 4 }}>Executed By: {item.loggedBy}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={() => setScreen('furnace_operator_dashboard')}>
              <Text style={styles.buttonText}>Back to Dashboard</Text>
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

        {/* 🚨 TEMPORARY DEBUG FLAG - REMOVE AFTER FIXING */}
        <Text style={{ color: '#ffec3d', textAlign: 'center', marginTop: 40, fontSize: 12 }}>
          DEBUG INFO: Screen is currently '{screen}' | Role is '{role}'
        </Text>
        
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

        {/* --- 🔬 LAB TECHNICIAN MATCHING DASHBOARD PORTAL --- */}
        {screen === 'lab_technician_dashboard' && (
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - {role.toUpperCase()}</Text>

            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>Technician Portal</Text>
              
              <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('log_sample')}>
                <Text style={styles.buttonText}>🧪 Log New Mineral Sample</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} onPress={fetchMineralSamples}>
                <Text style={styles.buttonText}>📋 View Logged Samples</Text>
              </TouchableOpacity>
            </View>

            {/* Standard Uniform Bottom Buttons */}
            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {/* --- 🔥 FURNACE OPERATOR MATCHING DASHBOARD PORTAL --- */}
        {screen === 'furnace_operator_dashboard' && (
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - {role.toUpperCase()}</Text>

            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>Furnace Operations</Text>
              
              <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('log_melt_cycle')}>
                <Text style={styles.buttonText}>🌋 Log Melt Cycle Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} onPress={fetchFurnaceOperations}>
                <Text style={styles.buttonText}>📊 Monitor Furnace Status</Text>
              </TouchableOpacity>
            </View>

            {/* Standard Uniform Bottom Buttons */}
            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {/* --- 🔬 METALLURGIST PORTAL DASHBOARD --- */}
        {screen === 'metallurgist_dashboard' && (
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - {role.toUpperCase()}</Text>

            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>Quality Assurance & Analysis</Text>
              
              <TouchableOpacity style={styles.roleButton} onPress={fetchSamplesForAnalysis}>
                <Text style={styles.buttonText}>🧪 Analyze Pending Samples</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} onPress={fetchAnalysisHistory}>
                <Text style={styles.buttonText}>📜 View Assay History</Text>
              </TouchableOpacity>
            </View>

            {/* Standard Uniform Bottom Navigation */}
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