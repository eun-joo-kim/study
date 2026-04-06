import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBvZqj4o40KFoV6Ohp02UhllZEUL6H4GiQ",
  authDomain: "memo-app-c1219.firebaseapp.com",
  projectId: "memo-app-c1219",
  storageBucket: "memo-app-c1219.firebasestorage.app",
  messagingSenderId: "268661571928",
  appId: "1:268661571928:web:5398c8ae86224d0cc8a52d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Sign in anonymously on app load
export const initializeAuth = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log('Anonymous user signed in');
    }
  } catch (error) {
    console.error('Error signing in anonymously:', error);
  }
};
