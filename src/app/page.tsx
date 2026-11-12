'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SparklesIcon,
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
  ClockIcon,
  LaptopIcon,
  BookOpenIcon,
  SmartphoneIcon,
  ZapIcon,
  FilterIcon,
  CheckIcon,
  HeartIcon,
} from '@/components/icons';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CartDrawer } from '@/components/CartDrawer';
import { NotificationModal } from '@/components/NotificationModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { AIChatModal } from '@/components/AIChatModal';
import { AuthModal } from '@/components/AuthModal';
import { CustomerProfileDrawer } from '@/components/CustomerProfileDrawer';
import { Product, Order, CustomerProfile } from '@/types';
import {
  getStoredProducts,
  getLoggedInCustomer,
  getSavedTheme,
  applyTheme,
  syncProductsWithFirestore,
  getWishlist,
  getRecentlyViewed,
} from '@/lib/storage';
import { CATEGORIES, SHOP_CONFIG } from '@/lib/constants';
import { createWhatsAppUrl } from '@/lib/whatsapp';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isWishlistActive, setIsWishlistActive] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const loadProducts = () => {
    setProducts(getStoredProducts());
    setCustomer(getLoggedInCustomer());
    setWishlistIds(getWishlist());
    setRecentlyViewedIds(getRecentlyViewed());
  };

  useEffect(() => {
    // If opened on dedicated admin domain (e.g. zenexis-admin.vercel.app or admin.zenexis.lk)
    if (typeof window !== 'undefined') {
      const host = window.location.hostname.toLowerCase();
      if (host.includes('admin') || host.startsWith('admin.')) {
        window.location.replace('/admin');
        return;
      }
    }

    // Apply saved theme preference on load
    applyTheme(getSavedTheme());
    loadProducts();

    // Trigger Firestore background sync for live POS products
    syncProductsWithFirestore().finally(() => {
      setIsSyncing(false);
    });

    const handleCustUpdate = () => setCustomer(getLoggedInCustomer());
    const handleWishlistUpdate = () => setWishlistIds(getWishlist());
    const handleRecentUpdate = () => setRecentlyViewedIds(getRecentlyViewed());

    window.addEventListener('zenexis_products_updated', loadProducts);
    window.addEventListener('zenexis_customer_updated', handleCustUpdate);
    window.addEventListener('zenexis_wishlist_updated', handleWishlistUpdate);
    window.addEventListener('zenexis_recently_viewed_updated', handleRecentUpdate);

    return () => {
      window.removeEventListener('zenexis_products_updated', loadProducts);
      window.removeEventListener('zenexis_customer_updated', handleCustUpdate);
      window.removeEventListener('zenexis_wishlist_updated', handleWishlistUpdate);
      window.removeEventListener('zenexis_recently_viewed_updated', handleRecentUpdate);
    };
  }, []);

  // Filter products
  const filteredProducts = products
    .filter((p) => {
      if (isWishlistActive && !wishlistIds.includes(p.id)) {
        return false;
      }
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nameSi && p.nameSi.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStock = !inStockOnly || p.inStock;
      return matchesCategory && matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });

  const recentlyViewedProducts = recentlyViewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'computer':
        return <LaptopIcon className="w-4 h-4" />;
      case 'stationery':
        return <BookOpenIcon className="w-4 h-4" />;
      case 'mobile':
        return <SmartphoneIcon className="w-4 h-4" />;
      case 'chargers':
        return <ZapIcon className="w-4 h-4" />;
      case 'school_bundles':
        return <ShoppingBagIcon className="w-4 h-4" />;
      default:
        return <SparklesIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 pb-16 sm:pb-0 transition-colors">
      {/* PWA Prompt */}
      <PWAInstallPrompt />

      {/* Navbar */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenNotifications={() => setIsNotifsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenWishlist={() => setIsWishlistActive(!isWishlistActive)}
        wishlistActive={isWishlistActive}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-12 sm:py-20 bg-gradient-to-b from-cyan-50/50 via-slate-50 to-white dark:from-slate-900/70 dark:via-[#070b14] dark:to-[#070b14] border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
          {/* Background Tech Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                {/* Location Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold backdrop-blur-md shadow-sm dark:shadow-inner">
                  <MapPinIcon className="w-4 h-4 text-cyan-500" />
                  <span>Zenexis Showroom • Ambalangoda</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  Your Smart Store for{' '}
                  <span className="bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 bg-clip-text text-transparent">
                    Tech & School
                  </span>{' '}
                  Supplies
                </h1>

                {/* Description */}
                <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Genuine Computer Accessories, Keypad & Smartphones, 20W PD Chargers, and Full School Booklist Packages with <strong>Island-wide Cash on Delivery</strong> and <strong>Instant WhatsApp Confirmation</strong>.
                </p>

                {/* Badges Bar */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none text-slate-700 dark:text-slate-300">
                    <TruckIcon className="w-4 h-4 text-cyan-500" />
                    <span>Island-wide Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none text-slate-700 dark:text-slate-300">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none text-slate-700 dark:text-slate-300">
                    <ClockIcon className="w-4 h-4 text-amber-500" />
                    <span>30-Min Store Pickup</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-4">
                  <a
                    href="#catalog"
                    className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-cyan-500/20 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <ShoppingBagIcon className="w-4 h-4 text-slate-950" />
                    <span>Browse Products</span>
                  </a>

                  <Link
                    href="/school-season"
                    className="w-full sm:w-auto px-7 py-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-black text-sm rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    <span>🎒 Upload School Booklist</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded font-bold">
                      -10%
                    </span>
                  </Link>

                  <a
                    href={createWhatsAppUrl(SHOP_CONFIG.whatsappNumber, 'Hello Zenexis! I want to inquire about your products.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-emerald-500" />
                    <span>WhatsApp 0701120945</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Hero Highlight Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-md">
                        Z
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm">Zenexis Showroom</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Ambalangoda, Sri Lanka</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      Open Today (8AM - 8:30PM)
                    </span>
                  </div>

                  {/* Highlights Grid */}
                  <div className="py-5 space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🎒</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">School Season Booklist Pre-Order</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Upload paper list photo • Skip the crowd</p>
                        </div>
                      </div>
                      <Link
                        href="/school-season"
                        className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-lg shadow-sm"
                      >
                        Try AI Scan
                      </Link>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💻</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Gaming & Office Peripherals</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Mice, Keyboards, Pen Drives, Speakers</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">In Stock</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📱</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Nokia/Itel Phones & 20W PD Chargers</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Keypad phones, fast chargers & cables</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">TRCSL Approved</span>
                    </div>
                  </div>

                  {/* WhatsApp Quick Trigger */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Need immediate assistance?</span>
                    <a
                      href={createWhatsAppUrl(SHOP_CONFIG.whatsappNumber, 'Hi! I have a question about Zenexis products.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-500" />
                      <span>Chat Now</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SCHOOL SEASON PROMO BANNER (Compact & Elegant - Focus remains on products) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
          <div className="relative rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-600/15 border border-amber-500/30 p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                🎒
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1">
                  10% School Season Discount
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Got a School Booklist? Avoid Long Shop Crowds & Queues!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Upload a photo of your handwritten paper list. Our team will pack everything with special discounts for quick pickup in Ambalangoda.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/school-season"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
              >
                <span>Upload Paper List</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        </section>

        {/* PRODUCT CATALOG SECTION */}
        <section id="catalog" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-2 border border-cyan-500/20">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Featured Inventory</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Explore Available Products
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                {products.length > 0
                  ? `Showing ${filteredProducts.length} verified products ready for pickup or island-wide delivery.`
                  : 'Genuine computer accessories, school stationery & mobile gear in Ambalangoda.'}
              </p>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <label className="text-xs text-slate-700 dark:text-slate-400 flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span>In-Stock Only</span>
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white shadow-sm dark:shadow-none focus:outline-none focus:border-cyan-500"
              >
                <option value="featured">Featured First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Wishlist Active Filter Banner */}
          {isWishlistActive && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
                  <HeartIcon className="w-5 h-5" filled />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Your Saved Wishlist ({wishlistIds.length} {wishlistIds.length === 1 ? 'item' : 'items'})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Products you bookmarked for later. Click the heart on any card to remove.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWishlistActive(false)}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition whitespace-nowrap"
              >
                ✕ View All Products
              </button>
            </div>
          )}

          {/* Categories Horizontal Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm dark:shadow-none ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {isSyncing ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 space-y-3 animate-pulse"
                >
                  <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-full mt-2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                <ShoppingBagIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  New Stock Arriving Soon!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  අලුත් තොග ළඟදීම පැමිණේ...
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                We are currently updating our Ambalangoda showroom catalog with the latest computer items, cables, and stationery. Looking for a specific item today? Message us directly on WhatsApp!
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={createWhatsAppUrl(SHOP_CONFIG.whatsappNumber, 'Hi Zenexis, I want to inquire about available products and stock at your Ambalangoda showroom.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
                  <span>Inquire via WhatsApp</span>
                </a>
                <Link
                  href="/school-season"
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <span>🎒</span>
                  <span>School Booklist Hub</span>
                </Link>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
              <ShoppingBagIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 opacity-60" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No products matched your search.</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Try searching for something else or ask our team on WhatsApp if we have it in Ambalangoda!
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setInStockOnly(false);
                }}
                className="px-4 py-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}

          {/* Recently Viewed Products (Daraz & Amazon Style Browsing History) */}
          {recentlyViewedProducts.length > 0 && (
            <div className="mt-14 pt-10 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <ClockIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Recently Viewed / ඔබ මෑතකදී බැලූ භාණ්ඩ
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Items you checked earlier during this session
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('zenexis_recently_viewed_v1');
                    window.dispatchEvent(new Event('zenexis_recently_viewed_updated'));
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition"
                >
                  Clear History
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {recentlyViewedProducts.map((p) => (
                  <ProductCard
                    key={`recent-${p.id}`}
                    product={p}
                    onOpenDetails={(selected) => setSelectedProduct(selected)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* WHY CHOOSE ZENEXIS */}
        <section className="py-12 bg-slate-100/70 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Why Buy from Zenexis Ambalangoda?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Combining local trusted service in Ambalangoda with next-generation online convenience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
                  <TruckIcon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Island-wide COD Delivery</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Safely receive your computer accessories, chargers, and books anywhere in Sri Lanka with Cash on Delivery.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                  <WhatsAppIcon className="w-6 h-6 fill-emerald-500 dark:fill-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Instant WhatsApp Automation</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  No messy forms or forgotten orders. Order confirmations, quotes, and pickup alerts are sent directly to your phone.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Zero Time Waste on School Lists</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Upload your handwritten list. We calculate discounts, pack the books, and let you walk in & pick up in 2 minutes!
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#05070d] border-t border-slate-200 dark:border-slate-800/80 py-10 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-base">
                  Z
                </div>
                <span className="text-lg font-black text-slate-900 dark:text-white">ZENEXIS</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Your premier tech accessories, mobile phones, and school stationery shop in Ambalangoda.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Quick Navigation</h4>
              <ul className="space-y-2">
                <li><a href="#catalog" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition">All Products</a></li>
                <li><Link href="/school-season" className="hover:text-amber-600 dark:hover:text-amber-400 transition">🎒 School Season Hub</Link></li>
                <li><Link href="/track" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition">Track Your Order</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Location & Hours</h4>
              <p className="text-slate-800 dark:text-slate-300 font-semibold">Zenexis Showroom</p>
              <p className="text-slate-600 dark:text-slate-400">Ambalangoda (Near Bus Stand)</p>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Monday – Sunday: 8:00 AM – 8:30 PM</p>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Direct Contact</h4>
              <p className="text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <PhoneIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Hotline: 0701120945</span>
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 mt-1">
                <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-500" />
                <span>WhatsApp: 0701120945</span>
              </p>
              <div className="mt-4">
                <a
                  href={createWhatsAppUrl(SHOP_CONFIG.whatsappNumber, 'Hello Zenexis!')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-emerald-500" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 text-center text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Zenexis Online. All rights reserved. Ambalangoda.</p>
            <p>Designed for High Performance • PWA Mobile Ready</p>
          </div>
        </div>
      </footer>

      {/* Floating AI Assistant Chatbot */}
      <AIChatModal />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenCart={() => setIsCartOpen(true)} />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={(order) => setCompletedOrder(order)}
      />

      {/* Notification Center Modal */}
      <NotificationModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Order Success Confirmation Modal */}
      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />

      {/* Customer Authentication Modal (Google / Password) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedCust) => {
          setCustomer(loggedCust);
        }}
      />

      {/* Customer Profile & Order History Drawer */}
      <CustomerProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        customer={customer}
      />
    </div>
  );
}
