import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions'

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'nwk-app-ba6f8.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'nwk-app-ba6f8',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'nwk-app-ba6f8.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '72050197360',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'demo-app-id',
}

const app: FirebaseApp = initializeApp(config)
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)
const functions: Functions = getFunctions(app, 'asia-northeast3')

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export { app, auth, db, functions }
