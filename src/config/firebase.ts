import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyD0cL8TMp3wgZS2MrJtlmrEYfW80VRFpWw',
  authDomain: 'parkshare-2b8d6.firebaseapp.com',
  projectId: 'parkshare-2b8d6',
  storageBucket: 'parkshare-2b8d6.firebasestorage.app',
  messagingSenderId: '335369310194',
  appId: '1:335369310194:web:7590fcc1482181ed5c656b',
  measurementId: 'G-8M6ZMB7RFJ',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
export default app;
