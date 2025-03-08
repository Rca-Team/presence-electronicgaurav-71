
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAq-lfnQjNokGX3CuE5U2_kP_YUKUgG5gg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "face-attendance-ed516.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "face-attendance-ed516",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "face-attendance-ed516.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1010141963223",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1010141963223:web:15e9d0eb6afeae646a73e7",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://face-attendance-ed516-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);

export { app, storage, database };
