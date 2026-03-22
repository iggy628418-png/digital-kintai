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
  APPROVED_RECORDS: 'approved_records',
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
  const records = await getRecordsByEmployee(id);
  const deletePromises = records.map(record => {
    const docId = `${id}_${record.date}`;
    // Try deleting from both potential locations
    const p1 = deleteDoc(doc(db, COLLECTIONS.RECORDS, docId));
    const p2 = deleteDoc(doc(db, COLLECTIONS.APPROVED_RECORDS, docId));
    return Promise.all([p1, p2]);
  });
  await Promise.all(deletePromises);

  // Delete employee doc
  await deleteDoc(doc(db, COLLECTIONS.EMPLOYEES, id));
  return true;
}

// --- Records ---
export async function getRecords() {
  const [q1, q2] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.RECORDS)),
    getDocs(collection(db, COLLECTIONS.APPROVED_RECORDS))
  ]);
  const r1 = q1.docs.map(doc => doc.data());
  const r2 = q2.docs.map(doc => doc.data());
  return [...r1, ...r2];
}

export async function getRecordsByEmployee(employeeId) {
  const [q1, q2] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.RECORDS), where("employeeId", "==", employeeId))),
    getDocs(query(collection(db, COLLECTIONS.APPROVED_RECORDS), where("employeeId", "==", employeeId)))
  ]);
  const r1 = q1.docs.map(doc => doc.data());
  const r2 = q2.docs.map(doc => doc.data());
  return [...r1, ...r2];
}

export async function getRecordByDate(employeeId, date) {
  const docId = `${employeeId}_${date}`;
  // Check both collections
  const [s1, s2] = await Promise.all([
    getDoc(doc(db, COLLECTIONS.RECORDS, docId)),
    getDoc(doc(db, COLLECTIONS.APPROVED_RECORDS, docId))
  ]);
  if (s1.exists()) return s1.data();
  if (s2.exists()) return s2.data();
  return null;
}

export async function upsertRecord(record) {
  const docId = `${record.employeeId}_${record.date}`;
  const collectionName = record.approved ? COLLECTIONS.APPROVED_RECORDS : COLLECTIONS.RECORDS;
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, record, { merge: true });
}

export async function approveRecord(employeeId, date) {
  const docId = `${employeeId}_${date}`;
  const docRef = doc(db, COLLECTIONS.RECORDS, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = { 
      ...docSnap.data(), 
      approved: true, 
      approvedAt: new Date().toISOString() 
    };
    // Move to approved_records
    await setDoc(doc(db, COLLECTIONS.APPROVED_RECORDS, docId), data);
    await deleteDoc(docRef);
  }
  return true;
}

export async function unapproveRecord(employeeId, date) {
  const docId = `${employeeId}_${date}`;
  const docRef = doc(db, COLLECTIONS.APPROVED_RECORDS, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = { 
      ...docSnap.data(), 
      approved: false, 
      approvedAt: null 
    };
    // Move back to records
    await setDoc(doc(db, COLLECTIONS.RECORDS, docId), data);
    await deleteDoc(docRef);
  }
  return true;
}

export async function deleteRecord(employeeId, date) {
  const docId = `${employeeId}_${date}`;
  await Promise.all([
    deleteDoc(doc(db, COLLECTIONS.RECORDS, docId)),
    deleteDoc(doc(db, COLLECTIONS.APPROVED_RECORDS, docId))
  ]);
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
