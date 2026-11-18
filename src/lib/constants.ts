import { Product, StudyCollection } from '@/types';

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

/**
 * Educational Collections & Past Paper Groups
 * Matching Sri Lankan school education structure:
 * - Pre-School & Kindergarten Worksheets
 * - G.C.E. Past Papers & Marking Schemes (A/L & O/L)
 * - Grade 6-13 Term Test Papers
 * - Grade 1-5 Papers & Scholarship Exam
 * - Fast Revision Short Notes & Formulas
 */
export const STUDY_COLLECTIONS: StudyCollection[] = [
  // 1. PRE-SCHOOL & KINDERGARTEN
  {
    id: 'preschool',
    section: 'preschool',
    sectionTitle: 'Pre-School & Kindergarten Worksheets',
    sectionTitleSi: 'පෙර පාසල් සහ මොන්ටිසෝරි ක්‍රියාකාරකම් & රූප කොළ',
    title: 'Pre-School Worksheets',
    titleSi: 'පෙර පාසල්',
    subLabel: 'Pre-School Activity & Coloring Sheets',
    gradeBadge: 'PRE-SCHOOL',
    numberDisplay: 'PRE',
    gradient: 'from-pink-500 via-rose-500 to-amber-500',
    badgeBg: 'bg-amber-400',
    badgeColor: 'text-slate-950',
    characterType: 'preschool',
    description: 'Printable dot-tracing handwriting, Sinhala hodiya, English alphabet, and fun coloring picture sheets.',
  },

  // 2. G.C.E. PAST PAPERS & MARKING SCHEMES
  {
    id: 'al_past',
    section: 'gce_past',
    sectionTitle: 'G.C.E. Past Papers & Marking Schemes',
    sectionTitleSi: 'අ.පො.ස. පසුගිය විභාග ප්‍රශ්න පත්‍ර සහ ලකුණු දීමේ පටිපාටි',
    title: 'G.C.E. A/L Past Papers',
    titleSi: 'අ.පො.ස. උසස් පෙළ',
    subLabel: 'G.C.E. A/L Past Papers & Marking Schemes',
    gradeBadge: 'G.C.E A/L',
    numberDisplay: 'A/L',
    gradient: 'from-amber-500 via-blue-700 to-indigo-900',
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    characterType: 'al',
    description: 'Official Department of Examinations A/L papers with marking schemes for Science, Maths, Commerce, Arts & Tech.',
  },
  {
    id: 'ol_past',
    section: 'gce_past',
    sectionTitle: 'G.C.E. Past Papers & Marking Schemes',
    sectionTitleSi: 'අ.පො.ස. පසුගිය විභාග ප්‍රශ්න පත්‍ර සහ ලකුණු දීමේ පටිපාටි',
    title: 'G.C.E. O/L Past Papers',
    titleSi: 'අ.පො.ස. සාමාන්‍ය පෙළ',
    subLabel: 'G.C.E. O/L Past Papers & Marking Schemes',
    gradeBadge: 'G.C.E O/L',
    numberDisplay: 'O/L',
    gradient: 'from-teal-500 via-cyan-600 to-blue-800',
    badgeBg: 'bg-cyan-500',
    badgeColor: 'text-slate-950',
    characterType: 'ol',
    description: 'Official G.C.E. O/L past exam papers with full marking schemes for all core and optional subjects.',
  },

  // 3. GRADE 6-13 TERM TEST PAPERS
  {
    id: 'grade_13',
    section: 'term_tests_secondary',
    sectionTitle: 'Grade 6-13 Term Test Papers',
    sectionTitleSi: '6 - 13 ශ්‍රේණි වාර විභාග ප්‍රශ්න පත්‍ර',
    title: 'Grade 13 Term Test Papers',
    titleSi: '13 ශ්‍රේණිය',
    subLabel: 'Grade 13 Term Test Papers',
    gradeBadge: 'GRADE 13',
    numberDisplay: '13',
    gradient: 'from-blue-600 via-indigo-700 to-slate-900',
    badgeBg: 'bg-blue-500',
    badgeColor: 'text-white',
    characterType: 'senior',
    description: 'Provincial and top school term evaluation papers for Grade 13 students.',
  },
  {
    id: 'grade_12',
    section: 'term_tests_secondary',
    sectionTitle: 'Grade 6-13 Term Test Papers',
    sectionTitleSi: '6 - 13 ශ්‍රේණි වාර විභාග ප්‍රශ්න පත්‍ර',
    title: 'Grade 12 Term Test Papers',
    titleSi: '12 ශ්‍රේණිය',
    subLabel: 'Grade 12 Term Test Papers',
    gradeBadge: 'GRADE 12',
    numberDisplay: '12',
    gradient: 'from-amber-600 via-indigo-700 to-blue-900',
    badgeBg: 'bg-amber-500',
    badgeColor: 'text-slate-950',
    characterType: 'senior',
    description: '1st, 2nd & 3rd term test papers with answers for Grade 12 students.',
  },
  {
    id: 'grade_11',
    section: 'term_tests_secondary',
    sectionTitle: 'Grade 6-13 Term Test Papers',
    sectionTitleSi: '6 - 13 ශ්‍රේණි වාර විභාග ප්‍රශ්න පත්‍ර',
    title: 'Grade 11 Term Test Papers',
    titleSi: '11 ශ්‍රේණිය',
    subLabel: 'Grade 11 Term Test Papers',
    gradeBadge: 'GRADE 11',
    numberDisplay: '11',
    gradient: 'from-cyan-600 via-blue-700 to-indigo-900',
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    characterType: 'ol',
    description: 'Essential term examination papers and model papers for Grade 11 O/L candidates.',
  },
  {
    id: 'grade_10',
    section: 'term_tests_secondary',
    sectionTitle: 'Grade 6-13 Term Test Papers',
    sectionTitleSi: '6 - 13 ශ්‍රේණි වාර විභාග ප්‍රශ්න පත්‍ර',
    title: 'Grade 10 Term Test Papers',
    titleSi: '10 ශ්‍රේණිය',
    subLabel: 'Grade 10 Term Test Papers',
    gradeBadge: 'GRADE 10',
    numberDisplay: '10',
    gradient: 'from-rose-600 via-red-600 to-amber-700',
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    characterType: 'junior',
    description: 'Southern Province and national schools 1st, 2nd and 3rd term test papers.',
  },
  {
    id: 'grade_9',
    section: 'term_tests_secondary',
    sectionTitle: 'Grade 6-13 Term Test Papers',
    sectionTitleSi: '6 - 13 ශ්‍රේණි වාර විභාග ප්‍රශ්න පත්‍ර',
    title: 'Grade 9 Term Test Papers',
    titleSi: '9 ශ්‍රේණිය',
    subLabel: 'Grade 9 Term Test Papers',
    gradeBadge: 'GRADE 09',
    numberDisplay: '9',
    gradient: 'from-purple-600 via-indigo-600 to-blue-800',
    badgeBg: 'bg-cyan-500',
    badgeColor: 'text-slate-950',
    characterType: 'junior',
    description: 'Grade 9 provincial examination papers for Science, Maths, Sinhala, English & History.',
  },
  {
    id: 'grade_8',
    section: 'term_tests_secondary',
    sectionTitle: 'Grade 6-13 Term Test Papers',
    sectionTitleSi: '6 - 13 ශ්‍රේණි වාර විභාග ප්‍රශ්න පත්‍ර',
    title: 'Grade 8 Term Test Papers',
    titleSi: '8 ශ්‍රේණිය',
    subLabel: 'Grade 8 Term Test Papers',
    gradeBadge: 'GRADE 08',
    numberDisplay: '8',
    gradient: 'from-emerald-500 via-teal-600 to-blue-800',
    badgeBg: 'bg-emerald-400',
    badgeColor: 'text-slate-950',
    characterType: 'junior',
    description: 'Grade 8 evaluation papers across all provinces with answers.',
  },
  {
    id: 'grade_7',
    section: 'term_tests_secondary',
    sectionTitle: 'Grade 6-13 Term Test Papers',
    sectionTitleSi: '6 - 13 ශ්‍රේණි වාර විභාග ප්‍රශ්න පත්‍ර',
    title: 'Grade 7 Term Test Papers',
    titleSi: '7 ශ්‍රේණිය',
    subLabel: 'Grade 7 Term Test Papers',
    gradeBadge: 'GRADE 07',
    numberDisplay: '7',
    gradient: 'from-amber-500 via-orange-600 to-red-700',
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    characterType: 'junior',
    description: 'Complete term test questions and answer sheets for Grade 7.',
  },
  {
    id: 'grade_6',
    section: 'term_tests_secondary',
    sectionTitle: 'Grade 6-13 Term Test Papers',
    sectionTitleSi: '6 - 13 ශ්‍රේණි වාර විභාග ප්‍රශ්න පත්‍ර',
    title: 'Grade 6 Term Test Papers',
    titleSi: '6 ශ්‍රේණිය',
    subLabel: 'Grade 6 Term Test Papers',
    gradeBadge: 'GRADE 06',
    numberDisplay: '6',
    gradient: 'from-indigo-600 via-purple-600 to-pink-700',
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    characterType: 'junior',
    description: 'Introductory secondary school term test evaluation papers for Grade 6.',
  },

  // 4. GRADE 1-5 PAPERS & SCHOLARSHIP EXAM
  {
    id: 'grade_5',
    section: 'primary_scholarship',
    sectionTitle: 'Grade 1-5 Papers & Scholarship Exam',
    sectionTitleSi: '1 - 5 ශ්‍රේණි ප්‍රශ්න පත්‍ර සහ 5 ශිෂ්‍යත්වය',
    title: 'Grade 5 Scholarship Papers',
    titleSi: '5 ශ්‍රේණිය',
    subLabel: 'Grade 5 Scholarship Exam Papers',
    gradeBadge: 'GRADE 05',
    numberDisplay: '5',
    gradient: 'from-teal-600 via-emerald-600 to-cyan-700',
    badgeBg: 'bg-emerald-400',
    badgeColor: 'text-slate-950',
    characterType: 'scholarship',
    description: 'Grade 5 Scholarship past exam papers, target model papers, and IQ practice tests.',
  },
  {
    id: 'grade_4',
    section: 'primary_scholarship',
    sectionTitle: 'Grade 1-5 Papers & Scholarship Exam',
    sectionTitleSi: '1 - 5 ශ්‍රේණි ප්‍රශ්න පත්‍ර සහ 5 ශිෂ්‍යත්වය',
    title: 'Grade 4 Term Test Papers',
    titleSi: '4 ශ්‍රේණිය',
    subLabel: 'Grade 4 Term Test Papers',
    gradeBadge: 'GRADE 04',
    numberDisplay: '4',
    gradient: 'from-red-600 via-amber-600 to-orange-700',
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    characterType: 'scholarship',
    description: 'Primary evaluation worksheets, Sinhala, Mathematics, and Environment papers for Grade 4.',
  },
  {
    id: 'grade_3',
    section: 'primary_scholarship',
    sectionTitle: 'Grade 1-5 Papers & Scholarship Exam',
    sectionTitleSi: '1 - 5 ශ්‍රේණි ප්‍රශ්න පත්‍ර සහ 5 ශිෂ්‍යත්වය',
    title: 'Grade 3 Term Test Papers',
    titleSi: '3 ශ්‍රේණිය',
    subLabel: 'Grade 3 Term Test Papers',
    gradeBadge: 'GRADE 03',
    numberDisplay: '3',
    gradient: 'from-purple-700 via-indigo-700 to-blue-800',
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    characterType: 'scholarship',
    description: 'Grade 3 student term tests, math worksheets, and reading exercises.',
  },
  {
    id: 'grade_2',
    section: 'primary_scholarship',
    sectionTitle: 'Grade 1-5 Papers & Scholarship Exam',
    sectionTitleSi: '1 - 5 ශ්‍රේණි ප්‍රශ්න පත්‍ර සහ 5 ශිෂ්‍යත්වය',
    title: 'Grade 2 Term Test Papers',
    titleSi: '2 ශ්‍රේණිය',
    subLabel: 'Grade 2 Term Test Papers',
    gradeBadge: 'GRADE 02',
    numberDisplay: '2',
    gradient: 'from-amber-600 via-cyan-600 to-blue-800',
    badgeBg: 'bg-emerald-400',
    badgeColor: 'text-slate-950',
    characterType: 'scholarship',
    description: 'Grade 2 activity sheets, writing practice, and basic math evaluation.',
  },
  {
    id: 'grade_1',
    section: 'primary_scholarship',
    sectionTitle: 'Grade 1-5 Papers & Scholarship Exam',
    sectionTitleSi: '1 - 5 ශ්‍රේණි ප්‍රශ්න පත්‍ර සහ 5 ශිෂ්‍යත්වය',
    title: 'Grade 1 Term Test Papers',
    titleSi: '1 ශ්‍රේණිය',
    subLabel: 'Grade 1 Term Test Papers',
    gradeBadge: 'GRADE 01',
    numberDisplay: '1',
    gradient: 'from-amber-500 via-orange-600 to-yellow-600',
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    characterType: 'scholarship',
    description: 'Grade 1 first step school evaluation, letter tracing, and numbers worksheets.',
  },

  // 5. FAST REVISION SHORT NOTES & FORMULAS
  {
    id: 'short_notes',
    section: 'notes',
    sectionTitle: 'Fast Revision Short Notes & Formulas',
    sectionTitleSi: 'කෙටි සටහන්, සූත්‍ර අත්පොත් සහ සිතියම්',
    title: 'O/L & A/L Short Notes',
    titleSi: 'කෙටි සටහන්',
    subLabel: 'Fast Revision Handbooks & Formulas',
    gradeBadge: 'SHORT NOTES',
    numberDisplay: 'NOTES',
    gradient: 'from-purple-600 via-violet-700 to-indigo-900',
    badgeBg: 'bg-purple-400',
    badgeColor: 'text-slate-950',
    characterType: 'notes',
    description: 'Summary revision booklets, science formulas, combined maths cheat sheets, and history maps.',
  },
];
