import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Habi Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWv-iX8z-Qa5QG7xtKq2MHx8u7h37lDm8",
    authDomain: "habi-7a543.firebaseapp.com",
    projectId: "habi-7a543",
    storageBucket: "habi-7a543.firebasestorage.app",
    messagingSenderId: "857628018613",
    appId: "1:857628018613:web:f61d1bd336490500c63bfc",
    measurementId: "G-W5FH1L6TCB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
