//src/api/ auth.js

import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  sendPasswordResetEmail, 
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  signOut,
  deleteUser
} from "firebase/auth";

import { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs, addDoc, updateDoc, serverTimestamp, deleteDoc, arrayUnion } from "firebase/firestore";

// 1. LOGIN
export const loginUser = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// 2. FETCH PROFILE (The routing logic you showed me)
export const fetchUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? userDoc.data() : null;
};

// 3. REGISTER STAFF (The complex one you have)
export const registerStaff = async (email, password, fullName, role, company) => {
  // Use your logic here for creating the user, setting the doc, etc.
  // ... your existing code logic ...
};

// 4. FORGOT PASSWORD
export const resetPassword = async (email) => {
  return await sendPasswordResetEmail(auth, email);
};

// 5. CHANGE PASSWORD
export const changePassword = async (currentPass, newPass) => {
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, cred);
  return await updatePassword(user, newPass);
};