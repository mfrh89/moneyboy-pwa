import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
  setDoc,
  deleteDoc,
  writeBatch,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { FinanceItem, FirebaseConfig } from '../types';
import { initializeMessaging } from './notifications';

// --- CONFIGURATION ---
const LOCAL_DATA_KEY = 'finance_pwa_data_v1';
const LOCAL_CONFIG_KEY = 'finance_pwa_firebase_config';

// Hardcoded Config (Default / Demo)
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "moneyboy-2f088.firebaseapp.com",
  projectId: "moneyboy-2f088",
  storageBucket: "moneyboy-2f088.firebasestorage.app",
  messagingSenderId: "679174588558",
  appId: "1:679174588558:web:7615c9c0af9ea36aec21df",
  measurementId: "G-RCXP9MTNT6"
};

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let currentConfig = defaultFirebaseConfig;

// --- ROBUST INITIALIZATION ---
const initFirebase = () => {
  try {
    // 1. Load Config
    try {
      const storedConfig = localStorage.getItem(LOCAL_CONFIG_KEY);
      if (storedConfig) {
        currentConfig = JSON.parse(storedConfig);
      }
    } catch (e) {
      console.warn("Error loading custom config, using default.");
    }

    // 2. Initialize App
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(currentConfig);
    }

    // 3. Try Initialize Services
    if (firebaseApp) {
      // Attempt Auth
      try {
        auth = getAuth(firebaseApp);
      } catch (e) {
        console.warn("Firebase Auth failed to initialize (likely not enabled in console). Switching to Offline Mode.");
        auth = null;
      }

      // Attempt DB
      try {
        try {
          db = initializeFirestore(firebaseApp, {
            ignoreUndefinedProperties: true
          });
        } catch {
          // Firestore already initialized (e.g. HMR), get existing instance
          db = getFirestore(firebaseApp);
        }
        // Enable Offline Persistence for Firestore
        // This keeps data available even if user goes offline or reloads without internet
        if (db) {
          enableIndexedDbPersistence(db).catch((err) => {
             if (err.code == 'failed-precondition') {
                 console.warn('Persistence failed: Multiple tabs open');
             } else if (err.code == 'unimplemented') {
                 console.warn('Persistence not supported by browser');
             }
          });
        }
      } catch (e) {
        console.warn("Firebase Firestore failed to initialize. Switching to Offline Mode.");
        db = null;
      }
      
      // Attempt Analytics (Optional)
      try {
        getAnalytics(firebaseApp);
      } catch (e) { /* Ignore */ }

      // Attempt Messaging (Optional)
      try {
        initializeMessaging(firebaseApp);
        console.log('Firebase Cloud Messaging initialized');
      } catch (e) { 
        console.warn('Firebase Messaging initialization failed:', e);
      }
      
      if (auth && db) {
        const isCustom = localStorage.getItem(LOCAL_CONFIG_KEY) !== null;
        // Firebase initialized successfully
      } else {
        // If either essential service failed, force offline mode completely to prevent partial failures
        console.log('Firebase services incomplete. Forcing Offline Mode.');
        auth = null;
        db = null;
        firebaseApp = null;
      }
    }
  } catch (e) {
    console.warn('Firebase initialization failed completely. App will run in Offline Mode.', e);
    firebaseApp = null;
    auth = null;
    db = null;
  }
};

// Run initialization immediately
initFirebase();

export const isFirebaseActive = () => !!firebaseApp && !!auth && !!db;

// --- CONFIGURATION MANAGEMENT ---
export const getFirebaseConfig = () => currentConfig;

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
  window.location.reload();
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(LOCAL_CONFIG_KEY);
  window.location.reload();
};

// --- AUTH SERVICES ---

export const subscribeToAuth = (callback: (user: User | {email: string; uid: string} | null) => void) => {
  if (isFirebaseActive() && auth) {
    // REAL FIREBASE MODE
    return onAuthStateChanged(auth, (user) => {
        callback(user);
    }, (error) => {
        // If auth errors out (e.g. config-not-found during runtime), fallback to local
        console.warn("Auth error detected, falling back to local:", error);
        callback({ email: 'Offline Modus', uid: 'local-user' });
    });
  } else {
    // LOCAL MODE: Auto-login dummy user immediately
    console.log("Using Offline Mode");
    // Use setTimeout to ensure React is ready if called synchronously
    setTimeout(() => {
        callback({ email: 'Offline Modus', uid: 'local-user' });
    }, 0);
    return () => {};
  }
};

export const loginUser = async (email: string, pass: string) => {
  if (isFirebaseActive() && auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    
    // Optional: Update Last Login in User Profile
    if (db) {
       try {
         const userRef = doc(db, 'users', userCredential.user.uid);
         await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
       } catch(e) { /* non-blocking */ }
    }
  }
};

export const registerUser = async (email: string, pass: string) => {
  if (isFirebaseActive() && auth) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    
    // CRITICAL: Create the User Profile Document
    // This ensures data is stored "next to" the login info in the database
    if (db) {
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: Date.now(),
          lastLogin: Date.now()
        });
      } catch (e) {
        console.error("Error creating user profile document:", e);
      }
    }
  }
};

export const logoutUser = async () => {
  if (isFirebaseActive() && auth) {
    await signOut(auth);
  }
};

// --- DATA SERVICES ---

export const subscribeToItems = (
  user: User | {email: string} | null, 
  callback: (items: FinanceItem[]) => void
) => {
  // If no user, empty list
  if (!user) {
    callback([]);
    return () => {};
  }

  const isLocalUser = 'uid' in user && user.uid === 'local-user';

  // 1. FIREBASE MODE
  if (isFirebaseActive() && db && !isLocalUser && 'uid' in user) {
    try {
      const q = query(
        collection(db, 'users', user.uid, 'items'), 
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FinanceItem[];
        callback(items);
      }, (error) => {
        console.error("Firestore Error:", error);
        // Fallback to local on error
        const items = getLocalItems();
        callback(items);
      });
    } catch (e) {
      console.error("Error creating query", e);
      return () => {};
    }
  } 
  
  // 2. LOCAL MODE
  else {
    const loadLocal = () => {
        try {
            const data = localStorage.getItem(LOCAL_DATA_KEY);
            let items = data ? JSON.parse(data) : [];
            callback(items);
        } catch (e) {
            callback([]);
        }
    }
    loadLocal();
    return () => {};
  }
};

export const addItem = async (user: any, item: Omit<FinanceItem, 'id'>) => {
  const isLocalUser = user.uid === 'local-user';

  if (isFirebaseActive() && db && !isLocalUser) {
    try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'items'), item);
        return docRef.id;
    } catch(e) {
        // Fallback if write fails
        console.warn("Write failed, falling back to local", e);
        return addLocalItem(item);
    }
  } else {
    return addLocalItem(item);
  }
};

const addLocalItem = (item: Omit<FinanceItem, 'id'>) => {
    const items = getLocalItems();
    const newItem = { ...item, id: Date.now().toString() };
    saveLocalItems([newItem, ...items]);
    window.dispatchEvent(new CustomEvent('local-data-changed'));
    return newItem.id;
};

export const updateItem = async (user: any, item: FinanceItem) => {
  const isLocalUser = user.uid === 'local-user';

  if (isFirebaseActive() && db && !isLocalUser) {
    try {
        const { id, ...data } = item;
        const docRef = doc(db, 'users', user.uid, 'items', id);
        await setDoc(docRef, data, { merge: true });
    } catch(e) {
        updateLocalItem(item);
    }
  } else {
    updateLocalItem(item);
  }
};

const updateLocalItem = (item: FinanceItem) => {
    const items = getLocalItems();
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
        items[index] = item;
        saveLocalItems(items);
        window.dispatchEvent(new CustomEvent('local-data-changed'));
    }
};

export const deleteItem = async (user: any, itemId: string) => {
  const isLocalUser = user.uid === 'local-user';

  if (isFirebaseActive() && db && !isLocalUser) {
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'items', itemId));
    } catch(e) {
        deleteLocalItem(itemId);
    }
  } else {
    deleteLocalItem(itemId);
  }
};

const deleteLocalItem = (itemId: string) => {
    const items = getLocalItems();
    // Use String comparison to be safe against number/string mismatches
    const newItems = items.filter(i => String(i.id) !== String(itemId));
    saveLocalItems(newItems);
    window.dispatchEvent(new CustomEvent('local-data-changed'));
};

// --- MIGRATION HELPERS ---

export const hasLocalData = (): boolean => {
  const items = getLocalItems();
  return items.length > 0;
};

export const syncLocalToFirebase = async (user: any) => {
  if (!isFirebaseActive() || !db || !user.uid) throw new Error("Firebase not active");
  
  const localItems = getLocalItems();
  if (localItems.length === 0) return;

  const batch = writeBatch(db);
  const collectionRef = collection(db, 'users', user.uid, 'items');

  localItems.forEach(item => {
    const newDocRef = doc(collectionRef);
    const { id, ...data } = item; 
    batch.set(newDocRef, data);
  });

  await batch.commit();
  
  localStorage.removeItem(LOCAL_DATA_KEY);
  window.dispatchEvent(new CustomEvent('local-data-changed'));
};

// --- WHAT-IF SCENARIO ---

const WHATIF_KEY = 'moneyboy_whatif_scenario';

export interface ScenarioData {
  overrides: Record<string, number>;
  excluded: string[];
  additions: FinanceItem[];
}

export const subscribeToScenario = (
  user: any,
  callback: (scenario: ScenarioData | null) => void
): (() => void) => {
  const isLocalUser = !user || user.uid === 'local-user';
  if (!isFirebaseActive() || !db || isLocalUser) {
    try {
      const raw = localStorage.getItem(WHATIF_KEY);
      callback(raw ? JSON.parse(raw) : null);
    } catch {
      callback(null);
    }
    return () => {};
  }
  const ref = doc(db, 'users', user.uid, 'scenarios', 'whatif');
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as ScenarioData) : null);
  });
};

export const saveScenario = async (user: any, scenario: ScenarioData | null): Promise<void> => {
  const isLocalUser = !user || user.uid === 'local-user';
  if (!isFirebaseActive() || !db || isLocalUser) {
    if (scenario) {
      localStorage.setItem(WHATIF_KEY, JSON.stringify(scenario));
    } else {
      localStorage.removeItem(WHATIF_KEY);
    }
    return;
  }
  const ref = doc(db, 'users', user.uid, 'scenarios', 'whatif');
  if (scenario) {
    await setDoc(ref, scenario);
  } else {
    await deleteDoc(ref);
  }
};

// --- LOCAL HELPERS ---
const getLocalItems = (): FinanceItem[] => {
    try {
      const data = localStorage.getItem(LOCAL_DATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch(e) { return []; }
};

const saveLocalItems = (items: FinanceItem[]) => {
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(items));
};

export const seedData = (): FinanceItem[] => {
    const items: FinanceItem[] = [
      { id: '1', title: 'Gehalt', amount: 3200, type: 'income', category: 'Gehalt', createdAt: Date.now() },
      { id: '2', title: 'Miete', amount: 1100, type: 'expense', category: 'Wohnen', createdAt: Date.now() },
      { id: '3', title: 'Netflix', amount: 15, type: 'expense', category: 'Abonnements', createdAt: Date.now() },
      { id: '4', title: 'Supermarkt', amount: 450, type: 'expense', category: 'Lebenshaltung', createdAt: Date.now() },
    ];
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(items));
    return items;
};
