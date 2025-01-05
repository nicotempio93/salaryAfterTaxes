// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    // Tu configuración de Firebase aquí
    apiKey: "AIzaSyC3eGZ0TROt440MuodWCrIeTN10iYb2DRM",
    authDomain: "switchmoneydb.firebaseapp.com",
    projectId: "switchmoneydb",
    storageBucket: "switchmoneydb.firebasestorage.app",
    messagingSenderId: "584614795971",
    appId: "1:584614795971:web:0711dc13d23af73b5ea076",
    measurementId: "G-5CBTQSK5SL"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };