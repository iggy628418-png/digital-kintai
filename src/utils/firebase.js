import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbmDtuDUu8UoMW7K0uKCIgeFY7EXkDR6k",
  authDomain: "digital-kintai.firebaseapp.com",
  projectId: "digital-kintai",
  storageBucket: "digital-kintai.firebasestorage.app",
  messagingSenderId: "304323604583",
  appId: "1:304323604583:web:bd5b00730aa261ea7024c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
