// frontend/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhfL7GJ7VhD5WWFLoEX9yw1pD21RezJ4E",
  authDomain: "virtualdj-336e7.firebaseapp.com",
  projectId: "virtualdj-336e7",
  storageBucket: "virtualdj-336e7.firebasestorage.app",
  messagingSenderId: "193757097019",
  appId: "1:193757097019:web:fe3cea4595f97334ea001e"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const signOut = () => {
  return auth.signOut();
};

// This is a listener to check auth state
export const authStateObserver = (callback) => {
  return onAuthStateChanged(auth, callback);
};