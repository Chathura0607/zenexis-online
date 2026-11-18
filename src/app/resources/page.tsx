'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CartDrawer } from '@/components/CartDrawer';
import { NotificationModal } from '@/components/NotificationModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { AIChatModal } from '@/components/AIChatModal';
import { StudyCardIllustration } from '@/components/StudyCardIllustration';
import {
  SearchIcon,
  DownloadIcon,
  WhatsAppIcon,
  BookOpenIcon,
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
  FilterIcon,
} from '@/components/icons';
import { StudyResource, Order, Product, StudyCollection } from '@/types';
import {
  getStoredResources,
  incrementResourceDownload,
  syncResourcesWithFirestore,
  getStoredProducts,
} from '@/lib/storage';
import { SHOP_CONFIG, STUDY_COLLECTIONS } from '@/lib/constants';
import { createWhatsAppUrl } from '@/lib/whatsapp';

export default function ResourcesPage() {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMedium, setSelectedMedium] = useState<string>('all');
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

  const resolveDownloadUrl = (url: string) => {
    if (!url || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/zenexis-online')) {
        return `/zenexis-online${url.startsWith('/') ? '' : '/'}${url}`;
      }
    }
    return url;
  };

  const handleDownload = (resource: StudyResource) => {
    incrementResourceDownload(resource.id);
    loadData();
    setDownloadSuccessMsg(`✓ Opening ${resource.title}. Free download initiated!`);
    setTimeout(() => setDownloadSuccessMsg(null), 4500);

    const finalUrl = resolveDownloadUrl(resource.downloadUrl);

    if (finalUrl && finalUrl !== '#') {
      const link = document.createElement('a');
      link.href = finalUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (finalUrl.endsWith('.pdf') || finalUrl.includes('/downloads/')) {
        const cleanName = `${resource.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        link.download = cleanName;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    const text = `🎓 *Zenexis Free Study & Kids Hub (නොමිලේ අධ්‍යාපනික සම්පත්):*\n\nGrade 1-13 Term Test Papers, G.C.E. O/L & A/L Past Papers සහ පෙර පාසල් රූප කොළ 100% නොමිලේ Download කරගන්න!\n\n👉 Free Download Link: ${hubUrl}\n\nZenexis Ambalangoda • Island-wide Delivery`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Helper to count papers in a collection
  const getCollectionCount = (collectionId: string) => {
    return resources.filter((r) => r.collectionId === collectionId).length;
  };

  // Currently selected collection object (if any)
  const currentCollection = STUDY_COLLECTIONS.find((c) => c.id === selectedCollectionId) || null;

  // Papers filtered by collection and search
  const visibleResources = resources.filter((item) => {
    if (selectedCollectionId && item.collectionId !== selectedCollectionId) {
      return false;
    }
    if (selectedSubject !== 'all' && item.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
      return false;
    }
    if (selectedMedium !== 'all' && item.medium !== selectedMedium) {
      return false;
    }
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

  // Extract unique subjects for the selected collection
  const availableSubjects = Array.from(
    new Set(
      resources
        .filter((r) => !selectedCollectionId || r.collectionId === selectedCollectionId)
        .map((r) => r.subject)
        .filter(Boolean)
    )
  );

  // Group collections into sections matching the reference screenshot
  const preschoolCollections = STUDY_COLLECTIONS.filter((c) => c.section === 'preschool');
  const gcePastCollections = STUDY_COLLECTIONS.filter((c) => c.section === 'gce_past');
  const secondaryCollections = STUDY_COLLECTIONS.filter((c) => c.section === 'term_tests_secondary');
  const primaryCollections = STUDY_COLLECTIONS.filter((c) => c.section === 'primary_scholarship');
  const noteCollections = STUDY_COLLECTIONS.filter((c) => c.section === 'notes');

  const handleRequestCollectionOnWhatsApp = (colName: string) => {
    const text = `Hello Zenexis (Ambalangoda)! I am looking for past papers / study materials for "${colName}". Could you please send me available papers or packages?`;
    const url = createWhatsAppUrl(SHOP_CONFIG.whatsappNumber, text);
    window.open(url, '_blank');
  };

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
              නොමිලේ පාසල් ප්‍රශ්න පත්‍ර, කෙටි සටහන් සහ පෙර පාසල් රූප කොළ එකතුව
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Grade 1-13 Term Test Papers, G.C.E. O/L & A/L Past Papers, and Pre-School Activity Worksheets. Download 100% free for all students, parents and teachers.
            </p>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleShareEntireHub}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 transform active:scale-95"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Share Hub to WhatsApp</span>
              </button>

              <Link
                href="/school-season"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 transform active:scale-95"
              >
                <span>🎒 School Books & Stationery (10% OFF)</span>
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

        {/* SEARCH BAR (Always Available) */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-white dark:bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <SearchIcon className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, grade, year, paper title (e.g. Science, Grade 10, O/L, Pre-school)..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* MAIN CONTENT AREA */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* VIEW MODE 1: SINGLE COLLECTION VIEW (When a collection is selected or search query active) */}
          {(selectedCollectionId || searchQuery) ? (
            <div className="space-y-6">
              {/* Breadcrumb & Navigation */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setSelectedCollectionId(null);
                    setSearchQuery('');
                    setSelectedSubject('all');
                    setSelectedMedium('all');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-2 group"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  <span>Back to All Collections (සියලු එකතු)</span>
                </button>

                {currentCollection && (
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    Showing: {currentCollection.title} ({visibleResources.length} Papers)
                  </span>
                )}
              </div>

              {/* Collection Header Banner */}
              {currentCollection && !searchQuery && (
                <div className={`rounded-3xl p-6 bg-gradient-to-r ${currentCollection.gradient} text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6`}>
                  <div className="flex items-center gap-4">
                    <StudyCardIllustration type={currentCollection.characterType} className="w-20 h-20 shrink-0" />
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider ${currentCollection.badgeBg} ${currentCollection.badgeColor} mb-2 shadow`}>
                        {currentCollection.gradeBadge}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black">{currentCollection.title}</h2>
                      <p className="text-sm font-semibold opacity-90 mt-0.5">{currentCollection.titleSi} • {currentCollection.subLabel}</p>
                      <p className="text-xs opacity-80 mt-1 max-w-xl">{currentCollection.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-3xl sm:text-4xl font-black font-mono block">
                      {resources.filter((r) => r.collectionId === currentCollection.id).length}
                    </span>
                    <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                      Uploaded Papers
                    </span>
                  </div>
                </div>
              )}

              {/* Sub-Filters: Subject & Medium (If subjects are present) */}
              {availableSubjects.length > 0 && (
                <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-900/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {/* Subject Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
                    <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                      <FilterIcon className="w-3.5 h-3.5" /> Subject:
                    </span>
                    <button
                      onClick={() => setSelectedSubject('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        selectedSubject === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                      }`}
                    >
                      All Subjects
                    </button>
                    {availableSubjects.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubject(sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          selectedSubject === sub
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>

                  {/* Medium Selector */}
                  <div className="shrink-0">
                    <select
                      value={selectedMedium}
                      onChange={(e) => setSelectedMedium(e.target.value)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
                    >
                      <option value="all">All Mediums (සියලු මාධ්‍ය)</option>
                      <option value="sinhala">සිංහල මාධ්‍යය</option>
                      <option value="english">English Medium</option>
                      <option value="tamil">Tamil Medium</option>
                    </select>
                  </div>
                </div>
              )}

              {/* PAPERS LIST OR EMPTY STATE */}
              {visibleResources.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto border border-purple-500/20 shadow">
                    <BookOpenIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {currentCollection
                        ? `${currentCollection.title} සඳහා ප්‍රශ්න පත්‍ර ළඟදීම එක් කෙරේ`
                        : 'No papers found matching your search'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                      {currentCollection
                        ? `Zenexis Ambalangoda විසින් මෙම ශ්‍රේණියට අදාළ නවතම වාර විභාග ප්‍රශ්න පත්‍ර upload කරමින් පවතී. ඔබට අවශ්‍ය ප්‍රශ්න පත්‍රය මේ මොහොතේම WhatsApp මගින් ලබාගත හැක.`
                        : 'Try searching with a different keyword or reset filters to see all available educational resources.'}
                    </p>
                  </div>

                  {currentCollection && (
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => handleRequestCollectionOnWhatsApp(currentCollection.title)}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 transform active:scale-95"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                        <span>Request {currentCollection.title} on WhatsApp</span>
                      </button>

                      <button
                        onClick={() => setSelectedCollectionId(null)}
                        className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                      >
                        Browse Other Grades
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visibleResources.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 rounded-3xl p-5 shadow-sm hover:shadow-xl transition flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Badges */}
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
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              ⭐ Popular
                            </span>
                          )}
                        </div>

                        {/* Titles */}
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition leading-snug">
                            {item.title}
                          </h3>
                          {item.titleSi && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {item.titleSi}
                            </p>
                          )}
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* Details line */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          {item.term && <span>{item.term}</span>}
                          {item.year && <span>• {item.year}</span>}
                          <span>• {item.fileSize || 'PDF'}</span>
                          <span className="ml-auto text-purple-600 dark:text-purple-400 font-bold font-mono">
                            📥 {item.downloadsCount || 0}
                          </span>
                        </div>
                      </div>

                      {/* Download & Share Actions */}
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
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition"
                          title="Share to WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE 2: COLLECTIONS OVERVIEW (Matching User Screenshot) */
            <div className="space-y-12">
              {/* SECTION 1: PRE-SCHOOL & KINDERGARTEN */}
              <section className="space-y-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    <span>🎨</span>
                    <span>Pre-School & Kindergarten Worksheets</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    පෙර පාසල් සහ මොන්ටිසෝරි දරුවන්ට අකුරු හුරු කරවන රූප කොළ සහ පාට කිරීමේ ක්‍රියාකාරකම්
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {preschoolCollections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      count={getCollectionCount(col.id)}
                      onSelect={() => setSelectedCollectionId(col.id)}
                    />
                  ))}
                </div>
              </section>

              {/* SECTION 2: G.C.E. PAST PAPERS & MARKING SCHEMES */}
              <section className="space-y-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    <span>🎓</span>
                    <span>G.C.E. Past Papers & Marking Schemes</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    අධ්‍යයන පොදු සහතික පත්‍ර සාමාන්‍ය පෙළ සහ උසස් පෙළ පසුගිය විභාග ප්‍රශ්න පත්‍ර සහ පිළිතුරු
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {gcePastCollections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      count={getCollectionCount(col.id)}
                      onSelect={() => setSelectedCollectionId(col.id)}
                    />
                  ))}
                </div>
              </section>

              {/* SECTION 3: GRADE 6-13 TERM TEST PAPERS */}
              <section className="space-y-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    <span>📑</span>
                    <span>Grade 6-13 Term Test Papers</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    6 ශ්‍රේණියේ සිට 13 ශ්‍රේණිය දක්වා පළාත් සහ ජනප්‍රිය පාසල් වාර විභාග ප්‍රශ්න පත්‍ර
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
                  {secondaryCollections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      count={getCollectionCount(col.id)}
                      onSelect={() => setSelectedCollectionId(col.id)}
                    />
                  ))}
                </div>
              </section>

              {/* SECTION 4: GRADE 1-5 PAPERS & SCHOLARSHIP EXAM */}
              <section className="space-y-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    <span>🎒</span>
                    <span>Grade 1-5 Papers & Scholarship Exam</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    1 - 5 ප්‍රාථමික ශ්‍රේණි ප්‍රශ්න පත්‍ර සහ 5 ශ්‍රේණිය ශිෂ්‍යත්ව විභාග ආදර්ශ ප්‍රශ්න පත්‍ර
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
                  {primaryCollections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      count={getCollectionCount(col.id)}
                      onSelect={() => setSelectedCollectionId(col.id)}
                    />
                  ))}
                </div>
              </section>

              {/* SECTION 5: FAST REVISION SHORT NOTES & FORMULAS */}
              <section className="space-y-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    <span>📝</span>
                    <span>Fast Revision Short Notes & Formulas</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    විභාගයට පෙර මතකය අලුත් කරගැනීමට සා.පෙළ සහ උ.පෙළ විෂය සාරාංශ සහ සූත්‍ර අත්පොත්
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {noteCollections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      count={getCollectionCount(col.id)}
                      onSelect={() => setSelectedCollectionId(col.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* PROMOTIONAL CROSS-SELL SECTION: STATIONERY & PRINT SERVICE */}
          <section className="pt-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-purple-500/30 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 inline-block shadow">
                    🏪 Zenexis Showroom Ambalangoda
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">
                    ප්‍රශ්න පත්‍ර Print කර නිවසටම ගෙන්වා ගැනීමට අවශ්‍යද?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    ඔබට අවශ්‍ය ඕනෑම Past Paper Pack එකක්, CR පොත්, පෑන්, පැන්සල්, Geometrical Instrument Boxes, Calculators හෝ සම්පූර්ණ පාසල් පොත් ලැයිස්තුව දිවයින පුරා Cash on Delivery මගින් නිවසටම ගෙන්වා ගත හැක.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={createWhatsAppUrl(
                        SHOP_CONFIG.whatsappNumber,
                        'Hello Zenexis! I would like to order printed past paper sets / school stationery with island-wide COD delivery.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      <span>WhatsApp Print Order (070 112 0945)</span>
                    </a>

                    <Link
                      href="/"
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <span>Explore Zenexis Store Catalog →</span>
                    </Link>
                  </div>
                </div>

                {/* Popular Stationery Quick Grid */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
                  {[
                    { name: 'A4 Printing Paper (80 GSM 500 Sheets)', price: 'Rs. 2,150', note: 'Perfect for printing papers' },
                    { name: 'Atlas Mathematical Instrument Box', price: 'Rs. 750', note: 'Official school grade' },
                    { name: 'Faber-Castell Color Pencils 24s', price: 'Rs. 950', note: 'For kids coloring' },
                    { name: 'Ballpoint Pens Pack (10s Blue/Black)', price: 'Rs. 450', note: 'Smooth exam ink' },
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
        </div>
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

/**
 * Individual Collection Visual Card
 * Designed to match the visual layout of Sri Lankan educational paper hubs
 */
interface CollectionCardProps {
  collection: StudyCollection;
  count: number;
  onSelect: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, count, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1"
    >
      {/* Top Visual Banner */}
      <div className={`p-4 sm:p-5 bg-gradient-to-br ${collection.gradient} relative overflow-hidden flex items-center justify-between text-white min-h-[110px] sm:min-h-[125px]`}>
        {/* Background glow circle */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

        {/* Character Illustration */}
        <div className="relative z-10 shrink-0 transform group-hover:scale-105 transition-transform duration-300">
          <StudyCardIllustration type={collection.characterType} className="w-14 h-14 sm:w-16 sm:h-16" />
        </div>

        {/* Text & Grade Number on Right */}
        <div className="text-right relative z-10 flex flex-col items-end">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight leading-none drop-shadow-md">
            {collection.numberDisplay}
          </span>
          <span className="text-xs sm:text-sm font-bold opacity-95 drop-shadow leading-tight mt-0.5">
            {collection.titleSi}
          </span>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${collection.badgeBg} ${collection.badgeColor} mt-1.5 shadow-sm`}>
            {collection.gradeBadge}
          </span>
        </div>
      </div>

      {/* Bottom Sub-label & Paper Count */}
      <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
          {collection.subLabel}
        </h4>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
            count > 0
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          {count > 0 ? `${count} Papers` : 'Available Soon'}
        </span>
      </div>
    </div>
  );
};
