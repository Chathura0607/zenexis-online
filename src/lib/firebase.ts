/**
 * Zenexis Cloud Firestore & POS Synchronization Engine
 * 
 * Connects directly to Google Cloud Firestore via high-speed REST API.
 * Zero heavy 50MB npm bundles required — 100% lightweight & blazing fast.
 * 
 * POS Safety Guarantees:
 * 1. Counter Sales & In-Store Bills: Kept in POS-specific collections ('pos_sales' / 'bills') — untouched by online store.
 * 2. Shared Products Catalog: The 'products' (or custom) collection is shared. Both POS barcode scan sales and online sales use the same stock count.
 * 3. Online Orders: Saved into 'online_orders'.
 * 4. School Booklist Requests: Saved into 'school_requests'.
 * 5. Missing POS Images: When POS products don't have images, Zenexis Online automatically applies category fallback banners.
 */

import { Product, Order, SchoolListRequest, ProductCategory } from '@/types';
import { getCategoryFallbackImage } from './constants';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  collectionName?: string; // default: 'products'
}

const STORAGE_KEY = 'zenexis_firebase_config';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyBtzbf0yLgGFG1NGpJlMKjVra3PUByh-bw',
  authDomain: 'zenexis-pos.firebaseapp.com',
  projectId: 'zenexis-pos',
  storageBucket: 'zenexis-pos.appspot.com',
  messagingSenderId: '37370946244',
  appId: '1:37370946244:web:8fbd63a812d49a77849f91',
  collectionName: 'products',
};

export const getFirebaseConfig = (): FirebaseConfig => {
  // 1. Check local storage (configured via Admin Settings)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.projectId && parsed.projectId !== 'projectId') {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
  }

  // 2. Check environment variables
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '37370946244',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      collectionName: 'products',
    };
  }

  // 3. Fallback to production default credentials
  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('zenexis_firebase_configured'));
  }
};

export const isFirebaseConnected = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(config && config.projectId && config.projectId !== 'projectId' && config.apiKey);
};

// --- FIRESTORE REST SERIALIZERS & DESERIALIZERS ---

export function parseFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(parseFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const k in fields) {
      res[k] = parseFirestoreValue(fields[k]);
    }
    return res;
  }
  if ('nullValue' in val) return null;
  return null;
}

export function parseFirestoreDoc(doc: any): { id: string; data: Record<string, any> } {
  const fields = doc.fields || {};
  const data: Record<string, any> = {};
  for (const key in fields) {
    data[key] = parseFirestoreValue(fields[key]);
  }
  const parts = (doc.name || '').split('/');
  const id = parts[parts.length - 1];
  return { id, data };
}

export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const k in val) {
      if (val[k] !== undefined) {
        fields[k] = toFirestoreValue(val[k]);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      fields[key] = toFirestoreValue(obj[key]);
    }
  }
  return fields;
}

/**
 * Normalizes any POS or Cloud Firestore document into a standardized Product object.
 * Handles different POS schemas (e.g., itemName, sellingPrice, qty, barcode, missing images).
 */
export function normalizeProductFromFirestore(docId: string, raw: any): Product {
  const name =
    raw.name ||
    raw.itemName ||
    raw.item_name ||
    raw.productName ||
    raw.title ||
    `Zenexis Item ${docId}`;

  const nameSi = raw.nameSi || raw.name_si || raw.sinhala_name || '';

  // Match or map category
  let category: ProductCategory = 'computer';
  const rawCat = String(raw.category || raw.category_name || raw.group || '').toLowerCase();
  if (rawCat.includes('station') || rawCat.includes('book') || rawCat.includes('pen') || rawCat.includes('paper')) {
    category = 'stationery';
  } else if (rawCat.includes('bundle') || rawCat.includes('grade')) {
    category = 'school_bundles';
  } else if (rawCat.includes('phone') || rawCat.includes('mobile')) {
    category = 'mobile';
  } else if (rawCat.includes('charge') || rawCat.includes('cable') || rawCat.includes('adapter')) {
    category = 'chargers';
  } else if (rawCat.includes('computer') || rawCat.includes('pc') || rawCat.includes('mouse') || rawCat.includes('keyboard')) {
    category = 'computer';
  }

  // Price calculation
  const price = Number(
    raw.price ?? raw.sellingPrice ?? raw.selling_price ?? raw.retailPrice ?? raw.unit_price ?? 0
  );

  const rawOriginal = raw.originalPrice ?? raw.original_price ?? raw.costPrice ?? raw.mrp;
  const originalPrice = rawOriginal && Number(rawOriginal) > price ? Number(rawOriginal) : undefined;

  // Stock
  const stockCount = Number(raw.stockCount ?? raw.stock ?? raw.quantity ?? raw.qty ?? 10);
  const inStock = raw.inStock !== undefined ? Boolean(raw.inStock) : stockCount > 0;

  // Image handling: POS items often don't have images; use high-res fallback
  const image =
    raw.image && typeof raw.image === 'string' && raw.image.trim().length > 5
      ? raw.image.trim()
      : getCategoryFallbackImage(category);

  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : [category, 'zenexis', ...(raw.barcode ? [String(raw.barcode)] : [])];

  return {
    id: raw.id || docId,
    name,
    nameSi,
    category,
    price,
    originalPrice,
    description:
      raw.description ||
      raw.details ||
      `${name} - In-stock at Zenexis Ambalangoda. Order online or buy directly in-store!`,
    image,
    inStock,
    stockCount,
    tags,
    rating: typeof raw.rating === 'number' ? raw.rating : 4.8,
    reviewsCount: typeof raw.reviewsCount === 'number' ? raw.reviewsCount : 15,
    isFeatured: Boolean(raw.isFeatured ?? raw.featured),
    isSchoolSeason: Boolean(raw.isSchoolSeason || category === 'school_bundles'),
    specs: raw.specs || (raw.barcode ? { Barcode: String(raw.barcode) } : undefined),
  };
}

// --- CRUD OPERATIONS ---

/**
 * Fetch all products from Firestore collection ('products' or POS custom collection)
 */
export async function fetchProductsFromFirestore(
  customCollection?: string
): Promise<{ success: boolean; products: Product[]; error?: string }> {
  const config = getFirebaseConfig();
  if (!config || !config.projectId || config.projectId === 'projectId' || !config.apiKey) {
    return {
      success: false,
      products: [],
      error: 'Firebase is not yet configured with a valid Project ID. Enter your credentials in Admin Settings.',
    };
  }

  const collection = customCollection || config.collectionName || 'products';
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    config.projectId
  )}/databases/(default)/documents/${encodeURIComponent(collection)}?key=${encodeURIComponent(
    config.apiKey
  )}&pageSize=300`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const msg = errJson?.error?.message || `HTTP ${res.status}: Failed to reach Firestore`;
      return { success: false, products: [], error: msg };
    }

    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) {
      return { success: true, products: [] };
    }

    const products: Product[] = data.documents.map((doc: any) => {
      const { id, data: docData } = parseFirestoreDoc(doc);
      return normalizeProductFromFirestore(id, docData);
    });

    return { success: true, products };
  } catch (err: any) {
    return {
      success: false,
      products: [],
      error: err?.message || 'Network error while connecting to Firestore',
    };
  }
}

/**
 * Save or update a product in Firestore
 */
export async function saveProductToFirestore(
  product: Product,
  customCollection?: string
): Promise<{ success: boolean; error?: string }> {
  const config = getFirebaseConfig();
  if (!config || !config.projectId || config.projectId === 'projectId' || !config.apiKey) {
    return { success: false, error: 'Firebase not configured' };
  }

  const collection = customCollection || config.collectionName || 'products';
  const docId = product.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    config.projectId
  )}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(
    docId
  )}?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const fields = toFirestoreFields(product);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save product to Firestore' };
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductFromFirestore(
  productId: string,
  customCollection?: string
): Promise<{ success: boolean; error?: string }> {
  const config = getFirebaseConfig();
  if (!config || !config.projectId || config.projectId === 'projectId' || !config.apiKey) {
    return { success: false, error: 'Firebase not configured' };
  }

  const collection = customCollection || config.collectionName || 'products';
  const docId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    config.projectId
  )}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(
    docId
  )}?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete product from Firestore' };
  }
}

/**
 * Save an online order into dedicated 'online_orders' collection (never collides with POS receipts)
 */
export async function saveOrderToFirestore(
  order: Order
): Promise<{ success: boolean; error?: string }> {
  const config = getFirebaseConfig();
  if (!config || !config.projectId || config.projectId === 'projectId' || !config.apiKey) {
    return { success: false, error: 'Firebase not configured' };
  }

  const docId = order.orderNumber || order.id;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    config.projectId
  )}/databases/(default)/documents/online_orders/${encodeURIComponent(
    docId
  )}?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const fields = toFirestoreFields(order);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save order to Firestore' };
  }
}

/**
 * Save school list request into 'school_requests'
 */
export async function saveSchoolRequestToFirestore(
  request: SchoolListRequest
): Promise<{ success: boolean; error?: string }> {
  const config = getFirebaseConfig();
  if (!config || !config.projectId || config.projectId === 'projectId' || !config.apiKey) {
    return { success: false, error: 'Firebase not configured' };
  }

  const docId = request.requestNumber || request.id;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    config.projectId
  )}/databases/(default)/documents/school_requests/${encodeURIComponent(
    docId
  )}?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const fields = toFirestoreFields(request);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save request to Firestore' };
  }
}

/**
 * Test connection to Firestore
 */
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const config = getFirebaseConfig();
  if (!config) {
    return { success: false, message: 'No Firebase configuration found.' };
  }
  if (!config.projectId || config.projectId === 'projectId') {
    return {
      success: false,
      message:
        'Please enter your actual Firebase Project ID (e.g. zenexis-pos-1234). "projectId" is a placeholder.',
    };
  }
  if (!config.apiKey) {
    return { success: false, message: 'Firebase Web API Key is missing.' };
  }

  const res = await fetchProductsFromFirestore();
  if (!res.success) {
    return {
      success: false,
      message: res.error || 'Connection failed. Please check your Project ID and API Key.',
    };
  }

  return {
    success: true,
    message: `Connected successfully! Found ${res.products.length} products in Firestore collection.`,
    count: res.products.length,
  };
}
