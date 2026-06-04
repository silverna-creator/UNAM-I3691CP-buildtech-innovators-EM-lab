import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getStaffList, deleteStaffMember } from './src/api/data';
import LaboratoryLockdownScreen from './src/components/LaboratoryLockdownScreen';
import LogSampleScreen from './src/screens/LogSampleScreen';
import { styles } from './src/styles/globalStyles';
// ==========================================
// 🚨 GLOBAL CRASH BOUNDARY ENGINE
// ==========================================
class CodeCrashBoundary extends React.Component {
  state = { hasError: false, errorInfo: '' };
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) {
    console.log("%c 💥 CRASH ENCOUNTERED: ", "background: red; color: white; font-size: 14px;");
    console.error(error, errorInfo);
    this.setState({ errorInfo: error.toString() });
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 20, backgroundColor: '#1A1A2E', flex: 1, justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Text style={{ color: '#ff4757', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>⚠️ Layout Path Crashed</Text>
          <Text style={{ color: '#f1c40f', backgroundColor: '#111', padding: 15, borderRadius: 5, fontSize: 12, width: '90%' }}>{this.state.errorInfo}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}


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

      // DIRECT SECURE WRITE TO FIRESTORE
      const customDocRef = doc(db, "mineral_samples", uniqueCompositeId);
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
    } catch (error) {
      console.error("Error committing assay update:", error);
      const errorMsg = "Write error tracking failed.";
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("Error", errorMsg);
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
  
  // --- NAVIGATION SCREEN ROUTING TERMINALS ---
  if (!isReady || screen === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EM-Lab</Text>
        <Text style={styles.subtitle}>Securing Session...</Text>
      </View>
    );
  }

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

  if (screen === 'log_melt_cycle') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
          <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>EM-Lab</Text>
                <Text style={styles.subtitle}>Log Melt Cycle Data</Text>

                {/* 🟢 Back to your original clean text input boxes */}
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

  if ((screen === 'furnace_operator_dashboard' || screen === 'view_approved_melts' || screen === 'log_melt_cycle') && !isLabActive) {
    return <LaboratoryLockdownScreen onCheckStatus={fetchSystemSettingsStatus} onReturnToLogin={handleLockdownExit} />;
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
                      Sample ID: {sample.displayId || sample.sampleId}
                    </Text>
                    <Text style={{ color: '#c8d4e6', fontSize: 14, marginTop: 4 }}>
                      Ore Type: {sample.oreType} | Certified Purity: {sample.purityGrade || sample.purity}
                    </Text>
                    
                    {/* 🏭 OPERATIONAL READINGS FOR FURNACE SAFETY MANAGEMENT */}
                    <View style={{ backgroundColor: '#1a1d24', padding: 10, borderRadius: 6, marginTop: 8, marginBottom: 5 }}>
                      <Text style={{ color: '#fff', fontSize: 13 }}>
                        ⚖️ Initial Mass intake: <Text style={{ color: '#3498db', fontWeight: 'bold' }}>{sample.initialWeight || 0} kg</Text>
                      </Text>
                      
                      {sample.moistureTestResult !== undefined && sample.moistureTestResult !== null && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 3 }}>
                          💧 Moisture content: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{sample.moistureTestResult}%</Text>
                        </Text>
                      )}
                      
                      {sample.flotationPrepResult !== undefined && sample.flotationPrepResult !== null && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 3 }}>
                          🧪 Flotation allocation: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{sample.flotationPrepResult} kg</Text>
                        </Text>
                      )}
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#e67e22', marginTop: 10 }]} 
                      onPress={async () => {
                        try {
                          // 1. Instantly update Firestore so it disappears from this queue query
                          const docRef = doc(db, "mineral_samples", sample.id);
                          await updateDoc(docRef, {
                            status: "In Melt Cycle",
                            lastFurnaceUpdate: new Date().toISOString()
                          });

                          setSelectedMeltSample(sample);
                          setMeltId(sample.displayId || sample.id);
                          setFurnaceTemp(sample.currentTemperature?.toString() || '');
                          setCycleDuration(sample.cycleDurationTime || '');
                          setCurrentTempInput('');
                          setCycleDurationInput('');
                          setScreen('log_melt_cycle');

                          // 4. Instantly filter out the selected item locally so it visually drops from the list
                          setFurnaceLogs(prevLogs => prevLogs.filter(log => log.id !== sample.id));

                        } catch (error) {
                          console.error("Error initializing melt cycle status switch:", error);
                          alert("⚠️ Failed to lock batch into furnace pipeline. Try again.");
                        }
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
          <Text style={styles.subtitle}>Batch: {selectedMeltSample.displayId || selectedMeltSample.sampleId}</Text>

          <View style={{ backgroundColor: '#232931', padding: 10, borderRadius: 8, marginBottom: 15, width: '100%' }}>
            <Text style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>LAB TESTING SPECS:</Text>
            <Text style={{ color: '#fff', fontSize: 14 }}>
              Moisture Content: {selectedMeltSample.moistureTestResult != null ? `${selectedMeltSample.moistureTestResult}%` : 'N/A'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>
              Flotation Allocation: {selectedMeltSample.flotationPrepResult != null ? `${selectedMeltSample.flotationPrepResult} kg` : 'N/A'}
            </Text>
          </View>

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

          <TouchableOpacity style={styles.button} onPress={() => {
            setSelectedMeltSample(null);
            setCurrentTempInput('');
            setCycleDurationInput('');
            setScreen('view_approved_melts');
          }}>
            <Text style={styles.buttonText}>Return to Queue</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

{screen === 'furnace_directory' && (
  <FurnaceDirectoryScreen 
    furnaceLogs={furnaceLogs}
    maxFurnaceTemp={maxFurnaceTemp}
    onBack={() => setScreen('furnace_operator_dashboard')}
  />
)}

  if ((screen === 'metallurgist_dashboard') && !isLabActive) {
    return <LaboratoryLockdownScreen onCheckStatus={fetchSystemSettingsStatus} onReturnToLogin={handleLockdownExit} />;
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
                <Text style={[styles.roleTitle, { color: '#e67e22' }]}>Evaluating Batch: {selectedSample.displayId || selectedSample.sampleId}</Text>
                <Text style={{ color: '#fff', marginBottom: 3 }}>Ore Matrix: {selectedSample.oreType}</Text>
                <Text style={{ color: '#fff', marginBottom: 5 }}>Input Mass: {selectedSample.initialWeight} kg</Text>
                
                {/* 🧪 PORTAL STATE: METRICS REVIEW */}
                <View style={{ backgroundColor: '#232931', padding: 10, borderRadius: 8, marginBottom: 15, width: '100%' }}>
                  <Text style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>LAB TESTING SPECS:</Text>
                  <Text style={{ color: '#fff', fontSize: 14 }}>
                    💧 Moisture Content: {selectedSample.moistureTestResult !== undefined && selectedSample.moistureTestResult !== null ? `${selectedSample.moistureTestResult}%` : 'N/A'}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>
                    🧪 Flotation Allocation: {selectedSample.flotationPrepResult !== undefined && selectedSample.flotationPrepResult !== null ? `${selectedSample.flotationPrepResult} kg` : 'N/A'}
                  </Text>
                </View>
                
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
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Sample: {sample.displayId || sample.sampleId}</Text>
                      <Text style={{ color: '#c8d4e6', fontSize: 14, marginTop: 4 }}>Type: {sample.oreType} | Mass: {sample.initialWeight}kg</Text>
                      
                      {/* 🧪 QUEUE LIST STATE: METRICS SUMMARY DISPLAY */}
                      {sample.moistureTestResult !== undefined && sample.moistureTestResult !== null && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 2 }}>
                          💧 Moisture Content: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{sample.moistureTestResult}%</Text>
                        </Text>
                      )}
                      {sample.flotationPrepResult !== undefined && sample.flotationPrepResult !== null && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 2 }}>
                          🧪 Flotation Target: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{sample.flotationPrepResult} kg</Text>
                        </Text>
                      )}

                      <Text style={{ color: '#e67e22', fontSize: 12, fontWeight: 'bold', marginTop: 6 }}>⚠️ Status: {sample.status}</Text>
                      
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

                      {/* 🧪 TRACKING DETAILS: MOISTURE & FLOTATION ENTRIES */}
                      {item.moistureTestResult !== undefined && item.moistureTestResult !== null && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 3 }}>
                          💧 Moisture Content: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{item.moistureTestResult}%</Text>
                        </Text>
                      )}
                      {item.flotationPrepResult !== undefined && item.flotationPrepResult !== null && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 2 }}>
                          🧪 Flotation Target: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{item.flotationPrepResult} kg</Text>
                        </Text>
                      )}

                      <Text style={{ color: '#7f8c8d', fontSize: 11, marginTop: 6, borderTopWidth: 0.5, borderTopColor: '#444', paddingTop: 6 }}>
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
                      key={sample.id || sample.sampleId} 
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

                      {/* 🧪 READ-ONLY LAB ANALYTICS TRACKING */}
                      {sample.moistureTestResult !== undefined && sample.moistureTestResult !== null && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 3 }}>
                          💧 Moisture Content: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{sample.moistureTestResult}%</Text>
                        </Text>
                      )}
                      
                      {sample.flotationPrepResult !== undefined && sample.flotationPrepResult !== null && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 2 }}>
                          🧪 Flotation Target: <Text style={{ color: '#f1c40f', fontWeight: 'bold' }}>{sample.flotationPrepResult} kg</Text>
                        </Text>
                      )}

                      {/* Dynamic Status Display */}
                      <Text style={{ color: statusColor, fontWeight: 'bold', marginTop: 6, fontSize: 13 }}>
                        {statusLabel}
                      </Text>

                      {/* Display context metrics based on what the metallurgist did */}
                      {sample.status === 'Approved' && (
                        <Text style={{ color: '#fff', fontSize: 13, marginTop: 4, fontWeight: '500' }}>
                          💎 Certified Purity: {sample.purityGrade || sample.purity}
                        </Text>
                      )}
                      
                      {sample.status === 'Declined' && (
                        <Text style={{ color: '#ff8a80', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>
                          ❌ Rejection Reason: {sample.rejectionReason}
                        </Text>
                      )}

                      <Text style={{ color: '#7f8c8d', fontSize: 11, marginTop: 6, borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 6 }}>
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
  if (screen === 'dashboard' && isAdminRole(role)) {
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
                  const currentTemp = parseFloat(melt.temperature) || 0;
                  const maxAllowed = parseFloat(maxFurnaceTemp);
                  const isOverheated = !isNaN(maxAllowed) ? currentTemp > maxAllowed : false;

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
              
              <TouchableOpacity style={styles.roleButton} onPress={() => {
                setRegCompany(companyName || '');
                setScreen('signup');
              }}>
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
            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#2e4053', marginTop: 10 }]} 
              onPress={() => fetchMineralSamples(companyName, true)} 
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

  {screen === 'furnace_operator_dashboard' && (
  <FurnaceOperatorDashboard 
    onNavigate={(nextScreen) => {
      // Handle special data fetching requirements before changing screens
      if (nextScreen === 'view_approved_melts') {
        fetchApprovedMeltQueue(companyName);
      }
      setScreen(nextScreen);
    }}
    onLogout={handleLogout}
  />
)}

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
              if (isAdminRole(role)) setScreen('dashboard');
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
    <CodeCrashBoundary>
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
    </CodeCrashBoundary>
  );
}
