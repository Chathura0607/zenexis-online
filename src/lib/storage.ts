import { Product, Order, SchoolListRequest, AppNotification, CartItem, CustomerProfile } from '@/types';
import { INITIAL_PRODUCTS, INITIAL_NOTIFICATIONS, SHOP_CONFIG } from './constants';

const KEYS = {
  PRODUCTS: 'zenexis_products_v1',
  ORDERS: 'zenexis_orders_v1',
  SCHOOL_REQUESTS: 'zenexis_school_requests_v1',
  NOTIFICATIONS: 'zenexis_notifications_v1',
  CART: 'zenexis_cart_v1',
  CUSTOMER: 'zenexis_customer_v1',
  THEME: 'zenexis_theme_v1',
};

// Safe client-side check
const isClient = typeof window !== 'undefined';

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

export const addProduct = (product: Product) => {
  const current = getStoredProducts();
  const updated = [product, ...current];
  saveStoredProducts(updated);

  // Auto-broadcast a notification to customers that a new item arrived!
  addNotification({
    id: `notif-${Date.now()}`,
    title: `✨ New Item Arrived: ${product.name}`,
    message: `Now available in stock at Zenexis Ambalangoda for Rs. ${product.price.toLocaleString()}! Order online or via WhatsApp.`,
    type: 'product',
    date: 'Just Now',
    read: false,
    link: `/#product-${product.id}`,
  });
};

export const updateProduct = (updatedProduct: Product) => {
  const current = getStoredProducts();
  const updated = current.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
  saveStoredProducts(updated);
};

export const deleteProduct = (id: string) => {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== id);
  saveStoredProducts(updated);
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
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const cart = getStoredCart();
  const item = cart.find((i) => i.product.id === productId);
  if (item) {
    item.quantity = quantity;
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
      return {
        ...ord,
        status,
        ...(extra || {}),
        updatedAt: new Date().toISOString(),
      };
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
  const updated = current.map((r) => (r.id === updatedReq.id ? { ...updatedReq, updatedAt: new Date().toISOString() } : r));
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
    // Default to dark mode for sleek gaming/tech store look
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

