'use client';

import React, { useState } from 'react';
import { XIcon, GoogleIcon, UserIcon, ShieldCheckIcon, PhoneIcon } from './icons';
import { CustomerProfile } from '@/types';
import { saveLoggedInCustomer, addNotification } from '@/lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: CustomerProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Ambalangoda');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');

    setTimeout(() => {
      const googleCustomer: CustomerProfile = {
        id: `cust-g-${Date.now()}`,
        name: 'Chathura (Google User)',
        email: 'chathura0607@gmail.com',
        phone: '0701120945',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        authProvider: 'google',
        city: 'Ambalangoda',
        address: 'Main Street, Ambalangoda',
        createdAt: new Date().toISOString(),
      };

      saveLoggedInCustomer(googleCustomer);
      addNotification({
        id: `notif-${Date.now()}`,
        title: '🎉 Welcome to Zenexis Online!',
        message: `Signed in as ${googleCustomer.name}. Your delivery addresses and orders will sync automatically!`,
        type: 'order',
        date: 'Just Now',
        read: false,
      });

      setLoading(false);
      if (onSuccess) onSuccess(googleCustomer);
      onClose();
    }, 700);
  };

  const handlePasswordAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (activeTab === 'signin') {
      if (!emailOrPhone.trim() || !password.trim()) {
        setError('Please enter your email/phone and password');
        setLoading(false);
        return;
      }

      setTimeout(() => {
        const customer: CustomerProfile = {
          id: `cust-${Date.now()}`,
          name: emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : 'Valued Customer',
          email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
          phone: !emailOrPhone.includes('@') ? emailOrPhone : '0701120945',
          authProvider: 'password',
          city: 'Ambalangoda',
          address: 'Ambalangoda Town',
          createdAt: new Date().toISOString(),
        };

        saveLoggedInCustomer(customer);
        addNotification({
          id: `notif-${Date.now()}`,
          title: `👋 Welcome back, ${customer.name}!`,
          message: 'You have signed in to Zenexis Online store.',
          type: 'order',
          date: 'Just Now',
          read: false,
        });

        setLoading(false);
        if (onSuccess) onSuccess(customer);
        onClose();
      }, 500);
    } else {
      if (!name.trim() || !phone.trim() || !password.trim()) {
        setError('Please enter your name, phone number, and password');
        setLoading(false);
        return;
      }

      setTimeout(() => {
        const newCustomer: CustomerProfile = {
          id: `cust-${Date.now()}`,
          name: name.trim(),
          phone: phone.trim(),
          email: emailOrPhone.includes('@') ? emailOrPhone.trim() : undefined,
          address: address.trim(),
          city: city.trim(),
          authProvider: 'password',
          createdAt: new Date().toISOString(),
        };

        saveLoggedInCustomer(newCustomer);
        addNotification({
          id: `notif-${Date.now()}`,
          title: '🎉 Account Created Successfully!',
          message: `Welcome ${newCustomer.name} to Zenexis Online. Start placing orders with rapid COD & in-store pickup!`,
          type: 'order',
          date: 'Just Now',
          read: false,
        });

        setLoading(false);
        if (onSuccess) onSuccess(newCustomer);
        onClose();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden transition-colors">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black text-2xl shadow-lg shadow-cyan-500/25 mb-3">
            Z
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {activeTab === 'signin' ? 'Sign In to Zenexis' : 'Create Customer Account'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access order tracking, saved addresses, and faster 1-tap checkout.
          </p>
        </div>

        {/* 1-Click Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center justify-center gap-3 transition shadow-sm mb-4"
        >
          <GoogleIcon className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or with credentials</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl mb-5">
          <button
            onClick={() => { setActiveTab('signin'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handlePasswordAuth} className="space-y-3.5">
          {activeTab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Perera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              {activeTab === 'signin' ? 'Email or Mobile Number' : 'Phone Number (for WhatsApp Orders) *'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={activeTab === 'signin' ? '0701120945 or user@gmail.com' : '0701120945'}
                value={activeTab === 'signin' ? emailOrPhone : phone}
                onChange={(e) => (activeTab === 'signin' ? setEmailOrPhone(e.target.value) : setPhone(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
              />
              <PhoneIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {activeTab === 'register' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  placeholder="Ambalangoda"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Street / Home"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : activeTab === 'signin' ? 'Sign In' : 'Create My Account'}
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>SSL Secured • Fast WhatsApp Order Sync</span>
        </div>
      </div>
    </div>
  );
};
