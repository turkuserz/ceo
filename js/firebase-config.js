import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCV0wMsXqqptmgBvcYSXowmQ6ah0_LsBHA",
  authDomain: "stanbastienx.firebaseapp.com",
  databaseURL: "https://stanbastienx-default-rtdb.firebaseio.com",
  projectId: "stanbastienx",
  storageBucket: "stanbastienx.firebasestorage.app",
  messagingSenderId: "217347809451",
  appId: "1:217347809451:web:04b9d09350f92d070117ee",
  measurementId: "G-TSC7S5B8XJ"
};

export const GROUPS = ["BASTIEN", "EVELYN", "STANNOWAYHOME", "JOPNOK", "ASSASSIN"];

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
