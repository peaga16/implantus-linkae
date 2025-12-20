import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0Qt1kNqqPNw6rFsZYpGmjIgk_x-Khy3E",
  authDomain: "implantus-links.firebaseapp.com",
  projectId: "implantus-links",
  storageBucket: "implantus-links.firebasestorage.app",
  messagingSenderId: "246089612472",
  appId: "1:246089612472:web:fb6ec34f2dcaa11263884d",
  measurementId: "G-D547YX71TG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, doc, getDoc, setDoc, ref, uploadBytes, getDownloadURL, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence };