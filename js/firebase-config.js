import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getDatabase, ref, get, update, set } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCV0wMsXqqptmgBvcYSXowmQ6ah0_LsBHA",
  authDomain: "stanbastienx.firebaseapp.com",
  databaseURL: "https://stanbastienx-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "stanbastienx",
  storageBucket: "stanbastienx.firebasestorage.app",
  messagingSenderId: "217347809451",
  appId: "1:217347809451:web:04b9d09350f92d070117ee",
  measurementId: "G-TSC7S5B8XJ"
};

// Firebase เดิม ใช้เฉพาะสำหรับย้ายข้อมูลเก่ามายังโปรเจกต์ใหม่ครั้งเดียว
const oldFirebaseConfig = {
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

const MIGRATION_PATH = "_migrations/bastien2k26_to_stanbastienx";

async function migrateOldFirebaseOnce() {
  try {
    const marker = await get(ref(db, MIGRATION_PATH));
    if (marker.exists()) return;

    const oldApp = initializeApp(oldFirebaseConfig, "bastien2k26Migration");
    const oldDb = getDatabase(oldApp);
    const snapshot = await get(ref(oldDb));

    if (!snapshot.exists()) {
      console.warn("Firebase migration skipped: old database is empty or unreadable.");
      return;
    }

    const oldData = snapshot.val();
    if (!oldData || typeof oldData !== "object") return;

    // พยายามคัดลอกข้อมูลทั้งหมดในครั้งเดียวก่อน เพื่อรักษา path/key เดิมทุกอย่าง
    try {
      await update(ref(db), oldData);
    } catch (rootWriteError) {
      // ถ้า rules ไม่อนุญาต write ที่ root ให้ย้ายทีละ top-level path แทน
      for (const [path, value] of Object.entries(oldData)) {
        await set(ref(db, path), value);
      }
    }

    await set(ref(db, MIGRATION_PATH), {
      done: true,
      sourceProject: "bastien2k26",
      targetProject: "stanbastienx",
      migratedAt: Date.now()
    });

    console.info("Firebase migration complete: old data copied to stanbastienx.");
  } catch (error) {
    console.warn("Firebase migration could not complete:", error);
  }
}

// ไม่รอ migration เพื่อไม่ให้ UI ค้าง; Firebase listeners จะอัปเดตทันทีเมื่อข้อมูลถูกคัดลอกสำเร็จ
migrateOldFirebaseOnce();
