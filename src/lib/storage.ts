import { Product, Order, SchoolListRequest, AppNotification, CartItem, CustomerProfile, ProductReview, StudyResource } from '@/types';
import { INITIAL_PRODUCTS, INITIAL_NOTIFICATIONS, SHOP_CONFIG } from './constants';
import {
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveOrderToFirestore,
  saveSchoolRequestToFirestore,
  fetchProductsFromFirestore,
  fetchOrdersFromFirestore,
  fetchSchoolRequestsFromFirestore,
  saveStudyResourceToFirestore,
  fetchStudyResourcesFromFirestore,
  deleteStudyResourceFromFirestore,
  isFirebaseConnected,
} from './firebase';
import { compressImageToDataUrl } from './imageUtils';

const KEYS = {
  PRODUCTS: 'zenexis_products_v2',
  ORDERS: 'zenexis_orders_v1',
  SCHOOL_REQUESTS: 'zenexis_school_requests_v1',
  NOTIFICATIONS: 'zenexis_notifications_v1',
  CART: 'zenexis_cart_v1',
  CUSTOMER: 'zenexis_customer_v1',
  THEME: 'zenexis_theme_v2',
  REVIEWS: 'zenexis_reviews_v1',
  WISHLIST: 'zenexis_wishlist_v1',
  RECENTLY_VIEWED: 'zenexis_recently_viewed_v1',
  STUDY_RESOURCES: 'zenexis_study_resources_v1',
};

// Safe client-side check
const isClient = typeof window !== 'undefined';

// Wipe legacy hardcoded mock storage if present
if (isClient) {
  try {
    if (localStorage.getItem('zenexis_products_v1')) {
      localStorage.removeItem('zenexis_products_v1');
    }
  } catch {
    // ignore
  }
}

// --- PRODUCTS ---
export const getStoredProducts = (): Product[] => {
  if (!isClient) return INITIAL_PRODUCTS;
  try {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_PRODUCTS;
  }
};

export const saveStoredProducts = (products: Product[]) => {
  if (!isClient) return;
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  window.dispatchEvent(new Event('zenexis_products_updated'));
};

/**
 * Sync products directly with Google Cloud Firestore / Zenexis POS
 */
export const syncProductsWithFirestore = async (): Promise<Product[]> => {
  if (!isFirebaseConnected()) {
    return getStoredProducts();
  }
  try {
    const res = await fetchProductsFromFirestore();
    if (res.success && res.products && res.products.length > 0) {
      // Cloud is primary source of truth across all devices and domains
      saveStoredProducts(res.products);
      return res.products;
    } else if (res.success && (!res.products || res.products.length === 0)) {
      // If Firestore collection has 0 items, check if current client has locally added products to upload
      const local = getStoredProducts();
      if (local.length > 0) {
        for (const p of local) {
          await saveProductToFirestore(p);
        }
        return local;
      }
    }
  } catch (err) {
    console.warn('Failed to background sync Firestore products:', err);
  }
  return getStoredProducts();
};

export const addProduct = async (product: Product): Promise<{ success: boolean; error?: string }> => {
  // Compress image before saving to avoid large payloads (>1MB)
  let cleanProduct = { ...product };
  if (cleanProduct.image && cleanProduct.image.startsWith('data:image')) {
    try {
      cleanProduct.image = await compressImageToDataUrl(cleanProduct.image, 800, 800, 0.75);
    } catch {}
  }

  const current = getStoredProducts();
  const updated = [cleanProduct, ...current.filter((p) => p.id !== cleanProduct.id)];
  saveStoredProducts(updated);

  let cloudSuccess = true;
  let cloudError = undefined;

  // Sync to Firestore
  if (isFirebaseConnected()) {
    try {
      const res = await saveProductToFirestore(cleanProduct);
      if (!res.success) {
        cloudSuccess = false;
        cloudError = res.error;
        console.warn('Firestore add product sync warning:', res.error);
      }
    } catch (err: any) {
      cloudSuccess = false;
      cloudError = err?.message;
      console.warn('Firestore sync failed:', err);
    }
  }

  // Auto-broadcast a notification to customers that a new item arrived!
  addNotification({
    id: `notif-${Date.now()}`,
    title: `✨ New Item Arrived: ${cleanProduct.name}`,
    message: `Now available in stock at Zenexis Ambalangoda for Rs. ${cleanProduct.price.toLocaleString()}! Order online or via WhatsApp.`,
    type: 'product',
    date: 'Just Now',
    read: false,
    link: `/#product-${cleanProduct.id}`,
  });

  return { success: cloudSuccess, error: cloudError };
};

export const updateProduct = async (updatedProduct: Product): Promise<{ success: boolean; error?: string }> => {
  let cleanProduct = { ...updatedProduct };
  if (cleanProduct.image && cleanProduct.image.startsWith('data:image')) {
    try {
      cleanProduct.image = await compressImageToDataUrl(cleanProduct.image, 800, 800, 0.75);
    } catch {}
  }

  const current = getStoredProducts();
  const updated = current.map((p) => (p.id === cleanProduct.id ? cleanProduct : p));
  saveStoredProducts(updated);

  // Sync to Firestore
  if (isFirebaseConnected()) {
    try {
      const res = await saveProductToFirestore(cleanProduct);
      if (!res.success) {
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  return { success: true };
};

export const deleteProduct = (id: string) => {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== id);
  saveStoredProducts(updated);

  // Sync delete to Firestore
  if (isFirebaseConnected()) {
    deleteProductFromFirestore(id).catch((err) =>
      console.warn('Firestore delete product sync warning:', err)
    );
  }
};

// --- CART ---
export const getStoredCart = (): CartItem[] => {
  if (!isClient) return [];
  try {
    const data = localStorage.getItem(KEYS.CART);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStoredCart = (cart: CartItem[]) => {
  if (!isClient) return;
  localStorage.setItem(KEYS.CART, JSON.stringify(cart));
  window.dispatchEvent(new Event('zenexis_cart_updated'));
};

export const addToCart = (product: Product, quantity = 1) => {
  const cart = getStoredCart();
  const existingIdx = cart.findIndex((item) => item.product.id === product.id);
  if (existingIdx > -1) {
    cart[existingIdx].quantity += quantity;
  } else {
    cart.push({ product, quantity });
  }
  saveStoredCart(cart);
};

export const removeFromCart = (productId: string) => {
  const cart = getStoredCart();
  const updated = cart.filter((item) => item.product.id !== productId);
  saveStoredCart(updated);
};

export const updateCartQuantity = (productId: string, quantity: number) => {
  const cart = getStoredCart();
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const idx = cart.findIndex((item) => item.product.id === productId);
  if (idx > -1) {
    cart[idx].quantity = quantity;
    saveStoredCart(cart);
  }
};

export const clearCart = () => {
  saveStoredCart([]);
};

// --- ORDERS ---
export const getStoredOrders = (): Order[] => {
  if (!isClient) return [];
  try {
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStoredOrders = (orders: Order[]) => {
  if (!isClient) return;
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  window.dispatchEvent(new Event('zenexis_orders_updated'));
};

/**
 * Sync orders directly with Google Cloud Firestore 'online_orders'
 */
export const syncOrdersWithFirestore = async (): Promise<Order[]> => {
  if (!isFirebaseConnected()) {
    return getStoredOrders();
  }
  try {
    const res = await fetchOrdersFromFirestore();
    if (res.success && res.orders) {
      const local = getStoredOrders();
      const orderMap = new Map<string, Order>();

      // First populate with local
      local.forEach((o) => {
        const key = o.orderNumber || o.id;
        orderMap.set(key, o);
      });

      // Override with cloud (Firestore is authoritative for cross-device orders)
      res.orders.forEach((o) => {
        const key = o.orderNumber || o.id;
        orderMap.set(key, o);
      });

      const merged = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      saveStoredOrders(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Failed to sync orders from Firestore:', err);
  }
  return getStoredOrders();
};

export const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order => {
  const currentOrders = getStoredOrders();
  const orderNumber = `ZNX-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    ...orderData,
    id: `ord-${Date.now()}`,
    orderNumber,
    createdAt: now,
    updatedAt: now,
  };

  saveStoredOrders([newOrder, ...currentOrders]);

  // Sync order to Cloud Firestore in isolated 'online_orders' collection
  if (isFirebaseConnected()) {
    saveOrderToFirestore(newOrder).catch((err) =>
      console.warn('Firestore order sync warning:', err)
    );
  }

  // Create notification
  addNotification({
    id: `notif-${Date.now()}`,
    title: `📦 Order #${orderNumber} Placed`,
    message: `Thank you ${newOrder.customerName}! Your order for Rs. ${newOrder.total.toLocaleString()} has been received and is being prepared.`,
    type: 'order',
    date: 'Just Now',
    read: false,
    link: `/track?order=${orderNumber}`,
  });

  return newOrder;
};

export const updateOrderStatus = (
  orderId: string,
  status: Order['status'],
  extra?: {
    scheduledPickupDate?: string;
    scheduledPickupTime?: string;
    trackingNumber?: string;
    cancellationReason?: string;
    cancelledBy?: 'admin' | 'customer';
    cancelledAt?: string;
  }
) => {
  const current = getStoredOrders();
  const products = getStoredProducts();
  let productsModified = false;

  const updated = current.map((ord) => {
    if (ord.id === orderId || ord.orderNumber === orderId) {
      let isStockDeducted = ord.isStockDeducted ?? false;
      const isApprovedOrBeyond =
        ['approved', 'processing', 'ready_for_pickup', 'out_for_delivery', 'completed'].includes(status);

      // Deduct stock when order is approved or moved to processing/completed
      if (isApprovedOrBeyond && !isStockDeducted) {
        ord.items.forEach((item) => {
          const pIdx = products.findIndex(
            (p) => p.id === item.product.id || p.name.toLowerCase() === item.product.name.toLowerCase()
          );
          if (pIdx > -1) {
            const currentStock = products[pIdx].stockCount ?? 10;
            const newStock = Math.max(0, currentStock - item.quantity);
            products[pIdx].stockCount = newStock;
            products[pIdx].inStock = newStock > 0;
            productsModified = true;

            // Sync updated product stock to Firestore
            if (isFirebaseConnected()) {
              saveProductToFirestore(products[pIdx]).catch((err) =>
                console.warn('Firestore stock deduction sync warning:', err)
              );
            }
          }
        });
        isStockDeducted = true;
      }

      // Restore stock if an approved order is cancelled
      if (status === 'cancelled' && isStockDeducted) {
        ord.items.forEach((item) => {
          const pIdx = products.findIndex(
            (p) => p.id === item.product.id || p.name.toLowerCase() === item.product.name.toLowerCase()
          );
          if (pIdx > -1) {
            const currentStock = products[pIdx].stockCount ?? 0;
            const newStock = currentStock + item.quantity;
            products[pIdx].stockCount = newStock;
            products[pIdx].inStock = newStock > 0;
            productsModified = true;

            // Sync updated product stock to Firestore
            if (isFirebaseConnected()) {
              saveProductToFirestore(products[pIdx]).catch((err) =>
                console.warn('Firestore stock restoration sync warning:', err)
              );
            }
          }
        });
        isStockDeducted = false;
      }

      const updatedOrd: Order = {
        ...ord,
        status,
        isStockDeducted,
        ...(extra || {}),
        updatedAt: new Date().toISOString(),
      };

      // Sync update to Firestore
      if (isFirebaseConnected()) {
        saveOrderToFirestore(updatedOrd).catch((err) =>
          console.warn('Firestore order status sync warning:', err)
        );
      }
      return updatedOrd;
    }
    return ord;
  });

  if (productsModified) {
    saveStoredProducts(products);
  }

  saveStoredOrders(updated);
};

// --- SCHOOL SEASON REQUESTS ---
export const getStoredSchoolRequests = (): SchoolListRequest[] => {
  if (!isClient) return [];
  try {
    const data = localStorage.getItem(KEYS.SCHOOL_REQUESTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStoredSchoolRequests = (requests: SchoolListRequest[]) => {
  if (!isClient) return;
  localStorage.setItem(KEYS.SCHOOL_REQUESTS, JSON.stringify(requests));
  window.dispatchEvent(new Event('zenexis_school_updated'));
};

/**
 * Sync school booklist requests directly with Google Cloud Firestore
 */
export const syncSchoolRequestsWithFirestore = async (): Promise<SchoolListRequest[]> => {
  if (!isFirebaseConnected()) {
    return getStoredSchoolRequests();
  }
  try {
    const res = await fetchSchoolRequestsFromFirestore();
    if (res.success && res.requests) {
      const local = getStoredSchoolRequests();
      const reqMap = new Map<string, SchoolListRequest>();
      local.forEach((r) => {
        const key = r.requestNumber || r.id;
        reqMap.set(key, r);
      });
      res.requests.forEach((r) => {
        const key = r.requestNumber || r.id;
        reqMap.set(key, r);
      });
      const merged = Array.from(reqMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveStoredSchoolRequests(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Failed to sync school requests from Firestore:', err);
  }
  return getStoredSchoolRequests();
};

export const createSchoolRequest = (
  requestData: Omit<SchoolListRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>
): SchoolListRequest => {
  const current = getStoredSchoolRequests();
  const requestNumber = `SCH-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newRequest: SchoolListRequest = {
    ...requestData,
    id: `sch-${Date.now()}`,
    requestNumber,
    createdAt: now,
    updatedAt: now,
  };

  saveStoredSchoolRequests([newRequest, ...current]);

  // Sync to Firestore 'school_requests' collection
  if (isFirebaseConnected()) {
    saveSchoolRequestToFirestore(newRequest).catch((err) =>
      console.warn('Firestore school request sync warning:', err)
    );
  }

  addNotification({
    id: `notif-${Date.now()}`,
    title: `🎒 Booklist Request #${requestNumber} Received`,
    message: `We received your handwritten book list for ${newRequest.studentName || 'student'}. Our team is reviewing the quote and setting your pickup time!`,
    type: 'school',
    date: 'Just Now',
    read: false,
    link: `/school-season`,
  });

  return newRequest;
};

export const updateSchoolRequest = (updatedReq: SchoolListRequest) => {
  const current = getStoredSchoolRequests();
  const updated = current.map((r) => {
    if (r.id === updatedReq.id) {
      const u = { ...updatedReq, updatedAt: new Date().toISOString() };
      if (isFirebaseConnected()) {
        saveSchoolRequestToFirestore(u).catch((err) =>
          console.warn('Firestore school update sync warning:', err)
        );
      }
      return u;
    }
    return r;
  });
  saveStoredSchoolRequests(updated);
};

// --- NOTIFICATIONS ---
export const getStoredNotifications = (): AppNotification[] => {
  if (!isClient) return INITIAL_NOTIFICATIONS;
  try {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!data) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
};

export const saveStoredNotifications = (notifs: AppNotification[]) => {
  if (!isClient) return;
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  window.dispatchEvent(new Event('zenexis_notifs_updated'));
};

export const addNotification = (notif: AppNotification) => {
  const current = getStoredNotifications();
  const updated = [notif, ...current];
  saveStoredNotifications(updated);
};

export const markNotificationRead = (id: string) => {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
};

export const markAllNotificationsRead = () => {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStoredNotifications(updated);
};

// --- CUSTOMER PROFILE & AUTH ---
export const getLoggedInCustomer = (): CustomerProfile | null => {
  if (!isClient) return null;
  try {
    const data = localStorage.getItem(KEYS.CUSTOMER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveLoggedInCustomer = (customer: CustomerProfile | null) => {
  if (!isClient) return;
  if (customer) {
    localStorage.setItem(KEYS.CUSTOMER, JSON.stringify(customer));
  } else {
    localStorage.removeItem(KEYS.CUSTOMER);
  }
  window.dispatchEvent(new Event('zenexis_customer_updated'));
};

export const customerLogout = () => {
  saveLoggedInCustomer(null);
};

// --- THEME (DARK / LIGHT MODE) ---
export const getSavedTheme = (): 'dark' | 'light' => {
  if (!isClient) return 'light';
  try {
    const saved = localStorage.getItem(KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  } catch {
    return 'light';
  }
};

export const saveTheme = (theme: 'dark' | 'light') => {
  if (!isClient) return;
  localStorage.setItem(KEYS.THEME, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event('zenexis_theme_updated'));
};

export const applyTheme = (theme: 'dark' | 'light') => {
  if (!isClient) return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
};

// --- WISHLIST (FAVORITES) ---
export const getWishlist = (): string[] => {
  if (!isClient) return [];
  try {
    const data = localStorage.getItem(KEYS.WISHLIST);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const toggleWishlist = (productId: string): boolean => {
  if (!isClient) return false;
  const current = getWishlist();
  const exists = current.includes(productId);
  const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];
  localStorage.setItem(KEYS.WISHLIST, JSON.stringify(updated));
  window.dispatchEvent(new Event('zenexis_wishlist_updated'));
  return !exists;
};

export const isInWishlist = (productId: string): boolean => {
  return getWishlist().includes(productId);
};

// --- RECENTLY VIEWED PRODUCTS ---
export const getRecentlyViewed = (): string[] => {
  if (!isClient) return [];
  try {
    const data = localStorage.getItem(KEYS.RECENTLY_VIEWED);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (productId: string) => {
  if (!isClient) return;
  const current = getRecentlyViewed().filter((id) => id !== productId);
  const updated = [productId, ...current].slice(0, 10);
  localStorage.setItem(KEYS.RECENTLY_VIEWED, JSON.stringify(updated));
  window.dispatchEvent(new Event('zenexis_recently_viewed_updated'));
};

// --- PRODUCT REVIEWS & RATINGS ---
export const getProductReviews = (productId: string): ProductReview[] => {
  if (!isClient) return [];
  try {
    const data = localStorage.getItem(KEYS.REVIEWS);
    const allReviews: ProductReview[] = data ? JSON.parse(data) : [];
    const productReviews = allReviews.filter((r) => r.productId === productId);
    return productReviews;
  } catch {
    return [];
  }
};

export const addProductReview = (
  reviewData: Omit<ProductReview, 'id' | 'createdAt'>
): ProductReview => {
  const newReview: ProductReview = {
    ...reviewData,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (!isClient) return newReview;
  try {
    const data = localStorage.getItem(KEYS.REVIEWS);
    const allReviews: ProductReview[] = data ? JSON.parse(data) : [];
    const updated = [newReview, ...allReviews];
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(updated));
    window.dispatchEvent(new Event('zenexis_reviews_updated'));

    // Automatically recalculate product average rating & review count
    const productReviews = updated.filter((r) => r.productId === reviewData.productId);
    const avgRating = Number(
      (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
    );
    const products = getStoredProducts();
    const prodIndex = products.findIndex((p) => p.id === reviewData.productId);
    if (prodIndex > -1) {
      products[prodIndex].rating = avgRating;
      products[prodIndex].reviewsCount = productReviews.length;
      saveStoredProducts(products);
    }
  } catch (e) {
    console.warn('Failed to save review:', e);
  }

  return newReview;
};

// --- STUDY & KIDS RESOURCES (Lead Magnet Hub) ---

export const INITIAL_STUDY_RESOURCES: StudyResource[] = [
  {
    id: 'res-term-gr10-sci-2024',
    title: '2024 Grade 10 Science 2nd Term Paper (Southern Province with Answers)',
    titleSi: '2024 10 ශ්‍රේණිය විද්‍යාව 2 වන වාර ප්‍රශ්න පත්‍රය (දකුණු පළාත් පිළිතුරු සමග)',
    category: 'term_test',
    grade: 'Grade 10',
    subject: 'Science',
    year: '2024',
    term: '2nd Term',
    medium: 'sinhala',
    downloadUrl: '/downloads/grade-10-science-2024.pdf',
    fileType: 'PDF Document',
    fileSize: '1.8 MB',
    downloadsCount: 342,
    isFeatured: true,
    description: 'Southern Province Department of Education 2024 official 2nd term paper with full marking scheme.',
    createdAt: '2024-10-15T08:00:00.000Z',
  },
  {
    id: 'res-term-gr11-maths-2024',
    title: '2024 Grade 11 Mathematics 3rd Term Model Paper & Step-by-Step Solutions',
    titleSi: '2024 11 ශ්‍රේණිය ගණිතය 3 වන වාර ආදර්ශ ප්‍රශ්න පත්‍රය සහ පියවරෙන් පියවර විසඳුම්',
    category: 'term_test',
    grade: 'Grade 11 / O/L',
    subject: 'Mathematics',
    year: '2024',
    term: '3rd Term',
    medium: 'sinhala',
    downloadUrl: '/downloads/grade-11-maths-model-2024.pdf',
    fileType: 'PDF Document',
    fileSize: '2.4 MB',
    downloadsCount: 489,
    isFeatured: true,
    description: 'Essential model exam paper for Grade 11 students preparing for 3rd term evaluation.',
    createdAt: '2024-10-20T08:00:00.000Z',
  },
  {
    id: 'res-ol-hist-notes-2024',
    title: 'G.C.E. O/L History Fast Revision Short Notes & Map Points (10-11 Complete)',
    titleSi: 'සාමාන්‍ය පෙළ ඉතිහාසය සියලුම පාඩම් කෙටි සටහන් සහ අනිවාර්ය සිතියම් ලකුණු කිරීම්',
    category: 'short_notes',
    grade: 'Grade 11 / O/L',
    subject: 'History',
    year: '2024',
    medium: 'sinhala',
    downloadUrl: '/downloads/ol-history-short-notes.pdf',
    fileType: 'PDF Document',
    fileSize: '3.1 MB',
    downloadsCount: 715,
    isFeatured: true,
    description: 'Full syllabus quick summary covering all kingdoms, treaties, and compulsory Sri Lanka & world maps.',
    createdAt: '2024-09-10T08:00:00.000Z',
  },
  {
    id: 'res-ol-sci-formulas-2024',
    title: 'G.C.E. O/L Science Physics Formulas, Chemistry Units & Tables Sheet',
    titleSi: 'සා.පෙළ විද්‍යාව භෞතික විද්‍යා සූත්‍ර, රසායන විද්‍යා මූලද්‍රව්‍ය & ඒකක සාරාංශය',
    category: 'short_notes',
    grade: 'Grade 11 / O/L',
    subject: 'Science',
    year: '2024',
    medium: 'sinhala',
    downloadUrl: '/downloads/ol-science-formulas.pdf',
    fileType: 'PDF Document',
    fileSize: '1.2 MB',
    downloadsCount: 520,
    isFeatured: true,
    description: 'Quick reference sheet for formulas, SI units, and chemical activity series.',
    createdAt: '2024-09-12T08:00:00.000Z',
  },
  {
    id: 'res-al-comb-maths-notes',
    title: 'G.C.E. A/L Combined Maths Trigonometry & Calculus Quick Revision Formula Book',
    titleSi: 'උසස් පෙළ සංයුක්ත ගණිතය ත්‍රිකෝණමිතිය, කලනය සහ දෛශික සම්පූර්ණ සූත්‍ර අත්පොත',
    category: 'short_notes',
    grade: 'A/L',
    subject: 'Combined Mathematics',
    year: '2024',
    medium: 'sinhala',
    downloadUrl: '/downloads/al-combined-maths-formulas.pdf',
    fileType: 'PDF Document',
    fileSize: '2.8 MB',
    downloadsCount: 640,
    isFeatured: true,
    description: 'Concise formula handbook for quick memory review before exams.',
    createdAt: '2024-08-25T08:00:00.000Z',
  },
  {
    id: 'res-ol-eng-past-2023',
    title: 'G.C.E. O/L English Past Paper 2023 (Part I & II with Official Answer Scheme)',
    titleSi: 'සා.පෙළ ඉංග්‍රීසි 2023 පසුගිය විභාග ප්‍රශ්න පත්‍රය (ලකුණු දීමේ පටිපාටිය සමග)',
    category: 'past_papers',
    grade: 'Grade 11 / O/L',
    subject: 'English',
    year: '2023',
    medium: 'english',
    downloadUrl: '/downloads/ol-english-past-2023.pdf',
    fileType: 'PDF Document',
    fileSize: '1.9 MB',
    downloadsCount: 430,
    isFeatured: false,
    description: 'Official Department of Examinations paper with answers for essay, reading & grammar.',
    createdAt: '2024-07-15T08:00:00.000Z',
  },
  {
    id: 'res-kids-sinhala-hodiya',
    title: 'Kids Sinhala Hodiya & English Alphabet Tracing Activity Worksheets',
    titleSi: 'පෙර පාසල් & ප්‍රාථමික දරුවන්ට සිංහල හෝඩිය සහ ඉංග්‍රීසි අකුරු හුරු කරවන රූප කොළ',
    category: 'kids_sheets',
    grade: 'Primary / Kids',
    subject: 'Sinhala & English Tracing',
    medium: 'sinhala',
    downloadUrl: '/downloads/kids-sinhala-english-tracing.pdf',
    fileType: 'PDF Activity Pack',
    fileSize: '4.2 MB',
    downloadsCount: 890,
    isFeatured: true,
    description: 'Fun printable dot-tracing handwriting sheets designed for preschool and Grade 1-2 kids.',
    createdAt: '2024-06-10T08:00:00.000Z',
  },
  {
    id: 'res-kids-coloring-pack-20',
    title: 'Cute Animals, Vehicles & Cartoon Coloring Book (20 Printable Picture Sheets)',
    titleSi: 'පොඩිත්තන්ට පාට කිරීමට සතුන් සහ කාටූන් ලස්සන රූප කොළ 20 ක සම්පූර්ණ පැකේජය',
    category: 'kids_sheets',
    grade: 'Primary / Kids',
    subject: 'Coloring & Art',
    medium: 'sinhala',
    downloadUrl: '/downloads/kids-coloring-pack.pdf',
    fileType: 'PDF Coloring Book',
    fileSize: '5.5 MB',
    downloadsCount: 1120,
    isFeatured: true,
    description: 'Clean high-resolution coloring sheets ready to print on A4 papers.',
    createdAt: '2024-06-15T08:00:00.000Z',
  },
  {
    id: 'res-term-gr8-eng-2024',
    title: '2024 Grade 8 English 2nd Term Paper - Southern Province Evaluation',
    titleSi: '2024 8 ශ්‍රේණිය ඉංග්‍රීසි භාෂාව 2 වන වාර ප්‍රශ්න පත්‍රය (දකුණු පළාත)',
    category: 'term_test',
    grade: 'Grade 8',
    subject: 'English',
    year: '2024',
    term: '2nd Term',
    medium: 'english',
    downloadUrl: '/downloads/grade-8-english-2024.pdf',
    fileType: 'PDF Document',
    fileSize: '1.4 MB',
    downloadsCount: 260,
    isFeatured: false,
    description: 'Southern Province Grade 8 2nd term English paper with reading comprehension & writing tasks.',
    createdAt: '2024-10-18T08:00:00.000Z',
  },
];

export const getStoredResources = (): StudyResource[] => {
  if (!isClient) return INITIAL_STUDY_RESOURCES;
  try {
    const data = localStorage.getItem(KEYS.STUDY_RESOURCES);
    if (!data) {
      localStorage.setItem(KEYS.STUDY_RESOURCES, JSON.stringify(INITIAL_STUDY_RESOURCES));
      return INITIAL_STUDY_RESOURCES;
    }
    const parsed: StudyResource[] = JSON.parse(data);

    // Auto-migrate any old broken / placeholder links to clean valid sample downloads
    let needsUpdate = false;
    const migrated = parsed.map((item) => {
      if (item.downloadUrl && (item.downloadUrl.includes('1zenexis-study-resources') || item.downloadUrl === '#')) {
        const initial = INITIAL_STUDY_RESOURCES.find((r) => r.id === item.id);
        if (initial) {
          needsUpdate = true;
          return { ...item, downloadUrl: initial.downloadUrl };
        }
      }
      return item;
    });

    if (needsUpdate) {
      localStorage.setItem(KEYS.STUDY_RESOURCES, JSON.stringify(migrated));
      return migrated;
    }

    return parsed;
  } catch {
    return INITIAL_STUDY_RESOURCES;
  }
};

export const saveStoredResources = (resources: StudyResource[]) => {
  if (!isClient) return;
  localStorage.setItem(KEYS.STUDY_RESOURCES, JSON.stringify(resources));
  window.dispatchEvent(new Event('zenexis_resources_updated'));
};

export const addStudyResource = async (
  resource: StudyResource
): Promise<{ success: boolean; error?: string }> => {
  const current = getStoredResources();
  const updated = [resource, ...current];
  saveStoredResources(updated);

  if (isFirebaseConnected()) {
    try {
      const res = await saveStudyResourceToFirestore(resource);
      if (!res.success) return { success: false, error: res.error };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  return { success: true };
};

export const updateStudyResource = async (
  resource: StudyResource
): Promise<{ success: boolean; error?: string }> => {
  const current = getStoredResources();
  const updated = current.map((r) => (r.id === resource.id ? resource : r));
  saveStoredResources(updated);

  if (isFirebaseConnected()) {
    try {
      const res = await saveStudyResourceToFirestore(resource);
      if (!res.success) return { success: false, error: res.error };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  return { success: true };
};

export const deleteStudyResource = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  const current = getStoredResources();
  const updated = current.filter((r) => r.id !== id);
  saveStoredResources(updated);

  if (isFirebaseConnected()) {
    try {
      const res = await deleteStudyResourceFromFirestore(id);
      if (!res.success) return { success: false, error: res.error };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  return { success: true };
};

export const incrementResourceDownload = (id: string) => {
  const current = getStoredResources();
  const resIndex = current.findIndex((r) => r.id === id);
  if (resIndex > -1) {
    current[resIndex].downloadsCount = (current[resIndex].downloadsCount || 0) + 1;
    saveStoredResources(current);
    if (isFirebaseConnected()) {
      saveStudyResourceToFirestore(current[resIndex]).catch(() => {});
    }
  }
};

export const syncResourcesWithFirestore = async (): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> => {
  if (!isFirebaseConnected()) {
    return { success: false, count: 0, error: 'Firebase not connected' };
  }

  try {
    const cloudRes = await fetchStudyResourcesFromFirestore();
    if (cloudRes.success && cloudRes.resources.length > 0) {
      saveStoredResources(cloudRes.resources);
      return { success: true, count: cloudRes.resources.length };
    } else if (cloudRes.success && cloudRes.resources.length === 0) {
      // Pre-seed cloud with initial resources if empty
      const local = getStoredResources();
      for (const item of local) {
        await saveStudyResourceToFirestore(item);
      }
      return { success: true, count: local.length };
    }
    return { success: false, count: 0, error: cloudRes.error };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message };
  }
};
