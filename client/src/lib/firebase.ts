import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Validate that all required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID'
] as const;

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Log current domain for verification
console.log('Current domain:', window.location.origin);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase Configuration (sanitized):', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
});

let app;
let auth;
let googleProvider;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  // Configure Google Provider with additional scopes if needed
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  console.log('Firebase initialized successfully');
  console.log('Auth domain:', auth.config.authDomain);
} catch (error: any) {
  console.error('Error initializing Firebase:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);

  if (error.code === 'auth/configuration-not-found') {
    console.error('Possible fixes:',
      '1. Verify Firebase configuration values are correct',
      '2. Ensure domain is added to authorized domains in Firebase Console',
      '3. Check if Firebase project is properly set up'
    );
  }

  throw error;
}

export { app, auth, googleProvider };