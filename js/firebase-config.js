import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdoALjs11IvuwKiyc5-Hf7cLZApCp6YBA",
  authDomain: "bastien2k26.firebaseapp.com",
  databaseURL: "https://bastien2k26-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bastien2k26",
  storageBucket: "bastien2k26.firebasestorage.app",
  messagingSenderId: "698256376038",
  appId: "1:698256376038:web:5619763ee0e3e901dbbb27",
  measurementId: "G-0H3C4BZQ60"
};

export const GROUPS = ["BASTIEN", "EVELYN", "STANNOWAYHOME", "JOPNOK", "ASSASSIN"];

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
