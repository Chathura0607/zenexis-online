'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  SearchIcon,
  BellIcon,
  WhatsAppIcon,
  PackageIcon,
  ShieldCheckIcon,
} from './icons';
import { SHOP_CONFIG } from '@/lib/constants';
import { getStoredCart, getStoredNotifications } from '@/lib/storage';
import { createWhatsAppUrl } from '@/lib/whatsapp';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenNotifications,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
}) => {
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const updateCounts = () => {
    const cart = getStoredCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);

    const notifs = getStoredNotifications();
    const unread = notifs.filter((n) => !n.read).length;
    setUnreadNotifs(unread);
  };

  useEffect(() => {
    updateCounts();
    window.addEventListener('zenexis_cart_updated', updateCounts);
    window.addEventListener('zenexis_notifs_updated', updateCounts);
    return () => {
      window.removeEventListener('zenexis_cart_updated', updateCounts);
      window.removeEventListener('zenexis_notifs_updated', updateCounts);
    };
  }, []);

  const whatsappGeneralUrl = createWhatsAppUrl(
    SHOP_CONFIG.whatsappNumber,
    'Hello Zenexis (Ambalangoda)! I would like to inquire about your products.'
  );

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white text-center flex items-center justify-center gap-2 overflow-hidden shadow-inner">
        <span className="hidden sm:inline">🎒 <strong>School Season Special:</strong> 10% OFF on all Booklist packages!</span>
        <span className="inline">🚚 <strong>Island-wide Cash on Delivery</strong> | 🏪 Ambalangoda</span>
        <span className="hidden md:inline">| 📞 WhatsApp: <strong>{SHOP_CONFIG.phone}</strong></span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl sm:text-2xl font-black text-slate-950 tracking-tighter">Z</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  ZENEXIS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Online
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block truncate">
                Ambalangoda, Sri Lanka
              </p>
            </div>
          </Link>

          {/* Search Bar (Desktop & Tablet) */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search computer items, stationery, phones, chargers..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition shadow-inner"
              />
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* School Season Special Link */}
            <Link
              href="/school-season"
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
            >
              <span>🎒</span>
              <span>School Season Hub</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full font-bold">
                10% OFF
              </span>
            </Link>

            {/* Track Orders Link */}
            <Link
              href="/track"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition"
            >
              <PackageIcon className="w-4 h-4 text-cyan-400" />
              <span>Track Order</span>
            </Link>

            {/* WhatsApp Quick Chat */}
            <a
              href={whatsappGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
              title="Chat with Zenexis on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span className="hidden xl:inline">0701120945</span>
            </a>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
              aria-label="Notifications"
            >
              <BellIcon className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center animate-bounce">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition group"
            >
              <ShoppingCartIcon className="w-5 h-5 text-slate-950" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-slate-950 text-cyan-400 text-xs flex items-center justify-center font-black">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search computer items, stationery, phones..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-[10px] text-slate-400"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

