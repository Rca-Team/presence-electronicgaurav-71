
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBRNd3qMSYy4J6GnRajnM7sQPqKMmtOSRI",
  authDomain: "face-attendance-ed516.firebaseapp.com",
  databaseURL: "https://face-attendance-ed516-default-rtdb.firebaseio.com",
  projectId: "face-attendance-ed516",
  storageBucket: "face-attendance-ed516.appspot.com",
  messagingSenderId: "823123600366",
  appId: "1:823123600366:web:6eaac2a3fa8cf9429dca85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
