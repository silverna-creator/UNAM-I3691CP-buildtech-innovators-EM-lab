import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, firebaseConfig } from './src/config/firebaseConfig'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser, signOut, getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { getDoc, doc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, getDocs, arrayUnion, serverTimestamp, onSnapshot } from 'firebase/firestore'
import LaboratoryLockdownScreen from './src/components/LaboratoryLockdownScreen';
import LoginScreen from './screens/Auth/LoginScreen';
import CodeCrashBoundary from './src/components/CodeCrashBoundary';
import LogSampleScreen from './screens/LabTechnician/LogSampleScreen';
import ViewSampleScreen from './screens/LabTechnician/ViewSamplesScreen';
import StaffDirectoryScreen from './screens/Admin/StaffDirectoryScreen';
import MeltControlScreen from './screens/Furnace/LogMeltCycleScreen';
import FurnaceQueueScreen from './screens/Furnace/ViewApprovedMeltsScreen';
import AssayHistoryScreen from './screens/Metallurgist/AssayHistoryScreen';
import AnalysisQueueScreen from './screens/Metallurgist/AnalysisQueueScreen';
import SignupScreen from './screens/Auth/SignupScreen';
import SupportCenterScreen from './screens/Admin/SupportCenterScreen';
import SampleDirectoryScreen from './screens/LabTechnician/SampleDirectoryScreen';
import SystemSettingsScreen from './screens/Admin/SystemSettingsScreen';
import FurnaceDirectoryScreen from './screens/Furnace/FurnaceDirectoryScreen';
import AdminDashboard from './screens/Admin/AdminDashboard';
import LabTechnicianDashboard from './screens/LabTechnician/LabTechnicianDashboard';
import FurnaceOperatorDashboard from './screens/Furnace/FurnaceOperatorDashboard';
import MetallurgistDashboard from './screens/Metallurgist/MetallurgistDashboard';
import ProfileScreen from './screens/Auth/ProfileScreen';
import { styles } from './src/styles/globalStyles';

const normalizeCompany = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toUpperCase().replace(/\s+/g, '_');
};

const isAdminRole = (role) => {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return normalized === 'admin' || normalized === 'super_admin' || normalized === 'superadmin';
};

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
  const [isLabActive, setIsLabActive] = useState(false);

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

  const [moistureValue, setMoistureValue] = useState('');
  const [flotationValue, setFlotationValue] = useState('');

  const [selectedMeltSample, setSelectedMeltSample] = useState(null);
  const [currentTempInput, setCurrentTempInput] = useState('');
  const [cycleDurationInput, setCycleDurationInput] = useState('');

  const [notifications, setNotifications] = useState([]);


 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
    if (authenticatedUser) {
      setUser(authenticatedUser);
      setIsReady(true); 

      try {
        // 🔒 1. FETCH GLOBAL LOCKDOWN STATUS FIRST ON MOUNT/REFRESH
        console.log("DEBUG: Initiating system configuration pull from Firestore...");
        
        let currentLabActive = true; // 🌟 Safely scoped variable initialization

        const statusDoc = await getDoc(doc(db, "system_status", "lab_configuration"));

        if (statusDoc.exists()) {
          const dbData = statusDoc.data();
          console.log("DEBUG: Raw document payload found in Firestore:", dbData);
          console.log("DEBUG: Type of isLabActive field:", typeof dbData.isLabActive);
          
          // 🚩 Force true comparison check in case it's saved as a string or matching alternative key
          currentLabActive = dbData.isLabActive === true || dbData.isLabActive === "true";
          
          console.log("DEBUG: Final parsed state assigned to app:", currentLabActive);
          setIsLabActive(currentLabActive); 
        } else {
          console.warn("DEBUG: Document system_status/lab_configuration does not exist! Defaulting to closed (false).");
          currentLabActive = false; // Sync local routing logic fallback
          setIsLabActive(false); 
        }

        // 👤 2. FETCH USER PROFILE DETAILS
        const userDoc = await getDoc(doc(db, "users", authenticatedUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFullName(userData.fullName || "");
          
          const userRole = userData.role ? userData.role.toLowerCase().trim() : "";
          setRole(userData.role ? userData.role.trim() : "");
          
          // 🛡️ DYNAMIC MULTI-TENANT VERIFICATION
          if (!userData.company || userData.company.trim() === "") {
            console.error("❌ TENANT ISOLATION BREACH: User profile has no company assignment.");
            const companyError = "Account configuration error: No company portfolio assigned to this profile. Contact your system administrator.";
            Platform.OS === 'web' ? alert(companyError) : Alert.alert("Profile Error", companyError);
            setScreen('login');
            return;
          }

          const userCompany = normalizeCompany(userData.company);
          setCompanyName(userCompany);
          
          // 🚦 3. THE SMART ROUTER GATEWAY (WITH REFRESH DEFENSE)
          if (isAdminRole(userData.role)) {
            setScreen('dashboard'); 
            fetchLiveFurnaceTelemetry(userCompany);
          } else {
            // If the lab is locked down in the database, lock them down immediately on refresh!
            if (!currentLabActive) {
              setScreen('lockdown_block');
            } else if (userRole === 'lab_manager' || userRole === 'lab technician') {
              console.log(`Routing ${userData.fullName} to Lab Technician Portal...`);
              setScreen('lab_technician_dashboard'); 
              fetchMineralSamples(userCompany);
            } else if (userRole === 'furnace operator') {
              setScreen('furnace_operator_dashboard');
              fetchApprovedMeltQueue(userCompany);
            } else if (userRole === 'metallurgist') {
              console.log("Routing to Metallurgist Portal, pulling queue files...");
              setScreen('metallurgist_dashboard'); 
            } else {
              setScreen('login');
            }
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

useEffect(() => {
  // Only run the listener when a non-admin user is logged in
  if (!user) return;

  const isAdmin = role ? isAdminRole(role) : false;
  if (isAdmin) return; // Admins are never locked out

  const docRef = doc(db, "system_status", "lab_configuration");

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const labActive = data.isLabActive === true || data.isLabActive === "true";
      setIsLabActive(labActive);

      // 🔒 If lab just went inactive and user is inside the app — lock them out immediately
      if (!labActive && screen !== 'lockdown_block' && screen !== 'login') {
        console.log("🔒 Lab lockdown detected — redirecting non-admin user.");
        setScreen('lockdown_block');
      }

      // 🟢 If lab came back online and user is on lockdown screen — release them
      if (labActive && screen === 'lockdown_block') {
        console.log("🟢 Lab reactivated — releasing lockdown.");
        setScreen('login'); // Send back to login to re-authenticate cleanly
      }
    }
  });

  return () => unsubscribe(); // Cleanup on logout or unmount
}, [user, role, screen]);

useEffect(() => {
  if (!user || !role || !companyName) return;

  fetchNotifications(); // fetch immediately on login
  const interval = setInterval(() => {
    fetchNotifications();
  }, 15000);

  return () => clearInterval(interval);
}, [user, role, companyName]);


const userRole = role ? role.toLowerCase().trim() : '';

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
        const normalizedCompany = normalizeCompany(userData.company);
        if (normalizedCompany) setCompanyName(normalizedCompany);
        if (userData.role) setRole(userData.role);

        // Normalize the role text for safe string checking
        const cleanRole = userData.role ? userData.role.toLowerCase().trim() : '';
        console.log("LOGGED IN USER PROFILE DETECTED:", userData);

        // 4. ROUTING TERMINALS: Direct routing based on exact role strings
        if (isAdminRole(userData.role)) {
          setScreen('dashboard');
          fetchLiveFurnaceTelemetry(normalizedCompany);
        } else if (cleanRole === 'lab technician') {
          setScreen('lab_technician_dashboard');
          fetchMineralSamples(normalizedCompany);
        } else if (cleanRole === 'furnace operator') {
          setScreen('furnace_operator_dashboard');
          fetchApprovedMeltQueue(normalizedCompany);
        } else if (cleanRole === 'metallurgist') {
          setScreen('metallurgist_dashboard');
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
    setSelectedMeltSample(null);
    setCurrentTempInput('');
    setCycleDurationInput('');
    setScreen('login');
  };

  const handleSignup = async () => {
    const adminUser = auth.currentUser;
    const normalizedCompany = normalizeCompany(regCompany)
      || normalizeCompany(companyName);
    const assignedRole = adminUser
      ? (regRole ? regRole.trim() : '')
      : 'Admin';

    if (!regEmail || !regPassword || !regName || !assignedRole || !normalizedCompany) {
      const msg = adminUser && !normalizeCompany(regCompany) && !normalizeCompany(companyName)
        ? 'Company name is missing from your admin profile. Log out and back in, or enter a company name.'
        : 'Please fill in all fields before submitting registration.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return;
    }

    try {
      let newUserUid;
      let secondaryAuth = null;

      if (adminUser) {
        const secondaryAppName = `SilentApp_${Math.random().toString(36).substring(7)}`;
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, regEmail, regPassword);
        newUserUid = userCredential.user.uid;

        await setDoc(doc(db, "users", newUserUid), {
          fullName: regName,
          company: normalizedCompany,
          role: assignedRole,
          email: regEmail,
          createdAt: new Date().toISOString()
        });

        try {
          await secondaryAuth.signOut();
        } catch (signOutError) {
          console.log("Non-blocking secondary signout clean:", signOutError.message);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
        newUserUid = userCredential.user.uid;

        const companyQuery = query(
          collection(db, "users"),
          where("company", "==", normalizedCompany)
        );
        const querySnapshot = await getDocs(companyQuery);
        const takenByOther = querySnapshot.docs.some((d) => d.id !== newUserUid);
        if (takenByOther) {
          await deleteUser(userCredential.user);
          const msg = "This Company Name is already registered on our network.";
          Platform.OS === 'web' ? alert(msg) : Alert.alert("Name Taken", msg);
          return;
        }

        await setDoc(doc(db, "users", newUserUid), {
          fullName: regName,
          company: normalizedCompany,
          role: assignedRole,
          email: regEmail,
          createdAt: new Date().toISOString()
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

      let errorMsg = `Registration Failed: ${error.message}`;
      if (error.code === 'permission-denied') {
        errorMsg =
          'Registration Failed: Firestore denied this write. Deploy firestore.rules from this project (firebase deploy --only firestore:rules) or update rules in the Firebase Console so admins can create staff profiles.';
      }
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

const handleLockdownExit = async () => {
  try {
    await signOut(auth); // Tell Firebase to log out the current staff session
    setScreen('login');  // Route the UI back to the login screen panel
    setRole('');         // Clear temporary state profile definitions
  } catch (error) {
    console.error("Error signing out from lockdown screen:", error);
  }
};

const fetchSystemSettingsStatus = async () => {
    try {
      const docRef = doc(db, "system_status", "lab_configuration"); // Or wherever your admin saves it
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setIsLabActive(docSnap.data().isLabActive);
        if (docSnap.data().isLabActive) {
          alert("🟢 System cleared! Operations have resumed.");
        } else {
          alert("🔒 System remains locked down by administrative order.");
        }
      }
    } catch (error) {
      console.error("Error refreshing lab status:", error);
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
      const companyTag = normalizeCompany(companyName) || "Unknown Tenant Domain"; 

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
        where("company", "==", normalizeCompany(companyName))
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

    // 1️⃣ CORE VALIDATION CHECK
    if (!sampleId || !sampleId.trim() || !initialWeight || !initialWeight.trim()) {
      const msg = "Please fill in the Sample ID and Initial Weight.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    // 2️⃣ MULTI-TEST VALIDATION CHECK: Ensure they filled in at least one of the new cards
    if ((!moistureValue || !moistureValue.trim()) && (!flotationValue || !flotationValue.trim())) {
      const msg = "Please enter at least one test result (Moisture Content or Flotation Prep) before submitting.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    try {
      let operationalCompany = normalizeCompany(companyName);
      if (!operationalCompany && auth.currentUser?.email) {
        operationalCompany = normalizeCompany(auth.currentUser.email.split('@')[1].split('.')[0]);
      }
      if (!operationalCompany) operationalCompany = 'UNAM';

      console.log(`🔒 SECURE PIPELINE ACTIVE: Logging sample for tenant space [${operationalCompany}]`);

      const cleanCompany = operationalCompany;
      const cleanSampleId = sampleId.trim().toUpperCase();
      
      // 🎯 GENERATE COMPOSITE CUSTOM ID KEY
      const uniqueCompositeId = `${cleanCompany}_${cleanSampleId}`;

      // 🛡️ SANITIZATION LAYER: Force types with zero undefined gaps
      const finalOreType = selectedOre ? selectedOre.toString() : "Not Classified";
      const finalWeight = parseFloat(initialWeight) || 0.0;
      const finalLoggedBy = fullName ? fullName.toString() : "Technician";
      const finalTimestamp = new Date().toISOString();

      // 🧪 PARSE THE NEW INDEPENDENT INPUT CARD VALUES
      // If a field is blank, it saves cleanly as null in Firestore
      const finalMoisture = moistureValue && moistureValue.trim() ? parseFloat(moistureValue) : null;
      const finalFlotation = flotationValue && flotationValue.trim() ? parseFloat(flotationValue) : null;

      // Assemble the final compliant data payload package
      const sampleData = {
        sampleId: uniqueCompositeId, 
        displayId: cleanSampleId,     
        oreType: finalOreType, 
        initialWeight: finalWeight,
        company: cleanCompany, 
        loggedBy: finalLoggedBy,    
        createdAt: finalTimestamp,
        status: "Pending Analysis",
        
        // 💾 SAVING BOTH NEW FEATURE CARD VALUES SEPARATELY
        moistureTestResult: finalMoisture, 
        flotationPrepResult: finalFlotation
      };

      console.log("Writing customized document path directly...", uniqueCompositeId);

      const customDocRef = doc(db, "mineral_samples", uniqueCompositeId);
      const existingDoc = await getDoc(customDocRef);

      if (existingDoc.exists()) {
        const msg = `Sample ID "${cleanSampleId}" already exists in the system. Please use a unique batch code.`;
        Platform.OS === 'web' ? alert(msg) : Alert.alert("Duplicate ID", msg);
        return;
      }

      await setDoc(customDocRef, sampleData);
      
      console.log("Sample stored successfully with Unique ID:", uniqueCompositeId);

      const successMsg = `Sample ${cleanSampleId} logged successfully under secure ID: ${uniqueCompositeId}!`;
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert("Success", successMsg);

      // 🧹 RESET THE INPUTS FOR THE NEXT ENTRY
      setSampleId('');
      setInitialWeight('');
      setSelectedGroup('SULFIDES'); 
      setSelectedOre('');
      setMoistureValue('');  // Clears moisture card
      setFlotationValue(''); // Clears flotation card
      
      // Dynamic refresh on the dashboard component
      fetchMineralSamples(cleanCompany);
       await writeNotification(
  'metallurgist',
  `New sample ${cleanSampleId} has been logged by ${finalLoggedBy} and is ready for analysis.`,
  'new_sample',
  cleanSampleId
);
    } catch (error) {
      console.error("Detailed Error Logging Catch:", JSON.stringify(error, null, 2) || error.message);
      const standardError = `Failed to log sample: ${error?.message || 'Data integrity fault'}`;
      Platform.OS === 'web' ? alert(standardError) : Alert.alert("Error", standardError);
    }

};
  
const fetchMineralSamples = async (passedCompany, shouldSwitchScreen = false) => {
    const activeCompany = normalizeCompany(
      (passedCompany && typeof passedCompany === 'string') ? passedCompany : companyName
    );

    try {
      console.log(`🔍 Fetching company logs from mineral_samples for: [${activeCompany || 'GLOBAL'}]...`);
      const samplesRef = collection(db, "mineral_samples");
      let q;

      // 🛡️ Safe Multi-Tenant Filter Check
      if (activeCompany) {
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
      const cleanMeltId = meltId.trim().toUpperCase();

      // 🔍 MATCHING THE EXACT FIELDS: Search furnaceLogs using displayId or sampleId
      const linkedSample = furnaceLogs.find(sample => 
        (sample.id && sample.id.toUpperCase() === cleanMeltId) ||
        (sample.displayId && sample.displayId.toUpperCase() === cleanMeltId) || 
        (sample.sampleId && sample.sampleId.toUpperCase() === cleanMeltId)
      );

      // Extract the exact field names from your Firestore snapshot structure
      const finalOreType = linkedSample ? (linkedSample.oreType || "Not Classified") : "Not Classified";
      const finalWeight = linkedSample ? (parseFloat(linkedSample.initialWeight) || 0) : 0;
      const finalMoisture = linkedSample && linkedSample.moistureTestResult !== undefined ? linkedSample.moistureTestResult : null;
      const finalFlotation = linkedSample && linkedSample.flotationPrepResult !== undefined ? linkedSample.flotationPrepResult : null;

      const meltData = {
        meltId: cleanMeltId,
        temperature: parseFloat(furnaceTemp),
        durationMinutes: parseInt(cycleDuration),
        company: normalizeCompany(companyName),
        loggedBy: fullName,
        createdAt: new Date().toISOString(),

        // 💾 SAVING WITH YOUR EXACT FIELD VALUES
        oreType: finalOreType,
        initialWeight: finalWeight,
        moistureTestResult: finalMoisture,
        flotationPrepResult: finalFlotation
      };

      await addDoc(collection(db, "furnace_operations"), meltData);
      
      const successMsg = `Melt Cycle ${cleanMeltId} logged successfully!`;
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert("Success", successMsg);
      
      setMeltId('');
      setFurnaceTemp('');
      setCycleDuration('');
      
      if (typeof fetchFurnaceOperations === 'function') fetchFurnaceOperations(); 
    } catch (error) {
      console.error("Error logging melt cycle:", error);
    }
  };

  const fetchFurnaceOpsByCompany = async (company) => {
    const norm = normalizeCompany(company);
    if (!norm) return [];

    const opsRef = collection(db, "furnace_operations");
    const [companySnap, legacySnap] = await Promise.all([
      getDocs(query(opsRef, where("company", "==", norm))),
      getDocs(query(opsRef, where("companyId", "==", norm))),
    ]);

    const byId = new Map();
    companySnap.forEach((d) => byId.set(d.id, { id: d.id, ...d.data() }));
    legacySnap.forEach((d) => {
      if (!byId.has(d.id)) byId.set(d.id, { id: d.id, ...d.data() });
    });
    return Array.from(byId.values());
  };

  // 2. Fetch Historical Melt Runs
  const fetchFurnaceOperations = async () => {
    if (!normalizeCompany(companyName)) return;

    try {
      const logs = await fetchFurnaceOpsByCompany(companyName);
      logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFurnaceLogs(logs);
      setScreen('furnace_directory');
    } catch (error) {
      console.error("Error retrieving furnace operations:", error);
    }
  };

 const fetchApprovedMeltQueue = async (targetCompany) => {
  const cleanCompany = normalizeCompany(
    typeof targetCompany === 'string' ? targetCompany : companyName
  );

  if (!cleanCompany) {
    console.log("Cannot fetch queue: Company profile name is empty.");
    return;
  }

  try {
    const q = query(
      collection(db, "mineral_samples"), 
      // 🟢 CHANGED FROM "companyId" TO "company" TO MATCH YOUR FIRESTORE KEY EXPLICITLY:
      where("company", "==", cleanCompany),
      where("status", "==", "Approved") 
    );
    
    const querySnapshot = await getDocs(q);
    const samples = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      samples.push({
        id: doc.id,
        ...data,
        sampleId: data.sampleId || '',
        displayId: data.displayId || '',
        oreType: data.oreType || 'Unclassified',
        initialWeight: data.initialWeight || 0,
        moistureTestResult: data.moistureTestResult !== undefined ? data.moistureTestResult : null,
        flotationPrepResult: data.flotationPrepResult !== undefined ? data.flotationPrepResult : null
      });
    });
    
    setFurnaceLogs(samples); 
    console.log(`Successfully pulled ${samples.length} approved samples for ${cleanCompany}`);
  } catch (error) {
    console.error("Error fetching approved queue: ", error);
  }
};

const updateFurnaceTelemetry = async () => {
  if (!currentTempInput.trim()) return;

  console.log("🔍 selectedMeltSample.sampleId:", selectedMeltSample.sampleId);
console.log("🔍 selectedMeltSample.displayId:", selectedMeltSample.displayId);
console.log("🔍 selectedMeltSample.id:", selectedMeltSample.id);

  try {
    const docRef = doc(db, "mineral_samples", selectedMeltSample.id);

    const newLogEntry = {
      temperature: parseFloat(currentTempInput),
      loggedAt: new Date().toISOString(),
      durationSoFar: cycleDurationInput || "Not Specified"
    };

    // Update mineral_samples status — preserved exactly as before
    await updateDoc(docRef, {
      temperatureLogs: arrayUnion(newLogEntry),
      currentTemperature: parseFloat(currentTempInput),
      lastFurnaceUpdate: new Date().toISOString(),
      status: "In Melt Cycle"
    });

    // 🔥 Write melt log to furnace_operations (architecture requirement)
    const meltData = {
      meltId: selectedMeltSample.sampleId || selectedMeltSample.displayId,
      temperature: parseFloat(currentTempInput),
      durationMinutes: cycleDurationInput ? parseInt(cycleDurationInput) : 0,
      company: normalizeCompany(companyName),
      loggedBy: fullName,
      createdAt: new Date().toISOString(),
      oreType: selectedMeltSample.oreType || "Not Classified",
      initialWeight: selectedMeltSample.initialWeight || 0,
      moistureTestResult: selectedMeltSample.moistureTestResult !== undefined ? selectedMeltSample.moistureTestResult : null,
      flotationPrepResult: selectedMeltSample.flotationPrepResult !== undefined ? selectedMeltSample.flotationPrepResult : null,
    };
    await addDoc(collection(db, "furnace_operations"), meltData);

    // ✅ Reset both inputs
    setCurrentTempInput('');
    setCycleDurationInput('');

    alert("🔥 Furnace telemetry log updated successfully!");

    await writeNotification(
  'admin',
  `Furnace telemetry update: ${selectedMeltSample.sampleId || selectedMeltSample.displayId} recorded at ${currentTempInput}°C by ${fullName}.`,
  'melt_telemetry',
  selectedMeltSample.sampleId || selectedMeltSample.displayId
);

    // ⏱️ Auto-navigate back to queue after 3 seconds
    setTimeout(() => {
      setSelectedMeltSample(null);
      fetchApprovedMeltQueue(companyName);
      setScreen('view_approved_melts');
    }, 3000);

  } catch (error) {
    console.error("Error writing furnace telemetry:", error);
  }
};

const fetchLiveFurnaceTelemetry = async (company) => {
    try {
      const targetCompany = normalizeCompany(company || companyName);
      if (!targetCompany) return;

      const activeMelts = await fetchFurnaceOpsByCompany(targetCompany);
      setFurnaceLogs(activeMelts);
    } catch (error) {
      console.error("Error fetching live telemetry from furnace_operations:", error);
    }
  };

  const fetchSamplesForAnalysis = async () => {
    setScreen('analysis_queue');
    
    try {
      const activeCompany = normalizeCompany(companyName);
      if (!activeCompany) {
        setPendingSamples([]);
        return;
      }

      console.log(`Fetching pending samples for company: ${activeCompany}`);
      
      const q = query(
        collection(db, "mineral_samples"), 
        where("company", "==", activeCompany),
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

      // App.js — temporary debug line inside submitAssayResults
console.log("🔍 Attempting to update document ID:", sampleIdToUpdate);
console.log("🔍 selectedSample object:", JSON.stringify(selectedSample));

      
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
      
       fetchSamplesForAnalysis();
      fetchMineralSamples(companyName);
    } catch (error) {
      console.error("Error committing assay update:", error);
      const errorMsg = "Write error tracking failed.";
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("Error", errorMsg);
    }

    if (actionType === 'Approved') {
  await writeNotification(
    'lab technician',
    `Sample ${sampleIdToUpdate} has been certified with purity grade ${gradePurity}.`,
    'sample_approved',
    sampleIdToUpdate
  );
  await writeNotification(
    'furnace operator',
    `Sample ${sampleIdToUpdate} has been approved and is ready for melt cycle.`,
    'sample_approved',
    sampleIdToUpdate
  );
} else {
  await writeNotification(
    'lab technician',
    `Sample ${sampleIdToUpdate} has been declined. Reason: ${rejectionReason}.`,
    'sample_declined',
    sampleIdToUpdate
  );
} 
  };
  
  const fetchAssayHistory = async () => {
  setScreen('assay_history');

  try {
    const activeCompany = normalizeCompany(companyName);
    if (!activeCompany) {
      setAssayHistory([]);
      return;
    }

    console.log(`Fetching assay history for company: ${activeCompany}`);
    const q = query(
      collection(db, "mineral_samples"),
      where("company", "==", activeCompany)
    );

    const querySnapshot = await getDocs(q);
    const historyLog = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'Approved' || data.status === 'Declined') { 
        historyLog.push({ id: docSnap.id, ...data });
      }
    });

    setAssayHistory(historyLog);
  } catch (error) {
    console.error("Error pulling historical logs:", error);
  }
};

const handleSaveSettings = async () => {
  try {
    const docRef = doc(db, "system_status", "lab_configuration");
    await updateDoc(docRef, {
      maxTemperatureLimit: parseFloat(maxFurnaceTemp),
      isLabActive: isLabActive,
      lastUpdatedBy: fullName,
      updatedAt: new Date().toISOString()
    });
    const msg = "System settings saved successfully!";
    Platform.OS === 'web' ? alert(msg) : Alert.alert("Success", msg);
    setScreen('dashboard');
  } catch (error) {
    console.error("Error saving settings:", error);
    const msg = `Failed to save settings: ${error.message}`;
    Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
  }
};

const writeNotification = async (recipientRole, message, type, relatedSampleId = '') => {
  try {
    const activeCompany = normalizeCompany(companyName);
    if (!activeCompany) return;

    await addDoc(collection(db, "notifications"), {
      company: activeCompany,
      recipientRole: recipientRole,
      message: message,
      type: type,
      sampleId: relatedSampleId,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error writing notification:", error);
  }
};

const fetchNotifications = async () => {
  try {
    const activeCompany = normalizeCompany(companyName);
    const activeRole = role ? role.toLowerCase().trim() : '';
    if (!activeCompany || !activeRole) return;

    const q = query(
      collection(db, "notifications"),
      where("company", "==", activeCompany),
      where("recipientRole", "==", activeRole),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    const notifList = [];
    querySnapshot.forEach((docSnap) => {
      notifList.push({ id: docSnap.id, ...docSnap.data() });
    });

    setNotifications(notifList);
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

const markNotificationsRead = async () => {
  try {
    // Mark all current notifications as read in Firestore
    const updatePromises = notifications.map((notif) =>
      updateDoc(doc(db, "notifications", notif.id), { read: true })
    );
    await Promise.all(updatePromises);

    // Auto-dismiss — clear from local state immediately
    setNotifications([]);
  } catch (error) {
    console.error("Error marking notifications as read:", error);
  }
};

  return (
  <CodeCrashBoundary>
    <View style={styles.container}>
      
      {/* 1. Loading State */}
      {(!isReady || screen === 'loading') && (
        <View style={styles.container}>
          <Text style={styles.title}>EM-Lab</Text>
          <Text style={styles.subtitle}>Securing Session...</Text>
        </View>
      )}

      {screen === 'lockdown_block' && (
  <LaboratoryLockdownScreen
    onCheckStatus={fetchSystemSettingsStatus}
    onReturnToLogin={handleLockdownExit}
  />
)}

  {screen === 'signup' && (
  <SignupScreen 
    isLoggedIn={!!auth.currentUser}
    regName={regName} setRegName={setRegName}
    regCompany={regCompany} setRegCompany={setRegCompany}
    regRole={regRole} setRegRole={setRegRole}
    regEmail={regEmail} setRegEmail={setRegEmail}
    regPassword={regPassword} setRegPassword={setRegPassword}
    onRegister={handleSignup}
    onBack={() => auth.currentUser ? setScreen('dashboard') : setScreen('login')}
  />
)}

{screen === 'login' && (
  <LoginScreen 
    email={email}
    setEmail={setEmail}
    password={password}
    setPassword={setPassword}
    handleLogin={handleLogin}
    handleForgotPassword={handleForgotPassword}
    setScreen={setScreen}
  />
)}

  {screen === 'support_center' && (
  <SupportCenterScreen 
    ticketText={ticketText}
    setTicketText={setTicketText}
    onSubmit={handleSubmitTicket}
    onCancel={() => { setTicketText(''); setScreen('dashboard'); }}
  />
)}

  {screen === 'log_sample' && (
  <LogSampleScreen 
    sampleId={sampleId} setSampleId={setSampleId}
    initialWeight={initialWeight} setInitialWeight={setInitialWeight}
    selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup}
    selectedOre={selectedOre} setSelectedOre={setSelectedOre}
    moistureValue={moistureValue} setMoistureValue={setMoistureValue}
    flotationValue={flotationValue} setFlotationValue={setFlotationValue}
    onLogSample={logMineralSample} 
    onBack={() => setScreen('lab_technician_dashboard')}
  />
)}

{screen === 'sample_directory' && (
  <SampleDirectoryScreen 
    loggedSamples={loggedSamples} 
    onBack={() => setScreen('lab_technician_dashboard')} 
  />
)}

{screen === 'staff_directory' && (
  <StaffDirectoryScreen 
    staffList={staffList}
    auth={auth}
    onDeleteStaff={handleDeleteStaff}
    onBack={() => setScreen('dashboard')}
  />
)}

  {screen === 'system_settings' && (
  <SystemSettingsScreen 
    maxFurnaceTemp={maxFurnaceTemp}
    setMaxFurnaceTemp={setMaxFurnaceTemp}
    isLabActive={isLabActive}
    setIsLabActive={setIsLabActive}
    onSave={handleSaveSettings} // Move the logic block to a function in App.js
    onCancel={() => setScreen('dashboard')}
  />
)}

  {screen === 'view_approved_melts' && (
  <FurnaceQueueScreen 
    furnaceLogs={furnaceLogs}
    onSelectSample={(sample) => {
      // Move your updateDoc logic here or into a helper function
      setSelectedMeltSample(sample);
      setScreen('log_melt_cycle');
    }}
    onBack={() => setScreen('furnace_operator_dashboard')}
  />
)}

{screen === 'log_melt_cycle' && selectedMeltSample && (
  <MeltControlScreen 
    selectedSample={selectedMeltSample}
    temp={currentTempInput}
    setTemp={setCurrentTempInput}
    duration={cycleDurationInput}
    setDuration={setCycleDurationInput}
    onSubmit={updateFurnaceTelemetry}
    onReturn={() => {
      setSelectedMeltSample(null);
      setScreen('view_approved_melts');
    }}
  />
)}

{screen === 'furnace_directory' && (
  <FurnaceDirectoryScreen 
    furnaceLogs={furnaceLogs}
    maxFurnaceTemp={maxFurnaceTemp}
    onBack={() => setScreen('furnace_operator_dashboard')}
  />
)}
  
  {screen === 'analysis_queue' && (
  <AnalysisQueueScreen 
    pendingSamples={pendingSamples}
    selectedSample={selectedSample}
    setSelectedSample={setSelectedSample}
    gradePurity={gradePurity}
    setGradePurity={setGradePurity}
    rejectionReason={rejectionReason}
    setRejectionReason={setRejectionReason}
    submitAssayResults={submitAssayResults}
    onBack={() => setScreen('metallurgist_dashboard')}
  />
)}

{screen === 'assay_history' && (
  <AssayHistoryScreen 
    assayHistory={assayHistory} 
    onBack={() => setScreen('metallurgist_dashboard')} 
  />
)}

 {screen === 'view_samples' && (
  <ViewSampleScreen 
    loggedSamples={loggedSamples}
    onRefresh={() => fetchMineralSamples(companyName)} // 👈 add this
    onBack={() => setScreen('lab_technician_dashboard')}
  />
)}
  
  {screen === 'dashboard' && isAdminRole(role) && (
  <AdminDashboard 
    companyName={companyName}
    furnaceLogs={furnaceLogs}
    maxFurnaceTemp={maxFurnaceTemp}
    setScreen={setScreen}
    handleLogout={handleLogout}
    fetchStaffDirectory={fetchStaffDirectory}
    notifications={notifications}
    onOpenNotifications={markNotificationsRead}
  />
)}
  
{screen === 'lab_technician_dashboard' && (
  <LabTechnicianDashboard 
    companyName={companyName}
    setScreen={setScreen}
    handleLogout={handleLogout}
    fetchMineralSamples={fetchMineralSamples}
     notifications={notifications}
    onOpenNotifications={markNotificationsRead}
  />
)}

  {screen === 'furnace_operator_dashboard' && (
  <FurnaceOperatorDashboard 
    onNavigate={(nextScreen) => {
      // Handle special data fetching requirements before changing screens
      if (nextScreen === 'view_approved_melts') {
        fetchApprovedMeltQueue(companyName);
      }

      if (nextScreen === 'furnace_directory') {
        fetchFurnaceOperations();
      }

      setScreen(nextScreen);
    }}
    onLogout={handleLogout}
    notifications={notifications}
    onOpenNotifications={markNotificationsRead}
  />
)}

  {screen === 'metallurgist_dashboard' && (
  <MetallurgistDashboard 
    companyName={companyName}
    setScreen={setScreen}
    handleLogout={handleLogout}
    fetchSamplesForAnalysis={fetchSamplesForAnalysis}
    fetchAssayHistory={fetchAssayHistory}
    notifications={notifications}
    onOpenNotifications={markNotificationsRead}
  />
)}


  {screen === 'profile' && (
  <ProfileScreen 
    fullName={fullName}
    role={role}
    companyName={companyName}
    isChangingPassword={isChangingPassword}
    setIsChangingPassword={setIsChangingPassword}
    currentPassword={currentPassword}
    setCurrentPassword={setCurrentPassword}
    newPassword={newPassword}
    setNewPassword={setNewPassword}
    confirmPassword={confirmPassword}
    setConfirmPassword={setConfirmPassword}
    handleInternalPasswordChange={handleInternalPasswordChange}
    onBack={() => {
      // Use your existing logic to send them to the right dashboard
      if (isAdminRole(role)) setScreen('dashboard');
      else if (role.toLowerCase() === 'lab technician') setScreen('lab_technician_dashboard');
      else if (role.toLowerCase() === 'furnace operator') setScreen('furnace_operator_dashboard');
      else if (role.toLowerCase() === 'metallurgist') setScreen('metallurgist_dashboard');
    }}
  />
)}

</View>
  </CodeCrashBoundary>  
);
}

