import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { normalizeCompany } from '../utils/constants';

// --- STAFF API ---
export const getStaffList = async (companyName) => {
  const q = query(collection(db, "users"), where("company", "==", normalizeCompany(companyName)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteStaffMember = async (staffId) => {
  return await deleteDoc(doc(db, "users", staffId));
};

// --- SAMPLES API ---
export const fetchMineralSamples = async (companyName) => {
  const q = query(collection(db, "mineral_samples"), where("company", "==", normalizeCompany(companyName)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const logMineralSample = async (sampleData) => {
  const docRef = doc(db, "mineral_samples", sampleData.sampleId);
  return await setDoc(docRef, sampleData);
};