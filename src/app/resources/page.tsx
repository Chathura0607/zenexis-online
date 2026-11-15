'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CartDrawer } from '@/components/CartDrawer';
import { NotificationModal } from '@/components/NotificationModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { AIChatModal } from '@/components/AIChatModal';
import {
  SearchIcon,
  DownloadIcon,
  WhatsAppIcon,
  BookOpenIcon,
  SparklesIcon,
  PackageIcon,
  CheckIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  FilterIcon,
} from '@/components/icons';
import { StudyResource, StudyResourceCategory, Order, Product } from '@/types';
import {
  getStoredResources,
  incrementResourceDownload,
  syncResourcesWithFirestore,
  getStoredProducts,
} from '@/lib/storage';
import { SHOP_CONFIG } from '@/lib/constants';
import { createWhatsAppUrl } from '@/lib/whatsapp';

export default function ResourcesPage() {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedMedium, setSelectedMedium] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const loadData = () => {
    setResources(getStoredResources());
    setCatalogProducts(getStoredProducts());
  };

  useEffect(() => {
    loadData();
    // Auto-sync with Cloud Firestore
    syncResourcesWithFirestore().then(() => {
      loadData();
    });

    const handleUpdate = () => loadData();
    window.addEventListener('zenexis_resources_updated', handleUpdate);
    window.addEventListener('zenexis_products_updated', handleUpdate);
    return () => {
      window.removeEventListener('zenexis_resources_updated', handleUpdate);
      window.removeEventListener('zenexis_products_updated', handleUpdate);
    };
  }, []);

  const handleDownload = (resource: StudyResource) => {
    incrementResourceDownload(resource.id);
    loadData();
    setDownloadSuccessMsg(`✓ Opening ${resource.title}. Free download initiated!`);
    setTimeout(() => setDownloadSuccessMsg(null), 4500);

    // Open download in a new tab
    if (resource.downloadUrl && resource.downloadUrl !== '#') {
      window.open(resource.downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('This resource download link is being updated by Zenexis staff. Please check back shortly or request via WhatsApp!');
    }
  };

  const getHubUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/resources`;
    }
    return 'https://zenexismart.com/resources';
  };

  const handleShareWhatsApp = (resource: StudyResource) => {
    const hubUrl = getHubUrl();
    const text = `📚 *Free Study Resource from Zenexis Ambalangoda:*\n\n*${resource.title}*\n${resource.titleSi ? `${resource.titleSi}\n` : ''}Grade: ${resource.grade} • Subject: ${resource.subject}\n\n👉 Download 100% Free here: ${hubUrl}\n\n(Zenexis Online - School Books, Past Papers & Computer Accessories)`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEntireHub = () => {
    const hubUrl = getHubUrl();
    const text = `🎓 *Zenexis Free Study & Kids Hub (නොමිලේ අධ්‍යාපනික සම්පත්):*\n\nGrade 6-11 Term Test Papers, O/L & A/L Short Notes සහ පොඩිත්තන්ට රූප කොළ 100% නොමිලේ Download කරගන්න!\n\n👉 Free Download Link: ${hubUrl}\n\nZenexis Ambalangoda • Island-wide Cash on Delivery`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filter logic
  const filteredResources = resources.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedGrade !== 'all' && item.grade !== selectedGrade) return false;
    if (selectedMedium !== 'all' && item.medium !== selectedMedium) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.titleSi && item.titleSi.toLowerCase().includes(q)) ||
      item.subject.toLowerCase().includes(q) ||
      item.grade.toLowerCase().includes(q) ||
      (item.year && item.year.includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const categories = [
    { id: 'all', label: 'All Resources (සියල්ල)', icon: '📚', count: resources.length },
    { id: 'term_test', label: 'Grade 6-11 Term Tests (වාර විභාග)', icon: '📑', count: resources.filter((r) => r.category === 'term_test').length },
    { id: 'short_notes', label: 'A/L & O/L Short Notes (කෙටි සටහන්)', icon: '📝', count: resources.filter((r) => r.category === 'short_notes').length },
    { id: 'past_papers', label: 'O/L & A/L Past Papers (පසුගිය විභාග)', icon: '🎓', count: resources.filter((r) => r.category === 'past_papers').length },
    { id: 'kids_sheets', label: 'Kids Coloring & Art Sheets (රූප කොළ)', icon: '🎨', count: resources.filter((r) => r.category === 'kids_sheets').length },
  ];

  const grades = [
    'all',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11 / O/L',
    'A/L',
    'Primary / Kids',
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white pb-24 sm:pb-0 transition-colors">
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenNotifications={() => setIsNotifsOpen(true)}
        searchQuery=""
        setSearchQuery={() => {}}
        activeCategory="school_bundles"
        setActiveCategory={() => {}}
      />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-8 sm:py-12 bg-gradient-to-b from-purple-900/20 via-indigo-950/20 to-transparent border-b border-purple-500/20">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-bold backdrop-blur-md">
              <SparklesIcon className="w-4 h-4 text-purple-400" />
              <span>100% Free Educational Community Initiative by Zenexis</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Zenexis Free Study & Kids Hub
            </h1>
            <p className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
              නොමිලේ අධ්‍යාපනික ප්‍රශ්න පත්‍ර, කෙටි සටහන් සහ පොඩිත්තන්ට රූප කොළ
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Download Grade 6-11 Term Test Papers, G.C.E. O/L & A/L Short Revision Notes, and Printable Kids Coloring Worksheets with official answers. Free for all Sri Lankan students and parents.
            </p>

            {/* Quick Share Hub Callout Button */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleShareEntireHub}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 transform active:scale-95"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Share Hub to WhatsApp Groups</span>
              </button>

              <Link
                href="/school-season"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 transform active:scale-95"
              >
                <span>🎒 Need School Stationery? 10% OFF</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FEEDBACK TOAST */}
        {downloadSuccessMsg && (
          <div className="max-w-xl mx-auto px-4 mt-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
              <span>{downloadSuccessMsg}</span>
              <button onClick={() => setDownloadSuccessMsg(null)} className="text-emerald-400 p-1">✕</button>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS SECTION */}
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sub Filters: Search + Grade + Medium */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white dark:bg-slate-900/80 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by subject, grade, year, paper title..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Grade Select */}
            <div className="sm:col-span-3">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="all">All Grades (සියලු ශ්‍රේණි)</option>
                {grades.filter((g) => g !== 'all').map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Medium Select */}
            <div className="sm:col-span-3">
              <select
                value={selectedMedium}
                onChange={(e) => setSelectedMedium(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="all">All Mediums (මාධ්‍යය)</option>
                <option value="sinhala">සිංහල මාධ්‍යය (Sinhala)</option>
                <option value="english">English Medium</option>
                <option value="tamil">Tamil Medium</option>
              </select>
            </div>
          </div>
        </section>

        {/* RESOURCE CARDS GRID */}
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {filteredResources.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <BookOpenIcon className="w-12 h-12 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No resources found matching your criteria</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing your search query or selecting &ldquo;All Resources&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedGrade('all');
                  setSelectedMedium('all');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResources.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 rounded-3xl p-5 shadow-sm hover:shadow-xl transition flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {item.grade}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {item.subject}
                        </span>
                        {item.medium && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                            {item.medium === 'sinhala' ? 'සිංහල' : item.medium === 'english' ? 'English' : 'Tamil'}
                          </span>
                        )}
                      </div>

                      {item.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <span>⭐</span>
                          <span>Popular</span>
                        </span>
                      )}
                    </div>

                    {/* Titles */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition leading-snug">
                        {item.title}
                      </h3>
                      {item.titleSi && (
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {item.titleSi}
                        </p>
                      )}
                    </div>

                    {/* File Meta Info */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>📄 {item.fileType || 'PDF Document'} • {item.fileSize || '1.5 MB'}</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                        📥 {item.downloadsCount || 0} downloads
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-1.5 transform active:scale-95"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span>Download Free PDF</span>
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(item)}
                      title="Share to WhatsApp group"
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition shrink-0"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CROSS-SELLING CONVERSION SECTION (Turning Free Visitors into Paying Customers) */}
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-500/30 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-500/20">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  🎒 Zenexis Showroom Ambalangoda • Express Island-wide Delivery
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  Need Printouts, A4 Paper Bundles or School Stationery?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Avoid bookshop queues in Ambalangoda. Get genuine CR books, pastels, pens, geometry boxes & A4 bundles delivered straight to your doorstep.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/school-season"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition transform active:scale-95 flex items-center gap-1.5"
                >
                  <span>Pre-Order Booklist (10% OFF)</span>
                  <span>➔</span>
                </Link>

                <a
                  href={createWhatsAppUrl(
                    SHOP_CONFIG.whatsappNumber,
                    'Hello Zenexis! I downloaded study papers from your website and I need to order printed copies / stationery.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Featured Stationery Items Carousel / Row */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-300">
                  Popular Student Stationery in Stock at Ambalangoda:
                </h4>
                <Link href="/" className="text-xs font-bold text-cyan-400 hover:underline">
                  Browse All Products →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'A4 Copier Paper Bundle (500 Sheets)', price: 'Rs. 1,650', note: 'Perfect for printing papers' },
                  { name: 'Atlas 80-Page CR Books 10-Pack', price: 'Rs. 2,400', note: 'Single Rule / Square' },
                  { name: 'Kids 24 Oil Pastel Coloring Box', price: 'Rs. 850', note: 'Rich vibrant colors' },
                  { name: 'Ballpoint Pens Pack (Blue & Black 10s)', price: 'Rs. 450', note: 'Smooth exam ink' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1"
                  >
                    <span className="text-lg">✏️</span>
                    <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                    <p className="text-[10px] text-slate-400">{item.note}</p>
                    <p className="text-xs font-black text-cyan-400 font-mono">{item.price}</p>
                    <Link
                      href="/"
                      className="inline-block mt-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:underline"
                    >
                      View in Store →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MobileBottomNav onOpenCart={() => setIsCartOpen(true)} />
      <AIChatModal />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={(order) => setCompletedOrder(order)}
      />

      <NotificationModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
      />

      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
    </div>
  );
}
