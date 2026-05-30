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
  updatePassword, browserLocalPersistence
} from "firebase/auth";

import { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs, addDoc, updateDoc, serverTimestamp, deleteDoc, arrayUnion } from "firebase/firestore";
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

const ORE_DATABASE = {
  SULFIDES: ["Chalcopyrite (Cu)", "Galena (Pb)", "Sphalerite (Zn)", "Pyrite (Fe)"],
  OXIDES: ["Hematite (Fe)", "Magnetite (Fe)", "Chromite (Cr)", "Bauxite (Al)"],
  NATIVE: ["Gold (Au)", "Silver (Ag)", "Copper (Cu)"],
  CARBONATES: ["Malachite (Cu)", "Azurite (Cu)", "Calcite (Ca)"]
};

// --- SAFE INITIALIZATION ---
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// --- AUTH INITIALIZATION (UPDATED) ---
let auth;

if (Platform.OS === 'web') {
  // 🌐 Explicitly tell the browser to remember who is logged in
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
} else {
  // 📱 Use mobile AsyncStorage persistence for Android / iOS engines
  try {
    // Changing 'firebase/auth/react-native' to 'firebase/auth' fixes the web compiler error
    const { getReactNativePersistence } = require('firebase/auth');
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
  const [regCompany, setRegCompany] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [ticketText, setTicketText] = useState('');

  const [maxFurnaceTemp, setMaxFurnaceTemp] = useState('1200'); 
  const [isLabActive, setIsLabActive] = useState(true);

  // --- LAB TECHNICIAN STATES ---
const [samplesList, setSamplesList] = useState([]); // 👈 Keep this so your list views don't break!
const [sampleId, setSampleId] = useState('');
const [initialWeight, setInitialWeight] = useState('');

// 🔬 NEW SELECTION STATE TRACKERS 
const [selectedGroup, setSelectedGroup] = useState('SULFIDES');
const [selectedOre, setSelectedOre] = useState('');

  // Furnace Operator Form States
  const [meltId, setMeltId] = useState('');
  const [furnaceTemp, setFurnaceTemp] = useState('');
  const [cycleDuration, setCycleDuration] = useState('');
  const [furnaceLogs, setFurnaceLogs] = useState([]);

  // Metallurgist State Hooks
  const [pendingSamples, setPendingSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [gradePurity, setGradePurity] = useState('');

  const [assayHistory, setAssayHistory] = useState([]);

  const [loggedSamples, setLoggedSamples] = useState([]);

  const [rejectionReason, setRejectionReason] = useState('');


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
            
            const userRole = userData.role ? userData.role.toLowerCase().trim() : "";
            setRole(userRole);
            
            // 🛡️ DYNAMIC MULTI-TENANT VERIFICATION (NO HARDCODING)
            if (!userData.company || userData.company.trim() === "") {
              console.error("❌ TENANT ISOLATION BREACH: User profile has no company assignment.");
              const companyError = "Account configuration error: No company portfolio assigned to this profile. Contact your system administrator.";
              Platform.OS === 'web' ? alert(companyError) : Alert.alert("Profile Error", companyError);
              setScreen('login');
              return;
            }

            const userCompany = userData.company.trim();
            setCompanyName(userCompany); // Updates state for general use
            
            // 🚦 The Smart Router Gateway
            if (userRole === 'admin') {
              setScreen('dashboard'); 
              // 🟢 DROPPED HERE: Pre-load telemetry data cleanly for the admin dashboard screen
              fetchLiveFurnaceTelemetry();
            } else if (userRole === 'lab_manager' || userRole === 'lab technician') {
              console.log(`Routing ${userData.fullName} to Lab Technician Portal smoothly for [${userCompany.toUpperCase()}]...`);
              setScreen('lab_technician_dashboard'); 
              
              // 🏎️ RACE CONDITION BYPASS: Pass the raw string directly into the function call!
              fetchMineralSamples(userCompany);
            } else if (userRole === 'furnace operator') {
              setScreen('furnace_operator_dashboard'); 
            } else if (userRole === 'metallurgist') {
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
    // 🛡️ Use the dedicated regCompany state to prevent multi-tenant data bleeding
    const normalizedCompany = regCompany ? regCompany.toUpperCase().trim() : '';
    const adminUser = auth.currentUser; 
    const assignedRole = adminUser ? regRole : 'Admin'; 

    if (!regEmail || !regPassword || !regName || !assignedRole || !normalizedCompany) {
      const msg = 'Please fill in all fields before submitting registration.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return;
    }

    try {
      let newUserUid;

      if (adminUser) {
        // Staff creation path for currently logged-in Admin manager
        const secondaryAppName = `SilentApp_${Math.random().toString(36).substring(7)}`;
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        // 1. Create the credentials in the cloud auth system
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, regEmail, regPassword);
        newUserUid = userCredential.user.uid;

        // 2. Await the database confirmation completely before moving forward
        await setDoc(doc(db, "users", newUserUid), {
          fullName: regName,
          company: normalizedCompany,
          role: assignedRole,
          email: regEmail,
          createdAt: new Date()
        });

        // 3. Only sign out the background channel after the database explicitly finishes writing
        try {
          await secondaryAuth.signOut();
        } catch (signOutError) {
          console.log("Non-blocking secondary signout clean:", signOutError.message);
        }
      } else {
        // Fresh sign up path: check if this company name is already registered in the ecosystem
        const companyQuery = query(collection(db, "users"), where("company", "==", normalizedCompany));
        const querySnapshot = await getDocs(companyQuery);
        if (!querySnapshot.empty) {
          const msg = "This Company Name is already registered on our network.";
          Platform.OS === 'web' ? alert(msg) : Alert.alert("Name Taken", msg);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
        newUserUid = userCredential.user.uid;

        // Regular signup path also writes to Firestore here
        await setDoc(doc(db, "users", newUserUid), {
          fullName: regName,
          company: normalizedCompany,
          role: assignedRole,
          email: regEmail,
          createdAt: new Date()
        });
      }

      if (adminUser) {
        setUser(adminUser); 
        setScreen('dashboard'); 
        
        const msg = `Staff member ${regName} successfully registered under ${normalizedCompany}!`;
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Success', msg);

        // Clear out the boxes safely
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegRole('');
        setRegCompany(''); 
      } else {
        const msg = `Company account for ${normalizedCompany} created successfully! Please log in with your Admin credentials.`;
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Success', msg);
        
        // Clear variables before shifting screen
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegCompany('');
        setScreen('login');
      }

    } catch (error) {
      console.log("====================================");
      console.log("🛑 REGISTRATION BREAKDOWN DIAGNOSTIC:");
      console.log("CODE:", error.code);
      console.log("MESSAGE:", error.message);
      console.log("CURRENT ADMIN COMPANY STATE:", companyName); 
      console.log("====================================");

      const errorMsg = `Registration Failed: ${error.message}`;
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('Error', errorMsg);
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

  const handleDeleteStaff = async (staffId, staffName) => {
    // 🛡️ Always display a critical confirmation window before wiping access profiles
    const confirmAction = window.confirm(`CRITICAL SECURITY WARNING:\nAre you sure you want to permanently revoke access for ${staffName}? They will be instantly frozen out of the company platform.`);
    
    if (!confirmAction) return;

    try {
      // 1. Reference the user document in Firestore
      const staffDocRef = doc(db, "users", staffId);
      
      // 2. Erase the profile data from the collection
      await deleteDoc(staffDocRef);

      // 3. ✨ UI LIVE REFRESH: Immediately filter out the deleted staff member from view state
      setStaffList(prevList => prevList.filter(member => member.id !== staffId));

      const msg = `${staffName} has been successfully purged from your company directory.`;
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Access Revoked', msg);

    } catch (error) {
      console.error("Purge Error:", error.message);
      const errorMsg = `Failed to revoke access: ${error.message}`;
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('Error', errorMsg);
    }
  };

  const handleSubmitTicket = async () => {
    if (!ticketText.trim()) {
      const alertMsg = "Please enter details about your issue before submitting.";
      Platform.OS === 'web' ? alert(alertMsg) : Alert.alert("Empty Ticket", alertMsg);
      return;
    }

    try {
      // 🚀 Grab current user context variables
      const currentAdmin = auth.currentUser;
      
      // Assuming you track the current logged-in user's company profile locally (e.g. currentCompanyState)
      // If not, we can pull it directly from their local state variable setup.
      const companyTag = companyName || "Unknown Tenant Domain"; 

      await addDoc(collection(db, "support_tickets"), {
        adminEmail: currentAdmin?.email,
        company: companyTag,
        issue: ticketText,
        status: "Open",
        createdAt: serverTimestamp()
      });

      const successMsg = "Your support ticket has been logged successfully! Our team of Super-Admins will audit the Firebase console and clear any conflicting account tokens shortly.";
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert("Ticket Logged", successMsg);
      
      // Clean text state and head back to safe ground
      setTicketText('');
      setScreen('dashboard');

    } catch (error) {
      console.error("Ticket Submission Failure:", error.message);
      const errorMsg = `Failed to transmit support log: ${error.message}`;
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("Transmission Error", errorMsg);
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
    if (!sampleId || !sampleId.trim() || !initialWeight || !initialWeight.trim()) {
      const msg = "Please fill in all sample details.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    try {
      // 🛡️ Recover dynamic multi-tenant company scope
      let operationalCompany = "UNAM"; 
      if (companyName && companyName.trim() !== "") {
        operationalCompany = companyName.trim();
      } else if (auth.currentUser && auth.currentUser.email) {
        operationalCompany = auth.currentUser.email.split('@')[1].split('.')[0].toUpperCase();
      }

      console.log(`🔒 SECURE PIPELINE ACTIVE: Logging sample for tenant space [${operationalCompany.toUpperCase()}]`);

      const cleanCompany = operationalCompany.toUpperCase().trim();
      const cleanSampleId = sampleId.trim().toUpperCase();
      
      // 🎯 GENERATE COMPOSITE CUSTOM ID KEY
      const uniqueCompositeId = `${cleanCompany}_${cleanSampleId}`;

      // 🛡️ SANITIZATION LAYER: Force types with zero undefined gaps
      const finalOreType = selectedOre ? selectedOre.toString() : "Not Classified";
      const finalWeight = parseFloat(initialWeight) || 0.0;
      const finalLoggedBy = fullName ? fullName.toString() : "Technician";
      const finalTimestamp = new Date().toISOString();

      // Assemble the final compliant data payload package
      const sampleData = {
        sampleId: uniqueCompositeId, 
        displayId: cleanSampleId,     
        oreType: finalOreType, 
        initialWeight: finalWeight,
        company: cleanCompany, 
        loggedBy: finalLoggedBy,    
        createdAt: finalTimestamp,
        status: "Pending Analysis" 
      };

      console.log("Writing customized document path directly...", uniqueCompositeId);

      // DIRECT SECURE WRITE USING RECONFIGURED POLICY PATHS
      const customDocRef = doc(db, "mineral_samples", uniqueCompositeId);
      await setDoc(customDocRef, sampleData);
      
      console.log("Sample stored successfully with Unique ID:", uniqueCompositeId);

      const successMsg = `Sample ${cleanSampleId} logged successfully under secure ID: ${uniqueCompositeId}!`;
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert("Success", successMsg);

      // Reset the inputs for the next entry
      setSampleId('');
      setInitialWeight('');
      setSelectedGroup('SULFIDES'); 
      setSelectedOre('');
      
      // Dynamic refresh on the dashboard component
      fetchMineralSamples(cleanCompany);
    } catch (error) {
      console.error("Detailed Error Logging Catch:", JSON.stringify(error, null, 2) || error.message);
      const standardError = `Failed to log sample: ${error?.message || 'Data integrity fault'}`;
      Platform.OS === 'web' ? alert(standardError) : Alert.alert("Error", standardError);
    }
  };
  
const fetchMineralSamples = async (passedCompany, shouldSwitchScreen = false) => {
    // 🏎️ RACE CONDITION BYPASS: Use the parameter string if passed during login, 
    // otherwise fall back seamlessly to your state variable or filter out event objects.
    const activeCompany = (passedCompany && typeof passedCompany === 'string') ? passedCompany : companyName;

    try {
      console.log(`🔍 Fetching company logs from mineral_samples for: [${activeCompany || 'GLOBAL'}]...`);
      const samplesRef = collection(db, "mineral_samples");
      let q;

      // 🛡️ Safe Multi-Tenant Filter Check
      if (activeCompany && activeCompany.trim() !== "") {
        console.log(`Filtering logs for company: "${activeCompany}"`);
        q = query(samplesRef, where("company", "==", activeCompany));
      } else {
        console.log("⚠️ activeCompany token is empty! Pulling global sample log instead.");
        q = query(samplesRef); 
      }

      const querySnapshot = await getDocs(q);
      const samplesList = [];
      querySnapshot.forEach((doc) => {
        samplesList.push({ id: doc.id, ...doc.data() });
      });

      setLoggedSamples(samplesList);
      console.log("Successfully loaded records into state array:", samplesList.length);

      // 🔄 CONTROLLED NAVIGATION: Only flip screens when explicitly instructed (e.g., clicked from Dashboard)
      if (shouldSwitchScreen) {
        setScreen('view_samples');
      }
    } catch (error) {
      console.error("Error reading technician inventory log:", error);
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

  const fetchApprovedMeltQueue = async () => {
  try {
    const samplesRef = collection(db, "mineral_samples");
    // 🛡️ Only fetch batches approved by the metallurgist for this company
    const q = query(
      samplesRef, 
      where("company", "==", companyName), 
      where("status", "==", "Approved")
    );
    
    const querySnapshot = await getDocs(q);
    const approvedList = [];
    querySnapshot.forEach((doc) => {
      approvedList.push({ id: doc.id, ...doc.data() });
    });
    
    setFurnaceLogs(approvedList);
    setScreen('view_approved_melts');
  } catch (error) {
    console.error("Error fetching melt queue:", error);
  }
};

const updateFurnaceTelemetry = async () => {
  if (!currentTempInput.trim()) return;

  try {
    const docRef = doc(db, "mineral_samples", selectedMeltSample.id);
    
    // Create a time-stamped log entry object
    const newLogEntry = {
      temperature: parseFloat(currentTempInput),
      loggedAt: new Date().toISOString(),
      durationSoFar: cycleDurationInput || "Not Specified"
    };

    await updateDoc(docRef, {
      // 📈 Append to the history array smoothly
      temperatureLogs: arrayUnion(newLogEntry),
      currentTemperature: parseFloat(currentTempInput),
      lastFurnaceUpdate: new Date().toISOString(),
      status: "In Melt Cycle" // Changes status so technicians know it's cooking!
    });

    // Refresh our local selection state so the UI updates live
    setSelectedMeltSample(prev => ({
      ...prev,
      temperatureLogs: prev.temperatureLogs ? [...prev.temperatureLogs, newLogEntry] : [newLogEntry],
      currentTemperature: parseFloat(currentTempInput)
    }));

    setCurrentTempInput('');
    alert("🔥 Furnace telemetry log updated successfully!");
  } catch (error) {
    console.error("Error writing furnace telemetry:", error);
  }
};

const fetchLiveFurnaceTelemetry = async () => {
    try {
      const samplesRef = collection(db, "mineral_samples");
      // Query for samples that are currently processing inside the furnace
      const q = query(
        samplesRef, 
        where("company", "==", companyName), 
        where("status", "==", "In Melt Cycle")
      );
      
      const querySnapshot = await getDocs(q);
      const activeMelts = [];
      querySnapshot.forEach((doc) => {
        activeMelts.push({ id: doc.id, ...doc.data() });
      });
      
      // Save them into your existing array state variable
      setFurnaceLogs(activeMelts);
    } catch (error) {
      console.error("Error fetching live telemetry for admin:", error);
    }
  };

  const fetchSamplesForAnalysis = async () => {
    // 🔥 Force screen transition first so the UI never feels frozen
    setScreen('analysis_queue');
    
    try {
      console.log("Fetching pending samples from Firestore...");
      
      // Replace this next section with your exact Firestore query if different:
      const q = query(
        collection(db, "mineral_samples"), 
        where("status", "==", "Pending Analysis")
      );
      
      const querySnapshot = await getDocs(q);
      const samples = [];
      querySnapshot.forEach((doc) => {
        samples.push({ id: doc.id, ...doc.data() });
      });
      
      setPendingSamples(samples);
      console.log("Successfully loaded pending samples:", samples.length);
    } catch (error) {
      console.error("Database fetch handled gracefully:", error);
      // Even if the network fails, the screen has already shifted, 
      // showing the user a clean "Queue is clear" or empty state instead of freezing!
    }
  };

  // 🔬 2. Submit Chemical Grade Assay Results (Handles both Approve & Decline pathways)
  const submitAssayResults = async (sampleIdToUpdate, actionType) => {
    // Accepting sampleIdToUpdate as argument 1, and actionType as argument 2
    if (!sampleIdToUpdate) return;

    // 🟢 Validation for Approval Pathway
    if (actionType === 'Approved' && (!gradePurity || !gradePurity.trim())) {
      const msg = "Please input a dynamic purity grade evaluation (e.g., 84.5%).";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    // 🔴 Validation for Decline Pathway
    if (actionType === 'Declined' && (!rejectionReason || !rejectionReason.trim())) {
      const msg = "Please provide a reason for declining this batch for mining records.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    try {
      const docRef = doc(db, "mineral_samples", sampleIdToUpdate);
      
      // Build the update bundle dynamically based on which button was pressed
      const updateData = {
        status: actionType, // Saves either "Approved" or "Declined"
        evaluatedBy: fullName || "Certified Metallurgist",
        evaluatedAt: new Date().toISOString()
      };

      if (actionType === 'Approved') {
        updateData.purityGrade = gradePurity.trim();
        updateData.rejectionReason = ""; // Clear out any old text strings
      } else {
        updateData.purityGrade = "N/A - Declined";
        updateData.rejectionReason = rejectionReason.trim(); // Save the reason note
      }

      await updateDoc(docRef, updateData);
      
      const successMsg = actionType === 'Approved' 
        ? "Assay certified successfully! Material released for melt cycles."
        : "Batch declined. Operational notification locked in laboratory ledger.";
        
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert("Success", successMsg);
      
      // Reset all interactive states
      setGradePurity('');
      setRejectionReason('');
      setSelectedSample(null);
      
      // Reload remaining items and update the historical ledger automatically
      fetchSamplesForAnalysis(); 
      if (typeof fetchAssayHistory === 'function') {
        fetchAssayHistory();
      }
    } catch (error) {
      console.error("Error committing assay update:", error);
      const errorMsg = "Write error tracking failed.";
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("Error", errorMsg);
    }
  };
  
  const fetchAssayHistory = async () => {
  // Flip the screen to the history view immediately so it feels snappy
  setScreen('assay_history');

  try {
    console.log("Fetching certified assay records...");
    const q = query(
      collection(db, "mineral_samples")
    );

    const querySnapshot = await getDocs(q);
    const historyLog = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
  // Only include items that are completely finished processing
  if (data.status === 'Approved' || data.status === 'Declined') { 
    historyLog.push({ id: doc.id, ...data });
  }
    });

    // Sort by dynamic timestamp if available, or just set state
    setAssayHistory(historyLog);
  } catch (error) {
    console.error("Error pulling historical logs:", error);
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
                <TextInput style={styles.input} placeholder="Company Name" value={regCompany} onChangeText={setRegCompany} autoCapitalize="none" placeholderTextColor="#888" keyboardType="email-address"
  autoComplete="off"              // Overrides browser cache scanners
  importantForAutofill="no"       // Blocks mobile operating framework injection
  textContentType="none" />
                
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
                <TextInput style={styles.input} placeholder="Password" value={regPassword} onChangeText={setRegPassword} secureTextEntry placeholderTextColor="#888" autoCapitalize="none" autoComplete="new-password"     // Directs browser engines to treat this as a fresh unlinked pass field
  importantForAutofill="no"       // Drops device hardware level profile cache reads
  textContentType="none" />

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
                  <View key={member.id} style={[styles.roleBox, { marginTop: 0, marginBottom: 10, padding: 15, position: 'relative' }]}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{member.fullName}</Text>
                    <Text style={{ color: '#3498db', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                      💼 Role: {member.role}
                    </Text>
                    <Text style={{ color: '#c8d4e6', fontSize: 13, marginTop: 4 }}>✉️ Email: {member.email}</Text>
                    
                    {/* 🛡️ SAFEGUARDED RED REVOKE ACCESS BUTTON */}
                    {member.id !== auth.currentUser?.uid && (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                        <TouchableOpacity 
                          style={{
                            backgroundColor: '#e74c3c',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 5,
                          }} 
                          onPress={() => handleDeleteStaff(member.id, member.fullName)}
                        >
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Revoke Access</Text>
                        </TouchableOpacity>
                      </View>
                    )}
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

  if (screen === 'support_center') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>SaaS Support Center</Text>
            <Text style={styles.subtitle}>Open a ticket with the Platform Super-Admins</Text>

            <View style={{ width: '100%', marginTop: 20, paddingHorizontal: 5 }}>
              <Text style={{ color: '#3498db', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                Describe Your Issue:
              </Text>
              
              <TextInput
                style={[styles.input, { 
                  height: 120, 
                  textAlignVertical: 'top', 
                  paddingTop: 12,
                  backgroundColor: '#161624',
                  borderColor: '#2E2E4A',
                  color: '#fff'
                }]}
                placeholder="Ex: I accidentally deleted John Doe (john@company.com). Please clear their authentication profile token so I can re-register them."
                placeholderTextColor="#555"
                multiline={true}
                numberOfLines={6}
                value={ticketText}
                onChangeText={setTicketText}
              />

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#3498db', marginTop: 15 }]} 
                onPress={handleSubmitTicket}
              >
                <Text style={styles.buttonText}>Submit Support Ticket</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.button, { marginTop: 40, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3498db' }]} 
              onPress={() => { setTicketText(''); setScreen('dashboard'); }}
            >
              <Text style={[styles.buttonText, { color: '#3498db' }]}>Cancel & Return</Text>
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
                
                {/* 🪨 STEP 1: SELECT CORE ORE GROUP */}
                <Text style={{ color: '#c8d4e6', marginBottom: 5, fontSize: 13, fontWeight: '600', alignSelf: 'flex-start', marginLeft: '5%' }}>Select Ore Group:</Text>
                <select 
                  value={selectedGroup} 
                  onChange={(e) => {
                    const group = e.target.value;
                    setSelectedGroup(group);
                    // Automatically set the second dropdown to the first item of the new group
                    setSelectedOre(ORE_DATABASE[group][0]);
                  }}
                  style={{
                    width: '90%',
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#232931',
                    color: '#fff',
                    border: '1px solid #333',
                    marginBottom: 15,
                    fontSize: 14,
                    outline: 'none'
                  }}
                >
                  <option value="SULFIDES">Sulfides</option>
                  <option value="OXIDES">Oxides</option>
                  <option value="NATIVE">Native Elements</option>
                  <option value="CARBONATES">Carbonates</option>
                </select>

                {/* 🔬 STEP 2: DYNAMIC SPECIFIC ORE SELECTOR */}
                <Text style={{ color: '#c8d4e6', marginBottom: 5, fontSize: 13, fontWeight: '600', alignSelf: 'flex-start', marginLeft: '5%' }}>Select Specific Ore / Classification:</Text>
                <select 
                  value={selectedOre} 
                  onChange={(e) => setSelectedOre(e.target.value)}
                  style={{
                    width: '90%',
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#232931',
                    color: '#fff',
                    border: '1px solid #333',
                    marginBottom: 20,
                    fontSize: 14,
                    outline: 'none'
                  }}
                >
                  {/* Loop through the specific group dynamically */}
                  {ORE_DATABASE[selectedGroup].map((ore, index) => (
                    <option key={index} value={ore}>{ore}</option>
                  ))}
                </select>

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
  {/* 👇 Using a clean fallback check to make sure React watches the live array state */}
  {!loggedSamples || loggedSamples.length === 0 ? (
    <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
      No samples found in local memory pool yet.
    </Text>
  ) : (
    loggedSamples.map((item) => (
      <View key={item.id} style={[{ backgroundColor: '#2e4053', padding: 15, marginBottom: 10, borderRadius: 8 }]}>
        {/* 📋 Render checking: standardizing fallback text values */}
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          Batch ID: {item.sampleId || "UNKNOWN_ID"}
        </Text>
        <Text style={{ color: '#3498db', fontSize: 14, marginTop: 4 }}>
          Ore Matrix: {item.oreType || "Not Specified"}
        </Text>
        <Text style={{ color: '#c8d4e6', fontSize: 13 }}>
          Mass: {item.initialWeight || 0} kg
        </Text>
        <Text style={{ 
          color: item.status === 'Completed' ? '#2ecc71' : '#e67e22', 
          fontSize: 12, 
          fontWeight: 'bold', 
          marginTop: 6 
        }}>
          Status Pipeline: {item.status || "Pending Analysis"}
        </Text>
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

  // --- 🏭 FURNACE OPERATOR: CHOOSE APPROVED BATCH ---
  if (screen === 'view_approved_melts') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Certified Melt Queue</Text>
            <Text style={styles.subtitle}>Select an Approved Ore Batch to Smelt</Text>

            <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
              {/* 🟢 FIXED: Checking furnaceLogs here instead of approvedSamples */}
              {furnaceLogs.length === 0 ? (
                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
                  📭 No certified assay batches are currently waiting to be melted.
                </Text>
              ) : (
                /* 🟢 FIXED: Mapping furnaceLogs here instead of approvedSamples */
                furnaceLogs.map((sample) => (
                  <View key={sample.id} style={[styles.roleBox, { borderColor: '#2ecc71', borderWidth: 1, marginBottom: 10, padding: 15 }]}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                      Sample ID: {sample.sampleId || sample.displayId}
                    </Text>
                    <Text style={{ color: '#c8d4e6', fontSize: 14, marginTop: 4 }}>
                      Ore Type: {sample.oreType} | Certified Purity: {sample.purityGrade}
                    </Text>
                    
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#e67e22', marginTop: 10 }]} 
                      onPress={() => {
                        // Save the selected sample's details into your states
                        setMeltId(sample.id); // Firestore Doc ID
                        setFurnaceTemp(sample.currentTemperature?.toString() || '');
                        setCycleDuration(sample.cycleDurationTime || '');
                        setScreen('log_melt_cycle');
                      }}
                    >
                      <Text style={styles.buttonText}>🔥 Initialize Melt Cycle</Text>
                    </TouchableOpacity>
                  </View>
                ))
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

if (screen === 'log_melt_cycle' && selectedMeltSample) {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Furnace Control Room</Text>
          <Text style={styles.subtitle}>Melt ID: {selectedMeltSample.sampleId}</Text>

          {/* 🌡️ Dynamic Temperature Inputs */}
          <View style={styles.roleBox}>
            <Text style={styles.roleTitle}>Update Telemetry Log</Text>
            
            <TextInput
              style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5, marginBottom: 10 }}
              placeholder="Enter Current Temperature (°C)"
              keyboardType="numeric"
              value={currentTempInput}
              onChangeText={setCurrentTempInput}
            />
            <TextInput
              style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5, marginBottom: 10 }}
              placeholder="Cycle Duration/Time Elapsed (e.g., 45 mins)"
              value={cycleDurationInput}
              onChangeText={setCycleDurationInput}
            />

            <TouchableOpacity style={[styles.button, { backgroundColor: '#e67e22' }]} onPress={updateFurnaceTelemetry}>
              <Text style={styles.buttonText}>📈 Submit Telemetry Update</Text>
            </TouchableOpacity>
          </View>

          {/* 📊 Live Historical Log Display */}
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 15, alignSelf: 'flex-start' }}>
            Historical Melt Logs:
          </Text>
          <ScrollView style={{ flex: 1, width: '100%', marginTop: 5, marginBottom: 15 }}>
            {(!selectedMeltSample.temperatureLogs || selectedMeltSample.temperatureLogs.length === 0) ? (
              <Text style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No heat metrics logged yet for this cycle.</Text>
            ) : (
              selectedMeltSample.temperatureLogs.map((log, index) => (
                <View key={index} style={{ backgroundColor: '#2e4053', padding: 10, borderRadius: 5, marginBottom: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 14 }}>
                    🔥 **{log.temperature}°C** at {log.durationSoFar}
                  </Text>
                  <Text style={{ color: '#bdc3c7', fontSize: 11 }}>
                    Timestamp: {new Date(log.loggedAt).toLocaleTimeString()}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={() => setScreen('view_approved_melts')}>
            <Text style={styles.buttonText}>Return to Queue</Text>
          </TouchableOpacity>
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

  
  // --- 🧪 METALLURGIST ACTIVE ASSAY QUEUE SCREEN ---
  if (screen === 'analysis_queue') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Assay Queue</Text>
            <Text style={styles.subtitle}>Pending Quality Analysis</Text>

            {/* IF A SAMPLE IS SELECTED FOR EVALUATION, SHOW PROCESSING PORTAL */}
            {selectedSample ? (
              <View style={styles.roleBox}>
                <Text style={[styles.roleTitle, { color: '#e67e22' }]}>Evaluating Batch: {selectedSample.sampleId}</Text>
                <Text style={{ color: '#fff', marginBottom: 5 }}>Ore Matrix: {selectedSample.oreType}</Text>
                <Text style={{ color: '#fff', marginBottom: 15 }}>Input Mass: {selectedSample.initialWeight} kg</Text>
                
                {/* 🟢 SECTION A: APPROVAL INPUT */}
                <Text style={{ color: '#2ecc71', fontWeight: 'bold', marginBottom: 5 }}>Option 1: Enter Certified Purity Grade to Approve:</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g., 94.2% Au or Grade A" 
                  value={gradePurity} 
                  onChangeText={(text) => {
                    setGradePurity(text);
                    if(text) setRejectionReason(''); // Clear rejection if typing purity
                  }}
                  placeholderTextColor="#888"
                />

                <TouchableOpacity 
                  style={[styles.roleButton, { backgroundColor: '#2ecc71', marginTop: 5, marginBottom: 15 }]} 
                  onPress={() => submitAssayResults(selectedSample.id, 'Approved')}
                >
                  <Text style={styles.buttonText}>🔒 Seal & Certify Assay</Text>
                </TouchableOpacity>

                <View style={{ height: 1, backgroundColor: '#444', marginVertical: 10 }} />

                {/* 🔴 SECTION B: DECLINE INPUT */}
                <Text style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: 5 }}>Option 2: Provide Reason to Decline Batch:</Text>
                <TextInput 
                  style={[styles.input, { borderColor: '#e74c3c' }]} 
                  placeholder="e.g., High silica contamination, unprofitable" 
                  value={rejectionReason} 
                  onChangeText={(text) => {
                    setRejectionReason(text);
                    if(text) setGradePurity(''); // Clear purity if typing rejection
                  }}
                  placeholderTextColor="#888"
                />

                <TouchableOpacity 
                  style={[styles.roleButton, { backgroundColor: '#e74c3c', marginTop: 5 }]} 
                  onPress={() => submitAssayResults(selectedSample.id, 'Declined')}
                >
                  <Text style={styles.buttonText}>❌ Decline Batch</Text>
                </TouchableOpacity>

                {/* CANCEL WINDOW CLOSER */}
                <TouchableOpacity 
                  style={[styles.roleButton, { backgroundColor: '#7f8c8d', marginTop: 15 }]} 
                  onPress={() => { setSelectedSample(null); setGradePurity(''); setRejectionReason(''); }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* OTHERWISE, SHOW THE LIST OF PENDING SAMPLES */
              <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
                {pendingSamples.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16, marginTop: 20 }}>
                      ✅ All samples certified. Queue is clear!
                    </Text>
                  </View>
                ) : (
                  pendingSamples.map((sample) => (
                    <View key={sample.id} style={[styles.roleBox, { padding: 15, marginBottom: 10 }]}>
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Sample: {sample.sampleId}</Text>
                      <Text style={{ color: '#c8d4e6', fontSize: 14, marginTop: 4 }}>Type: {sample.oreType} | Mass: {sample.initialWeight}kg</Text>
                      <Text style={{ color: '#e67e22', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>⚠️ Status: {sample.status}</Text>
                      
                      <TouchableOpacity 
                        style={[styles.roleButton, { backgroundColor: '#3498db', marginTop: 12, paddingVertical: 8 }]} 
                        onPress={() => setSelectedSample(sample)}
                      >
                        <Text style={styles.buttonText}>🔬 Run Chemical Analysis</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.button} onPress={() => setScreen('metallurgist_dashboard')}>
              <Text style={styles.buttonText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  // --- 📜 METALLURGIST ASSAY HISTORY SCREEN ---
  if (screen === 'assay_history') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Assay History</Text>
            <Text style={styles.subtitle}>Certified Lab Records</Text>

            <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
              {assayHistory.length === 0 ? (
                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No certified records found yet.</Text>
              ) : (
                assayHistory.map((item) => {
                  const isDeclined = item.status === 'Declined';
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
                          borderLeftColor: isDeclined ? '#e74c3c' : '#2ecc71' 
                        }
                      ]}
                    >
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Batch: {item.sampleId}</Text>
                      
                      {isDeclined ? (
                        <View style={{ marginTop: 4 }}>
                          <Text style={{ color: '#e74c3c', fontSize: 15, fontWeight: 'bold' }}>❌ Status: Declined</Text>
                          <Text style={{ color: '#ff9ff3', fontSize: 14, fontStyle: 'italic', marginTop: 2 }}>
                            Reason: "{item.rejectionReason || 'No reason provided'}"
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#2ecc71', fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
                          💎 Certified Purity: {item.purityGrade || item.purity}
                        </Text>
                      )}

                      <Text style={{ color: '#c8d4e6', fontSize: 13, marginTop: 6 }}>
                        📦 Ore: {item.oreType} | ⚖️ Mass: {item.initialWeight}kg
                      </Text>
                      <Text style={{ color: '#7f8c8d', fontSize: 11, marginTop: 6 }}>
                        🔬 Inspected By: {item.certifiedBy || 'Certified Metallurgist'}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={() => setScreen('metallurgist_dashboard')}>
              <Text style={styles.buttonText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  // --- 📋 LAB TECHNICIAN SAMPLE VIEW PORTAL ---
  if (screen === 'view_samples') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Sample Registry</Text>
            <Text style={styles.subtitle}>Master Ore Logging & Assay Tracking</Text>

            <ScrollView style={{ flex: 1, width: '100%', marginBottom: 15 }} showsVerticalScrollIndicator={false}>
              {loggedSamples.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16, marginTop: 20 }}>
                    📭 No registered samples found in the laboratory ledger.
                  </Text>
                </View>
              ) : (
                loggedSamples.map((sample) => {
                  // Determine status style badges dynamically based on metallurgical outcomes
                  let statusColor = '#e67e22'; // Default Orange for Pending Analysis
                  let statusLabel = '⚠️ PENDING ANALYSIS';
                  
                  if (sample.status === 'Approved') {
                    statusColor = '#2ecc71'; // Green for Certified Pass
                    statusLabel = '🟢 ASSAY CERTIFIED';
                  } else if (sample.status === 'Declined') {
                    statusColor = '#e74c3c'; // Red for Declined/Rejected
                    statusLabel = '🔴 BATCH DECLINED';
                  }

                  return (
                    <View 
                      key={sample.id} 
                      style={[
                        styles.roleBox, 
                        { borderColor: statusColor, borderWidth: 1, marginBottom: 10, padding: 15 }
                      ]}
                    >
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                        Batch ID: {sample.sampleId || sample.displayId || "Unknown Lot"}
                      </Text>
                      
                      <Text style={{ color: '#c8d4e6', fontSize: 14, marginTop: 4 }}>
                        Ore Matrix: {sample.oreType} | ⚖️ Initial Mass: {sample.initialWeight} kg
                      </Text>

                      {/* Dynamic Status Display */}
                      <Text style={{ color: statusColor, fontWeight: 'bold', marginTop: 6, fontSize: 13 }}>
                        {statusLabel}
                      </Text>

                      {/* Display context metrics based on what the metallurgist did */}
                      {sample.status === 'Approved' && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 4, fontWeight: '500' }}>
                          💎 Certified Purity: {sample.purityGrade}
                        </Text>
                      )}
                      
                      {sample.status === 'Declined' && (
                        <Text style={{ color: '#ff8a80', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>
                          ❌ Rejection Reason: {sample.rejectionReason}
                        </Text>
                      )}

                      <Text style={{ color: '#7f8c8d', fontSize: 11, marginTop: 6 }}>
                        Logged By: {sample.loggedBy || "Lab Technician"}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={() => setScreen('lab_technician_dashboard')}>
              <Text style={styles.buttonText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }
  
  // --- MAIN LAYOUT GATE (DASHBOARD, PROFILE, LOGIN) ---
  const userRole = role ? role.toLowerCase().trim() : '';

  // 🛡️ 1. COMPANY ADMINISTRATOR MAIN WORKSPACE
  if (screen === 'dashboard' && userRole === 'admin') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - ADMIN PANEL</Text>
            
            {/* 🌡️ LIVE REAL-TIME FURNACE MONITORING SUB-PANEL */}
            <View style={[styles.roleBox, { borderColor: '#f1c40f', borderWidth: 1, marginBottom: 15 }]}>
              <Text style={{ color: '#f1c40f', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                📡 Live Furnace Telemetry Feed
              </Text>
              
              {furnaceLogs.length === 0 ? (
                <Text style={{ color: '#aaa', fontSize: 13, fontStyle: 'italic' }}>
                  🟢 All smelting systems clear. No active melt cycles currently running.
                </Text>
              ) : (
                furnaceLogs.map((melt) => {
                  const currentTemp = melt.currentTemperature || 0;
                  const maxAllowed = parseFloat(maxFurnaceTemp) || 1200;
                  const isOverheated = currentTemp > maxAllowed;

                  return (
                    <View 
                      key={melt.id} 
                      style={{ 
                        backgroundColor: isOverheated ? '#7b1113' : '#232931', 
                        padding: 10, 
                        borderRadius: 6, 
                        marginTop: 5,
                        borderColor: isOverheated ? '#e74c3c' : 'transparent',
                        borderWidth: 1
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                          ID: {melt.sampleId || "Active Melt"}
                        </Text>
                        <Text style={{ color: isOverheated ? '#ff8d8f' : '#2ecc71', fontWeight: 'bold', fontSize: 13 }}>
                          {currentTemp}°C / {maxAllowed}°C Limit
                        </Text>
                      </View>
                      
                      {isOverheated && (
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' }}>
                          ⚠️ Critical Exceedance! Structural Breach Risk. Deactivate system immediately.
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>Admin Controls</Text>
              
              <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('signup')}>
                <Text style={styles.buttonText}>Register New Staff</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} onPress={fetchStaffDirectory}>
                <Text style={styles.buttonText}>📋 View Active Staff Directory</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#e67e22', marginTop: 10 }]} onPress={() => setScreen('system_settings')}>
                <Text style={styles.buttonText}>⚙️ Manage System Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleButton, { backgroundColor: '#2E2E4A', marginTop: 10 }]} 
                onPress={() => setScreen('support_center')}
              >
                <Text style={styles.buttonText}>🎫 Contact Platform Support</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b', marginTop: 10}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }
  
  // 🧪 2. LAB TECHNICIAN MAIN WORKSPACE
  if (screen === 'lab_technician_dashboard' || (screen === 'dashboard' && userRole === 'lab technician')) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - TECHNICIAN</Text>

            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>Technician Portal</Text>
              <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('log_sample')}>
                <Text style={styles.buttonText}>🧪 Log New Mineral Sample</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} onPress={() => fetchMineralSamples(companyName, true)} 
>
                <Text style={styles.buttonText}>📋 View Logged Samples</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  // 🌋 3. FURNACE OPERATOR MAIN WORKSPACE
  if (screen === 'furnace_operator_dashboard' || (screen === 'dashboard' && userRole === 'furnace operator')) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - FURNACE OPERATIONS</Text>

            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>Furnace Operations</Text>
              
              {/* 🟢 Keep this: It pulls the verified queue from the metallurgist */}
              <TouchableOpacity style={styles.roleButton} onPress={fetchApprovedMeltQueue}>
                <Text style={styles.buttonText}>📋 View Certified Batches for Melting</Text>
              </TouchableOpacity>

              {/* 🟢 Keep this: For viewing active furnace cycles */}
              <TouchableOpacity style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} onPress={fetchFurnaceOperations}>
                <Text style={styles.buttonText}>📊 Monitor Furnace Status</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  // 🔬 4. METALLURGIST QUALITY WORKSPACE
  if (screen === 'metallurgist_dashboard' || (screen === 'dashboard' && userRole === 'metallurgist')) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <Text style={styles.title}>EM-Lab</Text>
            <Text style={styles.subtitle}>{companyName} - METALLURGIST</Text>

            <View style={styles.roleBox}>
              <Text style={styles.roleTitle}>Quality Assurance & Analysis</Text>
              <TouchableOpacity style={styles.roleButton} onPress={fetchSamplesForAnalysis}>
                <Text style={styles.buttonText}>🧪 Analyze Pending Samples</Text>
              </TouchableOpacity>
              <TouchableOpacity 
  style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} 
  onPress={fetchAssayHistory} // 👈 Fiers the data fetcher now!
>
  <Text style={styles.buttonText}>📜 View Assay History</Text>
</TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.roleButton} onPress={() => setScreen('profile')}>
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, {backgroundColor: '#c0392b'}]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  // 👤 5. UNIFORM PROFILE INTERFACE
  if (screen === 'profile') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
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
            <TouchableOpacity style={styles.button} onPress={() => {
              if (userRole === 'admin') setScreen('dashboard');
              else if (userRole === 'lab technician') setScreen('lab_technician_dashboard');
              else if (userRole === 'furnace operator') setScreen('furnace_operator_dashboard');
              else if (userRole === 'metallurgist') setScreen('metallurgist_dashboard');
            }}>
              <Text style={styles.buttonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  // 🔑 6. BASELINE CATCH-ALL DEFAULT INTERFACE (FALLBACK TO LOGIN IF NO ROLE ACTIVE)
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}> 
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>EM-Lab</Text>
          <Text style={styles.subtitle}>Electronics & Metallurgy Lab</Text>
          
          {/* 📬 UPDATED EMAIL FIELD WITH AUTOFILL SHIELD */}
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
            placeholderTextColor="#888" 
            keyboardType="email-address"
            autoComplete="off"              // Blocks standard web pre-filling loops
            importantForAutofill="no"       // Directs mobile operating systems to bypass
            textContentType="none"          // Drops native iOS credential suggestion trays
          />
          
          {/* 🔑 UPDATED PASSWORD FIELD WITH AUTOFILL SHIELD */}
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry={true} 
            placeholderTextColor="#888" 
            autoComplete="new-password"     // Tricks browser scanners into skipping autofill matching
            importantForAutofill="no"       // Drops mobile device hardware profile caching
            textContentType="none"          // Prevents system password overlay popups
          />
          
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