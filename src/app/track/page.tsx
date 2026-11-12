'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  PackageIcon,
  SearchIcon,
  CheckIcon,
  ClockIcon,
  TruckIcon,
  MapPinIcon,
  WhatsAppIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@/components/icons';
import { Order, OrderStatus } from '@/types';
import { getStoredOrders } from '@/lib/storage';
import { SHOP_CONFIG, getProductDisplayImage, getCategoryFallbackImage } from '@/lib/constants';
import { createWhatsAppUrl } from '@/lib/whatsapp';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('order') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  useEffect(() => {
    const orders = getStoredOrders();
    setAllOrders(orders);
    if (initialQuery) {
      const match = orders.find(
        (o) =>
          o.orderNumber.toLowerCase() === initialQuery.toLowerCase() ||
          o.id.toLowerCase() === initialQuery.toLowerCase()
      );
      if (match) {
        setSearchedOrder(match);
        setHasSearched(true);
      }
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const match = allOrders.find(
      (o) =>
        o.orderNumber.toLowerCase() === query ||
        o.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')) ||
        o.id.toLowerCase() === query
    );

    setSearchedOrder(match || null);
    setHasSearched(true);
  };

  const getStepStatus = (
    currentStatus: OrderStatus,
    targetStep: 'placed' | 'approved' | 'processing' | 'ready' | 'completed'
  ) => {
    const stepOrder = ['placed', 'approved', 'processing', 'ready', 'completed'];
    const statusMap: Record<OrderStatus, string> = {
      pending: 'placed',
      approved: 'approved',
      processing: 'processing',
      ready_for_pickup: 'ready',
      out_for_delivery: 'ready',
      completed: 'completed',
      cancelled: 'placed',
    };

    const currentStepIdx = stepOrder.indexOf(statusMap[currentStatus] || 'placed');
    const targetStepIdx = stepOrder.indexOf(targetStep);

    if (currentStatus === 'cancelled') return 'cancelled';
    if (currentStepIdx > targetStepIdx) return 'completed';
    if (currentStepIdx === targetStepIdx) return 'active';
    return 'upcoming';
  };

  const formatStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Order Received (Pending Approval)';
      case 'approved':
        return 'Order Approved & Confirmed';
      case 'processing':
        return 'Packing & Quality Verification';
      case 'ready_for_pickup':
        return 'Ready for Store Pickup in Ambalangoda!';
      case 'out_for_delivery':
        return 'Dispatched with Courier (Island-wide Delivery)';
      case 'completed':
        return 'Order Completed & Handed Over';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-lg">
              Z
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white tracking-tight">ZENEXIS</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 block -mt-1 font-semibold">Order Tracking</span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
          >
            ← Back to Store
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
        {/* Title & Search Bar */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
            <PackageIcon className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Live Order Tracking</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Enter your Order Number (e.g. <strong>ZNX-123456</strong>) or Phone Number to check preparation progress & pickup times.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order # or Phone (e.g. ZNX-123456 / 0701120945)"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
              />
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition shadow-lg shadow-cyan-500/20 shrink-0"
            >
              Track
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchedOrder ? (
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-8 animate-in fade-in transition-colors">
            {/* Order Status Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  Tracking Order
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  #{searchedOrder.orderNumber}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Placed on {new Date(searchedOrder.createdAt).toLocaleDateString()} at{' '}
                  {new Date(searchedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Current Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    searchedOrder.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : searchedOrder.status === 'ready_for_pickup' || searchedOrder.status === 'out_for_delivery'
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 animate-pulse'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{formatStatusLabel(searchedOrder.status)}</span>
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="py-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">
                Fulfillment Timeline
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {/* Step 1 */}
                <div className="flex md:flex-col items-center gap-3 text-left md:text-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      getStepStatus(searchedOrder.status, 'placed') === 'completed' ||
                      getStepStatus(searchedOrder.status, 'placed') === 'active'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <CheckIcon className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">1. Order Placed</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Registered in system</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex md:flex-col items-center gap-3 text-left md:text-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      getStepStatus(searchedOrder.status, 'approved') === 'completed'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : getStepStatus(searchedOrder.status, 'approved') === 'active'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">2. Confirmed</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Inventory reserved</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex md:flex-col items-center gap-3 text-left md:text-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      getStepStatus(searchedOrder.status, 'processing') === 'completed'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : getStepStatus(searchedOrder.status, 'processing') === 'active'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">3. Packing</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Quality check & boxing</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex md:flex-col items-center gap-3 text-left md:text-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      getStepStatus(searchedOrder.status, 'ready') === 'completed'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : getStepStatus(searchedOrder.status, 'ready') === 'active'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    4
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {searchedOrder.deliveryMethod === 'store_pickup' ? '4. Ready for Pickup' : '4. In Transit'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {searchedOrder.deliveryMethod === 'store_pickup' ? 'At Ambalangoda Branch' : 'Island-wide Courier'}
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex md:flex-col items-center gap-3 text-left md:text-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      getStepStatus(searchedOrder.status, 'completed') === 'completed' ||
                      getStepStatus(searchedOrder.status, 'completed') === 'active'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    5
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">5. Completed</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Handed over</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collection / Delivery Details Callout */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
                {searchedOrder.deliveryMethod === 'store_pickup' ? (
                  <>
                    <MapPinIcon className="w-4 h-4 text-amber-500" />
                    <span>In-Store Pickup Details</span>
                  </>
                ) : (
                  <>
                    <TruckIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Courier Delivery Details</span>
                  </>
                )}
              </div>

              {searchedOrder.deliveryMethod === 'store_pickup' ? (
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <p>
                    <strong>Location:</strong> Zenexis Showroom - Ambalangoda (Near Bus Stand)
                  </p>
                  <p>
                    <strong>Scheduled Pickup Date:</strong> {searchedOrder.scheduledPickupDate || 'Today'}
                  </p>
                  <p>
                    <strong>Time Slot:</strong> {searchedOrder.scheduledPickupTime || 'During shop hours (8:00 AM - 8:30 PM)'}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                    ✓ Walk in directly to the counter with your Order # to collect without waiting in line!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <p>
                    <strong>Recipient:</strong> {searchedOrder.customerName} ({searchedOrder.phone})
                  </p>
                  <p>
                    <strong>Delivery Address:</strong> {searchedOrder.address}, {searchedOrder.city}
                  </p>
                  <p>
                    <strong>Payment:</strong> Cash on Delivery (COD) - Pay Rs. {searchedOrder.total.toLocaleString()} to the courier rider.
                  </p>
                </div>
              )}
            </div>

            {/* Items Summary Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Order Items ({searchedOrder.items.reduce((s, i) => s + i.quantity, 0)})
              </h3>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProductDisplayImage(item.product)}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCategoryFallbackImage(item.product.category);
                        }}
                      />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{item.product.name}</h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Qty: {item.quantity} x Rs. {item.product.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">
                      Rs. {(item.quantity * item.product.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-white font-medium">Rs. {searchedOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="text-slate-900 dark:text-white font-medium">{searchedOrder.deliveryFee === 0 ? 'FREE' : `Rs. ${searchedOrder.deliveryFee.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Amount Due</span>
                  <span className="text-cyan-600 dark:text-cyan-400 text-base">
                    Rs. {searchedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* WhatsApp Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <a
                href={createWhatsAppUrl(
                  SHOP_CONFIG.whatsappNumber,
                  `Hello Zenexis! Checking on my order #${searchedOrder.orderNumber} for ${searchedOrder.customerName}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Ask Update on WhatsApp (0701120945)</span>
              </a>

              <Link
                href="/"
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                Back to Shopping →
              </Link>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <PackageIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 opacity-60" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Order Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find an order matching &ldquo;{searchQuery}&rdquo;. Please verify your Order ID or WhatsApp phone number.
            </p>
            <a
              href={createWhatsAppUrl(
                SHOP_CONFIG.whatsappNumber,
                `Hello Zenexis! I need help finding my order details. My phone is: ${searchQuery}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/30"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-500" />
              <span>Contact Store on WhatsApp</span>
            </a>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white flex items-center justify-center">Loading tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}

