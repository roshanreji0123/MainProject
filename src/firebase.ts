import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAWp3i2AkTQfljOYI_DbHeRwPuIhPVYdLM",
  authDomain: "one-note-bcb26.firebaseapp.com",
  projectId: "one-note-bcb26",
  storageBucket: "one-note-bcb26.firebasestorage.app",
  messagingSenderId: "329103105294",
  appId: "1:329103105294:web:61ab01530bef68e8dccb5f"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export default app; 