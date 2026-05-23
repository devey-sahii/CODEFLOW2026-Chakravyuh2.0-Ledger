// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCu-jk1ju9P4eA3OJ7K_vo_tycZDcT3tQg",
  authDomain: "ledger-a57c3.firebaseapp.com",
  projectId: "ledger-a57c3",
  storageBucket: "ledger-a57c3.firebasestorage.app",
  messagingSenderId: "885278988764",
  appId: "1:885278988764:web:907b214dd20bad5eca5719",
  measurementId: "G-6V83FZQ3HM"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

