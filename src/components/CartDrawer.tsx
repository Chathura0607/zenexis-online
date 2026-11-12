'use client';

import React, { useState, useEffect } from 'react';
import {
  XIcon,
  ShoppingCartIcon,
  Trash2Icon,
  PlusIcon,
  MinusIcon,
  TruckIcon,
  MapPinIcon,
  ArrowRightIcon,
  WhatsAppIcon,
  ShieldCheckIcon,
} from './icons';
import { CartItem, Order, DeliveryMethod, PaymentMethod } from '@/types';
import {
  getStoredCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  createOrder,
  getLoggedInCustomer,
} from '@/lib/storage';
import { SHOP_CONFIG, getProductDisplayImage, getCategoryFallbackImage } from '@/lib/constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('islandwide_delivery');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('Morning (9:00 AM - 12:00 PM)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCart = () => {
    setCartItems(getStoredCart());
  };

  useEffect(() => {
    if (isOpen) {
      loadCart();
      // Auto-fill logged in customer details
      const customer = getLoggedInCustomer();
      if (customer) {
        if (customer.name) setCustomerName(customer.name);
        if (customer.phone) setPhone(customer.phone);
        if (customer.address) setAddress(customer.address);
        if (customer.city) setCity(customer.city);
      }
      // Set default pickup date as today/tomorrow
      const now = new Date();
      setPickupDate(now.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('zenexis_cart_updated', loadCart);
    return () => window.removeEventListener('zenexis_cart_updated', loadCart);
  }, []);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= SHOP_CONFIG.freeDeliveryThreshold;
  const deliveryFee = deliveryMethod === 'store_pickup' ? 0 : isFreeDelivery ? 0 : SHOP_CONFIG.deliveryFee;
  const total = subtotal + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      alert('Please enter your Name and WhatsApp / Phone Number.');
      return;
    }

    if (deliveryMethod === 'islandwide_delivery' && (!address.trim() || !city.trim())) {
      alert('Please enter your Delivery Address and City for Island-wide courier.');
      return;
    }

    setIsSubmitting(true);

    const paymentMethod: PaymentMethod = deliveryMethod === 'store_pickup' ? 'pickup' : 'cod';

    const newOrder = createOrder({
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: deliveryMethod === 'islandwide_delivery' ? address.trim() : undefined,
      city: deliveryMethod === 'islandwide_delivery' ? city.trim() : 'Ambalangoda',
      notes: notes.trim() || undefined,
      items: cartItems,
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      status: 'pending',
      paymentMethod,
      deliveryMethod,
      scheduledPickupDate: deliveryMethod === 'store_pickup' ? pickupDate : undefined,
      scheduledPickupTime: deliveryMethod === 'store_pickup' ? pickupTimeSlot : undefined,
    });

    clearCart();
    setIsSubmitting(false);
    onClose();
    onOrderSuccess(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-colors">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <ShoppingCartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Your Cart</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)} items selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <ShoppingCartIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 opacity-60" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Your shopping cart is empty.</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <>
                {/* Free Delivery Banner */}
                {deliveryMethod === 'islandwide_delivery' && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                    {isFreeDelivery ? (
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span>🎉</span>
                        <span>You unlocked FREE Island-wide delivery!</span>
                      </p>
                    ) : (
                      <div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                          <span>Add Rs. {(SHOP_CONFIG.freeDeliveryThreshold - subtotal).toLocaleString()} for Free Delivery</span>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">
                            {Math.round((subtotal / SHOP_CONFIG.freeDeliveryThreshold) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (subtotal / SHOP_CONFIG.freeDeliveryThreshold) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex gap-3 items-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProductDisplayImage(item.product)}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-100 dark:bg-slate-900 shrink-0 border border-slate-200/60 dark:border-slate-800/60"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCategoryFallbackImage(item.product.category);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">
                          Rs. {item.product.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Total: Rs. {(item.product.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Delivery Method Selector */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Select Delivery / Pickup Method:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('islandwide_delivery')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                        deliveryMethod === 'islandwide_delivery'
                          ? 'bg-cyan-500/10 border-cyan-500 text-slate-900 dark:text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <TruckIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>Island-wide</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Cash on Delivery (COD)</span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                        {isFreeDelivery ? 'Free Delivery' : `+ Rs. ${SHOP_CONFIG.deliveryFee}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('store_pickup')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                        deliveryMethod === 'store_pickup'
                          ? 'bg-cyan-500/10 border-cyan-500 text-slate-900 dark:text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <MapPinIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Store Pickup</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Ambalangoda (Showroom)</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        FREE (0 Delivery Fee)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Customer Checkout Form */}
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300">Customer & Delivery Details:</h4>
                  <div>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Full Name *"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="WhatsApp / Phone Number (e.g. 0701120945) *"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {deliveryMethod === 'islandwide_delivery' ? (
                    <>
                      <div>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Delivery Street Address *"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City / District (e.g. Ambalangoda, Galle, Colombo) *"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
                      <p className="font-semibold">🏪 Pickup Location: {SHOP_CONFIG.pickupLocation}</p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] text-amber-700 dark:text-amber-200 block mb-1">Pickup Date:</label>
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg border border-amber-500/30 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-700 dark:text-amber-200 block mb-1">Time Slot:</label>
                          <select
                            value={pickupTimeSlot}
                            onChange={(e) => setPickupTimeSlot(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg border border-amber-500/30 text-xs"
                          >
                            <option>Morning (9:00 AM - 12:00 PM)</option>
                            <option>Afternoon (1:00 PM - 4:00 PM)</option>
                            <option>Evening (4:30 PM - 8:00 PM)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special instructions or notes (optional)"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer & Order Button */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-white font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-cyan-600 dark:text-cyan-400 text-lg font-black">
                    Rs. {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2 group"
              >
                <span>Confirm Order via WhatsApp</span>
                <WhatsAppIcon className="w-5 h-5 fill-slate-950 group-hover:scale-110 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Secure • Official Zenexis Hotline: {SHOP_CONFIG.phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

