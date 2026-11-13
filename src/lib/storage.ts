import { Product, Order, SchoolListRequest, AppNotification, CartItem, CustomerProfile, ProductReview } from '@/types';
import { INITIAL_PRODUCTS, INITIAL_NOTIFICATIONS, SHOP_CONFIG } from './constants';
import {
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveOrderToFirestore,
  saveSchoolRequestToFirestore,
  fetchProductsFromFirestore,
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
  THEME: 'zenexis_theme_v1',
  REVIEWS: 'zenexis_reviews_v1',
  WISHLIST: 'zenexis_wishlist_v1',
  RECENTLY_VIEWED: 'zenexis_recently_viewed_v1',
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
  extra?: { scheduledPickupDate?: string; scheduledPickupTime?: string; trackingNumber?: string }
) => {
  const current = getStoredOrders();
  const updated = current.map((ord) => {
    if (ord.id === orderId || ord.orderNumber === orderId) {
      const updatedOrd = {
        ...ord,
        status,
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
  if (!isClient) return 'dark';
  try {
    const saved = localStorage.getItem(KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  } catch {
    return 'dark';
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
