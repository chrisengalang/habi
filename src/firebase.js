import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Habi Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPVzq0VpyutUsT6o8S57_Im4x2rGP_hgM",
    authDomain: "fin-track-chrisen.firebaseapp.com",
    projectId: "fin-track-chrisen",
    storageBucket: "fin-track-chrisen.firebasestorage.app",
    messagingSenderId: "1098298677317",
    appId: "1:1098298677317:web:92c466cbc9cdd009fc2b2c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
