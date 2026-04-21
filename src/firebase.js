import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9t_9BztBiDoeVyWFgmvq4EsJTFgVOh0o",
  authDomain: "snakegame-d964d.firebaseapp.com",
  databaseURL: "https://snakegame-d964d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "snakegame-d964d",
  storageBucket: "snakegame-d964d.firebasestorage.app",
  messagingSenderId: "274917293375",
  appId: "1:274917293375:web:958eaa6785999c96de278a",
  measurementId: "G-VR7XWMMFXC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);
