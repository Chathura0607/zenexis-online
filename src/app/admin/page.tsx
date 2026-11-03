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
} from '@/lib/storage';
import { analyzeProductWithAI } from '@/lib/gemini';
import { SHOP_CONFIG, CATEGORIES, SCHOOL_GRADES } from '@/lib/constants';
import { createWhatsAppUrl, generateStatusUpdateWhatsAppMessage } from '@/lib/whatsapp';

import {
  getFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConnected,
  FirebaseConfig,
} from '@/lib/firebase';

export default function AdminPage() {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'school' | 'products' | 'ai_add' | 'broadcast' | 'firestore'>('orders');

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [schoolRequests, setSchoolRequests] = useState<SchoolListRequest[]>([]);

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // AI Product Creator State
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
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
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbStorageBucket, setFbStorageBucket] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbSavedMsg, setFbSavedMsg] = useState(false);

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
    const currentFb = getFirebaseConfig();
    if (currentFb) {
      setFbApiKey(currentFb.apiKey || '');
      setFbProjectId(currentFb.projectId || '');
      setFbAuthDomain(currentFb.authDomain || '');
      setFbStorageBucket(currentFb.storageBucket || '');
      setFbAppId(currentFb.appId || '');
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

  // AI Image upload & analysis
  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    try {
      const analysis = await analyzeProductWithAI(aiImagePreview, 'product-photo.jpg');
      setNewProductName(analysis.name);
      setNewProductCategory(analysis.category);
      setNewProductPrice(analysis.price);
      setNewProductOriginalPrice(Math.round(analysis.price * 1.2));
      setNewProductDesc(analysis.description);
      setNewProductTags(analysis.tags.join(', '));
    } catch (err) {
      console.error(err);
      alert('AI recognition encountered an issue. Please adjust fields manually.');
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

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbProjectId.trim() || !fbApiKey.trim()) {
      alert('Please enter at least Project ID and API Key.');
      return;
    }

    saveFirebaseConfig({
      apiKey: fbApiKey.trim(),
      projectId: fbProjectId.trim(),
      authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.appspot.com`,
      messagingSenderId: '',
      appId: fbAppId.trim(),
    });

    setFbSavedMsg(true);
    setTimeout(() => setFbSavedMsg(false), 3000);
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const pendingSchoolCount = schoolRequests.filter((s) => s.status === 'pending_review').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Zenexis Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ambalangoda • Management & Inventory System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 text-left">
                Security PIN Code:
              </label>
              <input
                type="password"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Admin PIN (Default: 2026)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              {pinError && (
                <p className="text-xs text-red-400 mt-1.5 text-left">
                  Incorrect PIN. Please try again (Hint: 2026).
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-sm transition shadow-lg shadow-cyan-500/20"
            >
              Sign In to Admin
            </button>
          </form>

          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 block">
            ← Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-lg">
              Z
            </div>
            <div>
              <span className="font-black text-white tracking-tight">ZENEXIS ADMIN</span>
              <span className="text-[10px] text-cyan-400 block -mt-1 font-semibold">
                Control Center • Ambalangoda
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition"
            >
              Live Site ↗
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 border border-red-500/30 transition font-bold"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Revenue</span>
            <span className="text-xl sm:text-2xl font-black text-white">
              Rs. {totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Customer Orders</span>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-white">{orders.length}</span>
              {pendingOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                  {pendingOrdersCount} New
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">School Booklists</span>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                {schoolRequests.length}
              </span>
              {pendingSchoolCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold animate-pulse">
                  {pendingSchoolCount} Pending
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Catalog Products</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400">
              {products.length} Items
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
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
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <span>🎒 School Booklists ({schoolRequests.length})</span>
            {pendingSchoolCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full">
                {pendingSchoolCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_add')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ai_add'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-purple-400 hover:text-white bg-purple-500/10 border border-purple-500/30'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>AI Product Photo Add</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <BellIcon className="w-4 h-4" />
            <span>Push Broadcast</span>
          </button>

          <button
            onClick={() => setActiveTab('firestore')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'firestore'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-amber-400 hover:text-white bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <span>⚡ Firestore & POS Sync</span>
          </button>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-black text-white">Customer Orders Management</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                No customer orders received yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter((o) => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                  .map((order) => {
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
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
                          <div>
                            <span className="font-mono font-bold text-cyan-400 text-sm">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">
                              • {order.customerName} ({order.phone})
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              Rs. {order.total.toLocaleString()}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                order.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : order.status === 'ready_for_pickup'
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="text-xs text-slate-300 space-y-1">
                          <p className="font-bold text-slate-400 mb-1">Items:</p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {item.quantity}x {item.product.name}
                              </span>
                              <span className="text-slate-400">
                                Rs. {(item.quantity * item.product.price).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Info */}
                        <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-300 flex flex-col sm:flex-row justify-between gap-2">
                          <div>
                            <span className="font-semibold text-white">
                              {order.deliveryMethod === 'store_pickup'
                                ? '🏪 In-Store Pickup at Ambalangoda'
                                : '🚚 Island-wide Courier Delivery'}
                            </span>
                            {order.address && (
                              <p className="text-slate-400 text-[11px] mt-0.5">
                                Address: {order.address}, {order.city}
                              </p>
                            )}
                          </div>

                          {/* Pickup schedule inputs */}
                          {order.deliveryMethod === 'store_pickup' && (
                            <div className="flex items-center gap-2">
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
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px]"
                              />
                              <input
                                type="text"
                                defaultValue={order.scheduledPickupTime || ''}
                                placeholder="Time slot"
                                onBlur={(e) =>
                                  handleSetPickupSlot(
                                    order,
                                    order.scheduledPickupDate || '',
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] w-28"
                              />
                            </div>
                          )}
                        </div>

                        {/* Status Change & WhatsApp Notification Action */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">Update Status:</span>
                            <button
                              onClick={() => handleUpdateOrderStatus(order, 'approved')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order, 'processing')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg font-semibold"
                            >
                              Packing
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order, 'ready_for_pickup')}
                              className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs rounded-lg font-bold"
                            >
                              Ready for Pickup
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order, 'completed')}
                              className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs rounded-lg font-bold"
                            >
                              Completed
                            </button>
                          </div>

                          <a
                            href={whatsappUpdateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                          >
                            <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
                            <span>Notify Customer on WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHOOL BOOKLISTS MANAGEMENT */}
        {activeTab === 'school' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">School Season Booklist Pre-Orders</h2>

            {schoolRequests.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                No handwritten school booklists uploaded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {schoolRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          #{req.requestNumber}
                        </span>
                        <span className="text-xs text-white ml-2">
                          {req.customerName} ({req.phone})
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Student: {req.studentName || 'N/A'} • Grade: {req.schoolGrade}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">
                          Final: Rs. {req.finalTotal?.toLocaleString()}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400">
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Scanned Photo & Items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {req.handwrittenImageUrl && (
                        <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={req.handwrittenImageUrl}
                            alt="Handwritten List"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      <div className="md:col-span-2 text-xs space-y-1.5">
                        <p className="font-bold text-slate-300">Parsed Items List:</p>
                        {req.parsedItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-slate-400">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>Rs. {((item.unitPrice || 0) * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}

                        {req.missingItemsRequested.length > 0 && (
                          <div className="pt-2 text-amber-300">
                            <strong>Missing / Special Requests:</strong>
                            <p>{req.missingItemsRequested.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scheduled Pickup & Actions */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-300">
                        <span>Pickup Slot: </span>
                        <strong>{req.scheduledPickupDate}</strong> at{' '}
                        <strong>{req.scheduledPickupTime}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateSchoolStatus(req, 'preparing')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-xl font-bold"
                        >
                          Mark Preparing
                        </button>
                        <button
                          onClick={() => handleUpdateSchoolStatus(req, 'ready_for_pickup')}
                          className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs rounded-xl font-bold"
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
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-black text-white">Catalog Products ({products.length})</h2>
              <button
                onClick={() => setActiveTab('ai_add')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Item via AI Photo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-950 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">
                        {p.category}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                      <p className="text-xs font-black text-white mt-0.5">
                        Rs. {p.price.toLocaleString()}
                      </p>
                      <span
                        className={`text-[10px] font-semibold mt-1 inline-block ${
                          p.inStock ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {p.inStock ? `In Stock (${p.stockCount})` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStock(p)}
                      className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
                        p.inStock
                          ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                          : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      }`}
                    >
                      {p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      title="Delete Product"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AI PRODUCT CREATOR FROM PHOTO */}
        {activeTab === 'ai_add' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">AI Instant Product Creator</h3>
                <p className="text-xs text-slate-400">
                  Upload an item photo — Gemini AI automatically writes the title, description, category, suggested price, and tags!
                </p>
              </div>
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                1. Upload Product Photo:
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
                    <button
                      type="button"
                      onClick={handleRunAiAnalysis}
                      disabled={isAiAnalyzing}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 mx-auto"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      <span>{isAiAnalyzing ? 'Gemini AI Analyzing Photo...' : 'Auto-Generate Details with AI'}</span>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-2">
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
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
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
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Original Price (Rs.):</label>
                  <input
                    type="number"
                    value={newProductOriginalPrice}
                    onChange={(e) => setNewProductOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
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
                className={`w-full py-3.5 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 ${
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
                You can copy these 3-4 lines directly from your Firebase Console (Project Settings ➔ General ➔ Your apps):
              </p>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-4 pt-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Firebase Project ID *</label>
                  <input
                    type="text"
                    required
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    placeholder="e.g. zenexis-pos-12345"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Storage Bucket (optional)</label>
                    <input
                      type="text"
                      value={fbStorageBucket}
                      onChange={(e) => setFbStorageBucket(e.target.value)}
                      placeholder="zenexis-pos.appspot.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">App ID (optional)</label>
                    <input
                      type="text"
                      value={fbAppId}
                      onChange={(e) => setFbAppId(e.target.value)}
                      placeholder="1:123456789:web:abcdef"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  {fbSavedMsg ? (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      <span>Firebase POS Config Saved & Linked!</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-5 h-5" />
                      <span>Save & Link with POS Firestore DB</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

