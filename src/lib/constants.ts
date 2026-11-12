import { Product } from '@/types';

export const SHOP_CONFIG = {
  name: 'Zenexis',
  tagline: 'Computer Accessories, Complete Stationery, Mobiles & Unique Gifts',
  address: 'Ambalangoda, Sri Lanka',
  phone: '0701120945',
  whatsappNumber: '0701120945',
  whatsappIntl: '94701120945',
  email: 'info@zenexis.lk',
  deliveryFee: 350,
  freeDeliveryThreshold: 7500,
  schoolSeasonDiscountPercent: 10,
  pickupLocation: 'Zenexis Main Showroom - Ambalangoda (Near Bus Stand)',
  operatingHours: 'Mon - Sun: 8:00 AM - 8:30 PM',
};

export const CATEGORIES = [
  { id: 'all', name: 'All Products', nameSi: 'සියලුම භාණ්ඩ', icon: 'SparklesIcon' },
  { id: 'computer', name: 'Computer Accessories', nameSi: 'පරිගණක උපාංග', icon: 'LaptopIcon' },
  { id: 'stationery', name: 'School & Stationery', nameSi: 'පාසල් සහ ලිපිද්‍රව්‍ය', icon: 'BookOpenIcon' },
  { id: 'mobile', name: 'Phones & Mobiles', nameSi: 'ජංගම දුරකථන', icon: 'SmartphoneIcon' },
  { id: 'chargers', name: 'Chargers & Cables', nameSi: 'චාජර්ස් සහ කේබල්', icon: 'ZapIcon' },
  { id: 'school_bundles', name: 'School Book Bundles', nameSi: 'පාසල් පොත් කට්ටල', icon: 'ShoppingBagIcon' },
];

/**
 * Production Ready Empty Product State
 * All products are dynamically loaded from your Cloud Firestore Database / Zenexis POS.
 */
export const INITIAL_PRODUCTS: Product[] = [];

/**
 * High-definition fallback banners for POS products that don't have images uploaded.
 * Seamlessly ensures Zenexis Online looks stunning even when items are added from in-store POS barcode scanners.
 */
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  computer: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
  stationery: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
  mobile: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80',
  chargers: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
  school_bundles: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80',
};

export const getCategoryFallbackImage = (category?: string): string => {
  if (!category) return CATEGORY_FALLBACK_IMAGES.default;
  return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.default;
};

export const getProductDisplayImage = (product?: Partial<Product> | null): string => {
  if (!product) return CATEGORY_FALLBACK_IMAGES.default;
  if (product.image && typeof product.image === 'string' && product.image.trim().length > 5) {
    return product.image.trim();
  }
  return getCategoryFallbackImage(product.category);
};

export const SCHOOL_GRADES = [
  'Grade 1 (1 වසර)',
  'Grade 2 (2 වසර)',
  'Grade 3 (3 වසර)',
  'Grade 4 (4 වසර)',
  'Grade 5 (5 වසර - Scholarship)',
  'Grade 6 (6 වසර)',
  'Grade 7 (7 වසර)',
  'Grade 8 (8 වසර)',
  'Grade 9 (9 වසර)',
  'Grade 10 (10 වසර - O/L)',
  'Grade 11 (11 වසර - O/L)',
  'Grade 12 / 13 (A/L Science/Maths/Arts/Tech/Commerce)',
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-01',
    title: '🎒 School Season Pre-Booking Open!',
    message: 'Skip the shop rush! Upload your handwritten school book list now to receive your ready date & discounted quote.',
    type: 'school' as const,
    date: 'Just Now',
    read: false,
    link: '/school-season',
  },
  {
    id: 'notif-02',
    title: '⚡ Island-wide Cash on Delivery Active',
    message: 'Order any computer item, phone, or school item and pay cash at your doorstep across Sri Lanka!',
    type: 'promo' as const,
    date: '1 Hour Ago',
    read: false,
    link: '/',
  },
  {
    id: 'notif-03',
    title: '🚚 Store Pickup in Ambalangoda',
    message: 'Select in-store pickup to collect your prepared orders within 30 minutes at our main showroom.',
    type: 'product' as const,
    date: 'Yesterday',
    read: true,
    link: '/',
  },
];
