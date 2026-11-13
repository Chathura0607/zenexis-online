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
} from '@/components/icons';
import { Product, Order, SchoolListRequest, ProductCategory, OrderStatus } from '@/types';
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
} from '@/lib/storage';
import { analyzeProductWithAI, testGeminiApiKey } from '@/lib/gemini';
import { SHOP_CONFIG, CATEGORIES, SCHOOL_GRADES, getProductDisplayImage, getCategoryFallbackImage } from '@/lib/constants';
import { createWhatsAppUrl, generateStatusUpdateWhatsAppMessage } from '@/lib/whatsapp';

import {
  getFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConnected,
  testFirestoreConnection,
  FirebaseConfig,
} from '@/lib/firebase';

export default function AdminPage() {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'school' | 'products' | 'ai_add' | 'broadcast' | 'firestore'>('orders');

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [schoolRequests, setSchoolRequests] = useState<SchoolListRequest[]>([]);

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

  const loadData = () => {
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    setSchoolRequests(getStoredSchoolRequests());
  };

  useEffect(() => {
    // Check session auth
    if (sessionStorage.getItem('zenexis_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
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
    window.addEventListener('zenexis_products_updated', loadData);
    window.addEventListener('zenexis_orders_updated', loadData);
    window.addEventListener('zenexis_school_updated', loadData);
    return () => {
      window.removeEventListener('zenexis_products_updated', loadData);
      window.removeEventListener('zenexis_orders_updated', loadData);
      window.removeEventListener('zenexis_school_updated', loadData);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '2026' || pinInput === '0701120945') {
      setIsAuthenticated(true);
      sessionStorage.setItem('zenexis_admin_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
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
  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiImagePreview(reader.result as string);
        setIsProductSaved(false);
      };
      reader.readAsDataURL(file);
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

  const handleSaveAiProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !aiImagePreview) {
      alert('Please provide product photo and name.');
      return;
    }

    const tagsArray = newProductTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const created: Product = {
      id: `prod-${Date.now()}`,
      name: newProductName.trim(),
      category: newProductCategory,
      price: Number(newProductPrice) || 1000,
      originalPrice: Number(newProductOriginalPrice) || undefined,
      description: newProductDesc.trim() || 'Quality item from Zenexis inventory.',
      image: aiImagePreview,
      inStock: true,
      stockCount: Number(newProductStock) || 10,
      tags: tagsArray.length > 0 ? tagsArray : ['zenexis', newProductCategory],
      rating: 5.0,
      reviewsCount: 1,
      isFeatured: true,
    };

    addProduct(created);
    setIsProductSaved(true);
    setTimeout(() => {
      // Reset form
      setAiImagePreview(null);
      setNewProductName('');
      setNewProductDesc('');
      setNewProductTags('');
      setIsProductSaved(false);
      setActiveTab('products');
    }, 1500);
  };

  const handleToggleStock = (product: Product) => {
    updateProduct({
      ...product,
      inStock: !product.inStock,
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product from Zenexis catalog?')) {
      deleteProduct(id);
    }
  };

  const handleUpdateOrderStatus = (order: Order, newStatus: OrderStatus) => {
    updateOrderStatus(order.id, newStatus);
  };

  const handleSetPickupSlot = (order: Order, date: string, time: string) => {
    updateOrderStatus(order.id, order.status, {
      scheduledPickupDate: date,
      scheduledPickupTime: time,
    });
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
              <span>Staff Management Portal</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Zenexis Admin Access</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ambalangoda Showroom • Inventory & Orders System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Staff Security PIN:
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Enter 4-Digit PIN"
                  className={`w-full px-4 py-3.5 bg-slate-950 border rounded-2xl text-center text-xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none transition ${
                    pinError
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white transition px-2 py-1 font-bold"
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </div>

              {pinError && (
                <p className="text-xs text-red-400 mt-1.5 animate-in fade-in flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Incorrect PIN. Please use your showroom staff PIN (Default: 2026).</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-sm transition transform active:scale-98 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>

            {/* Quick Demo Fill Helper */}
            <button
              type="button"
              onClick={() => {
                setPinInput('2026');
                setPinError(false);
              }}
              className="text-[11px] text-slate-500 hover:text-cyan-400 transition block mx-auto"
            >
              Quick Fill Demo PIN (2026)
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-cyan-400 transition inline-flex items-center gap-1"
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
              onClick={() => setActiveTab('ai_add')}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition transform active:scale-95"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>AI Photo Add</span>
            </button>
            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 hover:text-white transition font-medium flex items-center gap-1"
            >
              <span>Live Store ↗</span>
            </Link>
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
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                Rs.
              </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              Rs. {totalRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Active orders & completed sales
            </p>
          </div>

          <div className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
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

          <div className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
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

          <div className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Catalog Inventory</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <ShoppingBagIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-cyan-400 tracking-tight">
              {products.length} Items
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {products.filter((p) => p.inStock).length} In Stock • {products.filter((p) => !p.inStock).length} Out of Stock
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto no-scrollbar shadow-inner">
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

              {/* Order Search Box */}
              <div className="relative w-full md:w-80">
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

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All Orders', count: orders.length },
                { id: 'pending', label: 'Pending', count: orders.filter((o) => o.status === 'pending').length },
                { id: 'approved', label: 'Approved', count: orders.filter((o) => o.status === 'approved').length },
                { id: 'processing', label: 'Packing', count: orders.filter((o) => o.status === 'processing').length },
                { id: 'ready_for_pickup', label: 'Ready for Pickup', count: orders.filter((o) => o.status === 'ready_for_pickup').length },
                { id: 'completed', label: 'Completed', count: orders.filter((o) => o.status === 'completed').length },
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

                        {/* Order Items */}
                        <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <p className="font-bold text-slate-400 mb-1">Items ({order.items.length}):</p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-0.5 border-b border-slate-900 last:border-b-0">
                              <span className="text-slate-200">
                                <strong className="text-cyan-400">{item.quantity}x</strong> {item.product.name}
                              </span>
                              <span className="text-slate-400 font-mono">
                                Rs. {(item.quantity * item.product.price).toLocaleString()}
                              </span>
                            </div>
                          ))}
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
                const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
                if (!matchesCat) return false;
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
                            <div className="mt-1.5">
                              {isOutOfStock ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  Out of Stock
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

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <button
                            onClick={() => handleToggleStock(p)}
                            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition ${
                              p.inStock
                                ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                            }`}
                          >
                            {p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
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
                <span className="text-base font-black text-amber-400">🎒 Handwritten School List Photo</span>
                <span className="text-[11px] text-slate-400">High-Resolution Viewer</span>
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
                alt="Zoomed handwritten booklist"
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
    </div>
  );
}

