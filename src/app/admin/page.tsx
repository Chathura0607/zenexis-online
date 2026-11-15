'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  PackageIcon,
  ShoppingBagIcon,
  CameraIcon,
  SparklesIcon,
  Trash2Icon,
  PlusIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  MapPinIcon,
  WhatsAppIcon,
  PhoneIcon,
  TruckIcon,
  BellIcon,
  SearchIcon,
  UserIcon,
  LockIcon,
  KeyIcon,
  TrendingUpIcon,
  BarChartIcon,
  BookOpenIcon,
} from '@/components/icons';
import { Product, Order, SchoolListRequest, ProductCategory, OrderStatus, StudyResource, StudyResourceCategory } from '@/types';
import {
  getStoredProducts,
  saveStoredProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getStoredOrders,
  updateOrderStatus,
  getStoredSchoolRequests,
  updateSchoolRequest,
  addNotification,
  syncProductsWithFirestore,
  syncOrdersWithFirestore,
  syncSchoolRequestsWithFirestore,
  getStoredResources,
  saveStoredResources,
  addStudyResource,
  updateStudyResource,
  deleteStudyResource,
  syncResourcesWithFirestore,
} from '@/lib/storage';
import { analyzeProductWithAI, testGeminiApiKey } from '@/lib/gemini';
import { SHOP_CONFIG, CATEGORIES, SCHOOL_GRADES, getProductDisplayImage, getCategoryFallbackImage } from '@/lib/constants';
import { createWhatsAppUrl, generateStatusUpdateWhatsAppMessage } from '@/lib/whatsapp';
import {
  getAdminCredentials,
  setupInitialAdmin,
  verifyAdminLogin,
  changeAdminPassword,
} from '@/lib/security';
import { compressImageToDataUrl } from '@/lib/imageUtils';

import {
  getFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConnected,
  testFirestoreConnection,
  FirebaseConfig,
} from '@/lib/firebase';

export default function AdminPage() {
  // Authentication & Security
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@zenexis.lk');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Change Password Modal
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'school' | 'products' | 'resources' | 'ai_add' | 'broadcast' | 'firestore'>('orders');

  // Business Intelligence & Profit Analytics State
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'overview' | 'fast_moving' | 'low_stock' | 'unsold'>('overview');
  const [isUpdatingStock, setIsUpdatingStock] = useState<string | null>(null);
  const [actionFeedbackMsg, setActionFeedbackMsg] = useState<string | null>(null);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [schoolRequests, setSchoolRequests] = useState<SchoolListRequest[]>([]);
  const [studyResources, setStudyResources] = useState<StudyResource[]>([]);

  // Study Resources Management State
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<StudyResource | null>(null);
  const [resTitle, setResTitle] = useState('');
  const [resTitleSi, setResTitleSi] = useState('');
  const [resCategory, setResCategory] = useState<StudyResourceCategory>('term_test');
  const [resGrade, setResGrade] = useState('Grade 10');
  const [resSubject, setResSubject] = useState('Science');
  const [resYear, setResYear] = useState('2024');
  const [resTerm, setResTerm] = useState('2nd Term');
  const [resMedium, setResMedium] = useState<'sinhala' | 'english' | 'tamil'>('sinhala');
  const [resDownloadUrl, setResDownloadUrl] = useState('');
  const [resFileType, setResFileType] = useState('PDF Document');
  const [resFileSize, setResFileSize] = useState('1.5 MB');
  const [resDescription, setResDescription] = useState('');
  const [resIsFeatured, setResIsFeatured] = useState(false);
  const [isSavingResource, setIsSavingResource] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('all');

  // Admin Order Cancellation State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [adminCancelReason, setAdminCancelReason] = useState('Customer requested cancellation via call/WhatsApp');
  const [adminCustomCancelReason, setAdminCustomCancelReason] = useState('');
  const [isAdminCancelling, setIsAdminCancelling] = useState(false);

  // Restock Management State
  const [productToRestock, setProductToRestock] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [restockType, setRestockType] = useState<'add' | 'exact'>('add');
  const [restockExactQty, setRestockExactQty] = useState<number>(20);
  const [restockNewPrice, setRestockNewPrice] = useState<number | ''>('');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // AI Product Creator State
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiImageFileName, setAiImageFileName] = useState('');
  const [aiTextHint, setAiTextHint] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<ProductCategory>('computer');
  const [newProductPrice, setNewProductPrice] = useState<number>(2500);
  const [newProductOriginalPrice, setNewProductOriginalPrice] = useState<number>(3000);
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductTags, setNewProductTags] = useState('');
  const [newProductStock, setNewProductStock] = useState<number>(20);
  const [isProductSaved, setIsProductSaved] = useState(false);

  // Broadcast Notification Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Firestore & POS Sync State
  const [fbApiKey, setFbApiKey] = useState('AIzaSyBtzbf0yLgGFG1NGpJlMKjVra3PUByh-bw');
  const [fbProjectId, setFbProjectId] = useState('zenexis-pos');
  const [fbAuthDomain, setFbAuthDomain] = useState('zenexis-pos.firebaseapp.com');
  const [fbStorageBucket, setFbStorageBucket] = useState('zenexis-pos.appspot.com');
  const [fbAppId, setFbAppId] = useState('1:37370946244:web:8fbd63a812d49a77849f91');
  const [fbCollectionName, setFbCollectionName] = useState('products');
  const [fbSavedMsg, setFbSavedMsg] = useState(false);
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [testSyncResult, setTestSyncResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);

  const loadData = () => {
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    setSchoolRequests(getStoredSchoolRequests());
    setStudyResources(getStoredResources());
  };

  const syncAllFromCloud = async () => {
    setIsRefreshingCloud(true);
    try {
      await Promise.allSettled([
        syncOrdersWithFirestore(),
        syncSchoolRequestsWithFirestore(),
        syncProductsWithFirestore(),
        syncResourcesWithFirestore(),
      ]);
      loadData();
    } catch (err) {
      console.warn('Cloud sync error:', err);
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  useEffect(() => {
    // Check session auth
    if (sessionStorage.getItem('zenexis_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }

    // Check if initial admin account is setup
    const checkAdminSecurity = async () => {
      try {
        const creds = await getAdminCredentials();
        if (!creds || !creds.isSetup) {
          setIsFirstTimeSetup(true);
          setAdminEmail('admin@zenexis.lk');
        } else {
          setIsFirstTimeSetup(false);
          if (creds.email) setAdminEmail(creds.email);
        }
      } catch (err) {
        console.warn('Admin credentials check warning:', err);
      }
    };
    checkAdminSecurity();

    const savedGeminiKey = localStorage.getItem('zenexis_gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
    }
    const currentFb = getFirebaseConfig();
    if (currentFb) {
      if (currentFb.apiKey) setFbApiKey(currentFb.apiKey);
      if (currentFb.projectId && currentFb.projectId !== 'projectId') setFbProjectId(currentFb.projectId);
      if (currentFb.authDomain) setFbAuthDomain(currentFb.authDomain);
      if (currentFb.storageBucket) setFbStorageBucket(currentFb.storageBucket);
      if (currentFb.appId) setFbAppId(currentFb.appId);
      if (currentFb.collectionName) setFbCollectionName(currentFb.collectionName);
    }
    loadData();

    // Trigger initial background cloud sync from Firestore
    syncAllFromCloud();

    // Auto-poll Firestore every 20 seconds for incoming customer orders
    const pollInterval = setInterval(() => {
      syncOrdersWithFirestore().then(loadData);
      syncSchoolRequestsWithFirestore().then(loadData);
    }, 20000);

    window.addEventListener('zenexis_products_updated', loadData);
    window.addEventListener('zenexis_orders_updated', loadData);
    window.addEventListener('zenexis_school_updated', loadData);
    window.addEventListener('zenexis_resources_updated', loadData);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('zenexis_products_updated', loadData);
      window.removeEventListener('zenexis_orders_updated', loadData);
      window.removeEventListener('zenexis_school_updated', loadData);
      window.removeEventListener('zenexis_resources_updated', loadData);
    };
  }, []);

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isFirstTimeSetup) {
        const cleanEmail = adminEmail.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setAuthError('Please enter a valid admin email address.');
          setAuthLoading(false);
          return;
        }
        if (adminPassword.length < 6) {
          setAuthError('Master password must be at least 6 characters long.');
          setAuthLoading(false);
          return;
        }
        if (adminPassword !== confirmPassword) {
          setAuthError('Passwords do not match. Please retype carefully.');
          setAuthLoading(false);
          return;
        }

        const res = await setupInitialAdmin(cleanEmail, adminPassword);
        if (res.success) {
          setIsAuthenticated(true);
          sessionStorage.setItem('zenexis_admin_auth', 'true');
          setIsFirstTimeSetup(false);
          setAdminPassword('');
          setConfirmPassword('');
        } else {
          setAuthError(res.error || 'Failed to setup admin account.');
        }
      } else {
        const res = await verifyAdminLogin(adminEmail, adminPassword);
        if (res.success) {
          setIsAuthenticated(true);
          sessionStorage.setItem('zenexis_admin_auth', 'true');
          setAdminPassword('');
        } else if (res.isSetupNeeded) {
          setIsFirstTimeSetup(true);
          setAuthError('No admin account found. Please initialize master admin setup.');
        } else {
          setAuthError(res.error || 'Incorrect admin email or password. Please try again.');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess(false);

    if (!currentPassword) {
      setChangePasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeAdminPassword(currentPassword, newPassword);
      if (res.success) {
        setChangePasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setChangePasswordSuccess(false);
        }, 1800);
      } else {
        setChangePasswordError(res.error || 'Failed to change password.');
      }
    } catch (err: any) {
      setChangePasswordError(err?.message || 'Password update failed.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('zenexis_admin_auth');
  };

  // AI Gemini Key management
  const handleApiKeyChange = (val: string) => {
    setGeminiApiKey(val);
    const trimmed = val.trim();
    if (trimmed) {
      try {
        localStorage.setItem('zenexis_gemini_api_key', trimmed);
      } catch {}
    } else {
      try {
        localStorage.removeItem('zenexis_gemini_api_key');
      } catch {}
    }
    setGeminiStatus(null);
  };

  const handleSaveGeminiKey = async (keyToSave?: string) => {
    const key = (keyToSave !== undefined ? keyToSave : geminiApiKey).trim();
    if (!key) {
      setGeminiStatus({ success: false, message: 'Please enter or paste your Gemini API key.' });
      return;
    }

    // Always immediately persist key
    try {
      localStorage.setItem('zenexis_gemini_api_key', key);
    } catch {}
    setGeminiApiKey(key);
    setIsTestingGemini(true);
    setGeminiStatus(null);

    try {
      const res = await testGeminiApiKey(key);
      if (res.success) {
        setGeminiStatus({ success: true, message: 'Google Gemini Vision Connected & Verified Successfully!' });
      } else {
        setGeminiStatus({ success: false, message: res.message });
      }
    } catch (err: any) {
      setGeminiStatus({ success: false, message: `Failed to connect: ${err.message || err}` });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleRemoveGeminiKey = () => {
    try {
      localStorage.removeItem('zenexis_gemini_api_key');
    } catch {}
    setGeminiApiKey('');
    setGeminiStatus(null);
  };

  // AI Image upload & analysis
  const handleAiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiImageFileName(file.name);
      try {
        const compressed = await compressImageToDataUrl(file, 800, 800, 0.75);
        setAiImagePreview(compressed);
        setIsProductSaved(false);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAiImagePreview(reader.result as string);
          setIsProductSaved(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!aiImagePreview) return;
    setIsAiAnalyzing(true);
    setGeminiStatus(null);
    try {
      const hint = aiTextHint.trim() || aiImageFileName;
      // Pass geminiApiKey explicitly from state
      const analysis = await analyzeProductWithAI(aiImagePreview, hint, geminiApiKey);
      setNewProductName(analysis.name);
      setNewProductCategory(analysis.category);
      setNewProductPrice(analysis.price);
      setNewProductOriginalPrice(analysis.originalPrice || Math.round(analysis.price * 1.2));
      setNewProductDesc(analysis.description);
      setNewProductTags(analysis.tags.join(', '));
      setGeminiStatus({
        success: true,
        message: '✨ Product details successfully generated and ready to review!',
      });
    } catch (err: any) {
      console.error(err);
      if (err.message === 'GEMINI_API_KEY_REQUIRED') {
        setGeminiStatus({
          success: false,
          message: '🔑 Google Gemini API Key Required! Please paste your key from Google AI Studio above.',
        });
      } else {
        setGeminiStatus({
          success: false,
          message: `AI Vision notice: ${err.message || 'Details auto-filled with smart template. Please adjust fields as needed.'}`,
        });
      }
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSaveAiProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !aiImagePreview) {
      alert('Please provide product photo and name.');
      return;
    }

    setIsAiAnalyzing(true);

    const tagsArray = newProductTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Ensure image is compressed (<80KB) to guarantee smooth cloud sync with Firestore
    const optimizedImage = await compressImageToDataUrl(aiImagePreview, 800, 800, 0.75);

    const created: Product = {
      id: `prod-${Date.now()}`,
      name: newProductName.trim(),
      category: newProductCategory,
      price: Number(newProductPrice) || 1000,
      originalPrice: Number(newProductOriginalPrice) || undefined,
      description: newProductDesc.trim() || 'Quality item from Zenexis inventory.',
      image: optimizedImage,
      inStock: true,
      stockCount: Number(newProductStock) || 10,
      tags: tagsArray.length > 0 ? tagsArray : ['zenexis', newProductCategory],
      rating: 5.0,
      reviewsCount: 1,
      isFeatured: true,
    };

    const res = await addProduct(created);
    setIsAiAnalyzing(false);
    setIsProductSaved(true);

    if (res && res.error) {
      console.warn('Firestore sync warning:', res.error);
    }

    setTimeout(() => {
      // Reset form
      setAiImagePreview(null);
      setNewProductName('');
      setNewProductDesc('');
      setNewProductTags('');
      setIsProductSaved(false);
      setActiveTab('products');
    }, 1200);
  };

  const openRestockModal = (p: Product) => {
    setProductToRestock(p);
    setRestockAmount(10);
    setRestockType('add');
    setRestockExactQty(p.stockCount || 0);
    setRestockNewPrice(p.price);
  };

  const handleConfirmRestock = async () => {
    if (!productToRestock) return;
    setIsSubmittingRestock(true);

    const calculatedStock =
      restockType === 'add'
        ? Math.max(0, (productToRestock.stockCount || 0) + (Number(restockAmount) || 0))
        : Math.max(0, Number(restockExactQty) || 0);

    const updated: Product = {
      ...productToRestock,
      stockCount: calculatedStock,
      inStock: calculatedStock > 0,
      price: restockNewPrice !== '' && Number(restockNewPrice) > 0 ? Number(restockNewPrice) : productToRestock.price,
    };

    const res = await updateProduct(updated);
    setIsSubmittingRestock(false);

    if (res.success) {
      loadData();
      setActionFeedbackMsg(
        `✓ Restocked! ${productToRestock.name} updated to ${calculatedStock} units (${calculatedStock > 0 ? 'In Stock ✅' : 'Out of Stock ❌'}) and synced to Cloud.`
      );
      setProductToRestock(null);
      setTimeout(() => setActionFeedbackMsg(null), 4500);
    } else {
      alert(`Failed to restock product: ${res.error || 'Unknown error'}`);
    }
  };

  const handleToggleStock = async (product: Product) => {
    if (!product.inStock) {
      const newStock = product.stockCount > 0 ? product.stockCount : 10;
      const updated: Product = {
        ...product,
        inStock: true,
        stockCount: newStock,
      };
      await updateProduct(updated);
      loadData();
      setActionFeedbackMsg(`✓ Marked In Stock (${newStock} units) for ${product.name}.`);
      setTimeout(() => setActionFeedbackMsg(null), 3500);
    } else {
      const updated: Product = {
        ...product,
        inStock: false,
        stockCount: 0,
      };
      await updateProduct(updated);
      loadData();
      setActionFeedbackMsg(`✓ Marked Out of Stock for ${product.name}.`);
      setTimeout(() => setActionFeedbackMsg(null), 3500);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product from Zenexis catalog?')) {
      deleteProduct(id);
      loadData();
    }
  };

  // Study Resource Management Handlers
  const openAddResourceModal = (item?: StudyResource) => {
    if (item) {
      setEditingResource(item);
      setResTitle(item.title);
      setResTitleSi(item.titleSi || '');
      setResCategory(item.category);
      setResGrade(item.grade);
      setResSubject(item.subject);
      setResYear(item.year || '2024');
      setResTerm(item.term || '2nd Term');
      setResMedium(item.medium || 'sinhala');
      setResDownloadUrl(item.downloadUrl);
      setResFileType(item.fileType || 'PDF Document');
      setResFileSize(item.fileSize || '1.5 MB');
      setResDescription(item.description || '');
      setResIsFeatured(Boolean(item.isFeatured));
    } else {
      setEditingResource(null);
      setResTitle('');
      setResTitleSi('');
      setResCategory('term_test');
      setResGrade('Grade 10');
      setResSubject('Science');
      setResYear('2024');
      setResTerm('2nd Term');
      setResMedium('sinhala');
      setResDownloadUrl('');
      setResFileType('PDF Document');
      setResFileSize('1.5 MB');
      setResDescription('');
      setResIsFeatured(false);
    }
    setIsResourceModalOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resDownloadUrl.trim()) {
      alert('Please provide resource title and download link URL.');
      return;
    }

    setIsSavingResource(true);

    const resourceData: StudyResource = {
      id: editingResource ? editingResource.id : `res-${Date.now()}`,
      title: resTitle.trim(),
      titleSi: resTitleSi.trim() || undefined,
      category: resCategory,
      grade: resGrade,
      subject: resSubject.trim() || 'General',
      year: resYear.trim() || undefined,
      term: resTerm.trim() || undefined,
      medium: resMedium,
      downloadUrl: resDownloadUrl.trim(),
      fileType: resFileType.trim() || 'PDF Document',
      fileSize: resFileSize.trim() || '1.5 MB',
      description: resDescription.trim() || undefined,
      downloadsCount: editingResource ? editingResource.downloadsCount : 0,
      isFeatured: resIsFeatured,
      createdAt: editingResource ? editingResource.createdAt : new Date().toISOString(),
    };

    let res;
    if (editingResource) {
      res = await updateStudyResource(resourceData);
    } else {
      res = await addStudyResource(resourceData);
    }

    setIsSavingResource(false);

    if (res.success) {
      loadData();
      setIsResourceModalOpen(false);
      setActionFeedbackMsg(
        editingResource
          ? `✓ Resource "${resourceData.title}" updated successfully!`
          : `✓ Resource "${resourceData.title}" published & synced to cloud!`
      );
      setTimeout(() => setActionFeedbackMsg(null), 4500);
    } else {
      alert(`Failed to save resource: ${res.error || 'Unknown error'}`);
    }
  };

  const handleDeleteResource = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}" from study resources?`)) {
      await deleteStudyResource(id);
      loadData();
      setActionFeedbackMsg(`✓ Deleted "${title}".`);
      setTimeout(() => setActionFeedbackMsg(null), 3500);
    }
  };

  const handleUpdateOrderStatus = (order: Order, newStatus: OrderStatus) => {
    updateOrderStatus(order.id, newStatus);
    loadData();
    if (newStatus === 'approved' && !order.isStockDeducted) {
      setActionFeedbackMsg(`✓ Order #${order.orderNumber} Approved! Product inventory stock deducted automatically.`);
      setTimeout(() => setActionFeedbackMsg(null), 4500);
    } else if (newStatus === 'cancelled' && order.isStockDeducted) {
      setActionFeedbackMsg(`✓ Order #${order.orderNumber} Cancelled. Product inventory stock restored automatically.`);
      setTimeout(() => setActionFeedbackMsg(null), 4500);
    } else {
      setActionFeedbackMsg(`✓ Order #${order.orderNumber} status updated to ${newStatus.replace(/_/g, ' ')}.`);
      setTimeout(() => setActionFeedbackMsg(null), 4000);
    }
  };

  const handleSetPickupSlot = (order: Order, date: string, time: string) => {
    updateOrderStatus(order.id, order.status, {
      scheduledPickupDate: date,
      scheduledPickupTime: time,
    });
  };

  const handleConfirmAdminCancel = () => {
    if (!orderToCancel) return;
    setIsAdminCancelling(true);
    const finalReason =
      adminCancelReason === 'Other'
        ? adminCustomCancelReason.trim() || 'Admin cancelled order'
        : adminCancelReason;

    updateOrderStatus(orderToCancel.id, 'cancelled', {
      cancellationReason: finalReason,
      cancelledBy: 'admin',
      cancelledAt: new Date().toISOString(),
    });

    loadData();
    setIsAdminCancelling(false);
    setOrderToCancel(null);
    setActionFeedbackMsg(`✓ Order #${orderToCancel.orderNumber} Cancelled. Any deducted product stock has been restored.`);
    setTimeout(() => setActionFeedbackMsg(null), 4500);
  };

  const handleUpdateSchoolStatus = (
    req: SchoolListRequest,
    status: SchoolListRequest['status'],
    date?: string,
    time?: string
  ) => {
    updateSchoolRequest({
      ...req,
      status,
      scheduledPickupDate: date || req.scheduledPickupDate,
      scheduledPickupTime: time || req.scheduledPickupTime,
    });
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    addNotification({
      id: `notif-${Date.now()}`,
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      type: 'promo',
      date: 'Just Now',
      read: false,
      link: '/',
    });

    setBroadcastSent(true);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSent(false), 2500);
  };

  const handleSaveFirebaseConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fbProjectId.trim() || !fbApiKey.trim()) {
      alert('Please enter at least Project ID and API Key.');
      return;
    }

    saveFirebaseConfig({
      apiKey: fbApiKey.trim(),
      projectId: fbProjectId.trim(),
      authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.appspot.com`,
      messagingSenderId: '37370946244',
      appId: fbAppId.trim(),
      collectionName: fbCollectionName.trim() || 'products',
    });

    setFbSavedMsg(true);
    setTimeout(() => setFbSavedMsg(false), 3000);
  };

  const handleTestSync = async () => {
    if (!fbProjectId.trim() || !fbApiKey.trim()) {
      alert('Please enter your Firebase Project ID and API Key before testing.');
      return;
    }

    // Auto-save configuration first
    handleSaveFirebaseConfig();

    setIsTestingSync(true);
    setTestSyncResult(null);

    try {
      const res = await testFirestoreConnection();
      if (res.success) {
        await syncProductsWithFirestore();
        loadData();
      }
      setTestSyncResult(res);
    } catch (err: any) {
      setTestSyncResult({
        success: false,
        message: err?.message || 'Sync failed. Please check network and permissions.',
      });
    } finally {
      setIsTestingSync(false);
    }
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const pendingSchoolCount = schoolRequests.filter((s) => s.status === 'pending_review').length;

  // Business Intelligence & Profit Calculations
  const now = new Date();
  const analyticsFilteredOrders = orders.filter((o) => {
    if (o.status === 'cancelled') return false;
    if (analyticsTimeframe === 'all') return true;
    const orderDate = new Date(o.createdAt);
    const diffMs = now.getTime() - orderDate.getTime();
    if (analyticsTimeframe === 'today') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (analyticsTimeframe === '7days') {
      return diffMs <= 7 * 24 * 60 * 60 * 1000;
    }
    if (analyticsTimeframe === '30days') {
      return diffMs <= 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const analyticsGrossRevenue = analyticsFilteredOrders.reduce((sum, o) => sum + o.total, 0);
  const analyticsTotalOrders = analyticsFilteredOrders.length;
  const analyticsCompletedOrders = analyticsFilteredOrders.filter((o) => o.status === 'completed').length;
  const analyticsPendingOrders = analyticsFilteredOrders.filter((o) => o.status === 'pending').length;
  const analyticsAov = analyticsTotalOrders > 0 ? Math.round(analyticsGrossRevenue / analyticsTotalOrders) : 0;

  // Wholesale Cost & Profit estimation
  let analyticsEstimatedCost = 0;
  analyticsFilteredOrders.forEach((o) => {
    o.items.forEach((it) => {
      const p = it.product;
      const unitCost = p.originalPrice && p.originalPrice > p.price
        ? Math.round(p.price * 0.72)
        : Math.round(p.price * 0.70);
      analyticsEstimatedCost += unitCost * it.quantity;
    });
  });
  const analyticsEstimatedProfit = Math.max(0, analyticsGrossRevenue - analyticsEstimatedCost);
  const analyticsProfitMarginPct = analyticsGrossRevenue > 0
    ? ((analyticsEstimatedProfit / analyticsGrossRevenue) * 100).toFixed(1)
    : '0.0';

  // Fast-Moving Items aggregation across orders
  const productSalesMap = new Map<
    string,
    { product: Product; unitsSold: number; totalRevenue: number; ordersCount: number }
  >();
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    o.items.forEach((it) => {
      const key = it.product.id || it.product.name;
      const existing = productSalesMap.get(key) || {
        product: it.product,
        unitsSold: 0,
        totalRevenue: 0,
        ordersCount: 0,
      };
      existing.unitsSold += it.quantity;
      existing.totalRevenue += it.quantity * it.product.price;
      existing.ordersCount += 1;
      productSalesMap.set(key, existing);
    });
  });

  const fastMovingProducts = Array.from(productSalesMap.values()).sort(
    (a, b) => b.unitsSold - a.unitsSold || b.totalRevenue - a.totalRevenue
  );

  // Low Stock & Out of Stock items
  const lowStockProducts = products
    .filter((p) => !p.inStock || p.stockCount <= 5)
    .sort((a, b) => a.stockCount - b.stockCount);

  // Unsold / Slow-Moving Items ("Wikennem nthi items")
  const unsoldProducts = products.filter((p) => {
    const sales = productSalesMap.get(p.id) || productSalesMap.get(p.name);
    return !sales || sales.unitsSold === 0;
  });

  const unsoldTiedUpCapital = unsoldProducts.reduce(
    (sum, p) => sum + p.price * (p.stockCount || 0),
    0
  );

  // Delivery Channel Distribution
  const codOrders = analyticsFilteredOrders.filter((o) => o.deliveryMethod !== 'store_pickup');
  const pickupOrders = analyticsFilteredOrders.filter((o) => o.deliveryMethod === 'store_pickup');
  const codRevenue = codOrders.reduce((sum, o) => sum + o.total, 0);
  const pickupRevenue = pickupOrders.reduce((sum, o) => sum + o.total, 0);

  // Day-to-Day 7-Day Chart Data
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const dayOrders = orders.filter((o) => o.status !== 'cancelled' && o.createdAt && o.createdAt.startsWith(dateStr));
    const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      date: dateStr,
      label: dayLabel,
      ordersCount: dayOrders.length,
      revenue: dayRev,
    };
  });
  const maxDayRevenue = Math.max(...last7DaysData.map((d) => d.revenue), 1000);

  // Handlers for Restock, Clearance, Broadcast
  const handleQuickRestock = async (product: Product, addAmount: number) => {
    setIsUpdatingStock(product.id);
    const newCount = Math.max(0, (product.stockCount || 0) + addAmount);
    const updated: Product = {
      ...product,
      stockCount: newCount,
      inStock: newCount > 0,
    };
    const res = await updateProduct(updated);
    setIsUpdatingStock(null);
    if (res.success) {
      loadData();
      setActionFeedbackMsg(`✓ Restocked! ${product.name} now has ${newCount} units in stock.`);
      setTimeout(() => setActionFeedbackMsg(null), 4000);
    } else {
      alert(`Failed to update stock: ${res.error || 'Unknown error'}`);
    }
  };

  const handleApplyClearanceDiscount = async (product: Product, discountPct = 15) => {
    setIsUpdatingStock(product.id);
    const discountedPrice = Math.round(product.price * (1 - discountPct / 100));
    const updated: Product = {
      ...product,
      originalPrice: product.originalPrice && product.originalPrice > product.price ? product.originalPrice : product.price,
      price: discountedPrice,
      tags: Array.from(new Set([...(product.tags || []), 'clearance', 'deal', 'discount'])),
    };
    const res = await updateProduct(updated);
    setIsUpdatingStock(null);
    if (res.success) {
      setActionFeedbackMsg(`✓ Applied ${discountPct}% Clearance Sale! New price: Rs. ${discountedPrice.toLocaleString()} (was Rs. ${product.price.toLocaleString()})`);
      setTimeout(() => setActionFeedbackMsg(null), 4000);
    } else {
      alert(`Failed to apply discount: ${res.error || 'Unknown error'}`);
    }
  };

  const handlePromoteProductInBroadcast = (product: Product) => {
    setBroadcastTitle(`🔥 Special Clearance Deal: ${product.name}`);
    setBroadcastMessage(`Special discount offer now available at Zenexis Ambalangoda! Price: Rs. ${product.price.toLocaleString()} only. Island-wide cash on delivery available.`);
    setActiveTab('broadcast');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4 relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
        {/* Ambient Glowing Background Orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-cyan-950/40 text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
          {/* Logo Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/30 transform hover:scale-105 transition">
            <span className="text-2xl font-black">Z</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold tracking-wide uppercase mb-2">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>{isFirstTimeSetup ? 'Initial Security Setup' : 'Staff Management Portal'}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {isFirstTimeSetup ? 'Setup Master Admin' : 'Zenexis Admin Access'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isFirstTimeSetup
                ? 'Create your master admin email & password. Passwords are cryptographically salted and hashed.'
                : 'Ambalangoda Showroom • Inventory, AI & Orders Portal'}
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-in fade-in">
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Email Address:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="admin@zenexis.lk"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {isFirstTimeSetup ? 'Create Master Password:' : 'Admin Password:'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAuthError('');
                  }}
                  placeholder={isFirstTimeSetup ? 'Min 6 characters' : 'Enter master password'}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none transition"
                />
              </div>
            </div>

            {isFirstTimeSetup && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Confirm Master Password:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Repeat master password"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-2xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-sm transition transform active:scale-98 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 mt-2"
            >
              <LockIcon className="w-4 h-4" />
              <span>
                {authLoading
                  ? 'Verifying Cryptographic Hash...'
                  : isFirstTimeSetup
                  ? 'Save Credentials & Open Dashboard'
                  : 'Secure Admin Unlock'}
              </span>
            </button>
          </form>

          {/* Reset / Setup switch */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setIsFirstTimeSetup(!isFirstTimeSetup);
                setAuthError('');
              }}
              className="text-[11px] text-slate-400 hover:text-cyan-400 transition block mx-auto font-medium"
            >
              {isFirstTimeSetup
                ? '← Already configured? Sign in with existing credentials'
                : 'First-time setup or configure master credentials'}
            </button>

            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-cyan-400 transition inline-flex items-center justify-center gap-1"
            >
              <span>← Return to Public Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Admin Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 shadow-lg shadow-black/20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-cyan-500/25">
              Z
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white tracking-tight text-base sm:text-lg">ZENEXIS ADMIN</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-400">
                  <ShieldCheckIcon className="w-3 h-3" />
                  <span>Control Center</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 -mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">Showroom Online</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Ambalangoda, Sri Lanka</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={syncAllFromCloud}
              disabled={isRefreshingCloud}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-400 transition font-bold flex items-center gap-1.5"
              title="Sync with Google Cloud Firestore"
            >
              <span className={isRefreshingCloud ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
              <span className="hidden sm:inline">{isRefreshingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>
            <button
              onClick={() => setActiveTab('ai_add')}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition transform active:scale-95"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>AI Photo Add</span>
            </button>
            <a
              href={
                typeof window !== 'undefined' && window.location.hostname.startsWith('zenexis-admin')
                  ? 'https://zenexis-online.vercel.app'
                  : '/'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 hover:text-white transition font-medium flex items-center gap-1"
            >
              <span>Live Store ↗</span>
            </a>
            <button
              onClick={() => {
                setIsChangePasswordOpen(true);
                setChangePasswordError('');
                setChangePasswordSuccess(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 hover:text-white transition font-medium flex items-center gap-1.5"
              title="Change Master Admin Password"
            >
              <KeyIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Change Password</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 border border-rose-500/30 transition font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Global Action Feedback Toast */}
        {actionFeedbackMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <span>{actionFeedbackMsg}</span>
            </div>
            <button
              onClick={() => setActionFeedbackMsg(null)}
              className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        )}
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('analytics')}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                Rs.
              </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              Rs. {totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-500">Gross Sales</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                ~Rs. {analyticsEstimatedProfit.toLocaleString()} Profit (Est.)
              </span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('orders')}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Customer Orders</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <PackageIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white tracking-tight">{orders.length}</span>
              {pendingOrdersCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                  {pendingOrdersCount} Action Needed
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 font-semibold">All Caught Up</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Store pickup & island delivery
            </p>
          </div>

          <div
            onClick={() => setActiveTab('school')}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">School Booklists</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-sm">
                🎒
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-400 tracking-tight">
                {schoolRequests.length}
              </span>
              {pendingSchoolCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-pulse">
                  {pendingSchoolCount} Pending
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 font-semibold">Processed</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Handwritten paper lists & quotes
            </p>
          </div>

          <div
            onClick={() => setActiveTab('products')}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Catalog Inventory</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <ShoppingBagIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-cyan-400 tracking-tight">
                {products.length} Items
              </span>
              {lowStockProducts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                  {lowStockProducts.length} Low
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {products.filter((p) => p.inStock).length} In Stock • {products.filter((p) => !p.inStock).length} Out of Stock
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto no-scrollbar shadow-inner">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-black'
                : 'text-emerald-400 hover:text-white hover:bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            <TrendingUpIcon className="w-4 h-4" />
            <span>📊 Insights & Profit</span>
            {lowStockProducts.length > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                {lowStockProducts.length} low
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PackageIcon className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('school')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'school'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🎒 School Booklists ({schoolRequests.length})</span>
            {pendingSchoolCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full">
                {pendingSchoolCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'resources'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 font-black'
                : 'text-purple-400 hover:text-white hover:bg-purple-500/10 border border-purple-500/20'
            }`}
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>Free Study Hub ({studyResources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_add')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ai_add'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 font-black'
                : 'text-purple-400 hover:text-white hover:bg-purple-500/10 border border-purple-500/20'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>AI Product Photo Add</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BellIcon className="w-4 h-4" />
            <span>Push Broadcast</span>
          </button>

          <button
            onClick={() => setActiveTab('firestore')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'firestore'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black'
                : 'text-amber-400 hover:text-white hover:bg-amber-500/10 border border-amber-500/20'
            }`}
          >
            <span>⚡ Firestore & POS Sync</span>
          </button>
        </div>

        {/* TAB 0: BUSINESS INTELLIGENCE & PROFIT ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Header & Timeframe Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/70 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <BarChartIcon className="w-5 h-5 text-emerald-400" />
                    <span>Business Intelligence & Profit Control</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    Live Analytics
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ව්‍යාපාරික දත්ත, ලාභ ගණනය කිරීම්, වැඩිපුර විකිණෙන භාණ්ඩ (Fast Movers) සහ නොවැටුණු තොග (Dead Stock) කළමනාකරණය
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                {/* Timeframe Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'all', label: 'All Time (සමස්ත)' },
                    { id: 'today', label: 'Today (අද)' },
                    { id: '7days', label: 'Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days' },
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setAnalyticsTimeframe(tf.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        analyticsTimeframe === tf.id
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition flex items-center gap-1.5 shrink-0"
                  title="Print daily financial summary"
                >
                  <span>🖨️</span>
                  <span>Print Slip</span>
                </button>
              </div>
            </div>

            {/* 4 Core Financial & Velocity KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">Gross Sales Revenue</span>
                  <span className="text-emerald-400 font-bold">Rs.</span>
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  Rs. {analyticsGrossRevenue.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500">
                  {analyticsTotalOrders} orders • Avg: Rs. {analyticsAov.toLocaleString()} / order
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">Estimated Net Profit</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                    +{analyticsProfitMarginPct}% Margin
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  Rs. {analyticsEstimatedProfit.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500">
                  Estimated wholesale inventory cost ~72%
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">Fulfillment Velocity</span>
                  <span className="text-cyan-400 font-bold">
                    {analyticsTotalOrders > 0
                      ? Math.round((analyticsCompletedOrders / analyticsTotalOrders) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {analyticsCompletedOrders} Completed
                </div>
                <p className="text-[11px] text-slate-500">
                  {analyticsPendingOrders} currently pending fulfillment
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">Inventory Alert Radar</span>
                  {lowStockProducts.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold text-[10px] border border-rose-500/20">
                      {lowStockProducts.length} Alert
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-[10px] font-bold">Healthy ✓</span>
                  )}
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {lowStockProducts.length} Low / {unsoldProducts.length} Unsold
                </div>
                <p className="text-[11px] text-slate-500">
                  Rs. {unsoldTiedUpCapital.toLocaleString()} capital tied in unsold stock
                </p>
              </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setAnalyticsSubTab('overview')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  analyticsSubTab === 'overview'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <BarChartIcon className="w-3.5 h-3.5" />
                <span>Day-to-Day Trends & Channels</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalyticsSubTab('fast_moving')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  analyticsSubTab === 'fast_moving'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>🔥 Fast-Going Products ({fastMovingProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalyticsSubTab('low_stock')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  analyticsSubTab === 'low_stock'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>⚠️ Low Stock Alert ({lowStockProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalyticsSubTab('unsold')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  analyticsSubTab === 'unsold'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>💤 Slow-Moving / Dead Stock ({unsoldProducts.length})</span>
              </button>
            </div>

            {/* SUB-TAB 1: DAY-TO-DAY TRENDS & CHANNELS */}
            {analyticsSubTab === 'overview' && (
              <div className="space-y-6">
                {/* 7-Day Revenue Histogram */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>📅 Day-to-Day Sales Velocity (Last 7 Days)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        දිනෙන් දින ලැබුණු orders සංඛ්‍යාව සහ මුළු ආදායම
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      Total 7-day sales: Rs. {last7DaysData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 pb-2 items-end min-h-[220px]">
                    {last7DaysData.map((d, idx) => {
                      const heightPct = Math.max(12, Math.round((d.revenue / maxDayRevenue) * 100));
                      const isToday = idx === 6;

                      return (
                        <div key={d.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                          {/* Amount */}
                          <span className="text-[10px] font-mono text-slate-400 group-hover:text-emerald-400 transition font-bold text-center">
                            {d.revenue > 0 ? `Rs. ${d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue}` : '0'}
                          </span>

                          {/* Bar */}
                          <div className="w-full max-w-[48px] bg-slate-950 rounded-xl h-36 flex items-end p-1 border border-slate-800/80 group-hover:border-emerald-500/40 transition">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-lg transition-all duration-500 ${
                                isToday
                                  ? 'bg-gradient-to-t from-emerald-600 to-cyan-400 shadow-lg shadow-emerald-500/30'
                                  : d.revenue > 0
                                  ? 'bg-gradient-to-t from-slate-800 to-emerald-500'
                                  : 'bg-slate-800/40'
                              }`}
                            />
                          </div>

                          {/* Order badge */}
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                              d.ordersCount > 0
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {d.ordersCount} ord
                          </span>

                          {/* Day Label */}
                          <span className={`text-[10px] font-bold truncate ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {isToday ? 'Today' : d.label.split(',')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Channel Distribution & Status Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Channel Distribution */}
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <TruckIcon className="w-4 h-4 text-cyan-400" />
                      <span>Sales Channel Distribution</span>
                    </h3>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                            <TruckIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">Island-wide Courier (COD)</h4>
                            <p className="text-[11px] text-slate-400">{codOrders.length} orders delivered</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-cyan-400 font-mono block">
                            Rs. {codRevenue.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {analyticsGrossRevenue > 0
                              ? Math.round((codRevenue / analyticsGrossRevenue) * 100)
                              : 0}% of revenue
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                            <MapPinIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">Ambalangoda Showroom Pickup</h4>
                            <p className="text-[11px] text-slate-400">{pickupOrders.length} walk-in orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-400 font-mono block">
                            Rs. {pickupRevenue.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {analyticsGrossRevenue > 0
                              ? Math.round((pickupRevenue / analyticsGrossRevenue) * 100)
                              : 0}% of revenue
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Funnel */}
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-purple-400" />
                      <span>Live Order Status Funnel</span>
                    </h3>

                    <div className="space-y-2">
                      {[
                        { label: 'Pending Approval', status: 'pending', color: 'bg-amber-400' },
                        { label: 'Confirmed & Approved', status: 'approved', color: 'bg-blue-400' },
                        { label: 'Packing & In Preparation', status: 'processing', color: 'bg-purple-400' },
                        { label: 'Ready / Dispatched', status: 'out_for_delivery', color: 'bg-cyan-400' },
                        { label: 'Successfully Completed', status: 'completed', color: 'bg-emerald-400' },
                      ].map((st) => {
                        const count = orders.filter((o) => o.status === st.status).length;
                        const pct = orders.length > 0 ? (count / orders.length) * 100 : 0;

                        return (
                          <div key={st.status} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-medium">{st.label}</span>
                              <span className="text-white font-bold font-mono">{count}</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full ${st.color} transition-all duration-300`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: FAST-GOING PRODUCTS (🔥 Top Sellers) */}
            {analyticsSubTab === 'fast_moving' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🔥 Fast-Going Products (වැඩිපුරම විකිණෙන භාණ්ඩ)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Customer orders අනුව වැඩිම ඉල්ලුමක් ඇති භාණ්ඩ
                    </p>
                  </div>
                </div>

                {fastMovingProducts.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
                    <SparklesIcon className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-sm font-bold text-slate-400">No product sales yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Once orders are placed by customers, top-selling items will rank here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fastMovingProducts.map((item, idx) => {
                      const catalogProduct = products.find(
                        (p) => p.id === item.product.id || p.name.toLowerCase() === item.product.name.toLowerCase()
                      );
                      const displayImg =
                        item.product.image && item.product.image.length > 10
                          ? item.product.image
                          : catalogProduct?.image && catalogProduct.image.length > 10
                          ? catalogProduct.image
                          : getCategoryFallbackImage(item.product.category);

                      const remainingStock = catalogProduct ? catalogProduct.stockCount : item.product.stockCount;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition shadow-lg flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Rank Medal */}
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-950'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              #{idx + 1}
                            </div>

                            {/* Image */}
                            <button
                              type="button"
                              onClick={() => setZoomImageUrl(displayImg)}
                              className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group relative cursor-zoom-in"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={displayImg}
                                alt={item.product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getCategoryFallbackImage(item.product.category);
                                }}
                              />
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                                  {item.product.name}
                                </h4>
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-400 text-[9px] font-bold border border-amber-500/20">
                                  High Demand 🔥
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Rs. {item.product.price.toLocaleString()} • {item.ordersCount} order(s)
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg font-bold text-[10px] border border-emerald-500/20 font-mono">
                                  {item.unitsSold} units sold
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Stock left: {remainingStock}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1.5">
                            <span className="text-xs font-black text-amber-400 font-mono block">
                              Rs. {item.totalRevenue.toLocaleString()}
                            </span>
                            {catalogProduct && (
                              <button
                                type="button"
                                disabled={isUpdatingStock === catalogProduct.id}
                                onClick={() => handleQuickRestock(catalogProduct, 10)}
                                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              >
                                {isUpdatingStock === catalogProduct.id ? 'Saving...' : '+10 Restock'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: LOW STOCK ALERT (⚠️ Low Stocks) */}
            {analyticsSubTab === 'low_stock' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>⚠️ Low Stock & Out-of-Stock Emergency Radar (ඉවරවෙන්න ළඟ බඩු)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      තොග 5ට වඩා අඩු හෝ අවසන් වූ භාණ්ඩ — මෙතැනින්ම 1-Click එකෙන් Restock කරන්න
                    </p>
                  </div>
                </div>

                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
                    <span className="text-3xl">🎉</span>
                    <p className="text-sm font-bold text-emerald-400">All Inventory Levels Healthy!</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All products currently have plenty of stock (&gt; 5 units). No reorder alerts needed!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lowStockProducts.map((p) => {
                      const isOutOfStock = !p.inStock || p.stockCount === 0;
                      const isCritical = p.stockCount <= 3;

                      return (
                        <div
                          key={p.id}
                          className={`p-4 rounded-2xl border transition shadow-lg flex items-center justify-between gap-4 ${
                            isOutOfStock
                              ? 'bg-rose-950/20 border-rose-500/40'
                              : isCritical
                              ? 'bg-amber-950/20 border-amber-500/40'
                              : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => setZoomImageUrl(p.image)}
                              className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group relative cursor-zoom-in"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.image || getCategoryFallbackImage(p.category)}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getCategoryFallbackImage(p.category);
                                }}
                              />
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-xs">
                                  {p.name}
                                </h4>
                                <span
                                  className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                                    isOutOfStock
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {isOutOfStock ? 'Out of Stock ❌' : `${p.stockCount} Left ⚠️`}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Rs. {p.price.toLocaleString()} • {p.category}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Current Showroom Stock: <strong className="text-white font-mono">{p.stockCount} units</strong>
                              </p>
                            </div>
                          </div>

                          {/* Quick Restock Buttons */}
                          <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openRestockModal(p)}
                              className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
                            >
                              <PackageIcon className="w-3 h-3" />
                              <span>Restock</span>
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingStock === p.id}
                              onClick={() => handleQuickRestock(p, 10)}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                            >
                              {isUpdatingStock === p.id ? '...' : '+10 Stock'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 4: SLOW-MOVING / UNSOLD INVENTORY (💤 Dead Stock) */}
            {analyticsSubTab === 'unsold' && (
              <div className="space-y-4">
                {/* Capital Tied Up Banner */}
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span>💤 Slow-Moving Inventory Radar (විකිණෙන්නෙ නැති භාණ්ඩ)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      මෙම භාණ්ඩ තවම එකදු order එකකවත් විකිණී නොමැත. Clearance discount එකක් දමා ඉක්මනින් විකුණා මුදල් කරගන්න.
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">Tied-up Stock Capital:</span>
                    <span className="text-sm font-black text-purple-400 font-mono">
                      Rs. {unsoldTiedUpCapital.toLocaleString()}
                    </span>
                  </div>
                </div>

                {unsoldProducts.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
                    <span className="text-3xl">🚀</span>
                    <p className="text-sm font-bold text-emerald-400">Zero Dead Stock!</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All products in your catalog have generated sales. Excellent showroom turnaround!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unsoldProducts.map((p) => {
                      const tiedCapital = p.price * (p.stockCount || 0);

                      return (
                        <div
                          key={p.id}
                          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition shadow-lg flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => setZoomImageUrl(p.image)}
                              className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group relative cursor-zoom-in"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.image || getCategoryFallbackImage(p.category)}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getCategoryFallbackImage(p.category);
                                }}
                              />
                            </button>

                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-xs">
                                {p.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Price: Rs. {p.price.toLocaleString()} • Stock: {p.stockCount} units
                              </p>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-mono border border-purple-500/20">
                                Tied capital: Rs. {tiedCapital.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isUpdatingStock === p.id}
                              onClick={() => handleApplyClearanceDiscount(p, 15)}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl text-[10px] font-black transition shadow-sm"
                              title="Set 15% discount to liquidate inventory"
                            >
                              {isUpdatingStock === p.id ? 'Saving...' : '⚡ 15% Clearance'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromoteProductInBroadcast(p)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 border border-slate-700"
                              title="Broadcast deal to all customers"
                            >
                              <span>📢 Promo</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>Customer Orders Management</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                    {orders.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Process showroom pickups and island-wide cash on delivery dispatches
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={syncAllFromCloud}
                  disabled={isRefreshingCloud}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-2 shrink-0 shadow-sm"
                  title="Fetch latest orders from Google Cloud Firestore"
                >
                  <span className={isRefreshingCloud ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
                  <span>{isRefreshingCloud ? 'Syncing Cloud...' : 'Sync Cloud Orders'}</span>
                </button>

                {/* Order Search Box */}
                <div className="relative w-full md:w-72">
                  <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order #, customer, phone..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All Orders', count: orders.length },
                { id: 'pending', label: 'Pending', count: orders.filter((o) => o.status === 'pending').length },
                { id: 'approved', label: 'Approved', count: orders.filter((o) => o.status === 'approved').length },
                { id: 'processing', label: 'Packing', count: orders.filter((o) => o.status === 'processing').length },
                { id: 'ready_for_pickup', label: 'Ready for Pickup', count: orders.filter((o) => o.status === 'ready_for_pickup').length },
                { id: 'completed', label: 'Completed', count: orders.filter((o) => o.status === 'completed').length },
                { id: 'cancelled', label: 'Cancelled', count: orders.filter((o) => o.status === 'cancelled').length },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setOrderStatusFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    orderStatusFilter === pill.id
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      orderStatusFilter === pill.id
                        ? 'bg-slate-950/20 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filtered Orders List */}
            {(() => {
              const filteredOrders = orders.filter((o) => {
                const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                if (!matchesStatus) return false;
                if (!orderSearch.trim()) return true;
                const q = orderSearch.toLowerCase();
                return (
                  o.orderNumber.toLowerCase().includes(q) ||
                  o.customerName.toLowerCase().includes(q) ||
                  o.phone.toLowerCase().includes(q) ||
                  (o.city && o.city.toLowerCase().includes(q)) ||
                  (o.address && o.address.toLowerCase().includes(q))
                );
              });

              if (filteredOrders.length === 0) {
                return (
                  <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
                    <PackageIcon className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-sm font-bold text-slate-400">No matching orders found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {orderSearch || orderStatusFilter !== 'all'
                        ? 'Try clearing the search query or changing your status filter.'
                        : 'Orders placed on your storefront will appear here instantly.'}
                    </p>
                    {(orderSearch || orderStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setOrderSearch('');
                          setOrderStatusFilter('all');
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 underline font-bold"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const statusMsg =
                      order.status === 'ready_for_pickup'
                        ? 'Your order is packed and READY FOR PICKUP at our Ambalangoda showroom!'
                        : order.status === 'approved'
                        ? 'Your order is confirmed and being prepared.'
                        : `Order status is now: ${order.status}`;
                    const whatsappUpdateUrl = createWhatsAppUrl(
                      order.phone,
                      generateStatusUpdateWhatsAppMessage(order, statusMsg)
                    );

                    return (
                      <div
                        key={order.id}
                        className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-cyan-400 text-sm">
                                #{order.orderNumber}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {order.customerName}
                              </span>
                              <a
                                href={`tel:${order.phone}`}
                                className="text-xs text-slate-400 hover:text-cyan-400 transition inline-flex items-center gap-1 font-mono"
                              >
                                <PhoneIcon className="w-3 h-3" />
                                <span>{order.phone}</span>
                              </a>
                            </div>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <ClockIcon className="w-3 h-3" />
                              <span>{new Date(order.createdAt).toLocaleString()}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white font-mono">
                              Rs. {order.total.toLocaleString()}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                order.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : order.status === 'ready_for_pickup'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : order.status === 'processing'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : order.status === 'approved'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Order Items with Product Photos */}
                        <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-300 flex items-center gap-1.5">
                              <span>Ordered Items</span>
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
                                {order.items.reduce((sum, it) => sum + it.quantity, 0)} items
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-500">Tap photo to zoom</span>
                          </div>

                          <div className="space-y-2">
                            {order.items.map((item, idx) => {
                              const catalogProduct = products.find(
                                (p) => p.id === item.product.id || p.name.toLowerCase() === item.product.name.toLowerCase()
                              );
                              const displayImg =
                                item.product.image && item.product.image.length > 10
                                  ? item.product.image
                                  : catalogProduct?.image && catalogProduct.image.length > 10
                                  ? catalogProduct.image
                                  : getCategoryFallbackImage(item.product.category);

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70 hover:border-slate-700 transition"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => setZoomImageUrl(displayImg)}
                                      className="relative group shrink-0 w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-cyan-500/60 transition cursor-zoom-in"
                                      title="Click to view full photo"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={displayImg}
                                        alt={item.product.name}
                                        className="w-13 h-13 sm:w-14 sm:h-14 object-cover group-hover:scale-110 transition duration-300"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = getCategoryFallbackImage(item.product.category);
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <CameraIcon className="w-4 h-4 text-white" />
                                      </div>
                                    </button>

                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">
                                        {item.product.name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 font-black rounded-lg border border-cyan-500/20 text-[10px]">
                                          Qty: {item.quantity}
                                        </span>
                                        <span className="text-slate-500">•</span>
                                        <span>Rs. {item.product.price.toLocaleString()} each</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="text-xs font-black text-cyan-400 font-mono block">
                                      Rs. {(item.quantity * item.product.price).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="p-3.5 bg-slate-950 rounded-xl text-xs text-slate-300 flex flex-col md:flex-row justify-between gap-3 border border-slate-800/80">
                          <div>
                            <span className="font-bold text-white flex items-center gap-1.5">
                              {order.deliveryMethod === 'store_pickup' ? (
                                <>
                                  <MapPinIcon className="w-3.5 h-3.5 text-amber-400" />
                                  <span>In-Store Pickup (Ambalangoda Showroom)</span>
                                </>
                              ) : (
                                <>
                                  <TruckIcon className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Island-wide Courier (Cash on Delivery)</span>
                                </>
                              )}
                            </span>
                            {order.address && (
                              <p className="text-slate-400 text-[11px] mt-0.5">
                                Address: {order.address}{order.city ? `, ${order.city}` : ''}
                              </p>
                            )}
                          </div>

                          {/* Pickup schedule inputs */}
                          {order.deliveryMethod === 'store_pickup' && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Date:</span>
                                <input
                                  type="date"
                                  defaultValue={order.scheduledPickupDate || ''}
                                  onChange={(e) =>
                                    handleSetPickupSlot(
                                      order,
                                      e.target.value,
                                      order.scheduledPickupTime || '10:00 AM'
                                    )
                                  }
                                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Time:</span>
                                <input
                                  type="text"
                                  defaultValue={order.scheduledPickupTime || ''}
                                  placeholder="e.g. 10:00 AM"
                                  onBlur={(e) =>
                                    handleSetPickupSlot(
                                      order,
                                      order.scheduledPickupDate || '',
                                      e.target.value
                                    )
                                  }
                                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white w-28"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status Change & WhatsApp Notification Action */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-400 font-medium mr-1">Update Status:</span>
                            <button
                              onClick={() => handleUpdateOrderStatus(order, 'approved')}
                              className={`px-3 py-1 text-xs rounded-xl font-bold transition ${
                                order.status === 'approved'
                                  ? 'bg-blue-500 text-slate-950 font-black'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order, 'processing')}
                              className={`px-3 py-1 text-xs rounded-xl font-bold transition ${
                                order.status === 'processing'
                                  ? 'bg-purple-500 text-white font-black'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              Packing
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order, 'ready_for_pickup')}
                              className={`px-3 py-1 text-xs rounded-xl font-bold transition ${
                                order.status === 'ready_for_pickup'
                                  ? 'bg-cyan-500 text-slate-950 font-black'
                                  : 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30'
                              }`}
                            >
                              Ready for Pickup
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order, 'completed')}
                              className={`px-3 py-1 text-xs rounded-xl font-bold transition ${
                                order.status === 'completed'
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                              }`}
                            >
                              Completed
                            </button>

                            {order.status !== 'cancelled' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderToCancel(order);
                                  setAdminCancelReason('Customer requested cancellation via call/WhatsApp');
                                  setAdminCustomCancelReason('');
                                }}
                                className="px-3 py-1 text-xs rounded-xl font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition flex items-center gap-1"
                                title="Cancel order and return stock to inventory"
                              >
                                <XIcon className="w-3 h-3" />
                                <span>Cancel</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Cancelled ✕
                                </span>
                                {order.cancellationReason && (
                                  <span className="text-[11px] text-slate-400 italic">
                                    &ldquo;{order.cancellationReason}&rdquo; ({order.cancelledBy === 'customer' ? 'by Customer' : 'by Admin'})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <a
                            href={whatsappUpdateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 transform active:scale-95"
                          >
                            <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
                            <span>Notify Customer via WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: SCHOOL BOOKLISTS MANAGEMENT */}
        {activeTab === 'school' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>School Season Booklist Pre-Orders</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {schoolRequests.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Handwritten paper booklists uploaded by parents for 10% discounted packing
                </p>
              </div>
            </div>

            {schoolRequests.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                No handwritten school booklists uploaded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {schoolRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 transition shadow-lg space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            #{req.requestNumber}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {req.customerName}
                          </span>
                          <a
                            href={`tel:${req.phone}`}
                            className="text-xs text-slate-400 hover:text-amber-400 transition inline-flex items-center gap-1 font-mono"
                          >
                            <PhoneIcon className="w-3 h-3" />
                            <span>{req.phone}</span>
                          </a>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Student: <strong className="text-slate-200">{req.studentName || 'N/A'}</strong> • Grade: <strong className="text-amber-300">{req.schoolGrade}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-mono">
                          Final: Rs. {req.finalTotal?.toLocaleString()}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 capitalize">
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Scanned Photo & Items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {req.handwrittenImageUrl && (
                        <div
                          onClick={() => setZoomImageUrl(req.handwrittenImageUrl || null)}
                          className="group relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 cursor-zoom-in hover:border-amber-500/50 transition shadow-inner"
                          title="Click to view full screen"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={req.handwrittenImageUrl}
                            alt="Handwritten List"
                            className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 backdrop-blur-xs">
                            <span>🔍 Click to Zoom Image</span>
                          </div>
                        </div>
                      )}

                      <div className="md:col-span-2 text-xs space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                        <p className="font-bold text-slate-300 mb-1">Parsed Items List ({req.parsedItems.length}):</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {req.parsedItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300 py-0.5 border-b border-slate-900 last:border-b-0">
                              <span>
                                <strong className="text-amber-400">{item.quantity}x</strong> {item.name}
                              </span>
                              <span className="font-mono text-slate-400">
                                Rs. {((item.unitPrice || 0) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {req.missingItemsRequested.length > 0 && (
                          <div className="pt-2 text-amber-300 border-t border-slate-800 mt-2">
                            <strong>Missing / Special Requests:</strong>
                            <p className="text-[11px] text-amber-200/90 mt-0.5">{req.missingItemsRequested.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scheduled Pickup & Actions */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <ClockIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pickup Slot: </span>
                        <strong>{req.scheduledPickupDate}</strong> at{' '}
                        <strong>{req.scheduledPickupTime}</strong>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleUpdateSchoolStatus(req, 'preparing')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-xl font-bold transition"
                        >
                          Mark Preparing
                        </button>
                        <button
                          onClick={() => handleUpdateSchoolStatus(req, 'ready_for_pickup')}
                          className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 text-xs rounded-xl font-bold transition"
                        >
                          Mark Ready
                        </button>
                        <a
                          href={createWhatsAppUrl(
                            req.phone,
                            `Hello ${req.customerName}! Your school booklist #${req.requestNumber} at Zenexis Ambalangoda is quoted at Rs. ${req.finalTotal?.toLocaleString()} (with 10% discount). Scheduled pickup date: ${req.scheduledPickupDate} at ${req.scheduledPickupTime}. Please confirm if okay!`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                        >
                          <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
                          <span>WhatsApp Quote</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>Catalog Inventory</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                    {products.length} Items
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage computer accessories, mobile phones, chargers, and stationery stock
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search items by name, tag..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('ai_add')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-500/20 transition flex items-center gap-1.5 shrink-0 transform active:scale-95"
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>AI Photo Add</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All Categories', count: products.length },
                {
                  id: 'low_stock',
                  label: '⚠️ Needs Restock',
                  count: products.filter((p) => !p.inStock || (p.stockCount !== undefined && p.stockCount <= 5)).length,
                },
                { id: 'computer', label: 'Computer Accessories', count: products.filter((p) => p.category === 'computer').length },
                { id: 'stationery', label: 'Stationery & Books', count: products.filter((p) => p.category === 'stationery').length },
                { id: 'mobile', label: 'Phones & Mobiles', count: products.filter((p) => p.category === 'mobile').length },
                { id: 'chargers', label: 'Chargers & Cables', count: products.filter((p) => p.category === 'chargers').length },
                { id: 'school_bundles', label: 'School Bundles', count: products.filter((p) => p.category === 'school_bundles').length },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setProductCategoryFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    productCategoryFilter === pill.id
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      productCategoryFilter === pill.id
                        ? 'bg-slate-950/20 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            {(() => {
              const filteredProducts = products.filter((p) => {
                if (productCategoryFilter === 'low_stock') {
                  const needsRestock = !p.inStock || (p.stockCount !== undefined && p.stockCount <= 5);
                  if (!needsRestock) return false;
                } else {
                  const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
                  if (!matchesCat) return false;
                }
                if (!productSearch.trim()) return true;
                const q = productSearch.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  (p.tags && p.tags.some((t) => t.toLowerCase().includes(q))) ||
                  p.category.toLowerCase().includes(q) ||
                  (p.description && p.description.toLowerCase().includes(q))
                );
              });

              if (filteredProducts.length === 0) {
                return (
                  <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
                    <ShoppingBagIcon className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-sm font-bold text-slate-400">No products match your criteria</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {productSearch || productCategoryFilter !== 'all'
                        ? 'Try clearing the search query or selecting All Categories.'
                        : 'Add products using the AI Product Photo Creator!'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.inStock && p.stockCount !== undefined && p.stockCount > 0 && p.stockCount <= 5;
                    const isOutOfStock = !p.inStock || p.stockCount === 0;

                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
                      >
                        <div className="flex gap-3.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getProductDisplayImage(p)}
                            alt={p.name}
                            className="w-20 h-20 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getCategoryFallbackImage(p.category);
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                              {p.category.replace('_', ' ')}
                            </span>
                            <h4 className="text-xs font-bold text-white truncate mt-0.5" title={p.name}>
                              {p.name}
                            </h4>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-sm font-black text-white font-mono">
                                Rs. {p.price.toLocaleString()}
                              </span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-[11px] text-slate-500 line-through">
                                  Rs. {p.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              {isOutOfStock ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  Out of Stock (0 units)
                                </span>
                              ) : isLowStock ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ⚠️ Low Stock ({p.stockCount} left)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  In Stock ({p.stockCount ?? 20})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleToggleStock(p)}
                              className={`px-2.5 py-1.5 text-xs rounded-xl font-bold transition ${
                                p.inStock
                                  ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {p.inStock ? 'Mark Out' : 'Mark In'}
                            </button>

                            <button
                              onClick={() => openRestockModal(p)}
                              className="px-2.5 py-1.5 text-xs rounded-xl font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1 shadow-sm"
                              title="Restock Product Inventory"
                            >
                              <PackageIcon className="w-3.5 h-3.5" />
                              <span>Restock</span>
                            </button>

                            <button
                              onClick={() => handleQuickRestock(p, 10)}
                              disabled={isUpdatingStock === p.id}
                              className="px-2 py-1.5 text-xs rounded-xl font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition disabled:opacity-50"
                              title="Quick +10 Units to Inventory"
                            >
                              {isUpdatingStock === p.id ? '...' : '+10'}
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition shrink-0"
                            title="Delete Product"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: FREE STUDY & KIDS RESOURCES MANAGER */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-md">
                  <BookOpenIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Free Study & Kids Resources Manager</h3>
                  <p className="text-xs text-slate-400">
                    Publish free term tests, O/L & A/L notes, and kids coloring sheets to drive organic traffic from school WhatsApp groups.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/resources"
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>View Public Hub ↗</span>
                </Link>

                <button
                  type="button"
                  onClick={() => openAddResourceModal()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/25 transition flex items-center gap-1.5 transform active:scale-95"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>+ Add New Resource</span>
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Resources</span>
                <p className="text-xl font-black text-white font-mono mt-0.5">{studyResources.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-purple-400">Total Downloads</span>
                <p className="text-xl font-black text-purple-400 font-mono mt-0.5">
                  {studyResources.reduce((s, r) => s + (r.downloadsCount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Term Test Papers</span>
                <p className="text-xl font-black text-cyan-400 font-mono mt-0.5">
                  {studyResources.filter((r) => r.category === 'term_test').length}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400">Short Notes</span>
                <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
                  {studyResources.filter((r) => r.category === 'short_notes').length}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Kids Coloring Sheets</span>
                <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {studyResources.filter((r) => r.category === 'kids_sheets').length}
                </p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'All Resources', count: studyResources.length },
                  { id: 'term_test', label: 'Term Tests', count: studyResources.filter((r) => r.category === 'term_test').length },
                  { id: 'short_notes', label: 'Short Notes', count: studyResources.filter((r) => r.category === 'short_notes').length },
                  { id: 'past_papers', label: 'Past Papers', count: studyResources.filter((r) => r.category === 'past_papers').length },
                  { id: 'kids_sheets', label: 'Kids Sheets', count: studyResources.filter((r) => r.category === 'kids_sheets').length },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setResourceCategoryFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      resourceCategoryFilter === pill.id
                        ? 'bg-purple-600 text-white font-black shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  placeholder="Search resources by title, grade, subject..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Resources List Grid */}
            {(() => {
              const filtered = studyResources.filter((r) => {
                if (resourceCategoryFilter !== 'all' && r.category !== resourceCategoryFilter) return false;
                if (!resourceSearch.trim()) return true;
                const q = resourceSearch.toLowerCase();
                return (
                  r.title.toLowerCase().includes(q) ||
                  (r.titleSi && r.titleSi.toLowerCase().includes(q)) ||
                  r.subject.toLowerCase().includes(q) ||
                  r.grade.toLowerCase().includes(q) ||
                  (r.year && r.year.includes(q))
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
                    <BookOpenIcon className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-sm font-bold text-slate-400">No resources found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click &ldquo;+ Add New Resource&rdquo; above to upload term test papers, short notes, or coloring sheets.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-lg space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              {item.grade}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {item.subject}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-purple-400 font-bold">
                            📥 {item.downloadsCount || 0} downloads
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white leading-snug line-clamp-2" title={item.title}>
                            {item.title}
                          </h4>
                          {item.titleSi && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                              {item.titleSi}
                            </p>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>{item.fileType || 'PDF'} • {item.fileSize || '1.5 MB'}</span>
                          {item.year && <span>Year: {item.year}</span>}
                        </div>

                        <a
                          href={item.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-cyan-400 hover:underline truncate block"
                          title={item.downloadUrl}
                        >
                          🔗 {item.downloadUrl}
                        </a>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddResourceModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition"
                          >
                            Edit
                          </button>
                          <a
                            href={item.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                          >
                            Test Link ↗
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteResource(item.id, item.title)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                          title="Delete Resource"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: AI PRODUCT CREATOR FROM PHOTO */}
        {activeTab === 'ai_add' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & AI Controls */}
            <div className="lg:col-span-7 bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-md">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">AI Instant Product Creator</h3>
                  <p className="text-xs text-slate-400">
                    Upload an item photo — Gemini AI automatically writes the title, description, category, suggested price, and tags!
                  </p>
                </div>
              </div>

              {/* Gemini AI Key Configuration & Status Card */}
              <div
                className={`p-4 rounded-2xl border transition ${
                  geminiApiKey
                    ? 'bg-slate-950/70 border-emerald-500/30'
                    : 'bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-950 border-purple-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        geminiApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">Google Gemini AI Vision</h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            geminiApiKey
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {geminiApiKey ? 'Connected & Active' : 'API Key Required'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {geminiApiKey
                          ? 'Ready to scan flyers, read brand names & detect exact prices (e.g. Rs. 950/-).'
                          : 'Connect a free Google Gemini API key to read photos, brand names & exact prices.'}
                      </p>
                    </div>
                  </div>

                  {geminiApiKey && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleSaveGeminiKey()}
                        disabled={isTestingGemini}
                        className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-[11px] font-bold transition disabled:opacity-50"
                      >
                        {isTestingGemini ? 'Testing...' : 'Test Connection'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveGeminiKey}
                        className="text-[11px] text-slate-400 hover:text-red-400 underline transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Input for API Key */}
                {!geminiApiKey ? (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={geminiApiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        placeholder="Paste Gemini API Key (starts with AIzaSy... or AQ...)"
                        className="flex-1 bg-slate-950 border border-purple-500/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveGeminiKey()}
                        disabled={isTestingGemini}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 shrink-0"
                      >
                        {isTestingGemini ? 'Testing...' : 'Save & Connect'}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                      <span>Key saves automatically when pasted • 1,500 free requests/day</span>
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 font-bold underline inline-flex items-center gap-1"
                      >
                        Get Free Key at Google AI Studio ➔
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Key: {geminiApiKey.slice(0, 8)}••••••••{geminiApiKey.slice(-4)}</span>
                    <span className="text-emerald-400 font-sans font-semibold">Ready to auto-scan</span>
                  </div>
                )}

                {/* Status Message */}
                {geminiStatus && (
                  <div
                    className={`mt-2.5 text-xs p-2.5 rounded-xl border ${
                      geminiStatus.success
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-950/40 text-red-300 border-red-500/30'
                    }`}
                  >
                    {geminiStatus.message}
                  </div>
                )}
              </div>

              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  1. Upload Product Photo or Promotional Flyer:
                </label>
                <div className="relative border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-6 text-center transition bg-slate-950/40">
                  {aiImagePreview ? (
                    <div className="space-y-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={aiImagePreview}
                        alt="Product to analyze"
                        className="max-h-56 mx-auto rounded-xl object-contain border border-slate-800"
                      />

                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleRunAiAnalysis}
                          disabled={isAiAnalyzing}
                          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 transform active:scale-95"
                        >
                          <SparklesIcon className="w-4 h-4" />
                          <span>
                            {isAiAnalyzing ? 'Gemini AI Analyzing Photo...' : 'Auto-Generate Details with AI'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAiImagePreview(null);
                            setAiImageFileName('');
                            setIsProductSaved(false);
                          }}
                          className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-2 py-4">
                      <CameraIcon className="w-10 h-10 mx-auto text-purple-400" />
                      <p className="text-sm font-bold text-white">Upload / Take Photo of Tech or Stationery Item</p>
                      <p className="text-xs text-slate-500">Mice, Keyboards, Pen drives, Books, Phones, Chargers...</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAiImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Optional Hint Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Optional: Product Name or Price Hint:
                </label>
                <input
                  type="text"
                  value={aiTextHint}
                  onChange={(e) => setAiTextHint(e.target.value)}
                  placeholder="e.g. JEQANG JM-G102 Honeycomb Mouse 950 (or leave blank for full auto scan)"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Guides AI recognition, or works as an instant offline fallback if Gemini API key is not connected.
                </p>
              </div>

              {/* AI Auto-filled Form */}
              <form onSubmit={handleSaveAiProduct} className="space-y-4 pt-4 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300">
                  2. Verify or Adjust Generated Fields:
                </label>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Product Title:</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. Fantech Optical Gaming Mouse 8000 DPI"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Category:</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value as ProductCategory)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="computer">Computer Accessories</option>
                      <option value="stationery">Stationery & Books</option>
                      <option value="mobile">Mobile Phones</option>
                      <option value="chargers">Chargers & Cables</option>
                      <option value="school_bundles">School Bundles</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Stock Count:</label>
                    <input
                      type="number"
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Selling Price (Rs.):</label>
                    <input
                      type="number"
                      required
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Original Price (Rs.):</label>
                    <input
                      type="number"
                      value={newProductOriginalPrice}
                      onChange={(e) => setNewProductOriginalPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Description:</label>
                  <textarea
                    rows={3}
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Compelling product details..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tags (comma separated):</label>
                  <input
                    type="text"
                    value={newProductTags}
                    onChange={(e) => setNewProductTags(e.target.value)}
                    placeholder="mouse, gaming, fantech, usb"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!aiImagePreview || isProductSaved}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 transform active:scale-98 ${
                    isProductSaved
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/20'
                  }`}
                >
                  {isProductSaved ? (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      <span>Product Added to Zenexis Catalog & Broadcasted!</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      <span>Save to Catalog & Notify Customers</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Live Storefront Card Preview */}
            <div className="lg:col-span-5 sticky top-24 space-y-4">
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">👁️ Live Storefront Preview</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      Real-time
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Customer View</span>
                </div>

                {/* Simulated Customer Product Card */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                  {/* Image Container */}
                  <div className="relative aspect-video sm:aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                    {aiImagePreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={aiImagePreview}
                        alt="Product preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <CameraIcon className="w-10 h-10 mx-auto text-slate-700" />
                        <p className="text-xs text-slate-500">
                          Upload a photo on the left to see live mockup
                        </p>
                      </div>
                    )}

                    {/* Category pill on image */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-cyan-400 border border-slate-800 uppercase tracking-wider">
                      {newProductCategory.replace('_', ' ')}
                    </span>

                    {/* Discount badge if original > selling */}
                    {newProductOriginalPrice > newProductPrice && newProductPrice > 0 && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md">
                        {Math.round(((newProductOriginalPrice - newProductPrice) / newProductOriginalPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="p-4 space-y-2.5">
                    <h4 className="font-bold text-sm text-white line-clamp-2">
                      {newProductName || 'Product title will appear here once typed or scanned'}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {newProductDesc || 'Product description, warranty info, and specifications...'}
                    </p>

                    {/* Price & Stock */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-white font-mono">
                          Rs. {newProductPrice ? newProductPrice.toLocaleString() : '0'}
                        </span>
                        {newProductOriginalPrice > newProductPrice && (
                          <span className="text-xs text-slate-500 line-through">
                            Rs. {newProductOriginalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        In Stock ({newProductStock})
                      </span>
                    </div>

                    {/* Simulated Add to Cart Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 opacity-90 cursor-not-allowed"
                      >
                        <ShoppingBagIcon className="w-4 h-4" />
                        <span>Add to Cart (Sample)</span>
                      </button>
                    </div>

                    {/* Simulated Trust Badges */}
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                      <span>🚚 Island-wide COD</span>
                      <span>🏪 Pickup Ambalangoda</span>
                      <span>🛡️ Genuine</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center">
                  💡 This preview updates in real-time as you tweak title, category, or price.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BROADCAST NOTIFICATIONS */}
        {activeTab === 'broadcast' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <BellIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Broadcast In-App Alert</h3>
                <p className="text-xs text-slate-400">
                  Send a real-time notification to all Zenexis website and mobile PWA visitors!
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Alert Title:
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. ⚡ Weekend Flash Sale: 20W PD Chargers at Rs. 1,650!"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Message Details:
                </label>
                <textarea
                  rows={3}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Write announcement details for customers..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={broadcastSent}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                {broadcastSent ? (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    <span>Notification Broadcasted!</span>
                  </>
                ) : (
                  <>
                    <BellIcon className="w-5 h-5" />
                    <span>Send Broadcast Alert</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: FIRESTORE DATABASE & POS SYNC */}
        {activeTab === 'firestore' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Status Card */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Firestore DB & POS Synchronization</h3>
                    <p className="text-xs text-slate-400">
                      Connect the exact same Firebase Project used by your Zenexis POS.
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isFirebaseConnected()
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>
                    {isFirebaseConnected() ? 'Firestore Connected' : 'Local Storage Mode (Ready to link)'}
                  </span>
                </span>
              </div>

              {/* Architecture & Safety Breakdown */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>🔒</span>
                  <span>Will using the same DB harm or break the POS system?</span>
                </h4>
                <p className="leading-relaxed">
                  <strong>NO! 100% Safe.</strong> In Cloud Firestore, each system reads and writes to separate, isolated <strong>Collections</strong>. There is zero risk of data collision:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      POS System (In-Store)
                    </span>
                    <p className="text-emerald-400 font-bold">`pos_sales` / `bills`</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Counter sales, receipts & cash register records stay completely untouched by the online store.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Shared (Real-Time Sync)
                    </span>
                    <p className="text-cyan-400 font-bold">`products` (Catalog)</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      When an item is sold in Ambalangoda shop, online stock updates automatically so you never oversell!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Online System
                    </span>
                    <p className="text-amber-400 font-bold">`online_orders`</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Online orders and school booklist requests are stored in their own collection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Config Form */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <h4 className="text-sm font-bold text-white">Enter Your Firebase Project Credentials:</h4>
              <p className="text-xs text-slate-400">
                You can copy these lines directly from your Firebase Console (Project Settings ➔ General ➔ Your apps):
              </p>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] text-slate-400 font-semibold">Firebase Project ID *</label>
                    <span className="text-[10px] text-amber-400">Firebase Console ➔ Project Settings</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    placeholder="e.g. zenexis-pos (Find in Firebase Project Settings)"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Tip: Firebase project IDs are lowercase (e.g. <code className="text-cyan-400">zenexis-pos-1234</code>). If yours differs from the word &apos;projectId&apos;, paste your exact ID here.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Web API Key (apiKey) *</label>
                    <input
                      type="text"
                      required
                      value={fbApiKey}
                      onChange={(e) => setFbApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">POS Products Collection Name</label>
                    <input
                      type="text"
                      value={fbCollectionName}
                      onChange={(e) => setFbCollectionName(e.target.value)}
                      placeholder="products (or items, inventory)"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">App ID</label>
                    <input
                      type="text"
                      value={fbAppId}
                      onChange={(e) => setFbAppId(e.target.value)}
                      placeholder="1:37370946244:web:8fbd63a812d49a77849f91"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Auth Domain (optional)</label>
                    <input
                      type="text"
                      value={fbAuthDomain}
                      onChange={(e) => setFbAuthDomain(e.target.value)}
                      placeholder="zenexis-pos.firebaseapp.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Test Feedback banner */}
                {testSyncResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-1 ${
                      testSyncResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1.5">
                      <span>{testSyncResult.success ? '✅' : '⚠️'}</span>
                      <span>{testSyncResult.message}</span>
                    </p>
                    {testSyncResult.count !== undefined && (
                      <p className="text-[11px] text-slate-400">
                        Total items loaded: {testSyncResult.count}. In-store items without photos will automatically use category fallback graphics.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="submit"
                    className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2"
                  >
                    {fbSavedMsg ? (
                      <>
                        <CheckIcon className="w-4 h-4 text-emerald-400" />
                        <span>Config Saved!</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="w-4 h-4" />
                        <span>Save Configuration</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestSync}
                    disabled={isTestingSync}
                    className="py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isTestingSync ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Testing & Syncing POS...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        <span>Test & Sync POS Products Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Zoom Modal for School Booklist Photos */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setZoomImageUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] w-full flex flex-col items-center bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center pb-3 border-b border-slate-800 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-cyan-400">🔍 High-Resolution Photo Viewer</span>
                <span className="text-[11px] text-slate-400">Order & Catalog Inspection</span>
              </div>
              <button
                onClick={() => setZoomImageUrl(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1.5 text-xs font-bold"
              >
                <XIcon className="w-4 h-4" />
                <span>Close (Esc)</span>
              </button>
            </div>

            <div className="w-full overflow-auto max-h-[75vh] rounded-2xl bg-slate-950 flex items-center justify-center p-2 mt-4 border border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomImageUrl}
                alt="Zoomed product or booklist preview"
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>

            <div className="w-full pt-3 flex items-center justify-between text-slate-400 text-xs">
              <span>Click anywhere outside or hit Close to exit</span>
              <button
                onClick={() => setZoomImageUrl(null)}
                className="text-amber-400 hover:underline font-bold"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Admin Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <KeyIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Change Master Password</h3>
                  <p className="text-[11px] text-slate-400">Cryptographic SHA-256 with unique salt</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {changePasswordSuccess && (
              <div className="p-3.5 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckIcon className="w-4 h-4 shrink-0" />
                <span>Password changed successfully and securely hashed in database!</span>
              </div>
            )}

            {changePasswordError && (
              <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{changePasswordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Current Master Password</label>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-[10px] text-cyan-400 font-semibold"
                  >
                    {showCurrentPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">New Master Password</label>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-[10px] text-cyan-400 font-semibold"
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Retype new password"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
                >
                  {isChangingPassword ? 'Saving Hash...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Order Cancellation Confirmation Modal */}
      {orderToCancel && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setOrderToCancel(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <XIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Cancel Order #{orderToCancel.orderNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Customer: {orderToCancel.customerName} ({orderToCancel.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderToCancel(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Select reason for cancellation:
              </label>
              <div className="space-y-2">
                {[
                  'Customer requested cancellation via call/WhatsApp',
                  'Out of stock / damaged stock',
                  'Customer unreachable / Invalid phone number',
                  'Duplicate order',
                  'Other',
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      adminCancelReason === reason
                        ? 'bg-rose-500/10 border-rose-500/40 text-white font-bold'
                        : 'border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="admin_cancel_reason"
                      value={reason}
                      checked={adminCancelReason === reason}
                      onChange={(e) => setAdminCancelReason(e.target.value)}
                      className="accent-rose-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {adminCancelReason === 'Other' && (
                <textarea
                  rows={2}
                  value={adminCustomCancelReason}
                  onChange={(e) => setAdminCustomCancelReason(e.target.value)}
                  placeholder="Type specific admin cancellation notes..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              ℹ️ Any product stock previously deducted for this order will automatically be returned to showroom inventory.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isAdminCancelling}
                onClick={handleConfirmAdminCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-500/25 disabled:opacity-50"
              >
                {isAdminCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTOCK PRODUCT INVENTORY MODAL */}
      {productToRestock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setProductToRestock(null)}
        >
          <div
            className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shadow-md">
                  <PackageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Restock Product Inventory</h3>
                  <p className="text-xs text-slate-400">Update showroom quantities & cloud stock</p>
                </div>
              </div>
              <button
                onClick={() => setProductToRestock(null)}
                className="text-slate-400 hover:text-white p-1 transition"
              >
                ✕
              </button>
            </div>

            {/* Product Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductDisplayImage(productToRestock)}
                alt={productToRestock.name}
                className="w-14 h-14 rounded-xl object-cover bg-slate-900 shrink-0 border border-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getCategoryFallbackImage(productToRestock.category);
                }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  {productToRestock.category.replace('_', ' ')}
                </span>
                <h4 className="text-xs font-bold text-white truncate" title={productToRestock.name}>
                  {productToRestock.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Rs. {productToRestock.price.toLocaleString()}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      !productToRestock.inStock || productToRestock.stockCount === 0
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : productToRestock.stockCount <= 5
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Current: {productToRestock.stockCount ?? 0} units
                  </span>
                </div>
              </div>
            </div>

            {/* Restock Mode Toggle */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRestockType('add')}
                className={`flex-1 py-2 rounded-lg transition text-center ${
                  restockType === 'add'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                + Add Units to Stock
              </button>
              <button
                type="button"
                onClick={() => setRestockType('exact')}
                className={`flex-1 py-2 rounded-lg transition text-center ${
                  restockType === 'exact'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Set Exact Quantity
              </button>
            </div>

            {/* Mode 1: Add Units */}
            {restockType === 'add' ? (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Quick Add Units:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRestockAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        restockAmount === amt
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-black shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] text-slate-400 block">
                    Or enter custom amount to add:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter units to add"
                  />
                </div>
              </div>
            ) : (
              /* Mode 2: Set Exact Quantity */
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Enter Exact Total Stock Count:
                </label>
                <input
                  type="number"
                  min="0"
                  value={restockExactQty}
                  onChange={(e) => setRestockExactQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Total units in showroom"
                />
              </div>
            )}

            {/* Optional Price Adjustment */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Unit Selling Price (Rs.):
                </label>
                <span className="text-[10px] text-slate-500">Optional rate update</span>
              </div>
              <input
                type="number"
                min="0"
                value={restockNewPrice}
                onChange={(e) => setRestockNewPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="Product price in Rs."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Calculation Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Current Stock:</span>
                <span className="font-mono font-bold">{productToRestock.stockCount ?? 0} units</span>
              </div>
              <div className="flex items-center justify-between text-cyan-400 font-bold">
                <span>Stock After Update:</span>
                <span className="font-mono text-sm">
                  {restockType === 'add'
                    ? (productToRestock.stockCount || 0) + (Number(restockAmount) || 0)
                    : Number(restockExactQty) || 0}{' '}
                  units (In Stock ✅)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                ☁️ Automatically syncs to Cloud Firestore & updates online catalog immediately.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setProductToRestock(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRestock}
                onClick={handleConfirmRestock}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingRestock ? (
                  <span>Syncing...</span>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    <span>Confirm & Update Stock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STUDY RESOURCE MODAL */}
      {isResourceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto"
          onClick={() => setIsResourceModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 text-white my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-md">
                  <BookOpenIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingResource ? 'Edit Study Resource' : 'Add New Study Resource'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Free term tests, short notes, past papers, or kids coloring sheets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResourceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-4">
              {/* Title & Sinhala Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Resource Title (English / Main): <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="e.g. 2024 Grade 10 Science 2nd Term Paper"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Sinhala Title / Description (Optional):
                </label>
                <input
                  type="text"
                  value={resTitleSi}
                  onChange={(e) => setResTitleSi(e.target.value)}
                  placeholder="e.g. 2024 10 ශ්‍රේණිය විද්‍යාව 2 වන වාර ප්‍රශ්න පත්‍රය"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Category & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Category:</label>
                  <select
                    value={resCategory}
                    onChange={(e) => setResCategory(e.target.value as StudyResourceCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="term_test">Grade 6-11 Term Test (වාර විභාග)</option>
                    <option value="short_notes">A/L & O/L Short Notes (කෙටි සටහන්)</option>
                    <option value="past_papers">O/L & A/L Past Papers (පසුගිය විභාග)</option>
                    <option value="kids_sheets">Kids Coloring / Art Sheets (රූප කොළ)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Grade / Level:</label>
                  <select
                    value={resGrade}
                    onChange={(e) => setResGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11 / O/L">Grade 11 / O/L</option>
                    <option value="A/L">A/L (Advanced Level)</option>
                    <option value="Primary / Kids">Primary / Kids (පෙර පාසල් & 1-5)</option>
                  </select>
                </div>
              </div>

              {/* Subject, Year, Term */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Subject:</label>
                  <input
                    type="text"
                    value={resSubject}
                    onChange={(e) => setResSubject(e.target.value)}
                    placeholder="e.g. Science"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Year:</label>
                  <input
                    type="text"
                    value={resYear}
                    onChange={(e) => setResYear(e.target.value)}
                    placeholder="e.g. 2024"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Term / Exam:</label>
                  <input
                    type="text"
                    value={resTerm}
                    onChange={(e) => setResTerm(e.target.value)}
                    placeholder="e.g. 2nd Term"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Medium & File Info */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Medium:</label>
                  <select
                    value={resMedium}
                    onChange={(e) => setResMedium(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="sinhala">සිංහල (Sinhala)</option>
                    <option value="english">English</option>
                    <option value="tamil">Tamil</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">File Type:</label>
                  <input
                    type="text"
                    value={resFileType}
                    onChange={(e) => setResFileType(e.target.value)}
                    placeholder="PDF Document"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">File Size:</label>
                  <input
                    type="text"
                    value={resFileSize}
                    onChange={(e) => setResFileSize(e.target.value)}
                    placeholder="e.g. 1.8 MB"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Download URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Download Link (Google Drive / Direct PDF URL): <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={resDownloadUrl}
                  onChange={(e) => setResDownloadUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or direct PDF link"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-400 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500">
                  Tip: Upload paper PDF to Google Drive, set sharing to &ldquo;Anyone with link can view&rdquo;, and paste here.
                </p>
              </div>

              {/* Description & Featured */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Exam Notes / Extra Instructions (Optional):
                </label>
                <textarea
                  rows={2}
                  value={resDescription}
                  onChange={(e) => setResDescription(e.target.value)}
                  placeholder="e.g. Includes Part I & II with official marking scheme."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="res_featured"
                  checked={resIsFeatured}
                  onChange={(e) => setResIsFeatured(e.target.checked)}
                  className="accent-purple-500 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="res_featured" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Mark as Popular / Featured Resource (Puts at top with ⭐ badge)
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResourceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingResource}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/25 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingResource ? (
                    <span>Publishing...</span>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>{editingResource ? 'Update Resource' : 'Publish Resource'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

