'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  PackageIcon,
  BookOpenIcon,
  WhatsAppIcon,
} from './icons';
import { getStoredCart } from '@/lib/storage';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import { SHOP_CONFIG } from '@/lib/constants';

interface MobileBottomNavProps {
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenCart }) => {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  const updateCart = () => {
    const cart = getStoredCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };

  useEffect(() => {
    updateCart();
    window.addEventListener('zenexis_cart_updated', updateCart);
    return () => window.removeEventListener('zenexis_cart_updated', updateCart);
  }, []);

  const whatsappUrl = createWhatsAppUrl(
    SHOP_CONFIG.whatsappNumber,
    'Hello Zenexis! I would like to place an order or ask a question.'
  );

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 px-2 py-2 safe-area-bottom shadow-lg transition-colors">
      <div className="grid grid-cols-5 items-center text-center">
        {/* Home / Shop */}
        <Link
          href="/"
          className={`flex flex-col items-center py-1 transition ${
            pathname === '/' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingBagIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Shop</span>
        </Link>

        {/* School Season Special Hub */}
        <Link
          href="/school-season"
          className={`flex flex-col items-center py-1 relative transition ${
            pathname === '/school-season' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <BookOpenIcon className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <span className="text-[10px]">School</span>
        </Link>

        {/* Quick WhatsApp Action (Center Highlight) */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center -mt-4 group"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white transition transform active:scale-95">
            <WhatsAppIcon className="w-6 h-6 fill-white" />
          </div>
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Chat</span>
        </a>

        {/* Track Orders */}
        <Link
          href="/track"
          className={`flex flex-col items-center py-1 transition ${
            pathname === '/track' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <PackageIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Track</span>
        </Link>

        {/* Cart Button */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 relative transition"
        >
          <div className="relative">
            <ShoppingCartIcon className="w-5 h-5 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cart</span>
        </button>
      </div>
    </nav>
  );
};

