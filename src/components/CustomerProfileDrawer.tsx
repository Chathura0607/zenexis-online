'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  XIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  PackageIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  DownloadIcon,
} from './icons';
import { CustomerProfile, Order } from '@/types';
import { customerLogout, getStoredOrders, getSavedTheme, saveTheme } from '@/lib/storage';

interface CustomerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerProfile | null;
  onOpenTrack?: () => void;
}

export const CustomerProfileDrawer: React.FC<CustomerProfileDrawerProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setTheme(getSavedTheme());
    const handleThemeUpdate = () => setTheme(getSavedTheme());
    window.addEventListener('zenexis_theme_updated', handleThemeUpdate);
    return () => window.removeEventListener('zenexis_theme_updated', handleThemeUpdate);
  }, []);

  useEffect(() => {
    if (customer) {
      const orders = getStoredOrders();
      // Match orders by customer name or phone
      const myOrders = orders.filter(
        (o) =>
          o.phone === customer.phone ||
          (o.customerName && o.customerName.toLowerCase() === customer.name.toLowerCase())
      );
      setCustomerOrders(myOrders);
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    saveTheme(next);
  };

  const handleLogout = () => {
    customerLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                {customer.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-cyan-500 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-md">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {customer.name}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {customer.email || customer.phone}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Theme Toggle Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  {theme === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Appearance</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Currently: {theme === 'dark' ? 'Dark Mode' : 'Light (Normal) Mode'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 transition flex items-center gap-1.5"
              >
                <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            {/* Install Zenexis App Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <DownloadIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Install Zenexis App</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    1-Tap fast access on your phone or PC
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('zenexis_open_install_prompt'));
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition flex items-center gap-1 shadow-sm"
              >
                <span>Install</span>
              </button>
            </div>

            {/* Saved Delivery Address */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <MapPinIcon className="w-4 h-4 text-cyan-500" />
                  Default Delivery Location
                </span>
                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                  Auto-fills at checkout
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {customer.address || 'Ambalangoda City Area'}
              </p>
              <p className="text-[11px] text-slate-400">
                City: {customer.city || 'Ambalangoda'}, Sri Lanka
              </p>
            </div>

            {/* My Orders History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <PackageIcon className="w-4 h-4 text-cyan-500" />
                  My Order History ({customerOrders.length})
                </h4>
                <Link
                  href="/track"
                  onClick={onClose}
                  className="text-xs text-cyan-500 font-bold hover:underline"
                >
                  Live Tracker ➔
                </Link>
              </div>

              {customerOrders.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <PackageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-50" />
                  No online orders placed yet. Add items to your cart to get started!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs space-y-2 hover:border-cyan-500/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          #{order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 capitalize">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.items.map((it) => `${it.product.name} (x${it.quantity})`).join(', ')}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-white">
                          Rs. {order.total.toLocaleString()}
                        </span>
                        <Link
                          href={`/track?order=${order.orderNumber}`}
                          onClick={onClose}
                          className="text-cyan-500 hover:text-cyan-400"
                        >
                          View Status ➔
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer / Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Signed In safely</span>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition"
              >
                Sign Out
              </button>
            </div>

            {/* Staff / Admin Direct Access */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 text-center">
              <Link
                href="/admin"
                onClick={onClose}
                className="text-[11px] text-slate-500 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400 font-medium inline-flex items-center gap-1 transition"
              >
                <span>⚙️ Staff Management Portal (Admin)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

