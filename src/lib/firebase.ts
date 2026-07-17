import {
  initializeApp,
  getApps,
  FirebaseApp,
  FirebaseOptions,
} from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isValidConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

function getApp(): FirebaseApp | null {
  if (!isValidConfig) return null;
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

let _app: FirebaseApp | null = getApp();
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!_auth && _app) _auth = getAuth(_app);
  return _auth;
}

export function getFirebaseDb(): Firestore | null {
  if (!_db && _app) {
    _db = initializeFirestore(_app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!_storage && _app) _storage = getStorage(_app);
  return _storage;
}

// Backwards-compatible named exports (lazy)
export const auth = new Proxy({} as Auth, {
  get(_, prop: string | symbol) {
    const a = getFirebaseAuth();
    if (!a) throw new Error("Firebase Auth no está configurado");
    return (a as any)[prop];
  },
});

export const db = new Proxy({} as Firestore, {
  get(_, prop: string | symbol) {
    const d = getFirebaseDb();
    if (!d) throw new Error("Firebase Firestore no está configurado");
    return (d as any)[prop];
  },
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(_, prop: string | symbol) {
    const s = getFirebaseStorage();
    if (!s) throw new Error("Firebase Storage no está configurado");
    return (s as any)[prop];
  },
});

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Emulators can be enabled here if needed
}

export async function enableOfflinePersistence() {
  if (typeof window === "undefined") return;
  try {
    getFirebaseDb();
  } catch {
    // Persistence may fail if multiple tabs are open; ignore gracefully
  }
}

export default _app;
