/**
 * Zenexis Firebase / Firestore Integration
 * 
 * You can connect the EXACT SAME Firestore Database used by your Zenexis POS system!
 * 
 * Why this is 100% safe for your POS:
 * 1. Online orders are saved into a dedicated collection ('online_orders') so POS sales bills are never touched.
 * 2. Products collection ('products') can be shared so when an item is sold in-store, online stock updates automatically!
 * 3. School requests are saved into ('school_requests').
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const getFirebaseConfig = (): FirebaseConfig | null => {
  if (typeof window === 'undefined') return null;

  // 1. Check local storage (configured via Admin Settings)
  const saved = localStorage.getItem('zenexis_firebase_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  // 2. Check environment variables
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };
  }

  return null;
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('zenexis_firebase_config', JSON.stringify(config));
    window.dispatchEvent(new Event('zenexis_firebase_configured'));
  }
};

export const isFirebaseConnected = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(config && config.projectId && config.apiKey);
};

