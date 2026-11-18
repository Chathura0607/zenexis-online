export type ProductCategory =
  | 'computer'
  | 'stationery'
  | 'mobile'
  | 'chargers'
  | 'school_bundles';

export interface Product {
  id: string;
  name: string;
  nameSi?: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  rating: number;
  reviewsCount: number;
  isFeatured?: boolean;
  isSchoolSeason?: boolean;
  specs?: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'pickup' | 'bank_transfer';
export type DeliveryMethod = 'islandwide_delivery' | 'store_pickup';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address?: string;
  city?: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  scheduledPickupDate?: string;
  scheduledPickupTime?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  isStockDeducted?: boolean;
  cancellationReason?: string;
  cancelledBy?: 'admin' | 'customer';
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedBookItem {
  name: string;
  quantity: number;
  unitPrice?: number;
  available: boolean;
  notes?: string;
}

export interface SchoolListRequest {
  id: string;
  requestNumber: string;
  customerName: string;
  phone: string;
  studentName?: string;
  schoolGrade?: string;
  schoolName?: string;
  handwrittenImageUrl?: string;
  parsedItems: ParsedBookItem[];
  missingItemsRequested: string[];
  notes?: string;
  status: 'pending_review' | 'quoted' | 'approved_by_customer' | 'preparing' | 'ready_for_pickup' | 'completed' | 'rejected';
  quotedTotal?: number;
  discount?: number;
  finalTotal?: number;
  scheduledPickupDate?: string;
  scheduledPickupTime?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'product' | 'promo' | 'school';
  date: string;
  read: boolean;
  link?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  city?: string;
  rating: number; // 1 - 5
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email?: string;
  phone: string;
  avatar?: string;
  authProvider: 'google' | 'password' | 'guest';
  address?: string;
  city?: string;
  savedAddresses?: Array<{
    id: string;
    label: string;
    address: string;
    city: string;
  }>;
  createdAt: string;
}

export type StudyResourceCategory =
  | 'term_test'
  | 'past_papers'
  | 'short_notes'
  | 'kids_sheets';

export type StudyCollectionId =
  | 'preschool'
  | 'al_past'
  | 'ol_past'
  | 'grade_13'
  | 'grade_12'
  | 'grade_11'
  | 'grade_10'
  | 'grade_9'
  | 'grade_8'
  | 'grade_7'
  | 'grade_6'
  | 'grade_5'
  | 'grade_4'
  | 'grade_3'
  | 'grade_2'
  | 'grade_1'
  | 'short_notes';

export interface StudyCollection {
  id: StudyCollectionId;
  section: 'preschool' | 'gce_past' | 'term_tests_secondary' | 'primary_scholarship' | 'notes';
  sectionTitle: string;
  sectionTitleSi: string;
  title: string;
  titleSi: string;
  subLabel: string;
  gradeBadge: string;
  numberDisplay: string;
  gradient: string;
  badgeBg: string;
  badgeColor: string;
  characterType: 'preschool' | 'scholarship' | 'junior' | 'senior' | 'al' | 'ol' | 'notes';
  description: string;
}

export interface StudyResource {
  id: string;
  title: string;
  titleSi?: string;
  category: StudyResourceCategory;
  collectionId?: StudyCollectionId | string;
  grade: string; // e.g. 'Grade 6', 'Grade 10', 'Grade 11 / O/L', 'A/L', 'Primary / Kids', 'Pre-School'
  subject: string; // e.g. 'Science', 'Mathematics', 'Sinhala', 'English', 'Coloring & Art'
  year?: string; // e.g. '2024', '2023'
  term?: string; // e.g. '1st Term', '2nd Term', '3rd Term'
  medium?: 'sinhala' | 'english' | 'tamil';
  downloadUrl: string; // Direct PDF or Google Drive URL
  thumbnail?: string; // Optional cover / preview image
  fileType?: string; // e.g. 'PDF Document', 'Image Sheet'
  fileSize?: string; // e.g. '1.4 MB', '850 KB'
  downloadsCount: number;
  isFeatured?: boolean;
  description?: string;
  createdAt: string;
}

