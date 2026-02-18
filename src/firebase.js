import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Habi Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBsb_pmjOABBu-HXk9Cx6V88r-xmQ0sthw",
    authDomain: "habi-chrisen.firebaseapp.com",
    projectId: "habi-chrisen",
    storageBucket: "habi-chrisen.firebasestorage.app",
    messagingSenderId: "867428199823",
    appId: "1:867428199823:web:364ceb3a328737c4bdaffa",
    measurementId: "G-D8LC8S4Z29"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
