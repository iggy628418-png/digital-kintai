import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  addDoc,
  deleteDoc
} from "firebase/firestore";

// LocalStorage keys for current user session purely
const KEYS = {
  CURRENT_USER: 'kintai_current_user',
};

// --- Browser Local (Session only) ---
export function getCurrentUser() {
  const raw = localStorage.getItem(KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

// --- Firestore Helpers ---
const COLLECTIONS = {
  EMPLOYEES: 'employees',
  RECORDS: 'records',
  SETTINGS: 'settings',
};

// --- Employees ---
export async function getEmployees() {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addEmployee(name) {
  const docRef = await addDoc(collection(db, COLLECTIONS.EMPLOYEES), {
    name,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, name };
}

export async function findEmployeeByName(name) {
  const q = query(collection(db, COLLECTIONS.EMPLOYEES), where("name", "==", name));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
}

export async function findEmployeeById(id) {
  const docRef = doc(db, COLLECTIONS.EMPLOYEES, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function deleteEmployee(id) {
  // Delete associated records first
  const records = await getRecordsByEmployee(id);
  const deletePromises = records.map(record => {
    const docId = `${id}_${record.date}`;
    return deleteDoc(doc(db, COLLECTIONS.RECORDS, docId));
  });
  await Promise.all(deletePromises);

  // Delete employee doc
  await deleteDoc(doc(db, COLLECTIONS.EMPLOYEES, id));
  return true;
}

// --- Records ---
export async function getRecords() {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.RECORDS));
  return querySnapshot.docs.map(doc => doc.data());
}

export async function getRecordsByEmployee(employeeId) {
  const q = query(collection(db, COLLECTIONS.RECORDS), where("employeeId", "==", employeeId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}

export async function getRecordByDate(employeeId, date) {
  // We use a specific ID to avoid duplicates: "employeeId_date"
  const docId = `${employeeId}_${date}`;
  const docRef = doc(db, COLLECTIONS.RECORDS, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

export async function upsertRecord(record) {
  const docId = `${record.employeeId}_${record.date}`;
  const docRef = doc(db, COLLECTIONS.RECORDS, docId);
  await setDoc(docRef, record, { merge: true });
}

export async function approveRecord(employeeId, date) {
  const docId = `${employeeId}_${date}`;
  const docRef = doc(db, COLLECTIONS.RECORDS, docId);
  await updateDoc(docRef, {
    approved: true,
    approvedAt: new Date().toISOString(),
  });
  return true;
}

export async function unapproveRecord(employeeId, date) {
  const docId = `${employeeId}_${date}`;
  const docRef = doc(db, COLLECTIONS.RECORDS, docId);
  await updateDoc(docRef, {
    approved: false,
    approvedAt: null,
  });
  return true;
}

export async function deleteRecord(employeeId, date) {
  const docId = `${employeeId}_${date}`;
  const docRef = doc(db, COLLECTIONS.RECORDS, docId);
  await deleteDoc(docRef);
  return true;
}

// --- Admin ---
const ADMIN_DOC_ID = 'admin-password';

export async function getAdminPassword() {
  const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, ADMIN_DOC_ID));
  if (docSnap.exists()) {
    return docSnap.data().password;
  }
  return 'admin1234'; // Default
}

export async function setAdminPassword(password) {
  await setDoc(doc(db, COLLECTIONS.SETTINGS, ADMIN_DOC_ID), { password });
}

export async function verifyAdminPassword(input) {
  const actual = await getAdminPassword();
  return input === actual;
}
