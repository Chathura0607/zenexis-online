'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCartIcon,
  SearchIcon,
  BellIcon,
  WhatsAppIcon,
  PackageIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
} from './icons';
import { SHOP_CONFIG } from '@/lib/constants';
import {
  getStoredCart,
  getStoredNotifications,
  getLoggedInCustomer,
  getSavedTheme,
  saveTheme,
} from '@/lib/storage';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import { CustomerProfile } from '@/types';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory?: string;
  setActiveCategory?: (cat: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenNotifications,
  onOpenAuth,
  onOpenProfile,
  searchQuery,
  setSearchQuery,
}) => {
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const updateState = () => {
    const cart = getStoredCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));

    const notifs = getStoredNotifications();
    setUnreadNotifs(notifs.filter((n) => !n.read).length);

    setCustomer(getLoggedInCustomer());
    setTheme(getSavedTheme());
  };

  useEffect(() => {
    updateState();
    window.addEventListener('zenexis_cart_updated', updateState);
    window.addEventListener('zenexis_notifs_updated', updateState);
    window.addEventListener('zenexis_customer_updated', updateState);
    window.addEventListener('zenexis_theme_updated', updateState);
    return () => {
      window.removeEventListener('zenexis_cart_updated', updateState);
      window.removeEventListener('zenexis_notifs_updated', updateState);
      window.removeEventListener('zenexis_customer_updated', updateState);
      window.removeEventListener('zenexis_theme_updated', updateState);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    saveTheme(next);
  };

  const whatsappGeneralUrl = createWhatsAppUrl(
    SHOP_CONFIG.whatsappNumber,
    'Hello Zenexis (Ambalangoda)! I would like to inquire about your products.'
  );

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800/80 transition-colors shadow-sm">
      {/* Top Promotional Announcement Banner */}
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
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  ZENEXIS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  Online
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden xs:block truncate">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition shadow-inner"
              />
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* School Season Special Link */}
            <Link
              href="/school-season"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
            >
              <span>🎒</span>
              <span>School Season</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full font-bold">
                10% OFF
              </span>
            </Link>

            {/* Track Orders Link */}
            <Link
              href="/track"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-xs font-medium transition"
            >
              <PackageIcon className="w-4 h-4 text-cyan-500" />
              <span>Track</span>
            </Link>

            {/* WhatsApp Quick Chat */}
            <a
              href={whatsappGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
              title="Chat with Zenexis on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-emerald-500 dark:fill-emerald-400" />
              <span className="hidden xl:inline">0701120945</span>
            </a>

            {/* Theme Toggle Button (Dark / Light Mode) */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition"
              title={`Switch to ${theme === 'dark' ? 'Light (Normal)' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <MoonIcon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition"
              aria-label="Notifications"
            >
              <BellIcon className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] flex items-center justify-center animate-bounce">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Customer Account Button */}
            {customer ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-600 dark:text-cyan-400 transition"
                title="View My Profile & Orders"
              >
                {customer.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="w-6 h-6 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-[11px]">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[80px] truncate">{customer.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold transition"
                title="Sign In / Register"
              >
                <UserIcon className="w-4 h-4 text-cyan-500" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-cyan-500/20 transition group"
            >
              <ShoppingCartIcon className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-950 text-cyan-400 text-[10px] flex items-center justify-center font-black">
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
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
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
